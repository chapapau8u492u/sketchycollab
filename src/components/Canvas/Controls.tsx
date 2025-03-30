
import React from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  Share, 
  Plus, 
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

interface ControlsProps {
  zoom: number;
  setZoom: (zoom: number) => void;
  roomId: string | null;
  onCreateRoom: () => void;
  onJoinRoom: (id: string) => void;
}

const Controls: React.FC<ControlsProps> = ({
  zoom,
  setZoom,
  roomId,
  onCreateRoom,
  onJoinRoom,
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

  return (
    <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-10">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="bg-white rounded-full h-10 w-10 shadow-md"
            onClick={() => setZoom(zoom + 0.1)}
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
            onClick={() => setZoom(zoom - 0.1)}
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
            className="bg-white rounded-full h-10 w-10 shadow-md"
          >
            <Users className="h-5 w-5" />
            <span className="sr-only">Collaborate</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent side="left" className="w-72">
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Collaborate in Real-time</h3>
            {roomId ? (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Current Room</p>
                <div className="flex items-center gap-2">
                  <Input value={roomId} readOnly className="text-xs" />
                  <Button size="sm" onClick={handleShareClick}>
                    <Share className="h-4 w-4" />
                  </Button>
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
