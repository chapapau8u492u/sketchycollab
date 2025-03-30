
import { useState, useCallback } from 'react';
import { Tool, AppState } from './types';
import { v4 as uuidv4 } from 'uuid';

const defaultState: AppState = {
  elements: [],
  selectedElement: null,
  tool: 'select',
  color: '#000000',
  strokeWidth: 2,
  zoom: 1,
  users: [],
  roomId: null,
};

export function useCanvasState() {
  const [state, setState] = useState<AppState>(defaultState);

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
    
    setState(prev => ({
      ...prev,
      elements: [...prev.elements, newElement],
      selectedElement: newElement.id,
    }));
    
    return newElement;
  }, [state.tool, state.color, state.strokeWidth]);

  const updateElement = useCallback((id: string, changes: Partial<typeof state.elements[number]>) => {
    setState(prev => ({
      ...prev,
      elements: prev.elements.map(el => 
        el.id === id ? { ...el, ...changes } : el
      ),
    }));
  }, []);

  const removeElement = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      elements: prev.elements.filter(el => el.id !== id),
      selectedElement: prev.selectedElement === id ? null : prev.selectedElement,
    }));
  }, []);

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
  };
}
