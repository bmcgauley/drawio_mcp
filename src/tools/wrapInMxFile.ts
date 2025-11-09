/**
 * Wrap mxGraphModel in mxfile structure
 */

import { compressXml, escapeXml } from "../utils/xml.js";

/**
 * Wraps mxGraphModel in mxfile structure
 */
export function wrapInMxFile(
  graphModel: string,
  title: string = "Diagram",
  compressed: boolean = false
): string {
  const content = compressed ? compressXml(graphModel) : graphModel;
  const timestamp = new Date().toISOString();

  return `<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="app.diagrams.net" modified="${timestamp}" agent="MCP Draw.io Generator" version="24.0.0" type="device">
  <diagram name="${escapeXml(title)}" id="diagram-1">
    ${content}
  </diagram>
</mxfile>`;
}
