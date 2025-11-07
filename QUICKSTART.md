# Draw.io Diagram Generator MCP Server - Quick Start

## What Is This?

This is an MCP (Model Context Protocol) server that generates draw.io/diagrams.net XML files directly. Unlike other solutions that require browser extensions and running draw.io instances, this server creates valid XML that you can save and open immediately.

## Key Advantages

1. **No Browser Extension Required** - Pure XML generation
2. **Works Offline** - No internet connection needed  
3. **No draw.io Instance Needed** - Generate files without having draw.io open
4. **Clean, Simple API** - Easy to use tools for diagram creation
5. **Works with Any MCP Client** - Claude Desktop, Cline, Zed, etc.

## Quick Installation

### Option 1: NPM (Once Published)
```bash
npm install -g drawio-diagram-generator
```

### Option 2: From Source
```bash
# Extract the tar.gz file
tar -xzf drawio-diagram-generator.tar.gz
cd drawio-diagram-generator

# Install dependencies and build
npm install

# The build happens automatically during npm install (via prepare script)
```

## Configuration

### For Claude Desktop

Edit your `claude_desktop_config.json`:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "drawio": {
      "command": "node",
      "args": ["/absolute/path/to/drawio-diagram-generator/build/index.js"]
    }
  }
}
```

Or if installed via npm:
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

### For Cline (VS Code)

Add to MCP settings:
```json
{
  "mcpServers": {
    "drawio": {
      "command": "node",
      "args": ["/absolute/path/to/drawio-diagram-generator/build/index.js"]
    }
  }
}
```

## Basic Usage

Once configured, restart your MCP client (Claude Desktop, Cline, etc.) and you'll have access to these tools:

### 1. Create a Flowchart (Easiest)

Just ask Claude:
```
Create a flowchart for user login with these steps:
- Start
- Enter credentials
- Check if valid (decision)
- If yes, show dashboard
- If no, show error
- End
```

Claude will automatically use the `create_flowchart` tool and generate a complete, styled flowchart.

### 2. Create Custom Diagrams

Ask Claude to create any type of diagram:
```
Create a system architecture diagram showing:
- React frontend
- Node.js backend  
- PostgreSQL database
- Redis cache
Connect them appropriately
```

Claude will use `create_diagram`, then `add_shape` and `add_connection` to build your diagram.

### 3. Build Complex Diagrams

For complex diagrams, guide Claude step by step:
```
1. Create a network diagram base
2. Add a cloud shape labeled "Internet" at the top
3. Add a firewall below it
4. Add three web servers in a row
5. Add a database at the bottom
6. Connect everything appropriately
```

## Saving Generated Diagrams

Claude will provide you with XML output. To save it:

### Method 1: Copy & Paste
1. Copy the XML output from Claude
2. Save to a file with `.drawio` extension:
   ```bash
   # Save to file
   cat > my-diagram.drawio
   # Paste the XML
   # Press Ctrl+D when done
   ```

### Method 2: Direct File Creation
```bash
# Create file directly
cat > diagram.drawio << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="app.diagrams.net" ...>
...paste XML here...
</mxfile>
EOF
```

## Opening Diagrams

### Desktop App
```bash
# macOS
open diagram.drawio

# Linux  
xdg-open diagram.drawio

# Windows
start diagram.drawio
```

### Web App
1. Go to https://app.diagrams.net
2. File → Open from → Device
3. Select your `.drawio` file

### VS Code
1. Install the draw.io extension
2. Open the `.drawio` file

## Example Workflows

### Workflow 1: Quick Flowchart

**You say:**
```
Create a flowchart for password reset
```

**Claude generates:**
- Complete flowchart with proper shapes
- Color-coded elements
- Automatic layout
- Ready-to-use XML

**You do:**
- Save XML as `password-reset.drawio`
- Open in draw.io
- Optionally edit/style further
- Export to PNG/PDF if needed

### Workflow 2: Architecture Diagram

**You say:**
```
Create a microservices architecture with:
- API Gateway
- 3 services (Auth, Orders, Inventory)
- Message queue
- Database per service
```

**Claude generates:**
- Shapes for each component
- Proper connections
- Labels and styling

**You do:**
- Save and open in draw.io
- Adjust layout if needed
- Add more details
- Share with team

### Workflow 3: Network Diagram

**You say:**
```
Create a network topology for a small office with DMZ
```

**Claude generates:**
- Network components (routers, firewalls, servers)
- Proper connections
- Network segmentation

## Troubleshooting

### "Tool not found"
- Restart your MCP client completely
- Check config file path
- Verify JSON syntax (use a JSON validator)

### "Cannot find module"
- Run `npm install` in the project directory
- Run `npm run build` to recompile

### "Invalid XML"
- Use uncompressed format for debugging
- Check for special characters in text
- Verify file extension is `.drawio`

### Diagram won't open in draw.io
- Ensure file has `.drawio` extension
- Try uncompressed format first
- Check XML is complete (has closing tags)

## Advanced Usage

### Custom Colors

Use hex colors for branding:
```
Add a rectangle with:
- Fill color: #1e3a8a (dark blue)
- Stroke color: #3b82f6 (light blue)
```

### Precise Positioning

Specify exact coordinates:
```
Add shapes at these positions:
- Shape 1: x=100, y=100
- Shape 2: x=300, y=100  
- Shape 3: x=200, y=250
Then connect them
```

### Multiple Pages

Create separate diagrams and combine:
```
Create three flowcharts:
1. User registration
2. Login process
3. Password reset

Save each separately, then combine in draw.io
```

## Next Steps

1. **Read EXAMPLES.md** - See detailed examples with code
2. **Read README.md** - Full documentation
3. **Experiment** - Try different diagram types
4. **Customize** - Modify the source code for your needs

## Getting Help

- Check the documentation files
- Look at example diagrams
- Review the tool descriptions in Claude
- Test with simple diagrams first

## Key Features to Remember

✓ **No browser extension needed**
✓ **Works completely offline**
✓ **Direct XML generation**
✓ **Compatible with all MCP clients**
✓ **Multiple diagram types supported**
✓ **Incremental building possible**
✓ **Customizable styling**
✓ **Professional output**

Happy diagramming! 🎨
