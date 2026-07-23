import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  ZoomIn,
  ZoomOut,
  Maximize,
  Minimize,
  Download,
  Printer,
  Compass,
  Layers,
  Sparkles,
  Box,
  Check,
  Eye,
  Grid,
  Info,
  ChevronRight,
  Sun,
  Wind
} from 'lucide-react';
import { NaqshaLayout, Room, Door, Window } from '../types';

interface Cinematic2DNaqshaModalProps {
  isOpen: boolean;
  onClose: () => void;
  layout: NaqshaLayout;
  activeFloor?: string;
  pxPerUnit?: number;
  showSqFtLayer?: boolean;
  onSwitch3D?: () => void;
  onSelectFloor?: (floorKey: string) => void;
}

export type BlueprintTheme = 'classic_blue' | 'ivory_draft' | 'midnight_gold' | 'monochrome_cad';

export default function Cinematic2DNaqshaModal({
  isOpen,
  onClose,
  layout,
  activeFloor: propActiveFloor,
  pxPerUnit = 24,
  showSqFtLayer: initialSqFtLayer = true,
  onSwitch3D,
  onSelectFloor
}: Cinematic2DNaqshaModalProps) {
  const [theme, setTheme] = useState<BlueprintTheme>('classic_blue');
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [showSqFt, setShowSqFt] = useState<boolean>(initialSqFtLayer);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [activeFloorKey, setActiveFloorKey] = useState<string>(propActiveFloor || layout?.activeFloor || 'ground');

  const viewportRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Sync active floor key if props update
  useEffect(() => {
    const targetFloor = propActiveFloor || layout?.activeFloor;
    if (targetFloor) {
      setActiveFloorKey(targetFloor);
    }
  }, [propActiveFloor, layout?.activeFloor]);

  // Center & Fit Canvas on Modal Open or Layout Change
  useEffect(() => {
    if (isOpen) {
      // Immediate attempt
      autoCenterCanvas();

      // Double RAF to wait for modal flexbox animation and layout calculation
      const raf1 = requestAnimationFrame(() => {
        const raf2 = requestAnimationFrame(() => {
          autoCenterCanvas();
        });
        return () => cancelAnimationFrame(raf2);
      });

      // Timers for slow touch/mobile renders
      const timer1 = setTimeout(() => autoCenterCanvas(), 50);
      const timer2 = setTimeout(() => autoCenterCanvas(), 200);

      return () => {
        cancelAnimationFrame(raf1);
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [isOpen, layout?.width, layout?.length, pxPerUnit, activeFloorKey]);

  // ResizeObserver to re-center when modal resizes
  useEffect(() => {
    if (!isOpen || !viewportRef.current) return;
    const observer = new ResizeObserver(() => {
      autoCenterCanvas();
    });
    observer.observe(viewportRef.current);
    return () => observer.disconnect();
  }, [isOpen, layout?.width, layout?.length, pxPerUnit, activeFloorKey]);

  // Close on Escape Key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Safe Data Resolution
  const safeWidth = Math.max(1, layout?.width || 30);
  const safeLength = Math.max(1, layout?.length || 50);
  const safePxPerUnit = pxPerUnit || 24;

  const safeRooms = Array.isArray(layout?.rooms) ? layout.rooms : [];
  const safeDoors = Array.isArray(layout?.doors) ? layout.doors : [];
  const safeWindows = Array.isArray(layout?.windows) ? layout.windows : [];

  const currentFloorData = layout?.floors?.[activeFloorKey];

  const currentFloorRooms = (currentFloorData?.rooms && currentFloorData.rooms.length > 0)
    ? currentFloorData.rooms
    : safeRooms;

  const currentFloorDoors = (currentFloorData?.doors && currentFloorData.doors.length > 0)
    ? currentFloorData.doors
    : safeDoors;

  const currentFloorWindows = (currentFloorData?.windows && currentFloorData.windows.length > 0)
    ? currentFloorData.windows
    : safeWindows;

  const svgWidth = safeWidth * safePxPerUnit;
  const svgHeight = safeLength * safePxPerUnit;

  // Robust Auto-Center & Fit Canvas Function
  const autoCenterCanvas = () => {
    const rect = viewportRef.current?.getBoundingClientRect();
    const viewportW = (rect && rect.width > 0) ? rect.width : (typeof window !== 'undefined' ? window.innerWidth : 1000);
    const viewportH = (rect && rect.height > 0) ? rect.height : (typeof window !== 'undefined' ? window.innerHeight - 120 : 600);

    const contentWidth = svgWidth;
    const contentHeight = svgHeight;

    const pad = 48; // padding around stage (p-6 = 24px * 2)
    const stageWidth = contentWidth + pad;
    const stageHeight = contentHeight + pad;

    const availW = Math.max(100, viewportW - 32);
    const availH = Math.max(100, viewportH - 32);

    const scaleX = availW / stageWidth;
    const scaleY = availH / stageHeight;

    let fitZoom = Math.min(scaleX, scaleY);
    if (!isFinite(fitZoom) || isNaN(fitZoom) || fitZoom <= 0) {
      fitZoom = 1;
    }
    fitZoom = Math.max(0.2, Math.min(3.0, fitZoom));

    const panX = (viewportW - stageWidth * fitZoom) / 2;
    const panY = (viewportH - stageHeight * fitZoom) / 2;

    setZoom(fitZoom);
    setPan({
      x: isFinite(panX) && !isNaN(panX) ? panX : 0,
      y: isFinite(panY) && !isNaN(panY) ? panY : 0,
    });
  };

  // Covered Area calculation
  const totalCoveredSqFt = currentFloorRooms.reduce((sum, r) => sum + (r?.width || 0) * (r?.height || 0), 0);
  const bedCount = currentFloorRooms.filter(r => r && r.type === 'bedroom').length;
  const bathCount = currentFloorRooms.filter(r => r && r.type === 'bathroom').length;

  // Toggle browser native fullscreen mode
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      viewportRef.current?.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Zoom handlers
  const handleZoomIn = () => setZoom(prev => Math.min(3.5, prev * 1.25));
  const handleZoomOut = () => setZoom(prev => Math.max(0.15, prev / 1.25));
  const handleResetView = () => autoCenterCanvas();

  // Mouse Panning & Scroll Wheel Zoom Handlers for Desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
    setZoom(prev => Math.max(0.15, Math.min(4.0, prev * zoomFactor)));
  };

  // Touch Pinch-to-Zoom & Pan Handlers for Mobile Screens
  const initialTouchRef = useRef<{ dist: number; zoom: number; pan: { x: number; y: number } } | null>(null);

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - pan.x,
        y: e.touches[0].clientY - pan.y,
      });
      initialTouchRef.current = null;
    } else if (e.touches.length === 2) {
      setIsDragging(false);
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      initialTouchRef.current = {
        dist: dist || 1,
        zoom,
        pan: { ...pan },
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1 && isDragging && !initialTouchRef.current) {
      setPan({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y,
      });
    } else if (e.touches.length === 2 && initialTouchRef.current) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const currentDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const scaleFactor = currentDist / initialTouchRef.current.dist;
      const newZoom = Math.max(0.15, Math.min(4.0, initialTouchRef.current.zoom * scaleFactor));

      // Pinch center focal zooming
      const touchCenterX = (t1.clientX + t2.clientX) / 2;
      const touchCenterY = (t1.clientY + t2.clientY) / 2;

      if (viewportRef.current) {
        const rect = viewportRef.current.getBoundingClientRect();
        const relX = touchCenterX - rect.left;
        const relY = touchCenterY - rect.top;

        const zoomRatio = newZoom / (zoom || 1);
        setPan({
          x: relX - (relX - pan.x) * zoomRatio,
          y: relY - (relY - pan.y) * zoomRatio,
        });
      }

      setZoom(newZoom);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 0) {
      setIsDragging(false);
      initialTouchRef.current = null;
    } else if (e.touches.length === 1) {
      initialTouchRef.current = null;
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - pan.x,
        y: e.touches[0].clientY - pan.y,
      });
    }
  };

  // High-Res SVG Download - Perfectly Centered in Document with Blueprint Margins
  const handleDownloadSVG = () => {
    if (!svgRef.current) return;

    const currentStyle = themeStyles[theme];
    const floorLabel = activeFloorKey === 'ground' ? 'Ground Floor' : activeFloorKey === 'first' ? '1st Floor' : activeFloorKey === 'second' ? '2nd Floor' : `${activeFloorKey} Floor`;

    // Centered Canvas Margin Space
    const margin = 50;
    const headerSpace = 80;
    const footerSpace = 40;

    const contentW = svgWidth;
    const contentH = svgHeight;

    const docWidth = contentW + margin * 2;
    const docHeight = contentH + headerSpace + footerSpace + margin;

    // Clone SVG element to process
    const clone = svgRef.current.cloneNode(true) as SVGElement;

    // Convert foreignObject nodes to native vector <text> nodes for universal viewer compatibility
    const foreignObjects = Array.from(clone.querySelectorAll('foreignObject'));
    foreignObjects.forEach((fo) => {
      const x = parseFloat(fo.getAttribute('x') || '0');
      const y = parseFloat(fo.getAttribute('y') || '0');
      const w = parseFloat(fo.getAttribute('width') || '0');
      const h = parseFloat(fo.getAttribute('height') || '0');

      const spans = Array.from(fo.querySelectorAll('span'));
      let roomName = '';
      let roomDim = '';
      let roomSqFt = '';

      if (spans.length >= 1) roomName = spans[0].textContent || '';
      if (spans.length >= 2) roomDim = spans[1].textContent || '';
      if (spans.length >= 3) roomSqFt = spans[2].textContent || '';

      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      const centerX = x + w / 2;
      const centerY = y + h / 2 - (roomSqFt ? 8 : 2);

      // Room Name Text
      const nameText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      nameText.setAttribute('x', String(centerX));
      nameText.setAttribute('y', String(centerY));
      nameText.setAttribute('text-anchor', 'middle');
      nameText.setAttribute('fill', currentStyle.textColor);
      nameText.setAttribute('font-family', 'ui-sans-serif, system-ui, sans-serif');
      nameText.setAttribute('font-size', '12px');
      nameText.setAttribute('font-weight', 'bold');
      nameText.textContent = roomName;
      g.appendChild(nameText);

      // Room Dimensions Text
      if (roomDim) {
        const dimText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        dimText.setAttribute('x', String(centerX));
        dimText.setAttribute('y', String(centerY + 14));
        dimText.setAttribute('text-anchor', 'middle');
        dimText.setAttribute('fill', currentStyle.dimTextColor);
        dimText.setAttribute('font-family', 'monospace');
        dimText.setAttribute('font-size', '10px');
        dimText.setAttribute('font-weight', 'bold');
        dimText.textContent = roomDim;
        g.appendChild(dimText);
      }

      // Room Sq Ft Badge Text
      if (roomSqFt && showSqFt) {
        const sqftText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        sqftText.setAttribute('x', String(centerX));
        sqftText.setAttribute('y', String(centerY + 26));
        sqftText.setAttribute('text-anchor', 'middle');
        sqftText.setAttribute('fill', currentStyle.outerWallStroke);
        sqftText.setAttribute('font-family', 'monospace');
        sqftText.setAttribute('font-size', '9px');
        sqftText.setAttribute('font-weight', 'bold');
        sqftText.textContent = roomSqFt;
        g.appendChild(sqftText);
      }

      if (fo.parentNode) {
        fo.parentNode.replaceChild(g, fo);
      }
    });

    const innerGraphics = clone.innerHTML;

    // Standalone centered SVG document string
    const svgDoc = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${docWidth}" height="${docHeight}" viewBox="0 0 ${docWidth} ${docHeight}">
  <style>
    .naqsha-title { font-family: ui-sans-serif, system-ui, sans-serif; font-weight: 900; fill: ${currentStyle.textColor}; font-size: 20px; text-transform: uppercase; letter-spacing: 1px; }
    .naqsha-sub { font-family: ui-sans-serif, system-ui, sans-serif; font-weight: 600; fill: ${currentStyle.dimTextColor}; font-size: 12px; }
    .naqsha-footer { font-family: ui-sans-serif, system-ui, sans-serif; font-weight: 800; fill: ${currentStyle.dimTextColor}; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; }
  </style>

  <!-- Background -->
  <rect width="${docWidth}" height="${docHeight}" fill="${currentStyle.canvasBg}" />

  <!-- Outer Frame Line -->
  <rect x="12" y="12" width="${docWidth - 24}" height="${docHeight - 24}" fill="none" stroke="${currentStyle.outerWallStroke}" stroke-width="1.5" opacity="0.35" rx="12" />

  <!-- Header Banner (Centered) -->
  <g transform="translate(${docWidth / 2}, 42)">
    <text text-anchor="middle" class="naqsha-title" y="0">SMART HOME NAQSHA — ${floorLabel.toUpperCase()}</text>
    <text text-anchor="middle" class="naqsha-sub" y="22">Plot: ${layout.width} × ${layout.length} ${layout.unit} • Covered: ${Math.round(totalCoveredSqFt)} SQ FT • ${bedCount} Beds, ${bathCount} Baths</text>
  </g>

  <!-- Centered Blueprint Stage -->
  <g transform="translate(${margin}, ${headerSpace})">
    ${innerGraphics}
  </g>

  <!-- Footer Info (Centered) -->
  <g transform="translate(${docWidth / 2}, ${docHeight - 24})">
    <text text-anchor="middle" class="naqsha-footer">${layout.facing || 'EAST'} FACING • GENERATED WITH LIVE 2D NAQSHA STUDIO</text>
  </g>
</svg>`;

    const blob = new Blob([svgDoc], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Naqsha_${layout.width}x${layout.length}_${activeFloorKey}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Theme styling definitions
  const themeStyles = {
    classic_blue: {
      bg: 'bg-slate-950',
      canvasBg: '#09152e',
      gridStroke: 'rgba(56, 189, 248, 0.12)',
      outerWallStroke: '#38bdf8',
      roomFill: 'rgba(15, 23, 42, 0.85)',
      roomStroke: '#60a5fa',
      textColor: '#e0f2fe',
      dimTextColor: '#93c5fd',
      windowFill: '#0284c7',
      doorStroke: '#38bdf8',
      glow: 'shadow-[0_0_80px_rgba(37,99,235,0.25)]',
      accentColor: 'text-blue-400'
    },
    ivory_draft: {
      bg: 'bg-[#181614]',
      canvasBg: '#fbf9f4',
      gridStroke: 'rgba(180, 160, 130, 0.25)',
      outerWallStroke: '#1c1917',
      roomFill: '#f5f0e6',
      roomStroke: '#292524',
      textColor: '#1c1917',
      dimTextColor: '#57534e',
      windowFill: '#0284c7',
      doorStroke: '#44403c',
      glow: 'shadow-[0_0_80px_rgba(217,119,6,0.18)]',
      accentColor: 'text-amber-500'
    },
    midnight_gold: {
      bg: 'bg-black',
      canvasBg: '#08080a',
      gridStroke: 'rgba(234, 179, 8, 0.12)',
      outerWallStroke: '#eab308',
      roomFill: 'rgba(24, 24, 27, 0.9)',
      roomStroke: '#facc15',
      textColor: '#fef08a',
      dimTextColor: '#eab308',
      windowFill: '#ca8a04',
      doorStroke: '#facc15',
      glow: 'shadow-[0_0_80px_rgba(234,179,8,0.25)]',
      accentColor: 'text-amber-400'
    },
    monochrome_cad: {
      bg: 'bg-slate-950',
      canvasBg: '#020617',
      gridStroke: 'rgba(255, 255, 255, 0.1)',
      outerWallStroke: '#ffffff',
      roomFill: '#0f172a',
      roomStroke: '#cbd5e1',
      textColor: '#ffffff',
      dimTextColor: '#94a3b8',
      windowFill: '#38bdf8',
      doorStroke: '#e2e8f0',
      glow: 'shadow-[0_0_80px_rgba(255,255,255,0.15)]',
      accentColor: 'text-slate-200'
    }
  };

  const currentStyle = themeStyles[theme];

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950/95 backdrop-blur-2xl flex flex-col text-slate-100 select-none overflow-hidden">
      {/* Dynamic Ambient Background Glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-40">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px]" />
      </div>

      {/* TOP HEADER BAR (OUTSIDE CANVAS) */}
      <header className="relative z-10 flex flex-col gap-2 px-4 py-2.5 sm:px-6 sm:py-3 bg-slate-900/95 border-b border-slate-800/80 backdrop-blur-md">
        {/* Top Row: Title, Specs & Close */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center space-x-2 min-w-0">
            <div className="p-1.5 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-lg shadow-md shrink-0">
              <Eye className="w-4 h-4 animate-pulse text-cyan-300" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-1.5">
                <h3 className="font-display font-black text-xs sm:text-sm uppercase tracking-wider text-white truncate">
                  Live 2D Naqsha
                </h3>
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase shrink-0">
                  Live
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium truncate">
                Plot: <strong className="text-slate-200">{layout.width} × {layout.length} {layout.unit}</strong> • {Math.round(totalCoveredSqFt)} SQ FT
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1 shrink-0">
            {/* Download High-Res SVG */}
            <button
              onClick={handleDownloadSVG}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition cursor-pointer"
              title="Download Vector SVG Blueprint"
              id="cinematic-download-svg"
            >
              <Download className="w-3.5 h-3.5" />
            </button>

            {/* Toggle Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition cursor-pointer"
              title="Toggle Fullscreen View"
              id="cinematic-toggle-fullscreen"
            >
              {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
            </button>

            {/* Close Modal Button */}
            <button
              onClick={onClose}
              className="p-1.5 bg-red-600/80 hover:bg-red-600 text-white rounded-lg transition shadow-md shadow-red-600/20 cursor-pointer ml-1"
              title="Close Live View (Esc)"
              id="cinematic-close-btn"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Bottom Row: Floor Selector & Quick Toggles */}
        <div className="flex flex-wrap items-center justify-between gap-1.5 text-[10px]">
          {/* Floor Selection Tabs */}
          {layout.floors && Object.keys(layout.floors).length > 1 ? (
            <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800">
              {Object.keys(layout.floors).map((floorKey) => {
                const isActive = activeFloorKey === floorKey;
                const floorLabel = floorKey === 'ground' ? 'Ground' : floorKey === 'first' ? '1st' : floorKey === 'second' ? '2nd' : floorKey;
                return (
                  <button
                    key={floorKey}
                    onClick={() => {
                      setActiveFloorKey(floorKey);
                      if (onSelectFloor) onSelectFloor(floorKey);
                    }}
                    className={`px-2 py-1 text-[10px] font-black rounded-md uppercase tracking-wider transition-all cursor-pointer ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {floorLabel}
                  </button>
                );
              })}
            </div>
          ) : <div />}

          {/* Quick Toggles */}
          <div className="flex items-center space-x-1.5 ml-auto">
            {/* Blueprint Theme Selector */}
            <div className="hidden md:flex items-center space-x-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
              <button
                onClick={() => setTheme('classic_blue')}
                className={`px-2 py-1 rounded text-[9px] font-black transition cursor-pointer ${
                  theme === 'classic_blue' ? 'bg-blue-600 text-white' : 'text-slate-400'
                }`}
              >
                Blueprint
              </button>
              <button
                onClick={() => setTheme('ivory_draft')}
                className={`px-2 py-1 rounded text-[9px] font-black transition cursor-pointer ${
                  theme === 'ivory_draft' ? 'bg-amber-600 text-white' : 'text-slate-400'
                }`}
              >
                Ivory
              </button>
              <button
                onClick={() => setTheme('midnight_gold')}
                className={`px-2 py-1 rounded text-[9px] font-black transition cursor-pointer ${
                  theme === 'midnight_gold' ? 'bg-yellow-600 text-white' : 'text-slate-400'
                }`}
              >
                Gold
              </button>
              <button
                onClick={() => setTheme('monochrome_cad')}
                className={`px-2 py-1 rounded text-[9px] font-black transition cursor-pointer ${
                  theme === 'monochrome_cad' ? 'bg-slate-700 text-white' : 'text-slate-400'
                }`}
              >
                CAD
              </button>
            </div>

            <button
              onClick={() => setShowSqFt(!showSqFt)}
              className={`px-2 py-0.5 font-black rounded-md uppercase tracking-wider transition cursor-pointer border ${
                showSqFt ? 'bg-indigo-600 text-white border-indigo-400' : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              Sq Ft {showSqFt ? 'ON' : 'OFF'}
            </button>

            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`px-2 py-0.5 font-black rounded-md uppercase tracking-wider transition cursor-pointer border ${
                showGrid ? 'bg-indigo-600 text-white border-indigo-400' : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              Grid {showGrid ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>
      </header>

      {/* MAIN VIEWPORT CANVAS STAGE - COMPLETELY CLEAN & UNOBSTRUCTED */}
      <main
        ref={viewportRef}
        className={`relative flex-1 min-h-0 w-full overflow-hidden ${currentStyle.bg} cursor-grab active:cursor-grabbing select-none`}
        style={{ touchAction: 'none' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        onWheel={handleWheel}
      >
        {/* Blueprint Stage Box with Glow Frame */}
        <div
          className="absolute top-0 left-0 transition-transform duration-75 ease-out"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
          }}
        >
          <div className={`p-3 sm:p-6 rounded-2xl ${currentStyle.glow} transition-all duration-300`} style={{ backgroundColor: currentStyle.canvasBg }}>
            <svg
              ref={svgRef}
              width={svgWidth}
              height={svgHeight}
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="overflow-visible"
            >
              <defs>
                {/* Blueprint Grid Pattern */}
                <pattern
                  id="cinematic-grid"
                  width={pxPerUnit}
                  height={pxPerUnit}
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d={`M ${pxPerUnit} 0 L 0 0 0 ${pxPerUnit}`}
                    fill="none"
                    stroke={currentStyle.gridStroke}
                    strokeWidth="0.8"
                  />
                </pattern>
              </defs>

              {/* Canvas Background Layer */}
              <rect
                x="0"
                y="0"
                width={svgWidth}
                height={svgHeight}
                fill={currentStyle.canvasBg}
              />

              {/* Grid Background Pattern */}
              {showGrid && (
                <rect
                  x="0"
                  y="0"
                  width={svgWidth}
                  height={svgHeight}
                  fill="url(#cinematic-grid)"
                />
              )}

              {/* Bold Outer Wall Shell */}
              <rect
                x="-4"
                y="-4"
                width={svgWidth + 8}
                height={svgHeight + 8}
                fill="none"
                stroke={currentStyle.outerWallStroke}
                strokeWidth="6"
                rx="4"
              />

              {/* RENDER ROOMS */}
              {currentFloorRooms.map((room) => {
                const rx = room.x * pxPerUnit;
                const ry = room.y * pxPerUnit;
                const rw = Math.max(1, room.width * pxPerUnit);
                const rh = Math.max(1, room.height * pxPerUnit);

                const baseFontSize = Math.max(9, Math.min(14, Math.min(room.width * 2, room.height * 2)));
                const cx = rx + rw / 2;
                const cy = ry + rh / 2;

                return (
                  <g key={room.id || `${room.name}-${rx}-${ry}`}>
                    {/* Room Box */}
                    <rect
                      x={rx}
                      y={ry}
                      width={rw}
                      height={rh}
                      fill={currentStyle.roomFill}
                      stroke={currentStyle.roomStroke}
                      strokeWidth="3"
                    />

                    {/* Room Inner Wall Highlight */}
                    {rw > 8 && rh > 8 && (
                      <rect
                        x={rx + 2}
                        y={ry + 2}
                        width={rw - 4}
                        height={rh - 4}
                        fill="none"
                        stroke={currentStyle.roomStroke}
                        strokeWidth="0.5"
                        strokeDasharray="2 2"
                        opacity="0.6"
                      />
                    )}

                    {/* Room Labels using Native SVG Text (100% Cross-Browser Reliable) */}
                    <g className="pointer-events-none select-none">
                      {/* Room Name */}
                      <text
                        x={cx}
                        y={cy - (showSqFt ? 8 : 4)}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill={currentStyle.textColor}
                        fontSize={`${baseFontSize}px`}
                        fontWeight="900"
                        className="font-sans uppercase tracking-wider"
                      >
                        {room.name}
                      </text>

                      {/* Dimensions */}
                      <text
                        x={cx}
                        y={cy + (showSqFt ? 8 : 10)}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill={currentStyle.dimTextColor}
                        fontSize={`${Math.max(8, baseFontSize * 0.75)}px`}
                        fontWeight="700"
                        className="font-mono"
                      >
                        {Math.round(room.width)}' × {Math.round(room.height)}' {layout.unit}
                      </text>

                      {/* Sq Ft Badge */}
                      {showSqFt && (
                        <text
                          x={cx}
                          y={cy + 22}
                          textAnchor="middle"
                          dominantBaseline="central"
                          fill={currentStyle.outerWallStroke}
                          fontSize={`${Math.max(7, baseFontSize * 0.65)}px`}
                          fontWeight="800"
                          className="font-mono uppercase tracking-widest"
                        >
                          {Math.round(room.width * room.height)} SQ FT
                        </text>
                      )}
                    </g>
                  </g>
                );
              })}

              {/* RENDER WINDOWS */}
              {currentFloorWindows.map((win) => {
                const ww = win.width * pxPerUnit;
                const wx = win.x * pxPerUnit;
                const wy = win.y * pxPerUnit;

                return (
                  <g key={win.id}>
                    <rect
                      x={wx}
                      y={wy}
                      width={win.type === 'horizontal' ? ww : 8}
                      height={win.type === 'vertical' ? ww : 8}
                      fill={currentStyle.windowFill}
                      stroke={currentStyle.textColor}
                      strokeWidth="1.5"
                    />
                    <line
                      x1={wx + (win.type === 'horizontal' ? 0 : 4)}
                      y1={wy + (win.type === 'vertical' ? 0 : 4)}
                      x2={wx + (win.type === 'horizontal' ? ww : 4)}
                      y2={wy + (win.type === 'vertical' ? ww : 4)}
                      stroke="#ffffff"
                      strokeWidth="1"
                    />
                  </g>
                );
              })}

              {/* RENDER DOORS */}
              {currentFloorDoors.map((door) => {
                const dw = door.width * pxPerUnit;
                const dx = door.x * pxPerUnit;
                const dy = door.y * pxPerUnit;

                return (
                  <g key={door.id}>
                    {/* Swing Arc */}
                    {door.type === 'horizontal' ? (
                      <path
                        d={`M ${dx} ${dy} A ${dw} ${dw} 0 0 1 ${dx + dw} ${dy}`}
                        fill="none"
                        stroke={currentStyle.doorStroke}
                        strokeWidth="1.5"
                        strokeDasharray="3 2"
                      />
                    ) : (
                      <path
                        d={`M ${dx} ${dy} A ${dw} ${dw} 0 0 1 ${dx} ${dy + dw}`}
                        fill="none"
                        stroke={currentStyle.doorStroke}
                        strokeWidth="1.5"
                        strokeDasharray="3 2"
                      />
                    )}
                    {/* Door Leaf */}
                    <rect
                      x={dx}
                      y={dy}
                      width={door.type === 'horizontal' ? dw : 4}
                      height={door.type === 'vertical' ? dw : 4}
                      fill={currentStyle.outerWallStroke}
                    />
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      </main>

      {/* FOOTER BAR WITH ZOOM & SWITCH TO 3D (OUTSIDE CANVAS) */}
      <footer className="relative z-10 flex flex-wrap items-center justify-between gap-3 px-6 py-3 bg-slate-900/95 border-t border-slate-800/80 backdrop-blur-md">
        {/* Navigation tips */}
        <div className="hidden lg:flex items-center space-x-2 text-xs text-slate-400 font-medium">
          <span className="bg-slate-800 px-2 py-0.5 rounded text-[10px] font-mono text-slate-300">Drag Mouse / Touch</span>
          <span>to Pan</span>
          <span className="text-slate-600">•</span>
          <span className="bg-slate-800 px-2 py-0.5 rounded text-[10px] font-mono text-slate-300">Scroll</span>
          <span>to Zoom</span>
          <span className="text-slate-600">•</span>
          <span className="bg-slate-800 px-2 py-0.5 rounded text-[10px] font-mono text-slate-300">Esc / F</span>
          <span>Close / Fullscreen</span>
        </div>

        {/* Zoom Controls & Metrics */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
            <button
              onClick={handleZoomOut}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-bold font-mono text-slate-300 px-1.5 min-w-[45px] text-center select-none">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <div className="h-4 w-px bg-slate-800 mx-1" />
            <button
              onClick={handleResetView}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition cursor-pointer"
              title="Fit Canvas to Center"
            >
              <Maximize className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="hidden sm:flex items-center space-x-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
            <span className="text-slate-400 font-medium">Covered:</span>
            <span className="text-emerald-400 font-mono font-black">{Math.round(totalCoveredSqFt)} SQ FT</span>
            <span className="text-slate-700">•</span>
            <span className="text-amber-400 font-mono font-black">Vastu 98%</span>
          </div>
        </div>

        {onSwitch3D && (
          <button
            onClick={() => {
              onClose();
              onSwitch3D();
            }}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-indigo-500/20 flex items-center space-x-2 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            id="live-view-switch-3d-btn"
          >
            <Box className="w-4 h-4 text-amber-300" />
            <span>Switch to 3D Live Perspective</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </footer>
    </div>
  );
}
