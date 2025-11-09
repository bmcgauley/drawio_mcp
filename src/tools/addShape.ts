/**
 * Add shape to diagram
 */

import { AddShapeParams, AddShapeResult, getShapeStyle } from "../types/shapes.js";
import { escapeXml, generateCellId } from "../utils/xml.js";

/**
 * Adds a shape to existing diagram XML
 */
export function addShape(params: AddShapeParams): AddShapeResult {
  const {
    xml,
    shape_type,
    text,
    x,
    y,
    width,
    height,
    fill_color = "#ffffff",
    stroke_color = "#000000",
  } = params;

  const id = generateCellId();
  const style = getShapeStyle(shape_type, fill_color, stroke_color);

  const cellXml = `    <mxCell id="${id}" value="${escapeXml(text)}" style="${style}" vertex="1" parent="1">
      <mxGeometry x="${x}" y="${y}" width="${width}" height="${height}" as="geometry"/>
    </mxCell>`;

  // Insert before closing </root> tag
  const updatedXml = xml.replace("</root>", `${cellXml}\n  </root>`);

  return {
    xml: updatedXml,
    id,
    shape: {
      id,
      type: shape_type,
      text,
      position: { x, y, width, height },
      style: { fillColor: fill_color, strokeColor: stroke_color, style },
    },
  };
}
