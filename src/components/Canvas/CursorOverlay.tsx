
import React from 'react';
import { User } from '@/lib/types';

interface CursorOverlayProps {
  users: User[];
  currentUserId: string;
}

const CursorOverlay: React.FC<CursorOverlayProps> = ({ users, currentUserId }) => {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {users.map((user) => {
        if (user.id === currentUserId || !user.cursor) return null;
        
        return (
          <div
            key={user.id}
            className="absolute flex flex-col items-start animate-pulse-subtle"
            style={{
              transform: `translate(${user.cursor.x}px, ${user.cursor.y}px)`,
              zIndex: 1000,
              transition: 'transform 0.1s ease'
            }}
          >
            <svg
              width="24"
              height="36"
              viewBox="0 0 24 36"
              fill="none"
              stroke="white"
              strokeWidth="1.5"
              className="drop-shadow-md"
            >
              <path
                d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19841L11.7841 12.3673H5.65376Z"
                fill={user.color}
              />
            </svg>
            
            <div 
              className="px-2 py-1 rounded-lg text-white text-xs ml-4 whitespace-nowrap shadow-md"
              style={{ backgroundColor: user.color }}
            >
              {user.name}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CursorOverlay;
