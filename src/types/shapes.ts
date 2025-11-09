/**
 * Shape type definitions for draw.io diagrams
 */

export type ShapeType =
  | "rectangle"
  | "rounded"
  | "ellipse"
  | "rhombus"
  | "hexagon"
  | "cylinder"
  | "cloud"
  | "actor"
  | "note"
  | "swimlane";

export interface ShapeStyle {
  fillColor: string;
  strokeColor: string;
  style: string;
}

export interface ShapePosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Shape {
  id: string;
  type: ShapeType;
  text: string;
  position: ShapePosition;
  style: ShapeStyle;
}

export interface AddShapeParams {
  xml: string;
  shape_type: ShapeType;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fill_color?: string;
  stroke_color?: string;
}

export interface AddShapeResult {
  xml: string;
  id: string;
  shape: Shape;
}

/**
 * Get the style string for a shape type
 */
export function getShapeStyle(
  shapeType: ShapeType,
  fillColor: string,
  strokeColor: string
): string {
  const baseStyle = `fillColor=${fillColor};strokeColor=${strokeColor};`;

  const shapeStyles: Record<ShapeType, string> = {
    rectangle: `${baseStyle}whiteSpace=wrap;html=1;`,
    rounded: `${baseStyle}rounded=1;whiteSpace=wrap;html=1;`,
    ellipse: `${baseStyle}ellipse;whiteSpace=wrap;html=1;`,
    rhombus: `${baseStyle}rhombus;whiteSpace=wrap;html=1;`,
    hexagon: `${baseStyle}shape=hexagon;perimeter=hexagonPerimeter2;whiteSpace=wrap;html=1;`,
    cylinder: `${baseStyle}shape=cylinder;whiteSpace=wrap;html=1;`,
    cloud: `${baseStyle}ellipse;shape=cloud;whiteSpace=wrap;html=1;`,
    actor: `${baseStyle}shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;`,
    note: `${baseStyle}shape=note;whiteSpace=wrap;html=1;size=20;`,
    swimlane: `${baseStyle}swimlane;whiteSpace=wrap;html=1;startSize=23;`,
  };

  return shapeStyles[shapeType];
}
