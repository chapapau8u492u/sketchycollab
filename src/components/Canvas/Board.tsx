
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Canvas as FabricCanvas, Object as FabricObject, Rect, Circle, Path, Line, Ellipse, Textbox, TEvent } from 'fabric';
import { AppState, CanvasElement, Tool } from '@/lib/types';
import { createDefaultElementForTool, isDrawingTool } from '@/lib/utils/drawing';
import { toast } from "sonner";
import CursorOverlay from './CursorOverlay';
import { v4 as uuidv4 } from 'uuid';

interface BoardProps {
  state: AppState;
  updateUserCursor: (userId: string, x: number, y: number) => void;
  addElement: (element: Partial<CanvasElement>) => any;
  updateElement: (id: string, changes: Partial<CanvasElement>) => void;
  removeElement: (id: string) => void;
  selectElement: (id: string | null) => void;
  collaboration: {
    broadcastCursorPosition: (x: number, y: number) => void;
    broadcastAddElement: (element: CanvasElement) => void;
    broadcastUpdateElement: (id: string, changes: Partial<CanvasElement>) => void;
    broadcastRemoveElement: (id: string) => void;
  };
}

// Extend FabricObject to include custom properties
interface ExtendedFabricObject extends FabricObject {
  data?: {
    id: string;
    [key: string]: any;
  };
}

const Board: React.FC<BoardProps> = ({
  state,
  updateUserCursor,
  addElement,
  updateElement,
  removeElement,
  selectElement,
  collaboration,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<FabricCanvas | null>(null);
  const isDrawingRef = useRef(false);
  const currentElementRef = useRef<string | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const userId = useRef(uuidv4()).current;

  // Initialize canvas on mount
  useEffect(() => {
    if (!canvasRef.current) return;

    // Create fabric canvas instance
    const canvas = new FabricCanvas(canvasRef.current, {
      width: canvasSize.width,
      height: canvasSize.height,
      backgroundColor: '#ffffff',
      selection: state.tool === 'select',
      preserveObjectStacking: true,
    });

    fabricRef.current = canvas;

    // Set up event listeners
    canvas.on('mouse:down', handleMouseDown);
    canvas.on('mouse:move', handleMouseMove);
    canvas.on('mouse:up', handleMouseUp);
    canvas.on('selection:created', handleSelection);
    canvas.on('selection:updated', handleSelection);
    canvas.on('selection:cleared', handleSelectionCleared);
    canvas.on('object:modified', handleObjectModified);

    // Handle window resize
    const handleResize = () => {
      setCanvasSize({ width: window.innerWidth, height: window.innerHeight });
      canvas.setDimensions({ width: window.innerWidth, height: window.innerHeight });
      canvas.renderAll();
    };

    window.addEventListener('resize', handleResize);

    // Clean up
    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.dispose();
    };
  }, []);

  // Update canvas properties when tool changes
  useEffect(() => {
    if (!fabricRef.current) return;
    
    fabricRef.current.isDrawingMode = state.tool === 'pencil';
    fabricRef.current.selection = state.tool === 'select';
    
    if (state.tool === 'pencil' && fabricRef.current.freeDrawingBrush) {
      fabricRef.current.freeDrawingBrush.color = state.color;
      fabricRef.current.freeDrawingBrush.width = state.strokeWidth;
    }
    
    // Change cursor based on tool
    if (state.tool === 'hand') {
      fabricRef.current.defaultCursor = 'grab';
      fabricRef.current.hoverCursor = 'grab';
    } else if (state.tool === 'eraser') {
      fabricRef.current.defaultCursor = 'url(data:image/svg+xml;utf8,<svg width="24" height="24" xmlns="http://www.w3.org/2000/svg"><rect stroke="black" fill="white" x="0" y="0" width="14" height="14"/></svg>) 7 7, auto';
    } else {
      fabricRef.current.defaultCursor = 'default';
      fabricRef.current.hoverCursor = 'move';
    }

    fabricRef.current.renderAll();
  }, [state.tool, state.color, state.strokeWidth]);

  // Track mouse for collaboration
  const handleMouseMove = useCallback((e: TEvent) => {
    if (!fabricRef.current || !e.pointer) return;

    const { x, y } = e.pointer;
    updateUserCursor(userId, x, y);
    collaboration.broadcastCursorPosition(x, y);
    
    if (isDrawingRef.current && currentElementRef.current) {
      if (state.tool === 'pencil') {
        // Pencil drawing is handled by fabric.js
      } else if (['line', 'arrow'].includes(state.tool)) {
        const obj = fabricRef.current.getObjects().find(
          obj => (obj as ExtendedFabricObject).data?.id === currentElementRef.current
        ) as Line;
        
        if (obj) {
          obj.set({
            x2: x,
            y2: y
          });
          fabricRef.current.renderAll();
        }
      } else if (state.tool === 'rectangle' || state.tool === 'ellipse' || state.tool === 'diamond') {
        const obj = fabricRef.current.getObjects().find(
          obj => (obj as ExtendedFabricObject).data?.id === currentElementRef.current
        ) as FabricObject;
        
        if (obj) {
          const startX = obj.left!;
          const startY = obj.top!;
          const width = x - startX;
          const height = y - startY;
          
          obj.set({
            width: Math.abs(width),
            height: Math.abs(height),
            left: width > 0 ? startX : x,
            top: height > 0 ? startY : y
          });
          
          fabricRef.current.renderAll();
        }
      }
    }
  }, [state.tool, updateUserCursor, userId, collaboration]);

  const handleMouseDown = useCallback((e: TEvent) => {
    if (!fabricRef.current || !e.pointer) return;
    
    const { x, y } = e.pointer;
    
    isDrawingRef.current = isDrawingTool(state.tool);
    
    if (isDrawingRef.current) {
      const element = createDefaultElementForTool(
        state.tool,
        x,
        y,
        state.color,
        state.strokeWidth
      );
      
      const newElement = addElement(element);
      currentElementRef.current = newElement.id;
      
      if (state.tool === 'rectangle') {
        const rect = new Rect({
          left: x,
          top: y,
          width: 0,
          height: 0,
          fill: element.fill,
          stroke: element.stroke,
          strokeWidth: element.strokeWidth,
          data: { id: newElement.id },
          selectable: false
        });
        fabricRef.current.add(rect);
      } else if (state.tool === 'diamond') {
        // For diamond, we'll use a polygon with 4 points
        const rect = new Rect({
          left: x,
          top: y,
          width: 0,
          height: 0,
          fill: element.fill,
          stroke: element.stroke,
          strokeWidth: element.strokeWidth,
          angle: 45, // Rotate 45 degrees to make it a diamond
          data: { id: newElement.id },
          selectable: false
        });
        fabricRef.current.add(rect);
      } else if (state.tool === 'ellipse') {
        const ellipse = new Ellipse({
          left: x,
          top: y,
          rx: 0,
          ry: 0,
          fill: element.fill,
          stroke: element.stroke,
          strokeWidth: element.strokeWidth,
          data: { id: newElement.id },
          selectable: false
        });
        fabricRef.current.add(ellipse);
      } else if (['line', 'arrow'].includes(state.tool)) {
        const line = new Line([x, y, x, y], {
          stroke: element.stroke,
          strokeWidth: element.strokeWidth,
          data: { id: newElement.id },
          selectable: false
        });
        fabricRef.current.add(line);
      } else if (state.tool === 'text') {
        const textbox = new Textbox('Click to edit', {
          left: x,
          top: y,
          fontSize: element.fontSize || 18,
          fill: element.fill,
          width: element.width,
          data: { id: newElement.id },
          editable: true
        });
        fabricRef.current.add(textbox);
      }
    } else if (state.tool === 'eraser') {
      const target = fabricRef.current.findTarget(e.e as MouseEvent);
      if (target && (target as ExtendedFabricObject).data?.id) {
        removeElement((target as ExtendedFabricObject).data!.id);
        fabricRef.current.remove(target);
        collaboration.broadcastRemoveElement((target as ExtendedFabricObject).data!.id);
      }
    }
  }, [state.tool, state.color, state.strokeWidth, addElement, removeElement, collaboration]);

  const handleMouseUp = useCallback(() => {
    if (!fabricRef.current) return;
    
    isDrawingRef.current = false;
    
    if (currentElementRef.current) {
      const obj = fabricRef.current.getObjects().find(
        obj => (obj as ExtendedFabricObject).data?.id === currentElementRef.current
      ) as ExtendedFabricObject;
      
      if (obj) {
        obj.set({ selectable: state.tool === 'select' });
        
        // Broadcast the created element
        const element = {
          id: obj.data!.id,
          type: state.tool as Tool,
          x: obj.left || 0,
          y: obj.top || 0,
          width: obj.width || 0,
          height: obj.height || 0,
          fill: obj.fill as string,
          stroke: obj.stroke as string,
          strokeWidth: obj.strokeWidth || 1,
          opacity: obj.opacity || 1,
        };
        
        collaboration.broadcastAddElement(element as CanvasElement);
      }
      
      currentElementRef.current = null;
    }
  }, [state.tool, collaboration]);

  const handleSelection = useCallback((e: TEvent) => {
    if (!e.selected || !e.selected.length) return;
    
    const selected = e.selected[0] as ExtendedFabricObject;
    if (selected.data?.id) {
      selectElement(selected.data.id);
    }
  }, [selectElement]);

  const handleSelectionCleared = useCallback(() => {
    selectElement(null);
  }, [selectElement]);

  const handleObjectModified = useCallback((e: TEvent) => {
    if (!e.target) return;
    
    const obj = e.target as ExtendedFabricObject;
    if (!obj || !obj.data?.id) return;
    
    const changes = {
      x: obj.left || 0,
      y: obj.top || 0,
      width: obj.width || 0,
      height: obj.height || 0,
    };
    
    updateElement(obj.data.id, changes);
    collaboration.broadcastUpdateElement(obj.data.id, changes);
  }, [updateElement, collaboration]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-[url('/grid.svg')]">
      <canvas ref={canvasRef} className="absolute inset-0" />
      <CursorOverlay users={state.users} currentUserId={userId} />
    </div>
  );
};

export default Board;
