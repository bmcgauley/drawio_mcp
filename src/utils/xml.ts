/**
 * XML utility functions for draw.io diagrams
 */

import * as pako from "pako";

/**
 * Escapes XML special characters
 */
export function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Compresses XML using deflate (for draw.io compressed format)
 */
export function compressXml(xml: string): string {
  const compressed = pako.deflate(xml, { level: 9 });
  const base64 = Buffer.from(compressed).toString("base64");
  return base64;
}

/**
 * Creates a diagrams.net URL with embedded diagram data
 * This can be used in artifacts or opened in browser
 */
export function createDiagramsNetUrl(xml: string): string {
  const encodedXml = encodeURIComponent(xml);
  return `https://app.diagrams.net/#R${encodedXml}`;
}

/**
 * Extracts cell IDs from existing diagram XML for reference
 */
export function extractCellIds(xml: string): string[] {
  const idMatches = xml.match(/id="([^"]+)"/g);
  if (!idMatches) return [];

  return idMatches
    .map((match) => match.replace('id="', "").replace('"', ""))
    .filter((id) => id !== "0" && id !== "1"); // Exclude root cells
}

/**
 * Generates a unique cell ID
 */
let cellIdCounter = 2; // IDs 0 and 1 are reserved for root cells

export function generateCellId(): string {
  return `cell-${cellIdCounter++}`;
}

/**
 * Resets the cell ID counter (useful for testing)
 */
export function resetCellIdCounter(): void {
  cellIdCounter = 2;
}
