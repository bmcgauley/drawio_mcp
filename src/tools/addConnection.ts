/**
 * Add connection between shapes
 */

import {
  AddConnectionParams,
  AddConnectionResult,
  ConnectorStyle,
  getConnectionStyle,
} from "../types/connections.js";
import { escapeXml, generateCellId } from "../utils/xml.js";

/**
 * Adds a connection between two shapes
 */
export function addConnection(params: AddConnectionParams): AddConnectionResult {
  const {
    xml,
    source_id,
    target_id,
    label,
    style = "orthogonal",
    arrow_end = true,
    arrow_start = false,
  } = params;

  const id = generateCellId();
  const edgeStyle = getConnectionStyle(style, arrow_end, arrow_start);
  const labelAttr = label ? ` value="${escapeXml(label)}"` : "";

  const cellXml = `    <mxCell id="${id}"${labelAttr} style="${edgeStyle}" edge="1" parent="1" source="${source_id}" target="${target_id}">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>`;

  const updatedXml = xml.replace("</root>", `${cellXml}\n  </root>`);

  return {
    xml: updatedXml,
    connection: {
      id,
      sourceId: source_id,
      targetId: target_id,
      label,
      style,
      arrowEnd: arrow_end,
      arrowStart: arrow_start,
    },
  };
}
