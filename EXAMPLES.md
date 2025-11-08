# Draw.io Diagram Generator - Examples

This document provides practical examples of using the Draw.io Diagram Generator MCP server.

## Understanding Diagram Output

When you create any diagram, the MCP server provides **multiple ways to access it**:

### 1. 📁 Automatic File Saving
Every diagram is automatically saved to your Downloads folder:
```
📁 Saved to: /Users/username/Downloads/flowchart_1234567890.drawio
```

### 2. 🎨 Desktop App Integration
If draw.io is installed, it opens automatically:
```
🎨 Opened in draw.io desktop app
```

### 3. 🌐 Web Viewer URL
If the app isn't installed, you get a browser link:
```
💡 To view in draw.io:
   • Open the file at: /path/to/file.drawio
   • Or use this web link: https://app.diagrams.net/#R...
```

### 4. 🔗 MCP Resource
The diagram becomes an MCP resource:
```
🔗 Resource URI: diagram:///flowchart_1234567890
```

### 5. 📋 Raw XML
Complete XML is provided for manual use:
```xml
📋 Raw XML (for copy/paste):
<?xml version="1.0" encoding="UTF-8"?>
<mxfile ...>...</mxfile>
```

---

## Example 1: Basic Flowchart

### Scenario
Create a simple user registration flowchart.

### Prompt to Claude
```
Create a flowchart for user registration with these steps:
1. Start
2. User enters email and password
3. Check if email is already registered (decision)
4. If yes, show error and return to input
5. If no, create account
6. Send confirmation email
7. End
```

### Generated Call
```json
{
  "tool": "create_flowchart",
  "arguments": {
    "title": "User Registration Flow",
    "steps": [
      {
        "id": "start",
        "type": "start",
        "text": "Start",
        "next": ["input"]
      },
      {
        "id": "input",
        "type": "input",
        "text": "Enter Email & Password",
        "next": ["check"]
      },
      {
        "id": "check",
        "type": "decision",
        "text": "Email Exists?",
        "next": ["error", "create"],
        "decision_labels": ["Yes", "No"]
      },
      {
        "id": "error",
        "type": "process",
        "text": "Show Error Message",
        "next": ["input"]
      },
      {
        "id": "create",
        "type": "process",
        "text": "Create Account",
        "next": ["email"]
      },
      {
        "id": "email",
        "type": "process",
        "text": "Send Confirmation Email",
        "next": ["end"]
      },
      {
        "id": "end",
        "type": "end",
        "text": "End"
      }
    ]
  }
}
```

## Example 2: System Architecture Diagram

### Scenario
Create a three-tier web application architecture.

### Approach
Use multiple tool calls to build incrementally:

#### Step 1: Create base diagram
```json
{
  "tool": "create_diagram",
  "arguments": {
    "title": "Three-Tier Architecture",
    "description": "Web application with frontend, backend, and database layers",
    "diagram_type": "infrastructure"
  }
}
```

#### Step 2: Add frontend layer
```json
{
  "tool": "add_shape",
  "arguments": {
    "xml": "<previous_xml>",
    "shape_type": "rectangle",
    "text": "React Frontend\n(Port 3000)",
    "x": 100,
    "y": 50,
    "width": 140,
    "height": 80,
    "fill_color": "#dae8fc",
    "stroke_color": "#6c8ebf"
  }
}
```

#### Step 3: Add backend layer
```json
{
  "tool": "add_shape",
  "arguments": {
    "xml": "<previous_xml>",
    "shape_type": "rectangle",
    "text": "Node.js API\n(Port 5000)",
    "x": 100,
    "y": 200,
    "width": 140,
    "height": 80,
    "fill_color": "#d5e8d4",
    "stroke_color": "#82b366"
  }
}
```

#### Step 4: Add database layer
```json
{
  "tool": "add_shape",
  "arguments": {
    "xml": "<previous_xml>",
    "shape_type": "cylinder",
    "text": "PostgreSQL\nDatabase",
    "x": 100,
    "y": 350,
    "width": 140,
    "height": 80,
    "fill_color": "#f8cecc",
    "stroke_color": "#b85450"
  }
}
```

#### Step 5: Connect the layers
```json
{
  "tool": "add_connection",
  "arguments": {
    "xml": "<previous_xml>",
    "source_id": "cell-2",
    "target_id": "cell-3",
    "label": "HTTP/REST",
    "style": "orthogonal"
  }
}
```

```json
{
  "tool": "add_connection",
  "arguments": {
    "xml": "<previous_xml>",
    "source_id": "cell-3",
    "target_id": "cell-4",
    "label": "SQL Queries",
    "style": "orthogonal"
  }
}
```

## Example 3: Network Topology

### Scenario
Create a simple network diagram with internet, firewall, and servers.

### Prompt to Claude
```
Create a network diagram with:
- Internet (cloud shape at top)
- Firewall (rectangle)
- Load Balancer (hexagon)
- Two web servers (rectangles)
- Database server (cylinder)

Connect them in a logical topology.
```

### Tool Calls Sequence

1. **Create base**
```json
{
  "tool": "create_diagram",
  "arguments": {
    "title": "Network Topology",
    "description": "Simple web application network",
    "diagram_type": "network",
    "page_width": 800,
    "page_height": 700
  }
}
```

2. **Add Internet cloud**
```json
{
  "tool": "add_shape",
  "arguments": {
    "xml": "<xml>",
    "shape_type": "cloud",
    "text": "Internet",
    "x": 300,
    "y": 50,
    "width": 120,
    "height": 80,
    "fill_color": "#e1d5e7",
    "stroke_color": "#9673a6"
  }
}
```

3. **Add Firewall**
```json
{
  "tool": "add_shape",
  "arguments": {
    "xml": "<xml>",
    "shape_type": "rectangle",
    "text": "Firewall",
    "x": 310,
    "y": 180,
    "width": 100,
    "height": 60,
    "fill_color": "#f8cecc",
    "stroke_color": "#b85450"
  }
}
```

4. **Add Load Balancer**
```json
{
  "tool": "add_shape",
  "arguments": {
    "xml": "<xml>",
    "shape_type": "hexagon",
    "text": "Load Balancer",
    "x": 300,
    "y": 290,
    "width": 120,
    "height": 60,
    "fill_color": "#fff2cc",
    "stroke_color": "#d6b656"
  }
}
```

5. **Add Web Servers**
```json
{
  "tool": "add_shape",
  "arguments": {
    "xml": "<xml>",
    "shape_type": "rectangle",
    "text": "Web Server 1",
    "x": 200,
    "y": 400,
    "width": 100,
    "height": 60,
    "fill_color": "#dae8fc",
    "stroke_color": "#6c8ebf"
  }
}
```

```json
{
  "tool": "add_shape",
  "arguments": {
    "xml": "<xml>",
    "shape_type": "rectangle",
    "text": "Web Server 2",
    "x": 420,
    "y": 400,
    "width": 100,
    "height": 60,
    "fill_color": "#dae8fc",
    "stroke_color": "#6c8ebf"
  }
}
```

6. **Add Database**
```json
{
  "tool": "add_shape",
  "arguments": {
    "xml": "<xml>",
    "shape_type": "cylinder",
    "text": "Database",
    "x": 305,
    "y": 520,
    "width": 110,
    "height": 70,
    "fill_color": "#d5e8d4",
    "stroke_color": "#82b366"
  }
}
```

7. **Connect components** (add multiple connections)

## Example 4: Database ER Diagram

### Scenario
Create an entity-relationship diagram for a blog system.

### Approach
```json
{
  "tool": "create_diagram",
  "arguments": {
    "title": "Blog Database Schema",
    "description": "ER diagram for blog system",
    "diagram_type": "er"
  }
}
```

Then add entities as rectangles:

**Users Table**
```json
{
  "tool": "add_shape",
  "arguments": {
    "shape_type": "rectangle",
    "text": "Users\n---\nid (PK)\nemail\npassword\ncreated_at",
    "x": 100, "y": 100,
    "width": 150, "height": 120,
    "fill_color": "#dae8fc"
  }
}
```

**Posts Table**
```json
{
  "tool": "add_shape",
  "arguments": {
    "shape_type": "rectangle",
    "text": "Posts\n---\nid (PK)\nuser_id (FK)\ntitle\ncontent\npublished_at",
    "x": 350, "y": 100,
    "width": 150, "height": 140,
    "fill_color": "#dae8fc"
  }
}
```

**Comments Table**
```json
{
  "tool": "add_shape",
  "arguments": {
    "shape_type": "rectangle",
    "text": "Comments\n---\nid (PK)\npost_id (FK)\nuser_id (FK)\ncontent\ncreated_at",
    "x": 350, "y": 300,
    "width": 150, "height": 140,
    "fill_color": "#dae8fc"
  }
}
```

Then connect with labeled relationships.

## Example 5: Algorithm Flowchart

### Scenario
Visualize a binary search algorithm.

### Flowchart
```json
{
  "tool": "create_flowchart",
  "arguments": {
    "title": "Binary Search Algorithm",
    "steps": [
      {
        "id": "start",
        "type": "start",
        "text": "Start",
        "next": ["init"]
      },
      {
        "id": "init",
        "type": "process",
        "text": "Set left=0, right=n-1",
        "next": ["check"]
      },
      {
        "id": "check",
        "type": "decision",
        "text": "left <= right?",
        "next": ["calc_mid", "not_found"],
        "decision_labels": ["Yes", "No"]
      },
      {
        "id": "calc_mid",
        "type": "process",
        "text": "mid = (left + right) / 2",
        "next": ["compare"]
      },
      {
        "id": "compare",
        "type": "decision",
        "text": "arr[mid] == target?",
        "next": ["found", "check_less"],
        "decision_labels": ["Yes", "No"]
      },
      {
        "id": "check_less",
        "type": "decision",
        "text": "arr[mid] < target?",
        "next": ["go_right", "go_left"],
        "decision_labels": ["Yes", "No"]
      },
      {
        "id": "go_right",
        "type": "process",
        "text": "left = mid + 1",
        "next": ["check"]
      },
      {
        "id": "go_left",
        "type": "process",
        "text": "right = mid - 1",
        "next": ["check"]
      },
      {
        "id": "found",
        "type": "output",
        "text": "Return mid",
        "next": ["end"]
      },
      {
        "id": "not_found",
        "type": "output",
        "text": "Return -1",
        "next": ["end"]
      },
      {
        "id": "end",
        "type": "end",
        "text": "End"
      }
    ]
  }
}
```

## Tips for Complex Diagrams

### 1. Layer Your Approach
For complex diagrams, build in stages:
1. Create base structure
2. Add main components
3. Add details
4. Connect components
5. Add labels and annotations

### 2. Use Consistent Spacing
Keep spacing consistent for professional appearance:
- Vertical spacing: 100-150px between levels
- Horizontal spacing: 150-200px between items
- Grid alignment: Use multiples of 10

### 3. Color Coding
Establish a color scheme:
- **Blue** (#dae8fc): Frontend/client components
- **Green** (#d5e8d4): Backend/server components
- **Red** (#f8cecc): Security/firewall components
- **Yellow** (#fff2cc): Processing/decision points
- **Purple** (#e1d5e7): External services

### 4. Shape Selection
Choose shapes that communicate clearly:
- **Rectangles**: Standard components, services
- **Cylinders**: Databases, storage
- **Clouds**: Cloud services, internet
- **Hexagons**: Processing, load balancers
- **Rhombus**: Decisions, gateways
- **Actors**: Users, personas

### 5. Connection Labels
Add descriptive labels to connections:
- Protocol names (HTTP, TCP, SQL)
- Data flow direction
- Relationship types (1:N, N:M)
- Port numbers

## Saving and Using Generated Diagrams

### Save to File
```bash
# Copy the generated XML
cat > my-diagram.drawio << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<mxfile ...>
...
</mxfile>
EOF
```

### Open in draw.io Desktop
```bash
# macOS
open my-diagram.drawio

# Linux
xdg-open my-diagram.drawio

# Windows
start my-diagram.drawio
```

### Edit Further
Once opened in draw.io, you can:
- Adjust positioning
- Add more shapes
- Change styling
- Export to PNG/SVG/PDF
- Collaborate with others
