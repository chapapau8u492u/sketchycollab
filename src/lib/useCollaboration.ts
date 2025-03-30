
import { useEffect, useState, useCallback } from 'react';
import { User, CanvasElement, UserPermission } from './types';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

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
  const [isConnected, setIsConnected] = useState(false);
  const [activeUsers, setActiveUsers] = useState<User[]>([]);
  const [isOwner, setIsOwner] = useState(false);
  const { user } = useAuth();
  
  // Join a room
  useEffect(() => {
    if (!roomId || !user) return;
    
    const loadRoom = async () => {
      try {
        // Check if board exists
        const { data: boardData, error: boardError } = await supabase
          .from('boards')
          .select('*')
          .eq('id', roomId)
          .single();
        
        if (boardError) {
          // Board doesn't exist, create it
          if (boardError.code === 'PGRST116') {
            const { data: newBoard, error: createError } = await supabase
              .from('boards')
              .insert({
                id: roomId,
                name: `Room ${roomId}`,
                created_by: user.id,
                is_public: true
              })
              .select()
              .single();
            
            if (createError) {
              console.error('Error creating board:', createError);
              toast.error('Failed to create board');
              return;
            }
            
            setIsOwner(true);
            toast.success('Created new board');
          } else {
            console.error('Error fetching board:', boardError);
            toast.error('Failed to join board');
            return;
          }
        } else {
          // Board exists, check if current user is the owner
          setIsOwner(boardData.created_by === user.id);
        }
        
        // Subscribe to presence channel for this room
        const channel = supabase.channel(`room:${roomId}`);
        
        // Set up presence handlers
        channel
          .on('presence', { event: 'sync' }, () => {
            const state = channel.presenceState();
            processPresenceState(state);
          })
          .on('presence', { event: 'join' }, ({ key, newPresences }) => {
            console.log('User joined:', key, newPresences);
            newPresences.forEach((presence: any) => {
              const newUser: User = {
                id: presence.user_id,
                name: presence.username,
                color: presence.color,
                cursor: presence.cursor,
                isOnline: true
              };
              onUserJoined(newUser);
            });
          })
          .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
            console.log('User left:', key, leftPresences);
            leftPresences.forEach((presence: any) => {
              onUserLeft(presence.user_id);
            });
          });
          
        // Subscribe to broadcasts for this room
        channel
          .on('broadcast', { event: 'cursor-position' }, (payload) => {
            const { userId, x, y } = payload;
            onCursorMoved(userId, x, y);
          })
          .on('broadcast', { event: 'add-element' }, (payload) => {
            onElementAdded(payload.element);
          })
          .on('broadcast', { event: 'update-element' }, (payload) => {
            onElementUpdated(payload.id, payload.changes);
          })
          .on('broadcast', { event: 'remove-element' }, (payload) => {
            onElementRemoved(payload.id);
          })
          .on('broadcast', { event: 'update-permission' }, (payload) => {
            onPermissionChanged(payload.userId, payload.permission);
          });
        
        // Generate a random color for the user
        const randomColor = `#${Math.floor(Math.random()*16777215).toString(16)}`;
          
        // Join the channel with the user's state
        await channel.subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await channel.track({
              user_id: user.id,
              username: userName,
              color: randomColor,
              cursor: null,
              online_at: new Date().toISOString()
            });
            
            setIsConnected(true);
            toast.success(`Connected to room: ${roomId}`);
          }
        });
        
        // Load active users
        loadActiveUsers(roomId);
        
        // Load user permissions
        loadUserPermissions(roomId);
        
        // Clean up on unmount
        return () => {
          channel.unsubscribe();
          setIsConnected(false);
          setActiveUsers([]);
        };
      } catch (error) {
        console.error('Error joining room:', error);
        toast.error('Failed to join room');
      }
    };
    
    loadRoom();
  }, [roomId, userId, userName, user, onUserJoined, onUserLeft, onCursorMoved, onElementAdded, onElementUpdated, onElementRemoved]);
  
  // Process presence state to get active users
  const processPresenceState = (state: Record<string, any[]>) => {
    const users: User[] = [];
    
    Object.values(state).forEach((presences) => {
      presences.forEach((presence) => {
        users.push({
          id: presence.user_id,
          name: presence.username,
          color: presence.color,
          cursor: presence.cursor,
          isOnline: true
        });
      });
    });
    
    setActiveUsers(users);
  };
  
  // Load active users for a room
  const loadActiveUsers = async (boardId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_online', true);
      
      if (error) {
        console.error('Error loading active users:', error);
        return;
      }
      
      if (data) {
        const users: User[] = data.map(profile => ({
          id: profile.id,
          name: profile.username || 'Unknown',
          color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
          cursor: null,
          isOnline: profile.is_online
        }));
        
        // Add each user
        users.forEach(user => {
          if (user.id !== userId) {
            onUserJoined(user);
          }
        });
        
        setActiveUsers(users);
      }
    } catch (err) {
      console.error('Failed to load active users:', err);
    }
  };
  
  // Load user permissions for a room
  const loadUserPermissions = async (boardId: string) => {
    try {
      const { data, error } = await supabase
        .from('board_permissions')
        .select('*')
        .eq('board_id', boardId);
      
      if (error) {
        console.error('Error loading user permissions:', error);
        return;
      }
      
      if (data) {
        data.forEach(permission => {
          onPermissionChanged(permission.user_id, permission.permission_level as UserPermission);
        });
      }
    } catch (err) {
      console.error('Failed to load user permissions:', err);
    }
  };

  // Methods to broadcast changes
  const broadcastCursorPosition = useCallback((x: number, y: number) => {
    if (!roomId || !isConnected) return;
    
    supabase.channel(`room:${roomId}`).send({
      type: 'broadcast',
      event: 'cursor-position',
      payload: { userId, x, y }
    });
    
    // Update presence data with new cursor position
    supabase.channel(`room:${roomId}`).track({
      user_id: userId,
      username: userName,
      cursor: { x, y },
      online_at: new Date().toISOString()
    });
  }, [roomId, isConnected, userId, userName]);

  const broadcastAddElement = useCallback((element: CanvasElement) => {
    if (!roomId || !isConnected) return;
    
    supabase.channel(`room:${roomId}`).send({
      type: 'broadcast',
      event: 'add-element',
      payload: { element }
    });
  }, [roomId, isConnected]);

  const broadcastUpdateElement = useCallback((id: string, changes: Partial<CanvasElement>) => {
    if (!roomId || !isConnected) return;
    
    supabase.channel(`room:${roomId}`).send({
      type: 'broadcast',
      event: 'update-element',
      payload: { id, changes }
    });
  }, [roomId, isConnected]);

  const broadcastRemoveElement = useCallback((id: string) => {
    if (!roomId || !isConnected) return;
    
    supabase.channel(`room:${roomId}`).send({
      type: 'broadcast',
      event: 'remove-element',
      payload: { id }
    });
  }, [roomId, isConnected]);

  const updateUserPermission = useCallback(async (targetUserId: string, permission: UserPermission) => {
    if (!roomId || !isOwner || !user) {
      toast.error('Only the room owner can change permissions');
      return;
    }
    
    try {
      // Check if permission exists first
      const { data: existingPermission, error: fetchError } = await supabase
        .from('board_permissions')
        .select('*')
        .eq('board_id', roomId)
        .eq('user_id', targetUserId)
        .maybeSingle();
      
      let dbError;
      
      if (existingPermission) {
        // Update existing permission
        const { error } = await supabase
          .from('board_permissions')
          .update({ permission_level: permission })
          .eq('board_id', roomId)
          .eq('user_id', targetUserId);
          
        dbError = error;
      } else {
        // Insert new permission
        const { error } = await supabase
          .from('board_permissions')
          .insert({
            board_id: roomId,
            user_id: targetUserId,
            permission_level: permission
          });
          
        dbError = error;
      }
      
      if (dbError) {
        console.error('Error updating permission:', dbError);
        toast.error('Failed to update permission');
        return;
      }
      
      // Broadcast the permission change
      supabase.channel(`room:${roomId}`).send({
        type: 'broadcast',
        event: 'update-permission',
        payload: { userId: targetUserId, permission }
      });
      
      onPermissionChanged(targetUserId, permission);
      toast.success(`Permission for user updated to ${permission}`);
    } catch (err) {
      console.error('Failed to update user permission:', err);
      toast.error('Failed to update permission');
    }
  }, [roomId, isOwner, user, onPermissionChanged]);

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
