
import React from 'react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ColorPickerProps {
  color: string;
  strokeWidth: number;
  onColorChange: (color: string) => void;
  onStrokeWidthChange: (width: number) => void;
}

const ColorPicker: React.FC<ColorPickerProps> = ({
  color,
  strokeWidth,
  onColorChange,
  onStrokeWidthChange,
}) => {
  const colors = [
    '#000000', '#343A40', '#495057', '#868E96', '#ADB5BD', '#CED4DA', '#DEE2E6', '#E9ECEF', '#F8F9FA', '#FFFFFF',
    '#FF8787', '#F03E3E', '#C92A2A', '#FFD43B', '#FAB005', '#F08C00', 
    '#A9E34B', '#82C91E', '#40C057', '#37B24D', '#12B886', 
    '#15AABF', '#228BE6', '#4C6EF5', '#7048E8', '#9C36B5', '#E64980'
  ];

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-md p-2 z-10 flex items-center gap-1">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="h-9 w-9 p-0 rounded-md border-0 shadow-sm"
            style={{ backgroundColor: color }}
          />
        </PopoverTrigger>
        <PopoverContent className="w-64 p-3" side="top">
          <div className="grid grid-cols-8 gap-1 mb-3">
            {colors.map((c) => (
              <Button 
                key={c} 
                className={cn(
                  "h-6 w-6 rounded-md p-0",
                  c === "#FFFFFF" && "border border-gray-200"
                )}
                style={{ backgroundColor: c }}
                onClick={() => onColorChange(c)}
              />
            ))}
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span>Stroke Width</span>
              <span>{strokeWidth}px</span>
            </div>
            <Slider
              value={[strokeWidth]}
              min={1}
              max={16}
              step={1}
              onValueChange={(value) => onStrokeWidthChange(value[0])}
              className="w-full"
            />
          </div>
        </PopoverContent>
      </Popover>

      {/* Quick-access color buttons */}
      <div className="flex gap-1">
        {['#000000', '#F03E3E', '#228BE6', '#40C057', '#FAB005'].map((c) => (
          <Button
            key={c}
            variant="outline"
            className={cn(
              "h-9 w-9 p-0 rounded-md border shadow-sm",
              color === c && "ring-2 ring-offset-1 ring-blue-500"
            )}
            style={{ backgroundColor: c }}
            onClick={() => onColorChange(c)}
          />
        ))}
      </div>

      {/* Stroke width preset buttons */}
      <div className="w-px h-7 bg-slate-200 mx-1" />
      <div className="flex gap-1">
        {[2, 4, 8].map((width) => (
          <Button
            key={width}
            variant="outline"
            className={cn(
              "h-9 w-9 p-0 rounded-md flex items-center justify-center",
              strokeWidth === width && "border-primary bg-slate-100"
            )}
            onClick={() => onStrokeWidthChange(width)}
          >
            <div 
              className="rounded-full bg-current" 
              style={{ width: width, height: width }} 
            />
          </Button>
        ))}
      </div>
    </div>
  );
};

export default ColorPicker;
