
import React, { useCallback, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import Board from '@/components/Canvas/Board';
import Toolbar from '@/components/Canvas/Toolbar';
import ColorPicker from '@/components/Canvas/ColorPicker';
import Controls from '@/components/Canvas/Controls';
import ShapesPanel from '@/components/Canvas/ShapesPanel';
import { useCanvasState } from '@/lib/useCanvasState';
import { useCollaboration } from '@/lib/useCollaboration';
import { CanvasElement, User } from '@/lib/types';

const Index: React.FC = () => {
  const {
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
  } = useCanvasState();

  const userId = React.useRef(uuidv4()).current;

  const handleUserJoined = useCallback((user: User) => {
    addUser(user);
    toast(`${user.name} joined`);
  }, [addUser]);

  const handleUserLeft = useCallback((userId: string) => {
    removeUser(userId);
  }, [removeUser]);

  const handleCursorMoved = useCallback((userId: string, x: number, y: number) => {
    updateUserCursor(userId, x, y);
  }, [updateUserCursor]);

  const handleElementAdded = useCallback((element: CanvasElement) => {
    addElement(element);
  }, [addElement]);

  const handleElementUpdated = useCallback((id: string, changes: Partial<CanvasElement>) => {
    updateElement(id, changes);
  }, [updateElement]);

  const handleElementRemoved = useCallback((id: string) => {
    removeElement(id);
  }, [removeElement]);

  const collaboration = useCollaboration(
    state.roomId,
    userId,
    handleUserJoined,
    handleUserLeft,
    handleCursorMoved,
    handleElementAdded,
    handleElementUpdated,
    handleElementRemoved
  );

  const handleUndo = useCallback(() => {
    toast("Undo functionality - to be implemented");
  }, []);

  const handleRedo = useCallback(() => {
    toast("Redo functionality - to be implemented");
  }, []);

  const handleClear = useCallback(() => {
    toast("Canvas cleared");
  }, []);

  const handleExport = useCallback(() => {
    toast("Exporting your artwork!");
  }, []);

  const handleCreateRoom = useCallback(() => {
    const roomId = uuidv4().substring(0, 8);
    setRoomId(roomId);
    toast.success(`Room created! Share ID: ${roomId}`);
  }, [setRoomId]);

  const handleJoinRoom = useCallback((id: string) => {
    setRoomId(id);
    toast.success(`Joined room: ${id}`);
  }, [setRoomId]);

  const handleAddShape = useCallback((shapeType: string) => {
    // Logic to add a predefined shape to the canvas
    toast(`Adding ${shapeType} shape`);
  }, []);

  return (
    <div className="h-screen w-screen overflow-hidden bg-gray-50">
      <Board
        state={state}
        updateUserCursor={updateUserCursor}
        addElement={addElement}
        updateElement={updateElement}
        removeElement={removeElement}
        selectElement={selectElement}
        collaboration={collaboration}
      />
      
      <Toolbar
        currentTool={state.tool}
        setTool={setTool}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onClear={handleClear}
        onExport={handleExport}
      />
      
      <ColorPicker
        color={state.color}
        strokeWidth={state.strokeWidth}
        onColorChange={setColor}
        onStrokeWidthChange={setStrokeWidth}
      />
      
      <Controls
        zoom={state.zoom}
        setZoom={setZoom}
        roomId={state.roomId}
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
      />
      
      <ShapesPanel onAddShape={handleAddShape} />
    </div>
  );
};

export default Index;
