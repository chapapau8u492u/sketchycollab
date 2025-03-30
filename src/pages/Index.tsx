
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
import { CanvasElement, User, UserPermission } from '@/lib/types';

const Index: React.FC = () => {
  const userId = React.useRef(uuidv4()).current;
  const userName = React.useRef(`User-${userId.substring(0, 4)}`).current;
  
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
    clearCanvas,
    undo,
    redo,
    setUserPermission,
  } = useCanvasState();

  const handleUserJoined = useCallback((user: User) => {
    addUser(user);
    toast.success(`${user.name} joined`);
  }, [addUser]);

  const handleUserLeft = useCallback((userId: string) => {
    removeUser(userId);
    toast.info(`A user left the room`);
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
  
  const handlePermissionChanged = useCallback((userId: string, permission: UserPermission) => {
    setUserPermission(userId, permission);
  }, [setUserPermission]);

  const collaboration = useCollaboration(
    state.roomId,
    userId,
    userName,
    handleUserJoined,
    handleUserLeft,
    handleCursorMoved,
    handleElementAdded,
    handleElementUpdated,
    handleElementRemoved,
    handlePermissionChanged
  );

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

  const handleExport = useCallback(() => {
    if (!document.querySelector('canvas')) {
      toast.error("Canvas element not found");
      return;
    }

    try {
      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      const dataUrl = canvas.toDataURL('image/png');
      
      // Create a download link
      const link = document.createElement('a');
      link.download = `whiteboard-${new Date().toISOString().slice(0, 10)}.png`;
      link.href = dataUrl;
      link.click();
      
      toast.success("Exporting your artwork!");
    } catch (error) {
      toast.error("Failed to export canvas");
    }
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
        onUndo={undo}
        onRedo={redo}
        onClear={clearCanvas}
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
        users={state.users}
        currentUserId={userId}
        isOwner={collaboration.isOwner}
        userPermissions={state.userPermissions}
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
        onUpdateUserPermission={collaboration.updateUserPermission}
      />
      
      <ShapesPanel onAddShape={handleAddShape} />
    </div>
  );
};

export default Index;
