/**
 * General diagram type definitions
 */

export type DiagramType =
  | "flowchart"
  | "sequence"
  | "class"
  | "er"
  | "network"
  | "infrastructure"
  | "custom";

export type OutputFormat = "uncompressed" | "compressed";

export interface CreateDiagramParams {
  title: string;
  description: string;
  diagram_type: DiagramType;
  output_format?: OutputFormat;
  page_width?: number;
  page_height?: number;
}

export interface DiagramMetadata {
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

export interface DiagramPreview {
  id: string;
  title: string;
  type: DiagramType;
  preview: string; // First 500 chars of XML
  metadata: DiagramMetadata;
}

export interface SaveDiagramParams {
  xml: string;
  title: string;
}

export interface SaveDiagramResult {
  filePath: string;
  resourceUri: string;
}
