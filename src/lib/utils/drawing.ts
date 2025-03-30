
import { Tool } from '../types';

export const createDefaultElementForTool = (
  tool: Tool,
  startX: number,
  startY: number,
  color: string,
  strokeWidth: number
) => {
  const defaults = {
    x: startX,
    y: startY,
    width: 0,
    height: 0,
    fill: tool === 'pencil' ? 'transparent' : color,
    stroke: tool === 'pencil' ? color : '#000000',
    strokeWidth,
    opacity: 1,
  };

  switch (tool) {
    case 'rectangle':
      return {
        ...defaults,
        type: 'rectangle',
      };

    case 'ellipse':
      return {
        ...defaults,
        type: 'ellipse',
      };

    case 'diamond':
      return {
        ...defaults,
        type: 'diamond',
      };

    case 'arrow':
    case 'line':
      return {
        ...defaults,
        type: tool,
        points: [{ x: startX, y: startY }, { x: startX, y: startY }],
      };

    case 'pencil':
      return {
        ...defaults,
        type: 'pencil',
        points: [{ x: startX, y: startY }],
      };

    case 'text':
      return {
        ...defaults,
        type: 'text',
        text: 'Click to edit',
        fontSize: 18,
        width: 120,
        height: 40,
      };

    default:
      return defaults;
  }
};

export const isDrawingTool = (tool: Tool) => {
  return ['rectangle', 'ellipse', 'diamond', 'arrow', 'line', 'pencil', 'text'].includes(tool);
};
