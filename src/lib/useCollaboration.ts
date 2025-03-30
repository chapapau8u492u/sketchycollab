
import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { User, CanvasElement } from './types';

// In a real application, you would connect to a real server
// For now, we'll simulate collaboration locally
export function useCollaboration(
  roomId: string | null,
  userId: string,
  onUserJoined: (user: User) => void,
  onUserLeft: (userId: string) => void,
  onCursorMoved: (userId: string, x: number, y: number) => void,
  onElementAdded: (element: CanvasElement) => void,
  onElementUpdated: (id: string, changes: Partial<CanvasElement>) => void,
  onElementRemoved: (id: string) => void,
) {
  const socketRef = useRef<Socket | null>(null);
  const isConnectedRef = useRef(false);

  useEffect(() => {
    if (!roomId) return;

    // In a real app, connect to a real server
    // For this demo, we'll simulate collaboration
    console.log(`Simulating connection to room: ${roomId}`);
    
    // Simulate connection events for demo purposes
    setTimeout(() => {
      onUserJoined({
        id: 'simulated-user-1',
        color: '#' + Math.floor(Math.random() * 16777215).toString(16),
        name: 'Simulated User 1',
        cursor: { x: 100, y: 100 },
      });
    }, 2000);

    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        onCursorMoved(
          'simulated-user-1',
          Math.floor(Math.random() * window.innerWidth), 
          Math.floor(Math.random() * window.innerHeight)
        );
      }
    }, 1000);

    return () => {
      console.log('Cleaning up simulated collaboration');
      clearInterval(interval);
      onUserLeft('simulated-user-1');
    };
  }, [roomId, onUserJoined, onUserLeft, onCursorMoved]);

  // Methods to broadcast changes
  const broadcastCursorPosition = (x: number, y: number) => {
    // In a real app, emit to socket
    console.log(`Broadcasting cursor position: ${x}, ${y}`);
  };

  const broadcastAddElement = (element: CanvasElement) => {
    // In a real app, emit to socket
    console.log(`Broadcasting new element: ${element.id}`);
  };

  const broadcastUpdateElement = (id: string, changes: Partial<CanvasElement>) => {
    // In a real app, emit to socket
    console.log(`Broadcasting update to element: ${id}`);
  };

  const broadcastRemoveElement = (id: string) => {
    // In a real app, emit to socket
    console.log(`Broadcasting element removal: ${id}`);
  };

  return {
    isConnected: isConnectedRef.current,
    broadcastCursorPosition,
    broadcastAddElement,
    broadcastUpdateElement,
    broadcastRemoveElement,
  };
}
