
import React from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  Share, 
  Plus, 
  Users,
  Edit,
  Eye,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { User, UserPermission } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ControlsProps {
  zoom: number;
  setZoom: (zoom: number) => void;
  roomId: string | null;
  users: User[];
  currentUserId: string;
  isOwner: boolean;
  userPermissions: Record<string, UserPermission>;
  onCreateRoom: () => void;
  onJoinRoom: (id: string) => void;
  onUpdateUserPermission: (userId: string, permission: UserPermission) => void;
}

const Controls: React.FC<ControlsProps> = ({
  zoom,
  setZoom,
  roomId,
  users,
  currentUserId,
  isOwner,
  userPermissions,
  onCreateRoom,
  onJoinRoom,
  onUpdateUserPermission,
}) => {
  const [joinInput, setJoinInput] = React.useState('');

  const handleShareClick = () => {
    if (!roomId) {
      toast.error("Create a room first to share");
      return;
    }
    
    navigator.clipboard.writeText(roomId);
    toast.success("Room ID copied to clipboard!");
  };

  const handleJoinRoom = () => {
    if (!joinInput.trim()) {
      toast.error("Please enter a room ID");
      return;
    }
    
    onJoinRoom(joinInput.trim());
    setJoinInput('');
  };

  const activeUsers = users.filter(user => user.id !== currentUserId);
  const totalUsers = activeUsers.length + 1; // Include current user

  const handleZoomIn = () => {
    setZoom(zoom + 0.1);
    toast.info(`Zoom: ${Math.round((zoom + 0.1) * 100)}%`);
  };

  const handleZoomOut = () => {
    setZoom(zoom - 0.1);
    toast.info(`Zoom: ${Math.round((zoom - 0.1) * 100)}%`);
  };

  return (
    <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-10">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="bg-white rounded-full h-10 w-10 shadow-md"
            onClick={handleZoomIn}
          >
            <ZoomIn className="h-5 w-5" />
            <span className="sr-only">Zoom In</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">Zoom In</TooltipContent>
      </Tooltip>
      
      <div className="bg-white rounded-full px-2 py-1 text-xs font-medium text-center shadow-md">
        {Math.round(zoom * 100)}%
      </div>
      
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="bg-white rounded-full h-10 w-10 shadow-md"
            onClick={handleZoomOut}
          >
            <ZoomOut className="h-5 w-5" />
            <span className="sr-only">Zoom Out</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">Zoom Out</TooltipContent>
      </Tooltip>
      
      <div className="h-px w-8 bg-slate-200 self-center my-1" />
      
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            size="icon"
            className={cn(
              "bg-white rounded-full h-10 w-10 shadow-md relative",
              roomId ? "ring-2 ring-primary" : ""
            )}
          >
            <Users className="h-5 w-5" />
            {totalUsers > 1 && (
              <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs w-5 h-5 flex items-center justify-center rounded-full">
                {totalUsers}
              </span>
            )}
            <span className="sr-only">Collaborate</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent side="left" className="w-80">
          <div className="space-y-3">
            <h3 className="text-sm font-medium flex items-center justify-between">
              <span>Collaborate in Real-time</span>
              {roomId && (
                <Badge variant="outline" className="ml-2">{roomId}</Badge>
              )}
            </h3>
            
            {roomId ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">Share this room</p>
                  <Button size="sm" onClick={handleShareClick} className="h-7">
                    <Share className="h-3 w-3 mr-1" /> Share
                  </Button>
                </div>
                
                <div className="border-t border-gray-100 my-2 pt-2">
                  <p className="text-xs font-semibold mb-1 flex justify-between items-center">
                    <span>Active users ({totalUsers})</span>
                    {isOwner && <span className="text-xs text-muted-foreground">You are the owner</span>}
                  </p>
                  
                  {/* Current user */}
                  <div className="max-h-40 overflow-y-auto space-y-1 mt-2">
                    <div className="flex items-center justify-between bg-gray-50 p-1.5 rounded-md">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full bg-blue-500"
                        />
                        <span className="text-xs font-medium">{currentUserId.substring(0, 8)} (You)</span>
                      </div>
                      <Badge variant="secondary" className="text-[10px] h-5 px-1">Owner</Badge>
                    </div>
                  
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {activeUsers.length === 0 ? (
                        <p className="text-xs text-muted-foreground mt-1">No other users in the room</p>
                      ) : (
                        activeUsers.map((user) => (
                          <div key={user.id} className="flex items-center justify-between bg-gray-50 p-1.5 rounded-md">
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: user.color }}
                              />
                              <span className="text-xs">{user.name}</span>
                            </div>
                            
                            {isOwner && (
                              <div className="flex gap-1">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button 
                                      size="icon"
                                      variant={userPermissions[user.id] === 'write' ? 'default' : 'outline'} 
                                      className="h-6 w-6"
                                      onClick={() => onUpdateUserPermission(user.id, 'write')}
                                    >
                                      <Edit className="h-3 w-3" />
                                      {userPermissions[user.id] === 'write' && 
                                        <Check className="h-2 w-2 absolute top-0 right-0" />
                                      }
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Can edit</TooltipContent>
                                </Tooltip>
                                
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button 
                                      size="icon"
                                      variant={userPermissions[user.id] === 'read' ? 'default' : 'outline'} 
                                      className="h-6 w-6"
                                      onClick={() => onUpdateUserPermission(user.id, 'read')}
                                    >
                                      <Eye className="h-3 w-3" />
                                      {userPermissions[user.id] === 'read' && 
                                        <Check className="h-2 w-2 absolute top-0 right-0" />
                                      }
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Read only</TooltipContent>
                                </Tooltip>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Button size="sm" className="w-full flex items-center gap-2" onClick={onCreateRoom}>
                  <Plus className="h-4 w-4" /> 
                  Create New Room
                </Button>
                <p className="text-xs text-muted-foreground text-center">or</p>
                <div className="flex items-center gap-2">
                  <Input 
                    placeholder="Enter Room ID" 
                    value={joinInput}
                    onChange={(e) => setJoinInput(e.target.value)}
                    className="text-xs"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleJoinRoom();
                      }
                    }}
                  />
                  <Button size="sm" onClick={handleJoinRoom}>Join</Button>
                </div>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default Controls;
