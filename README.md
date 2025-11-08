# Draw.io Diagram Generator MCP Server

A Model Context Protocol (MCP) server that generates draw.io/diagrams.net XML files programmatically. Create flowcharts, UML diagrams, network diagrams, and more through simple API calls or natural language descriptions.

## Features

- **Automatic File Saving**: Diagrams are automatically saved to your Downloads folder
- **Desktop App Integration**: Automatically opens diagrams in draw.io desktop app (if installed)
- **Web Viewer Support**: Generates diagrams.net URLs for opening diagrams in your browser
- **Multi-Format Output**: Provides file paths, web URLs, MCP resources, and raw XML
- **Direct XML Generation**: Creates valid draw.io XML that can be opened immediately in draw.io/diagrams.net
- **No Browser Required**: Unlike browser-extension-based solutions, this generates files directly
- **Multiple Diagram Types**: Support for flowcharts, UML, ER diagrams, network diagrams, and more
- **Structured Flowchart Creation**: Optimized flowchart builder with automatic layout and styling
- **Incremental Building**: Add shapes and connections to existing diagrams programmatically
- **Flexible Styling**: Customize colors, shapes, connection styles, and layouts
- **MCP Resources**: Exposes generated diagrams as MCP resources for easy access

## Installation

### Via npm (Recommended)

```bash
# Install globally
npm install -g drawio-diagram-generator

# Or use with npx (no installation needed)
npx drawio-diagram-generator
```

### From Source

```bash
git clone <repository-url>
cd drawio-diagram-generator
npm install
npm run build
```

## Configuration

### Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "drawio": {
      "command": "npx",
      "args": ["-y", "drawio-diagram-generator"]
    }
  }
}
```

Config file locations:
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

### Cline (VS Code)

Add to MCP settings in Cline:

```json
{
  "mcpServers": {
    "drawio": {
      "command": "npx",
      "args": ["-y", "drawio-diagram-generator"]
    }
  }
}
```

### Zed Editor

Add to `~/.config/zed/settings.json`:

```json
{
  "context_servers": {
    "drawio": {
      "command": {
        "path": "npx",
        "args": ["-y", "drawio-diagram-generator"]
      }
    }
  }
}
```

## Available Tools

### 1. `create_flowchart`

Create a complete flowchart with automatic layout and styling.

**Parameters:**
- `title` (string): Flowchart title
- `steps` (array): List of flowchart steps, each with:
  - `id` (string): Unique identifier (e.g., "start", "process1", "decision1")
  - `type` (enum): "start", "end", "process", "decision", "input", or "output"
  - `text` (string): Text content for the element
  - `next` (array, optional): IDs of next steps (multiple for decision branches)
  - `decision_labels` (array, optional): Labels for decision branches (e.g., ["Yes", "No"])
- `output_format` (enum, optional): "uncompressed" (default) or "compressed"

**Example:**
```javascript
{
  "title": "User Authentication Flow",
  "steps": [
    {
      "id": "start",
      "type": "start",
      "text": "Start",
      "next": ["check_login"]
    },
    {
      "id": "check_login",
      "type": "decision",
      "text": "Credentials Valid?",
      "next": ["grant_access", "deny_access"],
      "decision_labels": ["Yes", "No"]
    },
    {
      "id": "grant_access",
      "type": "process",
      "text": "Grant Access",
      "next": ["end"]
    },
    {
      "id": "deny_access",
      "type": "process",
      "text": "Show Error",
      "next": ["end"]
    },
    {
      "id": "end",
      "type": "end",
      "text": "End"
    }
  ]
}
```

### 2. `create_diagram`

Create a basic diagram structure from a text description.

**Parameters:**
- `title` (string): Diagram title
- `description` (string): Detailed description of what to diagram
- `diagram_type` (enum): "flowchart", "sequence", "class", "er", "network", "infrastructure", or "custom"
- `output_format` (enum, optional): "uncompressed" or "compressed"
- `page_width` (number, optional): Canvas width in pixels (default: 1100)
- `page_height` (number, optional): Canvas height in pixels (default: 850)

### 3. `add_shape`

Add a shape to an existing diagram.

**Parameters:**
- `xml` (string): Existing diagram XML
- `shape_type` (enum): "rectangle", "rounded", "ellipse", "rhombus", "hexagon", "cylinder", "cloud", "actor", "note", or "swimlane"
- `text` (string): Text content
- `x` (number): X coordinate (pixels from left)
- `y` (number): Y coordinate (pixels from top)
- `width` (number): Width in pixels
- `height` (number): Height in pixels
- `fill_color` (string, optional): Hex color (default: "#ffffff")
- `stroke_color` (string, optional): Hex color (default: "#000000")

**Shape Types Reference:**
- **rectangle**: Standard box shapes
- **rounded**: Rounded corner boxes
- **ellipse**: Circles and ovals
- **rhombus**: Diamond shapes (decisions)
- **hexagon**: Six-sided shapes
- **cylinder**: Database symbols
- **cloud**: Cloud service representations
- **actor**: UML actor figures
- **note**: Annotation notes
- **swimlane**: Container for grouping

### 4. `add_connection`

Connect two shapes with an arrow or line.

**Parameters:**
- `xml` (string): Existing diagram XML
- `source_id` (string): ID of source shape
- `target_id` (string): ID of target shape
- `label` (string, optional): Connection label text
- `style` (enum, optional): "straight", "orthogonal", "curved", "dashed", or "dotted" (default: "orthogonal")
- `arrow_end` (boolean, optional): Show arrow at end (default: true)
- `arrow_start` (boolean, optional): Show arrow at start (default: false)

## Usage Examples

### Example 1: Simple Flowchart

Prompt to Claude:
```
Create a flowchart for a simple login process with these steps:
1. Start
2. Check if credentials are valid (decision)
3. If yes, grant access
4. If no, show error message
5. End
```

Claude will use the `create_flowchart` tool to generate a complete, properly styled flowchart.

### Example 2: System Architecture

Prompt to Claude:
```
Create a diagram showing a three-tier web architecture:
- Frontend (React)
- Backend API (Node.js)
- Database (PostgreSQL)
Show the connections between them.
```

Claude will use `create_diagram` followed by `add_shape` and `add_connection` calls to build the architecture diagram.

### Example 3: Custom Network Diagram

Prompt to Claude:
```
Create a network diagram with:
- A cloud at the top labeled "Internet"
- A firewall below it
- Two web servers behind the firewall
- A database server
Connect them appropriately.
```

## How Diagram Output Works

When you create a diagram, the MCP server provides multiple ways to access it:

### 1. Automatic File Download
Every diagram is automatically saved to your **Downloads folder** with a timestamp:
- **Format**: `diagram_title_timestamp.drawio`
- **Location**: `~/Downloads/` (Mac/Linux) or `%USERPROFILE%\Downloads\` (Windows)
- **Example**: `user_authentication_flow_1234567890.drawio`

### 2. Desktop App Integration
If draw.io desktop app is installed, diagrams are automatically opened:
- **Windows**: Detects installation in Program Files or LocalAppData
- **macOS**: Opens via `/Applications/draw.io.app`
- **Linux**: Checks `/usr/bin/drawio`, `/usr/local/bin/drawio`, `/opt/drawio/drawio`

### 3. Web Viewer URL
For browsers or artifact support (Claude Desktop), a web URL is generated:
- **Format**: `https://app.diagrams.net/#R{encoded_xml}`
- **Usage**: Click the link to open diagram in your browser
- **Benefit**: No installation required, works anywhere

### 4. MCP Resources
Diagrams are exposed as MCP resources:
- **URI Format**: `diagram:///diagram_name_timestamp`
- **Access**: Via MCP resource protocol
- **Benefits**: Can be referenced by other MCP clients/tools

### 5. Raw XML
The complete draw.io XML is provided in the response:
- **Format**: Valid mxGraph XML
- **Usage**: Copy/paste into any draw.io-compatible tool
- **Options**: Uncompressed (readable) or compressed (smaller)

## Output Formats

The server generates draw.io XML in two formats:

### Uncompressed XML (Default)
```xml
<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="app.diagrams.net" ...>
  <diagram name="My Diagram" id="diagram-1">
    <mxGraphModel ...>
      <root>
        <mxCell id="0"/>
        <mxCell id="1" parent="0"/>
        <!-- Your shapes and connections here -->
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
```

### Compressed XML
Uses deflate compression (same as draw.io's default save format) for smaller file sizes.

## Tips for Best Results

1. **Be Specific**: Provide detailed descriptions including:
   - Component names and types
   - Relationships and connections
   - Desired layout (vertical, horizontal, hierarchical)

2. **Iterative Building**: For complex diagrams:
   - Start with `create_diagram` or `create_flowchart`
   - Use `add_shape` to add additional components
   - Use `add_connection` to link them together

3. **Color Coding**: Use custom colors to categorize components:
   - Blue (#dae8fc) for frontend components
   - Green (#d5e8d4) for backend services
   - Yellow (#fff2cc) for decisions/alerts
   - Red (#f8cecc) for errors/issues

4. **Shape Selection**:
   - Use **cylinder** for databases
   - Use **cloud** for cloud services
   - Use **rhombus** for decision points
   - Use **actor** for users/personas

## Architecture

The server generates valid draw.io XML based on the mxGraphModel format:

- **mxfile**: Root container with metadata
- **diagram**: Named diagram page
- **mxGraphModel**: Graph structure definition
- **root**: Contains cells (shapes and connections)
- **mxCell**: Individual shapes (vertex) or connections (edge)

Each shape has:
- Unique ID for referencing
- Geometry (position and size)
- Style string (appearance)
- Value (text content)

Connections reference source and target shape IDs.

## Comparison with Other Solutions

| Feature | This Server | lgazo/drawio-mcp-server | RandomStateLabs/drawio-mcp |
|---------|------------|-------------------------|----------------------------|
| Browser Extension Required | ❌ No | ✅ Yes | ✅ Yes |
| Direct XML Generation | ✅ Yes | ❌ No | ❌ No |
| Works Offline | ✅ Yes | ❌ No | ❌ No |
| Requires Running draw.io | ❌ No | ✅ Yes | ✅ Yes |
| Structured Flowcharts | ✅ Yes | ⚠️ Partial | ❌ No |
| Incremental Building | ✅ Yes | ✅ Yes | ⚠️ Limited |
| Auto-save to Downloads | ✅ Yes | ❌ No | ❌ No |
| Desktop App Integration | ✅ Yes | ⚠️ Required | ⚠️ Required |
| Web Viewer URLs | ✅ Yes | ❌ No | ❌ No |
| MCP Resources | ✅ Yes | ❌ No | ❌ No |

## Troubleshooting

### "Module not found" errors
```bash
npm install
npm run build
```

### Tool not appearing in Claude Desktop
1. Verify config file location
2. Restart Claude Desktop completely
3. Check syntax in config file (valid JSON)

### Diagrams not opening automatically
If the desktop app doesn't open automatically:
1. **Check Installation**: Verify draw.io is installed on your system
   - Download from: https://github.com/jgraph/drawio-desktop/releases
2. **Manual Access**: Use the web viewer URL provided in the response
3. **File Location**: Check your Downloads folder for the saved `.drawio` file
4. **Alternative**: Copy the raw XML and paste into https://app.diagrams.net

### Generated XML not opening
- Ensure you saved with `.drawio` or `.xml` extension
- Try the uncompressed format first
- Validate the XML structure
- Use the web viewer URL as an alternative

### Permission errors when saving files
- Check that your Downloads folder exists and is writable
- On Windows: `%USERPROFILE%\Downloads`
- On Mac/Linux: `~/Downloads`

## Development

### Build
```bash
npm run build
```

### Watch Mode
```bash
npm run watch
```

### Testing Locally
```bash
# Build the project
npm run build

# Test with MCP Inspector
npx @modelcontextprotocol/inspector node build/index.js
```

## Contributing

Contributions welcome! Areas for enhancement:

- [ ] Natural language to diagram AI interpretation
- [ ] Additional diagram types (Gantt, org charts, mind maps)
- [ ] Import/export from other formats
- [ ] Style templates and themes
- [ ] Advanced layout algorithms
- [ ] Diagram validation and optimization

## License

MIT License - See LICENSE file for details

## Related Projects

- [draw.io](https://github.com/jgraph/drawio) - The excellent diagramming tool
- [mxGraph](https://github.com/jgraph/mxgraph) - The JavaScript diagramming library
- [lgazo/drawio-mcp-server](https://github.com/lgazo/drawio-mcp-server) - Browser-extension based MCP server

## Support

For issues, questions, or contributions, please open an issue on GitHub.
