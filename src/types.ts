export type RoomType =
  | 'bedroom'
  | 'bathroom'
  | 'kitchen'
  | 'living'
  | 'drawing'
  | 'dining'
  | 'garage'
  | 'lawn'
  | 'staircase'
  | 'corridor'
  | 'other';

export interface FurnitureItem {
  id: string;
  type:
    | 'bed'
    | 'nightstand'
    | 'wardrobe'
    | 'sofa'
    | 'coffee_table'
    | 'tv_set'
    | 'dining_table'
    | 'dining_chair'
    | 'kitchen_counter'
    | 'stove'
    | 'sink'
    | 'fridge'
    | 'toilet'
    | 'bathtub'
    | 'car'
    | 'plant'
    | 'bench'
    | 'stairs'
    | 'rug';
  x: number;          // local x offset from room x
  y: number;          // local y offset from room y
  z: number;          // local z offset (elevation)
  width: number;      // dimensions in feet/meters
  length: number;     // dimensions in feet/meters
  height: number;     // dimensions in feet/meters
  rotation: number;   // rotation in degrees: 0, 90, 180, 270
  color?: string;
  secondaryColor?: string;
  name?: string;
}

export interface Room {
  id: string;
  name: string;
  type: RoomType;
  x: number;      // Position in local units (feet or meters)
  y: number;      // Position in local units (feet or meters)
  width: number;  // Width in local units
  height: number; // Height in local units
  color?: string; // Hex or tailwind class color
  floorMaterial?: string; // Material ID for floor
  wallMaterial?: string;  // Material ID for walls
  furniture?: FurnitureItem[]; // Auto-Furnished furniture models
}

export interface Door {
  id: string;
  roomId?: string;
  x: number;
  y: number;
  width: number;
  type: 'horizontal' | 'vertical';
  isMain?: boolean;
}

export interface Window {
  id: string;
  roomId?: string;
  x: number;
  y: number;
  width: number;
  type: 'horizontal' | 'vertical';
}

export interface NaqshaSummary {
  recommendedBedrooms: number;
  bathrooms: number;
  kitchen: string;  // e.g., "Closed Kitchen", "Open Kitchen"
  tvLounge: string; // e.g., "Yes", "No"
  drawingRoom: string; // e.g., "Yes", "No"
  garage: string;   // e.g., "1 Car", "No", "2 Cars"
  lawn: string;     // e.g., "Front Lawn", "No", "Backyard"
  otherFeatures: string[];
}

export interface NaqshaLayout {
  width: number;
  length: number;
  unit: 'ft' | 'm';
  rooms: Room[];
  doors: Door[];
  windows: Window[];
  summary: NaqshaSummary;
  plotType?: 'corner' | 'standard';
  facing?: 'north' | 'south' | 'east' | 'west';
  activeFloor?: 'ground' | 'first' | 'second';
  autoFurnished?: boolean;
  floors?: {
    [key: string]: {
      rooms: Room[];
      doors: Door[];
      windows: Window[];
    };
  };
}

export interface SavedProject {
  id: string;
  name: string;
  createdAt: string;
  layout: NaqshaLayout;
}
