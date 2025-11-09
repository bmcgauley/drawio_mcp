/**
 * Create complete flowchart diagram
 */

import {
  CreateFlowchartParams,
  FlowchartStep,
  getFlowchartShapeConfig,
} from "../types/flowchart.js";
import { createBaseModel } from "./createBaseModel.js";
import { addShape } from "./addShape.js";
import { addConnection } from "./addConnection.js";
import { wrapInMxFile } from "./wrapInMxFile.js";
import { ShapeType } from "../types/shapes.js";

interface ShapePosition {
  x: number;
  y: number;
}

/**
 * Creates a complete flowchart from step definitions
 */
export function createFlowchart(params: CreateFlowchartParams): string {
  const { title, steps, output_format = "uncompressed" } = params;

  let xml = createBaseModel(1400, 1200); // Larger canvas for branches

  // Layout configuration
  const centerX = 700;
  const startY = 80;
  const verticalSpacing = 140;
  const horizontalSpacing = 280;

  // Map to store shape IDs and positions
  const shapeIds: Record<string, string> = {};
  const shapePositions: Record<string, ShapePosition> = {};

  // Simple layout: position each step vertically in order
  steps.forEach((step, index) => {
    shapePositions[step.id] = {
      x: centerX,
      y: startY + index * verticalSpacing,
    };
  });

  // Adjust horizontal positions for decision branches
  steps.forEach((step) => {
    if (step.type === "decision" && step.next && step.next.length > 1) {
      const branchCount = step.next.length;

      // Spread branches horizontally
      step.next.forEach((nextId, branchIndex) => {
        const targetPos = shapePositions[nextId];
        if (targetPos) {
          // Position branches left and right of center
          if (branchCount === 2) {
            // For binary decisions: left = no (0), right = yes (1)
            targetPos.x =
              centerX +
              (branchIndex === 0 ? -horizontalSpacing : horizontalSpacing);
          } else {
            // For multi-way branches: spread evenly
            const totalWidth = (branchCount - 1) * horizontalSpacing;
            const startOffset = -totalWidth / 2;
            targetPos.x =
              centerX + startOffset + branchIndex * horizontalSpacing;
          }
        }
      });
    }
  });

  // Add shapes with calculated positions
  steps.forEach((step) => {
    const pos = shapePositions[step.id] || { x: centerX, y: startY };
    const config = getFlowchartShapeConfig(step.type);

    const result = addShape({
      xml,
      shape_type: config.type as ShapeType,
      text: step.text,
      x: pos.x,
      y: pos.y,
      width: config.width,
      height: config.height,
      fill_color: config.fillColor,
      stroke_color: "#000000",
    });

    xml = result.xml;
    shapeIds[step.id] = result.id;
  });

  // Add connections
  steps.forEach((step) => {
    if (step.next && step.next.length > 0) {
      const sourceId = shapeIds[step.id];

      step.next.forEach((nextId, branchIndex) => {
        const targetId = shapeIds[nextId];
        if (targetId) {
          const label = step.decision_labels?.[branchIndex];
          const result = addConnection({
            xml,
            source_id: sourceId,
            target_id: targetId,
            label,
            style: "orthogonal",
            arrow_end: true,
            arrow_start: false,
          });
          xml = result.xml;
        }
      });
    }
  });

  return wrapInMxFile(xml, title, output_format === "compressed");
}
