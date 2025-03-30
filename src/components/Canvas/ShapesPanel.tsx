
import React from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Square, Circle, Triangle, Hexagon } from 'lucide-react';

interface ShapesPanelProps {
  onAddShape: (shapeType: string) => void;
}

const ShapesPanel: React.FC<ShapesPanelProps> = ({ onAddShape }) => {
  const shapes = [
    { icon: Square, name: 'Square' },
    { icon: Circle, name: 'Circle' },
    { icon: Triangle, name: 'Triangle' },
    { icon: Hexagon, name: 'Hexagon' },
  ];

  return (
    <div className="fixed left-4 top-1/2 transform -translate-y-1/2 bg-white rounded-lg shadow-md p-2 z-10 flex flex-col gap-1">
      {shapes.map((shape) => (
        <Tooltip key={shape.name}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-md h-9 w-9"
              onClick={() => onAddShape(shape.name.toLowerCase())}
            >
              <shape.icon className="h-5 w-5" />
              <span className="sr-only">{shape.name}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">Add {shape.name}</TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
};

export default ShapesPanel;
