# Draw.io MCP v2.0 Quick Start

## What's New

**Version 2.0** adds progressive disclosure and resource-based storage for **85-92% token reduction**!

## Installation (Unchanged)

```bash
cd drawio_mcp
npm install
npm run build
```

## Basic Usage (100% Compatible)

All existing tools work identically:

```javascript
// Create flowchart (unchanged)
const result = await call_tool("create_flowchart", {
  title: "My Process",
  steps: [
    { id: "start", type: "start", text: "Start", next: ["end"] },
    { id: "end", type: "end", text: "End" }
  ]
});
```

## New Features (Optional)

### 1. Progressive Disclosure (80-90% token savings)

```javascript
// List tools (200 bytes vs 10KB)
const tools = await call_tool("drawio_list_tools", {
  detail_level: "minimal"
});

// Search for what you need
const flowchartTools = await call_tool("drawio_search_tools", {
  query: "flowchart"
});

// Get schema on demand
const schema = await call_tool("drawio_get_tool_schema", {
  tool_name: "create_flowchart"
});
```

### 2. Resource-Based Access (85.6-91.8% token savings)

```javascript
// Create diagram - returns URIs
const result = await call_tool("create_flowchart", { ... });

// Access preview (500 bytes vs 3.5KB)
const preview = await read_resource(result.resource_uris.preview);

// Get full XML only when needed
const xml = await read_resource(result.resource_uris.diagram);
```

## Token Savings

| Approach | Size | Savings |
|----------|------|---------|
| Full XML | 3,472 bytes | 0% |
| Preview | 500 bytes | **85.6%** |
| Metadata | 283 bytes | **91.8%** |

## Testing

```bash
# Run comprehensive test suite
npm run build
node build/test.js

# Expected output:
# ✓ Progressive disclosure
# ✓ Flowchart creation  
# ✓ Resource storage
# ✓ Token savings: 85.6-91.8%
# ✓ All tests passing
```

## Documentation

- **REFACTORING-SUMMARY.md** - Implementation overview
- **ARCHITECTURE.md** - Technical architecture (28KB)
- **MIGRATION-GUIDE.md** - Detailed migration guide (16KB)
- **REFACTORING-REPORT.md** - Complete project report

## No Breaking Changes!

All existing code continues to work. New features are opt-in.

## Questions?

See **MIGRATION-GUIDE.md** for:
- 12 FAQ answers
- 5 detailed code examples
- 4 migration paths
- Rollback instructions

**Version**: 2.0.0
**Status**: Production-ready ✅
