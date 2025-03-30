
import { useState, useCallback, useRef } from 'react';
import { Tool, AppState, CanvasElement, UserPermission } from './types';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';

const defaultState: AppState = {
  elements: [],
  selectedElement: null,
  tool: 'select',
  color: '#000000',
  strokeWidth: 2,
  zoom: 1,
  users: [],
  roomId: null,
  userPermissions: {},
};

const MAX_HISTORY_SIZE = 50;

export function useCanvasState() {
  const [state, setState] = useState<AppState>(defaultState);
  
  // History for undo/redo functionality
  const historyRef = useRef<{ elements: CanvasElement[] }[]>([{ elements: [] }]);
  const historyIndexRef = useRef(0);
  const shouldRecord = useRef(true);

  const recordHistory = useCallback((newElements: CanvasElement[]) => {
    if (!shouldRecord.current) return;
    
    const currentHistoryIndex = historyIndexRef.current;
    const newHistory = [...historyRef.current.slice(0, currentHistoryIndex + 1), { elements: [...newElements] }];
    
    // Limit history size
    if (newHistory.length > MAX_HISTORY_SIZE) {
      newHistory.shift();
    }
    
    historyRef.current = newHistory;
    historyIndexRef.current = newHistory.length - 1;
  }, []);

  const setTool = useCallback((tool: Tool) => {
    setState(prev => ({ ...prev, tool }));
  }, []);

  const setColor = useCallback((color: string) => {
    setState(prev => ({ ...prev, color }));
  }, []);

  const setStrokeWidth = useCallback((strokeWidth: number) => {
    setState(prev => ({ ...prev, strokeWidth }));
  }, []);

  const addElement = useCallback((element: Omit<Partial<typeof state.elements[number]>, 'id'>) => {
    const newElement = {
      id: uuidv4(),
      type: state.tool,
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      fill: state.tool === 'pencil' ? 'transparent' : state.color,
      stroke: state.tool === 'pencil' ? state.color : '#000000',
      strokeWidth: state.strokeWidth,
      opacity: 1,
      ...element,
    };
    
    setState(prev => {
      const newElements = [...prev.elements, newElement];
      recordHistory(newElements);
      return {
        ...prev,
        elements: newElements,
        selectedElement: newElement.id,
      };
    });
    
    return newElement;
  }, [state.tool, state.color, state.strokeWidth, recordHistory]);

  const updateElement = useCallback((id: string, changes: Partial<typeof state.elements[number]>) => {
    setState(prev => {
      const newElements = prev.elements.map(el => 
        el.id === id ? { ...el, ...changes } : el
      );
      recordHistory(newElements);
      return {
        ...prev,
        elements: newElements,
      };
    });
  }, [recordHistory]);

  const removeElement = useCallback((id: string) => {
    setState(prev => {
      const newElements = prev.elements.filter(el => el.id !== id);
      recordHistory(newElements);
      return {
        ...prev,
        elements: newElements,
        selectedElement: prev.selectedElement === id ? null : prev.selectedElement,
      };
    });
  }, [recordHistory]);

  const selectElement = useCallback((id: string | null) => {
    setState(prev => ({
      ...prev,
      selectedElement: id,
    }));
  }, []);

  const setZoom = useCallback((zoom: number) => {
    setState(prev => ({
      ...prev,
      zoom: Math.max(0.1, Math.min(3, zoom)),
    }));
  }, []);

  const updateUserCursor = useCallback((userId: string, x: number, y: number) => {
    setState(prev => ({
      ...prev,
      users: prev.users.map(user => 
        user.id === userId ? { ...user, cursor: { x, y } } : user
      ),
    }));
  }, []);

  const addUser = useCallback((user: typeof state.users[number]) => {
    setState(prev => ({
      ...prev,
      users: [...prev.users, user],
      userPermissions: {
        ...prev.userPermissions,
        [user.id]: 'write' // Default permission
      }
    }));
  }, []);

  const removeUser = useCallback((userId: string) => {
    setState(prev => ({
      ...prev,
      users: prev.users.filter(user => user.id !== userId),
    }));
  }, []);

  const setRoomId = useCallback((roomId: string | null) => {
    setState(prev => ({ ...prev, roomId }));
  }, []);

  const clearCanvas = useCallback(() => {
    setState(prev => {
      recordHistory([]);
      return {
        ...prev,
        elements: [],
        selectedElement: null
      };
    });
    toast.success("Canvas cleared!");
  }, [recordHistory]);

  const undo = useCallback(() => {
    if (historyIndexRef.current > 0) {
      shouldRecord.current = false;
      historyIndexRef.current--;
      const previousState = historyRef.current[historyIndexRef.current];
      
      setState(prev => ({
        ...prev,
        elements: [...previousState.elements],
      }));
      
      setTimeout(() => {
        shouldRecord.current = true;
      }, 10);
      
      toast.info("Undo");
    } else {
      toast.info("Nothing to undo");
    }
  }, []);

  const redo = useCallback(() => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      shouldRecord.current = false;
      historyIndexRef.current++;
      const nextState = historyRef.current[historyIndexRef.current];
      
      setState(prev => ({
        ...prev,
        elements: [...nextState.elements],
      }));
      
      setTimeout(() => {
        shouldRecord.current = true;
      }, 10);
      
      toast.info("Redo");
    } else {
      toast.info("Nothing to redo");
    }
  }, []);

  const setUserPermission = useCallback((userId: string, permission: UserPermission) => {
    setState(prev => ({
      ...prev,
      userPermissions: {
        ...prev.userPermissions,
        [userId]: permission
      }
    }));
    toast.success(`User permission updated to ${permission}`);
  }, []);

  return {
    state,
    setTool,
    setColor,
    setStrokeWidth,
    addElement,
    updateElement,
    removeElement,
    selectElement,
    setZoom,
    updateUserCursor,
    addUser,
    removeUser,
    setRoomId,
    clearCanvas,
    undo,
    redo,
    setUserPermission,
  };
}
