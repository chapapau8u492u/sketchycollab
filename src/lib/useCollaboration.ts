
import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { User, CanvasElement, UserPermission } from './types';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

// In a real application, you would connect to a real server
export function useCollaboration(
  roomId: string | null,
  userId: string,
  userName: string,
  onUserJoined: (user: User) => void,
  onUserLeft: (userId: string) => void,
  onCursorMoved: (userId: string, x: number, y: number) => void,
  onElementAdded: (element: CanvasElement) => void,
  onElementUpdated: (id: string, changes: Partial<CanvasElement>) => void,
  onElementRemoved: (id: string) => void,
  onPermissionChanged: (userId: string, permission: UserPermission) => void,
) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [activeUsers, setActiveUsers] = useState<User[]>([]);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    if (!roomId) return;

    // In a real app, we would connect to a real server
    // For this demo, we'll simulate collaboration
    console.log(`Connecting to room: ${roomId}`);
    
    // Simulate connection events for demo purposes
    setIsConnected(true);
    setIsOwner(true); // First user is the owner
    
    const simulatedUsers = [
      {
        id: 'simulated-user-1',
        color: '#' + Math.floor(Math.random() * 16777215).toString(16),
        name: 'Jane Smith',
        cursor: { x: 100, y: 100 },
        isOnline: true,
      },
      {
        id: 'simulated-user-2',
        color: '#' + Math.floor(Math.random() * 16777215).toString(16),
        name: 'Mike Johnson',
        cursor: { x: 200, y: 200 },
        isOnline: true,
      }
    ];
    
    simulatedUsers.forEach(user => {
      onUserJoined(user);
    });
    
    setActiveUsers(simulatedUsers);
    
    toast.success(`Connected to room: ${roomId}`);

    const cursorInterval = setInterval(() => {
      // Simulate cursor movement for users
      simulatedUsers.forEach(user => {
        if (Math.random() > 0.7) {
          const x = Math.floor(Math.random() * window.innerWidth);
          const y = Math.floor(Math.random() * window.innerHeight);
          onCursorMoved(user.id, x, y);
        }
      });
    }, 1000);

    return () => {
      console.log('Disconnecting from room');
      setIsConnected(false);
      simulatedUsers.forEach(user => {
        onUserLeft(user.id);
      });
      setActiveUsers([]);
      clearInterval(cursorInterval);
      toast.info('Disconnected from room');
    };
  }, [roomId, onUserJoined, onUserLeft, onCursorMoved]);

  // Methods to broadcast changes
  const broadcastCursorPosition = useCallback((x: number, y: number) => {
    // In a real app, emit to socket
    console.log(`Broadcasting cursor position: ${x}, ${y}`);
    // For simulation, we don't need to do anything as the cursor is updated locally
  }, []);

  const broadcastAddElement = useCallback((element: CanvasElement) => {
    // In a real app, emit to socket
    console.log(`Broadcasting new element: ${element.id}`);
    // For simulation, we don't need to do anything as the element is already added locally
  }, []);

  const broadcastUpdateElement = useCallback((id: string, changes: Partial<CanvasElement>) => {
    // In a real app, emit to socket
    console.log(`Broadcasting update to element: ${id}`);
    // For simulation, we don't need to do anything as the element is already updated locally
  }, []);

  const broadcastRemoveElement = useCallback((id: string) => {
    // In a real app, emit to socket
    console.log(`Broadcasting element removal: ${id}`);
    // For simulation, we don't need to do anything as the element is already removed locally
  }, []);

  const updateUserPermission = useCallback((targetUserId: string, permission: UserPermission) => {
    if (isOwner) {
      onPermissionChanged(targetUserId, permission);
      // In a real app, emit to socket
      console.log(`Updating permission for user ${targetUserId} to ${permission}`);
      toast.success(`Permission for user updated to ${permission}`);
    } else {
      toast.error('Only the room owner can change permissions');
    }
  }, [isOwner, onPermissionChanged]);

  return {
    isConnected,
    isOwner,
    activeUsers,
    broadcastCursorPosition,
    broadcastAddElement,
    broadcastUpdateElement,
    broadcastRemoveElement,
    updateUserPermission,
  };
}
