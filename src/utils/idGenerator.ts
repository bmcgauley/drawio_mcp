/**
 * ID generation utilities for diagrams and resources
 */

import { createHash } from "crypto";

/**
 * Generates a unique diagram ID based on title and timestamp
 */
export function generateDiagramId(title: string): string {
  const sanitized = title.replace(/[^a-z0-9]/gi, "_").toLowerCase();
  const timestamp = Date.now();
  return `${sanitized}_${timestamp}`;
}

/**
 * Generates a hash-based ID for content
 */
export function generateContentHash(content: string): string {
  return createHash("md5").update(content).digest("hex").substring(0, 12);
}

/**
 * Generates a resource URI for a diagram
 */
export function generateDiagramUri(id: string): string {
  return `drawio://diagram/${id}`;
}

/**
 * Generates a resource URI for a diagram preview
 */
export function generatePreviewUri(id: string): string {
  return `drawio://preview/${id}`;
}

/**
 * Generates a resource URI for diagram metadata
 */
export function generateMetadataUri(id: string): string {
  return `drawio://metadata/${id}`;
}

/**
 * Parses a diagram URI to extract the ID
 */
export function parseDiagramUri(uri: string): { type: string; id: string } | null {
  const match = uri.match(/^drawio:\/\/(diagram|preview|metadata)\/(.+)$/);
  if (!match) return null;
  return {
    type: match[1],
    id: match[2],
  };
}
