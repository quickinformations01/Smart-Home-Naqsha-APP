import React, { useRef, useEffect, useState } from 'react';
import { NaqshaLayout, Room, Door, Window, FurnitureItem } from '../types';
import { RotateCw, ZoomIn, ZoomOut, Compass, Check, Brush, Sparkles, Layers, Paintbrush, Undo2, LayoutGrid, RefreshCw, Trash2, Download, Sun, Moon, Sunrise, Home, Sofa, Eye, Camera, Hand, Box, MoveUp, MoveDown, RotateCcw, LogOut } from 'lucide-react';
import { autoFurnishLayout, clearFurnishLayout } from '../utils/furnishSolver';
import { drawFurnitureItem } from '../utils/furnitureRenderer';
import exteriorRenderImg from '../assets/images/exterior_render_1784024482194.jpg';

interface FloorPlan3DViewerProps {
  layout: NaqshaLayout;
  onUpdateLayout?: (updatedLayout: NaqshaLayout) => void;
}

export interface MaterialItem {
  id: string;
  name: string;
  color: string;
  secondaryColor?: string;
  pattern: 'wood' | 'marble' | 'tile' | 'brick' | 'wallpaper' | 'plain';
  description: string;
}

export const FLOOR_MATERIALS: MaterialItem[] = [
  { id: 'light-oak', name: 'Light Oak Wood', color: '#f59e0b', secondaryColor: '#b45309', pattern: 'wood', description: 'Warm natural wood boards' },
  { id: 'dark-walnut', name: 'Dark Walnut', color: '#451a03', secondaryColor: '#1e0c02', pattern: 'wood', description: 'Premium deep dark timber' },
  { id: 'white-marble', name: 'Carrara Marble', color: '#fafafa', secondaryColor: '#cbd5e1', pattern: 'marble', description: 'Classic white with grey veins' },
  { id: 'emerald-marble', name: 'Verde Marble', color: '#064e3b', secondaryColor: '#10b981', pattern: 'marble', description: 'Luxury rich green marble' },
  { id: 'classic-tile', name: 'Terracotta Tile', color: '#ea580c', secondaryColor: '#9a3412', pattern: 'tile', description: 'Cozy clay-baked pottery tiles' },
  { id: 'grey-slate', name: 'Grey Slate Tile', color: '#475569', secondaryColor: '#1e293b', pattern: 'tile', description: 'Sleek industrial slate tilework' },
  { id: 'concrete', name: 'Polished Concrete', color: '#94a3b8', pattern: 'plain', description: 'Seamless minimalist gray finish' },
  { id: 'beige-carpet', name: 'Velvet Carpet', color: '#e7e5e4', pattern: 'plain', description: 'Plush cream comfort' },
  { id: 'royal-carpet', name: 'Royal Blue Carpet', color: '#1e3a8a', pattern: 'plain', description: 'Cozy deep blue texture' }
];

export const WALL_MATERIALS: MaterialItem[] = [
  { id: 'white-paint', name: 'Pristine White', color: '#f8fafc', pattern: 'plain', description: 'Bright plaster paint' },
  { id: 'sand-paint', name: 'Warm Sandstone', color: '#f5f5dc', pattern: 'plain', description: 'Soft neutral plaster' },
  { id: 'red-brick', name: 'Red Brick', color: '#b91c1c', secondaryColor: '#450a0a', pattern: 'brick', description: 'Rustic masonry style' },
  { id: 'wood-panel', name: 'Wood Boarding', color: '#d97706', secondaryColor: '#78350f', pattern: 'wood', description: 'Vertical cedar panels' },
  { id: 'charcoal-slate', name: 'Charcoal Stone', color: '#334155', secondaryColor: '#0f172a', pattern: 'brick', description: 'Bold split-face stone' },
  { id: 'teal-wallpaper', name: 'Teal Wallpaper', color: '#0f766e', secondaryColor: '#134e4a', pattern: 'wallpaper', description: 'Damask patterned wallpaper' },
  { id: 'gold-wallpaper', name: 'Golden Damask', color: '#ca8a04', secondaryColor: '#713f12', pattern: 'wallpaper', description: 'Royal amber print' },
  { id: 'sage-paint', name: 'Sage Green', color: '#bbf7d0', pattern: 'plain', description: 'Calming natural tone' }
];

// Convex polygon point-in-polygon helper (for room clicks in 3D)
function isPointInQuad(px: number, py: number, q1: { x: number; y: number }, q2: { x: number; y: number }, q3: { x: number; y: number }, q4: { x: number; y: number }) {
  const checkSide = (x1: number, y1: number, x2: number, y2: number, x3: number, y3: number) => {
    return (x3 - x1) * (y2 - y1) - (y3 - y1) * (x2 - x1);
  };
  const s1 = checkSide(q1.x, q1.y, q2.x, q2.y, px, py);
  const s2 = checkSide(q2.x, q2.y, q3.x, q3.y, px, py);
  const s3 = checkSide(q3.x, q3.y, q4.x, q4.y, px, py);
  const s4 = checkSide(q4.x, q4.y, q1.x, q1.y, px, py);
  const hasNeg = s1 < 0 || s2 < 0 || s3 < 0 || s4 < 0;
  const hasPos = s1 > 0 || s2 > 0 || s3 > 0 || s4 > 0;
  return !(hasNeg && hasPos);
}

export default function FloorPlan3DViewer({ layout, onUpdateLayout }: FloorPlan3DViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState<{ width: number; height: number }>({ width: 600, height: 450 });
  const [yaw, setYaw] = useState<number>(45); // horizontal rotation
  const [pitch, setPitch] = useState<number>(55); // vertical rotation
  const [zoom3d, setZoom3d] = useState<number>(1.2);
  const [isRotating, setIsRotating] = useState<boolean>(false);
  const dragStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [clickStart, setClickStart] = useState<{ x: number; y: number } | null>(null);

  // Material application interaction state
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>('all');
  const [activeTab, setActiveTab] = useState<'floor' | 'wall'>('floor');

  // 3D View Modes and Ambient Lighting States
  const [viewMode, setViewMode] = useState<'interior' | 'exterior'>('interior');
  const [lightingMode, setLightingMode] = useState<'day' | 'sunset' | 'night'>('day');
  const [sidebarTab, setSidebarTab] = useState<'styling' | 'exterior_render'>('styling');

  // New Interactive 3D Features states
  const [projectionType, setProjectionType] = useState<'perspective' | 'top' | 'elevation'>('perspective');
  const [showRoof, setShowRoof] = useState<boolean>(false);
  const [showFurniture, setShowFurniture] = useState<boolean>(true);
  const [isWalkthrough, setIsWalkthrough] = useState<boolean>(false);
  const [wtX, setWtX] = useState<number>(layout.width / 2);
  const [wtY, setWtY] = useState<number>(layout.length / 2);
  const [wtYaw, setWtYaw] = useState<number>(0);
  const [controlMode, setControlMode] = useState<'orbit' | 'pan'>('orbit');
  const [panX, setPanX] = useState<number>(0);
  const [panY, setPanY] = useState<number>(0);

  // Keep roof visibility synchronized with exterior view selection by default
  useEffect(() => {
    setShowRoof(viewMode === 'exterior');
  }, [viewMode]);

  // Walkthrough navigation helper functions
  const moveForward = (dist: number) => {
    const rad = (wtYaw * Math.PI) / 180;
    setWtX((prev) => Math.max(0, Math.min(layout.width, prev + Math.cos(rad) * dist)));
    setWtY((prev) => Math.max(0, Math.min(layout.length, prev - Math.sin(rad) * dist)));
  };

  const moveSideways = (dist: number) => {
    const rad = (wtYaw * Math.PI) / 180;
    setWtX((prev) => Math.max(0, Math.min(layout.width, prev + Math.sin(rad) * dist)));
    setWtY((prev) => Math.max(0, Math.min(layout.length, prev + Math.cos(rad) * dist)));
  };

  // Walkthrough mode keyboard navigation listener
  useEffect(() => {
    if (!isWalkthrough) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const moveSpeed = 1.0; // 1 foot per keypress
      const rotateSpeed = 5; // 5 degrees per keypress

      switch (e.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
          e.preventDefault();
          moveForward(moveSpeed);
          break;
        case 's':
        case 'arrowdown':
          e.preventDefault();
          moveForward(-moveSpeed);
          break;
        case 'a':
          e.preventDefault();
          moveSideways(-moveSpeed);
          break;
        case 'd':
          e.preventDefault();
          moveSideways(moveSpeed);
          break;
        case 'arrowleft':
          e.preventDefault();
          setWtYaw((prev) => (prev - rotateSpeed + 360) % 360);
          break;
        case 'arrowright':
          e.preventDefault();
          setWtYaw((prev) => (prev + rotateSpeed) % 360);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isWalkthrough, wtYaw, layout]);

  // Auto-furnish on initial mount to guarantee all possible 3D features are shown instantly
  useEffect(() => {
    if (onUpdateLayout && !layout.autoFurnished) {
      const updated = autoFurnishLayout(layout);
      onUpdateLayout(updated);
    }
  }, []);

  // Set up ResizeObserver to handle canvas resizing dynamically
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setCanvasSize({ width: Math.floor(width), height: Math.floor(height) });
        }
      }
    });

    observer.observe(container);
    return () => {
      observer.disconnect();
    };
  }, []);

  // Apply material change
  const applyMaterial = (materialId: string) => {
    if (!onUpdateLayout) return;

    let updatedRooms: Room[];
    if (selectedRoomId === 'all' || !selectedRoomId) {
      updatedRooms = layout.rooms.map(r => {
        if (r.type === 'lawn') return r;
        if (activeTab === 'floor') {
          return { ...r, floorMaterial: materialId };
        } else {
          return { ...r, wallMaterial: materialId };
        }
      });
    } else {
      updatedRooms = layout.rooms.map(r => {
        if (r.id === selectedRoomId) {
          if (activeTab === 'floor') {
            return { ...r, floorMaterial: materialId };
          } else {
            return { ...r, wallMaterial: materialId };
          }
        }
        return r;
      });
    }

    const updatedLayout: NaqshaLayout = {
      ...layout,
      rooms: updatedRooms,
      floors: layout.floors ? {
        ...layout.floors,
        [layout.activeFloor || 'ground']: {
          ...layout.floors[layout.activeFloor || 'ground'],
          rooms: updatedRooms
        }
      } : undefined
    };

    onUpdateLayout(updatedLayout);
  };

  // Revert custom material
  const resetMaterial = () => {
    if (!onUpdateLayout) return;

    let updatedRooms: Room[];
    if (selectedRoomId === 'all' || !selectedRoomId) {
      updatedRooms = layout.rooms.map(r => {
        const u = { ...r };
        if (activeTab === 'floor') {
          delete u.floorMaterial;
        } else {
          delete u.wallMaterial;
        }
        return u;
      });
    } else {
      updatedRooms = layout.rooms.map(r => {
        if (r.id === selectedRoomId) {
          const u = { ...r };
          if (activeTab === 'floor') {
            delete u.floorMaterial;
          } else {
            delete u.wallMaterial;
          }
          return u;
        }
        return r;
      });
    }

    const updatedLayout: NaqshaLayout = {
      ...layout,
      rooms: updatedRooms,
      floors: layout.floors ? {
        ...layout.floors,
        [layout.activeFloor || 'ground']: {
          ...layout.floors[layout.activeFloor || 'ground'],
          rooms: updatedRooms
        }
      } : undefined
    };

    onUpdateLayout(updatedLayout);
  };

  const handleAutoFurnish = () => {
    if (!onUpdateLayout) return;
    const updated = autoFurnishLayout(layout);
    onUpdateLayout(updated);
  };

  const handleClearFurnish = () => {
    if (!onUpdateLayout) return;
    const updated = clearFurnishLayout(layout);
    onUpdateLayout(updated);
  };

  // Dynamic Grid/Pixel scale mapping to ensure any small or large plot fits perfectly and professionally inside the viewport
  const maxDim = Math.max(layout.width, layout.length);
  const canvasMinDim = Math.min(canvasSize.width, canvasSize.height);
  const pxPerUnit = Math.max(4, Math.min(75, (canvasMinDim * 1.1) / (maxDim || 1)));

  // 3D Isometric projection math helper (supports orbit, top-down and first-person walkthrough)
  const project = (
    x: number,
    y: number,
    z: number,
    cx: number,
    cy: number,
    radYaw: number,
    radPitch: number
  ) => {
    let dx, dy, dz;
    let rx1, ry1, rz1;
    let rx2, ry2, rz2;
    let scale;

    if (isWalkthrough) {
      // Coordinates relative to walkthrough camera
      dx = x - wtX;
      dy = y - wtY;
      dz = z - 3.8; // eye-level camera height

      const rYaw = (wtYaw * Math.PI) / 180;
      const rPitch = (5 * Math.PI) / 180; // slightly tilted for modern wide horizon look

      // 1. Z-axis yaw rotation relative to camera look angle
      // Look direction is (cos(rYaw), -sin(rYaw)), right direction is (sin(rYaw), cos(rYaw))
      rx1 = dx * Math.sin(rYaw) + dy * Math.cos(rYaw);
      ry1 = dx * Math.cos(rYaw) - dy * Math.sin(rYaw);
      rz1 = dz;

      // 2. X-axis pitch rotation
      rx2 = rx1;
      ry2 = ry1 * Math.cos(rPitch) - rz1 * Math.sin(rPitch);
      rz2 = ry1 * Math.sin(rPitch) + rz1 * Math.cos(rPitch);

      // Wide FOV Perspective Projection for indoor immersive navigation
      const perspective = 180;
      scale = zoom3d * pxPerUnit * (perspective / Math.max(10, perspective + ry2)) * 1.8;

      const isBehind = ry2 < 0.25;

      return {
        x: cx + rx2 * scale,
        y: cy - rz2 * scale, // Subtract vertical component because on screen smaller Y is higher
        depth: ry2,
        behind: isBehind,
      };
    } else if (projectionType === 'top') {
      // Parallel orthographic top-down blueprint projection
      dx = x - layout.width / 2;
      dy = y - layout.length / 2;
      
      scale = zoom3d * pxPerUnit;

      return {
        x: cx + panX + dx * scale,
        y: cy + panY + dy * scale,
        depth: -z, // Height acts as depth to draw bottom-up
        behind: false,
      };
    } else {
      // Standard Perspective Orbit Projection
      dx = x - layout.width / 2;
      dy = y - layout.length / 2;
      dz = z - 1.1; // Centering vertical offset (centered at mid-wall height)

      // 1. Rotation around Z-axis (Yaw)
      rx1 = dx * Math.cos(radYaw) - dy * Math.sin(radYaw);
      ry1 = dx * Math.sin(radYaw) + dy * Math.cos(radYaw);
      rz1 = dz;

      // 2. Rotation around X-axis (Pitch)
      rx2 = rx1;
      ry2 = ry1 * Math.cos(radPitch) - rz1 * Math.sin(radPitch);
      rz2 = ry1 * Math.sin(radPitch) + rz1 * Math.cos(radPitch);

      const perspective = 500;
      scale = zoom3d * pxPerUnit * (perspective / (perspective + ry2));

      return {
        x: cx + panX + rx2 * scale,
        y: cy + panY + rz2 * scale,
        depth: ry2,
        behind: false,
      };
    }
  };

  // Orbit dragging and Panning handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsRotating(true);
    const clientX = e.clientX;
    const clientY = e.clientY;
    dragStart.current = { x: clientX, y: clientY };
    setClickStart({ x: clientX, y: clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isRotating) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    dragStart.current = { x: e.clientX, y: e.clientY };

    // Pan mode is activated if controlMode is 'pan', Shift is held, or Right/Middle mouse clicked
    const isPanning = controlMode === 'pan' || e.shiftKey || e.button === 2 || (e.buttons & 2) !== 0 || e.button === 1;

    if (isPanning) {
      setPanX((prev) => prev + dx);
      setPanY((prev) => prev + dy);
    } else if (isWalkthrough) {
      // Dragging looks around in Walkthrough Mode
      setWtYaw((prev) => (prev + dx * 0.5 + 360) % 360);
    } else {
      // Orbit rotation updates
      setYaw((prev) => (prev + dx * 0.7) % 360);
      setPitch((prev) => Math.max(15, Math.min(80, prev + dy * 0.5)));
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    setIsRotating(false);
    if (clickStart) {
      const dx = Math.abs(e.clientX - clickStart.x);
      const dy = Math.abs(e.clientY - clickStart.y);
      if (dx < 4 && dy < 4) {
        handleCanvasClick(e);
      }
    }
    setClickStart(null);
  };

  // Canvas mouse wheel zoom handler
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setZoom3d((prev) => Math.max(0.4, Math.min(4.0, prev - e.deltaY * 0.0015)));
  };

  // Touch state references for mobile zoom/pinch and rotate/pan gestures
  const touchState = useRef<{
    lastX: number;
    lastY: number;
    initialDistance: number;
    initialZoom: number;
    isDoubleTouch: boolean;
  }>({
    lastX: 0,
    lastY: 0,
    initialDistance: 0,
    initialZoom: 1.2,
    isDoubleTouch: false,
  });

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setIsRotating(true);
      dragStart.current = { x: touch.clientX, y: touch.clientY };
      setClickStart({ x: touch.clientX, y: touch.clientY });
      touchState.current.isDoubleTouch = false;
    } else if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dx = t1.clientX - t2.clientX;
      const dy = t1.clientY - t2.clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      touchState.current.initialDistance = dist;
      touchState.current.initialZoom = zoom3d;
      touchState.current.lastX = (t1.clientX + t2.clientX) / 2;
      touchState.current.lastY = (t1.clientY + t2.clientY) / 2;
      touchState.current.isDoubleTouch = true;
      setIsRotating(false);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && !touchState.current.isDoubleTouch) {
      const touch = e.touches[0];
      const dx = touch.clientX - dragStart.current.x;
      const dy = touch.clientY - dragStart.current.y;
      dragStart.current = { x: touch.clientX, y: touch.clientY };

      const isPanning = controlMode === 'pan';

      if (isPanning) {
        setPanX((prev) => prev + dx);
        setPanY((prev) => prev + dy);
      } else if (isWalkthrough) {
        setWtYaw((prev) => (prev + dx * 0.5 + 360) % 360);
      } else {
        setYaw((prev) => (prev + dx * 0.7) % 360);
        setPitch((prev) => Math.max(15, Math.min(80, prev + dy * 0.5)));
      }
    } else if (e.touches.length === 2) {
      if (e.cancelable) {
        e.preventDefault();
      }
      
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dx = t1.clientX - t2.clientX;
      const dy = t1.clientY - t2.clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      const initialDist = touchState.current.initialDistance;
      if (initialDist > 0 && dist > 0) {
        const factor = dist / initialDist;
        const newZoom = touchState.current.initialZoom * factor;
        setZoom3d(Math.max(0.4, Math.min(4.0, newZoom)));
      }

      const centerX = (t1.clientX + t2.clientX) / 2;
      const centerY = (t1.clientY + t2.clientY) / 2;
      const pdx = centerX - touchState.current.lastX;
      const pdy = centerY - touchState.current.lastY;

      if (Math.abs(pdx) > 1 || Math.abs(pdy) > 1) {
        setPanX((prev) => prev + pdx);
        setPanY((prev) => prev + pdy);
      }

      touchState.current.lastX = centerX;
      touchState.current.lastY = centerY;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    setIsRotating(false);
    if (e.touches.length === 0) {
      if (clickStart && !touchState.current.isDoubleTouch) {
        const dx = Math.abs(dragStart.current.x - clickStart.x);
        const dy = Math.abs(dragStart.current.y - clickStart.y);
        if (dx < 10 && dy < 10) {
          const canvas = canvasRef.current;
          if (canvas) {
            const rect = canvas.getBoundingClientRect();
            const mx = dragStart.current.x - rect.left;
            const my = dragStart.current.y - rect.top;
            handleCanvasTouchTap(mx, my, canvas);
          }
        }
      }
      setClickStart(null);
      touchState.current.isDoubleTouch = false;
      touchState.current.initialDistance = 0;
    } else if (e.touches.length === 1) {
      const touch = e.touches[0];
      dragStart.current = { x: touch.clientX, y: touch.clientY };
      setIsRotating(true);
    }
  };

  const handleCanvasTouchTap = (mx: number, my: number, canvas: HTMLCanvasElement) => {
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const radYaw = (yaw * Math.PI) / 180;
    const radPitch = (pitch * Math.PI) / 180;

    let clickedRoom: Room | null = null;
    let maxDepth = -999999;

    layout.rooms.forEach((room) => {
      const rx = room.x;
      const ry = room.y;
      const rw = room.width;
      const rh = room.height;

      const c1 = project(rx, ry, 0, cx, cy, radYaw, radPitch);
      const c2 = project(rx + rw, ry, 0, cx, cy, radYaw, radPitch);
      const c3 = project(rx + rw, ry + rh, 0, cx, cy, radYaw, radPitch);
      const c4 = project(rx, ry + rh, 0, cx, cy, radYaw, radPitch);

      if (isPointInQuad(mx, my, c1, c2, c3, c4)) {
        const avgDepth = (c1.depth + c2.depth + c3.depth + c4.depth) / 4;
        if (avgDepth > maxDepth) {
          maxDepth = avgDepth;
          clickedRoom = room;
        }
      }
    });

    if (clickedRoom) {
      setSelectedRoomId((clickedRoom as Room).id);
    } else {
      setSelectedRoomId('all');
    }
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const radYaw = (yaw * Math.PI) / 180;
    const radPitch = (pitch * Math.PI) / 180;

    let clickedRoom: Room | null = null;
    let maxDepth = -999999;

    layout.rooms.forEach((room) => {
      const rx = room.x;
      const ry = room.y;
      const rw = room.width;
      const rh = room.height;

      const c1 = project(rx, ry, 0, cx, cy, radYaw, radPitch);
      const c2 = project(rx + rw, ry, 0, cx, cy, radYaw, radPitch);
      const c3 = project(rx + rw, ry + rh, 0, cx, cy, radYaw, radPitch);
      const c4 = project(rx, ry + rh, 0, cx, cy, radYaw, radPitch);

      if (isPointInQuad(mx, my, c1, c2, c3, c4)) {
        const avgDepth = (c1.depth + c2.depth + c3.depth + c4.depth) / 4;
        if (avgDepth > maxDepth) {
          maxDepth = avgDepth;
          clickedRoom = room;
        }
      }
    });

    if (clickedRoom) {
      setSelectedRoomId((clickedRoom as Room).id);
    } else {
      setSelectedRoomId('all');
    }
  };

  // Render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Setup canvas size matching container dimensions
    const width = canvasSize.width;
    const height = canvasSize.height;
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    const drawFrontElevation = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      // 1. CHOOSE ATMOSPHERIC COLOR PALETTE
      const isDark = document.documentElement.classList.contains('dark');
      let skyGradient = ctx.createLinearGradient(0, 0, 0, height);
      let groundColor = isDark ? '#111827' : '#1e3a1e';
      let grassColor = isDark ? '#1b4332' : '#22c55e';
      let sunMoonColor = '#fef08a';
      let sunMoonAura = 'rgba(254, 240, 138, 0.2)';
      let hasStars = false;
      let textThemeColor = isDark ? '#f8fafc' : '#1e293b';
      let dimLineColor = isDark ? 'rgba(148, 163, 184, 0.4)' : 'rgba(71, 85, 105, 0.3)';

      if (lightingMode === 'sunset') {
        skyGradient.addColorStop(0, '#1e1b4b'); // dark indigo
        skyGradient.addColorStop(0.5, '#f97316'); // sunset orange
        skyGradient.addColorStop(1, '#fef08a'); // golden yellow
        sunMoonColor = '#fca5a5'; // reddish large sun
        sunMoonAura = 'rgba(249, 115, 22, 0.35)';
      } else if (lightingMode === 'night') {
        skyGradient.addColorStop(0, '#030712'); // midnight
        skyGradient.addColorStop(1, '#0f172a'); // slate dark
        sunMoonColor = '#e2e8f0'; // bright silver moon
        sunMoonAura = 'rgba(226, 232, 240, 0.15)';
        hasStars = true;
      } else { // 'day'
        skyGradient.addColorStop(0, isDark ? '#0b1528' : '#7dd3fc'); // deep sky blue
        skyGradient.addColorStop(1, isDark ? '#1e293b' : '#e0f2fe'); // soft light blue
        sunMoonColor = '#facc15'; // blazing yellow sun
        sunMoonAura = 'rgba(250, 204, 21, 0.25)';
      }

      // Draw Sky
      ctx.fillStyle = skyGradient;
      ctx.fillRect(0, 0, width, height);

      // Draw stars if night
      if (hasStars) {
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 40; i++) {
          const starX = (Math.sin(i * 1234.5) * 0.5 + 0.5) * width;
          const starY = (Math.cos(i * 5432.1) * 0.5 + 0.5) * (height - 150);
          const starSize = (Math.sin(i * 99) * 0.5 + 0.5) * 1.5 + 0.5;
          ctx.beginPath();
          ctx.arc(starX, starY, starSize, 0, 2 * Math.PI);
          ctx.fill();
        }
      }

      // Draw Sun/Moon
      ctx.save();
      const celestialX = width * 0.8;
      const celestialY = 80;
      const celestialRad = lightingMode === 'sunset' ? 35 : 20;
      
      // Glow Aura
      ctx.beginPath();
      ctx.arc(celestialX, celestialY, celestialRad * 2.2, 0, 2 * Math.PI);
      ctx.fillStyle = sunMoonAura;
      ctx.fill();

      // Core Celestial body
      ctx.beginPath();
      if (lightingMode === 'night') {
        // Draw moon crescent shape
        ctx.arc(celestialX, celestialY, celestialRad, 0, 2 * Math.PI);
        ctx.fillStyle = sunMoonColor;
        ctx.fill();
        // Overlay a bit darker to make crescent
        ctx.beginPath();
        ctx.arc(celestialX - celestialRad * 0.4, celestialY - celestialRad * 0.2, celestialRad, 0, 2 * Math.PI);
        ctx.fillStyle = isDark ? '#030712' : '#0f172a'; // match sky color
        ctx.fill();
      } else {
        ctx.arc(celestialX, celestialY, celestialRad, 0, 2 * Math.PI);
        ctx.fillStyle = sunMoonColor;
        ctx.fill();
      }
      ctx.restore();

      // Draw standard stylized architectural clouds
      ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.35)';
      const drawCloud = (cx: number, cy: number, w: number) => {
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(cx, cy, w, w * 0.4, 0, 0, 2 * Math.PI);
        ctx.ellipse(cx - w * 0.5, cy + w * 0.1, w * 0.7, w * 0.3, 0, 0, 2 * Math.PI);
        ctx.ellipse(cx + w * 0.5, cy + w * 0.1, w * 0.6, w * 0.3, 0, 0, 2 * Math.PI);
        ctx.fill();
        ctx.restore();
      };
      drawCloud(width * 0.2, 110, 45);
      drawCloud(width * 0.55, 75, 60);

      // 2. CALCULATE FLOOR AND BUILDING GEOMETRY
      const groundY = height - 100;
      
      // Detect available floors
      const floorsAvailable: string[] = ['ground'];
      if (layout.floors?.first?.rooms && layout.floors.first.rooms.length > 0) {
        floorsAvailable.push('first');
      }
      if (layout.floors?.second?.rooms && layout.floors.second.rooms.length > 0) {
        floorsAvailable.push('second');
      }
      const numFloors = floorsAvailable.length;

      // Base building dimensions
      const plotWidth = layout.width;
      const unit = layout.unit;

      // Scale to fit beautifully
      const scaleX = (width - 180) / plotWidth;
      const scaleY = (height - 200) / (numFloors * 11 + 6); // 10ft height per floor + margins
      const scale = Math.max(5, Math.min(30, Math.min(scaleX, scaleY)));

      const buildingWidthPx = plotWidth * scale;
      const startX = (width - buildingWidthPx) / 2;
      const floorHeightFt = 10;
      const floorHeightPx = floorHeightFt * scale;

      // Draw background ground base
      ctx.fillStyle = groundColor;
      ctx.fillRect(0, groundY, width, height - groundY);

      // Grassy garden top curb
      const grassGrad = ctx.createLinearGradient(0, groundY, 0, groundY + 12);
      grassGrad.addColorStop(0, grassColor);
      grassGrad.addColorStop(1, groundColor);
      ctx.fillStyle = grassGrad;
      ctx.fillRect(0, groundY, width, 12);

      // 3. DRAW LANDSCAPING TREES IN BACKGROUND / SIDES (Architectural presentation style)
      const drawTree = (tx: number, ty: number, tHeight: number) => {
        ctx.save();
        // Trunk
        ctx.fillStyle = isDark ? '#334155' : '#64748b';
        ctx.fillRect(tx - 3, ty - tHeight, 6, tHeight);

        // Translucent minimalist foliage layers
        ctx.fillStyle = isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(34, 197, 94, 0.2)';
        ctx.strokeStyle = isDark ? 'rgba(16, 185, 129, 0.4)' : 'rgba(34, 197, 94, 0.6)';
        ctx.lineWidth = 1;

        ctx.beginPath();
        ctx.arc(tx, ty - tHeight + 10, 22, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(tx - 10, ty - tHeight + 30, 18, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(tx + 10, ty - tHeight + 30, 18, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      };
      drawTree(startX - 55, groundY, 110);
      drawTree(startX + buildingWidthPx + 55, groundY, 125);

      // 4. DRAW BUILDING SHADOW OVERLAY
      // Let's draw the floors from ground up!
      floorsAvailable.forEach((floorKey, fIdx) => {
        const floorY = fIdx * floorHeightPx;
        const currentFloorBottomY = groundY - floorY;
        const currentFloorTopY = currentFloorBottomY - floorHeightPx;

        // Draw main solid facade backing for this floor
        ctx.fillStyle = isDark ? '#1e293b' : '#f8fafc';
        ctx.fillRect(startX, currentFloorTopY, buildingWidthPx, floorHeightPx);

        // Fetch rooms for this floor
        const floorRooms = floorKey === 'ground' 
          ? (layout.floors?.ground?.rooms || layout.rooms)
          : (layout.floors?.[floorKey]?.rooms || []);

        // Find rooms with layout positions and color them
        floorRooms.forEach((room) => {
          const rxPx = startX + room.x * scale;
          const rwPx = room.width * scale;
          
          // Determine architectural facade color for this room
          let roomColor = isDark ? '#334155' : '#f1f5f9';
          let wallMat = room.wallMaterial ? WALL_MATERIALS.find(m => m.id === room.wallMaterial) : null;
          
          if (wallMat) {
            roomColor = wallMat.color;
          } else {
            // Stylized based on room type
            if (room.type === 'garage') {
              roomColor = isDark ? '#2e3542' : '#e2e8f0'; // grey concrete panel
            } else if (room.type === 'staircase') {
              roomColor = isDark ? '#312e81' : '#cbd5e1'; // elegant violet/charcoal accent
            } else if (room.type === 'drawing' || room.type === 'living') {
              roomColor = isDark ? '#374151' : '#fcfbf7'; // plaster white
            } else if (room.type === 'bathroom') {
              roomColor = isDark ? '#1a365d' : '#f0f9ff';
            }
          }

          ctx.fillStyle = roomColor;
          ctx.fillRect(rxPx, currentFloorTopY, rwPx, floorHeightPx);

          // Apply material patterns
          if (wallMat && wallMat.pattern === 'brick') {
            ctx.save();
            ctx.strokeStyle = wallMat.secondaryColor || (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)');
            ctx.lineWidth = 0.5;
            for (let yOffset = 4; yOffset < floorHeightPx; yOffset += 5) {
              ctx.beginPath();
              ctx.moveTo(rxPx, currentFloorTopY + yOffset);
              ctx.lineTo(rxPx + rwPx, currentFloorTopY + yOffset);
              ctx.stroke();
            }
            ctx.restore();
          } else if (wallMat && wallMat.pattern === 'wood') {
            ctx.save();
            ctx.strokeStyle = wallMat.secondaryColor || (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)');
            ctx.lineWidth = 0.5;
            for (let xOffset = 3; xOffset < rwPx; xOffset += 4) {
              ctx.beginPath();
              ctx.moveTo(rxPx + xOffset, currentFloorTopY);
              ctx.lineTo(rxPx + xOffset, currentFloorBottomY);
              ctx.stroke();
            }
            ctx.restore();
          }

          // Draw doors inside this room on front
          const floorDoors = floorKey === 'ground'
            ? (layout.floors?.ground?.doors || layout.doors)
            : (layout.floors?.[floorKey]?.doors || []);

          floorDoors.forEach((door) => {
            // Door horizontal position must fall inside this room
            const dXPx = startX + door.x * scale;
            const dWPx = door.width * scale;
            if (door.x >= room.x && door.x + door.width <= room.x + room.width + 0.1) {
              // Draw Door on facade!
              const dHPx = 7 * scale; // standard 7ft height
              const dTopY = currentFloorBottomY - dHPx;

              // Door shadow frame
              ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
              ctx.fillRect(dXPx - 2, dTopY - 2, dWPx + 4, dHPx + 2);

              if (door.isMain || room.type === 'garage') {
                if (room.type === 'garage') {
                  // Roll-up modern metal garage door with horizontal slats
                  ctx.fillStyle = isDark ? '#475569' : '#94a3b8';
                  ctx.fillRect(dXPx, dTopY, dWPx, dHPx);
                  ctx.strokeStyle = isDark ? '#1e293b' : '#475569';
                  ctx.lineWidth = 1;
                  for (let slatY = dTopY + 4; slatY < currentFloorBottomY; slatY += 6) {
                    ctx.beginPath();
                    ctx.moveTo(dXPx, slatY);
                    ctx.lineTo(dXPx + dWPx, slatY);
                    ctx.stroke();
                  }
                  // Handle lock
                  ctx.fillStyle = '#cbd5e1';
                  ctx.fillRect(dXPx + dWPx/2 - 10, currentFloorBottomY - 12, 20, 4);
                } else {
                  // Gorgeous main entrance double wooden door
                  ctx.fillStyle = '#78350f'; // mahogany
                  ctx.fillRect(dXPx, dTopY, dWPx, dHPx);
                  // Door panels
                  ctx.strokeStyle = '#451a03';
                  ctx.lineWidth = 1.5;
                  ctx.strokeRect(dXPx + 2, dTopY + 2, dWPx/2 - 3, dHPx - 4);
                  ctx.strokeRect(dXPx + dWPx/2 + 1, dTopY + 2, dWPx/2 - 3, dHPx - 4);
                  // Brass handles
                  ctx.fillStyle = '#fbbf24';
                  ctx.fillRect(dXPx + dWPx/2 - 3, dTopY + dHPx/2 - 6, 2, 12);
                  ctx.fillRect(dXPx + dWPx/2 + 1, dTopY + dHPx/2 - 6, 2, 12);
                }
              } else {
                // Interior or back door visible from front
                ctx.fillStyle = '#d97706'; // warm oak
                ctx.fillRect(dXPx, dTopY, dWPx, dHPx);
                ctx.strokeStyle = '#78350f';
                ctx.strokeRect(dXPx + 1, dTopY + 1, dWPx - 2, dHPx - 1);
                // Simple handle
                ctx.fillStyle = '#cbd5e1';
                ctx.beginPath();
                ctx.arc(dXPx + dWPx - 6, dTopY + dHPx/2, 2.5, 0, 2 * Math.PI);
                ctx.fill();
              }
            }
          });

          // Draw windows inside this room on front
          const floorWindows = floorKey === 'ground'
            ? (layout.floors?.ground?.windows || layout.windows)
            : (layout.floors?.[floorKey]?.windows || []);

          floorWindows.forEach((win) => {
            const wXPx = startX + win.x * scale;
            const wWPx = win.width * scale;
            if (win.x >= room.x && win.x + win.width <= room.x + room.width + 0.1) {
              // Draw window on facade
              const wSillHPx = 3 * scale; // Sill height standard 3ft
              const wHPx = 4.5 * scale; // Standard height 4.5ft
              const wTopY = currentFloorBottomY - wSillHPx - wHPx;

              // Window casing
              ctx.fillStyle = isDark ? '#0f172a' : '#1e293b';
              ctx.fillRect(wXPx - 3, wTopY - 3, wWPx + 6, wHPx + 6);

              // Window Glass (reflective sky blue or golden interior glow)
              if (lightingMode === 'night') {
                const winGrad = ctx.createLinearGradient(wXPx, wTopY, wXPx, wTopY + wHPx);
                winGrad.addColorStop(0, '#fef08a'); // Warm glow
                winGrad.addColorStop(1, '#ca8a04');
                ctx.fillStyle = winGrad;
              } else {
                const winGrad = ctx.createLinearGradient(wXPx, wTopY, wXPx, wTopY + wHPx);
                winGrad.addColorStop(0, '#bae6fd'); // Sky reflective
                winGrad.addColorStop(1, '#38bdf8');
                ctx.fillStyle = winGrad;
              }
              ctx.fillRect(wXPx, wTopY, wWPx, wHPx);

              // Grid mullions (2 horizontal, 2 vertical)
              ctx.strokeStyle = isDark ? '#1e293b' : '#ffffff';
              ctx.lineWidth = 1;
              ctx.strokeRect(wXPx, wTopY, wWPx, wHPx);

              // Horizontal divider
              ctx.beginPath();
              ctx.moveTo(wXPx, wTopY + wHPx / 2);
              ctx.lineTo(wXPx + wWPx, wTopY + wHPx / 2);
              ctx.stroke();

              // Vertical divider
              ctx.beginPath();
              ctx.moveTo(wXPx + wWPx / 2, wTopY);
              ctx.lineTo(wXPx + wWPx / 2, wTopY + wHPx);
              ctx.stroke();
            }
          });
        });

        // Draw structural floor slabs & balconies
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(startX, currentFloorBottomY - 3, buildingWidthPx, 6);

        // Balcony Glass Railing for First Floor / Second Floor
        if (fIdx > 0) {
          const railH = 3.5 * scale;
          ctx.save();
          // Glass color
          ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
          ctx.fillRect(startX, currentFloorBottomY, buildingWidthPx, railH);
          // Steel borders
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(startX, currentFloorBottomY, buildingWidthPx, railH);
          // Handrail bar on top
          ctx.fillStyle = '#64748b';
          ctx.fillRect(startX - 2, currentFloorBottomY - 4, buildingWidthPx + 4, 4);
          ctx.restore();
        }

        // Draw structural pillar outline or boundaries
        ctx.strokeStyle = isDark ? '#475569' : '#cbd5e1';
        ctx.lineWidth = 2;
        ctx.strokeRect(startX, currentFloorTopY, buildingWidthPx, floorHeightPx);
      });

      // 5. DRAW ROOF TOP PARAPET WALL
      const topFloorY = numFloors * floorHeightPx;
      const roofY = groundY - topFloorY;
      const parapetH = 3.5 * scale;

      // Draw Roof Slab
      ctx.fillStyle = isDark ? '#334155' : '#e2e8f0';
      ctx.fillRect(startX - 6, roofY - 4, buildingWidthPx + 12, 6);
      ctx.strokeStyle = isDark ? '#1e293b' : '#cbd5e1';
      ctx.strokeRect(startX - 6, roofY - 4, buildingWidthPx + 12, 6);

      // Draw Parapet Wall (Decorative Modern Slots)
      ctx.fillStyle = isDark ? '#1e293b' : '#f8fafc';
      ctx.fillRect(startX, roofY - parapetH, buildingWidthPx, parapetH);
      ctx.strokeStyle = isDark ? '#475569' : '#cbd5e1';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(startX, roofY - parapetH, buildingWidthPx, parapetH);

      // Parapet decorative glass inserts or vertical slats
      ctx.fillStyle = isDark ? '#0f172a' : '#475569';
      for (let slatX = startX + 20; slatX < startX + buildingWidthPx - 20; slatX += 45) {
        ctx.fillRect(slatX, roofY - parapetH + 4, 15, parapetH - 8);
      }

      // Check if there is a Staircase tower extending to roof
      const groundRooms = layout.floors?.ground?.rooms || layout.rooms;
      const stairRoom = groundRooms.find((r) => r.type === 'staircase');
      if (stairRoom) {
        // Draw elegant staircase tower popping up above roof level!
        const stairXPx = startX + stairRoom.x * scale;
        const stairWPx = stairRoom.width * scale;
        const towerHPx = 11 * scale; // stair tower roof goes ~11ft above building roof slab
        const towerTopY = roofY - towerHPx;

        // Draw tower masonry base
        ctx.fillStyle = isDark ? '#334155' : '#e2e8f0';
        ctx.fillRect(stairXPx, towerTopY, stairWPx, towerHPx);

        // Cladding accent for architectural height (Vertical wood or dark slate paneling!)
        ctx.fillStyle = isDark ? '#0f172a' : '#1e293b';
        ctx.fillRect(stairXPx + 6, towerTopY + 10, stairWPx - 12, towerHPx - 10);
        
        // Stair tall frosted glass vertical window
        ctx.fillStyle = '#bae6fd';
        ctx.fillRect(stairXPx + stairWPx/2 - 4, towerTopY + 20, 8, towerHPx - 45);
        ctx.strokeStyle = '#ffffff';
        ctx.strokeRect(stairXPx + stairWPx/2 - 4, towerTopY + 20, 8, towerHPx - 45);

        // Tower Roof Slab
        ctx.fillStyle = isDark ? '#1e293b' : '#94a3b8';
        ctx.fillRect(stairXPx - 4, towerTopY - 4, stairWPx + 8, 4);

        // Standard borders
        ctx.strokeStyle = isDark ? '#475569' : '#cbd5e1';
        ctx.lineWidth = 2;
        ctx.strokeRect(stairXPx, towerTopY, stairWPx, towerHPx);
      }

      // 6. DRAW A MODERN CAR IN THE FRONT YARD/GARAGE AREA
      const garageRoom = groundRooms.find((r) => r.type === 'garage');
      if (garageRoom) {
        // Draw a beautiful sedan silhouette parked near the garage horizontal position!
        const carXPx = startX + garageRoom.x * scale + (garageRoom.width * scale - 70) / 2;
        const carY = groundY;
        
        ctx.save();
        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.ellipse(carXPx + 35, carY - 2, 35, 4, 0, 0, 2 * Math.PI);
        ctx.fill();

        // Car main cabin (sporty curves)
        ctx.fillStyle = '#b91c1c'; // brilliant sporty red
        ctx.beginPath();
        ctx.moveTo(carXPx + 4, carY - 8);
        ctx.lineTo(carXPx + 8, carY - 14);
        ctx.quadraticCurveTo(carXPx + 18, carY - 24, carXPx + 35, carY - 24); // roof curve
        ctx.quadraticCurveTo(carXPx + 52, carY - 24, carXPx + 62, carY - 14);
        ctx.lineTo(carXPx + 66, carY - 8);
        ctx.closePath();
        ctx.fill();

        // Car main body lower half
        ctx.fillStyle = '#dc2626'; // lighter red
        ctx.beginPath();
        const rx = carXPx;
        const ry = carY - 12;
        const rw = 70;
        const rh = 8;
        const radius = 4;
        ctx.moveTo(rx + radius, ry);
        ctx.lineTo(rx + rw - radius, ry);
        ctx.quadraticCurveTo(rx + rw, ry, rx + rw, ry + radius);
        ctx.lineTo(rx + rw, ry + rh - radius);
        ctx.quadraticCurveTo(rx + rw, ry + rh, rx + rw - radius, ry + rh);
        ctx.lineTo(rx + radius, ry + rh);
        ctx.quadraticCurveTo(rx, ry + rh, rx, ry + rh - radius);
        ctx.lineTo(rx, ry + radius);
        ctx.quadraticCurveTo(rx, ry, rx + radius, ry);
        ctx.closePath();
        ctx.fill();

        // Wheel wells
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(carXPx + 15, carY - 4, 7, 0, Math.PI, true);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(carXPx + 55, carY - 4, 7, 0, Math.PI, true);
        ctx.fill();

        // Wheels
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(carXPx + 15, carY - 4, 5.5, 0, 2 * Math.PI);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(carXPx + 55, carY - 4, 5.5, 0, 2 * Math.PI);
        ctx.fill();

        // Shiny hubcaps
        ctx.fillStyle = '#e2e8f0';
        ctx.beginPath();
        ctx.arc(carXPx + 15, carY - 4, 2, 0, 2 * Math.PI);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(carXPx + 55, carY - 4, 2, 0, 2 * Math.PI);
        ctx.fill();

        // Headlights
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(carXPx + 67, carY - 10, 3, 2);

        ctx.restore();
      }

      // 7. DRAW PROFESSIONAL ARCHITECTURAL LEVEL MARKERS & DIMENSIONS
      ctx.save();
      ctx.font = 'bold 9px "JetBrains Mono", monospace';
      ctx.fillStyle = textThemeColor;
      ctx.textAlign = 'left';

      const drawLevelMarker = (label: string, levelVal: string, levelY: number) => {
        // Draw dotted horizontal reference line across the entire plot
        ctx.strokeStyle = dimLineColor;
        ctx.setLineDash([3, 4]);
        ctx.beginPath();
        ctx.moveTo(startX - 20, levelY);
        ctx.lineTo(startX + buildingWidthPx + 20, levelY);
        ctx.stroke();
        ctx.setLineDash([]); // clear dash

        // Draw professional level bubble symbol (black & white opposite quadrants)
        const indicatorX = startX - 65;
        ctx.strokeStyle = textThemeColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(indicatorX, levelY);
        ctx.lineTo(indicatorX + 25, levelY);
        ctx.stroke();

        const bubbleX = indicatorX + 29;
        ctx.beginPath();
        ctx.arc(bubbleX, levelY, 4, 0, 2 * Math.PI);
        ctx.stroke();

        ctx.fillStyle = textThemeColor;
        ctx.beginPath();
        ctx.moveTo(bubbleX, levelY);
        ctx.arc(bubbleX, levelY, 4, Math.PI, 1.5 * Math.PI);
        ctx.lineTo(bubbleX, levelY);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(bubbleX, levelY);
        ctx.arc(bubbleX, levelY, 4, 0, 0.5 * Math.PI);
        ctx.lineTo(bubbleX, levelY);
        ctx.fill();

        // Labels
        ctx.fillText(label, indicatorX, levelY - 7);
        ctx.fillStyle = '#3b82f6'; // beautiful blue level numbers
        ctx.fillText(levelVal, indicatorX, levelY + 12);
        ctx.fillStyle = textThemeColor;
      };

      // Draw different levels based on total floors
      drawLevelMarker('ROAD/GROUND LEVEL', '±0.00 ' + unit, groundY);
      drawLevelMarker('PLINTH LEVEL (GF)', '+1.50 ' + unit, groundY - 1.5 * scale);
      
      floorsAvailable.forEach((f, idx) => {
        const floorH = (idx + 1) * 10 + 1.5;
        const levelLabel = idx === 0 ? 'FIRST FLOOR (FF)' : idx === 1 ? 'SECOND FLOOR (SF)' : 'THIRD FLOOR';
        drawLevelMarker(levelLabel, `+${floorH.toFixed(2)} ${unit}`, groundY - floorH * scale);
      });

      // Highest top-most roof line
      const totalBuildingH = numFloors * 10 + 1.5 + 3.5; // floors + plinth + parapet
      drawLevelMarker('ROOF PARAPET LEVEL', `+${totalBuildingH.toFixed(2)} ${unit}`, groundY - totalBuildingH * scale);

      // Draw professional graphic scale bar at bottom right
      const barX = startX + buildingWidthPx - 100;
      const barY = groundY + 45;
      ctx.fillStyle = textThemeColor;
      ctx.font = 'bold 8px "JetBrains Mono", monospace';
      ctx.fillText('GRAPHIC SCALE', barX, barY - 6);

      // Alternating segments
      const segW = 20; // 20px per segment
      ctx.strokeStyle = textThemeColor;
      ctx.lineWidth = 1;
      ctx.strokeRect(barX, barY, segW * 4, 4);

      ctx.fillStyle = textThemeColor;
      ctx.fillRect(barX, barY, segW, 4);
      ctx.fillRect(barX + segW * 2, barY, segW, 4);

      ctx.fillStyle = textThemeColor;
      ctx.fillText('0', barX, barY + 12);
      ctx.fillText((5 * scale / 5).toFixed(0), barX + segW, barY + 12);
      const scaleFeetLabel = (4 * segW / scale).toFixed(0);
      ctx.fillText(`${scaleFeetLabel} ${unit}`, barX + segW * 4, barY + 12);

      // Plot Dimension Label at very bottom
      ctx.font = '800 11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = textThemeColor;
      ctx.fillText(`FRONT FACADE ELEVATION VIEW — PLOT WIDTH: ${plotWidth} ${unit}`, width / 2, height - 30);
      ctx.font = 'medium 9px Inter, sans-serif';
      ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
      ctx.fillText('Perfect horizontal scale & structural levels based on municipal bye-laws.', width / 2, height - 15);

      ctx.restore();
    };

    if (projectionType === 'elevation') {
      drawFrontElevation(ctx, width, height);
      return;
    }

    // Draw background grid lines (ambient 3D feel)
    let bgColor = document.documentElement.classList.contains('dark') ? '#020617' : '#f8fafc';
    if (lightingMode === 'sunset') {
      bgColor = document.documentElement.classList.contains('dark') ? '#1e1b4b' : '#ffedd5';
    } else if (lightingMode === 'night') {
      bgColor = '#030712';
    }
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);

    const cx = width / 2;
    const cy = height / 2;

    const radYaw = (yaw * Math.PI) / 180;
    const radPitch = (pitch * Math.PI) / 180;

    // Coordinate translation helper for nested furniture objects (supports local offset and rotation)
    const projectFurniturePt = (
      rx: number,
      ry: number,
      itemX: number,
      itemY: number,
      localX: number,
      localY: number,
      localZ: number,
      itemW: number,
      itemL: number,
      itemRotation: number
    ) => {
      const cxLocal = itemW / 2;
      const cyLocal = itemL / 2;
      const dx = localX - cxLocal;
      const dy = localY - cyLocal;
      
      const radRot = (itemRotation * Math.PI) / 180;
      const cosR = Math.cos(radRot);
      const sinR = Math.sin(radRot);
      
      const rotatedX = cxLocal + (dx * cosR - dy * sinR);
      const rotatedY = cyLocal + (dx * sinR + dy * cosR);
      
      const worldX = rx + itemX + rotatedX;
      const worldY = ry + itemY + rotatedY;
      
      return project(worldX, worldY, localZ, cx, cy, radYaw, radPitch);
    };

    // Wall Height constraint
    const wallHeight = 2.2; // 3D wall height scale

    // Collect all render primitives (Painter's sorting items)
    interface DrawPrimitive {
      depth: number;
      draw: () => void;
    }

    const primitives: DrawPrimitive[] = [];

    // 1. ADD FLOOR Slabs
    layout.rooms.forEach((room) => {
      const rx = room.x;
      const ry = room.y;
      const rw = room.width;
      const rh = room.height;

      // Color selection based on room type
      const isDark = document.documentElement.classList.contains('dark');
      let floorColor = isDark ? '#1e293b' : '#f8fafc';
      let borderStroke = isDark ? '#334155' : '#e2e8f0';

      if (room.type === 'lawn') {
        // Soft lush golf-turf green
        floorColor = isDark ? '#143c22' : '#f0fdf4'; 
        borderStroke = isDark ? '#1e5e34' : '#bbf7d0';
      } else if (room.type === 'garage') {
        // Slate modern cobblestone pavement
        floorColor = isDark ? '#2e3542' : '#f1f5f9'; 
        borderStroke = isDark ? '#475569' : '#cbd5e1';
      } else if (room.type === 'kitchen') {
        // Warm sand/limestone ceramic tile
        floorColor = isDark ? '#3d3823' : '#fefbeb'; 
        borderStroke = isDark ? '#5c522b' : '#fef3c7';
      } else if (room.type === 'bathroom') {
        // Modern pastel cyan marine tile
        floorColor = isDark ? '#1a365d' : '#f0f9ff'; 
        borderStroke = isDark ? '#2a5b94' : '#e0f2fe';
      } else if (room.type === 'staircase') {
        // Chic light marble lavender-grey
        floorColor = isDark ? '#2b1b42' : '#faf5ff'; 
        borderStroke = isDark ? '#462a70' : '#f3e8ff';
      } else if (room.type === 'bedroom' || room.type === 'living' || room.type === 'drawing') {
        // Premium Scandinavian warm travertine plaster / warm white oak
        floorColor = isDark ? '#24252e' : '#fafaf9'; 
        borderStroke = isDark ? '#3b3c4a' : '#f4f4f5';
      }

      // Check if there is a custom material applied
      const selectedMat = room.floorMaterial ? FLOOR_MATERIALS.find(m => m.id === room.floorMaterial) : null;
      if (selectedMat) {
        floorColor = selectedMat.color;
        borderStroke = selectedMat.secondaryColor || selectedMat.color;
      }

      // Project the 4 floor corners
      const c1 = project(rx, ry, 0, cx, cy, radYaw, radPitch);
      const c2 = project(rx + rw, ry, 0, cx, cy, radYaw, radPitch);
      const c3 = project(rx + rw, ry + rh, 0, cx, cy, radYaw, radPitch);
      const c4 = project(rx, ry + rh, 0, cx, cy, radYaw, radPitch);

      if (c1.behind || c2.behind || c3.behind || c4.behind) return;

      // Average depth for floor
      const avgFloorDepth = (c1.depth + c2.depth + c3.depth + c4.depth) / 4;

      primitives.push({
        depth: avgFloorDepth + 100, // Floors go first (deepest)
        draw: () => {
          ctx.beginPath();
          ctx.moveTo(c1.x, c1.y);
          ctx.lineTo(c2.x, c2.y);
          ctx.lineTo(c3.x, c3.y);
          ctx.lineTo(c4.x, c4.y);
          ctx.closePath();

          ctx.fillStyle = floorColor;
          ctx.fill();

          ctx.strokeStyle = borderStroke;
          ctx.lineWidth = 1;
          ctx.stroke();

          // Sub-tile gridlines for lawn/garage if no custom material is set
          if (room.type === 'lawn' && !selectedMat) {
            ctx.fillStyle = 'rgba(22, 163, 74, 0.08)';
            ctx.fill();
          }

          // If custom pattern is active
          if (selectedMat && selectedMat.pattern !== 'plain') {
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(c1.x, c1.y);
            ctx.lineTo(c2.x, c2.y);
            ctx.lineTo(c3.x, c3.y);
            ctx.lineTo(c4.x, c4.y);
            ctx.closePath();
            ctx.clip(); // Restrict pattern drawing to this room floor

            if (selectedMat.pattern === 'wood') {
              // Draw parallel wood planks along width
              ctx.strokeStyle = selectedMat.secondaryColor || 'rgba(0,0,0,0.15)';
              ctx.lineWidth = 1 * zoom3d;
              for (let offset = 0.5; offset < rw; offset += 0.8) {
                const pStart = project(rx + offset, ry, 0, cx, cy, radYaw, radPitch);
                const pEnd = project(rx + offset, ry + rh, 0, cx, cy, radYaw, radPitch);
                ctx.beginPath();
                ctx.moveTo(pStart.x, pStart.y);
                ctx.lineTo(pEnd.x, pEnd.y);
                ctx.stroke();
              }
            } else if (selectedMat.pattern === 'tile') {
              // Draw tile grid lines
              ctx.strokeStyle = selectedMat.secondaryColor || 'rgba(0,0,0,0.15)';
              ctx.lineWidth = 0.6 * zoom3d;
              // X grid lines
              for (let offset = 1; offset < rw; offset += 1) {
                const pStart = project(rx + offset, ry, 0, cx, cy, radYaw, radPitch);
                const pEnd = project(rx + offset, ry + rh, 0, cx, cy, radYaw, radPitch);
                ctx.beginPath();
                ctx.moveTo(pStart.x, pStart.y);
                ctx.lineTo(pEnd.x, pEnd.y);
                ctx.stroke();
              }
              // Y grid lines
              for (let offset = 1; offset < rh; offset += 1) {
                const pStart = project(rx, ry + offset, 0, cx, cy, radYaw, radPitch);
                const pEnd = project(rx + rw, ry + offset, 0, cx, cy, radYaw, radPitch);
                ctx.beginPath();
                ctx.moveTo(pStart.x, pStart.y);
                ctx.lineTo(pEnd.x, pEnd.y);
                ctx.stroke();
              }
            } else if (selectedMat.pattern === 'marble') {
              // Draw elegant marble veins (using deterministic seeded lines based on room.id)
              ctx.strokeStyle = selectedMat.secondaryColor || 'rgba(0,0,0,0.1)';
              ctx.lineWidth = 0.8 * zoom3d;
              ctx.globalAlpha = 0.25;
              
              let seed = 0;
              for (let i = 0; i < room.id.length; i++) {
                seed += room.id.charCodeAt(i);
              }
              const pseudoRandom = () => {
                const x = Math.sin(seed++) * 10000;
                return x - Math.floor(x);
              };

              for (let v = 0; v < 4; v++) {
                const vx1 = rx + pseudoRandom() * rw;
                const vy1 = ry + pseudoRandom() * rh;
                const vx2 = rx + pseudoRandom() * rw;
                const vy2 = ry + pseudoRandom() * rh;
                const cp1x = rx + pseudoRandom() * rw;
                const cp1y = ry + pseudoRandom() * rh;
                
                const start = project(vx1, vy1, 0, cx, cy, radYaw, radPitch);
                const end = project(vx2, vy2, 0, cx, cy, radYaw, radPitch);
                const cp = project(cp1x, cp1y, 0, cx, cy, radYaw, radPitch);
                
                ctx.beginPath();
                ctx.moveTo(start.x, start.y);
                ctx.quadraticCurveTo(cp.x, cp.y, end.x, end.y);
                ctx.stroke();
              }
            }
            ctx.restore();
          }

          // Draw neon glowing highlight if selected
          if (room.id === selectedRoomId) {
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(c1.x, c1.y);
            ctx.lineTo(c2.x, c2.y);
            ctx.lineTo(c3.x, c3.y);
            ctx.lineTo(c4.x, c4.y);
            ctx.closePath();
            ctx.strokeStyle = '#3b82f6'; // vibrant blue
            ctx.lineWidth = 3.5 * zoom3d;
            ctx.stroke();
            ctx.fillStyle = 'rgba(59, 130, 246, 0.08)'; // elegant glowing overlay tint
            ctx.fill();
            ctx.restore();
          }
        },
      });

      // 2. INTERIOR DESIGNS (FURNITURE) per room
      const rxCenter = rx + rw / 2;
      const ryCenter = ry + rh / 2;

      if (showFurniture && layout.autoFurnished && room.furniture && room.furniture.length > 0) {
        room.furniture.forEach((item) => {
          const depth1 = projectFurniturePt(rx, ry, item.x, item.y, 0, 0, 0, item.width, item.length, item.rotation).depth;
          const depth2 = projectFurniturePt(rx, ry, item.x, item.y, item.width, item.length, item.height, item.width, item.length, item.rotation).depth;

          primitives.push({
            depth: (depth1 + depth2) / 2 + (item.type === 'rug' ? 0.15 : 0),
            draw: () => drawFurnitureItem(ctx, item, rx, ry, projectFurniturePt, zoom3d),
          });
        });
      }
      return;

      if (room.type === 'bedroom') {
        // Draw 3D Double Bed, headboard, nightstands, pillows, blankets, and Almirah with mirror
        const bedW = Math.min(6, rw * 0.7);
        const bedL = Math.min(6.5, rh * 0.7);
        const bx = rx + 0.5;
        const by = ry + 0.5;

        const b1 = project(bx, by, 0, cx, cy, radYaw, radPitch);
        const b2 = project(bx + bedW, by, 0, cx, cy, radYaw, radPitch);
        const b3 = project(bx + bedW, by + bedL, 0, cx, cy, radYaw, radPitch);
        const b4 = project(bx, by + bedL, 0, cx, cy, radYaw, radPitch);

        const bTop1 = project(bx, by, 0.8, cx, cy, radYaw, radPitch);
        const bTop2 = project(bx + bedW, by, 0.8, cx, cy, radYaw, radPitch);
        const bTop3 = project(bx + bedW, by + bedL, 0.8, cx, cy, radYaw, radPitch);
        const bTop4 = project(bx, by + bedL, 0.8, cx, cy, radYaw, radPitch);

        // Bed center depth
        const bedDepth = (b1.depth + b3.depth) / 2;

        primitives.push({
          depth: bedDepth,
          draw: () => {
            // Draw wooden headboard (z goes from 0 to 1.4)
            const h1 = project(bx, by, 0, cx, cy, radYaw, radPitch);
            const h2 = project(bx + bedW, by, 0, cx, cy, radYaw, radPitch);
            const hTop1 = project(bx, by, 1.4, cx, cy, radYaw, radPitch);
            const hTop2 = project(bx + bedW, by, 1.4, cx, cy, radYaw, radPitch);

            ctx.beginPath();
            ctx.moveTo(h1.x, h1.y);
            ctx.lineTo(h2.x, h2.y);
            ctx.lineTo(hTop2.x, hTop2.y);
            ctx.lineTo(hTop1.x, hTop1.y);
            ctx.closePath();
            ctx.fillStyle = '#451a03'; // dark mahogany wood headboard
            ctx.fill();
            ctx.strokeStyle = '#1e0c02';
            ctx.lineWidth = 1;
            ctx.stroke();

            // Draw wooden bed base
            ctx.beginPath();
            ctx.moveTo(b1.x, b1.y);
            ctx.lineTo(b2.x, b2.y);
            ctx.lineTo(b3.x, b3.y);
            ctx.lineTo(b4.x, b4.y);
            ctx.closePath();
            ctx.fillStyle = '#78350f'; // mahogany wood
            ctx.fill();

            // Draw mattress
            ctx.beginPath();
            ctx.moveTo(bTop1.x, bTop1.y);
            ctx.lineTo(bTop2.x, bTop2.y);
            ctx.lineTo(bTop3.x, bTop3.y);
            ctx.lineTo(bTop4.x, bTop4.y);
            ctx.closePath();
            ctx.fillStyle = '#f8fafc'; // clean sheets
            ctx.fill();
            ctx.strokeStyle = '#cbd5e1';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Draw Pillow 1
            const p1_c1 = project(bx + 0.5, by + 0.5, 0.8, cx, cy, radYaw, radPitch);
            const p1_c2 = project(bx + bedW / 2 - 0.3, by + 0.5, 0.8, cx, cy, radYaw, radPitch);
            const p1_c3 = project(bx + bedW / 2 - 0.3, by + 1.8, 0.8, cx, cy, radYaw, radPitch);
            const p1_c4 = project(bx + 0.5, by + 1.8, 0.8, cx, cy, radYaw, radPitch);

            ctx.beginPath();
            ctx.moveTo(p1_c1.x, p1_c1.y);
            ctx.lineTo(p1_c2.x, p1_c2.y);
            ctx.lineTo(p1_c3.x, p1_c3.y);
            ctx.lineTo(p1_c4.x, p1_c4.y);
            ctx.closePath();
            ctx.fillStyle = '#f1f5f9';
            ctx.fill();
            ctx.strokeStyle = '#cbd5e1';
            ctx.stroke();

            // Draw Pillow 2
            const p2_c1 = project(bx + bedW / 2 + 0.3, by + 0.5, 0.8, cx, cy, radYaw, radPitch);
            const p2_c2 = project(bx + bedW - 0.5, by + 0.5, 0.8, cx, cy, radYaw, radPitch);
            const p2_c3 = project(bx + bedW - 0.5, by + 1.8, 0.8, cx, cy, radYaw, radPitch);
            const p2_c4 = project(bx + bedW / 2 + 0.3, by + 1.8, 0.8, cx, cy, radYaw, radPitch);

            ctx.beginPath();
            ctx.moveTo(p2_c1.x, p2_c1.y);
            ctx.lineTo(p2_c2.x, p2_c2.y);
            ctx.lineTo(p2_c3.x, p2_c3.y);
            ctx.lineTo(p2_c4.x, p2_c4.y);
            ctx.closePath();
            ctx.fillStyle = '#f1f5f9';
            ctx.fill();
            ctx.strokeStyle = '#cbd5e1';
            ctx.stroke();

            // Draw blanket quilt fold
            const q1 = project(bx, by + 2.5, 0.82, cx, cy, radYaw, radPitch);
            const q2 = project(bx + bedW, by + 2.5, 0.82, cx, cy, radYaw, radPitch);
            const q3 = project(bx + bedW, by + bedL, 0.82, cx, cy, radYaw, radPitch);
            const q4 = project(bx, by + bedL, 0.82, cx, cy, radYaw, radPitch);

            ctx.beginPath();
            ctx.moveTo(q1.x, q1.y);
            ctx.lineTo(q2.x, q2.y);
            ctx.lineTo(q3.x, q3.y);
            ctx.lineTo(q4.x, q4.y);
            ctx.closePath();
            ctx.fillStyle = '#4f46e5'; // Indigo elegant blanket
            ctx.fill();
            ctx.strokeStyle = '#312e81';
            ctx.stroke();

            // Blanket Accent Stripes (adds beautiful vector illustration quality)
            const stripe1_a = project(bx, by + 3.2, 0.83, cx, cy, radYaw, radPitch);
            const stripe1_b = project(bx + bedW, by + 3.2, 0.83, cx, cy, radYaw, radPitch);
            ctx.beginPath();
            ctx.moveTo(stripe1_a.x, stripe1_a.y);
            ctx.lineTo(stripe1_b.x, stripe1_b.y);
            ctx.strokeStyle = '#38bdf8'; // light blue stripe accent
            ctx.lineWidth = 3;
            ctx.stroke();

            const stripe2_a = project(bx, by + 3.5, 0.83, cx, cy, radYaw, radPitch);
            const stripe2_b = project(bx + bedW, by + 3.5, 0.83, cx, cy, radYaw, radPitch);
            ctx.beginPath();
            ctx.moveTo(stripe2_a.x, stripe2_a.y);
            ctx.lineTo(stripe2_b.x, stripe2_b.y);
            ctx.strokeStyle = '#fbbf24'; // yellow stripe accent
            ctx.lineWidth = 2;
            ctx.stroke();

            // Bedside Nightstands with table lamps (Left Side)
            const ns1_b1 = project(bx - 0.7, by, 0, cx, cy, radYaw, radPitch);
            ctx.beginPath();
            ctx.rect(ns1_b1.x - 3, ns1_b1.y - 12, 12, 12);
            ctx.fillStyle = '#1e1b4b'; // dark blue stand
            ctx.fill();

            const lamp1_pos = project(bx - 0.4, by + 0.3, 0.9, cx, cy, radYaw, radPitch);
            ctx.beginPath();
            ctx.arc(lamp1_pos.x, lamp1_pos.y, 4 * zoom3d, 0, 2 * Math.PI);
            ctx.fillStyle = '#fef08a'; // yellow glowing bulb
            ctx.fill();
            ctx.strokeStyle = '#eab308';
            ctx.stroke();

            // Right Side Table Lamp
            const ns2_b1 = project(bx + bedW + 0.1, by, 0, cx, cy, radYaw, radPitch);
            ctx.beginPath();
            ctx.rect(ns2_b1.x - 3, ns2_b1.y - 12, 12, 12);
            ctx.fillStyle = '#1e1b4b';
            ctx.fill();

            const lamp2_pos = project(bx + bedW + 0.4, by + 0.3, 0.9, cx, cy, radYaw, radPitch);
            ctx.beginPath();
            ctx.arc(lamp2_pos.x, lamp2_pos.y, 4 * zoom3d, 0, 2 * Math.PI);
            ctx.fillStyle = '#fef08a'; // glowing bulb
            ctx.fill();
            ctx.strokeStyle = '#eab308';
            ctx.stroke();
          },
        });

        // ALMIRAH (WARDROBE): Built-in tall cupboard with wood, mirror, handles, and drawer lines
        const almW = Math.min(5, rw * 0.6);
        const almL = 1.6; // depth
        const ax = rx + rw - almW - 0.5;
        const ay = ry + rh - almL - 0.5;

        const a1 = project(ax, ay, 0, cx, cy, radYaw, radPitch);
        const a3 = project(ax + almW, ay + almL, 1.8, cx, cy, radYaw, radPitch); // high box corner

        primitives.push({
          depth: (a1.depth + a3.depth) / 2,
          draw: () => {
            const corners = [
              project(ax, ay, 0, cx, cy, radYaw, radPitch),
              project(ax + almW, ay, 0, cx, cy, radYaw, radPitch),
              project(ax + almW, ay + almL, 0, cx, cy, radYaw, radPitch),
              project(ax, ay + almL, 0, cx, cy, radYaw, radPitch),
              project(ax, ay, 1.8, cx, cy, radYaw, radPitch),
              project(ax + almW, ay, 1.8, cx, cy, radYaw, radPitch),
              project(ax + almW, ay + almL, 1.8, cx, cy, radYaw, radPitch),
              project(ax, ay + almL, 1.8, cx, cy, radYaw, radPitch),
            ];

            // Almirah box top
            ctx.beginPath();
            ctx.moveTo(corners[4].x, corners[4].y);
            ctx.lineTo(corners[5].x, corners[5].y);
            ctx.lineTo(corners[6].x, corners[6].y);
            ctx.lineTo(corners[7].x, corners[7].y);
            ctx.closePath();
            ctx.fillStyle = '#451a03'; // mahogany wood frame
            ctx.fill();
            ctx.stroke();

            // Front cabinet doors base
            ctx.beginPath();
            ctx.moveTo(corners[3].x, corners[3].y);
            ctx.lineTo(corners[2].x, corners[2].y);
            ctx.lineTo(corners[6].x, corners[6].y);
            ctx.lineTo(corners[7].x, corners[7].y);
            ctx.closePath();
            ctx.fillStyle = '#78350f'; // mahogany doors
            ctx.fill();
            ctx.strokeStyle = '#1e0c02';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Front Door panels splitting line
            const midB_x = (corners[3].x + corners[2].x) / 2;
            const midB_y = (corners[3].y + corners[2].y) / 2;
            const midT_x = (corners[7].x + corners[6].x) / 2;
            const midT_y = (corners[7].y + corners[6].y) / 2;

            ctx.beginPath();
            ctx.moveTo(midB_x, midB_y);
            ctx.lineTo(midT_x, midT_y);
            ctx.strokeStyle = '#1e0c02';
            ctx.stroke();

            // Left panel Mirror (high fidelity glass reflection effect!)
            const m1 = project(ax + 0.4, ay + almL + 0.02, 0.4, cx, cy, radYaw, radPitch);
            const m2 = project(ax + almW / 2 - 0.2, ay + almL + 0.02, 0.4, cx, cy, radYaw, radPitch);
            const m3 = project(ax + almW / 2 - 0.2, ay + almL + 0.02, 1.5, cx, cy, radYaw, radPitch);
            const m4 = project(ax + 0.4, ay + almL + 0.02, 1.5, cx, cy, radYaw, radPitch);

            ctx.beginPath();
            ctx.moveTo(m1.x, m1.y);
            ctx.lineTo(m2.x, m2.y);
            ctx.lineTo(m3.x, m3.y);
            ctx.lineTo(m4.x, m4.y);
            ctx.closePath();
            ctx.fillStyle = '#bae6fd'; // shiny sky reflection
            ctx.fill();
            ctx.strokeStyle = '#0284c7';
            ctx.stroke();

            // Mirror shine lines (diagonal elegant white lines)
            ctx.beginPath();
            ctx.moveTo(m1.x + 5, m1.y - 10);
            ctx.lineTo(m3.x - 5, m3.y + 10);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Cabinet handles (polished silver long rods)
            const hdl1_t = project(ax + almW / 2 - 0.1, ay + almL + 0.05, 1.1, cx, cy, radYaw, radPitch);
            const hdl1_b = project(ax + almW / 2 - 0.1, ay + almL + 0.05, 0.7, cx, cy, radYaw, radPitch);
            const hdl2_t = project(ax + almW / 2 + 0.1, ay + almL + 0.05, 1.1, cx, cy, radYaw, radPitch);
            const hdl2_b = project(ax + almW / 2 + 0.1, ay + almL + 0.05, 0.7, cx, cy, radYaw, radPitch);

            ctx.beginPath();
            ctx.moveTo(hdl1_t.x, hdl1_t.y);
            ctx.lineTo(hdl1_b.x, hdl1_b.y);
            ctx.moveTo(hdl2_t.x, hdl2_t.y);
            ctx.lineTo(hdl2_b.x, hdl2_b.y);
            ctx.strokeStyle = '#cbd5e1'; // polished steel grey
            ctx.lineWidth = 3.5;
            ctx.stroke();

            // Bottom drawer lines
            const drw_z = project(ax, ay + almL, 0.3, cx, cy, radYaw, radPitch);
            const drw_z_end = project(ax + almW, ay + almL, 0.3, cx, cy, radYaw, radPitch);
            ctx.beginPath();
            ctx.moveTo(drw_z.x, drw_z.y);
            ctx.lineTo(drw_z_end.x, drw_z_end.y);
            ctx.strokeStyle = '#1e0c02';
            ctx.lineWidth = 1.5;
            ctx.stroke();
          },
        });
      } else if (room.type === 'living' || room.type === 'drawing') {
        // Sofa (Contoured emerald with pillows) + Coffee Table (Glass top with wooden legs) + Rug (Patterned) + TV on wall
        const sx = rx + 1;
        const sy = ry + 1;
        const sW = Math.min(8, rw * 0.7);
        const sL = Math.min(7, rh * 0.7);

        const sf1 = project(sx, sy, 0, cx, cy, radYaw, radPitch);
        const sf3 = project(sx + sW, sy + sL, 0.6, cx, cy, radYaw, radPitch);

        primitives.push({
          depth: (sf1.depth + sf3.depth) / 2,
          draw: () => {
            // 1. Draw Large Geometric Area Rug
            const r_1 = project(sx - 0.5, sy + 0.5, 0.01, cx, cy, radYaw, radPitch);
            const r_2 = project(sx + sW + 0.5, sy + 0.5, 0.01, cx, cy, radYaw, radPitch);
            const r_3 = project(sx + sW + 0.5, sy + sL + 0.5, 0.01, cx, cy, radYaw, radPitch);
            const r_4 = project(sx - 0.5, sy + sL + 0.5, 0.01, cx, cy, radYaw, radPitch);

            ctx.beginPath();
            ctx.moveTo(r_1.x, r_1.y);
            ctx.lineTo(r_2.x, r_2.y);
            ctx.lineTo(r_3.x, r_3.y);
            ctx.lineTo(r_4.x, r_4.y);
            ctx.closePath();
            ctx.fillStyle = '#fef3c7'; // cozy cream amber rug
            ctx.fill();
            ctx.strokeStyle = '#d97706';
            ctx.lineWidth = 1;
            ctx.stroke();

            // Rug grid pattern
            const r_m1 = project(sx - 0.5, sy + sL / 2 + 0.5, 0.02, cx, cy, radYaw, radPitch);
            const r_m2 = project(sx + sW + 0.5, sy + sL / 2 + 0.5, 0.02, cx, cy, radYaw, radPitch);
            ctx.beginPath();
            ctx.moveTo(r_m1.x, r_m1.y);
            ctx.lineTo(r_m2.x, r_m2.y);
            ctx.strokeStyle = 'rgba(217, 119, 6, 0.3)';
            ctx.stroke();

            // 2. Draw Sofa Backrest Block (Emerald Green)
            const b_t1 = project(sx, sy, 0.9, cx, cy, radYaw, radPitch);
            const b_t2 = project(sx + sW, sy, 0.9, cx, cy, radYaw, radPitch);
            const b_t3 = project(sx + sW, sy + 1.2, 0.9, cx, cy, radYaw, radPitch);
            const b_t4 = project(sx, sy + 1.2, 0.9, cx, cy, radYaw, radPitch);

            ctx.beginPath();
            ctx.moveTo(b_t1.x, b_t1.y);
            ctx.lineTo(b_t2.x, b_t2.y);
            ctx.lineTo(b_t3.x, b_t3.y);
            ctx.lineTo(b_t4.x, b_t4.y);
            ctx.closePath();
            ctx.fillStyle = '#064e3b'; // deep emerald forest green
            ctx.fill();
            ctx.strokeStyle = '#022c22';
            ctx.stroke();

            // 3. Draw Seating cushions
            const c_t1 = project(sx, sy + 1.2, 0.5, cx, cy, radYaw, radPitch);
            const c_t2 = project(sx + sW, sy + 1.2, 0.5, cx, cy, radYaw, radPitch);
            const c_t3 = project(sx + sW, sy + 3.2, 0.5, cx, cy, radYaw, radPitch);
            const c_t4 = project(sx, sy + 3.2, 0.5, cx, cy, radYaw, radPitch);

            ctx.beginPath();
            ctx.moveTo(c_t1.x, c_t1.y);
            ctx.lineTo(c_t2.x, c_t2.y);
            ctx.lineTo(c_t3.x, c_t3.y);
            ctx.lineTo(c_t4.x, c_t4.y);
            ctx.closePath();
            ctx.fillStyle = '#0f766e'; // teal-emerald cushions
            ctx.fill();
            ctx.strokeStyle = '#115e59';
            ctx.stroke();

            // Throw Pillows
            const tp1 = project(sx + 1.0, sy + 1.2, 0.7, cx, cy, radYaw, radPitch);
            ctx.beginPath();
            ctx.arc(tp1.x, tp1.y, 5 * zoom3d, 0, 2 * Math.PI);
            ctx.fillStyle = '#f97316'; // orange contrast pillow
            ctx.fill();

            const tp2 = project(sx + sW - 1.0, sy + 1.2, 0.7, cx, cy, radYaw, radPitch);
            ctx.beginPath();
            ctx.arc(tp2.x, tp2.y, 5 * zoom3d, 0, 2 * Math.PI);
            ctx.fillStyle = '#fbbf24'; // yellow contrast pillow
            ctx.fill();

            // 4. Central Coffee Table (Glass top with wooden base)
            const tx = sx + sW / 2 - 1.5;
            const ty = sy + 4.2;
            const t1 = project(tx, ty, 0.45, cx, cy, radYaw, radPitch);
            const t2 = project(tx + 3, ty, 0.45, cx, cy, radYaw, radPitch);
            const t3 = project(tx + 3, ty + 1.6, 0.45, cx, cy, radYaw, radPitch);
            const t4 = project(tx, ty + 1.6, 0.45, cx, cy, radYaw, radPitch);

            // Wooden support legs
            const leg1_b = project(tx + 0.2, ty + 0.2, 0, cx, cy, radYaw, radPitch);
            const leg1_t = project(tx + 0.2, ty + 0.2, 0.4, cx, cy, radYaw, radPitch);
            ctx.beginPath();
            ctx.moveTo(leg1_b.x, leg1_b.y);
            ctx.lineTo(leg1_t.x, leg1_t.y);
            ctx.strokeStyle = '#b45309';
            ctx.lineWidth = 3;
            ctx.stroke();

            const leg2_b = project(tx + 2.8, ty + 1.4, 0, cx, cy, radYaw, radPitch);
            const leg2_t = project(tx + 2.8, ty + 1.4, 0.4, cx, cy, radYaw, radPitch);
            ctx.beginPath();
            ctx.moveTo(leg2_b.x, leg2_b.y);
            ctx.lineTo(leg2_t.x, leg2_t.y);
            ctx.strokeStyle = '#b45309';
            ctx.lineWidth = 3;
            ctx.stroke();

            // Glass top
            ctx.beginPath();
            ctx.moveTo(t1.x, t1.y);
            ctx.lineTo(t2.x, t2.y);
            ctx.lineTo(t3.x, t3.y);
            ctx.lineTo(t4.x, t4.y);
            ctx.closePath();
            ctx.fillStyle = 'rgba(186, 230, 253, 0.5)'; // sky blue transparent glass
            ctx.fill();
            ctx.strokeStyle = '#0284c7';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // 5. Wall-mounted Flat-screen LED TV
            const tv_x = rx + 0.5;
            const tv_y = ry + 0.1; // flat on back wall
            const tv_w = Math.min(5, rw * 0.6);
            
            const tv1 = project(tv_x, tv_y, 0.8, cx, cy, radYaw, radPitch);
            const tv2 = project(tv_x + tv_w, tv_y, 0.8, cx, cy, radYaw, radPitch);
            const tvTop1 = project(tv_x, tv_y, 1.7, cx, cy, radYaw, radPitch);
            const tvTop2 = project(tv_x + tv_w, tv_y, 1.7, cx, cy, radYaw, radPitch);

            // TV Frame (Black bezel)
            ctx.beginPath();
            ctx.moveTo(tv1.x, tv1.y);
            ctx.lineTo(tv2.x, tv2.y);
            ctx.lineTo(tvTop2.x, tvTop2.y);
            ctx.lineTo(tvTop1.x, tvTop1.y);
            ctx.closePath();
            ctx.fillStyle = '#0f172a'; // charcoal tv frame
            ctx.fill();
            ctx.strokeStyle = '#334155';
            ctx.stroke();

            // TV Screen showing landscape screen
            const sc1 = project(tv_x + 0.2, tv_y, 0.9, cx, cy, radYaw, radPitch);
            const sc2 = project(tv_x + tv_w - 0.2, tv_y, 0.9, cx, cy, radYaw, radPitch);
            const scTop1 = project(tv_x + 0.2, tv_y, 1.6, cx, cy, radYaw, radPitch);
            const scTop2 = project(tv_x + tv_w - 0.2, tv_y, 1.6, cx, cy, radYaw, radPitch);

            ctx.beginPath();
            ctx.moveTo(sc1.x, sc1.y);
            ctx.lineTo(sc2.x, sc2.y);
            ctx.lineTo(scTop2.x, scTop2.y);
            ctx.lineTo(scTop1.x, scTop1.y);
            ctx.closePath();
            ctx.fillStyle = '#38bdf8'; // bright scenic blue screen sky
            ctx.fill();

            const tvSun = project(tv_x + tv_w / 2, tv_y, 1.3, cx, cy, radYaw, radPitch);
            ctx.beginPath();
            ctx.arc(tvSun.x, tvSun.y, 4 * zoom3d, 0, 2 * Math.PI);
            ctx.fillStyle = '#fef08a'; // yellow sun
            ctx.fill();
          },
        });
      } else if (room.type === 'dining') {
        // Wooden Dining Table with Cushioned Chairs
        const tx = rxCenter;
        const ty = ryCenter;
        const tW = Math.min(5, rw * 0.6);
        const tL = Math.min(3.5, rh * 0.5);

        const tabB1 = project(tx - tW / 2, ty - tL / 2, 0, cx, cy, radYaw, radPitch);
        const tabT1 = project(tx - tW / 2, ty - tL / 2, 0.75, cx, cy, radYaw, radPitch);
        const tabT3 = project(tx + tW / 2, ty + tL / 2, 0.75, cx, cy, radYaw, radPitch);

        primitives.push({
          depth: (tabB1.depth + tabT3.depth) / 2,
          draw: () => {
            // Draw Table Legs (4 wooden posts)
            const legs = [
              { x: tx - tW / 2 + 0.3, y: ty - tL / 2 + 0.3 },
              { x: tx + tW / 2 - 0.3, y: ty - tL / 2 + 0.3 },
              { x: tx + tW / 2 - 0.3, y: ty + tL / 2 - 0.3 },
              { x: tx - tW / 2 + 0.3, y: ty + tL / 2 - 0.3 },
            ];

            legs.forEach((leg) => {
              const b = project(leg.x, leg.y, 0, cx, cy, radYaw, radPitch);
              const t = project(leg.x, leg.y, 0.75, cx, cy, radYaw, radPitch);
              ctx.beginPath();
              ctx.moveTo(b.x, b.y);
              ctx.lineTo(t.x, t.y);
              ctx.strokeStyle = '#78350f'; // mahogany leg
              ctx.lineWidth = 3.5 * zoom3d;
              ctx.stroke();
            });

            // Draw Table Top (Rich thick oak wood)
            const c1 = project(tx - tW / 2, ty - tL / 2, 0.75, cx, cy, radYaw, radPitch);
            const c2 = project(tx + tW / 2, ty - tL / 2, 0.75, cx, cy, radYaw, radPitch);
            const c3 = project(tx + tW / 2, ty + tL / 2, 0.75, cx, cy, radYaw, radPitch);
            const c4 = project(tx - tW / 2, ty + tL / 2, 0.75, cx, cy, radYaw, radPitch);

            ctx.beginPath();
            ctx.moveTo(c1.x, c1.y);
            ctx.lineTo(c2.x, c2.y);
            ctx.lineTo(c3.x, c3.y);
            ctx.lineTo(c4.x, c4.y);
            ctx.closePath();
            ctx.fillStyle = '#b45309'; // warm oak wood table top
            ctx.fill();
            ctx.strokeStyle = '#78350f';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Plates on dining table
            const plate1 = project(tx - 0.8, ty, 0.76, cx, cy, radYaw, radPitch);
            ctx.beginPath();
            ctx.arc(plate1.x, plate1.y, 3 * zoom3d, 0, 2 * Math.PI);
            ctx.fillStyle = '#f8fafc'; // porcelain white plate
            ctx.fill();
            ctx.strokeStyle = '#cbd5e1';
            ctx.stroke();

            const plate2 = project(tx + 0.8, ty, 0.76, cx, cy, radYaw, radPitch);
            ctx.beginPath();
            ctx.arc(plate2.x, plate2.y, 3 * zoom3d, 0, 2 * Math.PI);
            ctx.fillStyle = '#f8fafc';
            ctx.fill();
            ctx.strokeStyle = '#cbd5e1';
            ctx.stroke();

            // Draw Tucked Chairs around table
            const chairs = [
              { x: tx - tW / 2, y: ty },
              { x: tx + tW / 2, y: ty },
            ];

            chairs.forEach((ch) => {
              const chPos = project(ch.x, ch.y, 0.45, cx, cy, radYaw, radPitch);
              ctx.beginPath();
              ctx.arc(chPos.x, chPos.y, 5 * zoom3d, 0, 2 * Math.PI);
              ctx.fillStyle = '#1e293b'; // slate chairs
              ctx.fill();
            });
          },
        });
      } else if (room.type === 'kitchen') {
        // Kitchen L-Counter with stove, sink, faucet, refrigerator with water dispenser, cabinets
        const kx = rx + 0.3;
        const ky = ry + 0.3;
        const kW = Math.min(2.5, rw * 0.4);

        const counter1 = project(kx, ky, 0.8, cx, cy, radYaw, radPitch);
        const counter2 = project(kx + rw - 0.6, ky + rh - 0.6, 0.8, cx, cy, radYaw, radPitch);

        primitives.push({
          depth: (counter1.depth + counter2.depth) / 2,
          draw: () => {
            // L-Shaped Counter Slab
            const cornerA_t = project(kx, ky, 0.9, cx, cy, radYaw, radPitch);
            const cornerB_t = project(kx + rw - 0.6, ky, 0.9, cx, cy, radYaw, radPitch);
            const cornerC_t = project(kx + rw - 0.6, ky + rh - 0.6, 0.9, cx, cy, radYaw, radPitch);

            ctx.beginPath();
            ctx.moveTo(cornerA_t.x, cornerA_t.y);
            ctx.lineTo(cornerB_t.x, cornerB_t.y);
            const extX = project(kx + rw - 0.6 - kW, ky + kW, 0.9, cx, cy, radYaw, radPitch);
            ctx.lineTo(extX.x, extX.y);
            const extY = project(kx, ky + kW, 0.9, cx, cy, radYaw, radPitch);
            ctx.lineTo(extY.x, extY.y);
            ctx.closePath();
            ctx.fillStyle = '#0f172a'; // black granite countertop
            ctx.fill();
            ctx.strokeStyle = '#475569';
            ctx.stroke();

            // Stove burner fire glowing orange
            const sx = kx + rw / 2 - 1.2;
            const sy = ky + 0.4;
            const bCenter = project(sx + 0.5, sy + 0.5, 0.91, cx, cy, radYaw, radPitch);
            ctx.beginPath();
            ctx.arc(bCenter.x, bCenter.y, 4 * zoom3d, 0, 2 * Math.PI);
            ctx.fillStyle = '#ef4444'; // burner fire orange-red
            ctx.fill();

            // Sink basin bowl in grey
            const sinkX = kx + 0.5;
            const sinkY = ky + 0.4;
            const snk1 = project(sinkX, sinkY, 0.91, cx, cy, radYaw, radPitch);
            const snk2 = project(sinkX + 1.2, sinkY + 0.8, 0.91, cx, cy, radYaw, radPitch);
            ctx.beginPath();
            ctx.rect(snk1.x, snk1.y, snk2.x - snk1.x, snk2.y - snk1.y);
            ctx.fillStyle = '#475569'; // steel sink bowl
            ctx.fill();
            ctx.strokeStyle = '#94a3b8';
            ctx.stroke();

            // Silver faucet (curved line)
            const fau_b = project(sinkX + 0.6, sinkY + 0.1, 0.91, cx, cy, radYaw, radPitch);
            const fau_t = project(sinkX + 0.6, sinkY + 0.1, 1.15, cx, cy, radYaw, radPitch);
            ctx.beginPath();
            ctx.moveTo(fau_b.x, fau_b.y);
            ctx.lineTo(fau_t.x, fau_t.y);
            ctx.strokeStyle = '#cbd5e1'; // chrome metallic faucet
            ctx.lineWidth = 3;
            ctx.stroke();

            // 2. High-fidelity Refrigerator (Metallic double door steel cabinet with water dispenser)
            const r_x = kx + rw - 2.5;
            const r_y = ky + rh - 1.8;
            const rf_corners = [
              project(r_x, r_y, 0, cx, cy, radYaw, radPitch),
              project(r_x + 1.8, r_y, 0, cx, cy, radYaw, radPitch),
              project(r_x + 1.8, r_y + 1.2, 0, cx, cy, radYaw, radPitch),
              project(r_x, r_y + 1.2, 0, cx, cy, radYaw, radPitch),
              project(r_x, r_y, 1.9, cx, cy, radYaw, radPitch),
              project(r_x + 1.8, r_y, 1.9, cx, cy, radYaw, radPitch),
              project(r_x + 1.8, r_y + 1.2, 1.9, cx, cy, radYaw, radPitch),
              project(r_x, r_y + 1.2, 1.9, cx, cy, radYaw, radPitch),
            ];

            // Refrigerator Top
            ctx.beginPath();
            ctx.moveTo(rf_corners[4].x, rf_corners[4].y);
            ctx.lineTo(rf_corners[5].x, rf_corners[5].y);
            ctx.lineTo(rf_corners[6].x, rf_corners[6].y);
            ctx.lineTo(rf_corners[7].x, rf_corners[7].y);
            ctx.closePath();
            ctx.fillStyle = '#64748b'; // stainless steel top
            ctx.fill();
            ctx.stroke();

            // Fridge Front Panel (Facing Room)
            ctx.beginPath();
            ctx.moveTo(rf_corners[3].x, rf_corners[3].y);
            ctx.lineTo(rf_corners[2].x, rf_corners[2].y);
            ctx.lineTo(rf_corners[6].x, rf_corners[6].y);
            ctx.lineTo(rf_corners[7].x, rf_corners[7].y);
            ctx.closePath();
            ctx.fillStyle = '#94a3b8'; // stainless steel gray doors
            ctx.fill();
            ctx.strokeStyle = '#475569';
            ctx.stroke();

            // Refrigerator vertical split (French doors)
            const f_midB_x = (rf_corners[3].x + rf_corners[2].x) / 2;
            const f_midB_y = (rf_corners[3].y + rf_corners[2].y) / 2;
            const f_midT_x = (rf_corners[7].x + rf_corners[6].x) / 2;
            const f_midT_y = (rf_corners[7].y + rf_corners[6].y) / 2;

            ctx.beginPath();
            ctx.moveTo(f_midB_x, f_midB_y);
            ctx.lineTo(f_midT_x, f_midT_y);
            ctx.strokeStyle = '#475569';
            ctx.stroke();

            // Water/Ice Dispenser Panel (on Left Door)
            const d1 = project(r_x + 0.3, r_y + 1.22, 1.0, cx, cy, radYaw, radPitch);
            const d2 = project(r_x + 0.7, r_y + 1.22, 1.0, cx, cy, radYaw, radPitch);
            const d3 = project(r_x + 0.7, r_y + 1.22, 1.3, cx, cy, radYaw, radPitch);
            const d4 = project(r_x + 0.3, r_y + 1.22, 1.3, cx, cy, radYaw, radPitch);

            ctx.beginPath();
            ctx.moveTo(d1.x, d1.y);
            ctx.lineTo(d2.x, d2.y);
            ctx.lineTo(d3.x, d3.y);
            ctx.lineTo(d4.x, d4.y);
            ctx.closePath();
            ctx.fillStyle = '#1e293b'; // black digital water dispenser
            ctx.fill();
          },
        });
      } else if (room.type === 'garage') {
        // High fidelity Sports Sedan Car - dual headlights, red taillights, spoiler, rims
        const cx_car = rxCenter;
        const cy_car = ryCenter;
        const cW = 5.6; // car width
        const cL = 11.5; // car length

        const carB1 = project(cx_car - cW / 2, cy_car - cL / 2, 0, cx, cy, radYaw, radPitch);
        const carT1 = project(cx_car - cW / 2, cy_car - cL / 2, 1.4, cx, cy, radYaw, radPitch);
        const carT3 = project(cx_car + cW / 2, cy_car + cL / 2, 1.4, cx, cy, radYaw, radPitch);

        primitives.push({
          depth: (carB1.depth + carT3.depth) / 2,
          draw: () => {
            // 1. Draw Wheels (4 black wheels with metallic hubs)
            const whs = [
              project(cx_car - cW / 2 - 0.1, cy_car - cL / 3.5, 0.22, cx, cy, radYaw, radPitch),
              project(cx_car + cW / 2 + 0.1, cy_car - cL / 3.5, 0.22, cx, cy, radYaw, radPitch),
              project(cx_car - cW / 2 - 0.1, cy_car + cL / 3.5, 0.22, cx, cy, radYaw, radPitch),
              project(cx_car + cW / 2 + 0.1, cy_car + cL / 3.5, 0.22, cx, cy, radYaw, radPitch),
            ];
            whs.forEach((w) => {
              // Outer Tire (Black)
              ctx.beginPath();
              ctx.arc(w.x, w.y, 6.5 * zoom3d, 0, 2 * Math.PI);
              ctx.fillStyle = '#0f172a'; // rich black rubber
              ctx.fill();

              // Inner Rim (Metallic Silver)
              ctx.beginPath();
              ctx.arc(w.x, w.y, 3 * zoom3d, 0, 2 * Math.PI);
              ctx.fillStyle = '#94a3b8'; // shiny rims
              ctx.fill();
            });

            // 2. Lower main car body box (Crimson Red high contrast paint)
            const body = [
              project(cx_car - cW / 2, cy_car - cL / 2, 0.2, cx, cy, radYaw, radPitch),
              project(cx_car + cW / 2, cy_car - cL / 2, 0.2, cx, cy, radYaw, radPitch),
              project(cx_car + cW / 2, cy_car + cL / 2, 0.2, cx, cy, radYaw, radPitch),
              project(cx_car - cW / 2, cy_car + cL / 2, 0.2, cx, cy, radYaw, radPitch),
              project(cx_car - cW / 2, cy_car - cL / 2, 1.05, cx, cy, radYaw, radPitch),
              project(cx_car + cW / 2, cy_car - cL / 2, 1.05, cx, cy, radYaw, radPitch),
              project(cx_car + cW / 2, cy_car + cL / 2, 1.05, cx, cy, radYaw, radPitch),
              project(cx_car - cW / 2, cy_car + cL / 2, 1.05, cx, cy, radYaw, radPitch),
            ];

            ctx.beginPath();
            ctx.moveTo(body[4].x, body[4].y);
            ctx.lineTo(body[5].x, body[5].y);
            ctx.lineTo(body[6].x, body[6].y);
            ctx.lineTo(body[7].x, body[7].y);
            ctx.closePath();
            ctx.fillStyle = '#ef4444'; // brilliant sporty crimson red paint
            ctx.fill();
            ctx.strokeStyle = '#991b1b';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Lower sides of body
            ctx.beginPath();
            ctx.moveTo(body[0].x, body[0].y);
            ctx.lineTo(body[3].x, body[3].y);
            ctx.lineTo(body[7].x, body[7].y);
            ctx.lineTo(body[4].x, body[4].y);
            ctx.closePath();
            ctx.fillStyle = '#dc2626'; // side paint shading
            ctx.fill();
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(body[1].x, body[1].y);
            ctx.lineTo(body[2].x, body[2].y);
            ctx.lineTo(body[6].x, body[6].y);
            ctx.lineTo(body[5].x, body[5].y);
            ctx.closePath();
            ctx.fillStyle = '#b91c1c'; // opposite side darker shading
            ctx.fill();
            ctx.stroke();

            // Front Bumper (facing forward)
            ctx.beginPath();
            ctx.moveTo(body[0].x, body[0].y);
            ctx.lineTo(body[1].x, body[1].y);
            ctx.lineTo(body[5].x, body[5].y);
            ctx.lineTo(body[4].x, body[4].y);
            ctx.closePath();
            ctx.fillStyle = '#dc2626';
            ctx.fill();
            ctx.stroke();

            // Glowing Dual Headlights (yellow polygons) on front bumper
            const hl1_l = project(cx_car - cW / 2 + 0.3, cy_car - cL / 2, 0.6, cx, cy, radYaw, radPitch);
            const hl1_r = project(cx_car - cW / 2 + 1.2, cy_car - cL / 2, 0.6, cx, cy, radYaw, radPitch);
            const hl1_t = project(cx_car - cW / 2 + 0.8, cy_car - cL / 2, 0.9, cx, cy, radYaw, radPitch);

            ctx.beginPath();
            ctx.moveTo(hl1_l.x, hl1_l.y);
            ctx.lineTo(hl1_r.x, hl1_r.y);
            ctx.lineTo(hl1_t.x, hl1_t.y);
            ctx.closePath();
            ctx.fillStyle = '#fef08a'; // glowing yellow headlight
            ctx.fill();

            const hl2_l = project(cx_car + cW / 2 - 1.2, cy_car - cL / 2, 0.6, cx, cy, radYaw, radPitch);
            const hl2_r = project(cx_car + cW / 2 - 0.3, cy_car - cL / 2, 0.6, cx, cy, radYaw, radPitch);
            const hl2_t = project(cx_car + cW / 2 - 0.8, cy_car - cL / 2, 0.9, cx, cy, radYaw, radPitch);

            ctx.beginPath();
            ctx.moveTo(hl2_l.x, hl2_l.y);
            ctx.lineTo(hl2_r.x, hl2_r.y);
            ctx.lineTo(hl2_t.x, hl2_t.y);
            ctx.closePath();
            ctx.fillStyle = '#fef08a'; // glowing yellow headlight
            ctx.fill();

            // Honeycomb Front Grille (dark grey bar between headlights)
            const grl_l = project(cx_car - cW / 2 + 1.6, cy_car - cL / 2, 0.5, cx, cy, radYaw, radPitch);
            const grl_r = project(cx_car + cW / 2 - 1.6, cy_car - cL / 2, 0.5, cx, cy, radYaw, radPitch);
            const grl_t_l = project(cx_car - cW / 2 + 1.6, cy_car - cL / 2, 0.8, cx, cy, radYaw, radPitch);
            const grl_t_r = project(cx_car + cW / 2 - 1.6, cy_car - cL / 2, 0.8, cx, cy, radYaw, radPitch);

            ctx.beginPath();
            ctx.moveTo(grl_l.x, grl_l.y);
            ctx.lineTo(grl_r.x, grl_r.y);
            ctx.lineTo(grl_t_r.x, grl_t_r.y);
            ctx.lineTo(grl_t_l.x, grl_t_l.y);
            ctx.closePath();
            ctx.fillStyle = '#1e293b'; // black grill
            ctx.fill();

            // 3. Cabin Upper Canopy (Detailed glass windows + roof)
            const cabin = [
              project(cx_car - cW / 2 + 0.4, cy_car - cL / 8, 1.05, cx, cy, radYaw, radPitch),
              project(cx_car + cW / 2 - 0.4, cy_car - cL / 8, 1.05, cx, cy, radYaw, radPitch),
              project(cx_car + cW / 2 - 0.4, cy_car + cL / 4, 1.05, cx, cy, radYaw, radPitch),
              project(cx_car - cW / 2 + 0.4, cy_car + cL / 4, 1.05, cx, cy, radYaw, radPitch),
              project(cx_car - cW / 2 + 0.5, cy_car - cL / 12, 1.55, cx, cy, radYaw, radPitch),
              project(cx_car + cW / 2 - 0.5, cy_car - cL / 12, 1.55, cx, cy, radYaw, radPitch),
              project(cx_car + cW / 2 - 0.5, cy_car + cL / 6, 1.55, cx, cy, radYaw, radPitch),
              project(cx_car - cW / 2 + 0.5, cy_car + cL / 6, 1.55, cx, cy, radYaw, radPitch),
            ];

            // Cabin Roof (Solid Paint)
            ctx.beginPath();
            ctx.moveTo(cabin[4].x, cabin[4].y);
            ctx.lineTo(cabin[5].x, cabin[5].y);
            ctx.lineTo(cabin[6].x, cabin[6].y);
            ctx.lineTo(cabin[7].x, cabin[7].y);
            ctx.closePath();
            ctx.fillStyle = '#dc2626'; // roof paint matching car
            ctx.fill();
            ctx.strokeStyle = '#991b1b';
            ctx.stroke();

            // Windshield Front Window (reflective sky blue glass)
            ctx.beginPath();
            ctx.moveTo(cabin[0].x, cabin[0].y);
            ctx.lineTo(cabin[1].x, cabin[1].y);
            ctx.lineTo(cabin[5].x, cabin[5].y);
            ctx.lineTo(cabin[4].x, cabin[4].y);
            ctx.closePath();
            ctx.fillStyle = 'rgba(186, 230, 253, 0.85)'; // glowing sky blue glass
            ctx.fill();
            ctx.strokeStyle = '#0284c7';
            ctx.stroke();

            // Rear Window
            ctx.beginPath();
            ctx.moveTo(cabin[3].x, cabin[3].y);
            ctx.lineTo(cabin[2].x, cabin[2].y);
            ctx.lineTo(cabin[6].x, cabin[6].y);
            ctx.lineTo(cabin[7].x, cabin[7].y);
            ctx.closePath();
            ctx.fillStyle = 'rgba(186, 230, 253, 0.85)';
            ctx.fill();
            ctx.stroke();

            // 4. Sporty Rear Spoiler (raised wing on the trunk)
            const sp_l1 = project(cx_car - cW / 2 + 0.6, cy_car + cL / 2 - 0.4, 1.1, cx, cy, radYaw, radPitch);
            const sp_l2 = project(cx_car - cW / 2 + 0.6, cy_car + cL / 2 - 0.4, 1.4, cx, cy, radYaw, radPitch);
            const sp_r1 = project(cx_car + cW / 2 - 0.6, cy_car + cL / 2 - 0.4, 1.1, cx, cy, radYaw, radPitch);
            const sp_r2 = project(cx_car + cW / 2 - 0.6, cy_car + cL / 2 - 0.4, 1.4, cx, cy, radYaw, radPitch);

            // Left mount
            ctx.beginPath();
            ctx.moveTo(sp_l1.x, sp_l1.y);
            ctx.lineTo(sp_l2.x, sp_l2.y);
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 3;
            ctx.stroke();

            // Right mount
            ctx.beginPath();
            ctx.moveTo(sp_r1.x, sp_r1.y);
            ctx.lineTo(sp_r2.x, sp_r2.y);
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 3;
            ctx.stroke();

            // Main spoiler wing bar
            const wing1 = project(cx_car - cW / 2 + 0.2, cy_car + cL / 2 - 0.5, 1.4, cx, cy, radYaw, radPitch);
            const wing2 = project(cx_car + cW / 2 - 0.2, cy_car + cL / 2 - 0.5, 1.4, cx, cy, radYaw, radPitch);
            ctx.beginPath();
            ctx.moveTo(wing1.x, wing1.y);
            ctx.lineTo(wing2.x, wing2.y);
            ctx.strokeStyle = '#0f172a'; // carbon fiber spoiler wing
            ctx.lineWidth = 5 * zoom3d;
            ctx.stroke();
          },
        });
      } else if (room.type === 'staircase') {
        // Draw real rising steps in 3D
        const stepsCount = 8;
        const stepH = 1.8 / stepsCount;
        const stepW = rw;
        const stepL = rh / stepsCount;

        for (let i = 0; i < stepsCount; i++) {
          const sy_step = ry + i * stepL;
          const sz_step = i * stepH;

          const s1 = project(rx, sy_step, sz_step, cx, cy, radYaw, radPitch);
          const s3 = project(rx + stepW, sy_step + stepL, sz_step + stepH, cx, cy, radYaw, radPitch);

          primitives.push({
            depth: (s1.depth + s3.depth) / 2,
            draw: () => {
              // Draw stair block step
              const stepCorners = [
                project(rx, sy_step, sz_step, cx, cy, radYaw, radPitch),
                project(rx + stepW, sy_step, sz_step, cx, cy, radYaw, radPitch),
                project(rx + stepW, sy_step + stepL, sz_step, cx, cy, radYaw, radPitch),
                project(rx, sy_step + stepL, sz_step, cx, cy, radYaw, radPitch),
                project(rx, sy_step, sz_step + stepH, cx, cy, radYaw, radPitch),
                project(rx + stepW, sy_step, sz_step + stepH, cx, cy, radYaw, radPitch),
                project(rx + stepW, sy_step + stepL, sz_step + stepH, cx, cy, radYaw, radPitch),
                project(rx, sy_step + stepL, sz_step + stepH, cx, cy, radYaw, radPitch),
              ];

              // Draw step tread top surface
              ctx.beginPath();
              ctx.moveTo(stepCorners[4].x, stepCorners[4].y);
              ctx.lineTo(stepCorners[5].x, stepCorners[5].y);
              ctx.lineTo(stepCorners[6].x, stepCorners[6].y);
              ctx.lineTo(stepCorners[7].x, stepCorners[7].y);
              ctx.closePath();
              ctx.fillStyle = '#e879f9'; // staircase pink accent
              ctx.fill();
              ctx.strokeStyle = '#c084fc';
              ctx.stroke();

              // Step front face riser
              ctx.beginPath();
              ctx.moveTo(stepCorners[3].x, stepCorners[3].y);
              ctx.lineTo(stepCorners[2].x, stepCorners[2].y);
              ctx.lineTo(stepCorners[6].x, stepCorners[6].y);
              ctx.lineTo(stepCorners[7].x, stepCorners[7].y);
              ctx.closePath();
              ctx.fillStyle = '#a21caf';
              ctx.fill();
              ctx.stroke();
            },
          });
        }
      } else if (room.type === 'bathroom') {
        // High fidelity Toilet & modern oval bathtub with metallic faucet
        const bx = rx + 0.4;
        const by = ry + 0.4;

        const p1 = project(bx, by, 0, cx, cy, radYaw, radPitch);
        const p2 = project(bx + rw - 0.8, by + rh - 0.8, 0.8, cx, cy, radYaw, radPitch);

        primitives.push({
          depth: (p1.depth + p2.depth) / 2,
          draw: () => {
            // 1. Pedestal Sink (Porcelain cylinder with basin)
            const sinkBase = project(bx + 0.8, by + 0.8, 0, cx, cy, radYaw, radPitch);
            const sinkTop = project(bx + 0.8, by + 0.8, 0.9, cx, cy, radYaw, radPitch);

            ctx.beginPath();
            ctx.moveTo(sinkBase.x, sinkBase.y);
            ctx.lineTo(sinkTop.x, sinkTop.y);
            ctx.strokeStyle = '#e2e8f0'; // pedestal column
            ctx.lineWidth = 8 * zoom3d;
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(sinkTop.x, sinkTop.y, 6.5 * zoom3d, 0, 2 * Math.PI);
            ctx.fillStyle = '#f8fafc'; // sink basin
            ctx.fill();
            ctx.strokeStyle = '#cbd5e1';
            ctx.stroke();

            // 2. Oval Bathtub
            const tubX = rx + rw - 3.2;
            const tubY = ry + 0.6;
            const tubW = 2.4;
            const tubH = 1.3;

            const tub_corners = [
              project(tubX, tubY, 0.5, cx, cy, radYaw, radPitch),
              project(tubX + tubW, tubY, 0.5, cx, cy, radYaw, radPitch),
              project(tubX + tubW, tubY + tubH, 0.5, cx, cy, radYaw, radPitch),
              project(tubX, tubY + tubH, 0.5, cx, cy, radYaw, radPitch),
            ];

            ctx.beginPath();
            ctx.moveTo(tub_corners[0].x, tub_corners[0].y);
            ctx.lineTo(tub_corners[1].x, tub_corners[1].y);
            ctx.lineTo(tub_corners[2].x, tub_corners[2].y);
            ctx.lineTo(tub_corners[3].x, tub_corners[3].y);
            ctx.closePath();
            ctx.fillStyle = '#f1f5f9'; // sleek tub exterior
            ctx.fill();
            ctx.strokeStyle = '#cbd5e1';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Water inside the tub (glowing sky blue)
            ctx.beginPath();
            ctx.moveTo(tub_corners[0].x + 3, tub_corners[0].y + 2);
            ctx.lineTo(tub_corners[1].x - 3, tub_corners[1].y + 2);
            ctx.lineTo(tub_corners[2].x - 3, tub_corners[2].y - 2);
            ctx.lineTo(tub_corners[3].x + 3, tub_corners[3].y - 2);
            ctx.closePath();
            ctx.fillStyle = '#bae6fd'; // shiny warm bath water
            ctx.fill();
          },
        });
      } else if (room.type === 'lawn') {
        // High fidelity landscaping - winding stone path, wood slat bench, terracotta pots with colorful flowers
        const px = rxCenter;
        const py = ryCenter;
        const basePot = project(px, py, 0, cx, cy, radYaw, radPitch);

        primitives.push({
          depth: basePot.depth,
          draw: () => {
            // 1. Curving Stone Path
            const pathPoints = [
              project(rx + 0.5, ry + 0.5, 0.01, cx, cy, radYaw, radPitch),
              project(rxCenter, ryCenter, 0.01, cx, cy, radYaw, radPitch),
              project(rx + rw - 0.5, ry + rh - 0.5, 0.01, cx, cy, radYaw, radPitch),
            ];
            ctx.beginPath();
            ctx.moveTo(pathPoints[0].x, pathPoints[0].y);
            ctx.bezierCurveTo(
              pathPoints[1].x - 20, pathPoints[1].y,
              pathPoints[1].x + 20, pathPoints[1].y,
              pathPoints[2].x, pathPoints[2].y
            );
            ctx.strokeStyle = '#cbd5e1'; // stone path color
            ctx.lineWidth = 14 * zoom3d;
            ctx.stroke();

            // 2. Terracotta Flowerpots (foliage and red flowering buds!)
            const pots = [
              { x: rx + 1, y: ry + rh - 1.2 },
              { x: rx + rw - 1, y: ry + 1.2 },
            ];

            pots.forEach((p) => {
              const potBottom = project(p.x, p.y, 0, cx, cy, radYaw, radPitch);
              const potTop = project(p.x, p.y, 0.5, cx, cy, radYaw, radPitch);
              const foliage = project(p.x, p.y, 0.9, cx, cy, radYaw, radPitch);

              // Shrub pot
              ctx.beginPath();
              ctx.arc(potTop.x, potTop.y, 5 * zoom3d, 0, 2 * Math.PI);
              ctx.fillStyle = '#ea580c'; // terracotta pot
              ctx.fill();

              // Foliage
              ctx.beginPath();
              ctx.arc(foliage.x, foliage.y, 11 * zoom3d, 0, 2 * Math.PI);
              ctx.fillStyle = '#16a34a'; // leafy dark green
              ctx.fill();

              // Flower dots (little red dots on the plant)
              const fl1 = project(p.x - 0.2, p.y + 0.1, 1.0, cx, cy, radYaw, radPitch);
              const fl2 = project(p.x + 0.3, p.y - 0.2, 1.0, cx, cy, radYaw, radPitch);
              ctx.beginPath();
              ctx.arc(fl1.x, fl1.y, 2 * zoom3d, 0, 2 * Math.PI);
              ctx.arc(fl2.x, fl2.y, 2 * zoom3d, 0, 2 * Math.PI);
              ctx.fillStyle = '#f43f5e'; // vibrant red flower blooms
              ctx.fill();
            });

            // 3. Wood Slat Garden Bench
            const bx_bench = rx + 1.5;
            const by_bench = ry + rh / 2 - 0.5;
            const b_w = 3.5;
            const b_l = 1.2;

            const b1 = project(bx_bench, by_bench, 0.45, cx, cy, radYaw, radPitch);
            const b2 = project(bx_bench + b_w, by_bench, 0.45, cx, cy, radYaw, radPitch);
            const b3 = project(bx_bench + b_w, by_bench + b_l, 0.45, cx, cy, radYaw, radPitch);
            const b4 = project(bx_bench, by_bench + b_l, 0.45, cx, cy, radYaw, radPitch);

            // Wood planks fill
            ctx.beginPath();
            ctx.moveTo(b1.x, b1.y);
            ctx.lineTo(b2.x, b2.y);
            ctx.lineTo(b3.x, b3.y);
            ctx.lineTo(b4.x, b4.y);
            ctx.closePath();
            ctx.fillStyle = '#d97706'; // garden wood planks
            ctx.fill();
            ctx.strokeStyle = '#78350f';
            ctx.lineWidth = 1;
            ctx.stroke();

            // Bench legs
            const leg_b = project(bx_bench + 0.3, by_bench + 0.3, 0, cx, cy, radYaw, radPitch);
            const leg_t = project(bx_bench + 0.3, by_bench + 0.3, 0.45, cx, cy, radYaw, radPitch);
            ctx.beginPath();
            ctx.moveTo(leg_b.x, leg_b.y);
            ctx.lineTo(leg_t.x, leg_t.y);
            ctx.strokeStyle = '#1e293b';
            ctx.lineWidth = 2.5;
            ctx.stroke();

            const leg2_b = project(bx_bench + b_w - 0.3, by_bench + b_l - 0.3, 0, cx, cy, radYaw, radPitch);
            const leg2_t = project(bx_bench + b_w - 0.3, by_bench + b_l - 0.3, 0.45, cx, cy, radYaw, radPitch);
            ctx.beginPath();
            ctx.moveTo(leg2_b.x, leg2_b.y);
            ctx.lineTo(leg2_t.x, leg2_t.y);
            ctx.strokeStyle = '#1e293b';
            ctx.lineWidth = 2.5;
            ctx.stroke();
          },
        });
      }
    });

    // 3. EXTRUDE 3D ROOM WALLS (Low-height architectural model style)
    layout.rooms.forEach((room) => {
      // We skip lawn to avoid creating outer walls on lawn blocks
      if (room.type === 'lawn') return;

      const rx = room.x;
      const ry = room.y;
      const rw = room.width;
      const rh = room.height;

      // Project top and bottom corners of 4 walls
      const cornersBottom = [
        project(rx, ry, 0, cx, cy, radYaw, radPitch),
        project(rx + rw, ry, 0, cx, cy, radYaw, radPitch),
        project(rx + rw, ry + rh, 0, cx, cy, radYaw, radPitch),
        project(rx, ry + rh, 0, cx, cy, radYaw, radPitch),
      ];

      const cornersTop = [
        project(rx, ry, wallHeight, cx, cy, radYaw, radPitch),
        project(rx + rw, ry, wallHeight, cx, cy, radYaw, radPitch),
        project(rx + rw, ry + rh, wallHeight, cx, cy, radYaw, radPitch),
        project(rx, ry + rh, wallHeight, cx, cy, radYaw, radPitch),
      ];

      // Check if there is a custom wall material applied
      const wallMat = room.wallMaterial ? WALL_MATERIALS.find(m => m.id === room.wallMaterial) : null;

      // Draw each of the 4 walls (left, back, right, front)
      // Wall indices:
      // 0: (0->1) Back Wall
      // 1: (1->2) Right Wall
      // 2: (2->3) Front Wall
      // 3: (3->0) Left Wall
      const wallDefs = [
        { b1: cornersBottom[0], b2: cornersBottom[1], t1: cornersTop[0], t2: cornersTop[1], name: 'Back', x1: rx, y1: ry, x2: rx + rw, y2: ry },
        { b1: cornersBottom[1], b2: cornersBottom[2], t1: cornersTop[1], t2: cornersTop[2], name: 'Right', x1: rx + rw, y1: ry, x2: rx + rw, y2: ry + rh },
        { b1: cornersBottom[2], b2: cornersBottom[3], t1: cornersTop[2], t2: cornersTop[3], name: 'Front', x1: rx + rw, y1: ry + rh, x2: rx, y2: ry + rh },
        { b1: cornersBottom[3], b2: cornersBottom[0], t1: cornersTop[3], t2: cornersTop[0], name: 'Left', x1: rx, y1: ry + rh, x2: rx, y2: ry },
      ];

      wallDefs.forEach((w) => {
        if (w.b1.behind || w.b2.behind || w.t1.behind || w.t2.behind) return;
        const wallDepth = (w.b1.depth + w.b2.depth) / 2;

        primitives.push({
          depth: wallDepth, // correctly interleaves inside the Painters list
          draw: () => {
            // Draw wall quadrilateral
            ctx.beginPath();
            ctx.moveTo(w.b1.x, w.b1.y);
            ctx.lineTo(w.b2.x, w.b2.y);
            ctx.lineTo(w.t2.x, w.t2.y);
            ctx.lineTo(w.t1.x, w.t1.y);
            ctx.closePath();

            if (wallMat) {
              ctx.fillStyle = wallMat.color;
              ctx.fill();

              // Ambient 3D shading based on wall direction
              ctx.save();
              ctx.beginPath();
              ctx.moveTo(w.b1.x, w.b1.y);
              ctx.lineTo(w.b2.x, w.b2.y);
              ctx.lineTo(w.t2.x, w.t2.y);
              ctx.lineTo(w.t1.x, w.t1.y);
              ctx.closePath();
              ctx.fillStyle = w.name === 'Back' || w.name === 'Left' ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.08)';
              ctx.fill();
              ctx.restore();
            } else {
              // Elegant, realistic architectural plaster style
              const isDark = document.documentElement.classList.contains('dark');
              ctx.fillStyle = isDark ? '#334155' : '#fbfaf7'; // Slate charcoal or sand plaster
              ctx.fill();

              ctx.save();
              ctx.beginPath();
              ctx.moveTo(w.b1.x, w.b1.y);
              ctx.lineTo(w.b2.x, w.b2.y);
              ctx.lineTo(w.t2.x, w.t2.y);
              ctx.lineTo(w.t1.x, w.t1.y);
              ctx.closePath();
              // Back/Left walls get shaded darker; Front/Right walls get highlighted lighter
              ctx.fillStyle = w.name === 'Back' || w.name === 'Left'
                ? (isDark ? 'rgba(0, 0, 0, 0.28)' : 'rgba(0, 0, 0, 0.08)')
                : (isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.45)');
              ctx.fill();
              ctx.restore();
            }

            // Draw custom texture patterns
            if (wallMat && wallMat.pattern !== 'plain') {
              ctx.save();
              ctx.beginPath();
              ctx.moveTo(w.b1.x, w.b1.y);
              ctx.lineTo(w.b2.x, w.b2.y);
              ctx.lineTo(w.t2.x, w.t2.y);
              ctx.lineTo(w.t1.x, w.t1.y);
              ctx.closePath();
              ctx.clip(); // Keep inside this wall panel

              const strokeColor = wallMat.secondaryColor || 'rgba(0,0,0,0.15)';
              ctx.strokeStyle = strokeColor;

              const wallLen = Math.sqrt((w.x2 - w.x1) ** 2 + (w.y2 - w.y1) ** 2);
              const dx = (w.x2 - w.x1) / wallLen;
              const dy = (w.y2 - w.y1) / wallLen;

              if (wallMat.pattern === 'wood') {
                // Vertical siding planks
                ctx.lineWidth = 0.8 * zoom3d;
                for (let d = 0.4; d < wallLen; d += 0.5) {
                  const wx = w.x1 + d * dx;
                  const wy = w.y1 + d * dy;
                  const lineB = project(wx, wy, 0, cx, cy, radYaw, radPitch);
                  const lineT = project(wx, wy, wallHeight, cx, cy, radYaw, radPitch);
                  ctx.beginPath();
                  ctx.moveTo(lineB.x, lineB.y);
                  ctx.lineTo(lineT.x, lineT.y);
                  ctx.stroke();
                }
              } else if (wallMat.pattern === 'brick') {
                // Rustic brick courses
                ctx.lineWidth = 0.6 * zoom3d;
                for (let zh = 0.25; zh < wallHeight; zh += 0.25) {
                  const pStart = project(w.x1, w.y1, zh, cx, cy, radYaw, radPitch);
                  const pEnd = project(w.x2, w.y2, zh, cx, cy, radYaw, radPitch);
                  ctx.beginPath();
                  ctx.moveTo(pStart.x, pStart.y);
                  ctx.lineTo(pEnd.x, pEnd.y);
                  ctx.stroke();

                  // Vertical joints
                  const shift = (Math.round(zh * 4) % 2 === 0) ? 0.25 : 0;
                  for (let d = shift; d < wallLen; d += 0.6) {
                    const wx = w.x1 + d * dx;
                    const wy = w.y1 + d * dy;
                    const tickB = project(wx, wy, zh - 0.25, cx, cy, radYaw, radPitch);
                    const tickT = project(wx, wy, zh, cx, cy, radYaw, radPitch);
                    ctx.beginPath();
                    ctx.moveTo(tickB.x, tickB.y);
                    ctx.lineTo(tickT.x, tickT.y);
                    ctx.stroke();
                  }
                }
              } else if (wallMat.pattern === 'wallpaper') {
                // Diagonal royal diamond trellis print
                ctx.lineWidth = 0.5 * zoom3d;
                ctx.save();
                ctx.globalAlpha = 0.35;
                for (let d = -wallHeight; d < wallLen; d += 0.4) {
                  const startX1 = w.x1 + Math.max(0, d) * dx;
                  const startY1 = w.y1 + Math.max(0, d) * dy;
                  const startZ1 = Math.max(0, -d);

                  const endX1 = w.x1 + Math.min(wallLen, d + wallHeight) * dx;
                  const endY1 = w.y1 + Math.min(wallLen, d + wallHeight) * dy;
                  const startZ2 = Math.min(wallHeight, wallHeight - (d + wallHeight - wallLen));

                  const pStart = project(startX1, startY1, startZ1, cx, cy, radYaw, radPitch);
                  const pEnd = project(endX1, endY1, startZ2, cx, cy, radYaw, radPitch);

                  ctx.beginPath();
                  ctx.moveTo(pStart.x, pStart.y);
                  ctx.lineTo(pEnd.x, pEnd.y);
                  ctx.stroke();
                }
                ctx.restore();
              }
              ctx.restore();
            }

            // Wall outer line styling (Thick structural architectural lines)
            ctx.strokeStyle = document.documentElement.classList.contains('dark')
              ? '#64748b'
              : '#334155';
            ctx.lineWidth = 1.8;
            ctx.stroke();
          },
        });
      });
    });

    // 4. DRAW 3D DOORWAYS & WINDOWS GAPS/PANES
    layout.doors.forEach((door) => {
      const dW = door.width;
      const dx = door.x;
      const dy = door.y;

      const doorB1 = project(dx, dy, 0, cx, cy, radYaw, radPitch);
      const doorT2 = project(
        dx + (door.type === 'horizontal' ? dW : 0),
        dy + (door.type === 'vertical' ? dW : 0),
        1.8,
        cx,
        cy,
        radYaw,
        radPitch
      );

      if (doorB1.behind || doorT2.behind) return;

      primitives.push({
        depth: (doorB1.depth + doorT2.depth) / 2,
        draw: () => {
          // Draw open door leaf swing (Rotating at 45 deg)
          const angle = Math.PI / 4;
          const lx = dx + (door.type === 'horizontal' ? dW * Math.cos(angle) : 0);
          const ly = dy + (door.type === 'vertical' ? dW * Math.sin(angle) : 0);

          const leafB1 = project(dx, dy, 0, cx, cy, radYaw, radPitch);
          const leafB2 = project(lx, ly, 0, cx, cy, radYaw, radPitch);
          const leafT1 = project(dx, dy, 1.8, cx, cy, radYaw, radPitch);
          const leafT2 = project(lx, ly, 1.8, cx, cy, radYaw, radPitch);

          ctx.beginPath();
          ctx.moveTo(leafB1.x, leafB1.y);
          ctx.lineTo(leafB2.x, leafB2.y);
          ctx.lineTo(leafT2.x, leafT2.y);
          ctx.lineTo(leafT1.x, leafT1.y);
          ctx.closePath();
          ctx.fillStyle = 'rgba(217, 119, 6, 0.8)'; // Golden warm wood
          ctx.fill();
          ctx.strokeStyle = '#b45309';
          ctx.lineWidth = 2;
          ctx.stroke();
        },
      });
    });

    layout.windows.forEach((win) => {
      const wW = win.width;
      const wx = win.x;
      const wy = win.y;

      const room = layout.rooms.find((r) => r.id === win.roomId);
      const isBathroom = room?.type === 'bathroom';

      const wB1 = project(wx, wy, isBathroom ? 1.5 : 0.6, cx, cy, radYaw, radPitch);
      const wT2 = project(
        wx + (win.type === 'horizontal' ? wW : 0),
        wy + (win.type === 'vertical' ? wW : 0),
        isBathroom ? 2.1 : 1.6,
        cx,
        cy,
        radYaw,
        radPitch
      );

      if (wB1.behind || wT2.behind) return;

      primitives.push({
        depth: (wB1.depth + wT2.depth) / 2,
        draw: () => {
          // Draw window pane frame
          const p1 = project(wx, wy, isBathroom ? 1.6 : 0.7, cx, cy, radYaw, radPitch);
          const p2 = project(
            wx + (win.type === 'horizontal' ? wW : 0),
            wy + (win.type === 'vertical' ? wW : 0),
            isBathroom ? 1.6 : 0.7,
            cx,
            cy,
            radYaw,
            radPitch
          );
          const p3 = project(
            wx + (win.type === 'horizontal' ? wW : 0),
            wy + (win.type === 'vertical' ? wW : 0),
            isBathroom ? 2.05 : 1.5,
            cx,
            cy,
            radYaw,
            radPitch
          );
          const p4 = project(wx, wy, isBathroom ? 2.05 : 1.5, cx, cy, radYaw, radPitch);

          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.lineTo(p3.x, p3.y);
          ctx.lineTo(p4.x, p4.y);
          ctx.closePath();
          if (lightingMode === 'night') {
            ctx.fillStyle = 'rgba(254, 240, 138, 0.95)'; // Glowing warm yellow glass
          } else if (isBathroom) {
            ctx.fillStyle = 'rgba(224, 242, 254, 0.7)'; // Frosted/opaque glass feel
          } else {
            ctx.fillStyle = 'rgba(14, 165, 233, 0.55)'; // Light glass blue
          }
          ctx.fill();
          ctx.strokeStyle = lightingMode === 'night' ? '#ca8a04' : (isBathroom ? '#0369a1' : '#0284c7');
          ctx.lineWidth = isBathroom ? 2 : 2.5;
          ctx.stroke();

          // Horizontal/vertical pane line
          const midX = wx + (win.type === 'horizontal' ? wW / 2 : 0);
          const midY = wy + (win.type === 'vertical' ? wW / 2 : 0);
          const lineB = project(midX, midY, isBathroom ? 1.6 : 0.7, cx, cy, radYaw, radPitch);
          const lineT = project(midX, midY, isBathroom ? 2.05 : 1.5, cx, cy, radYaw, radPitch);

          ctx.beginPath();
          ctx.moveTo(lineB.x, lineB.y);
          ctx.lineTo(lineT.x, lineT.y);
          ctx.stroke();
        },
      });
    });

    // Draw Roof Slabs if showRoof is true
    if (showRoof) {
      layout.rooms.forEach((room) => {
        if (room.type === 'lawn') return;

        const rx = room.x;
        const ry = room.y;
        const rw = room.width;
        const rh = room.height;

        const r1 = project(rx, ry, wallHeight, cx, cy, radYaw, radPitch);
        const r2 = project(rx + rw, ry, wallHeight, cx, cy, radYaw, radPitch);
        const r3 = project(rx + rw, ry + rh, wallHeight, cx, cy, radYaw, radPitch);
        const r4 = project(rx, ry + rh, wallHeight, cx, cy, radYaw, radPitch);

        if (r1.behind || r2.behind || r3.behind || r4.behind) return;

        const avgRoofDepth = (r1.depth + r2.depth + r3.depth + r4.depth) / 4;

        primitives.push({
          depth: avgRoofDepth - 10, // draw on top of walls
          draw: () => {
            ctx.beginPath();
            ctx.moveTo(r1.x, r1.y);
            ctx.lineTo(r2.x, r2.y);
            ctx.lineTo(r3.x, r3.y);
            ctx.lineTo(r4.x, r4.y);
            ctx.closePath();

            // Distinctive modern roof color depending on lighting
            if (lightingMode === 'sunset') {
              ctx.fillStyle = '#475569';
            } else if (lightingMode === 'night') {
              ctx.fillStyle = '#1e293b';
            } else {
              ctx.fillStyle = '#cbd5e1';
            }
            ctx.fill();

            ctx.strokeStyle = '#475569';
            ctx.lineWidth = 2 * zoom3d;
            ctx.stroke();

            // Render a modern Solar Panel array on the roof
            const spWidth = rw * 0.35;
            const spLength = rh * 0.45;
            if (spWidth > 1.2 && spLength > 1.2) {
              const sp1_1 = project(rx + rw * 0.1, ry + rh * 0.1, wallHeight + 0.05, cx, cy, radYaw, radPitch);
              const sp1_2 = project(rx + rw * 0.1 + spWidth, ry + rh * 0.1, wallHeight + 0.05, cx, cy, radYaw, radPitch);
              const sp1_3 = project(rx + rw * 0.1 + spWidth, ry + rh * 0.1 + spLength, wallHeight + 0.05, cx, cy, radYaw, radPitch);
              const sp1_4 = project(rx + rw * 0.1, ry + rh * 0.1 + spLength, wallHeight + 0.05, cx, cy, radYaw, radPitch);

              ctx.beginPath();
              ctx.moveTo(sp1_1.x, sp1_1.y);
              ctx.lineTo(sp1_2.x, sp1_2.y);
              ctx.lineTo(sp1_3.x, sp1_3.y);
              ctx.lineTo(sp1_4.x, sp1_4.y);
              ctx.closePath();
              ctx.fillStyle = '#1e3a8a';
              ctx.fill();
              ctx.strokeStyle = '#3b82f6';
              ctx.lineWidth = 1;
              ctx.stroke();

              // Extra grid lines inside the solar panel
              ctx.beginPath();
              const spMidX = (sp1_1.x + sp1_2.x) / 2;
              const spMidY = (sp1_1.y + sp1_2.y) / 2;
              const spMidX2 = (sp1_4.x + sp1_3.x) / 2;
              const spMidY2 = (sp1_4.y + sp1_3.y) / 2;
              ctx.moveTo(spMidX, spMidY);
              ctx.lineTo(spMidX2, spMidY2);
              ctx.strokeStyle = 'rgba(255,255,255,0.2)';
              ctx.stroke();
            }
          }
        });
      });
    }

    // Render warm radial light glow inside rooms for Night mode
    if (lightingMode === 'night') {
      layout.rooms.forEach((room) => {
        if (room.type === 'lawn') return;

        const rx = room.x;
        const ry = room.y;
        const rw = room.width;
        const rh = room.height;

        const c1 = project(rx, ry, 0, cx, cy, radYaw, radPitch);
        const c2 = project(rx + rw, ry, 0, cx, cy, radYaw, radPitch);
        const c3 = project(rx + rw, ry + rh, 0, cx, cy, radYaw, radPitch);
        const c4 = project(rx, ry + rh, 0, cx, cy, radYaw, radPitch);

        if (c1.behind || c2.behind || c3.behind || c4.behind) return;

        const avgDepth = (c1.depth + c2.depth + c3.depth + c4.depth) / 4;

        primitives.push({
          depth: avgDepth - 5,
          draw: () => {
            const rxCenter = rx + rw / 2;
            const ryCenter = ry + rh / 2;
            const roomCenter = project(rxCenter, ryCenter, 0, cx, cy, radYaw, radPitch);

            ctx.save();
            ctx.beginPath();
            ctx.moveTo(c1.x, c1.y);
            ctx.lineTo(c2.x, c2.y);
            ctx.lineTo(c3.x, c3.y);
            ctx.lineTo(c4.x, c4.y);
            ctx.closePath();
            ctx.clip(); // Keep glow bounded inside room boundaries

            const grad = ctx.createRadialGradient(
              roomCenter.x,
              roomCenter.y,
              2,
              roomCenter.x,
              roomCenter.y,
              Math.min(rw, rh) * 1.1 * pxPerUnit * zoom3d
            );
            grad.addColorStop(0, 'rgba(254, 240, 138, 0.4)'); // Warm amber yellow
            grad.addColorStop(0.4, 'rgba(245, 158, 11, 0.15)');
            grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

            ctx.fillStyle = grad;
            ctx.fill();
            ctx.restore();
          }
        });
      });
    }

    // 5. SORT BY PAINTER'S DEPTH (furthest renders first)
    primitives.sort((a, b) => b.depth - a.depth);

    // 6. DRAW ALL PRIMITIVES
    primitives.forEach((p) => p.draw());

    // Apply Atmospheric Multipliers/Composite Tints
    if (lightingMode === 'sunset') {
      ctx.save();
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = 'rgba(251, 146, 60, 0.12)'; // sunset gold shading
      ctx.fillRect(0, 0, width, height);
      ctx.restore();

      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = 'rgba(254, 215, 170, 0.08)'; // sunset golden rays
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    } else if (lightingMode === 'night') {
      ctx.save();
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = 'rgba(30, 27, 75, 0.35)'; // dark midnight shading
      ctx.fillRect(0, 0, width, height);
      ctx.restore();

      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = 'rgba(59, 130, 246, 0.06)'; // moonlight ambient
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    }

    // 7. COMPASS OVERLAY (Shows house facing direction)
    const compassCenter = { x: 50, y: height - 50 };
    const compYaw = (yaw * Math.PI) / 180;
    
    // Draw outer compass dial
    ctx.beginPath();
    ctx.arc(compassCenter.x, compassCenter.y, 24, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fill();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw compass needle
    const northPt = {
      x: compassCenter.x + 18 * Math.cos(compYaw - Math.PI/2),
      y: compassCenter.y + 18 * Math.sin(compYaw - Math.PI/2)
    };
    const southPt = {
      x: compassCenter.x - 18 * Math.cos(compYaw - Math.PI/2),
      y: compassCenter.y - 18 * Math.sin(compYaw - Math.PI/2)
    };

    // Draw North red tip
    ctx.beginPath();
    ctx.moveTo(northPt.x, northPt.y);
    ctx.lineTo(compassCenter.x + 5 * Math.cos(compYaw), compassCenter.y + 5 * Math.sin(compYaw));
    ctx.lineTo(compassCenter.x - 5 * Math.cos(compYaw), compassCenter.y - 5 * Math.sin(compYaw));
    ctx.closePath();
    ctx.fillStyle = '#ef4444'; // Red for North needle
    ctx.fill();

    // Draw South slate tip
    ctx.beginPath();
    ctx.moveTo(southPt.x, southPt.y);
    ctx.lineTo(compassCenter.x + 5 * Math.cos(compYaw), compassCenter.y + 5 * Math.sin(compYaw));
    ctx.lineTo(compassCenter.x - 5 * Math.cos(compYaw), compassCenter.y - 5 * Math.sin(compYaw));
    ctx.closePath();
    ctx.fillStyle = '#64748b'; // South
    ctx.fill();

    // Text Label North
    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('N', northPt.x, northPt.y - 4);
  }, [layout, yaw, pitch, zoom3d, canvasSize, selectedRoomId, activeTab, viewMode, lightingMode, projectionType, showRoof, showFurniture, isWalkthrough, wtX, wtY, wtYaw, panX, panY, controlMode]);

  const handleDownload3D = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataURL = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `Smart_Home_Naqsha_3D_Snapshot_${layout.width}x${layout.length}.png`;
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadExterior = () => {
    const link = document.createElement('a');
    link.download = `Modern_Villa_Realistic_Exterior_Render_${layout.width}x${layout.length}.jpg`;
    link.href = exteriorRenderImg;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col lg:flex-row w-full h-auto min-h-[850px] lg:min-h-[900px] bg-slate-50 dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
      {/* Left Column: 3D Canvas Viewport */}
      <div className="flex-1 relative bg-slate-100 dark:bg-slate-950 flex flex-col justify-start items-stretch p-4 gap-4">
        
        {/* Modern Controls Header Bar (Saves Canvas Area space entirely!) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm w-full">
          {/* Left: View Mode Toggle */}
          <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800/80">
            <button
              onClick={() => setViewMode('interior')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'interior'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
              title="Show interactive interior floor plan with furniture layout"
            >
              <Sofa className="w-3.5 h-3.5" />
              <span>3D Floor Plan</span>
            </button>
            <button
              onClick={() => setViewMode('exterior')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'exterior'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
              title="Show complete finished villa roof, exterior shell and landscaping details"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Exterior Shell</span>
            </button>
          </div>

          {/* Right: Ambient Lighting & Compass Group */}
          <div className="flex items-center justify-between sm:justify-end gap-3">
            {/* Lighting Selection */}
            <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800/80">
              <button
                onClick={() => setLightingMode('day')}
                className={`p-1.5 rounded-lg transition-all ${
                  lightingMode === 'day'
                    ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 font-bold shadow-sm border border-amber-200/50 dark:border-amber-900/30'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                }`}
                title="☀️ Daylight Theme"
              >
                <Sun className="w-4 h-4" />
              </button>
              <button
                onClick={() => setLightingMode('sunset')}
                className={`p-1.5 rounded-lg transition-all ${
                  lightingMode === 'sunset'
                    ? 'bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 font-bold shadow-sm border border-orange-200/50 dark:border-orange-900/30'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                }`}
                title="🌅 Sunset Theme"
              >
                <Sunrise className="w-4 h-4" />
              </button>
              <button
                onClick={() => setLightingMode('night')}
                className={`p-1.5 rounded-lg transition-all ${
                  lightingMode === 'night'
                    ? 'bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold shadow-sm border border-indigo-200/50 dark:border-indigo-900/30'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                }`}
                title="🌙 Night Spotlight Theme"
              >
                <Moon className="w-4 h-4" />
              </button>
            </div>

            {/* Compass Facing pill */}
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-200 py-1.5 px-3 rounded-xl border border-slate-200 dark:border-slate-800/80 text-xs font-bold whitespace-nowrap">
              <Compass className="w-4 h-4 text-blue-500" />
              <span className="uppercase">Facing: {layout.facing || 'EAST'}</span>
            </div>
          </div>
        </div>

        {/* Large, Clear, and Unobstructed Canvas Container */}
        <div ref={containerRef} className="relative w-full flex-1 min-h-[650px] sm:min-h-[700px] md:min-h-[750px] lg:min-h-[800px] xl:min-h-[850px] overflow-hidden bg-slate-100 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner">
          {/* 3D Canvas rendering node */}
          <canvas
            id="three-naqsha-canvas"
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onContextMenu={(e) => e.preventDefault()}
            className={`absolute inset-0 w-full h-full block transition-colors duration-200 touch-none ${
              isWalkthrough
                ? 'cursor-default'
                : controlMode === 'pan'
                ? 'cursor-move'
                : isRotating
                ? 'cursor-grabbing'
                : 'cursor-grab'
            }`}
          />

          {/* Top-Center Floating CAD/Figma-Style Control Toolbar */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center bg-white/95 dark:bg-slate-900/95 p-1 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800/80 gap-1 overflow-x-auto max-w-[90%] scrollbar-none">
            {/* Perspective Camera Mode */}
            <button
              onClick={() => {
                setProjectionType('perspective');
                setIsWalkthrough(false);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                projectionType === 'perspective' && !isWalkthrough
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
              title="Orbiting 3D Perspective Camera"
            >
              <Box className="w-3.5 h-3.5" />
              <span className="hidden md:inline">3D Perspective</span>
            </button>

            {/* Flat Orthogonal Top-Down Blueprint Mode */}
            <button
              onClick={() => {
                setProjectionType('top');
                setIsWalkthrough(false);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                projectionType === 'top' && !isWalkthrough
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
              title="2D Orthographic Top-Down Layout"
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Top Down (2D)</span>
            </button>

            {/* Front Elevation Mode */}
            <button
              onClick={() => {
                setProjectionType('elevation');
                setIsWalkthrough(false);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                projectionType === 'elevation' && !isWalkthrough
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
              title="2D Front Building Elevation View"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Front Elevation</span>
            </button>

            {/* Immersive Walkthrough Mode */}
            <button
              onClick={() => {
                const nextState = !isWalkthrough;
                setIsWalkthrough(nextState);
                if (nextState) {
                  setProjectionType('perspective');
                  setWtX(layout.width / 2);
                  setWtY(layout.length / 2);
                  setWtYaw(0);
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                isWalkthrough
                  ? 'bg-indigo-600 text-white shadow-sm animate-pulse'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
              title="First-Person Room Walkthrough (WASD / Keyboard Arrows)"
            >
              <Compass className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: isWalkthrough ? '3s' : '0s' }} />
              <span>Walkthrough</span>
            </button>

            <div className="w-px h-5 bg-slate-200 dark:bg-slate-800 mx-1" />

            {/* Roof visibility toggle */}
            <button
              onClick={() => setShowRoof(!showRoof)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                showRoof
                  ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/30'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
              title="Toggle Concrete/Slate Roof Slab Visibility"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Roof</span>
            </button>

            {/* Furniture layout toggle */}
            <button
              onClick={() => setShowFurniture(!showFurniture)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                showFurniture
                  ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/30'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
              title="Show or Hide Auto-Furnished 3D Items"
            >
              <Sofa className="w-3.5 h-3.5" />
              <span>Furniture</span>
            </button>
          </div>

          {/* Custom Informative Tips (e.g. Orbit instruction or Walkthrough controller tips) */}
          {!isWalkthrough && (
            <div className="absolute bottom-4 left-4 z-10 flex items-center space-x-2 text-[10px] font-bold uppercase tracking-wider bg-white/95 dark:bg-slate-900/95 text-slate-600 dark:text-slate-300 py-1.5 px-3 rounded-full shadow border border-slate-150 dark:border-slate-800 pointer-events-none select-none">
              <RotateCw className="w-3.5 h-3.5 text-blue-500 animate-spin" style={{ animationDuration: '6s' }} />
              <span>{controlMode === 'pan' ? 'Drag to Pan' : 'Drag to Orbit | Scroll to Zoom'}</span>
            </div>
          )}

          {/* Minimal 3D Control Toolbar - Bottom-Right Corner */}
          <div className="absolute bottom-4 right-4 z-10 flex flex-col space-y-1.5 bg-white/95 dark:bg-slate-900/95 p-1 rounded-2xl shadow-md border border-slate-200 dark:border-slate-800">
            {/* Grab / Pan toggle */}
            {!isWalkthrough && (
              <button
                onClick={() => setControlMode(controlMode === 'orbit' ? 'pan' : 'orbit')}
                className={`p-2 rounded-xl transition ${
                  controlMode === 'pan'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                }`}
                title={controlMode === 'pan' ? "Switch to Orbit Tool" : "Switch to Pan Tool (Hold Shift to pan anytime)"}
              >
                <Hand className="w-4 h-4" />
              </button>
            )}

            {/* Zoom In */}
            <button
              onClick={() => setZoom3d((prev) => Math.min(prev + 0.15, 3.5))}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl transition"
              title="Zoom In 3D (Scroll Up)"
            >
              <ZoomIn className="w-4 h-4" />
            </button>

            {/* Zoom Out */}
            <button
              onClick={() => setZoom3d((prev) => Math.max(prev - 0.15, 0.4))}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl transition"
              title="Zoom Out 3D (Scroll Down)"
            >
              <ZoomOut className="w-4 h-4" />
            </button>

            {/* Reset View */}
            <button
              onClick={() => {
                setYaw(45);
                setPitch(55);
                setZoom3d(1.2);
                setPanX(0);
                setPanY(0);
              }}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl transition text-[9px] font-extrabold font-mono"
              title="Reset Camera Position & Rotation"
            >
              RESET
            </button>

            {/* Snapshot */}
            <button
              onClick={handleDownload3D}
              className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition flex items-center justify-center shadow"
              title="Capture High-Res 3D Blueprint Screenshot"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>
        </div>

        {isWalkthrough && (
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md flex flex-col md:flex-row items-center justify-between gap-4 animate-in slide-in-from-bottom-5 duration-300 pointer-events-auto">
            {/* Left side: Header / Compass info */}
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl text-indigo-600 dark:text-indigo-400">
                <Compass className="w-5 h-5 animate-spin" style={{ animationDuration: '4s' }} />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">First-Person Walkthrough Controller</h4>
                <div className="text-[11px] font-mono text-slate-400 dark:text-slate-500 mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <span>POS: <strong className="text-slate-700 dark:text-slate-300">{wtX.toFixed(1)}ft</strong>, <strong className="text-slate-700 dark:text-slate-300">{wtY.toFixed(1)}ft</strong></span>
                  <span className="text-slate-300 dark:text-slate-700">|</span>
                  <span>DIR: <strong className="text-slate-700 dark:text-slate-300">{wtYaw}°</strong> ({wtYaw < 45 || wtYaw >= 315 ? 'EAST' : wtYaw < 135 ? 'NORTH' : wtYaw < 225 ? 'WEST' : 'SOUTH'})</span>
                </div>
              </div>
            </div>

            {/* Middle: Controller Controls */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Move Forward */}
              <button
                onClick={() => moveForward(1.5)}
                className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 rounded-xl transition font-bold text-xs border border-indigo-100/50 dark:border-indigo-900/30 active:scale-95 cursor-pointer"
                title="Move Forward (W or Up Arrow)"
              >
                <MoveUp className="w-3.5 h-3.5" />
                <span>Forward</span>
              </button>

              {/* Move Backward */}
              <button
                onClick={() => moveForward(-1.5)}
                className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 rounded-xl transition font-bold text-xs border border-indigo-100/50 dark:border-indigo-900/30 active:scale-95 cursor-pointer"
                title="Move Backward (S or Down Arrow)"
              >
                <MoveDown className="w-3.5 h-3.5" />
                <span>Backward</span>
              </button>

              {/* Look Left */}
              <button
                onClick={() => setWtYaw((prev) => (prev - 15 + 360) % 360)}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-700/80 text-slate-600 dark:text-slate-300 rounded-xl transition font-bold text-xs border border-slate-200/50 dark:border-slate-700/30 active:scale-95 cursor-pointer"
                title="Turn Left (Arrow Left)"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Turn Left</span>
              </button>

              {/* Look Right */}
              <button
                onClick={() => setWtYaw((prev) => (prev + 15) % 360)}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-700/80 text-slate-600 dark:text-slate-300 rounded-xl transition font-bold text-xs border border-slate-200/50 dark:border-slate-700/30 active:scale-95 cursor-pointer"
                title="Turn Right (Arrow Right)"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Turn Right</span>
              </button>

              <span className="hidden xl:inline text-[10px] font-mono text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-950 px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800">
                WASD / Arrows Supported
              </span>
            </div>

            {/* Right: Exit Button */}
            <button
              onClick={() => setIsWalkthrough(false)}
              className="py-2 px-4 bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm border border-rose-500/20 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Exit Walkthrough</span>
            </button>
          </div>
        )}
      </div>

      {/* Right Column: High Fidelity Materials Sidebar */}
      <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex flex-col h-[400px] lg:h-[600px] overflow-hidden">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-blue-50 dark:bg-blue-950/40 rounded-lg text-blue-600 dark:text-blue-400">
              <Brush className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">3D Design Suite</h3>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">Styling & photorealistic look</p>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
          </div>
        </div>

        {/* Sidebar Tabs */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 p-1 bg-slate-50/50 dark:bg-slate-900/10">
          <button
            onClick={() => setSidebarTab('styling')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              sidebarTab === 'styling'
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200/50 dark:border-slate-700/50'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Brush className="w-3.5 h-3.5" />
            Interior Styling
          </button>
          <button
            onClick={() => setSidebarTab('exterior_render')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              sidebarTab === 'exterior_render'
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200/50 dark:border-slate-700/50'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            Realistic Exterior Look
          </button>
        </div>

        {sidebarTab === 'styling' ? (
          <>
            {/* Auto-Furnish Suite */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/10 space-y-2.5">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Auto-Furnish Suite
              </h4>
              <p className="text-[10px] text-slate-400 dark:text-slate-500">Arrange 3D furniture models logically</p>
            </div>
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${layout.autoFurnished ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
              {layout.autoFurnished ? 'FURNISHED' : 'EMPTY'}
            </span>
          </div>

          <div className="flex gap-2">
            {!layout.autoFurnished ? (
              <button
                onClick={handleAutoFurnish}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-xs py-2 px-3 rounded-xl shadow-sm hover:shadow transition flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 animate-bounce" />
                Auto-Furnish Rooms
              </button>
            ) : (
              <>
                <button
                  onClick={handleAutoFurnish}
                  className="flex-1 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-semibold text-xs py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 border border-blue-100 dark:border-blue-900/50"
                  title="Re-run furnishing logic with spatial solvers"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Rearrange
                </button>
                <button
                  onClick={handleClearFurnish}
                  className="flex-1 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/60 text-red-700 dark:text-red-300 font-semibold text-xs py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 border border-red-100 dark:border-red-900/50"
                  title="Remove all furnishings from 3D models"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear
                </button>
              </>
            )}
          </div>
        </div>

        {/* Room selection area */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <LayoutGrid className="w-3.5 h-3.5" /> Target Room
            </span>
            {selectedRoomId !== 'all' && (
              <button
                onClick={() => setSelectedRoomId('all')}
                className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                Apply to All
              </button>
            )}
          </div>

          <select
            value={selectedRoomId || 'all'}
            onChange={(e) => setSelectedRoomId(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">🌐 All Rooms (Global Override)</option>
            {layout.rooms
              .filter((r) => r.type !== 'lawn')
              .map((r) => (
                <option key={r.id} value={r.id}>
                  🚪 {r.name || r.type.toUpperCase()} ({r.width} × {r.height} {layout.unit})
                </option>
              ))}
          </select>

          <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-normal">
            💡 <span className="font-semibold text-slate-500 dark:text-slate-400">Tip:</span> You can also click directly on any room inside the 3D viewport above to select it!
          </p>
        </div>

        {/* Surface category segmented controller */}
        <div className="px-4 pt-4 bg-white dark:bg-slate-950 flex">
          <div className="flex w-full bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('floor')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'floor'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Floor Surface
            </button>
            <button
              onClick={() => setActiveTab('wall')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'wall'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <Paintbrush className="w-3.5 h-3.5" />
              Wall Coating
            </button>
          </div>
        </div>

        {/* Materials List Scroller */}
        <div className="flex-1 p-4 overflow-y-auto space-y-2 bg-white dark:bg-slate-950">
          {(activeTab === 'floor' ? FLOOR_MATERIALS : WALL_MATERIALS).map((material) => {
            // Determine if active for current selected room / target
            let isActive = false;
            if (selectedRoomId === 'all') {
              // Check if all non-lawn rooms have this material
              const targetRooms = layout.rooms.filter(r => r.type !== 'lawn');
              isActive = targetRooms.length > 0 && targetRooms.every(r => 
                (activeTab === 'floor' ? r.floorMaterial : r.wallMaterial) === material.id
              );
            } else {
              const currentRoom = layout.rooms.find(r => r.id === selectedRoomId);
              isActive = !!currentRoom && (activeTab === 'floor' ? currentRoom.floorMaterial : currentRoom.wallMaterial) === material.id;
            }

            return (
              <button
                key={material.id}
                onClick={() => applyMaterial(material.id)}
                className={`w-full flex items-center space-x-3 p-2.5 rounded-xl border text-left transition ${
                  isActive
                    ? 'border-blue-500 bg-blue-50/30 dark:bg-blue-950/20 shadow-sm'
                    : 'border-slate-100 dark:border-slate-900 hover:border-slate-200 dark:hover:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-900/50'
                }`}
              >
                {/* Visual Swatch */}
                <div
                  className="w-10 h-10 rounded-lg relative overflow-hidden flex-shrink-0 shadow-inner border border-slate-200/50 dark:border-slate-700"
                  style={{ backgroundColor: material.color }}
                >
                  {/* Miniature pattern overlay */}
                  {material.pattern === 'wood' && (
                    <div className="absolute inset-0 opacity-20 flex justify-between px-1">
                      <div className="w-0.5 h-full bg-black"></div>
                      <div className="w-0.5 h-full bg-black"></div>
                      <div className="w-0.5 h-full bg-black"></div>
                    </div>
                  )}
                  {material.pattern === 'tile' && (
                    <div className="absolute inset-0 opacity-25 border-t border-b border-l border-r border-black grid grid-cols-2 grid-rows-2">
                      <div className="border-r border-b border-black"></div>
                      <div className="border-b border-black"></div>
                    </div>
                  )}
                  {material.pattern === 'brick' && (
                    <div className="absolute inset-0 opacity-20 flex flex-col justify-around">
                      <div className="h-0.5 bg-black w-full"></div>
                      <div className="h-0.5 bg-black w-full"></div>
                    </div>
                  )}
                  {material.pattern === 'marble' && (
                    <div className="absolute inset-0 opacity-30">
                      <svg viewBox="0 0 100 100" className="w-full h-full stroke-black fill-none stroke-1">
                        <path d="M10,20 Q50,40 90,30 T10,80" />
                      </svg>
                    </div>
                  )}
                  {material.pattern === 'wallpaper' && (
                    <div className="absolute inset-0 opacity-30 flex items-center justify-center">
                      <div className="w-4 h-4 border border-black rotate-45"></div>
                    </div>
                  )}
                </div>

                {/* Swatch details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-xs truncate">
                      {material.name}
                    </span>
                    {isActive && (
                      <Check className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 block truncate">
                    {material.description}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Sidebar Footer: Reset button */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex space-x-2">
          <button
            onClick={resetMaterial}
            className="flex-1 py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-[11px] font-bold flex items-center justify-center gap-1.5"
          >
            <Undo2 className="w-3.5 h-3.5" />
            Reset Custom Style
          </button>
        </div>
          </>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col bg-white dark:bg-slate-950">
            {/* Visual Frame */}
            <div className="relative group rounded-2xl overflow-hidden border border-slate-250 dark:border-slate-800 shadow-md">
              <img
                src={exteriorRenderImg}
                alt="Modern Villa Realistic Exterior Render"
                className="w-full aspect-[4/3] object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-4 flex flex-col justify-end">
                <span className="text-[10px] font-extrabold text-blue-400 tracking-widest uppercase mb-1">
                  CONCEPTUAL ELEVATION
                </span>
                <h4 className="text-white font-bold text-sm leading-tight shadow-sm">
                  Smart Premium Villa Render
                </h4>
              </div>
            </div>

            {/* Design Spec Detail Grid */}
            <div className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Villa Style
                </span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  Ultra-Modern Eco-Smart
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Plot Dimensions
                </span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  {layout.width}ft × {layout.length}ft
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Sun Facing Direction
                </span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1">
                  <Compass className="w-3.5 h-3.5 text-blue-500" />
                  {layout.facing || 'EAST'}
                </span>
              </div>
              <div className="flex items-center justify-between pb-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Building Material Base
                </span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  Sandstone & Cedar Siding
                </span>
              </div>
            </div>

            {/* Architectural Blurb */}
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed bg-blue-50/20 dark:bg-blue-950/10 p-3 rounded-xl border border-blue-100/30 dark:border-blue-900/20">
              🏡 <span className="font-semibold text-slate-700 dark:text-slate-300">How the building will look:</span> This high-fidelity model showcases your customized double-story structure, fitted with natural cedar wall sidings, high-performance thermal insulation glass, modern flat concrete roof layout with embedded solar collectors, and custom landscaping matching your plot shape.
            </p>

            {/* Download Button */}
            <div className="pt-2">
              <button
                onClick={handleDownloadExterior}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-3 px-4 rounded-xl shadow-md transition flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download HD Architectural Render
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
