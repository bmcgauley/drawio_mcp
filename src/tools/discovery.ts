/**
 * Tool discovery and search functionality for progressive disclosure
 */

export interface ToolInfo {
  name: string;
  description: string;
  category: string;
  tags: string[];
  schema?: any;
}

export type DetailLevel = "minimal" | "brief" | "full";

const TOOL_REGISTRY: ToolInfo[] = [
  {
    name: "create_flowchart",
    description:
      "Create a complete flowchart with proper connections and decision branching",
    category: "generation",
    tags: ["flowchart", "process", "workflow", "decision", "diagram"],
    schema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Flowchart title" },
        steps: {
          type: "array",
          description: "Ordered list of flowchart steps",
        },
        output_format: {
          type: "string",
          enum: ["uncompressed", "compressed"],
          default: "uncompressed",
        },
      },
      required: ["title", "steps"],
    },
  },
  {
    name: "create_diagram",
    description: "Creates an empty base canvas for draw.io diagrams",
    category: "generation",
    tags: ["diagram", "canvas", "base", "empty"],
    schema: {
      type: "object",
      properties: {
        title: { type: "string" },
        description: { type: "string" },
        diagram_type: {
          type: "string",
          enum: [
            "flowchart",
            "sequence",
            "class",
            "er",
            "network",
            "infrastructure",
            "custom",
          ],
        },
        output_format: {
          type: "string",
          enum: ["uncompressed", "compressed"],
          default: "uncompressed",
        },
      },
      required: ["title", "description", "diagram_type"],
    },
  },
  {
    name: "add_shape",
    description: "Add a single shape to an existing diagram",
    category: "editing",
    tags: ["shape", "add", "element", "incremental"],
    schema: {
      type: "object",
      properties: {
        xml: { type: "string", description: "Existing diagram XML" },
        shape_type: {
          type: "string",
          enum: [
            "rectangle",
            "rounded",
            "ellipse",
            "rhombus",
            "hexagon",
            "cylinder",
            "cloud",
            "actor",
            "note",
            "swimlane",
          ],
        },
        text: { type: "string" },
        x: { type: "number" },
        y: { type: "number" },
        width: { type: "number" },
        height: { type: "number" },
      },
      required: ["xml", "shape_type", "text", "x", "y", "width", "height"],
    },
  },
  {
    name: "add_connection",
    description: "Add a connection between two shapes in a diagram",
    category: "editing",
    tags: ["connection", "arrow", "link", "edge"],
    schema: {
      type: "object",
      properties: {
        xml: { type: "string" },
        source_id: { type: "string" },
        target_id: { type: "string" },
        label: { type: "string" },
        style: {
          type: "string",
          enum: ["straight", "orthogonal", "curved", "dashed", "dotted"],
        },
      },
      required: ["xml", "source_id", "target_id"],
    },
  },
  {
    name: "save_diagram",
    description: "Save a diagram XML to the Downloads folder",
    category: "management",
    tags: ["save", "download", "export", "file"],
    schema: {
      type: "object",
      properties: {
        xml: { type: "string", description: "Complete diagram XML to save" },
        title: {
          type: "string",
          description: "Title for the diagram (used in filename)",
        },
      },
      required: ["xml", "title"],
    },
  },
];

/**
 * List tools with configurable detail level
 */
export function listTools(detailLevel: DetailLevel = "minimal"): string {
  if (detailLevel === "minimal") {
    return JSON.stringify(TOOL_REGISTRY.map((t) => t.name));
  }

  if (detailLevel === "brief") {
    return JSON.stringify(
      TOOL_REGISTRY.map((t) => ({
        name: t.name,
        description: t.description,
        category: t.category,
        tags: t.tags,
      })),
      null,
      2
    );
  }

  // full
  return JSON.stringify(TOOL_REGISTRY, null, 2);
}

/**
 * Search tools by query and/or category
 */
export function searchTools(
  query?: string,
  category?: string
): string {
  let results = TOOL_REGISTRY;

  // Filter by category
  if (category) {
    results = results.filter((t) => t.category === category);
  }

  // Filter by query (search in name, description, tags)
  if (query) {
    const lowerQuery = query.toLowerCase();
    results = results.filter(
      (t) =>
        t.name.toLowerCase().includes(lowerQuery) ||
        t.description.toLowerCase().includes(lowerQuery) ||
        t.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
    );
  }

  return JSON.stringify(
    results.map((t) => ({
      name: t.name,
      description: t.description,
      category: t.category,
      tags: t.tags,
    })),
    null,
    2
  );
}

/**
 * Get full schema for a specific tool
 */
export function getToolSchema(toolName: string): string {
  const tool = TOOL_REGISTRY.find((t) => t.name === toolName);
  if (!tool) {
    throw new Error(`Tool not found: ${toolName}`);
  }
  return JSON.stringify(tool, null, 2);
}

/**
 * Get all categories
 */
export function getCategories(): string[] {
  return [...new Set(TOOL_REGISTRY.map((t) => t.category))];
}
