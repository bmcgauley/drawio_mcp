# Draw.io Diagram Generator MCP Server - Project Summary

## Overview

This project provides a complete MCP (Model Context Protocol) server for generating draw.io/diagrams.net XML files programmatically. Unlike existing solutions that require browser extensions and running draw.io instances, this server generates valid XML directly that can be saved and opened in any draw.io environment.

## What You Get

### Complete MCP Server Implementation
- **Language**: TypeScript/Node.js
- **Framework**: Official MCP SDK (@modelcontextprotocol/sdk)
- **Validation**: Zod schemas for type-safe inputs
- **Compression**: Support for both compressed and uncompressed XML
- **Production Ready**: Fully typed, documented, and tested

### Files Included

```
drawio-diagram-generator/
├── src/
│   └── index.ts              # Main MCP server implementation
├── build/                     # Compiled JavaScript (generated)
│   ├── index.js
│   └── test.js
├── package.json              # Project configuration
├── tsconfig.json             # TypeScript configuration  
├── README.md                 # Complete documentation
├── EXAMPLES.md               # Usage examples
├── LICENSE                   # MIT License
└── .gitignore               # Git ignore rules
```

### Delivered Files
- `drawio-diagram-generator.tar.gz` - Complete project (extract and run `npm install`)
- `QUICKSTART.md` - Quick start guide for immediate use

## Key Features

### 1. Four Powerful Tools

#### `create_flowchart`
- Generates complete flowcharts from step definitions
- Automatic shape selection based on type (start/end, process, decision, etc.)
- Smart vertical layout with proper spacing
- Color-coded shapes by type
- Support for decision branches with labels

#### `create_diagram`
- Creates base diagram structure
- Supports multiple diagram types (flowchart, UML, ER, network, etc.)
- Configurable page size
- Choice of compressed or uncompressed output

#### `add_shape`
- Add individual shapes to existing diagrams
- 10 shape types: rectangle, rounded, ellipse, rhombus, hexagon, cylinder, cloud, actor, note, swimlane
- Full styling control (colors, size, position)
- Returns shape ID for connection

#### `add_connection`
- Connect shapes with arrows/lines
- 5 connection styles: straight, orthogonal, curved, dashed, dotted
- Configurable arrows (start, end, both, none)
- Optional labels

### 2. Direct XML Generation

**No Dependencies on External Services:**
- No browser extension required
- No running draw.io instance needed
- No internet connection required
- Pure XML generation based on mxGraphModel format

**Advantages over browser-based solutions:**
- Works completely offline
- No WebSocket connection management
- No browser lifecycle issues
- Simpler deployment
- More reliable

### 3. Professional Output

**Valid draw.io XML:**
- Follows mxGraphModel specification
- Compatible with all draw.io versions
- Proper compression support
- Escaped special characters
- Complete metadata

**Opens in:**
- draw.io Desktop App (Windows, macOS, Linux)
- diagrams.net web app
- VS Code draw.io extension
- Any mxGraph-compatible viewer

## How It Works

### Architecture

```
MCP Client (Claude/Cline/Zed)
         ↓
    MCP Protocol (stdio)
         ↓
  DrawioGenerator Class
         ↓
    mxGraphModel XML
         ↓
  Compressed or Uncompressed
         ↓
   Save as .drawio file
         ↓
   Open in draw.io
```

### XML Generation Process

1. **Create Base Model**: Generates root mxGraphModel structure with default cells
2. **Add Shapes**: Inserts mxCell elements with geometry and style
3. **Add Connections**: Creates edge mxCell elements referencing source/target
4. **Wrap in mxfile**: Adds outer mxfile container with metadata
5. **Optional Compression**: Uses pako (deflate) for compressed format

### Example XML Structure

```xml
<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="app.diagrams.net" ...>
  <diagram name="My Diagram" id="diagram-1">
    <mxGraphModel dx="1394" dy="747" grid="1" ...>
      <root>
        <mxCell id="0"/>
        <mxCell id="1" parent="0"/>
        
        <!-- Shape example -->
        <mxCell id="cell-2" value="Process" 
                style="rectangle;fillColor=#ffffff;..." 
                vertex="1" parent="1">
          <mxGeometry x="100" y="100" width="120" height="60" as="geometry"/>
        </mxCell>
        
        <!-- Connection example -->
        <mxCell id="cell-3" value="Flow" 
                style="edgeStyle=orthogonalEdgeStyle;..." 
                edge="1" parent="1" 
                source="cell-2" target="cell-4">
          <mxGeometry relative="1" as="geometry"/>
        </mxCell>
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
```

## Comparison with Alternatives

| Feature | This Server | lgazo/drawio-mcp | RandomStateLabs/drawio-mcp | shafayat1004/Draw-IO-MCP |
|---------|------------|------------------|---------------------------|--------------------------|
| **Browser Extension** | ❌ Not needed | ✅ Required | ✅ Required | ❌ Not needed |
| **Running draw.io** | ❌ Not needed | ✅ Required | ✅ Required | ❌ Not needed |
| **Works Offline** | ✅ Yes | ❌ No | ❌ No | ✅ Yes |
| **Implementation** | XML Generation | Browser Control | Browser Control | File Manipulation |
| **Language** | TypeScript | TypeScript | TypeScript | C# |
| **Complexity** | Low | High | Medium | Medium |
| **Reliability** | High | Medium (WebSocket) | Medium | High |
| **Structured Flowcharts** | ✅ Full Support | ⚠️ Partial | ❌ No | ⚠️ Basic |

**Our Advantages:**
- Simpler architecture (no browser coordination)
- More reliable (no WebSocket failures)
- Easier deployment (just Node.js)
- Works in air-gapped environments
- No browser memory/resource usage

**Their Advantages:**
- Can manipulate existing diagrams in browser
- Real-time visual feedback
- Access to draw.io's full shape library

## Use Cases

### 1. Documentation Generation
- System architecture diagrams
- API flow documentation
- Database schemas
- Network topologies

### 2. Process Visualization
- Business process flows
- Algorithm flowcharts
- User journey maps
- Decision trees

### 3. Technical Diagrams
- Class diagrams (UML)
- Sequence diagrams
- Entity-relationship diagrams
- Deployment diagrams

### 4. Educational Content
- Tutorial diagrams
- Concept maps
- Organizational charts
- Timeline visualizations

### 5. Automated Diagram Generation
- CI/CD pipeline visualization
- Infrastructure as code diagrams
- Test flow generation
- Code structure visualization

## Installation & Setup

### Prerequisites
- Node.js 20.0.0 or higher
- npm or pnpm
- MCP-compatible client (Claude Desktop, Cline, Zed, etc.)

### Installation Steps

1. **Extract the archive:**
   ```bash
   tar -xzf drawio-diagram-generator.tar.gz
   cd drawio-diagram-generator
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```
   
3. **Verify build:**
   ```bash
   ls build/index.js  # Should exist
   ```

4. **Configure your MCP client** (see QUICKSTART.md)

5. **Restart your MCP client**

6. **Test it:**
   Ask Claude: "Create a simple flowchart for user login"

## Development

### Project Structure

- **src/index.ts**: Main server implementation with DrawioGenerator class
- **package.json**: Dependencies and build scripts
- **tsconfig.json**: TypeScript compiler configuration

### Key Classes

**DrawioGenerator**
- `createBaseModel()`: Generate empty mxGraphModel
- `createFlowchart()`: Generate complete flowchart
- `addShape()`: Add shape to existing diagram
- `addConnection()`: Connect two shapes
- `wrapInMxFile()`: Add mxfile wrapper
- `extractCellIds()`: Get shape IDs from XML

### Building

```bash
npm run build        # Compile TypeScript
npm run watch        # Watch mode for development
```

### Testing

```bash
# Using MCP Inspector (recommended)
npx @modelcontextprotocol/inspector node build/index.js

# Or run test script
node build/test.js
```

## Future Enhancements

Potential improvements for future versions:

1. **AI-Powered Layout**: Use LLM to optimize shape positioning
2. **More Diagram Types**: Gantt charts, mind maps, org charts
3. **Import/Export**: Convert from other formats (PlantUML, Mermaid)
4. **Templates**: Pre-built diagram templates
5. **Styling Themes**: Professional color schemes and styles
6. **Validation**: Check diagram consistency and best practices
7. **Multi-Page**: Support for multi-page diagrams
8. **Layers**: Layer management for complex diagrams
9. **Annotations**: Add notes and comments to diagrams
10. **Collaboration**: Export with sharing settings

## Technical Details

### Dependencies
- `@modelcontextprotocol/sdk`: MCP server framework
- `zod`: Input validation and type safety
- `pako`: XML compression (deflate algorithm)
- `typescript`: Type-safe development

### MCP Protocol
- **Transport**: stdio (standard input/output)
- **Message Format**: JSON-RPC 2.0
- **Capabilities**: Tools only (no resources or prompts)

### XML Format
- **Schema**: mxGraphModel (draw.io/mxGraph format)
- **Encoding**: UTF-8
- **Compression**: Optional deflate with base64
- **Compatibility**: All draw.io versions since 2005

## Best Practices

### For Users

1. **Start Simple**: Begin with flowcharts before complex diagrams
2. **Use Natural Language**: Describe what you want clearly
3. **Iterate**: Build complex diagrams incrementally
4. **Save Frequently**: Save XML output as you build
5. **Test in draw.io**: Open and verify diagrams as you create them

### For Developers

1. **Follow MCP Patterns**: Use proper tool definitions
2. **Validate Inputs**: Use Zod schemas consistently
3. **Error Handling**: Provide clear error messages
4. **Documentation**: Keep tool descriptions detailed
5. **Testing**: Test with real MCP clients

## License

MIT License - Free for commercial and personal use

## Credits

- **draw.io/diagrams.net**: Excellent open-source diagramming tool
- **mxGraph**: JavaScript diagramming library
- **Anthropic**: MCP protocol and SDK
- **Model Context Protocol**: Enabling AI-tool integration

## Support & Contribution

This is an open-source project. Contributions welcome for:
- Bug fixes
- New features
- Documentation improvements
- Example diagrams
- Test cases

## Conclusion

This MCP server provides a production-ready solution for programmatic draw.io diagram generation. Its direct XML generation approach offers simplicity, reliability, and offline capability that browser-based solutions cannot match.

Perfect for:
- ✅ Automated documentation
- ✅ CI/CD integration
- ✅ Batch diagram generation
- ✅ Air-gapped environments
- ✅ Scripted diagram creation

Get started with QUICKSTART.md and start generating diagrams!
