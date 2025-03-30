
import React from 'react';
import { 
  Pointer, Square, Circle, Type, 
  ArrowRight, LineIcon, Pencil, 
  Hand, Eraser, Undo, Redo, 
  Download, Trash, Diamond
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Tool } from '@/lib/types';
import { cn } from '@/lib/utils';

interface ToolbarProps {
  currentTool: Tool;
  setTool: (tool: Tool) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onExport: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({
  currentTool,
  setTool,
  onUndo,
  onRedo,
  onClear,
  onExport,
}) => {
  const tools = [
    { name: 'select', icon: Pointer, tooltip: 'Select (V)', shortcut: 'V' },
    { name: 'rectangle', icon: Square, tooltip: 'Rectangle (R)', shortcut: 'R' },
    { name: 'diamond', icon: Diamond, tooltip: 'Diamond (D)', shortcut: 'D' },
    { name: 'ellipse', icon: Circle, tooltip: 'Ellipse (O)', shortcut: 'O' },
    { name: 'arrow', icon: ArrowRight, tooltip: 'Arrow (A)', shortcut: 'A' },
    { name: 'line', icon: LineIcon, tooltip: 'Line (L)', shortcut: 'L' },
    { name: 'pencil', icon: Pencil, tooltip: 'Pencil (P)', shortcut: 'P' },
    { name: 'text', icon: Type, tooltip: 'Text (T)', shortcut: 'T' },
    { name: 'hand', icon: Hand, tooltip: 'Hand (H)', shortcut: 'H' },
    { name: 'eraser', icon: Eraser, tooltip: 'Eraser (E)', shortcut: 'E' },
  ];

  // Set up keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const tool = tools.find(tool => tool.shortcut.toLowerCase() === e.key.toLowerCase());
      if (tool) {
        setTool(tool.name as Tool);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [setTool]);

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-md px-2 py-1.5 z-10 flex items-center gap-0.5">
      {tools.map((tool) => (
        <Tooltip key={tool.name}>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost"
              size="icon"
              className={cn(
                "rounded-md h-9 w-9",
                currentTool === tool.name && "bg-slate-100"
              )}
              onClick={() => setTool(tool.name as Tool)}
            >
              <tool.icon className="h-5 w-5" />
              <span className="sr-only">{tool.tooltip}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {tool.tooltip}
          </TooltipContent>
        </Tooltip>
      ))}
      
      <div className="w-px h-6 bg-slate-200 mx-1" />
      
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-md h-9 w-9" onClick={onUndo}>
            <Undo className="h-5 w-5" />
            <span className="sr-only">Undo</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">Undo (Ctrl+Z)</TooltipContent>
      </Tooltip>
      
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-md h-9 w-9" onClick={onRedo}>
            <Redo className="h-5 w-5" />
            <span className="sr-only">Redo</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">Redo (Ctrl+Y)</TooltipContent>
      </Tooltip>
      
      <div className="w-px h-6 bg-slate-200 mx-1" />
      
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-md h-9 w-9" onClick={onClear}>
            <Trash className="h-5 w-5" />
            <span className="sr-only">Clear Canvas</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">Clear Canvas</TooltipContent>
      </Tooltip>
      
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-md h-9 w-9" onClick={onExport}>
            <Download className="h-5 w-5" />
            <span className="sr-only">Export</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">Export (Ctrl+E)</TooltipContent>
      </Tooltip>
    </div>
  );
};

export default Toolbar;
