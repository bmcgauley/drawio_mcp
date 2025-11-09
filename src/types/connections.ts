/**
 * Connection type definitions for draw.io diagrams
 */

export type ConnectorStyle =
  | "straight"
  | "orthogonal"
  | "curved"
  | "dashed"
  | "dotted";

export interface Connection {
  id: string;
  sourceId: string;
  targetId: string;
  label?: string;
  style: ConnectorStyle;
  arrowEnd: boolean;
  arrowStart: boolean;
}

export interface AddConnectionParams {
  xml: string;
  source_id: string;
  target_id: string;
  label?: string;
  style?: ConnectorStyle;
  arrow_end?: boolean;
  arrow_start?: boolean;
}

export interface AddConnectionResult {
  xml: string;
  connection: Connection;
}

/**
 * Get the style string for a connection
 */
export function getConnectionStyle(
  style: ConnectorStyle,
  arrowEnd: boolean,
  arrowStart: boolean
): string {
  const edgeStyles: Record<ConnectorStyle, string> = {
    straight: "edgeStyle=none;",
    orthogonal:
      "edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;",
    curved:
      "edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;",
    dashed:
      "edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;dashed=1;",
    dotted:
      "edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;dashed=1;dashPattern=1 4;",
  };

  let baseStyle = edgeStyles[style];

  if (arrowEnd) {
    baseStyle += "endArrow=classic;endFill=1;";
  } else {
    baseStyle += "endArrow=none;";
  }

  if (arrowStart) {
    baseStyle += "startArrow=classic;startFill=1;";
  }

  return baseStyle;
}
