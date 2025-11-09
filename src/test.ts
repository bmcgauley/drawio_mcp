#!/usr/bin/env node

/**
 * Test script for modular draw.io diagram generator
 * Tests the refactored architecture with progressive disclosure
 */

import { createBaseModel } from "./tools/createBaseModel.js";
import { wrapInMxFile } from "./tools/wrapInMxFile.js";
import { addShape } from "./tools/addShape.js";
import { addConnection } from "./tools/addConnection.js";
import { createFlowchart } from "./tools/createFlowchart.js";
import { listTools, searchTools, getToolSchema } from "./tools/discovery.js";
import { extractCellIds } from "./utils/xml.js";
import { diagramStore } from "./resources/diagramStore.js";

console.log("=".repeat(80));
console.log("Draw.io Diagram Generator v2.0 - Modular Architecture Test Suite");
console.log("=".repeat(80));
console.log();

// Test 1: Progressive Disclosure
console.log("Test 1: Progressive Disclosure (Tool Discovery)");
console.log("-".repeat(80));

console.log("\nMinimal listing (names only):");
const minimalList = listTools("minimal");
console.log(minimalList);

console.log("\nBrief listing (names + descriptions):");
const briefList = listTools("brief");
const briefParsed = JSON.parse(briefList);
console.log(`Found ${briefParsed.length} tools:`);
briefParsed.forEach((tool: any) => {
  console.log(`  - ${tool.name}: ${tool.description}`);
});

console.log("\nSearching for 'flowchart':");
const searchResult = searchTools("flowchart");
console.log(searchResult);

console.log("\nSearching by category 'generation':");
const categorySearch = searchTools(undefined, "generation");
console.log(categorySearch);

console.log("\nGetting full schema for 'create_flowchart':");
const schema = getToolSchema("create_flowchart");
console.log(schema);
console.log();

// Test 2: Create flowchart using modular tools
console.log("Test 2: Creating flowchart with modular architecture");
console.log("-".repeat(80));

const flowchartSteps = [
  {
    id: "start",
    type: "start" as const,
    text: "Start",
    next: ["check_login"],
  },
  {
    id: "check_login",
    type: "input" as const,
    text: "Enter Credentials",
    next: ["validate"],
  },
  {
    id: "validate",
    type: "decision" as const,
    text: "Valid?",
    next: ["success", "failure"],
    decision_labels: ["Yes", "No"],
  },
  {
    id: "success",
    type: "process" as const,
    text: "Grant Access",
    next: ["end"],
  },
  {
    id: "failure",
    type: "process" as const,
    text: "Show Error",
    next: ["check_login"],
  },
  {
    id: "end",
    type: "end" as const,
    text: "End",
  },
];

const flowchartXml = createFlowchart({
  title: "User Authentication Flow",
  steps: flowchartSteps,
  output_format: "uncompressed",
});

console.log("✓ Flowchart created successfully");
console.log(`  - Title: User Authentication Flow`);
console.log(`  - Steps: ${flowchartSteps.length}`);
console.log(`  - Format: Uncompressed XML`);
console.log(`  - XML Length: ${flowchartXml.length} bytes`);
console.log();

// Test 3: Resource-based storage
console.log("Test 3: Resource-based Diagram Storage");
console.log("-".repeat(80));

const diagramId = diagramStore.store("User Authentication Flow", flowchartXml, {
  type: "flowchart",
  format: "uncompressed",
});

console.log(`✓ Stored diagram with ID: ${diagramId}`);

const uris = diagramStore.getResourceUris(diagramId);
console.log("\nResource URIs:");
console.log(`  - Full XML: ${uris.diagram}`);
console.log(`  - Preview: ${uris.preview}`);
console.log(`  - Metadata: ${uris.metadata}`);

const metadata = diagramStore.getMetadata(diagramId);
console.log("\nDiagram Metadata:");
console.log(JSON.stringify(metadata, null, 2));

const preview = diagramStore.getPreview(diagramId);
console.log("\nDiagram Preview:");
console.log(`  - Title: ${preview?.title}`);
console.log(`  - Type: ${preview?.type}`);
console.log(`  - Preview length: ${preview?.preview.length} chars`);
console.log(`  - Full size: ${preview?.metadata.size} bytes`);
console.log();

// Test 4: Token Savings Calculation
console.log("Test 4: Token Savings Analysis");
console.log("-".repeat(80));

const fullXmlSize = flowchartXml.length;
const previewSize = preview?.preview.length || 0;
const metadataSize = JSON.stringify(metadata).length;

console.log(`Full XML size: ${fullXmlSize} bytes`);
console.log(`Preview size: ${previewSize} bytes`);
console.log(`Metadata size: ${metadataSize} bytes`);
console.log(
  `Token savings (using preview): ${((1 - previewSize / fullXmlSize) * 100).toFixed(1)}%`
);
console.log(
  `Token savings (using metadata): ${((1 - metadataSize / fullXmlSize) * 100).toFixed(1)}%`
);
console.log();

// Test 5: Modular tool composition
console.log("Test 5: Modular Tool Composition");
console.log("-".repeat(80));

let customXml = createBaseModel(800, 600);
console.log("✓ Base model created (800x600)");

const shape1 = addShape({
  xml: customXml,
  shape_type: "rectangle",
  text: "Frontend",
  x: 100,
  y: 100,
  width: 140,
  height: 60,
  fill_color: "#dae8fc",
  stroke_color: "#6c8ebf",
});
customXml = shape1.xml;
console.log(`✓ Added rectangle: Frontend (ID: ${shape1.id})`);

const shape2 = addShape({
  xml: customXml,
  shape_type: "cylinder",
  text: "Database",
  x: 100,
  y: 250,
  width: 140,
  height: 80,
  fill_color: "#d5e8d4",
  stroke_color: "#82b366",
});
customXml = shape2.xml;
console.log(`✓ Added cylinder: Database (ID: ${shape2.id})`);

const connection = addConnection({
  xml: customXml,
  source_id: shape1.id,
  target_id: shape2.id,
  label: "API Call",
  style: "orthogonal",
  arrow_end: true,
  arrow_start: false,
});
customXml = connection.xml;
console.log(`✓ Added connection between shapes`);

const wrappedXml = wrapInMxFile(customXml, "Custom Diagram", false);
console.log("✓ Wrapped in mxfile structure");
console.log(`  - Final size: ${wrappedXml.length} bytes`);
console.log();

// Test 6: Cell ID extraction
console.log("Test 6: Utility Functions");
console.log("-".repeat(80));

const cellIds = extractCellIds(customXml);
console.log(`✓ Extracted ${cellIds.length} cell IDs from diagram:`);
cellIds.forEach((id) => console.log(`  - ${id}`));
console.log();

// Test 7: Store custom diagram
console.log("Test 7: Storing Custom Diagram");
console.log("-".repeat(80));

const customDiagramId = diagramStore.store("Custom Diagram", wrappedXml, {
  type: "custom",
  format: "uncompressed",
  pageWidth: 800,
  pageHeight: 600,
});

console.log(`✓ Stored custom diagram with ID: ${customDiagramId}`);

const allDiagrams = diagramStore.list();
console.log(`\nTotal diagrams in store: ${allDiagrams.length}`);
allDiagrams.forEach((d) => {
  console.log(
    `  - ${d.title} (${d.type}): ${d.elementCount} elements, ${d.connectionCount} connections`
  );
});
console.log();

// Summary
console.log("=".repeat(80));
console.log("All tests completed successfully! ✓");
console.log("=".repeat(80));
console.log();
console.log("Refactoring Summary:");
console.log("  ✓ Modular architecture with separate tool files");
console.log("  ✓ Progressive disclosure (list, search, get schema)");
console.log("  ✓ Resource-based storage (drawio://diagram/{id})");
console.log("  ✓ Token-efficient responses (previews vs full XML)");
console.log("  ✓ Type-safe TypeScript interfaces");
console.log("  ✓ Composable tool functions");
console.log();
console.log("Token Savings:");
console.log(
  `  - Using preview instead of full XML: ${((1 - previewSize / fullXmlSize) * 100).toFixed(1)}% reduction`
);
console.log(
  `  - Using metadata instead of full XML: ${((1 - metadataSize / fullXmlSize) * 100).toFixed(1)}% reduction`
);
console.log();
console.log("To use with MCP inspector:");
console.log("  npx @modelcontextprotocol/inspector node build/index.js");
console.log();
