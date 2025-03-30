
export type Tool = 
  | "select" 
  | "rectangle" 
  | "diamond"
  | "ellipse" 
  | "arrow" 
  | "line" 
  | "pencil" 
  | "text"
  | "hand"
  | "eraser"
  | "triangle"
  | "hexagon";

export type CanvasElement = {
  id: string;
  type: Tool | "image";
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  text?: string;
  points?: { x: number; y: number }[];
  opacity: number;
  fontSize?: number;
};

export type User = {
  id: string;
  color: string;
  name: string;
  cursor: {
    x: number;
    y: number;
  } | null;
  isOnline?: boolean;
};

export type UserPermission = 'read' | 'write';

export type AppState = {
  elements: CanvasElement[];
  selectedElement: string | null;
  tool: Tool;
  color: string;
  strokeWidth: number;
  zoom: number;
  users: User[];
  roomId: string | null;
  userPermissions: Record<string, UserPermission>;
};
