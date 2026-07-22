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
  const [activeFloorKey, setActiveFloorKey] = useState<string>(layout.activeFloor || 'ground');

  const viewportRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Sync active floor key if props update
  useEffect(() => {
    if (layout.activeFloor) {
      setActiveFloorKey(layout.activeFloor);
    }
  }, [layout.activeFloor]);

  // Center & Fit Canvas on Modal Open or Layout Change
  useEffect(() => {
    if (isOpen && viewportRef.current) {
      const rect = viewportRef.current.getBoundingClientRect();
      const contentWidth = layout.width * pxPerUnit;
      const contentHeight = layout.length * pxPerUnit;

      const scaleX = (rect.width - 120) / contentWidth;
      const scaleY = (rect.height - 120) / contentHeight;
      const fitZoom = Math.max(0.4, Math.min(1.8, Math.min(scaleX, scaleY)));

      setZoom(fitZoom);
      setPan({
        x: (rect.width - contentWidth * fitZoom) / 2,
        y: (rect.height - contentHeight * fitZoom) / 2,
      });
    }
  }, [isOpen, layout.width, layout.length, pxPerUnit]);

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

  // Active Floor Data Resolution
  const currentFloorRooms = (layout.floors && layout.floors[activeFloorKey]?.rooms) || layout.rooms;
  const currentFloorDoors = (layout.floors && layout.floors[activeFloorKey]?.doors) || layout.doors;
  const currentFloorWindows = (layout.floors && layout.floors[activeFloorKey]?.windows) || layout.windows;

  const svgWidth = layout.width * pxPerUnit;
  const svgHeight = layout.length * pxPerUnit;

  // Covered Area calculation
  const totalCoveredSqFt = currentFloorRooms.reduce((sum, r) => sum + r.width * r.height, 0);
  const bedCount = currentFloorRooms.filter(r => r.type === 'bedroom').length;
  const bathCount = currentFloorRooms.filter(r => r.type === 'bathroom').length;

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
  const handleZoomOut = () => setZoom(prev => Math.max(0.25, prev / 1.25));
  const handleResetView = () => {
    if (viewportRef.current) {
      const rect = viewportRef.current.getBoundingClientRect();
      const contentWidth = layout.width * pxPerUnit;
      const contentHeight = layout.length * pxPerUnit;
      const scaleX = (rect.width - 120) / contentWidth;
      const scaleY = (rect.height - 120) / contentHeight;
      const fitZoom = Math.max(0.4, Math.min(1.8, Math.min(scaleX, scaleY)));
      setZoom(fitZoom);
      setPan({
        x: (rect.width - contentWidth * fitZoom) / 2,
        y: (rect.height - contentHeight * fitZoom) / 2,
      });
    }
  };

  // Mouse / Touch Panning handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only primary mouse button
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
    const zoomFactor = e.deltaY < 0 ? 1.12 : 0.88;
    setZoom(prev => Math.max(0.25, Math.min(3.5, prev * zoomFactor)));
  };

  // High-Res SVG Download
  const handleDownloadSVG = () => {
    if (!svgRef.current) return;
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);
    const downloadLink = document.createElement('a');
    downloadLink.href = svgUrl;
    downloadLink.download = `Cinematic_Naqsha_${layout.width}x${layout.length}_${activeFloorKey}.svg`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
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
    <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-2xl flex flex-col text-slate-100 select-none overflow-hidden animate-fadeIn">
      {/* Dynamic Ambient Background Glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-40">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px]" />
      </div>

      {/* TOP HEADER BAR (OUTSIDE CANVAS) */}
      <header className="relative z-10 flex flex-wrap items-center justify-between gap-3 px-6 py-3.5 bg-slate-900/95 border-b border-slate-800/80 backdrop-blur-md">
        {/* Title & Live Status Badge */}
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-xl shadow-lg shadow-blue-500/20">
            <Eye className="w-5 h-5 animate-pulse text-cyan-300" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-display font-black text-sm sm:text-base uppercase tracking-wider text-white">
                Live 2D Naqsha Studio
              </h3>
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Live 2D Projection
              </span>
              <span className="hidden md:inline-flex items-center gap-1 bg-slate-800/80 text-amber-400 border border-amber-500/30 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                <Compass className="w-3 h-3 animate-spin-slow" />
                {layout.facing || 'EAST'} FACING
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              Plot: <strong className="text-slate-200">{layout.width} × {layout.length} {layout.unit}</strong> • {Math.round(totalCoveredSqFt)} SQ FT Covered • {bedCount} Beds, {bathCount} Baths
            </p>
          </div>
        </div>

        {/* Floor Selection Tabs */}
        {layout.floors && Object.keys(layout.floors).length > 1 && (
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            {Object.keys(layout.floors).map((floorKey) => {
              const isActive = activeFloorKey === floorKey;
              const floorLabel = floorKey === 'ground' ? 'Ground Floor' : floorKey === 'first' ? '1st Floor' : floorKey === 'second' ? '2nd Floor' : `${floorKey} Floor`;
              return (
                <button
                  key={floorKey}
                  onClick={() => {
                    setActiveFloorKey(floorKey);
                    if (onSelectFloor) onSelectFloor(floorKey);
                  }}
                  className={`px-3 py-1.5 text-xs font-black rounded-lg uppercase tracking-wider transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  {floorLabel}
                </button>
              );
            })}
          </div>
        )}

        {/* Control Options (All Outside Naqsha) */}
        <div className="flex flex-wrap items-center space-x-2">
          {/* Blueprint Theme Selector */}
          <div className="hidden sm:flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setTheme('classic_blue')}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                theme === 'classic_blue' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
              title="Classic Cobalt Blueprint"
            >
              <div className="w-3 h-3 rounded-full bg-blue-500 border border-white/40" />
              <span className="text-[10px] uppercase font-black">Blueprint</span>
            </button>
            <button
              onClick={() => setTheme('ivory_draft')}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                theme === 'ivory_draft' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
              title="Architectural Ivory Draft"
            >
              <div className="w-3 h-3 rounded-full bg-[#fbf9f4] border border-amber-900/40" />
              <span className="text-[10px] uppercase font-black">Ivory</span>
            </button>
            <button
              onClick={() => setTheme('midnight_gold')}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                theme === 'midnight_gold' ? 'bg-yellow-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
              title="Midnight Obsidian Gold"
            >
              <div className="w-3 h-3 rounded-full bg-yellow-400 border border-white/40" />
              <span className="text-[10px] uppercase font-black">Gold</span>
            </button>
            <button
              onClick={() => setTheme('monochrome_cad')}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                theme === 'monochrome_cad' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
              title="Pure Monochrome CAD"
            >
              <div className="w-3 h-3 rounded-full bg-slate-200 border border-slate-900" />
              <span className="text-[10px] uppercase font-black">CAD</span>
            </button>
          </div>

          {/* Toggle Sq Ft */}
          <button
            onClick={() => setShowSqFt(!showSqFt)}
            className={`px-2.5 py-1.5 text-[10px] font-black rounded-xl uppercase tracking-wider transition cursor-pointer border ${
              showSqFt ? 'bg-indigo-600 text-white border-indigo-400' : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
            }`}
          >
            {showSqFt ? 'Sq Ft ON' : 'Sq Ft OFF'}
          </button>

          {/* Toggle Grid */}
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`px-2.5 py-1.5 text-[10px] font-black rounded-xl uppercase tracking-wider transition cursor-pointer border ${
              showGrid ? 'bg-indigo-600 text-white border-indigo-400' : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
            }`}
          >
            {showGrid ? 'Grid ON' : 'Grid OFF'}
          </button>

          <div className="h-6 w-px bg-slate-800" />

          {/* Download High-Res SVG */}
          <button
            onClick={handleDownloadSVG}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition cursor-pointer"
            title="Download Vector SVG Blueprint"
            id="cinematic-download-svg"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Toggle Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition cursor-pointer"
            title="Toggle Fullscreen View"
            id="cinematic-toggle-fullscreen"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>

          {/* Close Modal Button */}
          <button
            onClick={onClose}
            className="p-2 bg-red-600/80 hover:bg-red-600 text-white rounded-xl transition shadow-lg shadow-red-600/20 cursor-pointer"
            title="Close Live View (Esc)"
            id="cinematic-close-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* MAIN VIEWPORT CANVAS STAGE - COMPLETELY CLEAN & UNOBSTRUCTED */}
      <main
        ref={viewportRef}
        className={`relative flex-1 w-full h-full overflow-hidden ${currentStyle.bg} cursor-grab active:cursor-grabbing`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        {/* Blueprint Stage Box with Glow Frame */}
        <div
          className="absolute transition-transform duration-75 ease-out"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
          }}
        >
          <div className={`p-8 rounded-3xl ${currentStyle.glow} transition-all duration-300`} style={{ backgroundColor: currentStyle.canvasBg }}>
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
                const rw = room.width * pxPerUnit;
                const rh = room.height * pxPerUnit;

                const baseFontSize = Math.max(9, Math.min(14, Math.min(room.width * 2, room.height * 2)));

                return (
                  <g key={room.id}>
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

                    {/* Room Labels */}
                    <foreignObject
                      x={rx + 4}
                      y={ry + 4}
                      width={rw - 8}
                      height={rh - 8}
                      className="pointer-events-none select-none overflow-hidden"
                    >
                      <div className="flex flex-col items-center justify-center h-full w-full text-center p-1">
                        <span
                          className="font-black uppercase tracking-wider leading-tight"
                          style={{ color: currentStyle.textColor, fontSize: `${baseFontSize}px` }}
                        >
                          {room.name}
                        </span>
                        <span
                          className="font-mono font-bold mt-0.5 opacity-90"
                          style={{ color: currentStyle.dimTextColor, fontSize: `${baseFontSize * 0.8}px` }}
                        >
                          {Math.round(room.width)}' × {Math.round(room.height)}' {layout.unit}
                        </span>
                        {showSqFt && (
                          <span
                            className="font-mono font-black mt-1 px-1.5 py-0.5 rounded-full bg-blue-500/20 border border-blue-400/40 text-blue-300 uppercase tracking-widest text-[8px]"
                          >
                            {Math.round(room.width * room.height)} SQ FT
                          </span>
                        )}
                      </div>
                    </foreignObject>
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
