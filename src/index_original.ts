#!/usr/bin/env node

/**
 * Draw.io Diagram Generator MCP Server
 *
 * This MCP server generates draw.io/diagrams.net XML files programmatically.
 * It creates valid mxGraphModel XML that can be opened directly in draw.io.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import * as pako from "pako";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { exec, spawn } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// ============================================================================
// Types and Schemas
// ============================================================================

const DiagramTypeSchema = z.enum([
  "flowchart",
  "sequence",
  "class",
  "er",
  "network",
  "infrastructure",
  "custom"
]);

const ShapeTypeSchema = z.enum([
  "rectangle",
  "rounded",
  "ellipse",
  "rhombus",
  "hexagon",
  "cylinder",
  "cloud",
  "actor",
  "note",
  "swimlane"
]);

const ConnectorStyleSchema = z.enum([
  "straight",
  "orthogonal",
  "curved",
  "dashed",
  "dotted"
]);

// Input schemas
const CreateDiagramSchema = z.object({
  title: z.string().describe("Title/name for the diagram"),
  description: z.string().describe("Text description of what to diagram"),
  diagram_type: DiagramTypeSchema.describe("Type of diagram to create"),
  output_format: z.enum(["uncompressed", "compressed"]).default("uncompressed")
    .describe("Whether to compress the XML output"),
  page_width: z.number().default(1100).describe("Page width in pixels"),
  page_height: z.number().default(850).describe("Page height in pixels"),
});

const AddShapeSchema = z.object({
  xml: z.string().describe("Existing diagram XML to add shape to"),
  shape_type: ShapeTypeSchema.describe("Type of shape to add"),
  text: z.string().describe("Text content for the shape"),
  x: z.number().describe("X coordinate position"),
  y: z.number().describe("Y coordinate position"),
  width: z.number().describe("Width of the shape"),
  height: z.number().describe("Height of the shape"),
  fill_color: z.string().default("#ffffff").describe("Fill color (hex)"),
  stroke_color: z.string().default("#000000").describe("Stroke color (hex)"),
});

const AddConnectionSchema = z.object({
  xml: z.string().describe("Existing diagram XML to add connection to"),
  source_id: z.string().describe("ID of source shape"),
  target_id: z.string().describe("ID of target shape"),
  label: z.string().optional().describe("Optional label for the connection"),
  style: ConnectorStyleSchema.default("orthogonal").describe("Connection line style"),
  arrow_end: z.boolean().default(true).describe("Show arrow at end"),
  arrow_start: z.boolean().default(false).describe("Show arrow at start"),
});

const CreateFlowchartSchema = z.object({
  title: z.string().describe("Flowchart title"),
  steps: z.array(z.object({
    id: z.string().describe("Unique identifier for this step"),
    type: z.enum(["start", "end", "process", "decision", "input", "output"])
      .describe("Type of flowchart element"),
    text: z.string().describe("Text content for the element"),
    next: z.array(z.string()).optional().describe("IDs of next steps (for decision nodes, provide multiple)"),
    decision_labels: z.array(z.string()).optional().describe("Labels for decision branches (e.g., ['Yes', 'No'])"),
  })).describe("Ordered list of flowchart steps"),
  output_format: z.enum(["uncompressed", "compressed"]).default("uncompressed"),
});

const SaveDiagramSchema = z.object({
  xml: z.string().describe("Complete diagram XML to save"),
  title: z.string().describe("Title for the diagram (used in filename)"),
});

// ============================================================================
// File System and Application Utilities
// ============================================================================

/**
 * Get the user's Downloads directory
 */
function getDownloadsDirectory(): string {
  const homeDir = os.homedir();
  const platform = os.platform();

  switch (platform) {
    case "win32":
      return path.join(homeDir, "Downloads");
    case "darwin":
      return path.join(homeDir, "Downloads");
    case "linux":
      return path.join(homeDir, "Downloads");
    default:
      return path.join(homeDir, "Downloads");
  }
}

/**
 * Save diagram XML to temp folder for opening in app
 */
function saveDiagramToTemp(xml: string, title: string): string {
  const tempDir = os.tmpdir();
  const sanitizedTitle = title.replace(/[^a-z0-9]/gi, "_").toLowerCase();
  const timestamp = Date.now();
  const filename = `${sanitizedTitle}_${timestamp}.drawio`;
  const filePath = path.join(tempDir, filename);

  fs.writeFileSync(filePath, xml, "utf8");

  return filePath;
}

/**
 * Save diagram XML to Downloads folder (optional, for when user wants to keep it)
 */
function saveDiagramToDownloads(xml: string, title: string): string {
  const downloadsDir = getDownloadsDirectory();

  // Ensure Downloads directory exists
  if (!fs.existsSync(downloadsDir)) {
    fs.mkdirSync(downloadsDir, { recursive: true });
  }

  // Sanitize filename
  const sanitizedTitle = title.replace(/[^a-z0-9]/gi, "_").toLowerCase();
  const timestamp = Date.now();
  const filename = `${sanitizedTitle}_${timestamp}.drawio`;
  const filePath = path.join(downloadsDir, filename);

  // Write file
  fs.writeFileSync(filePath, xml, "utf8");

  return filePath;
}

/**
 * Detect draw.io installation paths by platform
 */
async function findDrawioPath(): Promise<string | null> {
  const platform = os.platform();

  try {
    switch (platform) {
      case "win32": {
        // Common Windows installation paths
        const paths = [
          path.join(process.env.LOCALAPPDATA || "", "Programs", "draw.io", "draw.io.exe"),
          path.join(process.env.PROGRAMFILES || "", "draw.io", "draw.io.exe"),
          path.join(process.env["PROGRAMFILES(X86)"] || "", "draw.io", "draw.io.exe"),
        ];

        for (const p of paths) {
          if (fs.existsSync(p)) {
            return p;
          }
        }

        // Check for Chrome PWA installation
        const chromePaths = [
          path.join(process.env.PROGRAMFILES || "", "Google", "Chrome", "Application", "chrome.exe"),
          path.join(process.env["PROGRAMFILES(X86)"] || "", "Google", "Chrome", "Application", "chrome.exe"),
          path.join(process.env.LOCALAPPDATA || "", "Google", "Chrome", "Application", "chrome.exe"),
        ];

        for (const chromePath of chromePaths) {
          if (fs.existsSync(chromePath)) {
            return chromePath; // Return chrome.exe path for PWA
          }
        }

        // Try to find in registry or PATH
        try {
          await execAsync("where drawio");
          return "drawio";
        } catch {
          // Not found in PATH
        }
        break;
      }

      case "darwin": {
        // macOS - check Applications folder
        const appPath = "/Applications/draw.io.app";
        if (fs.existsSync(appPath)) {
          return "open"; // Use 'open' command with -a flag
        }
        break;
      }

      case "linux": {
        // Linux - check common installation locations
        const paths = [
          "/usr/bin/drawio",
          "/usr/local/bin/drawio",
          "/opt/drawio/drawio",
        ];

        for (const p of paths) {
          if (fs.existsSync(p)) {
            return p;
          }
        }

        // Try to find in PATH
        try {
          await execAsync("which drawio");
          return "drawio";
        } catch {
          // Not found
        }
        break;
      }
    }
  } catch (error) {
    console.error("Error finding draw.io:", error);
  }

  return null;
}

/**
 * Launch draw.io with the specified file
 */
async function openInDrawio(filePath: string): Promise<boolean> {
  const platform = os.platform();
  const drawioPath = await findDrawioPath();

  try {
    if (drawioPath) {
      switch (platform) {
        case "darwin":
          // macOS - use 'open' command
          spawn("open", ["-a", "draw.io", filePath], { detached: true, stdio: "ignore" });
          return true;

        case "win32":
          // Windows
          if (drawioPath === "drawio") {
            spawn("drawio", [filePath], { detached: true, stdio: "ignore" });
          } else if (drawioPath.includes("chrome.exe")) {
            // Chrome PWA - use app-id to open draw.io
            // Common draw.io Chrome app IDs:
            // - aapocclcgogkmnckokdopfmhonfmgoek (official draw.io)
            // - ilmgmogedobmcfegdjcibiiaodmdenpf (alternative)
            const appIds = ["aapocclcgogkmnckokdopfmhonfmgoek", "ilmgmogedobmcfegdjcibiiaodmdenpf"];

            // Try to open with the first app ID that might be installed
            // Chrome will handle opening the file with the PWA
            spawn(drawioPath, [`--app-id=${appIds[0]}`, filePath], {
              detached: true,
              stdio: "ignore",
              shell: true,
            });
          } else {
            spawn(drawioPath, [filePath], { detached: true, stdio: "ignore" });
          }
          return true;

        case "linux":
          // Linux
          spawn(drawioPath, [filePath], { detached: true, stdio: "ignore" });
          return true;
      }
    }
  } catch (error) {
    console.error("Error opening draw.io:", error);
  }

  return false;
}

/**
 * Create a diagrams.net URL with embedded diagram data
 * This can be used in artifacts or opened in browser
 */
function createDiagramsNetUrl(xml: string): string {
  // Encode the XML for URL
  const encodedXml = encodeURIComponent(xml);
  return `https://app.diagrams.net/#R${encodedXml}`;
}

// ============================================================================
// Draw.io XML Generation
// ============================================================================

class DrawioGenerator {
  private cellIdCounter = 2; // IDs 0 and 1 are reserved for root cells

  /**
   * Generates a unique cell ID
   */
  private generateId(): string {
    return `cell-${this.cellIdCounter++}`;
  }

  /**
   * Creates a basic mxGraphModel structure
   */
  createBaseModel(pageWidth = 1100, pageHeight = 850): string {
    return `<mxGraphModel dx="1394" dy="747" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="${pageWidth}" pageHeight="${pageHeight}" math="0" shadow="0">
  <root>
    <mxCell id="0"/>
    <mxCell id="1" parent="0"/>
  </root>
</mxGraphModel>`;
  }

  /**
   * Wraps mxGraphModel in mxfile structure
   */
  wrapInMxFile(graphModel: string, title = "Diagram", compressed = false): string {
    const content = compressed ? this.compressXml(graphModel) : graphModel;
    const timestamp = new Date().toISOString();
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="app.diagrams.net" modified="${timestamp}" agent="MCP Draw.io Generator" version="24.0.0" type="device">
  <diagram name="${this.escapeXml(title)}" id="diagram-1">
    ${content}
  </diagram>
</mxfile>`;
  }

  /**
   * Compresses XML using deflate (for draw.io compressed format)
   */
  private compressXml(xml: string): string {
    const compressed = pako.deflate(xml, { level: 9 });
    const base64 = Buffer.from(compressed).toString('base64');
    return base64;
  }

  /**
   * Escapes XML special characters
   */
  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Adds a shape to existing diagram XML
   * Returns a tuple of [updatedXml, generatedId]
   */
  addShape(
    xml: string,
    shapeType: string,
    text: string,
    x: number,
    y: number,
    width: number,
    height: number,
    fillColor: string,
    strokeColor: string
  ): { xml: string; id: string } {
    const id = this.generateId();
    const style = this.getShapeStyle(shapeType, fillColor, strokeColor);

    const cellXml = `    <mxCell id="${id}" value="${this.escapeXml(text)}" style="${style}" vertex="1" parent="1">
      <mxGeometry x="${x}" y="${y}" width="${width}" height="${height}" as="geometry"/>
    </mxCell>`;

    // Insert before closing </root> tag
    const updatedXml = xml.replace('</root>', `${cellXml}\n  </root>`);
    return { xml: updatedXml, id };
  }

  /**
   * Gets the style string for a shape type
   */
  private getShapeStyle(shapeType: string, fillColor: string, strokeColor: string): string {
    const baseStyle = `fillColor=${fillColor};strokeColor=${strokeColor};`;
    
    const shapeStyles: Record<string, string> = {
      rectangle: `${baseStyle}whiteSpace=wrap;html=1;`,
      rounded: `${baseStyle}rounded=1;whiteSpace=wrap;html=1;`,
      ellipse: `${baseStyle}ellipse;whiteSpace=wrap;html=1;`,
      rhombus: `${baseStyle}rhombus;whiteSpace=wrap;html=1;`,
      hexagon: `${baseStyle}shape=hexagon;perimeter=hexagonPerimeter2;whiteSpace=wrap;html=1;`,
      cylinder: `${baseStyle}shape=cylinder;whiteSpace=wrap;html=1;`,
      cloud: `${baseStyle}ellipse;shape=cloud;whiteSpace=wrap;html=1;`,
      actor: `${baseStyle}shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;`,
      note: `${baseStyle}shape=note;whiteSpace=wrap;html=1;size=20;`,
      swimlane: `${baseStyle}swimlane;whiteSpace=wrap;html=1;startSize=23;`,
    };
    
    return shapeStyles[shapeType] || shapeStyles.rectangle;
  }

  /**
   * Adds a connection between two shapes
   */
  addConnection(
    xml: string,
    sourceId: string,
    targetId: string,
    label: string | undefined,
    style: string,
    arrowEnd: boolean,
    arrowStart: boolean
  ): string {
    const id = this.generateId();
    const edgeStyle = this.getConnectionStyle(style, arrowEnd, arrowStart);
    const labelAttr = label ? ` value="${this.escapeXml(label)}"` : '';
    
    const cellXml = `    <mxCell id="${id}"${labelAttr} style="${edgeStyle}" edge="1" parent="1" source="${sourceId}" target="${targetId}">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>`;

    return xml.replace('</root>', `${cellXml}\n  </root>`);
  }

  /**
   * Gets the style string for a connection
   */
  private getConnectionStyle(style: string, arrowEnd: boolean, arrowStart: boolean): string {
    const edgeStyles: Record<string, string> = {
      straight: 'edgeStyle=none;',
      orthogonal: 'edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;',
      curved: 'edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;',
      dashed: 'edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;dashed=1;',
      dotted: 'edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;dashed=1;dashPattern=1 4;',
    };
    
    let baseStyle = edgeStyles[style] || edgeStyles.orthogonal;
    
    if (arrowEnd) {
      baseStyle += 'endArrow=classic;endFill=1;';
    } else {
      baseStyle += 'endArrow=none;';
    }
    
    if (arrowStart) {
      baseStyle += 'startArrow=classic;startFill=1;';
    }
    
    return baseStyle;
  }

  /**
   * Creates a complete flowchart from step definitions
   */
  createFlowchart(
    title: string,
    steps: Array<{
      id: string;
      type: string;
      text: string;
      next?: string[];
      decision_labels?: string[];
    }>,
    compressed = false
  ): string {
    let xml = this.createBaseModel(1400, 1200); // Larger canvas for branches

    // Shape dimensions and positioning
    const centerX = 700;
    const startY = 80;
    const verticalSpacing = 140;
    const horizontalSpacing = 280;

    // Map to store shape IDs and positions
    const shapeIds: Record<string, string> = {};
    const shapePositions: Record<string, { x: number; y: number }> = {};

    // Simple layout: position each step vertically in order
    steps.forEach((step, index) => {
      shapePositions[step.id] = {
        x: centerX,
        y: startY + (index * verticalSpacing)
      };
    });

    // Adjust horizontal positions for decision branches
    steps.forEach((step, stepIndex) => {
      if (step.type === 'decision' && step.next && step.next.length > 1) {
        const branchCount = step.next.length;

        // Spread branches horizontally
        step.next.forEach((nextId, branchIndex) => {
          const targetPos = shapePositions[nextId];
          if (targetPos) {
            // Position branches left and right of center
            if (branchCount === 2) {
              // For binary decisions: left = no (0), right = yes (1)
              targetPos.x = centerX + ((branchIndex === 0) ? -horizontalSpacing : horizontalSpacing);
            } else {
              // For multi-way branches: spread evenly
              const totalWidth = (branchCount - 1) * horizontalSpacing;
              const startOffset = -totalWidth / 2;
              targetPos.x = centerX + startOffset + (branchIndex * horizontalSpacing);
            }
          }
        });
      }
    });

    // Add shapes with calculated positions
    steps.forEach((step) => {
      const pos = shapePositions[step.id] || { x: centerX, y: startY };
      let shapeType: string;
      let width: number;
      let height: number;
      let fillColor: string;

      switch (step.type) {
        case 'start':
        case 'end':
          shapeType = 'ellipse';
          width = 120;
          height = 60;
          fillColor = '#d5e8d4';
          break;
        case 'decision':
          shapeType = 'rhombus';
          width = 140;
          height = 90;
          fillColor = '#fff2cc';
          break;
        case 'input':
        case 'output':
          shapeType = 'rounded';
          width = 140;
          height = 60;
          fillColor = '#dae8fc';
          break;
        default: // process
          shapeType = 'rectangle';
          width = 140;
          height = 60;
          fillColor = '#ffffff';
      }

      const result = this.addShape(
        xml,
        shapeType,
        step.text,
        pos.x,
        pos.y,
        width,
        height,
        fillColor,
        '#000000'
      );
      xml = result.xml;
      shapeIds[step.id] = result.id;
    });
    
    // Add connections
    steps.forEach((step) => {
      if (step.next && step.next.length > 0) {
        const sourceId = shapeIds[step.id];
        
        step.next.forEach((nextId, branchIndex) => {
          const targetId = shapeIds[nextId];
          if (targetId) {
            const label = step.decision_labels?.[branchIndex];
            xml = this.addConnection(
              xml,
              sourceId,
              targetId,
              label,
              'orthogonal',
              true,
              false
            );
          }
        });
      }
    });
    
    return this.wrapInMxFile(xml, title, compressed);
  }

  /**
   * Extracts cell IDs from existing diagram XML for reference
   */
  extractCellIds(xml: string): string[] {
    const idMatches = xml.match(/id="([^"]+)"/g);
    if (!idMatches) return [];
    
    return idMatches
      .map(match => match.replace('id="', '').replace('"', ''))
      .filter(id => id !== '0' && id !== '1'); // Exclude root cells
  }
}

// ============================================================================
// Resource Management
// ============================================================================

interface DiagramResource {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
  content: string;
  filePath: string;
}

// Store generated diagrams as resources
const diagramResources: Map<string, DiagramResource> = new Map();

function addDiagramResource(title: string, xml: string, filePath: string): string {
  const uri = `diagram:///${title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_${Date.now()}`;

  diagramResources.set(uri, {
    uri,
    name: `${title}.drawio`,
    description: `Draw.io diagram: ${title}`,
    mimeType: "application/vnd.jgraph.mxfile",
    content: xml,
    filePath,
  });

  return uri;
}

// ============================================================================
// MCP Server
// ============================================================================

const generator = new DrawioGenerator();

const server = new Server(
  {
    name: "drawio-diagram-generator",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

/**
 * Tool definitions
 */
const tools: Tool[] = [
  {
    name: "create_diagram",
    description: `Creates an EMPTY base canvas for draw.io.

⚠️ IMPORTANT: This tool only creates a blank canvas. For flowcharts and workflows, use 'create_flowchart' instead!

This tool is only useful when you need to:
- Create a custom diagram where you'll manually add each shape using 'add_shape'
- Build non-flowchart diagrams like network topologies or architecture diagrams

For flowcharts, decision trees, or any process flows: Use 'create_flowchart' which creates complete diagrams with proper connections and branching.`,
    inputSchema: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "Title/name for the diagram"
        },
        description: {
          type: "string",
          description: "Detailed text description of what to diagram. Be specific about components, relationships, and layout."
        },
        diagram_type: {
          type: "string",
          enum: ["flowchart", "sequence", "class", "er", "network", "infrastructure", "custom"],
          description: "Type of diagram to create"
        },
        output_format: {
          type: "string",
          enum: ["uncompressed", "compressed"],
          default: "uncompressed",
          description: "XML output format - uncompressed for readability, compressed for smaller files"
        },
        page_width: {
          type: "number",
          default: 1100,
          description: "Canvas width in pixels"
        },
        page_height: {
          type: "number",
          default: 850,
          description: "Canvas height in pixels"
        }
      },
      required: ["title", "description", "diagram_type"]
    }
  },
  {
    name: "create_flowchart",
    description: `✅ RECOMMENDED: Create a complete flowchart with proper connections and decision branching.

This tool generates a fully connected flowchart in ONE operation, including:
- ✅ All shapes created at once
- ✅ All connections/arrows automatically added
- ✅ Decision branches with horizontal spacing (Yes/No paths branch left/right)
- ✅ Proper color-coding (green=start/end, yellow=decisions, blue=input/output, white=process)
- ✅ Opens in browser AND saves to Downloads

Perfect for:
- Process workflows and business processes
- Algorithm visualization (if/else, loops)
- Decision trees
- User flows and state machines

IMPORTANT: Define ALL steps upfront with their connections. The tool creates the complete diagram in one go.`,
    inputSchema: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "Flowchart title"
        },
        steps: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: {
                type: "string",
                description: "Unique identifier for this step (e.g., 'start', 'check_auth', 'end')"
              },
              type: {
                type: "string",
                enum: ["start", "end", "process", "decision", "input", "output"],
                description: "Type of flowchart element"
              },
              text: {
                type: "string",
                description: "Text content for the element"
              },
              next: {
                type: "array",
                items: { type: "string" },
                description: "IDs of next steps. For decision nodes, provide multiple."
              },
              decision_labels: {
                type: "array",
                items: { type: "string" },
                description: "Labels for decision branches (e.g., ['Yes', 'No'])"
              }
            },
            required: ["id", "type", "text"]
          },
          description: "Ordered list of flowchart steps"
        },
        output_format: {
          type: "string",
          enum: ["uncompressed", "compressed"],
          default: "uncompressed"
        }
      },
      required: ["title", "steps"]
    }
  },
  {
    name: "add_shape",
    description: `⚠️ For INCREMENTAL building only. Adds ONE shape to an existing diagram.

WARNING: This tool adds shapes one-at-a-time. For flowcharts, use 'create_flowchart' instead!

Use this ONLY when:
- Building a custom non-flowchart diagram step-by-step
- You need precise control over exact positions
- You're extending an existing diagram

Shape types:
- rectangle, rounded, ellipse, rhombus, hexagon
- cylinder (databases), cloud (cloud services)
- actor (UML figures), note (annotations), swimlane (grouping)

Returns: Modified XML with the new shape (includes shape ID for connecting later)
Note: Does NOT open draw.io until you're done adding all shapes/connections.`,
    inputSchema: {
      type: "object",
      properties: {
        xml: {
          type: "string",
          description: "Existing diagram XML (from previous create_diagram or add_shape calls)"
        },
        shape_type: {
          type: "string",
          enum: ["rectangle", "rounded", "ellipse", "rhombus", "hexagon", "cylinder", "cloud", "actor", "note", "swimlane"],
          description: "Type of shape to add"
        },
        text: {
          type: "string",
          description: "Text content for the shape"
        },
        x: {
          type: "number",
          description: "X coordinate position (pixels from left)"
        },
        y: {
          type: "number",
          description: "Y coordinate position (pixels from top)"
        },
        width: {
          type: "number",
          description: "Width of the shape in pixels"
        },
        height: {
          type: "number",
          description: "Height of the shape in pixels"
        },
        fill_color: {
          type: "string",
          default: "#ffffff",
          description: "Fill color in hex format (e.g., '#ffffff', '#dae8fc')"
        },
        stroke_color: {
          type: "string",
          default: "#000000",
          description: "Border color in hex format"
        }
      },
      required: ["xml", "shape_type", "text", "x", "y", "width", "height"]
    }
  },
  {
    name: "add_connection",
    description: `⚠️ For INCREMENTAL building only. Adds ONE connection between two shapes.

WARNING: For flowcharts, use 'create_flowchart' which adds all connections automatically!

Use this ONLY when:
- Adding connections to a manually-built diagram
- You used 'add_shape' and now need to connect the shapes
- Modifying an existing diagram

Connection styles:
- orthogonal: Right-angled lines (recommended)
- straight, curved, dashed, dotted

Arrows:
- arrow_end: true (shows direction →)
- arrow_start: true (bidirectional ↔)
- label: Optional text on the connection

Returns: Modified XML with the connection added.`,
    inputSchema: {
      type: "object",
      properties: {
        xml: {
          type: "string",
          description: "Existing diagram XML"
        },
        source_id: {
          type: "string",
          description: "ID of source shape (get from add_shape return value or use extract_cell_ids)"
        },
        target_id: {
          type: "string",
          description: "ID of target shape"
        },
        label: {
          type: "string",
          description: "Optional label text for the connection"
        },
        style: {
          type: "string",
          enum: ["straight", "orthogonal", "curved", "dashed", "dotted"],
          default: "orthogonal",
          description: "Connection line style"
        },
        arrow_end: {
          type: "boolean",
          default: true,
          description: "Show arrow at the end (target)"
        },
        arrow_start: {
          type: "boolean",
          default: false,
          description: "Show arrow at the start (source)"
        }
      },
      required: ["xml", "source_id", "target_id"]
    }
  },
  {
    name: "save_diagram",
    description: `Save a diagram XML to the Downloads folder.

Use this when the user explicitly wants to save/download a diagram file to their Downloads folder.

The diagram will be saved as: diagram_title_timestamp.drawio

This is the ONLY way to save diagrams to the Downloads folder - other tools use temporary files that are cleaned up by the OS.`,
    inputSchema: {
      type: "object",
      properties: {
        xml: {
          type: "string",
          description: "Complete diagram XML to save"
        },
        title: {
          type: "string",
          description: "Title for the diagram (used in filename)"
        }
      },
      required: ["xml", "title"]
    }
  }
];

/**
 * List available tools
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

/**
 * List available diagram resources
 */
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: Array.from(diagramResources.values()).map(resource => ({
      uri: resource.uri,
      name: resource.name,
      description: resource.description,
      mimeType: resource.mimeType,
    })),
  };
});

/**
 * Read a specific diagram resource
 */
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const uri = request.params.uri;
  const resource = diagramResources.get(uri);

  if (!resource) {
    throw new Error(`Resource not found: ${uri}`);
  }

  return {
    contents: [
      {
        uri: resource.uri,
        mimeType: resource.mimeType,
        text: resource.content,
      },
    ],
  };
});

/**
 * Handle tool execution
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;

    switch (name) {
      case "create_diagram": {
        const parsed = CreateDiagramSchema.parse(args);

        // For now, create a basic structure - in a production system,
        // you'd use an LLM to interpret the description and create appropriate shapes
        const xml = generator.createBaseModel(parsed.page_width, parsed.page_height);
        const wrapped = generator.wrapInMxFile(
          xml,
          parsed.title,
          parsed.output_format === "compressed"
        );

        // Save to temp folder for app opening
        const filePath = saveDiagramToTemp(wrapped, parsed.title);

        // Add as resource
        const resourceUri = addDiagramResource(parsed.title, wrapped, filePath);

        // Try to open in draw.io
        const openedInApp = await openInDrawio(filePath);

        // Create web viewer URL
        const webUrl = createDiagramsNetUrl(wrapped);

        // Build response message
        let message = `✅ Created empty diagram "${parsed.title}"\n\n`;
        message += `🌐 VIEW IN BROWSER (click to open):\n${webUrl}\n\n`;

        if (openedInApp) {
          message += `🎨 Opened in draw.io app\n\n`;
        }

        message += `💡 Use 'add_shape' to add shapes, or use 'save_diagram' to save to Downloads.\n\n`;
        message += `🔗 MCP Resource: ${resourceUri}\n\n`;
        message += `---\n\n📋 Raw XML:\n${wrapped}`;

        return {
          content: [
            {
              type: "text",
              text: message,
            },
            {
              type: "resource",
              resource: {
                uri: resourceUri,
                mimeType: "application/vnd.jgraph.mxfile",
                text: wrapped,
              },
            },
          ],
        };
      }

      case "create_flowchart": {
        const parsed = CreateFlowchartSchema.parse(args);
        const xml = generator.createFlowchart(
          parsed.title,
          parsed.steps,
          parsed.output_format === "compressed"
        );

        // Save to temp folder for app opening
        const filePath = saveDiagramToTemp(xml, parsed.title);

        // Add as resource
        const resourceUri = addDiagramResource(parsed.title, xml, filePath);

        // Try to open in draw.io
        const openedInApp = await openInDrawio(filePath);

        // Create web viewer URL
        const webUrl = createDiagramsNetUrl(xml);

        // Build response message
        let message = `✅ Created flowchart "${parsed.title}" with ${parsed.steps.length} steps\n\n`;
        message += `🌐 VIEW IN BROWSER (click to open):\n${webUrl}\n\n`;

        if (openedInApp) {
          message += `🎨 Opened in draw.io app\n\n`;
        }

        message += `💡 Use 'save_diagram' tool to save to Downloads folder if needed.\n\n`;
        message += `🔗 MCP Resource: ${resourceUri}\n\n`;
        message += `---\n\n📋 Raw XML:\n${xml}`;

        return {
          content: [
            {
              type: "text",
              text: message,
            },
            {
              type: "resource",
              resource: {
                uri: resourceUri,
                mimeType: "application/vnd.jgraph.mxfile",
                text: xml,
              },
            },
          ],
        };
      }

      case "add_shape": {
        const parsed = AddShapeSchema.parse(args);
        const result = generator.addShape(
          parsed.xml,
          parsed.shape_type,
          parsed.text,
          parsed.x,
          parsed.y,
          parsed.width,
          parsed.height,
          parsed.fill_color,
          parsed.stroke_color
        );

        const newXml = result.xml;
        const newId = result.id;

        // Create web viewer URL
        const webUrl = createDiagramsNetUrl(newXml);

        // Build response message (without opening app or saving)
        let message = `✅ Added ${parsed.shape_type} shape "${parsed.text}" (ID: ${newId})\n\n`;
        message += `💡 Continue adding shapes/connections, or view the diagram:\n\n`;
        message += `🌐 VIEW IN BROWSER:\n${webUrl}\n\n`;
        message += `📋 Updated XML (use this for next operations):\n${newXml}`;

        return {
          content: [
            {
              type: "text",
              text: message,
            },
          ],
        };
      }

      case "add_connection": {
        const parsed = AddConnectionSchema.parse(args);
        const newXml = generator.addConnection(
          parsed.xml,
          parsed.source_id,
          parsed.target_id,
          parsed.label,
          parsed.style,
          parsed.arrow_end,
          parsed.arrow_start
        );

        // Create web viewer URL
        const webUrl = createDiagramsNetUrl(newXml);

        // Build response message (without opening app or saving)
        let message = `✅ Added connection from ${parsed.source_id} to ${parsed.target_id}\n\n`;
        message += `💡 Continue adding shapes/connections, or view the diagram:\n\n`;
        message += `🌐 VIEW IN BROWSER:\n${webUrl}\n\n`;
        message += `📋 Updated XML (use this for next operations):\n${newXml}`;

        return {
          content: [
            {
              type: "text",
              text: message,
            },
          ],
        };
      }

      case "save_diagram": {
        const parsed = SaveDiagramSchema.parse(args);

        // Save to Downloads folder
        const filePath = saveDiagramToDownloads(parsed.xml, parsed.title);

        // Add as resource
        const resourceUri = addDiagramResource(parsed.title, parsed.xml, filePath);

        // Build response message
        let message = `✅ Saved diagram "${parsed.title}" to Downloads folder\n\n`;
        message += `📁 File location: ${filePath}\n\n`;
        message += `🔗 MCP Resource: ${resourceUri}\n`;

        return {
          content: [
            {
              type: "text",
              text: message,
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        `Invalid arguments: ${error.errors
          .map((e) => `${e.path.join(".")}: ${e.message}`)
          .join(", ")}`
      );
    }
    throw error;
  }
});

/**
 * Start the server
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  // Server will run until the connection is closed
  console.error("Draw.io Diagram Generator MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
