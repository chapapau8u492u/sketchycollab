
import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { User, CanvasElement, UserPermission } from './types';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

// For demo purposes we'll use a mock server
// In a real application, you'd use a real WebSocket server
const MOCK_DELAY = 100; // ms for simulated network latency

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

  // Mock users with different colors
  const mockUsers = useRef([
    {
      id: 'simulated-user-1',
      color: '#FF5733',
      name: 'Jane Smith',
      cursor: { x: 100, y: 100 },
      isOnline: true,
    },
    {
      id: 'simulated-user-2',
      color: '#33FF57',
      name: 'Mike Johnson',
      cursor: { x: 200, y: 200 },
      isOnline: true,
    },
    {
      id: 'simulated-user-3',
      color: '#3357FF',
      name: 'Alex Brown',
      cursor: { x: 300, y: 300 },
      isOnline: true,
    }
  ]).current;

  useEffect(() => {
    if (!roomId) return;

    console.log(`Connecting to room: ${roomId}`);
    
    // Simulate connection
    setIsConnected(true);
    setIsOwner(true); // First user is the owner
    
    // Add our simulated users
    const simulatedUsers = mockUsers;
    
    simulatedUsers.forEach(user => {
      setTimeout(() => {
        onUserJoined(user);
      }, Math.random() * 2000); // Simulate users joining at different times
    });
    
    setActiveUsers(simulatedUsers);
    
    toast.success(`Connected to room: ${roomId}`);

    const cursorInterval = setInterval(() => {
      // Simulate cursor movement for users
      simulatedUsers.forEach(user => {
        if (Math.random() > 0.7) {
          const x = Math.floor(Math.random() * window.innerWidth * 0.8);
          const y = Math.floor(Math.random() * window.innerHeight * 0.8);
          onCursorMoved(user.id, x, y);
        }
      });
    }, 1000);

    // Simulate occasional drawing by virtual users
    const drawInterval = setInterval(() => {
      if (Math.random() > 0.7) {
        const user = simulatedUsers[Math.floor(Math.random() * simulatedUsers.length)];
        const x = Math.floor(Math.random() * window.innerWidth * 0.8);
        const y = Math.floor(Math.random() * window.innerHeight * 0.8);
        
        const tools = ['rectangle', 'ellipse', 'line', 'pencil'];
        const randomTool = tools[Math.floor(Math.random() * tools.length)];
        
        const element: CanvasElement = {
          id: uuidv4(),
          type: randomTool as any,
          x: x,
          y: y,
          width: Math.random() * 100 + 50,
          height: Math.random() * 100 + 50,
          fill: user.color,
          stroke: user.color,
          strokeWidth: Math.floor(Math.random() * 3) + 1,
          opacity: 1,
        };
        
        onElementAdded(element);
      }
    }, 5000);

    // Clean up
    return () => {
      console.log('Disconnecting from room');
      setIsConnected(false);
      simulatedUsers.forEach(user => {
        onUserLeft(user.id);
      });
      setActiveUsers([]);
      clearInterval(cursorInterval);
      clearInterval(drawInterval);
      toast.info('Disconnected from room');
    };
  }, [roomId, onUserJoined, onUserLeft, onCursorMoved, onElementAdded, mockUsers]);

  // Methods to broadcast changes
  const broadcastCursorPosition = useCallback((x: number, y: number) => {
    console.log(`Broadcasting cursor position: ${x}, ${y}`);
    // For simulation, no actual network call needed
  }, []);

  const broadcastAddElement = useCallback((element: CanvasElement) => {
    console.log(`Broadcasting new element: ${element.id}`);
    // For simulation, no actual network call needed
  }, []);

  const broadcastUpdateElement = useCallback((id: string, changes: Partial<CanvasElement>) => {
    console.log(`Broadcasting update to element: ${id}`);
    // For simulation, no actual network call needed
  }, []);

  const broadcastRemoveElement = useCallback((id: string) => {
    console.log(`Broadcasting element removal: ${id}`);
    // For simulation, no actual network call needed
  }, []);

  const updateUserPermission = useCallback((targetUserId: string, permission: UserPermission) => {
    if (isOwner) {
      onPermissionChanged(targetUserId, permission);
      
      // Simulate network delay
      setTimeout(() => {
        toast.success(`Permission for user updated to ${permission}`);
      }, MOCK_DELAY);
      
      // If permission is read-only, prevent the user from adding elements in simulation
      if (permission === 'read') {
        const index = mockUsers.findIndex(u => u.id === targetUserId);
        if (index !== -1) {
          mockUsers[index].isOnline = false; // Simulate reduced activity
          setTimeout(() => {
            mockUsers[index].isOnline = true;
          }, 10000); // Simulate user coming back after a while
        }
      }
    } else {
      toast.error('Only the room owner can change permissions');
    }
  }, [isOwner, onPermissionChanged, mockUsers]);

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
