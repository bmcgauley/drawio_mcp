# Draw.io MCP Architecture Documentation

**Version**: 2.0.0
**Last Updated**: 2025-11-09

## Table of Contents

1. [Overview](#overview)
2. [Architecture Principles](#architecture-principles)
3. [Directory Structure](#directory-structure)
4. [Module Descriptions](#module-descriptions)
5. [Data Flow](#data-flow)
6. [API Reference](#api-reference)
7. [Resource Management](#resource-management)
8. [Type System](#type-system)

## Overview

The draw.io MCP server uses a modular architecture designed for:
- **Progressive disclosure**: Agents load only what they need
- **Resource-based storage**: Large diagrams stay out of context
- **Composability**: Tools can be chained programmatically
- **Type safety**: Full TypeScript coverage

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     MCP Client (Claude)                      │
└────────────┬─────────────────────────────────────┬──────────┘
             │                                     │
             │ Tool Calls                          │ Resource Reads
             │                                     │
┌────────────▼─────────────────────────────────────▼──────────┐
│                   Draw.io MCP Server                         │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Discovery Layer (Progressive)             │ │
│  │  • list_tools    • search_tools    • get_schema       │ │
│  └──────────────────────────┬─────────────────────────────┘ │
│                             │                                │
│  ┌──────────────────────────▼─────────────────────────────┐ │
│  │                  Tool Execution Layer                   │ │
│  │  ┌──────────┐  ┌────────────┐  ┌──────────────────┐  │ │
│  │  │ Flowchart│  │  Shapes &  │  │  Diagram Mgmt   │  │ │
│  │  │ Generator│  │ Connections│  │  (Save, etc.)   │  │ │
│  │  └──────────┘  └────────────┘  └──────────────────┘  │ │
│  └──────────────────────────┬─────────────────────────────┘ │
│                             │                                │
│  ┌──────────────────────────▼─────────────────────────────┐ │
│  │                 Core Tool Modules                       │ │
│  │  • createBaseModel  • addShape  • addConnection        │ │
│  │  • wrapInMxFile     • createFlowchart                  │ │
│  └──────────────────────────┬─────────────────────────────┘ │
│                             │                                │
│  ┌──────────────────────────▼─────────────────────────────┐ │
│  │                  Type System Layer                      │ │
│  │  • DiagramTypes  • ShapeTypes  • ConnectionTypes       │ │
│  │  • FlowchartTypes                                      │ │
│  └──────────────────────────┬─────────────────────────────┘ │
│                             │                                │
│  ┌──────────────────────────▼─────────────────────────────┐ │
│  │              Utility & Resource Layer                   │ │
│  │  • XML Utils  • ID Generation  • Diagram Store         │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

## Architecture Principles

### 1. Modular Design

Each tool is a standalone function with:
- Clear input/output types
- No side effects (except diagram store)
- Composable with other tools
- Independently testable

**Example**:
```typescript
// Each tool is a pure function
export function addShape(params: AddShapeParams): AddShapeResult {
  // Pure logic, returns new state
  const updatedXml = params.xml.replace(...);
  return { xml: updatedXml, id, shape };
}
```

### 2. Progressive Disclosure

Tools are discovered progressively:
1. List tool names (200 bytes)
2. Search for relevant tools (500 bytes)
3. Get full schema on demand (2KB)
4. Execute tool (returns reference, not full data)

**Benefit**: 92.9% context reduction vs loading all definitions upfront.

### 3. Resource-Based Storage

Large outputs stored as resources:
```
Create → Store → Return URI → Access on demand
  ↓        ↓         ↓              ↓
 XML   DiagramStore  drawio://...  read_resource()
```

### 4. Type Safety

Every module has TypeScript interfaces:
```typescript
// Types defined separately
import { AddShapeParams, AddShapeResult } from "../types/shapes.js";

// Function uses typed interfaces
export function addShape(params: AddShapeParams): AddShapeResult
```

## Directory Structure

```
src/
├── index.ts                      # Main MCP server entry point
├── test.ts                       # Comprehensive test suite
│
├── tools/                        # Individual tool modules
│   ├── createBaseModel.ts        # Creates empty mxGraphModel
│   ├── wrapInMxFile.ts           # Wraps model in mxfile structure
│   ├── addShape.ts               # Adds individual shapes
│   ├── addConnection.ts          # Adds connections between shapes
│   ├── createFlowchart.ts        # Complete flowchart generation
│   └── discovery.ts              # Tool listing/search/schema
│
├── types/                        # TypeScript type definitions
│   ├── diagram.ts                # General diagram types
│   │   • DiagramType, OutputFormat
│   │   • CreateDiagramParams, SaveDiagramParams
│   │   • DiagramMetadata, DiagramPreview
│   │
│   ├── shapes.ts                 # Shape-related types
│   │   • ShapeType (10 types)
│   │   • AddShapeParams, AddShapeResult
│   │   • getShapeStyle() - Style string generator
│   │
│   ├── connections.ts            # Connection types
│   │   • ConnectorStyle (5 styles)
│   │   • AddConnectionParams, AddConnectionResult
│   │   • getConnectionStyle() - Style generator
│   │
│   └── flowchart.ts              # Flowchart-specific types
│       • FlowchartElementType (6 types)
│       • FlowchartStep, CreateFlowchartParams
│       • getFlowchartShapeConfig() - Element configs
│
├── resources/                    # Resource management
│   └── diagramStore.ts           # Diagram storage with TTL
│       • DiagramStore class
│       • store(), get(), getPreview(), getMetadata()
│       • Resource URI generation
│       • Automatic cleanup (1-hour TTL)
│
└── utils/                        # Utility functions
    ├── xml.ts                    # XML manipulation
    │   • escapeXml() - XML escaping
    │   • compressXml() - Deflate compression
    │   • extractCellIds() - ID extraction
    │   • generateCellId() - Unique ID generation
    │   • createDiagramsNetUrl() - Browser URL
    │
    └── idGenerator.ts            # ID and URI generation
        • generateDiagramId() - Diagram IDs
        • generateContentHash() - Hash-based IDs
        • generateDiagramUri() - drawio://diagram/{id}
        • generatePreviewUri() - drawio://preview/{id}
        • generateMetadataUri() - drawio://metadata/{id}
        • parseDiagramUri() - URI parsing
```

## Module Descriptions

### Core Modules (src/tools/)

#### 1. createBaseModel.ts
Creates empty mxGraphModel with root cells.

**Function**:
```typescript
function createBaseModel(
  pageWidth: number = 1100,
  pageHeight: number = 850
): string
```

**Output**:
```xml
<mxGraphModel dx="1394" dy="747" grid="1" ...>
  <root>
    <mxCell id="0"/>
    <mxCell id="1" parent="0"/>
  </root>
</mxGraphModel>
```

**Use Case**: Starting point for custom diagrams.

#### 2. wrapInMxFile.ts
Wraps mxGraphModel in mxfile structure.

**Function**:
```typescript
function wrapInMxFile(
  graphModel: string,
  title: string = "Diagram",
  compressed: boolean = false
): string
```

**Features**:
- Adds XML declaration
- Adds mxfile metadata (host, version, agent)
- Optional deflate compression
- Proper diagram naming

**Use Case**: Final step before saving/returning diagram.

#### 3. addShape.ts
Adds a single shape to existing XML.

**Function**:
```typescript
function addShape(params: AddShapeParams): AddShapeResult
```

**Parameters**:
- `xml`: Existing diagram XML
- `shape_type`: One of 10 shape types
- `text`, `x`, `y`, `width`, `height`
- Optional: `fill_color`, `stroke_color`

**Returns**:
- Updated XML
- Generated shape ID
- Shape object with metadata

**Use Case**: Incremental diagram building.

#### 4. addConnection.ts
Adds connection between two shapes.

**Function**:
```typescript
function addConnection(params: AddConnectionParams): AddConnectionResult
```

**Parameters**:
- `xml`: Existing diagram XML
- `source_id`, `target_id`: Shape IDs
- Optional: `label`, `style`, `arrow_end`, `arrow_start`

**Returns**:
- Updated XML
- Connection object with metadata

**Styles**: straight, orthogonal, curved, dashed, dotted

**Use Case**: Connecting shapes in custom diagrams.

#### 5. createFlowchart.ts
Creates complete flowchart in one operation.

**Function**:
```typescript
function createFlowchart(params: CreateFlowchartParams): string
```

**Process**:
1. Create base model (1400x1200 for branches)
2. Calculate positions (vertical layout with decision branching)
3. Add all shapes with proper colors
4. Add all connections with labels
5. Wrap in mxfile

**Features**:
- Automatic layout (vertical flow)
- Decision branching (horizontal spread)
- Color-coding by type
- Proper arrow directions

**Use Case**: Primary tool for workflow diagrams.

#### 6. discovery.ts
Progressive disclosure API.

**Functions**:
```typescript
function listTools(detailLevel: "minimal" | "brief" | "full"): string
function searchTools(query?: string, category?: string): string
function getToolSchema(toolName: string): string
function getCategories(): string[]
```

**Tool Registry**: Maintains metadata for all 5 tools
- name, description, category, tags, schema

**Use Case**: Agent tool discovery and exploration.

### Type System (src/types/)

#### diagram.ts
General diagram types and metadata.

**Key Types**:
```typescript
type DiagramType = "flowchart" | "sequence" | "class" | ...
type OutputFormat = "uncompressed" | "compressed"

interface DiagramMetadata {
  id: string;
  title: string;
  type: DiagramType;
  created: string;
  modified: string;
  format: OutputFormat;
  pageWidth: number;
  pageHeight: number;
  elementCount?: number;
  connectionCount?: number;
  size: number;
}

interface DiagramPreview {
  id: string;
  title: string;
  type: DiagramType;
  preview: string;  // First 500 chars
  metadata: DiagramMetadata;
}
```

#### shapes.ts
Shape types and styling.

**Shape Types** (10 total):
- rectangle, rounded, ellipse, rhombus
- hexagon, cylinder, cloud
- actor, note, swimlane

**Key Functions**:
```typescript
function getShapeStyle(
  shapeType: ShapeType,
  fillColor: string,
  strokeColor: string
): string
```

Maps shape types to draw.io style strings.

#### connections.ts
Connection types and styling.

**Connector Styles** (5 total):
- straight, orthogonal, curved
- dashed, dotted

**Key Functions**:
```typescript
function getConnectionStyle(
  style: ConnectorStyle,
  arrowEnd: boolean,
  arrowStart: boolean
): string
```

Generates draw.io edge styles.

#### flowchart.ts
Flowchart element types.

**Element Types** (6 total):
- start, end, process
- decision, input, output

**Key Functions**:
```typescript
function getFlowchartShapeConfig(
  type: FlowchartElementType
): FlowchartShapeConfig
```

Returns shape type, dimensions, and colors for each element.

### Resource Management (src/resources/)

#### diagramStore.ts
Centralized diagram storage with resource URIs.

**Class**: `DiagramStore`

**Storage**:
```typescript
private diagrams: Map<string, StoredDiagram> = new Map();
private readonly TTL_MS = 3600000; // 1 hour
```

**Key Methods**:
```typescript
store(title, xml, metadata, filePath?): string  // Returns ID
get(id): StoredDiagram | null
getXml(id): string | null
getMetadata(id): DiagramMetadata | null
getPreview(id): DiagramPreview | null
list(): DiagramMetadata[]
delete(id): boolean
getResourceUris(id): { diagram, preview, metadata }
```

**Auto-cleanup**: Removes diagrams after 1 hour of no access.

**Singleton**: Exported as `diagramStore` instance.

### Utilities (src/utils/)

#### xml.ts
XML manipulation utilities.

**Functions**:
```typescript
escapeXml(text: string): string
  // Escapes &, <, >, ", '

compressXml(xml: string): string
  // Deflate + Base64 (draw.io compressed format)

createDiagramsNetUrl(xml: string): string
  // Returns: https://app.diagrams.net/#R{encoded}

extractCellIds(xml: string): string[]
  // Extracts all cell IDs (excludes root 0, 1)

generateCellId(): string
  // Generates unique cell-{n} IDs

resetCellIdCounter(): void
  // For testing
```

#### idGenerator.ts
ID and URI generation.

**Diagram IDs**:
```typescript
generateDiagramId(title: string): string
  // Returns: sanitized_title_timestamp
  // Example: "user_flow_1762678672846"
```

**Content Hashing**:
```typescript
generateContentHash(content: string): string
  // MD5 hash (first 12 chars)
```

**Resource URIs**:
```typescript
generateDiagramUri(id: string): string
  // Returns: "drawio://diagram/{id}"

generatePreviewUri(id: string): string
  // Returns: "drawio://preview/{id}"

generateMetadataUri(id: string): string
  // Returns: "drawio://metadata/{id}"
```

**URI Parsing**:
```typescript
parseDiagramUri(uri: string): { type, id } | null
  // Extracts type and ID from URI
```

## Data Flow

### 1. Flowchart Creation Flow

```
Client Request
    ↓
┌───────────────────────┐
│ create_flowchart tool │
└──────────┬────────────┘
           ↓
┌───────────────────────┐
│ createFlowchart()     │  ← src/tools/createFlowchart.ts
│  1. createBaseModel() │  ← Creates empty model
│  2. Calculate layout  │  ← Position steps
│  3. addShape() * N    │  ← Add all shapes
│  4. addConnection()   │  ← Add all connections
│  5. wrapInMxFile()    │  ← Wrap in mxfile
└──────────┬────────────┘
           ↓
┌───────────────────────┐
│ diagramStore.store()  │  ← Store with metadata
└──────────┬────────────┘
           ↓
┌───────────────────────┐
│ Return to client:     │
│  • Resource URIs      │
│  • Preview object     │
│  • Metadata           │
│  • Web URL            │
│  (NOT full XML!)      │
└───────────────────────┘
```

### 2. Progressive Disclosure Flow

```
Agent Discovery Process
    ↓
┌─────────────────────────┐
│ 1. List tool names      │
│    (200 bytes)          │
│    drawio_list_tools    │
│    { detail: "minimal" }│
└──────────┬──────────────┘
           ↓
┌─────────────────────────┐
│ 2. Search for "flow"    │
│    (500 bytes)          │
│    drawio_search_tools  │
│    { query: "flowchart"}│
└──────────┬──────────────┘
           ↓
┌─────────────────────────┐
│ 3. Get full schema      │
│    (2KB)                │
│    drawio_get_schema    │
│    { tool: "create..."}  │
└──────────┬──────────────┘
           ↓
┌─────────────────────────┐
│ 4. Execute tool         │
│    Returns URI (100 B)  │
└──────────┬──────────────┘
           ↓
┌─────────────────────────┐
│ 5. Access via resource  │
│    (only if needed)     │
│    read_resource(uri)   │
└─────────────────────────┘

Total context: ~3KB vs 17KB (82% savings)
```

### 3. Resource Access Flow

```
Client requests resource
    ↓
┌──────────────────────┐
│ read_resource(uri)   │
└─────────┬────────────┘
          ↓
┌──────────────────────┐
│ parseDiagramUri()    │  ← Extract type & ID
└─────────┬────────────┘
          ↓
┌──────────────────────┐
│ Switch on type:      │
│  • diagram → getXml()│  ← Full XML (3.5KB)
│  • preview → getPrev │  ← Preview (500B)
│  • metadata → getMeta│  ← Metadata (280B)
└─────────┬────────────┘
          ↓
┌──────────────────────┐
│ Return content       │
│ with appropriate     │
│ MIME type            │
└──────────────────────┘
```

## API Reference

### Discovery Tools

#### drawio_list_tools

**Purpose**: List available tools with configurable detail.

**Parameters**:
```typescript
{
  detail_level?: "minimal" | "brief" | "full"  // Default: "minimal"
}
```

**Returns**:
- `minimal`: Array of tool names
- `brief`: Array of { name, description, category, tags }
- `full`: Full tool definitions with schemas

**Example**:
```json
// minimal
["create_flowchart", "create_diagram", ...]

// brief
[
  {
    "name": "create_flowchart",
    "description": "Create a complete flowchart...",
    "category": "generation",
    "tags": ["flowchart", "process", "workflow"]
  },
  ...
]
```

#### drawio_search_tools

**Purpose**: Search for tools by keyword or category.

**Parameters**:
```typescript
{
  query?: string      // Search in name, description, tags
  category?: string   // Filter by category
}
```

**Categories**: `generation`, `editing`, `management`

**Example**:
```json
// Search for "flowchart"
{
  "query": "flowchart"
}

// Returns matching tools with full details
```

#### drawio_get_tool_schema

**Purpose**: Get complete schema for a specific tool.

**Parameters**:
```typescript
{
  tool_name: string  // Exact tool name
}
```

**Returns**: Full tool definition with JSON schema.

### Diagram Generation Tools

#### create_flowchart

**Purpose**: Create complete flowchart with connections.

**Parameters**:
```typescript
{
  title: string
  steps: FlowchartStep[]
  output_format?: "uncompressed" | "compressed"
}

interface FlowchartStep {
  id: string
  type: "start" | "end" | "process" | "decision" | "input" | "output"
  text: string
  next?: string[]           // IDs of next steps
  decision_labels?: string[] // Labels for branches
}
```

**Returns**:
```typescript
{
  message: string           // Human-readable summary
  diagram_id: string        // Unique diagram ID
  resource_uris: {
    diagram: string         // drawio://diagram/{id}
    preview: string         // drawio://preview/{id}
    metadata: string        // drawio://metadata/{id}
  }
  web_url: string          // diagrams.net URL
  preview: DiagramPreview  // Preview object
}
```

#### create_diagram

**Purpose**: Create empty canvas for custom diagrams.

**Parameters**:
```typescript
{
  title: string
  description: string
  diagram_type: DiagramType
  output_format?: OutputFormat
  page_width?: number       // Default: 1100
  page_height?: number      // Default: 850
}
```

**Returns**: Same as create_flowchart.

#### add_shape

**Purpose**: Add a single shape to existing diagram.

**Parameters**:
```typescript
{
  xml: string              // Existing diagram XML
  shape_type: ShapeType    // One of 10 types
  text: string
  x: number
  y: number
  width: number
  height: number
  fill_color?: string      // Default: "#ffffff"
  stroke_color?: string    // Default: "#000000"
}
```

**Returns**:
```typescript
{
  xml: string              // Updated XML
  id: string               // Generated shape ID
  shape: Shape             // Shape metadata
}
```

#### add_connection

**Purpose**: Connect two shapes.

**Parameters**:
```typescript
{
  xml: string              // Existing diagram XML
  source_id: string        // Source shape ID
  target_id: string        // Target shape ID
  label?: string           // Connection label
  style?: ConnectorStyle   // Default: "orthogonal"
  arrow_end?: boolean      // Default: true
  arrow_start?: boolean    // Default: false
}
```

**Returns**:
```typescript
{
  xml: string              // Updated XML
  connection: Connection   // Connection metadata
}
```

#### save_diagram

**Purpose**: Save diagram to Downloads folder.

**Parameters**:
```typescript
{
  xml: string              // Complete diagram XML
  title: string            // Used for filename
}
```

**Returns**:
```typescript
{
  file_path: string        // Absolute path to saved file
  resource_uri: string     // Resource URI for diagram
}
```

## Resource Management

### Resource URI Patterns

```
drawio://diagram/{id}    - Full XML content
drawio://preview/{id}    - 500-char preview + metadata
drawio://metadata/{id}   - Metadata only (no XML)
```

### Storage Mechanism

**In-Memory Map**:
```typescript
Map<string, StoredDiagram>
```

**Stored Diagram**:
```typescript
interface StoredDiagram {
  id: string
  title: string
  xml: string                  // Full XML
  metadata: DiagramMetadata
  filePath?: string            // If saved to disk
  created: Date
  accessed: Date               // For TTL
}
```

**TTL Mechanism**:
- Diagrams expire after 1 hour of no access
- `get()` updates access time
- Automatic cleanup via setTimeout
- Clean on store(), get(), and periodic checks

### Resource Access

**Read Resource Handler**:
```typescript
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const uri = request.params.uri;
  const { type, id } = parseDiagramUri(uri);

  switch (type) {
    case "diagram":
      return { text: diagramStore.getXml(id) };
    case "preview":
      return { text: JSON.stringify(diagramStore.getPreview(id)) };
    case "metadata":
      return { text: JSON.stringify(diagramStore.getMetadata(id)) };
  }
});
```

## Type System

### Type Hierarchy

```
DiagramTypes (diagram.ts)
    ├── DiagramType enum
    ├── OutputFormat enum
    ├── DiagramMetadata interface
    └── DiagramPreview interface

ShapeTypes (shapes.ts)
    ├── ShapeType enum
    ├── ShapeStyle interface
    ├── ShapePosition interface
    ├── Shape interface
    ├── AddShapeParams interface
    └── AddShapeResult interface

ConnectionTypes (connections.ts)
    ├── ConnectorStyle enum
    ├── Connection interface
    ├── AddConnectionParams interface
    └── AddConnectionResult interface

FlowchartTypes (flowchart.ts)
    ├── FlowchartElementType enum
    ├── FlowchartStep interface
    ├── CreateFlowchartParams interface
    ├── FlowchartLayout interface
    └── FlowchartShapeConfig interface
```

### Type Safety Benefits

1. **Compile-Time Validation**: Catch errors before runtime
2. **IDE Support**: Autocomplete and inline documentation
3. **Refactoring Safety**: Rename/move with confidence
4. **Self-Documentation**: Types serve as documentation

### Example Type Flow

```typescript
// 1. Client provides params (validated by Zod)
const params: CreateFlowchartParams = {
  title: "User Flow",
  steps: [...],
};

// 2. Passed to typed function
function createFlowchart(params: CreateFlowchartParams): string {
  // 3. Internal types enforced
  const steps: FlowchartStep[] = params.steps;

  // 4. Return type checked
  const xml: string = wrapInMxFile(...);
  return xml;  // ✓ Type matches
}

// 5. Storage with metadata
const metadata: DiagramMetadata = {
  id: generateDiagramId(params.title),
  title: params.title,
  // ... all fields type-checked
};
```

## Conclusion

This architecture provides:
- ✅ **Modular design** (14 focused modules)
- ✅ **Progressive disclosure** (85-92% token savings)
- ✅ **Resource-based storage** (diagrams out of context)
- ✅ **Type safety** (full TypeScript coverage)
- ✅ **Composability** (tools can be chained)
- ✅ **Testability** (pure functions, clear interfaces)
- ✅ **Maintainability** (separation of concerns)

The architecture is optimized for agent code execution while remaining simple and maintainable.
