
import { Tool, CanvasElement } from "../types";
import { SpreadableObject } from "../custom-types";

export const isDrawingTool = (tool: Tool): boolean => {
  return [
    'rectangle', 
    'diamond',
    'ellipse', 
    'arrow', 
    'line', 
    'pencil', 
    'text',
    'triangle',
    'hexagon'
  ].includes(tool);
};

export const createDefaultElementForTool = (
  tool: Tool,
  x: number,
  y: number,
  color: string,
  strokeWidth: number
): Partial<CanvasElement> => {
  const defaultElement: Partial<CanvasElement> = {
    x,
    y,
    width: 100,
    height: 100,
    fill: color,
    stroke: color,
    strokeWidth,
    opacity: 1
  };

  switch (tool) {
    case 'rectangle':
    case 'diamond':
    case 'ellipse':
    case 'triangle':
    case 'hexagon':
      return {
        ...defaultElement,
        type: tool
      };
    case 'arrow':
    case 'line':
      return {
        ...defaultElement,
        fill: 'transparent',
        type: tool
      };
    case 'pencil':
      return {
        ...defaultElement,
        fill: 'transparent',
        points: [{ x, y }],
        type: tool
      };
    case 'text':
      return {
        ...defaultElement,
        text: '',
        fontSize: 18,
        width: 150,
        height: 50,
        type: tool
      };
    default:
      return defaultElement;
  }
};

// Helper function to safely spread objects
export const safeSpread = (obj: any): SpreadableObject => {
  if (!obj || typeof obj !== 'object') {
    return {};
  }
  return obj as SpreadableObject;
};
