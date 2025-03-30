import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  Canvas as FabricCanvas, 
  Object as FabricObject, 
  Rect, 
  Circle, 
  Path, 
  Line, 
  Ellipse, 
  Textbox, 
  TPointerEventInfo,
  ModifiedEvent,
  ObjectEvents,
  FabricObjectProps,
  SerializedObjectProps,
  Point
} from 'fabric';
import { AppState, CanvasElement, Tool } from '@/lib/types';
import { createDefaultElementForTool, isDrawingTool } from '@/lib/utils/drawing';
import { toast } from "sonner";
import CursorOverlay from './CursorOverlay';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client';

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

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: canvasSize.width,
      height: canvasSize.height,
      backgroundColor: '#ffffff',
      selection: state.tool === 'select',
      preserveObjectStacking: true,
    });

    fabricRef.current = canvas;

    canvas.on('mouse:down', handleMouseDown);
    canvas.on('mouse:move', handleMouseMove);
    canvas.on('mouse:up', handleMouseUp);
    canvas.on('selection:created', handleSelection);
    canvas.on('selection:updated', handleSelection);
    canvas.on('selection:cleared', handleSelectionCleared);
    canvas.on('object:modified', handleObjectModified);

    const handleResize = () => {
      setCanvasSize({ width: window.innerWidth, height: window.innerHeight });
      canvas.setDimensions({ width: window.innerWidth, height: window.innerHeight });
      canvas.renderAll();
    };

    window.addEventListener('resize', handleResize);

    // Initialize brush properties
    if (canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.color = state.color;
      canvas.freeDrawingBrush.width = state.strokeWidth;
    }

    // If there's a room ID, load saved elements
    if (state.roomId) {
      loadBoardElements(state.roomId);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.dispose();
    };
  }, []);

  // Update canvas settings when tool or color changes
  useEffect(() => {
    if (!fabricRef.current) return;
    
    fabricRef.current.isDrawingMode = state.tool === 'pencil';
    fabricRef.current.selection = state.tool === 'select';
    
    if (state.tool === 'pencil' && fabricRef.current.freeDrawingBrush) {
      fabricRef.current.freeDrawingBrush.color = state.color;
      fabricRef.current.freeDrawingBrush.width = state.strokeWidth;
    }
    
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

  // Subscribe to real-time updates when room ID changes
  useEffect(() => {
    if (!state.roomId) return;
    
    // Subscribe to board_objects changes
    const channel = supabase
      .channel(`board-${state.roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'board_objects',
          filter: `board_id=eq.${state.roomId}`
        },
        (payload) => {
          console.log('Database change received:', payload);
          
          if (payload.eventType === 'INSERT') {
            handleRemoteElementAdded(payload.new);
          } else if (payload.eventType === 'UPDATE') {
            handleRemoteElementUpdated(payload.new);
          } else if (payload.eventType === 'DELETE') {
            handleRemoteElementRemoved(payload.old);
          }
        }
      )
      .subscribe();
      
    // Load elements when room ID changes
    loadBoardElements(state.roomId);
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [state.roomId]);

  // Load board elements from database
  const loadBoardElements = async (boardId: string) => {
    try {
      const { data, error } = await supabase
        .from('board_objects')
        .select('*')
        .eq('board_id', boardId);
        
      if (error) {
        console.error('Error loading board elements:', error);
        return;
      }
      
      if (data && data.length > 0) {
        // Clear current canvas
        if (fabricRef.current) {
          fabricRef.current.clear();
        }
        
        // Add each element to the canvas
        data.forEach(obj => {
          const element = obj.data as CanvasElement;
          addElementToCanvas(element);
        });
      }
    } catch (err) {
      console.error('Failed to load board elements:', err);
    }
  };

  // Add element to canvas
  const addElementToCanvas = (element: CanvasElement) => {
    if (!fabricRef.current) return;
    
    let obj: FabricObject | null = null;
    
    switch (element.type) {
      case 'rectangle':
        obj = new Rect({
          left: element.x,
          top: element.y,
          width: element.width,
          height: element.height,
          fill: element.fill,
          stroke: element.stroke,
          strokeWidth: element.strokeWidth,
          data: { id: element.id },
          selectable: state.tool === 'select'
        });
        break;
        
      case 'diamond':
        obj = new Rect({
          left: element.x,
          top: element.y,
          width: element.width,
          height: element.height,
          fill: element.fill,
          stroke: element.stroke,
          strokeWidth: element.strokeWidth,
          angle: 45,
          data: { id: element.id },
          selectable: state.tool === 'select'
        });
        break;
        
      case 'ellipse':
        obj = new Ellipse({
          left: element.x,
          top: element.y,
          rx: element.width / 2,
          ry: element.height / 2,
          fill: element.fill,
          stroke: element.stroke,
          strokeWidth: element.strokeWidth,
          data: { id: element.id },
          selectable: state.tool === 'select'
        });
        break;
        
      case 'triangle':
        obj = new Path.fromObject({
          path: [
            { x: element.x + element.width / 2, y: element.y },
            { x: element.x, y: element.y + element.height },
            { x: element.x + element.width, y: element.y + element.height },
          ],
          left: element.x,
          top: element.y,
          width: element.width,
          height: element.height,
          fill: element.fill,
          stroke: element.stroke,
          strokeWidth: element.strokeWidth,
          data: { id: element.id },
          selectable: state.tool === 'select'
        });
        break;
        
      case 'hexagon':
        const hexPoints = [];
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i;
          const x = element.width / 2 * Math.cos(angle) + element.x + element.width / 2;
          const y = element.width / 2 * Math.sin(angle) + element.y + element.height / 2;
          hexPoints.push({ x, y });
        }
        
        // Create the path for the hexagon
        const pathData = hexPoints.map((p, i) => 
          i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`
        ).join(' ') + ' Z';
        
        obj = new Path(pathData, {
          left: element.x,
          top: element.y,
          width: element.width,
          height: element.height,
          fill: element.fill,
          stroke: element.stroke,
          strokeWidth: element.strokeWidth,
          data: { id: element.id },
          selectable: state.tool === 'select'
        });
        break;
        
      case 'line':
      case 'arrow':
        obj = new Line([0, 0, element.width, element.height], {
          left: element.x,
          top: element.y,
          stroke: element.stroke,
          strokeWidth: element.strokeWidth,
          data: { id: element.id },
          selectable: state.tool === 'select'
        });
        break;
        
      case 'text':
        obj = new Textbox(element.text || 'Text', {
          left: element.x,
          top: element.y,
          width: element.width,
          fontSize: element.fontSize || 18,
          fill: element.fill,
          data: { id: element.id },
          selectable: state.tool === 'select',
          editable: state.tool === 'select'
        });
        break;
    }
    
    if (obj) {
      fabricRef.current.add(obj);
      fabricRef.current.renderAll();
    }
  };

  // Handle remote element changes
  const handleRemoteElementAdded = (data: any) => {
    const element = data.data as CanvasElement;
    addElementToCanvas(element);
    addElement(element);
  };
  
  const handleRemoteElementUpdated = (data: any) => {
    const element = data.data as CanvasElement;
    
    if (fabricRef.current) {
      const objects = fabricRef.current.getObjects();
      const obj = objects.find(o => (o as ExtendedFabricObject).data?.id === element.id);
      
      if (obj) {
        obj.set({
          left: element.x,
          top: element.y,
          width: element.width,
          height: element.height,
        });
        
        if (obj instanceof Textbox && element.text) {
          obj.set({
            text: element.text,
            fontSize: element.fontSize
          });
        }
        
        fabricRef.current.renderAll();
      }
    }
    
    updateElement(element.id, element);
  };
  
  const handleRemoteElementRemoved = (data: any) => {
    const elementId = data.id;
    
    if (fabricRef.current) {
      const objects = fabricRef.current.getObjects();
      const obj = objects.find(o => (o as ExtendedFabricObject).data?.id === elementId);
      
      if (obj) {
        fabricRef.current.remove(obj);
        fabricRef.current.renderAll();
      }
    }
    
    removeElement(elementId);
  };

  // Handle mouse events
  const handleMouseMove = useCallback((opt: TPointerEventInfo) => {
    if (!fabricRef.current || !opt.pointer) return;

    const { x, y } = opt.pointer;
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
          const points = [0, 0, x - obj.left!, y - obj.top!];
          obj.set({ width: x - obj.left!, height: y - obj.top! });
          obj.setCoords();
          fabricRef.current.renderAll();
        }
      } else if (state.tool === 'rectangle' || state.tool === 'ellipse' || state.tool === 'diamond'
                || state.tool === 'triangle' || state.tool === 'hexagon') {
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
          
          if (obj instanceof Ellipse) {
            obj.set({
              rx: Math.abs(width) / 2,
              ry: Math.abs(height) / 2
            });
          }
          
          obj.setCoords();
          fabricRef.current.renderAll();
        }
      }
    }
  }, [state.tool, updateUserCursor, userId, collaboration]);

  const handleMouseDown = useCallback((opt: TPointerEventInfo) => {
    if (!fabricRef.current || !opt.pointer) return;
    
    const { x, y } = opt.pointer;
    
    // Check if user has write permission (if in a shared board)
    if (state.roomId) {
      const permission = state.userPermissions[userId] || 'write'; // Default to write if not specified
      if (permission === 'read' && state.tool !== 'hand' && state.tool !== 'select') {
        toast.error("You only have read permission for this board");
        return;
      }
    }
    
    isDrawingRef.current = isDrawingTool(state.tool);
    
    if (isDrawingRef.current) {
      const element = createDefaultElementForTool(
        state.tool,
        x,
        y,
        state.color,
        state.strokeWidth
      );
      
      const newElement = addElement(element as Partial<CanvasElement>);
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
        const rect = new Rect({
          left: x,
          top: y,
          width: 0,
          height: 0,
          fill: element.fill,
          stroke: element.stroke,
          strokeWidth: element.strokeWidth,
          angle: 45,
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
      } else if (state.tool === 'triangle') {
        // Create a triangle path
        const path = `M ${x} ${y} L ${x} ${y} L ${x} ${y} Z`;
        const triangle = new Path(path, {
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
        fabricRef.current.add(triangle);
      } else if (state.tool === 'hexagon') {
        // Create a hexagon path (circle initially)
        const path = new Path(`M ${x} ${y} L ${x} ${y} Z`, {
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
        fabricRef.current.add(path);
      } else if (['line', 'arrow'].includes(state.tool)) {
        const line = new Line([0, 0, 0, 0], {
          left: x,
          top: y,
          stroke: element.stroke,
          strokeWidth: element.strokeWidth,
          data: { id: newElement.id },
          selectable: false
        });
        fabricRef.current.add(line);
      } else if (state.tool === 'text') {
        const fontSize = (element as any).fontSize || 18;
        const textbox = new Textbox('Click to edit', {
          left: x,
          top: y,
          fontSize: fontSize,
          fill: element.fill,
          width: element.width,
          data: { id: newElement.id },
          editable: true
        });
        fabricRef.current.add(textbox);
      }
    } else if (state.tool === 'eraser') {
      // Fix: Call findTarget with only the event parameter
      const target = fabricRef.current.findTarget(opt.e as MouseEvent);
      if (target && (target as ExtendedFabricObject).data?.id) {
        const elementId = (target as ExtendedFabricObject).data!.id;
        
        // Delete from database if in a room
        if (state.roomId) {
          deleteElementFromDatabase(elementId);
        }
        
        removeElement(elementId);
        fabricRef.current.remove(target);
        collaboration.broadcastRemoveElement(elementId);
      }
    } else if (state.tool === 'hand' && fabricRef.current) {
      fabricRef.current.relativePan({ x: 10, y: 10 } as Point); // Added type assertion here
    }
  }, [state.tool, state.color, state.strokeWidth, addElement, removeElement, collaboration, state.roomId, state.userPermissions]);

  const handleMouseUp = useCallback(() => {
    if (!fabricRef.current) return;
    
    isDrawingRef.current = false;
    
    if (currentElementRef.current) {
      const obj = fabricRef.current.getObjects().find(
        obj => (obj as ExtendedFabricObject).data?.id === currentElementRef.current
      ) as ExtendedFabricObject;
      
      if (obj) {
        obj.set({ selectable: state.tool === 'select' });
        
        // Create element to broadcast
        const elementType = state.tool;
        const element: CanvasElement = {
          id: obj.data!.id,
          type: elementType,
          x: obj.left || 0,
          y: obj.top || 0,
          width: obj.width || 0,
          height: obj.height || 0,
          fill: obj.fill as string,
          stroke: obj.stroke as string,
          strokeWidth: obj.strokeWidth || 1,
          opacity: obj.opacity || 1,
        };
        
        // If text, save the text content
        if (obj instanceof Textbox) {
          element.text = obj.text;
          element.fontSize = obj.fontSize;
        }
        
        // Save to database if in a room
        if (state.roomId) {
          saveElementToDatabase(state.roomId, element);
        }
        
        collaboration.broadcastAddElement(element);
      }
      
      currentElementRef.current = null;
    }
  }, [state.tool, collaboration, state.roomId]);

  // Save and delete elements to/from database
  const saveElementToDatabase = async (boardId: string, element: CanvasElement) => {
    try {
      const { error } = await supabase
        .from('board_objects')
        .insert({
          board_id: boardId,
          type: element.type,
          data: element,
          created_by: userId,
          updated_by: userId
        });
        
      if (error) {
        console.error('Error saving element to database:', error);
      }
    } catch (err) {
      console.error('Failed to save element to database:', err);
    }
  };
  
  const deleteElementFromDatabase = async (elementId: string) => {
    try {
      const { error } = await supabase
        .from('board_objects')
        .delete()
        .eq('data->>id', elementId);
        
      if (error) {
        console.error('Error deleting element from database:', error);
      }
    } catch (err) {
      console.error('Failed to delete element from database:', err);
    }
  };

  const handleSelection = useCallback((opt: any) => {
    const selected = opt.selected;
    if (!selected || !selected.length) return;
    
    const selectedObj = selected[0] as ExtendedFabricObject;
    if (selectedObj.data?.id) {
      selectElement(selectedObj.data.id);
    }
  }, [selectElement]);

  const handleSelectionCleared = useCallback(() => {
    selectElement(null);
  }, [selectElement]);

  const handleObjectModified = useCallback((opt: any) => {
    const target = opt.target;
    if (!target) return;
    
    const obj = target as ExtendedFabricObject;
    if (!obj || !obj.data?.id) return;
    
    const changes: Partial<CanvasElement> = {
      x: obj.left || 0,
      y: obj.top || 0,
      width: obj.width || 0,
      height: obj.height || 0,
    };
    
    // If text, update the text content
    if (obj instanceof Textbox) {
      changes.text = obj.text;
      changes.fontSize = obj.fontSize;
    }
    
    updateElement(obj.data.id, changes);
    
    // Update in database if in a room
    if (state.roomId) {
      updateElementInDatabase(obj.data.id, changes);
    }
    
    collaboration.broadcastUpdateElement(obj.data.id, changes);
  }, [updateElement, collaboration, state.roomId]);

  const updateElementInDatabase = async (elementId: string, changes: Partial<CanvasElement>) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('board_objects')
        .select('data')
        .eq('data->>id', elementId)
        .single();
        
      if (fetchError) {
        console.error('Error fetching element for update:', fetchError);
        return;
      }
      
      const updatedData = { ...data.data, ...changes };
      
      const { error } = await supabase
        .from('board_objects')
        .update({ 
          data: updatedData,
          updated_by: userId,
          updated_at: new Date().toISOString()
        })
        .eq('data->>id', elementId);
        
      if (error) {
        console.error('Error updating element in database:', error);
      }
    } catch (err) {
      console.error('Failed to update element in database:', err);
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-[url('/grid.svg')]">
      <canvas ref={canvasRef} className="absolute inset-0" />
      <CursorOverlay users={state.users} currentUserId={userId} />
    </div>
  );
};

export default Board;
