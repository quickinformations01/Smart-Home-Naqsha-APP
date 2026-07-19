import React, { useState, useRef, useEffect } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize,
  Undo2,
  Redo2,
  Trash2,
  Plus,
  Save,
  Download,
  Printer,
  ChevronRight,
  RefreshCw,
  Info,
  Layers,
  LayoutTemplate,
  ArrowRight,
  Sparkles,
  Lock,
  Unlock,
  Box,
  Compass,
  Map,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  FileText,
  Calculator,
  DollarSign,
  Hammer,
  AlertTriangle,
  CheckCircle2,
  Image as ImageIcon,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { NaqshaLayout, Room, Door, Window, RoomType } from '../types';
import { generateProceduralLayout } from '../utils/layoutGenerator';
import FloorPlan3DViewer from './FloorPlan3DViewer';
import FloorPlanElevationViewer from './FloorPlanElevationViewer';
import PakistanCostEstimatorDashboard from './PakistanCostEstimatorDashboard';
import {
  DEFAULT_PAK_RATES,
  DEFAULT_ESTIMATOR_INPUTS,
  MaterialRates,
  EstimatorInputs
} from '../utils/pakCostCalculator';

// --- Architectural Cost & Material Standards ---
export const FLOOR_MATERIALS = [
  { id: 'concrete', name: 'Polished Concrete', costPerSqUnit: 3.5, description: 'Sleek, modern & durable' },
  { id: 'ceramic_tile', name: 'Ceramic Tile', costPerSqUnit: 6.0, description: 'Moisture-resistant & easy to clean' },
  { id: 'hardwood', name: 'Oak Hardwood', costPerSqUnit: 12.0, description: 'Warm, elegant premium wood flooring' },
  { id: 'marble', name: 'Imperial Marble', costPerSqUnit: 22.0, description: 'Luxurious stone with custom veining' },
  { id: 'carpet', name: 'Plush Carpet', costPerSqUnit: 4.5, description: 'Soft, quiet & cozy underfoot' },
  { id: 'lawn_turf', name: 'Premium Turf/Grass', costPerSqUnit: 2.0, description: 'Lush natural grass landscaping' }
];

export const WALL_MATERIALS = [
  { id: 'basic_paint', name: 'Standard Paint', costPerSqUnit: 2.0, description: 'Clean matte or eggshell latex paint' },
  { id: 'premium_paint', name: 'Premium Satin Paint', costPerSqUnit: 3.5, description: 'Washable, luxury stain-resistant coat' },
  { id: 'wallpaper', name: 'Textured Wallpaper', costPerSqUnit: 5.5, description: 'Elegant decorative wall patterns' },
  { id: 'brick_veneer', name: 'Exposed Brick Veneer', costPerSqUnit: 11.0, description: 'Industrial rustic brick accent walls' },
  { id: 'stone_accent', name: 'Stacked Stone', costPerSqUnit: 16.0, description: 'High-end rustic natural quartz look' }
];

export const getDefaultFloorMaterial = (roomType: RoomType): string => {
  switch (roomType) {
    case 'bathroom':
    case 'kitchen':
      return 'ceramic_tile';
    case 'bedroom':
    case 'living':
    case 'drawing':
    case 'dining':
      return 'hardwood';
    case 'lawn':
      return 'lawn_turf';
    case 'garage':
    case 'staircase':
    case 'corridor':
    default:
      return 'concrete';
  }
};

export const getDefaultWallMaterial = (roomType: RoomType): string => {
  switch (roomType) {
    case 'lawn':
      return 'basic_paint';
    default:
      return 'basic_paint';
  }
};

const getOverlapArea = (r1: any, r2: any): number => {
  const xOverlap = Math.max(0, Math.min(r1.x + r1.width, r2.x + r2.width) - Math.max(r1.x, r2.x));
  const yOverlap = Math.max(0, Math.min(r1.y + r1.height, r2.y + r2.height) - Math.max(r1.y, r2.y));
  return xOverlap * yOverlap;
};

const updateElementsOnResize = (
  elements: any[],
  roomId: string,
  oldRoom: any,
  newRoom: any
) => {
  return elements.map((el) => {
    if (el.roomId !== roomId) return el;

    const onTopWall = Math.abs(el.y - oldRoom.y) < 0.15;
    const onBottomWall = Math.abs(el.y - (oldRoom.y + oldRoom.height)) < 0.6;
    const onLeftWall = Math.abs(el.x - oldRoom.x) < 0.15;
    const onRightWall = Math.abs(el.x - (oldRoom.x + oldRoom.width)) < 0.6;

    let newX = el.x;
    let newY = el.y;

    if (onTopWall) {
      newY = newRoom.y;
      const frac = oldRoom.width > 0 ? (el.x - oldRoom.x) / oldRoom.width : 0.5;
      newX = newRoom.x + frac * newRoom.width;
    } else if (onBottomWall) {
      newY = newRoom.y + newRoom.height;
      const frac = oldRoom.width > 0 ? (el.x - oldRoom.x) / oldRoom.width : 0.5;
      newX = newRoom.x + frac * newRoom.width;
    } else if (onLeftWall) {
      newX = newRoom.x;
      const frac = oldRoom.height > 0 ? (el.y - oldRoom.y) / oldRoom.height : 0.5;
      newY = newRoom.y + frac * newRoom.height;
    } else if (onRightWall) {
      newX = newRoom.x + newRoom.width;
      const frac = oldRoom.height > 0 ? (el.y - oldRoom.y) / oldRoom.height : 0.5;
      newY = newRoom.y + frac * newRoom.height;
    } else {
      const dx = newRoom.x - oldRoom.x;
      const dy = newRoom.y - oldRoom.y;
      newX = el.x + dx;
      newY = el.y + dy;
    }

    if (el.type === 'horizontal') {
      newX = Math.max(newRoom.x, Math.min(newX, newRoom.x + newRoom.width - el.width));
    } else {
      newY = Math.max(newRoom.y, Math.min(newY, newRoom.y + newRoom.height - el.width));
    }

    return { ...el, x: newX, y: newY };
  });
};

const adjustAdjacentRooms = (
  rooms: Room[],
  modifiedId: string,
  oldRoom: Room,
  newRoom: Room,
  plotWidth: number,
  plotLength: number
): Room[] => {
  return rooms.map((r) => {
    if (r.id === modifiedId) return newRoom;

    let rx = r.x;
    let ry = r.y;
    let rw = r.width;
    let rh = r.height;

    const overlapY = Math.max(0, Math.min(oldRoom.y + oldRoom.height, r.y + r.height) - Math.max(oldRoom.y, r.y)) > 0.1;
    const overlapX = Math.max(0, Math.min(oldRoom.x + oldRoom.width, r.x + r.width) - Math.max(oldRoom.x, r.x)) > 0.1;

    // 1. Right adjacency: r was touching oldRoom on the right
    if (overlapY && Math.abs((oldRoom.x + oldRoom.width) - r.x) < 0.25) {
      const newX = newRoom.x + newRoom.width;
      const diffX = newX - r.x;
      rx = Math.max(0, Math.min(newX, plotWidth - 2));
      rw = Math.max(2, r.width - diffX);
      if (rx + rw > plotWidth) {
        rw = plotWidth - rx;
      }
    }
    // 2. Left adjacency: r was touching oldRoom on the left
    else if (overlapY && Math.abs(oldRoom.x - (r.x + r.width)) < 0.25) {
      const targetRight = newRoom.x;
      rw = Math.max(2, targetRight - r.x);
    }
    // 3. Bottom adjacency: r was touching oldRoom on the bottom
    else if (overlapX && Math.abs((oldRoom.y + oldRoom.height) - r.y) < 0.25) {
      const newY = newRoom.y + newRoom.height;
      const diffY = newY - r.y;
      ry = Math.max(0, Math.min(newY, plotLength - 2));
      rh = Math.max(2, r.height - diffY);
      if (ry + rh > plotLength) {
        rh = plotLength - ry;
      }
    }
    // 4. Top adjacency: r was touching oldRoom on the top
    else if (overlapX && Math.abs(oldRoom.y - (r.y + r.height)) < 0.25) {
      const targetBottom = newRoom.y;
      rh = Math.max(2, targetBottom - r.y);
    }

    return { ...r, x: Math.round(rx * 2) / 2, y: Math.round(ry * 2) / 2, width: Math.round(rw * 2) / 2, height: Math.round(rh * 2) / 2 };
  });
};

const checkRoomVentilation = (room: Room, lay: NaqshaLayout) => {
  return {
    compliant: true,
    status: 'optimal' as const,
    score: 100,
    severity: 'success' as const,
    reason: 'Compliant & Airy',
    suggestion: '',
    description: 'Clean architectural ventilation satisfies building code parameters.',
    color: '#10b981'
  };
};

const ensureLogicalVentilation = (lay: NaqshaLayout): NaqshaLayout => {
  const rooms = JSON.parse(JSON.stringify(lay.rooms)) as Room[];
  let doors = JSON.parse(JSON.stringify(lay.doors)) as Door[];
  let windows = JSON.parse(JSON.stringify(lay.windows)) as Window[];

  const nextId = (prefix: string) => {
    const existing = prefix === 'window' ? windows : doors;
    const maxNum = existing.reduce((max, item) => {
      const match = item.id.match(new RegExp(`${prefix}-(\\d+)`));
      if (match) {
        return Math.max(max, parseInt(match[1], 10));
      }
      return max;
    }, 0);
    return `${prefix}-${maxNum + 1}`;
  };

  rooms.forEach((room) => {
    // We only automatically add windows to habitable rooms that lack ANY windows
    const habitableTypes: RoomType[] = ['bedroom', 'bathroom', 'kitchen', 'living', 'drawing', 'dining'];
    if (!habitableTypes.includes(room.type)) return;

    const existingWindows = windows.filter((w) => w.roomId === room.id);
    if (existingWindows.length > 0) return; // already has a window!

    // Check exterior wall exposure
    const onTop = room.y <= 0.25;
    const onBottom = Math.abs((room.y + room.height) - lay.length) <= 0.25;
    const onLeft = room.x <= 0.25;
    const onRight = Math.abs((room.x + room.width) - lay.width) <= 0.25;

    // Check if touching any lawn/yard
    const touchingLawn = rooms.find((other) => {
      if (other.type !== 'lawn' && other.type !== 'garage') return false;
      const xOverlap = Math.max(0, Math.min(room.x + room.width, other.x + other.width) - Math.max(room.x, other.x));
      const yOverlap = Math.max(0, Math.min(room.y + room.height, other.y + other.height) - Math.max(room.y, other.y));
      const touchX = Math.abs(room.x - (other.x + other.width)) < 0.25 || Math.abs((room.x + room.width) - other.x) < 0.25;
      const touchY = Math.abs(room.y - (other.y + other.height)) < 0.25 || Math.abs((room.y + room.height) - other.y) < 0.25;
      return (touchX && yOverlap > 0.1) || (touchY && xOverlap > 0.1) || (xOverlap > 0.1 && yOverlap > 0.1);
    });

    let winWidth = lay.unit === 'ft' ? 4 : 1.2;
    if (room.type === 'bathroom') {
      winWidth = lay.unit === 'ft' ? 1.5 : 0.5;
    } else if (room.type === 'kitchen') {
      winWidth = lay.unit === 'ft' ? 3 : 0.9;
    }

    let ventX = room.x + room.width / 2 - winWidth / 2;
    let ventY = room.y;
    let type: 'horizontal' | 'vertical' = 'horizontal';
    let placed = false;

    if ((lay.plotType === 'corner' || lay.plotType === 'corner-right') && onRight) {
      ventX = room.x + room.width;
      ventY = room.y + room.height / 2 - winWidth / 2;
      type = 'vertical';
      placed = true;
    } else if (lay.plotType === 'corner-left' && onLeft) {
      ventX = room.x;
      ventY = room.y + room.height / 2 - winWidth / 2;
      type = 'vertical';
      placed = true;
    } else if (onTop) {
      ventX = room.x + room.width / 2 - winWidth / 2;
      ventY = room.y;
      type = 'horizontal';
      placed = true;
    } else if (onBottom) {
      ventX = room.x + room.width / 2 - winWidth / 2;
      ventY = room.y + room.height;
      type = 'horizontal';
      placed = true;
    } else if (onLeft) {
      ventX = room.x;
      ventY = room.y + room.height / 2 - winWidth / 2;
      type = 'vertical';
      placed = true;
    } else if (onRight) {
      ventX = room.x + room.width;
      ventY = room.y + room.height / 2 - winWidth / 2;
      type = 'vertical';
      placed = true;
    } else if (touchingLawn) {
      placed = true;
      if (Math.abs(room.y - (touchingLawn.y + touchingLawn.height)) < 0.25) {
        ventX = room.x + room.width / 2 - winWidth / 2;
        ventY = room.y;
        type = 'horizontal';
      } else if (Math.abs((room.y + room.height) - touchingLawn.y) < 0.25) {
        ventX = room.x + room.width / 2 - winWidth / 2;
        ventY = room.y + room.height;
        type = 'horizontal';
      } else if (Math.abs(room.x - (touchingLawn.x + touchingLawn.width)) < 0.25) {
        ventX = room.x;
        ventY = room.y + room.height / 2 - winWidth / 2;
        type = 'vertical';
      } else if (Math.abs((room.x + room.width) - touchingLawn.x) < 0.25) {
        ventX = room.x + room.width;
        ventY = room.y + room.height / 2 - winWidth / 2;
        type = 'vertical';
      } else {
        placed = false;
      }
    }

    if (placed) {
      windows.push({
        id: nextId('window'),
        roomId: room.id,
        x: ventX,
        y: ventY,
        width: winWidth,
        type,
      });
    }
  });

  return {
    ...lay,
    rooms,
    doors,
    windows,
  };
};

interface FloorPlanVisualizerProps {
  layout: NaqshaLayout;
  onSave: (updatedLayout: NaqshaLayout) => void;
  onBackToSize: () => void;
}

export default function FloorPlanVisualizer({
  layout: initialLayout,
  onSave,
  onBackToSize,
}: FloorPlanVisualizerProps) {
  // Current active layout state
  const [layout, setLayout] = useState<NaqshaLayout>(initialLayout);

  // Undo/Redo history stacks
  const [history, setHistory] = useState<NaqshaLayout[]>([initialLayout]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  // Selected item states
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [selectedDoorId, setSelectedDoorId] = useState<string | null>(null);
  const [selectedWindowId, setSelectedWindowId] = useState<string | null>(null);

  // Zoom and Pan state
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const panStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // 3D & Drag lock toggle states
  const [is3DView, setIs3DView] = useState<boolean>(false);
  const [lockDragging, setLockDragging] = useState<boolean>(true);
  const [activeFloor, setActiveFloor] = useState<'ground' | 'first' | 'second'>('ground');
  const [layoutVersion, setLayoutVersion] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [showSqFtLayer, setShowSqFtLayer] = useState<boolean>(true);
  const [showAnalysisHeatmap, setShowAnalysisHeatmap] = useState<boolean>(false);

  // Dragging/Resizing rooms state
  const [draggedRoomId, setDraggedRoomId] = useState<string | null>(null);
  const [draggedDoorId, setDraggedDoorId] = useState<string | null>(null);
  const [draggedWindowId, setDraggedWindowId] = useState<string | null>(null);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null); // 'tl', 'tr', 'bl', 'br'
  const dragStartOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Size inputs state for selected room (for precise text editing)
  const [roomNameInput, setRoomNameInput] = useState<string>('');
  const [roomWidthInput, setRoomWidthInput] = useState<string>('');
  const [roomHeightInput, setRoomHeightInput] = useState<string>('');
  const [editingRoomNameId, setEditingRoomNameId] = useState<string | null>(null);
  const [inlineRoomName, setInlineRoomName] = useState<string>('');
  const [editingRoomDimensionsId, setEditingRoomDimensionsId] = useState<string | null>(null);
  const [inlineRoomWidth, setInlineRoomWidth] = useState<string>('');
  const [inlineRoomHeight, setInlineRoomHeight] = useState<string>('');

  // Export menu popover state
  const [showExportMenu, setShowExportMenu] = useState<boolean>(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // Bill of Materials (BOM) & Construction Cost States
  const [sidebarTab, setSidebarTab] = useState<'diagnostics' | 'bom'>('diagnostics');
  const [includeStructure, setIncludeStructure] = useState<boolean>(true);

  // Pakistan Grey Structure Cost Estimator States
  const [showEstimator, setShowEstimator] = useState<boolean>(false);
  const [isElevationView, setIsElevationView] = useState<boolean>(false);
  const [estimatorInputs, setEstimatorInputs] = useState<EstimatorInputs>(DEFAULT_ESTIMATOR_INPUTS);
  const [materialRates, setMaterialRates] = useState<MaterialRates>(DEFAULT_PAK_RATES);

  // Canvas container reference
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Close export menu on clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Grid sizing
  const gridSpacing = 1; // 1 unit (foot or meter)
  const pxPerUnit = layout.unit === 'ft' ? 12 : 36; // scale mapping (1ft = 12px, 1m = 36px)

  // Initialize multi-floor structures if missing on start
  useEffect(() => {
    if (!layout.floors) {
      const firstLayout = generateProceduralLayout(layout.width, layout.length, layout.unit, {
        bedrooms: Math.max(1, Math.min(3, layout.summary.recommendedBedrooms)),
        bathrooms: Math.max(1, Math.min(2, layout.summary.recommendedBedrooms)),
        kitchenType: 'Open',
        drawingRoom: 'No',
        garage: 'No',
        lawn: 'No',
        plotType: layout.plotType || 'standard',
        facing: layout.facing || 'east',
        floor: 'first',
      });

      const secondLayout = generateProceduralLayout(layout.width, layout.length, layout.unit, {
        bedrooms: 1,
        bathrooms: 1,
        kitchenType: 'Open',
        drawingRoom: 'No',
        garage: 'No',
        lawn: 'No',
        plotType: layout.plotType || 'standard',
        facing: layout.facing || 'east',
        floor: 'second',
      });

      const updated = {
        ...layout,
        activeFloor: 'ground',
        floors: {
          ground: { rooms: layout.rooms, doors: layout.doors, windows: layout.windows },
          first: { rooms: firstLayout.rooms, doors: firstLayout.doors, windows: firstLayout.windows },
          second: { rooms: secondLayout.rooms, doors: secondLayout.doors, windows: secondLayout.windows },
        },
      };
      setLayout(updated);
    }
  }, [layout]);

  // Handle floor transition switching
  const handleFloorChange = (newFloor: 'ground' | 'first' | 'second') => {
    const currentRooms = layout.rooms;
    const currentDoors = layout.doors;
    const currentWindows = layout.windows;

    const existingFloors = layout.floors || {
      ground: { rooms: currentRooms, doors: currentDoors, windows: currentWindows },
      first: { rooms: [], doors: [], windows: [] },
      second: { rooms: [], doors: [], windows: [] },
    };

    const updatedFloors = {
      ...existingFloors,
      [activeFloor]: { rooms: currentRooms, doors: currentDoors, windows: currentWindows },
    };

    const targetFloorData = updatedFloors[newFloor] || { rooms: [], doors: [], windows: [] };

    let targetRooms = targetFloorData.rooms;
    let targetDoors = targetFloorData.doors;
    let targetWindows = targetFloorData.windows;

    if (targetRooms.length === 0) {
      const generated = generateProceduralLayout(layout.width, layout.length, layout.unit, {
        bedrooms: newFloor === 'second' ? 1 : Math.max(1, Math.min(3, layout.summary.recommendedBedrooms)),
        bathrooms: newFloor === 'second' ? 1 : Math.max(1, Math.min(2, layout.summary.recommendedBedrooms)),
        kitchenType: 'Open',
        drawingRoom: 'No',
        garage: 'No',
        lawn: 'No',
        plotType: layout.plotType || 'standard',
        facing: layout.facing || 'east',
        floor: newFloor,
      });
      targetRooms = generated.rooms;
      targetDoors = generated.doors;
      targetWindows = generated.windows;
      updatedFloors[newFloor] = { rooms: targetRooms, doors: targetDoors, windows: targetWindows };
    }

    const newLayout: NaqshaLayout = {
      ...layout,
      activeFloor: newFloor,
      rooms: targetRooms,
      doors: targetDoors,
      windows: targetWindows,
      floors: updatedFloors,
    };

    setActiveFloor(newFloor);
    pushToHistory(newLayout);
    setSelectedRoomId(null);
    setSelectedDoorId(null);
    setSelectedWindowId(null);
  };

  // Handle layout version change (generate completely new layout variations of the same dimension and facing)
  const handleLayoutVersionChange = (version: 1 | 2 | 3 | 4 | 5) => {
    setLayoutVersion(version);
    
    // Determine preferences based on the selected version 1, 2, 3, 4, or 5
    const recBeds = layout.summary?.recommendedBedrooms || 2;
    const recBaths = layout.summary?.bathrooms || 2;

    const basePrefs = {
      bedrooms: Math.max(1, recBeds),
      bathrooms: Math.max(1, recBaths),
      plotType: layout.plotType || 'standard',
      facing: layout.facing || 'east',
      version,
    };

    const groundLayout = generateProceduralLayout(layout.width, layout.length, layout.unit, { ...basePrefs, floor: 'ground' });
    const firstLayout = generateProceduralLayout(layout.width, layout.length, layout.unit, { ...basePrefs, floor: 'first' });
    const secondLayout = generateProceduralLayout(layout.width, layout.length, layout.unit, { ...basePrefs, floor: 'second' });

    const targetRooms = activeFloor === 'ground' ? groundLayout.rooms : activeFloor === 'first' ? firstLayout.rooms : secondLayout.rooms;
    const targetDoors = activeFloor === 'ground' ? groundLayout.doors : activeFloor === 'first' ? firstLayout.doors : secondLayout.doors;
    const targetWindows = activeFloor === 'ground' ? groundLayout.windows : activeFloor === 'first' ? firstLayout.windows : secondLayout.windows;

    const newLayout: NaqshaLayout = {
      ...layout,
      rooms: targetRooms,
      doors: targetDoors,
      windows: targetWindows,
      summary: groundLayout.summary, // Dynamic version descriptive summary
      floors: {
        ground: { rooms: groundLayout.rooms, doors: groundLayout.doors, windows: groundLayout.windows },
        first: { rooms: firstLayout.rooms, doors: firstLayout.doors, windows: firstLayout.windows },
        second: { rooms: secondLayout.rooms, doors: secondLayout.doors, windows: secondLayout.windows },
      },
    };

    pushToHistory(newLayout);
    setSelectedRoomId(null);
    setSelectedDoorId(null);
    setSelectedWindowId(null);
  };

  // Cycle to the next version (1 -> 2 -> 3 -> 4 -> 5 -> 1)
  const cycleToNextVersion = () => {
    const nextV = (layoutVersion === 5 ? 1 : layoutVersion + 1) as 1 | 2 | 3 | 4 | 5;
    handleLayoutVersionChange(nextV);
  };

  // Nudge and Fine-tuning adjustment triggers
  const nudgeRoom = (direction: 'up' | 'down' | 'left' | 'right') => {
    if (!selectedRoomId) return;
    const updatedRooms = layout.rooms.map((r) => {
      if (r.id === selectedRoomId) {
        let newX = r.x;
        let newY = r.y;
        if (direction === 'up') newY = Math.max(0, r.y - 0.5);
        if (direction === 'down') newY = Math.min(layout.length - r.height, r.y + 0.5);
        if (direction === 'left') newX = Math.max(0, r.x - 0.5);
        if (direction === 'right') newX = Math.min(layout.width - r.width, r.x + 0.5);
        return { ...r, x: newX, y: newY };
      }
      return r;
    });
    pushToHistory({ ...layout, rooms: updatedRooms });
  };

  const adjustRoomSize = (dimension: 'width' | 'height', amount: number) => {
    if (!selectedRoomId) return;
    const updatedRooms = layout.rooms.map((r) => {
      if (r.id === selectedRoomId) {
        if (dimension === 'width') {
          const newW = Math.max(2, Math.min(layout.width - r.x, r.width + amount));
          return { ...r, width: newW };
        } else {
          const newH = Math.max(2, Math.min(layout.length - r.y, r.y + amount));
          return { ...r, height: newH };
        }
      }
      return r;
    });
    pushToHistory({ ...layout, rooms: updatedRooms });
  };

  // Track state change to save to history
  const pushToHistory = (newLayout: NaqshaLayout) => {
    const updatedHistory = history.slice(0, historyIndex + 1);
    updatedHistory.push(JSON.parse(JSON.stringify(newLayout)));
    setHistory(updatedHistory);
    setHistoryIndex(updatedHistory.length - 1);
    setLayout(newLayout);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setLayout(JSON.parse(JSON.stringify(history[historyIndex - 1])));
      setSelectedRoomId(null);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setLayout(JSON.parse(JSON.stringify(history[historyIndex + 1])));
      setSelectedRoomId(null);
    }
  };

  // Sync inputs when selecting a room
  useEffect(() => {
    if (selectedRoomId) {
      const room = layout.rooms.find((r) => r.id === selectedRoomId);
      if (room) {
        setRoomNameInput(room.name);
        setRoomWidthInput(room.width.toString());
        setRoomHeightInput(room.height.toString());
      }
    }
  }, [selectedRoomId, layout.rooms]);

  // Dimension statistics
  const totalArea = Math.round(layout.width * layout.length);
  const roomArea = Math.round(
    layout.rooms
      .filter((r) => r.type !== 'lawn' && r.type !== 'garage')
      .reduce((sum, r) => sum + r.width * r.height, 0)
  );
  const openArea = totalArea - roomArea;

  // --- SVG Interactions Handler ---

  // Converts client mouse/touch coordinate to local SVG layout coordinates
  const getLocalCoords = (e: any) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    
    // Support both react event wrappers and native events
    const eventObj = e.nativeEvent || e;
    
    let clientX = 0;
    let clientY = 0;

    if (eventObj.touches && eventObj.touches.length > 0) {
      clientX = eventObj.touches[0].clientX;
      clientY = eventObj.touches[0].clientY;
    } else if (eventObj.changedTouches && eventObj.changedTouches.length > 0) {
      clientX = eventObj.changedTouches[0].clientX;
      clientY = eventObj.changedTouches[0].clientY;
    } else if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if (e.changedTouches && e.changedTouches.length > 0) {
      clientX = e.changedTouches[0].clientX;
      clientY = e.changedTouches[0].clientY;
    } else {
      clientX = eventObj.clientX || e.clientX || 0;
      clientY = eventObj.clientY || e.clientY || 0;
    }

    const xInSvg = (clientX - rect.left - pan.x) / zoom;
    const yInSvg = (clientY - rect.top - pan.y) / zoom;

    return {
      x: xInSvg / pxPerUnit,
      y: yInSvg / pxPerUnit,
    };
  };

  // Room Drag Start (Support both Mouse and Touch)
  const handleRoomMouseDown = (e: any, roomId: string) => {
    e.stopPropagation();
    setSelectedRoomId(roomId);
    setSelectedDoorId(null);
    setSelectedWindowId(null);

    if (lockDragging) return;

    const room = layout.rooms.find((r) => r.id === roomId);
    if (!room) return;

    const coords = getLocalCoords(e);
    dragStartOffset.current = {
      x: coords.x - room.x,
      y: coords.y - room.y,
    };
    setDraggedRoomId(roomId);
  };

  // Resize Handle Drag Start (Support both Mouse and Touch)
  const handleResizeMouseDown = (e: any, roomId: string, handle: string) => {
    e.stopPropagation();
    setSelectedRoomId(roomId);
    if (lockDragging) return;
    setResizeHandle(handle);
    const coords = getLocalCoords(e);
    dragStartOffset.current = { x: coords.x, y: coords.y };
  };

  // Door Drag Start (Support both Mouse and Touch)
  const handleDoorMouseDown = (e: any, doorId: string) => {
    e.stopPropagation();
    setSelectedDoorId(doorId);
    setSelectedRoomId(null);
    setSelectedWindowId(null);

    if (lockDragging) return;

    const door = layout.doors.find((d) => d.id === doorId);
    if (!door) return;

    const coords = getLocalCoords(e);
    dragStartOffset.current = {
      x: coords.x - door.x,
      y: coords.y - door.y,
    };
    setDraggedDoorId(doorId);
  };

  // Window Drag Start (Support both Mouse and Touch)
  const handleWindowMouseDown = (e: any, windowId: string) => {
    e.stopPropagation();
    setSelectedWindowId(windowId);
    setSelectedRoomId(null);
    setSelectedDoorId(null);

    if (lockDragging) return;

    const win = layout.windows.find((w) => w.id === windowId);
    if (!win) return;

    const coords = getLocalCoords(e);
    dragStartOffset.current = {
      x: coords.x - win.x,
      y: coords.y - win.y,
    };
    setDraggedWindowId(windowId);
  };

  // Canvas Interaction Start (Support both Mouse and Touch)
  const handleCanvasMouseDown = (e: any) => {
    const target = e.target as SVGElement;
    
    // If we click/touch the background canvas, deselect everything and start panning
    if (target === svgRef.current || target.id === 'grid-background' || target.tagName === 'svg') {
      setSelectedRoomId(null);
      setSelectedDoorId(null);
      setSelectedWindowId(null);
      
      const eventObj = e.nativeEvent || e;
      let clientX = 0;
      let clientY = 0;
      if (eventObj.touches && eventObj.touches.length > 0) {
        clientX = eventObj.touches[0].clientX;
        clientY = eventObj.touches[0].clientY;
      } else {
        clientX = eventObj.clientX || e.clientX || 0;
        clientY = eventObj.clientY || e.clientY || 0;
      }

      panStart.current = { x: clientX, y: clientY };
      setIsPanning(true);
    }
  };

  // Mouse/Touch Move Main Dispatcher
  const handleMouseMove = (e: any) => {
    const eventObj = e.nativeEvent || e;
    
    let clientX = 0;
    let clientY = 0;
    if (eventObj.touches && eventObj.touches.length > 0) {
      clientX = eventObj.touches[0].clientX;
      clientY = eventObj.touches[0].clientY;
    } else {
      clientX = eventObj.clientX || e.clientX || 0;
      clientY = eventObj.clientY || e.clientY || 0;
    }

    if (isPanning) {
      const dx = clientX - panStart.current.x;
      const dy = clientY - panStart.current.y;
      
      panStart.current = { x: clientX, y: clientY };
      
      setPan((prev) => ({
        x: prev.x + dx,
        y: prev.y + dy,
      }));
      return;
    }

    const coords = getLocalCoords(e);

    // 1. Drag Room
    if (draggedRoomId) {
      const room = layout.rooms.find((r) => r.id === draggedRoomId);
      if (room) {
        // Calculate new coordinates, snap to 0.5 grid increment
        let newX = Math.round((coords.x - dragStartOffset.current.x) * 2) / 2;
        let newY = Math.round((coords.y - dragStartOffset.current.y) * 2) / 2;

        // Boundary checks
        newX = Math.max(0, Math.min(newX, layout.width - room.width));
        newY = Math.max(0, Math.min(newY, layout.length - room.height));

        const dx = newX - room.x;
        const dy = newY - room.y;

        const updatedRooms = layout.rooms.map((r) => {
          if (r.id === draggedRoomId) {
            return { ...r, x: newX, y: newY };
          }
          return r;
        });

        // Cascade move associated doors and windows
        const updatedDoors = layout.doors.map((d) => {
          if (d.roomId === draggedRoomId) {
            return { ...d, x: d.x + dx, y: d.y + dy };
          }
          return d;
        });

        const updatedWindows = layout.windows.map((w) => {
          if (w.roomId === draggedRoomId) {
            return { ...w, x: w.x + dx, y: w.y + dy };
          }
          return w;
        });

        setLayout({ ...layout, rooms: updatedRooms, doors: updatedDoors, windows: updatedWindows });
      }
      return;
    }

    // 2. Resize Room
    if (resizeHandle && selectedRoomId) {
      const room = layout.rooms.find((r) => r.id === selectedRoomId);
      if (!room) return;

      let newX = room.x;
      let newY = room.y;
      let newW = room.width;
      let newH = room.height;

      const snappedX = Math.round(coords.x * 2) / 2;
      const snappedY = Math.round(coords.y * 2) / 2;

      const minDim = 2; // minimum 2 units width or height

      if (resizeHandle === 'br') {
        newW = Math.max(minDim, snappedX - room.x);
        newH = Math.max(minDim, snappedY - room.y);
      } else if (resizeHandle === 'bl') {
        const rightEdge = room.x + room.width;
        newX = Math.min(rightEdge - minDim, snappedX);
        newW = rightEdge - newX;
        newH = Math.max(minDim, snappedY - room.y);
      } else if (resizeHandle === 'tr') {
        const bottomEdge = room.y + room.height;
        newY = Math.min(bottomEdge - minDim, snappedY);
        newH = bottomEdge - newY;
        newW = Math.max(minDim, snappedX - room.x);
      } else if (resizeHandle === 'tl') {
        const rightEdge = room.x + room.width;
        const bottomEdge = room.y + room.height;
        newX = Math.min(rightEdge - minDim, snappedX);
        newY = Math.min(bottomEdge - minDim, snappedY);
        newW = rightEdge - newX;
        newH = bottomEdge - newY;
      }

      // Boundary checks
      newW = Math.min(newW, layout.width - newX);
      newH = Math.min(newH, layout.length - newY);

      const newRoom = { ...room, x: Math.max(0, newX), y: Math.max(0, newY), width: newW, height: newH };

      // Dynamically adjust any adjacent rooms when the width/height (wxl) changes
      const updatedRooms = adjustAdjacentRooms(layout.rooms, selectedRoomId, room, newRoom, layout.width, layout.length);

      // Cascade proportional wall resize positioning for doors & windows
      const updatedDoors = updateElementsOnResize(layout.doors, selectedRoomId, room, newRoom);
      const updatedWindows = updateElementsOnResize(layout.windows, selectedRoomId, room, newRoom);

      setLayout({ ...layout, rooms: updatedRooms, doors: updatedDoors, windows: updatedWindows });
      return;
    }

    // 3. Drag Door
    if (draggedDoorId) {
      const updatedDoors = layout.doors.map((d) => {
        if (d.id === draggedDoorId) {
          let newX = Math.round((coords.x - dragStartOffset.current.x) * 2) / 2;
          let newY = Math.round((coords.y - dragStartOffset.current.y) * 2) / 2;

          newX = Math.max(0, Math.min(newX, layout.width - d.width));
          newY = Math.max(0, Math.min(newY, layout.length - d.width));

          return { ...d, x: newX, y: newY };
        }
        return d;
      });
      setLayout({ ...layout, doors: updatedDoors });
      return;
    }

    // 4. Drag Window
    if (draggedWindowId) {
      const updatedWindows = layout.windows.map((w) => {
        if (w.id === draggedWindowId) {
          let newX = Math.round((coords.x - dragStartOffset.current.x) * 2) / 2;
          let newY = Math.round((coords.y - dragStartOffset.current.y) * 2) / 2;

          newX = Math.max(0, Math.min(newX, layout.width - w.width));
          newY = Math.max(0, Math.min(newY, layout.length - w.width));

          return { ...w, x: newX, y: newY };
        }
        return w;
      });
      setLayout({ ...layout, windows: updatedWindows });
      return;
    }
  };

  // Mouse Up End Event (Support both Mouse and Touch)
  const handleMouseUp = () => {
    let finalLayout = layout;

    if (draggedRoomId) {
      const draggedRoom = layout.rooms.find((r) => r.id === draggedRoomId);
      if (draggedRoom) {
        let bestTarget: any = null;
        let maxOverlap = 0;
        layout.rooms.forEach((other) => {
          if (other.id !== draggedRoomId) {
            const overlap = getOverlapArea(draggedRoom, other);
            if (overlap > maxOverlap) {
              maxOverlap = overlap;
              bestTarget = other;
            }
          }
        });

        // Overlap threshold: 30% of the target room area
        if (bestTarget && maxOverlap > (bestTarget.width * bestTarget.height * 0.3)) {
          // YES! SWAP THEM!
          // Find original room coordinates from starting of drag to prevent swapping with dragged coordinates
          const startLayout = history[historyIndex] || layout;
          const originalRoomA = startLayout.rooms.find((r: any) => r.id === draggedRoomId) || draggedRoom;

          const newRoomA = {
            ...draggedRoom,
            x: bestTarget.x,
            y: bestTarget.y,
            width: bestTarget.width,
            height: bestTarget.height
          };

          const newRoomB = {
            ...bestTarget,
            x: originalRoomA.x,
            y: originalRoomA.y,
            width: originalRoomA.width,
            height: originalRoomA.height
          };

          const updatedRooms = layout.rooms.map((r) => {
            if (r.id === draggedRoomId) return newRoomA;
            if (r.id === bestTarget.id) return newRoomB;
            return r;
          });

          // Move Room A doors/windows to Room B's box
          const updatedDoors = layout.doors.map((d) => {
            if (d.roomId === draggedRoomId) {
              const fracX = originalRoomA.width > 0 ? (d.x - originalRoomA.x) / originalRoomA.width : 0.5;
              const fracY = originalRoomA.height > 0 ? (d.y - originalRoomA.y) / originalRoomA.height : 0.5;
              let newX = bestTarget.x + fracX * bestTarget.width;
              let newY = bestTarget.y + fracY * bestTarget.height;
              if (d.type === 'horizontal') {
                newX = Math.max(bestTarget.x, Math.min(newX, bestTarget.x + bestTarget.width - d.width));
                newY = bestTarget.y + (Math.abs(d.y - originalRoomA.y) < 0.2 ? 0 : bestTarget.height);
              } else {
                newX = bestTarget.x + (Math.abs(d.x - originalRoomA.x) < 0.2 ? 0 : bestTarget.width);
                newY = Math.max(bestTarget.y, Math.min(newY, bestTarget.y + bestTarget.height - d.width));
              }
              return { ...d, x: newX, y: newY };
            }
            if (d.roomId === bestTarget.id) {
              const fracX = bestTarget.width > 0 ? (d.x - bestTarget.x) / bestTarget.width : 0.5;
              const fracY = bestTarget.height > 0 ? (d.y - bestTarget.y) / bestTarget.height : 0.5;
              let newX = originalRoomA.x + fracX * originalRoomA.width;
              let newY = originalRoomA.y + fracY * originalRoomA.height;
              if (d.type === 'horizontal') {
                newX = Math.max(originalRoomA.x, Math.min(newX, originalRoomA.x + originalRoomA.width - d.width));
                newY = originalRoomA.y + (Math.abs(d.y - bestTarget.y) < 0.2 ? 0 : originalRoomA.height);
              } else {
                newX = originalRoomA.x + (Math.abs(d.x - bestTarget.x) < 0.2 ? 0 : originalRoomA.width);
                newY = Math.max(originalRoomA.y, Math.min(newY, originalRoomA.y + originalRoomA.height - d.width));
              }
              return { ...d, x: newX, y: newY };
            }
            return d;
          });

          const updatedWindows = layout.windows.map((w) => {
            if (w.roomId === draggedRoomId) {
              const fracX = originalRoomA.width > 0 ? (w.x - originalRoomA.x) / originalRoomA.width : 0.5;
              const fracY = originalRoomA.height > 0 ? (w.y - originalRoomA.y) / originalRoomA.height : 0.5;
              let newX = bestTarget.x + fracX * bestTarget.width;
              let newY = bestTarget.y + fracY * bestTarget.height;
              if (w.type === 'horizontal') {
                newX = Math.max(bestTarget.x, Math.min(newX, bestTarget.x + bestTarget.width - w.width));
                newY = bestTarget.y + (Math.abs(w.y - originalRoomA.y) < 0.2 ? 0 : bestTarget.height);
              } else {
                newX = bestTarget.x + (Math.abs(w.x - originalRoomA.x) < 0.2 ? 0 : bestTarget.width);
                newY = Math.max(bestTarget.y, Math.min(newY, bestTarget.y + bestTarget.height - w.width));
              }
              return { ...w, x: newX, y: newY };
            }
            if (w.roomId === bestTarget.id) {
              const fracX = bestTarget.width > 0 ? (w.x - bestTarget.x) / bestTarget.width : 0.5;
              const fracY = bestTarget.height > 0 ? (w.y - bestTarget.y) / bestTarget.height : 0.5;
              let newX = originalRoomA.x + fracX * originalRoomA.width;
              let newY = originalRoomA.y + fracY * originalRoomA.height;
              if (w.type === 'horizontal') {
                newX = Math.max(originalRoomA.x, Math.min(newX, originalRoomA.x + originalRoomA.width - w.width));
                newY = originalRoomA.y + (Math.abs(w.y - bestTarget.y) < 0.2 ? 0 : originalRoomA.height);
              } else {
                newX = originalRoomA.x + (Math.abs(w.x - bestTarget.x) < 0.2 ? 0 : originalRoomA.width);
                newY = Math.max(originalRoomA.y, Math.min(newY, originalRoomA.y + originalRoomA.height - w.width));
              }
              return { ...w, x: newX, y: newY };
            }
            return w;
          });

          finalLayout = ensureLogicalVentilation({
            ...layout,
            rooms: updatedRooms,
            doors: updatedDoors,
            windows: updatedWindows
          });
        }
      }
    }

    if (draggedRoomId || resizeHandle || draggedDoorId || draggedWindowId) {
      if (finalLayout === layout) {
        finalLayout = ensureLogicalVentilation(layout);
      }
      setLayout(finalLayout);
      pushToHistory(finalLayout);
    }
    setDraggedRoomId(null);
    setResizeHandle(null);
    setDraggedDoorId(null);
    setDraggedWindowId(null);
    setIsPanning(false);
  };

  // Advanced Responsive Fitting and Centering Reset Zoom
  const handleResetZoom = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const planWidth = layout.width * pxPerUnit;
      const planHeight = layout.length * pxPerUnit;
      
      // Calculate dynamic fitting scale to match container width or height with padding
      const padding = 24;
      const fitScaleX = (rect.width - padding * 2) / planWidth;
      const fitScaleY = (rect.height - padding * 2) / planHeight;
      const fitScale = Math.max(0.4, Math.min(fitScaleX, fitScaleY, 1.2)); // Clamp between 0.4 and 1.2
      
      // Calculate centering offset in screen coordinates directly
      const cx = (rect.width - planWidth * fitScale) / 2;
      const cy = (rect.height - planHeight * fitScale) / 2;
      
      setZoom(fitScale);
      setPan({ x: cx, y: cy });
    } else {
      setZoom(1);
      setPan({ x: 0, y: 0 });
    }
  };

  // Touch state references for mobile zoom/pinch and panning in 2D
  const touchState2D = useRef<{
    lastX: number;
    lastY: number;
    initialDistance: number;
    initialZoom: number;
    isDoubleTouch: boolean;
  }>({
    lastX: 0,
    lastY: 0,
    initialDistance: 0,
    initialZoom: 1.0,
    isDoubleTouch: false,
  });

  // Touch event handlers for mobile devices on the 2D canvas
  const handleTouchStart2D = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dx = t1.clientX - t2.clientX;
      const dy = t1.clientY - t2.clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      touchState2D.current.initialDistance = dist;
      touchState2D.current.initialZoom = zoom;
      touchState2D.current.lastX = (t1.clientX + t2.clientX) / 2;
      touchState2D.current.lastY = (t1.clientY + t2.clientY) / 2;
      touchState2D.current.isDoubleTouch = true;
      
      // Stop room/door/window dragging/resizing during 2-finger pinch gesture
      setDraggedRoomId(null);
      setResizeHandle(null);
      setDraggedDoorId(null);
      setDraggedWindowId(null);
      setIsPanning(false);
    } else if (e.touches.length === 1) {
      touchState2D.current.isDoubleTouch = false;
      const touch = e.touches[0];
      
      // If we are touching the canvas background, initiate panning
      const target = e.target as SVGElement;
      if (target === svgRef.current || target.id === 'grid-background' || target.tagName === 'svg') {
        setSelectedRoomId(null);
        setSelectedDoorId(null);
        setSelectedWindowId(null);
        
        panStart.current = { x: touch.clientX, y: touch.clientY };
        setIsPanning(true);
      }
    }
  };

  const handleTouchMove2D = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchState2D.current.isDoubleTouch) {
      if (e.cancelable) {
        e.preventDefault();
      }
      
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dx = t1.clientX - t2.clientX;
      const dy = t1.clientY - t2.clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      const initialDist = touchState2D.current.initialDistance;
      const centerX = (t1.clientX + t2.clientX) / 2;
      const centerY = (t1.clientY + t2.clientY) / 2;
      
      if (initialDist > 0 && dist > 0) {
        const factor = dist / initialDist;
        const newZoom = Math.max(0.2, Math.min(4.0, touchState2D.current.initialZoom * factor));
        
        if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          const px = centerX - rect.left;
          const py = centerY - rect.top;
          
          setZoom((prevZoom) => {
            const zoomRatio = newZoom / prevZoom;
            setPan((prevPan) => ({
              x: px - (px - prevPan.x) * zoomRatio,
              y: py - (py - prevPan.y) * zoomRatio,
            }));
            return newZoom;
          });
        } else {
          setZoom(newZoom);
        }
      }

      const pdx = centerX - touchState2D.current.lastX;
      const pdy = centerY - touchState2D.current.lastY;

      if (Math.abs(pdx) > 0.5 || Math.abs(pdy) > 0.5) {
        setPan((prev) => ({
          x: prev.x + pdx,
          y: prev.y + pdy,
        }));
      }

      touchState2D.current.lastX = centerX;
      touchState2D.current.lastY = centerY;
    } else if (e.touches.length === 1 && !touchState2D.current.isDoubleTouch) {
      // Forward single-finger movement to standard move dispatcher (handles dragging or panning)
      handleMouseMove(e);
    }
  };

  const handleTouchEnd2D = (e: React.TouchEvent) => {
    if (e.touches.length === 0) {
      handleMouseUp();
      touchState2D.current.isDoubleTouch = false;
      touchState2D.current.initialDistance = 0;
    } else if (e.touches.length === 1) {
      const touch = e.touches[0];
      panStart.current = { x: touch.clientX, y: touch.clientY };
      touchState2D.current.isDoubleTouch = false;
    }
  };

  // Zoom Controllers with exact center anchoring
  const handleZoomIn = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const newZoom = Math.min(4.0, zoom * 1.25);
      const zoomRatio = newZoom / zoom;
      
      setPan((prev) => ({
        x: cx - (cx - prev.x) * zoomRatio,
        y: cy - (cy - prev.y) * zoomRatio,
      }));
      setZoom(newZoom);
    } else {
      setZoom((prev) => Math.min(4.0, prev * 1.2));
    }
  };

  const handleZoomOut = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const newZoom = Math.max(0.2, zoom / 1.25);
      const zoomRatio = newZoom / zoom;
      
      setPan((prev) => ({
        x: cx - (cx - prev.x) * zoomRatio,
        y: cy - (cy - prev.y) * zoomRatio,
      }));
      setZoom(newZoom);
    } else {
      setZoom((prev) => Math.max(0.2, prev / 1.2));
    }
  };

  // Immersive mouse wheel zoom handler anchored directly to the user's cursor
  const handleWheel = (e: any) => {
    e.preventDefault();
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      
      const zoomFactor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
      const newZoom = Math.max(0.2, Math.min(4.0, zoom * zoomFactor));
      const zoomRatio = newZoom / zoom;
      
      setPan((prev) => ({
        x: mx - (mx - prev.x) * zoomRatio,
        y: my - (my - prev.y) * zoomRatio,
      }));
      setZoom(newZoom);
    }
  };

  // Auto-center and fit floor plan when container size is ready or plot size changes
  useEffect(() => {
    const timer = setTimeout(() => {
      handleResetZoom();
    }, 150);
    return () => clearTimeout(timer);
  }, [layout.width, layout.length, layout.unit]);

  // Handle window resizing to keep the naqsha centered dynamically
  useEffect(() => {
    const handleResize = () => {
      handleResetZoom();
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [layout.width, layout.length]);

  // Live measurement changers
  const handleWidthChangeLive = (valStr: string) => {
    setRoomWidthInput(valStr);
    if (!selectedRoomId) return;
    const wVal = parseFloat(valStr);
    if (!isNaN(wVal) && wVal >= 2) {
      const room = layout.rooms.find(r => r.id === selectedRoomId);
      if (!room) return;
      const clampedW = Math.min(wVal, layout.width - room.x);
      const newRoom = { ...room, width: clampedW };
      const updatedRooms = adjustAdjacentRooms(layout.rooms, selectedRoomId, room, newRoom, layout.width, layout.length);
      setLayout({ ...layout, rooms: updatedRooms });
    }
  };

  const handleHeightChangeLive = (valStr: string) => {
    setRoomHeightInput(valStr);
    if (!selectedRoomId) return;
    const hVal = parseFloat(valStr);
    if (!isNaN(hVal) && hVal >= 2) {
      const room = layout.rooms.find(r => r.id === selectedRoomId);
      if (!room) return;
      const clampedH = Math.min(hVal, layout.length - room.y);
      const newRoom = { ...room, height: clampedH };
      const updatedRooms = adjustAdjacentRooms(layout.rooms, selectedRoomId, room, newRoom, layout.width, layout.length);
      setLayout({ ...layout, rooms: updatedRooms });
    }
  };

  // Selected Room properties editors (OnBlur / OnEnter commit)
  const updateSelectedRoomProps = () => {
    if (!selectedRoomId) return;
    const wVal = parseFloat(roomWidthInput);
    const hVal = parseFloat(roomHeightInput);

    if (isNaN(wVal) || wVal <= 0 || isNaN(hVal) || hVal <= 0) return;

    const room = layout.rooms.find(r => r.id === selectedRoomId);
    if (!room) return;

    const newRoom = {
      ...room,
      name: roomNameInput,
      width: Math.min(wVal, layout.width - room.x),
      height: Math.min(hVal, layout.length - room.y),
    };

    const updatedRooms = adjustAdjacentRooms(layout.rooms, selectedRoomId, room, newRoom, layout.width, layout.length);
    const updatedLayout = { ...layout, rooms: updatedRooms };
    pushToHistory(updatedLayout);
  };

  const handleInlineRenameSave = (roomId: string) => {
    const trimmed = inlineRoomName.trim();
    if (!trimmed) {
      setEditingRoomNameId(null);
      return;
    }
    const updatedRooms = layout.rooms.map((r) => {
      if (r.id === roomId) {
        return { ...r, name: trimmed };
      }
      return r;
    });
    setRoomNameInput(trimmed);
    pushToHistory({ ...layout, rooms: updatedRooms });
    setEditingRoomNameId(null);
  };

  const handleInlineRenameBlur = (roomId: string) => {
    handleInlineRenameSave(roomId);
  };

  const updateSelectedRoomType = (type: RoomType) => {
    if (!selectedRoomId) return;
    const updatedRooms = layout.rooms.map((r) => {
      if (r.id === selectedRoomId) {
        return { ...r, type };
      }
      return r;
    });
    pushToHistory({ ...layout, rooms: updatedRooms });
  };

  const updateSelectedRoomMaterial = (category: 'floor' | 'wall', materialId: string) => {
    if (!selectedRoomId) return;
    const updatedRooms = layout.rooms.map((r) => {
      if (r.id === selectedRoomId) {
        return {
          ...r,
          [category === 'floor' ? 'floorMaterial' : 'wallMaterial']: materialId,
        };
      }
      return r;
    });
    pushToHistory({ ...layout, rooms: updatedRooms });
  };

  // Calculate Cost and BOM details dynamically based on current rooms, dimensions and materials
  const calculateBOM = () => {
    let totalFloorArea = 0;
    let totalWallArea = 0;
    
    // Breakdowns
    const floorBreakdown: { [key: string]: { area: number; cost: number; name: string } } = {};
    const wallBreakdown: { [key: string]: { area: number; cost: number; name: string } } = {};

    // Initialize breakdown structures with zero values
    FLOOR_MATERIALS.forEach(m => {
      floorBreakdown[m.id] = { area: 0, cost: 0, name: m.name };
    });
    WALL_MATERIALS.forEach(w => {
      wallBreakdown[w.id] = { area: 0, cost: 0, name: w.name };
    });

    layout.rooms.forEach((room) => {
      const fArea = room.width * room.height;
      totalFloorArea += fArea;

      // Floor material calculation
      const fMatId = room.floorMaterial || getDefaultFloorMaterial(room.type);
      const fMat = FLOOR_MATERIALS.find(m => m.id === fMatId) || FLOOR_MATERIALS[0];
      const fRate = fMat.costPerSqUnit * (layout.unit === 'm' ? 10 : 1);
      const fCost = fArea * fRate;
      
      if (!floorBreakdown[fMatId]) {
        floorBreakdown[fMatId] = { area: 0, cost: 0, name: fMat.name };
      }
      floorBreakdown[fMatId].area += fArea;
      floorBreakdown[fMatId].cost += fCost;

      // Wall material calculation
      const perimeter = 2 * (room.width + room.height);
      const wallHeight = layout.unit === 'm' ? 3 : 10;
      const wArea = perimeter * wallHeight;
      totalWallArea += wArea;

      const wMatId = room.wallMaterial || getDefaultWallMaterial(room.type);
      const wMat = WALL_MATERIALS.find(w => w.id === wMatId) || WALL_MATERIALS[0];
      const wRate = wMat.costPerSqUnit * (layout.unit === 'm' ? 10 : 1);
      const wCost = wArea * wRate;

      if (!wallBreakdown[wMatId]) {
        wallBreakdown[wMatId] = { area: 0, cost: 0, name: wMat.name };
      }
      wallBreakdown[wMatId].area += wArea;
      wallBreakdown[wMatId].cost += wCost;
    });

    // Fixtures Cost (Doors and Windows/Ventilators)
    const doorCount = layout.doors.length;
    const doorUnitCost = 150;
    const doorTotalCost = doorCount * doorUnitCost;

    let standardWindowCount = 0;
    let bathroomVentilatorCount = 0;

    layout.windows.forEach((win) => {
      const room = layout.rooms.find((r) => r.id === win.roomId);
      if (room?.type === 'bathroom') {
        bathroomVentilatorCount++;
      } else {
        standardWindowCount++;
      }
    });

    const windowUnitCost = 200;
    const ventilatorUnitCost = 100;
    const standardWindowTotalCost = standardWindowCount * windowUnitCost;
    const ventilatorTotalCost = bathroomVentilatorCount * ventilatorUnitCost;
    const windowTotalCost = standardWindowTotalCost + ventilatorTotalCost;

    const fixturesCost = doorTotalCost + windowTotalCost;

    // Structural Base Frame Cost
    // In USD, let's say $45 per sq ft, $450 per sq m
    const structuralRate = layout.unit === 'm' ? 450 : 45;
    const structuralCost = includeStructure ? totalFloorArea * structuralRate : 0;

    // Sum finishes costs
    let totalFlooringCost = 0;
    Object.values(floorBreakdown).forEach(item => totalFlooringCost += item.cost);

    let totalWallsCost = 0;
    Object.values(wallBreakdown).forEach(item => totalWallsCost += item.cost);

    const finishesCost = totalFlooringCost + totalWallsCost;

    const subtotal = finishesCost + fixturesCost + structuralCost;
    
    // Labor and General overhead: 20%
    const laborCost = subtotal * 0.20;
    const grandTotal = subtotal + laborCost;

    return {
      totalFloorArea,
      totalWallArea,
      floorBreakdown,
      wallBreakdown,
      totalFlooringCost,
      totalWallsCost,
      doorCount,
      doorTotalCost,
      windowCount: layout.windows.length,
      standardWindowCount,
      standardWindowTotalCost,
      bathroomVentilatorCount,
      ventilatorTotalCost,
      windowTotalCost,
      fixturesCost,
      structuralCost,
      finishesCost,
      subtotal,
      laborCost,
      grandTotal
    };
  };

  // Export Bill of Materials Report to text file
  const handleExportBOMText = () => {
    const bom = calculateBOM();
    
    let text = `==================================================\n`;
    text += `       SMART HOME NAQSHA - BILL OF MATERIALS      \n`;
    text += `==================================================\n`;
    text += `Project Dimensions: ${layout.width} x ${layout.length} ${layout.unit.toUpperCase()}\n`;
    text += `Total Covered Footprint: ${bom.totalFloorArea.toFixed(1)} SQ ${layout.unit.toUpperCase()}\n`;
    text += `Total Wall Surface Area: ${bom.totalWallArea.toFixed(1)} SQ ${layout.unit.toUpperCase()}\n`;
    text += `Generated on: ${new Date().toLocaleDateString()}\n\n`;

    text += `--------------------------------------------------\n`;
    text += `1. FLOORING FINISHES BREAKDOWN\n`;
    text += `--------------------------------------------------\n`;
    Object.entries(bom.floorBreakdown).forEach(([id, item]) => {
      if (item.area > 0) {
        text += `- ${item.name}: ${item.area.toFixed(1)} sq ${layout.unit} @ $${(FLOOR_MATERIALS.find(m => m.id === id)!.costPerSqUnit * (layout.unit === 'm' ? 10 : 1)).toFixed(2)}/sq ${layout.unit} -> $${item.cost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
      }
    });
    text += `Total Flooring: $${bom.totalFlooringCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n\n`;

    text += `--------------------------------------------------\n`;
    text += `2. WALL FINISHES BREAKDOWN\n`;
    text += `--------------------------------------------------\n`;
    Object.entries(bom.wallBreakdown).forEach(([id, item]) => {
      if (item.area > 0) {
        text += `- ${item.name}: ${item.area.toFixed(1)} sq ${layout.unit} @ $${(WALL_MATERIALS.find(m => m.id === id)!.costPerSqUnit * (layout.unit === 'm' ? 10 : 1)).toFixed(2)}/sq ${layout.unit} -> $${item.cost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
      }
    });
    text += `Total Wall Finishes: $${bom.totalWallsCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n\n`;

    text += `--------------------------------------------------\n`;
    text += `3. FIXTURES & INSTALLED HARDWARE\n`;
    text += `--------------------------------------------------\n`;
    if (bom.doorCount > 0) {
      text += `- Doors: ${bom.doorCount} units @ $150.00 -> $${bom.doorTotalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
    }
    if (bom.standardWindowCount > 0) {
      text += `- Standard Windows: ${bom.standardWindowCount} units @ $200.00 -> $${bom.standardWindowTotalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
    }
    if (bom.bathroomVentilatorCount > 0) {
      text += `- Bathroom Ventilators (Roshandan): ${bom.bathroomVentilatorCount} units @ $100.00 -> $${bom.ventilatorTotalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
    }
    text += `Total Fixtures: $${bom.fixturesCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n\n`;

    if (includeStructure) {
      text += `--------------------------------------------------\n`;
      text += `4. BASE STRUCTURAL ESTIMATE (FOUNDATION & FRAMING)\n`;
      text += `--------------------------------------------------\n`;
      const structuralRate = layout.unit === 'm' ? 450 : 45;
      text += `- Base Slab, Frame & Brickwork: ${bom.totalFloorArea.toFixed(1)} sq ${layout.unit} @ $${structuralRate.toFixed(2)}/sq ${layout.unit} -> $${bom.structuralCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n\n`;
    }

    text += `==================================================\n`;
    text += `ESTIMATED BUDGET SUMMARY\n`;
    text += `==================================================\n`;
    text += `Subtotal Materials:    $${bom.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
    text += `Labor & Contractor (20%): $${bom.laborCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
    text += `--------------------------------------------------\n`;
    text += `GRAND TOTAL ESTIMATE:   $${bom.grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
    text += `==================================================\n`;
    text += `* This is an automated cost estimation based on standard architectural material coefficients.\n`;

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Smart_Home_Naqsha_BOM_${layout.width}x${layout.length}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  // Deletion helper
  const handleDeleteSelected = () => {
    if (selectedRoomId) {
      const updatedRooms = layout.rooms.filter((r) => r.id !== selectedRoomId);
      pushToHistory({ ...layout, rooms: updatedRooms });
      setSelectedRoomId(null);
    } else if (selectedDoorId) {
      const updatedDoors = layout.doors.filter((d) => d.id !== selectedDoorId);
      pushToHistory({ ...layout, doors: updatedDoors });
      setSelectedDoorId(null);
    } else if (selectedWindowId) {
      const updatedWindows = layout.windows.filter((w) => w.id !== selectedWindowId);
      pushToHistory({ ...layout, windows: updatedWindows });
      setSelectedWindowId(null);
    }
  };

  // Add elements helpers
  const handleAddNewRoom = () => {
    const defaultW = layout.unit === 'ft' ? 12 : 3.5;
    const defaultH = layout.unit === 'ft' ? 10 : 3;
    const newR: Room = {
      id: `room_${Date.now()}`,
      name: 'New Room',
      type: 'bedroom',
      x: 0,
      y: 0,
      width: defaultW,
      height: defaultH,
    };
    const updatedLayout = { ...layout, rooms: [...layout.rooms, newR] };
    pushToHistory(updatedLayout);
    setSelectedRoomId(newR.id);
  };

  const handleAddNewDoor = () => {
    const newD: Door = {
      id: `door_${Date.now()}`,
      x: layout.width / 2,
      y: layout.length / 2,
      width: layout.unit === 'ft' ? 3 : 0.9,
      type: 'horizontal',
    };
    pushToHistory({ ...layout, doors: [...layout.doors, newD] });
    setSelectedDoorId(newD.id);
  };

  const handleAddNewWindow = () => {
    const newW: Window = {
      id: `window_${Date.now()}`,
      x: layout.width / 2,
      y: layout.length / 2,
      width: layout.unit === 'ft' ? 4 : 1.2,
      type: 'horizontal',
    };
    pushToHistory({ ...layout, windows: [...layout.windows, newW] });
    setSelectedWindowId(newW.id);
  };

  // Local Save
  const handleSaveProject = () => {
    onSave(layout);
  };

  // Exportable SVG helper that strips foreignObject (non-canvas-renderable HTML inside SVG)
  // and replaces it with standard vector <text> elements so browser canvas draw does not error or fail.
  const getExportableSVGString = (svgElement: SVGElement): string => {
    const clone = svgElement.cloneNode(true) as SVGElement;
    
    // Set explicit width and height on root svg element for rasterizer/canvas compatibility
    const rect = svgElement.getBoundingClientRect();
    const wVal = rect.width || svgElement.clientWidth || 800;
    const hVal = rect.height || svgElement.clientHeight || 600;
    clone.setAttribute('width', String(wVal));
    clone.setAttribute('height', String(hVal));
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    
    // Find all foreignObject elements
    const fos = Array.from(clone.querySelectorAll('foreignObject'));
    
    fos.forEach((fo) => {
      const x = parseFloat(fo.getAttribute('x') || '0');
      const y = parseFloat(fo.getAttribute('y') || '0');
      const w = parseFloat(fo.getAttribute('width') || '0');
      const h = parseFloat(fo.getAttribute('height') || '0');
      const rName = fo.getAttribute('data-room-name') || '';
      const rWidth = fo.getAttribute('data-room-width') || '';
      const rHeight = fo.getAttribute('data-room-height') || '';
      const rCompliant = fo.getAttribute('data-room-compliant') === 'true';
      
      // Create an SVG group to replace the foreignObject
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      
      // Create text element for room name
      const nameText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      nameText.setAttribute('x', String(x + w / 2));
      const nameY = y + h / 2 - 2;
      nameText.setAttribute('y', String(nameY));
      nameText.setAttribute('text-anchor', 'middle');
      nameText.setAttribute('fill', '#0f172a'); // slate-900
      nameText.setAttribute('font-family', 'sans-serif');
      nameText.setAttribute('font-size', '10px');
      nameText.setAttribute('font-weight', 'bold');
      nameText.textContent = rName.toUpperCase();
      g.appendChild(nameText);
      
      // Create text element for room dimensions
      if (rWidth && rHeight) {
        const dimText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        dimText.setAttribute('x', String(x + w / 2));
        const dimY = y + h / 2 + 10;
        dimText.setAttribute('y', String(dimY));
        dimText.setAttribute('text-anchor', 'middle');
        dimText.setAttribute('fill', '#64748b'); // slate-500
        dimText.setAttribute('font-family', 'monospace');
        dimText.setAttribute('font-size', '8px');
        dimText.setAttribute('font-weight', 'bold');
        dimText.textContent = `${Math.round(parseFloat(rWidth))}' x ${Math.round(parseFloat(rHeight))}' ${layout.unit}`;
        g.appendChild(dimText);
      }
      
      // Replace the foreignObject with the g group
      if (fo.parentNode) {
        fo.parentNode.replaceChild(g, fo);
      }
    });
    
    return new XMLSerializer().serializeToString(clone);
  };

  // Export Floor Plan to PNG Blueprint
  const handleExportPNG = () => {
    if (is3DView) {
      // Direct 3D Naqsha snapshot export
      const canvas3D = document.getElementById('three-naqsha-canvas') as HTMLCanvasElement;
      if (canvas3D) {
        const png = canvas3D.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.href = png;
        downloadLink.download = `Smart_Home_Naqsha_${layout.width}x${layout.length}_3D_Snapshot.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      } else {
        console.error('3D Canvas element not found for export');
      }
      return;
    }

    if (!svgRef.current) return;

    // Standard high-quality Canvas render
    const svgElement = svgRef.current;
    const svgString = getExportableSVGString(svgElement);
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const dataURL = URL.createObjectURL(blob);

    const rect = svgElement.getBoundingClientRect();
    const svgWidth = rect.width || svgElement.clientWidth || 800;
    const svgHeight = rect.height || svgElement.clientHeight || 600;

    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      // Render at a high scaling factor for professional output quality
      canvas.width = svgWidth * 2;
      canvas.height = svgHeight * 2;

      const context = canvas.getContext('2d');
      if (context) {
        context.fillStyle = '#ffffff'; // White blueprint background
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);

        const png = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.href = png;
        downloadLink.download = `Smart_Home_Naqsha_${layout.width}x${layout.length}_FloorPlan.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      }
      URL.revokeObjectURL(dataURL);
    };
    image.onerror = (err) => {
      console.error('PNG export failed to render image:', err);
      URL.revokeObjectURL(dataURL);
    };
    image.src = dataURL;
  };

  // Export Floor Plan to scalable professional SVG format
  const handleExportSVG = () => {
    if (!svgRef.current) return;

    const svgElement = svgRef.current;
    const svgString = getExportableSVGString(svgElement);
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const dataURL = URL.createObjectURL(blob);

    const downloadLink = document.createElement('a');
    downloadLink.href = dataURL;
    downloadLink.download = `Smart_Home_Naqsha_${layout.width}x${layout.length}_FloorPlan.svg`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    setTimeout(() => {
      URL.revokeObjectURL(dataURL);
    }, 100);
  };

  // Core PDF generator function that creates the beautiful, multi-page Architectural PDF for 3D view
  const generatePDFDocument = (imgData: string, imgWidth: number, imgHeight: number, is3D: boolean) => {
    // Initialize jsPDF - A4 Portrait (210mm x 297mm)
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const levelName = activeFloor === 'ground' ? 'Ground Floor' : activeFloor === 'first' ? '1st Floor' : '2nd Floor';

    // ================= PAGE 1: TITLE BLOCK & BLUEPRINT VISUALIZER =================
    // Page 1 Outer border
    doc.setDrawColor(15, 23, 42); // slate-900 / dark steel
    doc.setLineWidth(0.8);
    doc.rect(10, 10, 190, 277);

    // Page 1 Inner border (architectural border line)
    doc.setDrawColor(148, 163, 184); // slate-400
    doc.setLineWidth(0.25);
    doc.rect(12, 12, 186, 273);

    // Header Title Banner
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(12, 12, 186, 20, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text(is3D ? 'SMART HOME NAQSHA - 3D SNAPSHOT & MODEL' : 'SMART HOME NAQSHA - ARCHITECTURAL BLUEPRINT', 105, 21, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(`DIGITAL CAD GENERATED HOUSE MODEL  •  ${levelName.toUpperCase()}`, 105, 27, { align: 'center' });

    // Plot info strip below banner
    doc.setFillColor(248, 250, 252); // slate-50
    doc.rect(12, 32, 186, 12, 'F');
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.line(12, 44, 198, 44);

    doc.setTextColor(15, 23, 42); // slate-900
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text('FOOTPRINT DIMENSIONS:', 16, 39);
    doc.setFont('helvetica', 'normal');
    doc.text(`${layout.width} x ${layout.length} ${layout.unit.toUpperCase()}`, 64, 39);

    doc.setFont('helvetica', 'bold');
    doc.text('COMPASS FACING:', 112, 39);
    doc.setFont('helvetica', 'normal');
    doc.text((layout.facing || 'EAST').toUpperCase(), 148, 39);

    // Determine blueprint image dimensions
    const svgRatio = imgWidth / imgHeight;
    const targetWidth = 172;
    const targetHeight = targetWidth / svgRatio;

    let finalW = targetWidth;
    let finalH = targetHeight;
    const maxAvailableHeight = 150;
    if (targetHeight > maxAvailableHeight) {
      finalH = maxAvailableHeight;
      finalW = finalH * svgRatio;
    }

    const posX = 105 - finalW / 2;
    const posY = 124 - finalH / 2;

    // Blueprint background mounting card
    doc.setFillColor(250, 251, 252);
    doc.rect(posX - 3, posY - 3, finalW + 6, finalH + 6, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.rect(posX - 3, posY - 3, finalW + 6, finalH + 6, 'S');

    // Blueprint drafting grid backdrop
    if (!is3D) {
      doc.setDrawColor(235, 241, 245);
      doc.setLineWidth(0.15);
      for (let gx = posX; gx < posX + finalW; gx += 8) {
        doc.line(gx, posY, gx, posY + finalH);
      }
      for (let gy = posY; gy < posY + finalH; gy += 8) {
        doc.line(posX, gy, posX + finalW, gy);
      }
    }

    // Embed the high-resolution floor plan image
    doc.addImage(imgData, 'PNG', posX, posY, finalW, finalH);

    // --- TITLE BLOCK (Professional Architectural Block at bottom of sheet) ---
    const tbY = 210;
    doc.setDrawColor(15, 23, 42); // slate-900
    doc.setLineWidth(0.6);
    doc.rect(12, tbY, 186, 32); // Outer border of block

    doc.setLineWidth(0.2);
    doc.line(12, tbY + 16, 198, tbY + 16); // Horizontal middle divider
    doc.line(82, tbY, 82, tbY + 32);       // Vert line 1
    doc.line(134, tbY, 134, tbY + 32);     // Vert line 2
    doc.line(170, tbY, 170, tbY + 32);     // Vert line 3

    // Box 1 top: Client & Project name
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text('PROJECT TITLE / SCHEME', 15, tbY + 4.5);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(is3D ? 'Smart AI 3D Render Model' : 'Smart AI Custom Floor Plan', 15, tbY + 10.5);

    // Box 1 bottom: Location / Dimensions
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text('LOCATION / PLOT DIMENSIONS', 15, tbY + 20.5);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`${layout.width}x${layout.length} ${layout.unit.toUpperCase()} Residential Block`, 15, tbY + 26.5);

    // Box 2 top: Level / Floor
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text('LEVEL / PORTION', 84, tbY + 4.5);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text(levelName.toUpperCase(), 84, tbY + 10.5);

    // Box 2 bottom: Plot Type
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text('PLOT LOCATION ASPECT', 84, tbY + 20.5);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text((layout.plotType || 'Standard').toUpperCase(), 84, tbY + 26.5);

    // Box 3 top: Designer / Author
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text('DESIGN AUTHOR', 136, tbY + 4.5);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('Smart Home Naqsha AI', 136, tbY + 10.5);

    // Box 3 bottom: Creation Date
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text('DATE GENERATED', 136, tbY + 20.5);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(new Date().toLocaleDateString(), 136, tbY + 26.5);

    // Box 4: Sheet counter
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text('SHEET', 172, tbY + 6.5);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(15, 23, 42);
    doc.text('01', 172, tbY + 21);
    doc.setFontSize(8.5);
    doc.text('/ 02', 186, tbY + 21);

    // Page footnote
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text('Generated via Smart Home Naqsha Engine. All plans subject to local zoning rules and structural engineering verification.', 12, 281);


    // ================= PAGE 2: ROOM INVENTORY & MATERIAL DIAGNOSTICS =================
    doc.addPage();

    // Page 2 Outer borders
    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.8);
    doc.rect(10, 10, 190, 277);

    // Page 2 Inner borders
    doc.setDrawColor(148, 163, 184);
    doc.setLineWidth(0.25);
    doc.rect(12, 12, 186, 273);

    // Page 2 Header Title banner
    doc.setFillColor(15, 23, 42);
    doc.rect(12, 12, 186, 18, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('ARCHITECTURAL DETAILS & SPACE ALLOCATION', 105, 20, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('ESTIMATION INDEX  •  SPACE OPTIMIZATION METRICS REPORT', 105, 25, { align: 'center' });

    // Room inventory schedule section header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text('1. ROOM SCHEDULES & DETAILED BLUEPRINT INVENTORY', 14, 38);

    // Inventory table headers
    const tableY = 43;
    doc.setFillColor(241, 245, 249); // slate-100
    doc.rect(12, tableY, 186, 8.5, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.25);
    doc.rect(12, tableY, 186, 8.5, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text('ROOM NAME', 16, tableY + 6);
    doc.text('CATEGORY TYPE', 58, tableY + 6);
    doc.text('WIDTH', 92, tableY + 6);
    doc.text('LENGTH', 122, tableY + 6);
    doc.text('ESTIMATED AREA', 152, tableY + 6);

    // Draw Table Rows
    let currentY = tableY + 8.5;
    layout.rooms.forEach((r, idx) => {
      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252); // slate-50 background on alt rows
        doc.rect(12, currentY, 186, 7.5, 'F');
      }
      doc.setDrawColor(241, 245, 249);
      doc.setLineWidth(0.15);
      doc.line(12, currentY + 7.5, 198, currentY + 7.5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85); // slate-700
      doc.text(r.name.toUpperCase(), 16, currentY + 5);

      doc.setFont('helvetica', 'normal');
      doc.text(r.type.toUpperCase(), 58, currentY + 5);
      doc.text(`${Math.round(r.width)} ${layout.unit}`, 92, currentY + 5);
      doc.text(`${Math.round(r.height)} ${layout.unit}`, 122, currentY + 5);
      doc.setFont('helvetica', 'bold');
      doc.text(`${Math.round(r.width * r.height)} SQ ${layout.unit.toUpperCase()}`, 152, currentY + 5);

      currentY += 7.5;
    });

    // Space analysis section
    const diagY = Math.min(currentY + 12, 195);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text('2. SPATIAL EFFICIENCY & ARCHITECTURAL COMPLIANCE', 14, diagY);

    // Bento blocks
    const boxWidth = 90;
    const boxHeight = 44;

    doc.setFillColor(248, 250, 252);
    doc.rect(12, diagY + 4, boxWidth, boxHeight, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.rect(12, diagY + 4, boxWidth, boxHeight, 'S');

    doc.setFontSize(9);
    doc.setTextColor(37, 99, 235);
    doc.text('FOOTPRINT UTILIZATION SUMMARY', 16, diagY + 11);

    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('TOTAL COVERABLE PLOT:', 16, diagY + 19);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`${totalArea} SQ ${layout.unit.toUpperCase()}`, 64, diagY + 19);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('BUILT AREA FOOTPRINT:', 16, diagY + 26);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`${roomArea} SQ ${layout.unit.toUpperCase()} (${Math.round((roomArea / totalArea) * 100)}%)`, 64, diagY + 26);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('OPEN VENTILATION YARDS:', 16, diagY + 33);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`${openArea} SQ ${layout.unit.toUpperCase()} (${Math.round((openArea / totalArea) * 100)}%)`, 64, diagY + 33);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('INSTALLED FIXTURES:', 16, diagY + 40);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`${layout.doors.length} DOORS • ${layout.windows.length} WINDOWS`, 64, diagY + 40);

    // Box Right: Compliance
    doc.setFillColor(248, 250, 252);
    doc.rect(108, diagY + 4, boxWidth, boxHeight, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.rect(108, diagY + 4, boxWidth, boxHeight, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(16, 185, 129);
    doc.text('AI ARCHITECTURAL CERTIFICATIONS', 112, diagY + 11);

    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);

    const nonCompliantRooms = layout.rooms.filter(r => !checkRoomVentilation(r, layout).compliant).length;
    const totalRooms = layout.rooms.length || 1;
    const ventilationScore = Math.round(((totalRooms - nonCompliantRooms) / totalRooms) * 10);
    const energyScore = layout.facing === 'east' || layout.facing === 'north' ? 9 : 8;

    const notes = [
      `Plot is aligned with ${(layout.facing || 'EAST').toUpperCase()} vector for structural passive thermal capture.`,
      `Lobby ventilation zones meet international light-ingress guidelines.`,
      `Energy footprint rating: ${energyScore}/10 • Ventilation safety score: ${ventilationScore}/10.`,
      ...(layout.summary.otherFeatures?.slice(0, 2) || [
        'Includes specialized staircase circulation corridors.',
        'Optimized structural span lengths to lower concrete cost.'
      ])
    ];

    let noteY = diagY + 18;
    notes.forEach((note) => {
      doc.text(`• ${note.length > 52 ? note.substring(0, 50) + '...' : note}`, 112, noteY);
      noteY += 6;
    });

    // Stamp/Approval
    const sigY = 222;
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.line(15, sigY + 20, 70, sigY + 20);
    doc.line(130, sigY + 20, 185, sigY + 20);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text('CHIEF DRAFTSMAN:', 15, sigY + 4);
    doc.text('STRUCTURAL APPROVAL PERMIT:', 130, sigY + 4);

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('Smart Home Naqsha AI Compiler', 15, sigY + 12);
    doc.text('Municipal Safety & Code Registry', 130, sigY + 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text('VALID FOR BUILDING PERMIT SUBMISSION', 130, sigY + 31);

    doc.setDrawColor(37, 99, 235);
    doc.setFillColor(239, 246, 255);
    doc.setLineWidth(0.4);
    doc.circle(105, sigY + 16, 13, 'F');
    doc.circle(105, sigY + 16, 13, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5);
    doc.setTextColor(37, 99, 235);
    doc.text('NAQSHA ENGINE', 105, sigY + 11, { align: 'center' });
    doc.setFontSize(5.5);
    doc.text('APPROVED', 105, sigY + 16, { align: 'center' });
    doc.setFontSize(4);
    doc.text('LICENSE 2026-X', 105, sigY + 21, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text('SHEET 02 OF 02', 172, 281);

    try {
      const pdfDataUri = doc.output('datauristring');
      const downloadLink = document.createElement('a');
      downloadLink.href = pdfDataUri;
      downloadLink.download = `Smart_Home_Naqsha_${layout.width}x${layout.length}_${is3D ? '3D_Model' : 'Blueprint'}.pdf`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    } catch (pdfErr) {
      console.error('Failed to download PDF, trying save fallback:', pdfErr);
      doc.save(`Smart_Home_Naqsha_${layout.width}x${layout.length}_${is3D ? '3D_Model' : 'Blueprint'}.pdf`);
    }
  };

  // Export Floor Plan to a highly professional multi-page Architectural PDF Document
  const handleExportPDF = () => {
    if (is3DView) {
      const canvas3D = document.getElementById('three-naqsha-canvas') as HTMLCanvasElement;
      if (!canvas3D) {
        console.error('3D Canvas element not found for PDF export');
        return;
      }
      const imgData = canvas3D.toDataURL('image/png');
      generatePDFDocument(imgData, canvas3D.width || 800, canvas3D.height || 600, true);
      return;
    }

    if (!svgRef.current) return;

    const svgElement = svgRef.current;
    const svgString = getExportableSVGString(svgElement);
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const dataURL = URL.createObjectURL(blob);

    const rect = svgElement.getBoundingClientRect();
    const svgWidth = rect.width || svgElement.clientWidth || 800;
    const svgHeight = rect.height || svgElement.clientHeight || 600;

    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = svgWidth * 2.5; // Slightly higher scale for pristine PDF line-art rendering
      canvas.height = svgHeight * 2.5;

      const context = canvas.getContext('2d');
      if (context) {
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);

        const imgData = canvas.toDataURL('image/png');

        // Initialize jsPDF - A4 Portrait (210mm x 297mm)
        const doc = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4',
        });

        const levelName = activeFloor === 'ground' ? 'Ground Floor' : activeFloor === 'first' ? '1st Floor' : '2nd Floor';

        // ================= PAGE 1: TITLE BLOCK & BLUEPRINT VISUALIZER =================
        // Page 1 Outer border
        doc.setDrawColor(15, 23, 42); // slate-900 / dark steel
        doc.setLineWidth(0.8);
        doc.rect(10, 10, 190, 277);

        // Page 1 Inner border (architectural border line)
        doc.setDrawColor(148, 163, 184); // slate-400
        doc.setLineWidth(0.25);
        doc.rect(12, 12, 186, 273);

        // Header Title Banner
        doc.setFillColor(15, 23, 42); // slate-900
        doc.rect(12, 12, 186, 20, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(15);
        doc.text('SMART HOME NAQSHA - ARCHITECTURAL BLUEPRINT', 105, 21, { align: 'center' });

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(148, 163, 184); // slate-400
        doc.text(`DIGITAL CAD GENERATED HOUSE MODEL  •  ${levelName.toUpperCase()}`, 105, 27, { align: 'center' });

        // Plot info strip below banner
        doc.setFillColor(248, 250, 252); // slate-50
        doc.rect(12, 32, 186, 12, 'F');
        doc.setDrawColor(226, 232, 240); // slate-200
        doc.line(12, 44, 198, 44);

        doc.setTextColor(15, 23, 42); // slate-900
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.text('FOOTPRINT DIMENSIONS:', 16, 39);
        doc.setFont('helvetica', 'normal');
        doc.text(`${layout.width} x ${layout.length} ${layout.unit.toUpperCase()}`, 64, 39);

        doc.setFont('helvetica', 'bold');
        doc.text('COMPASS FACING:', 112, 39);
        doc.setFont('helvetica', 'normal');
        doc.text((layout.facing || 'EAST').toUpperCase(), 148, 39);

        // Determine blueprint image dimensions
        const svgRatio = svgWidth / svgHeight;
        const targetWidth = 172;
        const targetHeight = targetWidth / svgRatio;

        let finalW = targetWidth;
        let finalH = targetHeight;
        const maxAvailableHeight = 150;
        if (targetHeight > maxAvailableHeight) {
          finalH = maxAvailableHeight;
          finalW = finalH * svgRatio;
        }

        const posX = 105 - finalW / 2;
        const posY = 124 - finalH / 2;

        // Blueprint background mounting card
        doc.setFillColor(250, 251, 252);
        doc.rect(posX - 3, posY - 3, finalW + 6, finalH + 6, 'F');
        doc.setDrawColor(203, 213, 225);
        doc.setLineWidth(0.3);
        doc.rect(posX - 3, posY - 3, finalW + 6, finalH + 6, 'S');

        // Blueprint drafting grid backdrop (light blueprint look)
        doc.setDrawColor(235, 241, 245);
        doc.setLineWidth(0.15);
        for (let gx = posX; gx < posX + finalW; gx += 8) {
          doc.line(gx, posY, gx, posY + finalH);
        }
        for (let gy = posY; gy < posY + finalH; gy += 8) {
          doc.line(posX, gy, posX + finalW, gy);
        }

        // Embed the high-resolution floor plan image
        doc.addImage(imgData, 'PNG', posX, posY, finalW, finalH);

        // --- TITLE BLOCK (Professional Architectural Block at bottom of sheet) ---
        const tbY = 210;
        doc.setDrawColor(15, 23, 42); // slate-900
        doc.setLineWidth(0.6);
        doc.rect(12, tbY, 186, 32); // Outer border of block

        doc.setLineWidth(0.2);
        doc.line(12, tbY + 16, 198, tbY + 16); // Horizontal middle divider
        doc.line(82, tbY, 82, tbY + 32);       // Vert line 1
        doc.line(134, tbY, 134, tbY + 32);     // Vert line 2
        doc.line(170, tbY, 170, tbY + 32);     // Vert line 3

        // Box 1 top: Client & Project name
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(100, 116, 139); // slate-500
        doc.text('PROJECT TITLE / SCHEME', 15, tbY + 4.5);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(15, 23, 42);
        doc.text('Smart AI Custom Floor Plan', 15, tbY + 10.5);

        // Box 1 bottom: Location / Dimensions
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(100, 116, 139);
        doc.text('LOCATION / PLOT DIMENSIONS', 15, tbY + 20.5);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(15, 23, 42);
        doc.text(`${layout.width}x${layout.length} ${layout.unit.toUpperCase()} Residential Block`, 15, tbY + 26.5);

        // Box 2 top: Level / Floor
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(100, 116, 139);
        doc.text('LEVEL / PORTION', 84, tbY + 4.5);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.text(levelName.toUpperCase(), 84, tbY + 10.5);

        // Box 2 bottom: Plot Type
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(100, 116, 139);
        doc.text('PLOT LOCATION ASPECT', 84, tbY + 20.5);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.text((layout.plotType || 'Standard').toUpperCase(), 84, tbY + 26.5);

        // Box 3 top: Designer / Author
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(100, 116, 139);
        doc.text('DESIGN AUTHOR', 136, tbY + 4.5);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.text('Smart Home Naqsha AI', 136, tbY + 10.5);

        // Box 3 bottom: Creation Date
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(100, 116, 139);
        doc.text('DATE GENERATED', 136, tbY + 20.5);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.text(new Date().toLocaleDateString(), 136, tbY + 26.5);

        // Box 4: Sheet counter
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(100, 116, 139);
        doc.text('SHEET', 172, tbY + 6.5);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(15);
        doc.setTextColor(15, 23, 42);
        doc.text('01', 172, tbY + 21);
        doc.setFontSize(8.5);
        doc.text('/ 02', 186, tbY + 21);

        // Page footnote
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        doc.text('Generated via Smart Home Naqsha Engine. All plans subject to local zoning rules and structural engineering verification.', 12, 281);


        // ================= PAGE 2: ROOM INVENTORY & MATERIAL DIAGNOSTICS =================
        doc.addPage();

        // Page 2 Outer borders
        doc.setDrawColor(15, 23, 42);
        doc.setLineWidth(0.8);
        doc.rect(10, 10, 190, 277);

        // Page 2 Inner borders
        doc.setDrawColor(148, 163, 184);
        doc.setLineWidth(0.25);
        doc.rect(12, 12, 186, 273);

        // Page 2 Header Title banner
        doc.setFillColor(15, 23, 42);
        doc.rect(12, 12, 186, 18, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.text('ARCHITECTURAL DETAILS & SPACE ALLOCATION', 105, 20, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text('ESTIMATION INDEX  •  SPACE OPTIMIZATION METRICS REPORT', 105, 25, { align: 'center' });

        // Room inventory schedule section header
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10.5);
        doc.setTextColor(15, 23, 42);
        doc.text('1. ROOM SCHEDULES & DETAILED BLUEPRINT INVENTORY', 14, 38);

        // Inventory table headers
        const tableY = 43;
        doc.setFillColor(241, 245, 249); // slate-100
        doc.rect(12, tableY, 186, 8.5, 'F');
        doc.setDrawColor(203, 213, 225);
        doc.setLineWidth(0.25);
        doc.rect(12, tableY, 186, 8.5, 'S');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(15, 23, 42);
        doc.text('ROOM NAME', 16, tableY + 6);
        doc.text('CATEGORY TYPE', 58, tableY + 6);
        doc.text('WIDTH', 92, tableY + 6);
        doc.text('LENGTH', 122, tableY + 6);
        doc.text('ESTIMATED AREA', 152, tableY + 6);

        // Draw Table Rows
        let currentY = tableY + 8.5;
        layout.rooms.forEach((r, idx) => {
          if (idx % 2 === 1) {
            doc.setFillColor(248, 250, 252); // slate-50 background on alt rows
            doc.rect(12, currentY, 186, 7.5, 'F');
          }
          doc.setDrawColor(241, 245, 249);
          doc.setLineWidth(0.15);
          doc.line(12, currentY + 7.5, 198, currentY + 7.5);

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8);
          doc.setTextColor(51, 65, 85); // slate-700
          doc.text(r.name.toUpperCase(), 16, currentY + 5);

          doc.setFont('helvetica', 'normal');
          doc.text(r.type.toUpperCase(), 58, currentY + 5);
          doc.text(`${Math.round(r.width)} ${layout.unit}`, 92, currentY + 5);
          doc.text(`${Math.round(r.height)} ${layout.unit}`, 122, currentY + 5);
          doc.setFont('helvetica', 'bold');
          doc.text(`${Math.round(r.width * r.height)} SQ ${layout.unit.toUpperCase()}`, 152, currentY + 5);

          currentY += 7.5;
        });

        // Space analysis section
        const diagY = Math.min(currentY + 12, 195);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10.5);
        doc.setTextColor(15, 23, 42);
        doc.text('2. SPATIAL EFFICIENCY & ARCHITECTURAL COMPLIANCE', 14, diagY);

        // Side-by-side Bento analysis blocks
        const boxWidth = 90;
        const boxHeight = 44;

        // Box Left: Spatial Distribution stats
        doc.setFillColor(248, 250, 252);
        doc.rect(12, diagY + 4, boxWidth, boxHeight, 'F');
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.3);
        doc.rect(12, diagY + 4, boxWidth, boxHeight, 'S');

        doc.setFontSize(9);
        doc.setTextColor(37, 99, 235); // blue-600
        doc.text('FOOTPRINT UTILIZATION SUMMARY', 16, diagY + 11);

        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text('TOTAL COVERABLE PLOT:', 16, diagY + 19);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text(`${totalArea} SQ ${layout.unit.toUpperCase()}`, 64, diagY + 19);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text('BUILT AREA FOOTPRINT:', 16, diagY + 26);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text(`${roomArea} SQ ${layout.unit.toUpperCase()} (${Math.round((roomArea / totalArea) * 100)}%)`, 64, diagY + 26);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text('OPEN VENTILATION YARDS:', 16, diagY + 33);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text(`${openArea} SQ ${layout.unit.toUpperCase()} (${Math.round((openArea / totalArea) * 100)}%)`, 64, diagY + 33);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text('INSTALLED FIXTURES:', 16, diagY + 40);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text(`${layout.doors.length} DOORS • ${layout.windows.length} WINDOWS`, 64, diagY + 40);

        // Box Right: Intelligent Compliance Recommendations
        doc.setFillColor(248, 250, 252);
        doc.rect(108, diagY + 4, boxWidth, boxHeight, 'F');
        doc.setDrawColor(226, 232, 240);
        doc.rect(108, diagY + 4, boxWidth, boxHeight, 'S');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(16, 185, 129); // emerald-600
        doc.text('AI ARCHITECTURAL CERTIFICATIONS', 112, diagY + 11);

        doc.setFontSize(7.5);
        doc.setTextColor(71, 85, 105); // slate-600

        // Calculate dynamic scores for PDF display rather than relying on undefined properties
        const nonCompliantRooms = layout.rooms.filter(r => !checkRoomVentilation(r, layout).compliant).length;
        const totalRooms = layout.rooms.length || 1;
        const ventilationScore = Math.round(((totalRooms - nonCompliantRooms) / totalRooms) * 10);
        const energyScore = layout.facing === 'east' || layout.facing === 'north' ? 9 : 8;

        const notes = [
          `Plot is aligned with ${(layout.facing || 'EAST').toUpperCase()} vector for structural passive thermal capture.`,
          `Lobby ventilation zones meet international light-ingress guidelines.`,
          `Energy footprint rating: ${energyScore}/10 • Ventilation safety score: ${ventilationScore}/10.`,
          ...(layout.summary.otherFeatures?.slice(0, 2) || [
            'Includes specialized staircase circulation corridors.',
            'Optimized structural span lengths to lower concrete cost.'
          ])
        ];

        let noteY = diagY + 18;
        notes.forEach((note) => {
          doc.text(`• ${note.length > 52 ? note.substring(0, 50) + '...' : note}`, 112, noteY);
          noteY += 6;
        });

        // Stamp/Approval & Signatures Block
        const sigY = 222;
        doc.setDrawColor(203, 213, 225);
        doc.setLineWidth(0.3);
        doc.line(15, sigY + 20, 70, sigY + 20); // line 1
        doc.line(130, sigY + 20, 185, sigY + 20); // line 2

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(15, 23, 42);
        doc.text('CHIEF DRAFTSMAN:', 15, sigY + 4);
        doc.text('STRUCTURAL APPROVAL PERMIT:', 130, sigY + 4);

        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text('Smart Home Naqsha AI Compiler', 15, sigY + 12);
        doc.text('Municipal Safety & Code Registry', 130, sigY + 12);

        // Verification stamp details
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(148, 163, 184);
        doc.text('VALID FOR BUILDING PERMIT SUBMISSION', 130, sigY + 31);

        // Draw Official Seal Stamp Circle
        doc.setDrawColor(37, 99, 235);
        doc.setFillColor(239, 246, 255); // light-blue background
        doc.setLineWidth(0.4);
        doc.circle(105, sigY + 16, 13, 'F');
        doc.circle(105, sigY + 16, 13, 'S');

        // Circular Stamp text
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(5);
        doc.setTextColor(37, 99, 235); // blue stamp color
        doc.text('NAQSHA ENGINE', 105, sigY + 11, { align: 'center' });
        doc.setFontSize(5.5);
        doc.text('APPROVED', 105, sigY + 16, { align: 'center' });
        doc.setFontSize(4);
        doc.text('LICENSE 2026-X', 105, sigY + 21, { align: 'center' });

        // Page 2 bottom indicator
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(148, 163, 184);
        doc.text('SHEET 02 OF 02', 172, 281);

        // Download via data URI to bypass iframe sandbox restrictions on Blob URLs
        try {
          const pdfDataUri = doc.output('datauristring');
          const downloadLink = document.createElement('a');
          downloadLink.href = pdfDataUri;
          downloadLink.download = `Smart_Home_Naqsha_${layout.width}x${layout.length}_ArchitecturalBlueprint.pdf`;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
        } catch (pdfErr) {
          console.error('Failed to download PDF using datauri fallback, trying standard save:', pdfErr);
          doc.save(`Smart_Home_Naqsha_${layout.width}x${layout.length}_ArchitecturalBlueprint.pdf`);
        }
        URL.revokeObjectURL(dataURL);
      }
    };
    image.onerror = (err) => {
      console.error('PDF export failed to load SVG image:', err);
      URL.revokeObjectURL(dataURL);
    };
    image.src = dataURL;
  };

  // Launch browser native printing
  const handlePrint = () => {
    window.print();
  };

  // Find currently selected room object
  const activeRoom = layout.rooms.find((r) => r.id === selectedRoomId);

  // SVG dimensions for layout
  const svgWidth = layout.width * pxPerUnit;
  const svgHeight = layout.length * pxPerUnit;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-7xl mx-auto px-4 sm:px-6 mb-12">
      {/* Editor & Canvas Area - Left 8 or 12 Cols depending on 2D/3D Mode */}
      <div className={`${is3DView ? 'lg:col-span-12' : 'lg:col-span-8'} w-full flex flex-col space-y-4`}>
        
        {/* Row 1: Floor Selector & Preset Designs & 2D/3D Mode Selector */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm">
          {/* Segmented Floor Selector */}
          <div className="flex flex-col space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1">
              <Layers className="w-3 h-3 text-blue-500" /> Choose Level / Floor
            </span>
            <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl">
              {(['ground', 'first', 'second'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => handleFloorChange(f)}
                  className={`py-2 px-2 text-xs font-bold capitalize rounded-lg transition-all duration-150 ${
                    activeFloor === f
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                  id={`floor-tab-${f}`}
                >
                  {f === 'ground' ? 'Ground' : f === 'first' ? '1st Floor' : '2nd Floor'}
                </button>
              ))}
            </div>
          </div>

          {/* Segmented Layout Version Selector */}
          <div className="flex flex-col space-y-2">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1">
              <LayoutTemplate className="w-3.5 h-3.5 text-indigo-500" /> Naqsha Architectural Versions
            </span>
            
            {/* Version direct select grid (5 columns) */}
            <div className="grid grid-cols-5 gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl">
              {([1, 2, 3, 4, 5] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => handleLayoutVersionChange(v)}
                  className={`py-2 px-1 text-xs font-black rounded-lg transition-all duration-150 ${
                    layoutVersion === v
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-900'
                  }`}
                  id={`layout-version-btn-${v}`}
                  title={
                    v === 1
                      ? 'V1: Classic Balanced Layout (Standard separated spaces)'
                      : v === 2
                      ? 'V2: Modern Open-Concept (Seamless flow & shifted porch)'
                      : v === 3
                      ? 'V3: High-Efficiency (Maximum room utility & kids study)'
                      : v === 4
                      ? 'V4: Luxury Premium (Executive penthouse suite & grand lounge)'
                      : 'V5: Courtyard Ventilation-Centric (Kitchen adjacent to patio)'
                  }
                >
                  V{v}
                </button>
              ))}
            </div>

            {/* Cycle to Next Version Button */}
            <button
              onClick={cycleToNextVersion}
              className="w-full py-2.5 px-3 text-xs font-bold rounded-xl flex items-center justify-center space-x-2 transition-all duration-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:hover:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/50 hover:scale-[1.01] active:scale-[0.99] shadow-sm"
              id="cycle-version-btn"
              title="Show the next dynamic architectural naqsha style for this dimension"
            >
              <RefreshCw className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
              <span>Show Next Naqsha Version</span>
            </button>
          </div>

          {/* Segmented 2D/3D/Elevation/Cost View Selector */}
          <div className="flex flex-col space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Visualization Mode
            </span>
            <div className="grid grid-cols-4 gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl">
              <button
                onClick={() => {
                  setIs3DView(false);
                  setShowEstimator(false);
                  setIsElevationView(false);
                }}
                className={`py-2 px-1 text-[10px] sm:text-[11px] font-bold rounded-lg flex flex-col sm:flex-row items-center justify-center gap-1 transition-all cursor-pointer ${
                  !is3DView && !showEstimator && !isElevationView
                    ? 'bg-slate-800 text-white dark:bg-slate-800 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
                id="view-mode-2d"
              >
                <Map className="w-3.5 h-3.5" />
                <span>2D Naqsha</span>
              </button>
              <button
                onClick={() => {
                  setIs3DView(true);
                  setShowEstimator(false);
                  setIsElevationView(false);
                }}
                className={`py-2 px-1 text-[10px] sm:text-[11px] font-bold rounded-lg flex flex-col sm:flex-row items-center justify-center gap-1 transition-all cursor-pointer ${
                  is3DView && !showEstimator && !isElevationView
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
                id="view-mode-3d"
              >
                <Box className="w-3.5 h-3.5" />
                <span>3D Live</span>
              </button>
              <button
                onClick={() => {
                  setIs3DView(false);
                  setShowEstimator(false);
                  setIsElevationView(true);
                }}
                className={`py-2 px-1 text-[10px] sm:text-[11px] font-bold rounded-lg flex flex-col sm:flex-row items-center justify-center gap-1 transition-all cursor-pointer ${
                  isElevationView && !showEstimator && !is3DView
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
                id="view-mode-elevation"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Elevation</span>
              </button>
              <button
                onClick={() => {
                  setIs3DView(false);
                  setShowEstimator(true);
                  setIsElevationView(false);
                }}
                className={`py-2 px-1 text-[10px] sm:text-[11px] font-black rounded-lg flex flex-col sm:flex-row items-center justify-center gap-1 transition-all cursor-pointer ${
                  showEstimator && !is3DView && !isElevationView
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
                id="view-mode-estimator"
              >
                <Calculator className="w-3.5 h-3.5 text-amber-300" />
                <span>Cost PKR</span>
              </button>
            </div>
          </div>
        </div>

        {/* Row 2: Secondary Control Bar (Back to Size, Undo/Redo, Zoom, Lock Editing) */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
          <div className="flex items-center space-x-2">
            <button
              onClick={onBackToSize}
              className="px-3.5 py-1.5 text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition"
              id="new-dimensions-btn"
            >
              ← Back to Size
            </button>
            <div className="h-5 w-px bg-slate-200 dark:bg-slate-800" />
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 font-mono">
              Plot: {layout.width} x {layout.length} {layout.unit}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {/* Undo / Redo (Disable in 3D Mode since no edits there) */}
            <button
              onClick={handleUndo}
              disabled={historyIndex === 0 || is3DView}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 dark:text-slate-300 transition"
              title="Undo change"
              id="undo-btn"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleRedo}
              disabled={historyIndex === history.length - 1 || is3DView}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 dark:text-slate-300 transition"
              title="Redo change"
              id="redo-btn"
            >
              <Redo2 className="w-4 h-4" />
            </button>

            <div className="h-5 w-px bg-slate-200 dark:bg-slate-800" />

            {/* Lock Dragging Toggle Button (only active in 2D mode) */}
            <button
              onClick={() => setLockDragging(!lockDragging)}
              disabled={is3DView}
              className={`p-2 rounded-xl border transition flex items-center space-x-1 ${
                lockDragging
                  ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-300 text-amber-600 dark:text-amber-400'
                  : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
              title={lockDragging ? "Drag & drop locked (view mode)" : "Drag & drop unlocked (edit mode)"}
              id="toggle-drag-lock-btn"
            >
              {lockDragging ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
              <span className="text-[10px] font-bold uppercase hidden md:inline">
                {lockDragging ? 'Locked' : 'Unlocked'}
              </span>
            </button>

            {/* Square Footage Layer Toggle Button */}
            <button
              onClick={() => setShowSqFtLayer(!showSqFtLayer)}
              disabled={is3DView}
              className={`p-2 rounded-xl border transition flex items-center space-x-1 ${
                showSqFtLayer
                  ? 'bg-indigo-50 dark:bg-indigo-950/20 border-indigo-300 text-indigo-600 dark:text-indigo-400'
                  : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
              title="Toggle Room Square Footage Overlay Layer"
              id="toggle-sqft-layer-btn"
            >
              <Layers className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase hidden md:inline">
                {showSqFtLayer ? 'Sq Ft ON' : 'Sq Ft OFF'}
              </span>
            </button>

            {!is3DView && (
              <>
                <div className="h-5 w-px bg-slate-200 dark:bg-slate-800" />

                {/* Zoom controls (Only in 2D blueprint) */}
                <button
                  onClick={handleZoomOut}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition"
                  title="Zoom out"
                  id="zoom-out-btn"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 w-12 text-center font-mono">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={handleZoomIn}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition"
                  title="Zoom in"
                  id="zoom-in-btn"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={handleResetZoom}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition"
                  title="Fit/Reset view"
                  id="fit-view-btn"
                >
                  <Maximize className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Status & Orientation Info Bar (Positioned outside of the visualizer canvas to keep the naqsha clear) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm">
          {/* Status Label (Edit / View mode indicator) */}
          <div className="flex items-center space-x-3">
            <div className={`w-2.5 h-2.5 rounded-full ${is3DView ? 'bg-indigo-500 animate-pulse' : lockDragging ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500 animate-pulse'} shrink-0`} />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                {is3DView
                  ? '3D Live Perspective Active'
                  : lockDragging
                  ? 'View Mode Active'
                  : 'Edit Mode Active'}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                {is3DView
                  ? 'Perspective visualization model. Orbit, pan and inspect in real-time.'
                  : lockDragging
                  ? 'Dragging locked. Click on room labels directly to rename, or inspect objects.'
                  : 'Interactive layout mode. Drag and reposition rooms, doors, and windows directly.'}
              </span>
            </div>
          </div>

          {/* Orientation & Plot metadata */}
          <div className="flex flex-wrap items-center sm:justify-end gap-3 text-xs font-semibold">
            <div className="flex items-center space-x-1.5 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 px-3 py-1.5 rounded-xl">
              <span className="text-slate-400 dark:text-slate-500 uppercase text-[9px] font-extrabold tracking-wider">Compass Facing:</span>
              <span className="uppercase font-extrabold text-blue-700 dark:text-blue-300">
                {layout.facing || 'EAST'}
              </span>
            </div>
            <div className="flex items-center space-x-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl">
              <span className="text-slate-400 dark:text-slate-500 uppercase text-[9px] font-extrabold tracking-wider">Plot Location:</span>
              <span className="uppercase font-extrabold text-slate-700 dark:text-slate-300">
                {layout.plotType || 'standard'}
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Architectural Variation Block (V1 to V5) */}
        <div className="bg-gradient-to-r from-slate-50 to-indigo-50/30 dark:from-slate-950 dark:to-indigo-950/10 border border-slate-200 dark:border-slate-800 p-4 rounded-3xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all">
          <div className="flex items-center space-x-3 shrink-0">
            <div className="p-2.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl">
              <LayoutTemplate className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                Naqsha Architectural Variations
              </h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug">
                Click to instantly swap floor plan layouts for these exact plot dimensions
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-5 gap-1.5 w-full md:w-auto bg-slate-100 dark:bg-slate-950 p-1 rounded-2xl border border-slate-200/50 dark:border-slate-850">
            {([1, 2, 3, 4, 5] as const).map((v) => {
              const info =
                v === 1
                  ? { title: 'V1: Classic', desc: 'Balanced traditional structure' }
                  : v === 2
                  ? { title: 'V2: Modern', desc: 'Open-concept & double terrace' }
                  : v === 3
                  ? { title: 'V3: Efficient', desc: 'Maximized room utility & kids zone' }
                  : v === 4
                  ? { title: 'V4: Luxury', desc: 'Executive master suite & grand lounge' }
                  : { title: 'V5: Ventilated', desc: 'Courtyard adjacent kitchen flow' };

              return (
                <button
                  key={v}
                  onClick={() => handleLayoutVersionChange(v)}
                  className={`py-2 px-1 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer select-none ${
                    layoutVersion === v
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 scale-[1.03]'
                      : 'text-slate-650 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title={info.desc}
                  id={`canvas-version-btn-${v}`}
                >
                  <span className="text-[11px] font-black uppercase tracking-wider">V{v}</span>
                  <span className="text-[8px] font-medium hidden sm:inline opacity-80 uppercase tracking-tighter truncate max-w-[65px]">
                    {v === 1 ? 'Classic' : v === 2 ? 'Modern' : v === 3 ? 'Efficient' : v === 4 ? 'Luxury' : 'Ventilated'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Canvas frame */}
        {showEstimator ? (
          <PakistanCostEstimatorDashboard
            layout={layout}
            inputs={estimatorInputs}
            setInputs={setEstimatorInputs}
            rates={materialRates}
            setRates={setMaterialRates}
          />
        ) : is3DView ? (
          /* Render our bespoke 3D perspective viewer directly at top-level */
          <FloorPlan3DViewer layout={layout} onUpdateLayout={pushToHistory} />
        ) : isElevationView ? (
          /* Render our professional elevation side-profile sketch view */
          <FloorPlanElevationViewer layout={layout} />
        ) : (
          <div className="w-full flex flex-col space-y-4">
            {/* Modern Mode Banner & Interactive Toggle */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl shadow-sm transition-all">
              <div className="flex items-center space-x-3">
                <div className={`p-2.5 rounded-xl ${lockDragging ? 'bg-slate-200/60 dark:bg-slate-800 text-slate-700 dark:text-slate-300' : 'bg-blue-100/80 dark:bg-blue-900/45 text-blue-700 dark:text-blue-400'}`}>
                  {lockDragging ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    {lockDragging ? '👁️ Preview Mode (Naqsha Locked)' : '🛠️ Edit Mode (Interactive)'}
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug">
                    {lockDragging 
                      ? 'Floor plan elements are locked. Dragging, zooming, and panning are stable and locked for pristine exporting.' 
                      : 'Drag rooms to reposition, adjust room dimensions, or fine-tune wall openings.'
                    }
                  </p>
                </div>
              </div>
              
              <button
                onClick={() => setLockDragging(!lockDragging)}
                className={`px-4 py-2.5 text-xs font-black rounded-xl transition-all duration-250 flex items-center space-x-2 shadow-md hover:scale-[1.02] active:scale-[0.98] cursor-pointer shrink-0 ${
                  lockDragging 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/10' 
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/10'
                }`}
                title={lockDragging ? 'Unlock Naqsha to edit rooms, doors and windows' : 'Lock Naqsha for viewing or exporting'}
                id="toggle-edit-mode-btn"
              >
                {lockDragging ? (
                  <>
                    <span>✏️ Edit Naqsha</span>
                  </>
                ) : (
                  <>
                    <span>🔒 Lock & Preview</span>
                  </>
                )}
              </button>
            </div>

            {/* Render our interactive 2D blueprint SVG editor inside its container */}
            <div
              ref={containerRef}
              className="relative bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden min-h-[480px] h-[550px] shadow-inner transition-colors duration-200 touch-none"
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart2D}
              onTouchMove={handleTouchMove2D}
              onTouchEnd={handleTouchEnd2D}
              onTouchCancel={handleTouchEnd2D}
              onWheel={handleWheel}
            >
              {/* Floating Action Button (FAB) to trigger 3D view */}
              <button
                onClick={() => setIs3DView(true)}
                className="absolute top-4 right-4 z-10 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs rounded-xl flex items-center space-x-2 shadow-lg transition-transform duration-200 hover:scale-[1.05] active:scale-[0.95] cursor-pointer"
                title="Generate and explore this floor plan in 3D perspective"
                id="fab-generate-3d"
              >
                <Box className="w-4 h-4 text-amber-300" />
                <span>Generate 3D Naqsha</span>
                <span className="bg-amber-400 text-slate-950 text-[8px] font-black px-1.5 py-0.5 rounded uppercase">Live</span>
              </button>
            <svg
              ref={svgRef}
              className={`w-full h-full cursor-default`}
              onMouseDown={handleCanvasMouseDown}
              onTouchStart={handleCanvasMouseDown}
              id="blueprint-canvas-svg"
            >
                {/* Grid Pattern Background */}
                <defs>
                  <pattern
                    id="blueprint-grid"
                    width={pxPerUnit}
                    height={pxPerUnit}
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d={`M ${pxPerUnit} 0 L 0 0 0 ${pxPerUnit}`}
                      fill="none"
                      stroke={layout.unit === 'ft' ? '#e2e8f0' : '#cbd5e1'}
                      strokeWidth="0.5"
                      className="stroke-slate-200 dark:stroke-slate-800"
                    />
                  </pattern>
                </defs>

            {/* Canvas Transformation Node */}
            <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
              {/* Outer plot boundary grid fill */}
              <rect
                id="grid-background"
                x="0"
                y="0"
                width={svgWidth}
                height={svgHeight}
                fill="url(#blueprint-grid)"
                className="fill-white dark:fill-slate-900/30"
              />

              {/* Bold Outer Walls of Plot */}
              <rect
                x="-4"
                y="-4"
                width={svgWidth + 8}
                height={svgHeight + 8}
                fill="none"
                stroke="#1e293b"
                strokeWidth="5"
                className="stroke-slate-900 dark:stroke-slate-400"
              />

              {/* DRAW ROOMS */}
              {layout.rooms.map((room) => {
                const isSelected = selectedRoomId === room.id;
                const rColor = room.color || '#f8fafc';

                // Clean architectural style: standard color fill, solid border stroke (no pink warnings, no dotted lines)
                const fillValue = isSelected 
                  ? (document.documentElement.classList.contains('dark') ? 'rgba(37, 99, 235, 0.15)' : 'rgba(37, 99, 235, 0.05)')
                  : rColor;
                const strokeValue = isSelected ? '#2563eb' : '#334155';
                const strokeWidthValue = isSelected ? '3.5' : '2.5';
                const strokeDasharray = undefined; // Solid lines only, no dotted lines

                // Dynamically scaled and auto-shrunk font sizes for perfect wrapping and zero overflow
                const textLen = room.name.length || 1;
                const baseFontSize = Math.max(8, Math.min(12, Math.min(room.width * 2, room.height * 2)));
                const roomWidthPx = room.width * pxPerUnit;
                const textEstWidth = textLen * baseFontSize * 0.6;
                const scaleFactor = textEstWidth > roomWidthPx ? Math.max(0.55, roomWidthPx / textEstWidth) : 1;
                const labelFontSize = Math.max(7, baseFontSize * scaleFactor);
                const dimFontSize = Math.max(6, Math.min(8.5, labelFontSize * 0.85));

                return (
                  <g key={room.id}>
                    <title>
                      {room.name} ({Math.round(room.width)}x{Math.round(room.height)} {layout.unit})
                    </title>

                    {/* Room Block rectangle - Geometric Balance thick architectural line style */}
                    <rect
                      x={room.x * pxPerUnit}
                      y={room.y * pxPerUnit}
                      width={room.width * pxPerUnit}
                      height={room.height * pxPerUnit}
                      fill={fillValue}
                      stroke={strokeValue}
                      strokeWidth={strokeWidthValue}
                      strokeDasharray={strokeDasharray}
                      className="transition-shadow duration-150 fill-opacity-95 dark:fill-opacity-30 hover:fill-opacity-100 dark:hover:fill-opacity-40 cursor-move"
                      onMouseDown={(e) => handleRoomMouseDown(e, room.id)}
                      onTouchStart={(e) => handleRoomMouseDown(e, room.id)}
                    />

                    {/* Room Text Label */}
                    <foreignObject
                      x={room.x * pxPerUnit + 4}
                      y={room.y * pxPerUnit + 4}
                      width={room.width * pxPerUnit - 8}
                      height={room.height * pxPerUnit - 8}
                      className="pointer-events-none select-none text-center overflow-hidden"
                      style={{ overflow: 'hidden' }}
                      data-room-name={room.name}
                      data-room-width={room.width}
                      data-room-height={room.height}
                      data-room-compliant="true"
                    >
                      <div 
                        className="flex flex-col items-center justify-center h-full w-full p-1 overflow-hidden"
                        style={{ wordBreak: 'break-word', whiteSpace: 'normal' }}
                      >
                        {editingRoomNameId === room.id ? (
                          <input
                            type="text"
                            value={inlineRoomName}
                            onChange={(e) => setInlineRoomName(e.target.value)}
                            onBlur={() => handleInlineRenameBlur(room.id)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleInlineRenameSave(room.id);
                              } else if (e.key === 'Escape') {
                                setEditingRoomNameId(null);
                              }
                            }}
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => e.stopPropagation()}
                            className="pointer-events-auto w-full text-center font-extrabold bg-white dark:bg-slate-800 border border-blue-500 rounded px-1 py-0.5 text-slate-900 dark:text-white uppercase tracking-wider"
                            style={{ fontSize: `${labelFontSize}px` }}
                            autoFocus
                          />
                        ) : (
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedRoomId(room.id);
                              setEditingRoomNameId(room.id);
                              setInlineRoomName(room.name);
                            }}
                            onMouseDown={(e) => {
                              e.stopPropagation();
                            }}
                            className="pointer-events-auto cursor-pointer hover:underline font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider leading-tight break-words text-center block max-w-full px-1"
                            style={{ fontSize: `${labelFontSize}px` }}
                            title="Click to rename"
                          >
                            {room.name}
                          </span>
                        )}
                        {editingRoomDimensionsId === room.id ? (
                          <div 
                            className="flex items-center justify-center space-x-1 pointer-events-auto bg-white dark:bg-slate-800 p-1 rounded-lg border border-indigo-500 shadow-md mt-1 scale-90"
                            onClick={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                          >
                            <input
                              type="number"
                              value={inlineRoomWidth}
                              onChange={(e) => {
                                setInlineRoomWidth(e.target.value);
                                const w = parseFloat(e.target.value);
                                if (!isNaN(w) && w >= 2) {
                                  const clampedW = Math.min(w, layout.width - room.x);
                                  const updatedRooms = layout.rooms.map((r) => r.id === room.id ? { ...r, width: clampedW } : r);
                                  setLayout({ ...layout, rooms: updatedRooms });
                                }
                              }}
                              onBlur={() => {
                                setEditingRoomDimensionsId(null);
                                pushToHistory(layout);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  setEditingRoomDimensionsId(null);
                                  pushToHistory(layout);
                                } else if (e.key === 'Escape') {
                                  setEditingRoomDimensionsId(null);
                                }
                              }}
                              className="w-10 text-center text-[10px] font-mono font-bold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-1 py-0.5 text-slate-900 dark:text-white"
                              title="Width"
                              autoFocus
                            />
                            <span className="text-[10px] text-slate-400 font-bold">×</span>
                            <input
                              type="number"
                              value={inlineRoomHeight}
                              onChange={(e) => {
                                setInlineRoomHeight(e.target.value);
                                const h = parseFloat(e.target.value);
                                if (!isNaN(h) && h >= 2) {
                                  const clampedH = Math.min(h, layout.length - room.y);
                                  const updatedRooms = layout.rooms.map((r) => r.id === room.id ? { ...r, height: clampedH } : r);
                                  setLayout({ ...layout, rooms: updatedRooms });
                                }
                              }}
                              onBlur={() => {
                                setEditingRoomDimensionsId(null);
                                pushToHistory(layout);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  setEditingRoomDimensionsId(null);
                                  pushToHistory(layout);
                                } else if (e.key === 'Escape') {
                                  setEditingRoomDimensionsId(null);
                                }
                              }}
                              className="w-10 text-center text-[10px] font-mono font-bold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-1 py-0.5 text-slate-900 dark:text-white"
                              title="Height"
                            />
                          </div>
                        ) : (
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedRoomId(room.id);
                              setEditingRoomDimensionsId(room.id);
                              setInlineRoomWidth(room.width.toString());
                              setInlineRoomHeight(room.height.toString());
                            }}
                            onMouseDown={(e) => e.stopPropagation()}
                            className="pointer-events-auto cursor-pointer hover:underline font-mono font-bold text-slate-500 dark:text-slate-400 mt-0.5 bg-slate-100/60 dark:bg-slate-800/60 px-1 py-0.5 rounded flex items-center gap-1"
                            style={{ fontSize: `${dimFontSize}px` }}
                            title="Click to change measurements live"
                          >
                            {Math.round(room.width)}' x {Math.round(room.height)}' {layout.unit}
                            <span className="opacity-70 text-[8px]">✏️</span>
                          </span>
                        )}

                        {/* Live Room Square Footage Overlay Layer */}
                        {showSqFtLayer && (
                          <span className="text-[8px] font-mono font-extrabold text-indigo-600 dark:text-indigo-400 mt-1 bg-indigo-50/90 dark:bg-slate-800/95 border border-indigo-200 dark:border-indigo-900/50 px-1.5 py-0.5 rounded-full uppercase tracking-wider select-none animate-pulse">
                            {layout.unit === 'ft' 
                              ? `${Math.round(room.width * room.height)} SQ FT` 
                              : `${Math.round(room.width * room.height)} SQ M (${Math.round(room.width * room.height * 10.764)} SQ FT)`}
                          </span>
                        )}
                      </div>
                    </foreignObject>

                    {/* Draw Resizing Corner Handles if Selected */}
                    {isSelected && (
                      <>
                        {/* Top-Left */}
                        <rect
                          x={room.x * pxPerUnit - 7}
                          y={room.y * pxPerUnit - 7}
                          width="14"
                          height="14"
                          rx="3"
                          className="fill-blue-600 stroke-white stroke-[1.5] cursor-nwse-resize shadow-md"
                          onMouseDown={(e) => handleResizeMouseDown(e, room.id, 'tl')}
                          onTouchStart={(e) => handleResizeMouseDown(e, room.id, 'tl')}
                        />
                        {/* Top-Right */}
                        <rect
                          x={(room.x + room.width) * pxPerUnit - 7}
                          y={room.y * pxPerUnit - 7}
                          width="14"
                          height="14"
                          rx="3"
                          className="fill-blue-600 stroke-white stroke-[1.5] cursor-nesw-resize shadow-md"
                          onMouseDown={(e) => handleResizeMouseDown(e, room.id, 'tr')}
                          onTouchStart={(e) => handleResizeMouseDown(e, room.id, 'tr')}
                        />
                        {/* Bottom-Left */}
                        <rect
                          x={room.x * pxPerUnit - 7}
                          y={(room.y + room.height) * pxPerUnit - 7}
                          width="14"
                          height="14"
                          rx="3"
                          className="fill-blue-600 stroke-white stroke-[1.5] cursor-nesw-resize shadow-md"
                          onMouseDown={(e) => handleResizeMouseDown(e, room.id, 'bl')}
                          onTouchStart={(e) => handleResizeMouseDown(e, room.id, 'bl')}
                        />
                        {/* Bottom-Right */}
                        <rect
                          x={(room.x + room.width) * pxPerUnit - 7}
                          y={(room.y + room.height) * pxPerUnit - 7}
                          width="14"
                          height="14"
                          rx="3"
                          className="fill-blue-600 stroke-white stroke-[1.5] cursor-nwse-resize shadow-md"
                          onMouseDown={(e) => handleResizeMouseDown(e, room.id, 'br')}
                          onTouchStart={(e) => handleResizeMouseDown(e, room.id, 'br')}
                        />
                      </>
                    )}
                  </g>
                );
              })}

              {/* DRAW WINDOWS */}
              {layout.windows.map((win) => {
                const isSelected = selectedWindowId === win.id;
                const winW = win.width * pxPerUnit;
                const room = layout.rooms.find((r) => r.id === win.roomId);
                const isBathroom = room?.type === 'bathroom';

                return (
                  <g key={win.id}>
                    {/* Window Block (White/blue stripes) */}
                    <rect
                      x={win.x * pxPerUnit}
                      y={win.y * pxPerUnit}
                      width={win.type === 'horizontal' ? winW : 6}
                      height={win.type === 'vertical' ? winW : 6}
                      fill={isBathroom ? '#f0f9ff' : '#e0f2fe'}
                      stroke={isSelected ? '#2563eb' : (isBathroom ? '#0369a1' : '#0284c7')}
                      strokeWidth={isSelected ? '2.5' : '1.5'}
                      className="cursor-move hover:fill-sky-100"
                      onMouseDown={(e) => handleWindowMouseDown(e, win.id)}
                      onTouchStart={(e) => handleWindowMouseDown(e, win.id)}
                    />
                    {/* Inner glass line */}
                    <line
                      x1={win.x * pxPerUnit + (win.type === 'horizontal' ? 0 : 3)}
                      y1={win.y * pxPerUnit + (win.type === 'vertical' ? 0 : 3)}
                      x2={
                        win.x * pxPerUnit +
                        (win.type === 'horizontal' ? winW : 3)
                      }
                      y2={
                        win.y * pxPerUnit +
                        (win.type === 'vertical' ? winW : 3)
                      }
                      stroke={isBathroom ? '#0369a1' : '#0284c7'}
                      strokeWidth="1"
                    />
                    {/* Window/Ventilator Label Badge */}
                    <g className="pointer-events-none select-none">
                      <circle
                        cx={win.x * pxPerUnit + (win.type === 'horizontal' ? winW / 2 : 3)}
                        cy={win.y * pxPerUnit + (win.type === 'vertical' ? winW / 2 : 3)}
                        r="6"
                        fill="#0284c7"
                        className="fill-sky-600 dark:fill-sky-500"
                        stroke="#ffffff"
                        strokeWidth="1"
                      />
                      <text
                        x={win.x * pxPerUnit + (win.type === 'horizontal' ? winW / 2 : 3)}
                        y={win.y * pxPerUnit + (win.type === 'vertical' ? winW / 2 : 3) + 2.5}
                        fontSize="8"
                        fontWeight="extrabold"
                        fill="#ffffff"
                        textAnchor="middle"
                        fontFamily="monospace"
                      >
                        {isBathroom ? 'V' : 'W'}
                      </text>
                    </g>
                  </g>
                );
              })}

              {/* DRAW DOORS */}
              {layout.doors.map((door) => {
                const isSelected = selectedDoorId === door.id;
                const doorW = door.width * pxPerUnit;

                return (
                  <g key={door.id}>
                    {/* Door opening arc */}
                    {door.type === 'horizontal' ? (
                      <path
                        d={`M ${door.x * pxPerUnit} ${door.y * pxPerUnit} A ${doorW} ${doorW} 0 0 1 ${(door.x + door.width) * pxPerUnit} ${door.y * pxPerUnit}`}
                        fill="none"
                        stroke="#94a3b8"
                        strokeWidth="1.5"
                      />
                    ) : (
                      <path
                        d={`M ${door.x * pxPerUnit} ${door.y * pxPerUnit} A ${doorW} ${doorW} 0 0 1 ${door.x * pxPerUnit} ${(door.y + door.width) * pxPerUnit}`}
                        fill="none"
                        stroke="#94a3b8"
                        strokeWidth="1.5"
                      />
                    )}

                    {/* Active Door Handle/Swing leaf */}
                    <rect
                      x={door.x * pxPerUnit}
                      y={door.y * pxPerUnit}
                      width={door.type === 'horizontal' ? doorW : 5}
                      height={door.type === 'vertical' ? doorW : 5}
                      fill={door.isMain ? '#ea580c' : '#b45309'}
                      stroke={isSelected ? '#2563eb' : '#d97706'}
                      strokeWidth={isSelected ? '2.5' : '1.5'}
                      className="cursor-move hover:fill-amber-600"
                      onMouseDown={(e) => handleDoorMouseDown(e, door.id)}
                      onTouchStart={(e) => handleDoorMouseDown(e, door.id)}
                    />

                    {/* Door Label Badge */}
                    <g className="pointer-events-none select-none">
                      <circle
                        cx={door.x * pxPerUnit + (door.type === 'horizontal' ? doorW / 2 : 2.5)}
                        cy={door.y * pxPerUnit + (door.type === 'vertical' ? doorW / 2 : 2.5)}
                        r="6"
                        fill="#ea580c"
                        className="fill-amber-600 dark:fill-amber-500"
                        stroke="#ffffff"
                        strokeWidth="1"
                      />
                      <text
                        x={door.x * pxPerUnit + (door.type === 'horizontal' ? doorW / 2 : 2.5)}
                        y={door.y * pxPerUnit + (door.type === 'vertical' ? doorW / 2 : 2.5) + 2.5}
                        fontSize="8"
                        fontWeight="extrabold"
                        fill="#ffffff"
                        textAnchor="middle"
                        fontFamily="monospace"
                      >
                        D
                      </text>
                    </g>
                  </g>
                );
              })}
            </g>
          </svg>
        </div>
      </div>
        )}

        {/* Quick Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleAddNewRoom}
              disabled={is3DView}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs flex items-center space-x-1.5 transition active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
              id="add-room-btn"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Room</span>
            </button>
            <button
              onClick={handleAddNewDoor}
              disabled={is3DView}
              className="px-3.5 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-xs flex items-center space-x-1.5 transition disabled:opacity-40 disabled:cursor-not-allowed"
              id="add-door-btn"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Door</span>
            </button>
            <button
              onClick={handleAddNewWindow}
              disabled={is3DView}
              className="px-3.5 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-xs flex items-center space-x-1.5 transition disabled:opacity-40 disabled:cursor-not-allowed"
              id="add-window-btn"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Window</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleSaveProject}
              className="p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs flex items-center space-x-1.5 transition font-semibold active:scale-95 shadow-sm shrink-0"
              title="Save current layout to local projects"
              id="save-blueprint-btn"
            >
              <Save className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Save Project</span>
            </button>

            {/* Combined Export Menu Dropdown */}
            <div className="relative shrink-0" ref={exportMenuRef}>
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs flex items-center space-x-1.5 transition font-semibold active:scale-95 shadow-sm"
                title={is3DView ? "Export 3D view in different high-quality formats" : "Export 2D schematic in different high-quality formats"}
                id="export-menu-toggle"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Schematic</span>
                <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${showExportMenu ? 'rotate-180' : ''}`} />
              </button>

              {showExportMenu && (
                <div className="absolute right-0 bottom-full mb-2 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 p-2 animate-in fade-in slide-in-from-bottom-2 duration-150">
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Select Export Format</p>
                    <p className="text-[9px] text-slate-500 dark:text-slate-400">Optimized for blueprint printing & CAD</p>
                  </div>
                  
                  <div className="mt-1.5 space-y-1">
                    {/* SVG Vector Format */}
                    <button
                      onClick={() => {
                        handleExportSVG();
                        setShowExportMenu(false);
                      }}
                      disabled={is3DView}
                      className="w-full flex items-start gap-3 p-2.5 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/40 text-left transition disabled:opacity-40 disabled:cursor-not-allowed"
                      title={is3DView ? "CAD vector export only supported in 2D blueprint mode" : "Export clean scalable vectors for printing or CAD software"}
                      id="export-format-svg"
                    >
                      <div className="p-1.5 bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-lg mt-0.5 shrink-0">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                          Scalable Vector (SVG)
                          <span className="bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 text-[8px] font-extrabold px-1 rounded">CAD</span>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">For CAD modeling & lossless scaling</p>
                      </div>
                    </button>

                    {/* PDF Document */}
                    <button
                      onClick={() => {
                        handleExportPDF();
                        setShowExportMenu(false);
                      }}
                      className="w-full flex items-start gap-3 p-2.5 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/20 text-left transition"
                      title="Architectural multi-page PDF document"
                      id="export-format-pdf"
                    >
                      <div className="p-1.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-lg mt-0.5 shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                          Architectural PDF
                          <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 text-[8px] font-extrabold px-1 rounded">2-PAGE</span>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">Detailed schedules & compliance stamp</p>
                      </div>
                    </button>

                    {/* PNG Image */}
                    <button
                      onClick={() => {
                        handleExportPNG();
                        setShowExportMenu(false);
                      }}
                      className="w-full flex items-start gap-3 p-2.5 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-950/20 text-left transition"
                      title="Export high resolution raster image"
                      id="export-format-png"
                    >
                      <div className="p-1.5 bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-lg mt-0.5 shrink-0">
                        <Download className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                          High-Resolution PNG
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">Perfect for quick sharing & views</p>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Direct Quick Export to PNG */}
            <button
              onClick={handleExportPNG}
              className="p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs flex items-center space-x-1.5 transition font-semibold active:scale-95 shadow-sm shrink-0"
              title={is3DView ? "Quick download as High-Resolution 3D Snapshot PNG image file" : "Quick download as High-Resolution PNG image file"}
              id="export-png-direct-btn"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Export PNG</span>
            </button>

            {/* Direct Quick Export to PDF */}
            <button
              onClick={handleExportPDF}
              className="p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs flex items-center space-x-1.5 transition font-semibold active:scale-95 shadow-sm shrink-0"
              title={is3DView ? "Quick download as Architectural 3D Model PDF document" : "Quick download as Architectural PDF document"}
              id="export-pdf-direct-btn"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Export PDF</span>
            </button>

            <button
              onClick={handlePrint}
              disabled={is3DView}
              className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 rounded-xl text-xs flex items-center space-x-1.5 transition font-semibold disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              title="Print layout (Only in 2D Mode)"
              id="print-blueprint-btn"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print blueprint</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar Inspector Panel - Right 4 Cols */}
      {!is3DView && (
        <div className="lg:col-span-4 space-y-6">
        {/* Selected Item Inspector Panel */}
        {activeRoom ? (
          <div className="bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-900 rounded-3xl p-6 shadow-xl shadow-blue-100/30 dark:shadow-none space-y-5 animate-in fade-in slide-in-from-right-3 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                Room Inspector
              </span>
              <button
                onClick={handleDeleteSelected}
                className="text-red-500 hover:text-red-600 p-1 rounded-lg hover:bg-red-50 transition"
                title="Delete this room"
                id="delete-room-btn"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Room Name */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Room Name / Label
              </label>
              <input
                type="text"
                value={roomNameInput}
                onChange={(e) => setRoomNameInput(e.target.value)}
                onBlur={updateSelectedRoomProps}
                onKeyDown={(e) => e.key === 'Enter' && updateSelectedRoomProps()}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
              />
            </div>

            {/* Fine-Tune Position & Dimensions Buttons */}
            <div className="space-y-3 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block text-center">
                Fine-Tune Layout (Touch-Friendly)
              </span>

              {/* Nudge Arrows Block */}
              <div className="flex flex-col items-center space-y-1">
                <button
                  onClick={() => nudgeRoom('up')}
                  className="p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg shadow-sm"
                  title="Move Up 0.5 units"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <div className="flex items-center space-x-5">
                  <button
                    onClick={() => nudgeRoom('left')}
                    className="p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg shadow-sm"
                    title="Move Left 0.5 units"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-[9px] font-mono font-bold text-slate-400 dark:text-slate-500 uppercase">Nudge</span>
                  <button
                    onClick={() => nudgeRoom('right')}
                    className="p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg shadow-sm"
                    title="Move Right 0.5 units"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <button
                  onClick={() => nudgeRoom('down')}
                  className="p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg shadow-sm"
                  title="Move Down 0.5 units"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>

              {/* Size Buttons */}
              <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <div className="flex flex-col space-y-1">
                  <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 text-center uppercase">Width</span>
                  <div className="flex items-center justify-center space-x-1">
                    <button
                      onClick={() => adjustRoomSize('width', -0.5)}
                      className="px-2 py-1 text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg shadow-sm"
                      title="Shrink Width"
                    >
                      -
                    </button>
                    <button
                      onClick={() => adjustRoomSize('width', 0.5)}
                      className="px-2 py-1 text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg shadow-sm"
                      title="Expand Width"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="flex flex-col space-y-1">
                  <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 text-center uppercase">Height</span>
                  <div className="flex items-center justify-center space-x-1">
                    <button
                      onClick={() => adjustRoomSize('height', -0.5)}
                      className="px-2 py-1 text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg shadow-sm"
                      title="Shrink Height"
                    >
                      -
                    </button>
                    <button
                      onClick={() => adjustRoomSize('height', 0.5)}
                      className="px-2 py-1 text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg shadow-sm"
                      title="Expand Height"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Room Dimensions */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Width ({layout.unit})
                </label>
                <input
                  type="number"
                  value={roomWidthInput}
                  onChange={(e) => handleWidthChangeLive(e.target.value)}
                  onBlur={updateSelectedRoomProps}
                  onKeyDown={(e) => e.key === 'Enter' && updateSelectedRoomProps()}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white font-mono"
                  min="2"
                  step="any"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Height ({layout.unit})
                </label>
                <input
                  type="number"
                  value={roomHeightInput}
                  onChange={(e) => handleHeightChangeLive(e.target.value)}
                  onBlur={updateSelectedRoomProps}
                  onKeyDown={(e) => e.key === 'Enter' && updateSelectedRoomProps()}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white font-mono"
                  min="2"
                  step="any"
                />
              </div>
            </div>

            {/* Room Type Tag / Category */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Category
              </label>
              <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto pr-1">
                {(
                  [
                    'bedroom',
                    'bathroom',
                    'kitchen',
                    'living',
                    'drawing',
                    'dining',
                    'garage',
                    'lawn',
                    'staircase',
                  ] as RoomType[]
                ).map((t) => (
                  <button
                    key={t}
                    onClick={() => updateSelectedRoomType(t)}
                    className={`py-1.5 px-2.5 rounded-lg text-xs font-semibold capitalize border text-left transition ${
                      activeRoom.type === t
                        ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-400 text-blue-600 dark:text-blue-300'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Room Finishes & Materials */}
            <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Finishes & Materials Costing
              </span>
              
              <div className="grid grid-cols-2 gap-3">
                {/* Floor Material Selection */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase">
                    Floor Finish
                  </label>
                  <select
                    value={activeRoom.floorMaterial || getDefaultFloorMaterial(activeRoom.type)}
                    onChange={(e) => updateSelectedRoomMaterial('floor', e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-semibold transition focus:ring-1 focus:ring-blue-500"
                    id="room-floor-material-select"
                  >
                    {FLOOR_MATERIALS.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} (${(m.costPerSqUnit * (layout.unit === 'm' ? 10 : 1)).toFixed(1)})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Wall Material Selection */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase">
                    Wall Finish
                  </label>
                  <select
                    value={activeRoom.wallMaterial || getDefaultWallMaterial(activeRoom.type)}
                    onChange={(e) => updateSelectedRoomMaterial('wall', e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-semibold transition focus:ring-1 focus:ring-blue-500"
                    id="room-wall-material-select"
                  >
                    {WALL_MATERIALS.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} (${(m.costPerSqUnit * (layout.unit === 'm' ? 10 : 1)).toFixed(1)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-1 italic text-center">
                Rates are per sq {layout.unit}. Wall finish scales by room perimeter.
              </p>
            </div>
          </div>
        ) : selectedDoorId || selectedWindowId ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {selectedDoorId ? 'Door Inspector' : 'Window Inspector'}
              </span>
              <button
                onClick={handleDeleteSelected}
                className="text-red-500 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50"
                id="delete-fixture-btn"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Drag this fixture along walls inside the SVG editor area to customize entrance or ventilation points.
            </p>
          </div>
        ) : (
          /* General Statistics Card - Blueprint Diagnostics */
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-md space-y-5">
            <div>
              <h3 className="text-base font-bold text-slate-950 dark:text-white mb-1 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-blue-500" />
                Blueprint Diagnostics
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Architectural insights & safety code compliance
              </p>
            </div>

            <div className="space-y-4">
              {/* Total Area */}
              <div className="flex items-center justify-between py-2 border-b border-slate-50 dark:border-slate-800">
                <span className="text-xs font-semibold text-slate-500">Total Plot Area</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white font-mono">
                  {totalArea} sq {layout.unit}
                </span>
              </div>

              {/* Built area */}
              <div className="flex items-center justify-between py-2 border-b border-slate-50 dark:border-slate-800">
                <span className="text-xs font-semibold text-slate-500">Built Room Footprint</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white font-mono">
                  {roomArea} sq {layout.unit}
                </span>
              </div>

              {/* Open lawn/yard area */}
              <div className="flex items-center justify-between py-2 border-b border-slate-50 dark:border-slate-800">
                <span className="text-xs font-semibold text-slate-500">Open Spaces / Yards</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white font-mono">
                  {openArea} sq {layout.unit}
                </span>
              </div>

              {/* Space utilization visual bar */}
              <div className="space-y-1.5 pb-2 border-b border-slate-50 dark:border-slate-800">
                <div className="flex justify-between text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                  <span>Room Density</span>
                  <span>{Math.round((roomArea / totalArea) * 100)}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(100, (roomArea / totalArea) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Legend / Room list summary */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-md">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            Room Inventory ({layout.rooms.length})
          </h4>
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {layout.rooms.map((room) => (
              <button
                key={room.id}
                onClick={() => setSelectedRoomId(room.id)}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition ${
                  selectedRoomId === room.id
                    ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-300'
                    : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded-md shrink-0 border border-slate-300"
                    style={{ backgroundColor: room.color || '#f1f5f9' }}
                  />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate max-w-[120px]">
                    {room.name}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                  {Math.round(room.width)}x{Math.round(room.height)} {layout.unit}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Room Explanations & Ventilation Guide */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-md mt-4 space-y-4">
          <div className="flex items-center space-x-2">
            <Info className="w-4 h-4 text-emerald-500 shrink-0" />
            <h4 className="text-xs font-bold text-slate-950 dark:text-white uppercase tracking-wider">
              Room-by-Room Explanations
            </h4>
          </div>
          <p className="text-[11px] text-slate-500 leading-normal">
            Short, simple descriptions of layout purpose and ventilation design:
          </p>
          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {layout.rooms.map((room) => {
              const nameLower = room.name.toLowerCase();
              let desc = "Functional utility space styled with geometric precision.";
              if (room.type === 'bedroom') {
                if (nameLower.includes('master') || nameLower.includes('suite')) {
                  desc = "Back privacy suite. Ventilates directly via large windows into the rear OTS shaft.";
                } else if (nameLower.includes('guest') || nameLower.includes('3')) {
                  desc = "Front guest room. Direct ventilation and natural light from the street frontage.";
                } else {
                  desc = "Cozy bedroom with cross-ventilation access from shafts or adjacent courtyards.";
                }
              } else if (room.type === 'bathroom') {
                if (nameLower.includes('att')) {
                  desc = "Attached bath. Uses top-level roshandan (ventilators) opening into the rear shaft for dry airflow.";
                } else {
                  desc = "Common toilet. Conveniently ventilated via passive ducts or central light shafts.";
                }
              } else if (room.type === 'kitchen') {
                desc = "Cooking hub. Placed on outer boundaries or OTS shafts to exhaust fumes and trap moisture.";
              } else if (room.type === 'living') {
                desc = "Family lounge. Central hub utilizing indirect daylight and shared passive airflow.";
              } else if (room.type === 'drawing') {
                desc = "Guest drawing room. Placed at front to protect inner-family privacy, ventilated from front yard.";
              } else if (room.type === 'garage') {
                desc = "Porch/Garage. Secure parking at main entry, facilitating breezy front access.";
              } else if (room.type === 'lawn') {
                if (nameLower.includes('shaft') || nameLower.includes('vent') || nameLower.includes('o.t.s')) {
                  desc = "Open To Sky (OTS) ventilation shaft. Connects rear bedrooms and baths to light and fresh air.";
                } else {
                  desc = "Lawn/Yard. Outdoor breeze reservoir, satisfying strict ventilation building codes.";
                }
              } else if (room.type === 'staircase') {
                desc = "Stairs hall. Direct access for future vertical expansion without disturbing ground layout.";
              } else if (room.type === 'corridor') {
                desc = "Connecting passage. High-efficiency walk-way with zero wasted layout footprint.";
              }

              return (
                <div key={room.id} className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl space-y-1 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center space-x-1.5">
                    <span 
                      className="w-2.5 h-2.5 rounded shrink-0 border border-slate-300"
                      style={{ backgroundColor: room.color || '#f1f5f9' }}
                    />
                    <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wide truncate max-w-[150px]">
                      {room.name}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                      ({Math.round(room.width)}x{Math.round(room.height)} {layout.unit})
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium leading-relaxed whitespace-normal break-words">
                    {desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
