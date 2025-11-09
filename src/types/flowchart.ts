/**
 * Flowchart type definitions for draw.io diagrams
 */

export type FlowchartElementType =
  | "start"
  | "end"
  | "process"
  | "decision"
  | "input"
  | "output";

export interface FlowchartStep {
  id: string;
  type: FlowchartElementType;
  text: string;
  next?: string[];
  decision_labels?: string[];
}

export interface CreateFlowchartParams {
  title: string;
  steps: FlowchartStep[];
  output_format?: "uncompressed" | "compressed";
}

export interface FlowchartLayout {
  centerX: number;
  startY: number;
  verticalSpacing: number;
  horizontalSpacing: number;
}

export interface FlowchartShapeConfig {
  type: string;
  width: number;
  height: number;
  fillColor: string;
}

/**
 * Get flowchart shape configuration based on element type
 */
export function getFlowchartShapeConfig(
  type: FlowchartElementType
): FlowchartShapeConfig {
  switch (type) {
    case "start":
    case "end":
      return {
        type: "ellipse",
        width: 120,
        height: 60,
        fillColor: "#d5e8d4",
      };
    case "decision":
      return {
        type: "rhombus",
        width: 140,
        height: 90,
        fillColor: "#fff2cc",
      };
    case "input":
    case "output":
      return {
        type: "rounded",
        width: 140,
        height: 60,
        fillColor: "#dae8fc",
      };
    default: // process
      return {
        type: "rectangle",
        width: 140,
        height: 60,
        fillColor: "#ffffff",
      };
  }
}
