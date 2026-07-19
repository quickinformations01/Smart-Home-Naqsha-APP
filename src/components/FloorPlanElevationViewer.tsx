import React, { useState, useMemo } from 'react';
import { NaqshaLayout, Room, Door, Window } from '../types';
import { 
  Compass, 
  Layers, 
  Sun, 
  Moon, 
  Sunrise, 
  Home, 
  Camera, 
  Download, 
  RefreshCw, 
  Sliders, 
  Paintbrush, 
  Check, 
  Sparkles,
  Eye,
  Building,
  Info,
  ChevronRight,
  Maximize2
} from 'lucide-react';

interface FloorPlanElevationViewerProps {
  layout: NaqshaLayout;
}

type ProjectionType = 'front' | 'side';
type ArchStyle = 'modern' | 'spanish' | 'traditional';
type WallFinish = 'stucco' | 'brick' | 'concrete' | 'timber';
type TimeOfDay = 'sunrise' | 'noon' | 'dusk' | 'night';

export default function FloorPlanElevationViewer({ layout }: FloorPlanElevationViewerProps) {
  // Viewer Customization States
  const [projection, setProjection] = useState<ProjectionType>('front');
  const [style, setStyle] = useState<ArchStyle>('modern');
  const [finish, setFinish] = useState<WallFinish>('stucco');
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('noon');
  const [showAnnotations, setShowAnnotations] = useState<boolean>(true);
  const [showEntourage, setShowEntourage] = useState<boolean>(true);
  const [simulateDoubleStory, setSimulateDoubleStory] = useState<boolean>(
    layout.rooms.length > 5 || (layout.floors && Object.keys(layout.floors).length > 1) ? true : false
  );
  
  // Hovered item tooltip state
  const [hoveredElement, setHoveredElement] = useState<{
    name: string;
    description: string;
    x: number;
    y: number;
  } | null>(null);

  // Active rooms depending on simulated / actual double story layout
  const groundFloorRooms = useMemo(() => {
    if (layout.floors && layout.floors.ground) {
      return layout.floors.ground.rooms;
    }
    return layout.rooms;
  }, [layout]);

  const firstFloorRooms = useMemo(() => {
    if (layout.floors && layout.floors.first) {
      return layout.floors.first.rooms;
    }
    // Simulate first floor rooms if simulated and doesn't exist
    if (simulateDoubleStory) {
      // Map ground floor rooms but lift them
      return groundFloorRooms.map((r, idx) => ({
        ...r,
        id: `sim_first_${r.id}`,
        name: r.name.replace('Ground ', '').replace('Main ', '') + ' (Level 1)',
        type: r.type === 'garage' || r.type === 'lawn' ? 'bedroom' : r.type, // convert open garages to rooms
      })) as Room[];
    }
    return [];
  }, [layout, simulateDoubleStory, groundFloorRooms]);

  // Dimension scaling logic
  const plotWidth = layout.width;
  const plotLength = layout.length;
  
  // Canvas settings
  const canvasWidth = 1000;
  const canvasHeight = 620;
  
  // Architectural parameters (in feet/units mapped to pixels)
  // Scale factor: 1 foot = 12 pixels
  const scale = 12;
  const plinthHeight = 2 * scale; // 2 feet plinth
  const storyHeight = 10 * scale; // 10 feet stories
  const parapetHeight = 3.5 * scale; // 3.5 feet parapet
  
  // Ground line Y position on canvas
  const groundY = canvasHeight - 120;
  
  // Calculate horizontal centering offset
  const facadeWidthPixels = plotWidth * scale;
  const centerOffset = (canvasWidth - facadeWidthPixels) / 2;

  // Colors based on finish and style selection
  const wallColors = useMemo(() => {
    switch (finish) {
      case 'stucco':
        return {
          primary: '#F8F6F0', // Warm Alabaster
          secondary: '#E3DFD5', // Stone accent
          stroke: '#4A4A4A',
          strokeWidth: 1.5,
          texture: 'stucco-pattern'
        };
      case 'brick':
        return {
          primary: '#B2533E', // Terracotta brick red
          secondary: '#D2765A', // Lighter clay brick
          stroke: '#2D1510',
          strokeWidth: 1.5,
          texture: 'brick-pattern'
        };
      case 'concrete':
        return {
          primary: '#A0A4A8', // Raw structural grey
          secondary: '#7E8285', // Dark board-formed accent
          stroke: '#333639',
          strokeWidth: 1.5,
          texture: 'concrete-pattern'
        };
      case 'timber':
        return {
          primary: '#855835', // Warm cedar
          secondary: '#5C3C24', // Roasted walnut
          stroke: '#1A0E06',
          strokeWidth: 1.5,
          texture: 'timber-pattern'
        };
      default:
        return { primary: '#F1F5F9', secondary: '#CBD5E1', stroke: '#475569', strokeWidth: 1.5, texture: '' };
    }
  }, [finish]);

  // Lighting & Environment based on Time of Day
  const envTheme = useMemo(() => {
    switch (timeOfDay) {
      case 'sunrise':
        return {
          skyGradient: ['#FF7E5F', '#FEB47B', '#8E2DE2'], // Peach glow sunrise
          ambientColor: 'rgba(254, 180, 123, 0.22)',
          shadowColor: 'rgba(74, 20, 140, 0.35)',
          shadowDx: -10,
          shadowDy: 4,
          sunColor: '#FFE0B2',
          sunX: 200,
          sunY: 150,
          sunRadius: 45,
          isDark: false,
          skyOverlay: 'rgba(255, 126, 95, 0.1)',
          windowGlow: 'rgba(255, 235, 120, 0.35)'
        };
      case 'noon':
        return {
          skyGradient: ['#E0F2FE', '#BAE6FD', '#7DD3FC'], // Pristine blue midday
          ambientColor: 'rgba(255, 255, 255, 0.05)',
          shadowColor: 'rgba(15, 23, 42, 0.25)',
          shadowDx: 3,
          shadowDy: 12,
          sunColor: '#FFFDE7',
          sunX: 500,
          sunY: 70,
          sunRadius: 30,
          isDark: false,
          skyOverlay: 'rgba(255, 255, 255, 0)',
          windowGlow: 'rgba(255, 255, 255, 0.1)'
        };
      case 'dusk':
        return {
          skyGradient: ['#2E0854', '#8E2E8F', '#FF6B6B'], // Dramatic twilight sunset
          ambientColor: 'rgba(244, 63, 94, 0.15)',
          shadowColor: 'rgba(24, 12, 40, 0.55)',
          shadowDx: 14,
          shadowDy: 5,
          sunColor: '#FFA726',
          sunX: 800,
          sunY: 260,
          sunRadius: 35,
          isDark: true,
          skyOverlay: 'rgba(120, 30, 150, 0.15)',
          windowGlow: 'rgba(253, 186, 116, 0.85)' // warm internal lights turning on
        };
      case 'night':
        return {
          skyGradient: ['#030712', '#0F172A', '#1E1B4B'], // Silent starry night
          ambientColor: 'rgba(30, 41, 59, 0.45)',
          shadowColor: 'rgba(2, 4, 10, 0.75)',
          shadowDx: 18,
          shadowDy: 8,
          sunColor: '#F1F5F9', // Moon instead
          sunX: 780,
          sunY: 100,
          sunRadius: 25,
          isDark: true,
          skyOverlay: 'rgba(15, 23, 42, 0.35)',
          windowGlow: 'rgba(254, 240, 138, 0.95)' // strong cozy lit windows
        };
    }
  }, [timeOfDay]);

  // Facade Projections Calculations
  const facadeRooms = useMemo(() => {
    // 2 Projections: Front and Side
    // In front projection, X coordinate translates directly to width projection.
    // In side projection, Y coordinate translates directly to side length projection.
    const project = (roomsList: Room[], isFirst: boolean) => {
      const projLength = projection === 'front' ? plotWidth : plotLength;
      
      // Bucket rooms by their horizontal coordinates
      const positions = roomsList.map(r => {
        const start = projection === 'front' ? r.x : r.y;
        const width = projection === 'front' ? r.width : r.height; // height corresponds to length on floorplan
        const depth = projection === 'front' ? r.height : r.width; // for facade layering
        const end = start + width;
        
        return {
          room: r,
          start: Math.max(0, start),
          width: Math.min(projLength - start, width),
          depth,
          end: Math.min(projLength, end),
          isFirst
        };
      }).filter(p => p.width > 1);

      // Sort by depth (rooms closer to front are rendered last to overlap background rooms correctly)
      // Front view depth: larger Y is in background (rendered first), smaller Y is closer (rendered last).
      // Side view depth: larger X is background, smaller X is closer.
      positions.sort((a, b) => {
        const depthA = projection === 'front' ? a.room.y : a.room.x;
        const depthB = projection === 'front' ? b.room.y : b.room.x;
        return depthB - depthA; // ascending Y (closer rooms have smaller Y)
      });

      return positions;
    };

    return {
      ground: project(groundFloorRooms, false),
      first: project(firstFloorRooms, true)
    };
  }, [projection, groundFloorRooms, firstFloorRooms, plotWidth, plotLength]);

  // Boundary lines & overall house height calculation
  const totalHeightFeet = useMemo(() => {
    let ft = 2; // Plinth
    ft += 10; // Ground Floor
    if (simulateDoubleStory) {
      ft += 10; // First Floor
    }
    ft += 3.5; // Parapet
    return ft;
  }, [simulateDoubleStory]);

  // Export CAD PDF / PNG simulator action
  const triggerExport = () => {
    const svgElement = document.getElementById('elevation-svg-canvas');
    if (!svgElement) return;

    // Create a temporary link
    const svgString = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const blobURL = window.URL.createObjectURL(svgBlob);
    
    const downloadLink = document.createElement('a');
    downloadLink.href = blobURL;
    downloadLink.download = `Smart_Home_Naqsha_${plotWidth}x${plotLength}_${projection}_elevation.svg`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  return (
    <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xl flex flex-col transition-all duration-300">
      
      {/* Top Banner / Header with Title and Mode */}
      <div className="p-5 border-b border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl border border-indigo-500/20 shadow-inner">
            <Building className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-widest bg-indigo-600 text-white rounded-md">CAD Render</span>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Professional Facade Elevation</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Simplified orthographic side-profile projection sketch of the engineered layout.
            </p>
          </div>
        </div>

        {/* Action Button: Export SVG / CAD Schema */}
        <button
          onClick={triggerExport}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-850 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-500/10 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          title="Download printable high-fidelity vector SVG elevation file"
        >
          <Download className="w-4 h-4" />
          <span>Export Blueprint SVG</span>
        </button>
      </div>

      {/* Main Grid: Left Controls Sidebar, Right SVG Interactive Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-4 min-h-[500px]">
        
        {/* Left Column: Architectural Customizer Panel */}
        <div className="p-5 border-r border-slate-150 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/10 flex flex-col space-y-6">
          
          {/* Projection Selector */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5" /> Projection Plane
            </span>
            <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200/40 dark:border-slate-800">
              <button
                onClick={() => setProjection('front')}
                className={`py-2 px-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                  projection === 'front'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm font-black'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-350'
                }`}
              >
                Front View
              </button>
              <button
                onClick={() => setProjection('side')}
                className={`py-2 px-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                  projection === 'side'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm font-black'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-350'
                }`}
              >
                Side View
              </button>
            </div>
          </div>

          {/* Architectural Style */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              <Home className="w-3.5 h-3.5" /> Building Style
            </span>
            <div className="flex flex-col gap-1.5">
              {[
                { id: 'modern', name: 'Contemporary Flat Roof', desc: 'Sleek parapet lines & stucco panels' },
                { id: 'spanish', name: 'Pakistani Spanish Villa', desc: 'Decorative red tile roofs & arch elements' },
                { id: 'traditional', name: 'Traditional Gabled Roof', desc: 'Slanted pitched roof and chimney outline' }
              ].map((styleOption) => (
                <button
                  key={styleOption.id}
                  onClick={() => setStyle(styleOption.id as ArchStyle)}
                  className={`p-2.5 text-left rounded-xl border text-xs transition-all flex items-center justify-between cursor-pointer ${
                    style === styleOption.id
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-900 dark:bg-indigo-950/30 dark:border-indigo-900/60 dark:text-indigo-300 font-bold'
                      : 'bg-white border-slate-200 text-slate-650 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div>
                    <div>{styleOption.name}</div>
                    <div className="text-[9px] font-normal opacity-70 mt-0.5">{styleOption.desc}</div>
                  </div>
                  {style === styleOption.id && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0 ml-1" />}
                </button>
              ))}
            </div>
          </div>

          {/* Exterior Wall Material Finish */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              <Paintbrush className="w-3.5 h-3.5" /> Facade Material Finish
            </span>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'stucco', label: 'Off-White Stucco', color: 'bg-amber-50' },
                { id: 'brick', label: 'Red Brick Tile', color: 'bg-red-700' },
                { id: 'concrete', label: 'Brutalist Concrete', color: 'bg-slate-400' },
                { id: 'timber', label: 'Roasted Timber', color: 'bg-amber-800' }
              ].map((mat) => (
                <button
                  key={mat.id}
                  onClick={() => setFinish(mat.id as WallFinish)}
                  className={`p-2 rounded-xl border text-[10px] font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    finish === mat.id
                      ? 'border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/20 text-indigo-900 dark:text-indigo-300 font-extrabold'
                      : 'border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className={`w-3.5 h-3.5 rounded-full ${mat.color} border border-slate-300 dark:border-slate-600 shrink-0`} />
                  <span className="truncate">{mat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Time of Day & Shadow Cast Ambient */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5" /> Light & Shadow Casting
            </span>
            <div className="grid grid-cols-4 gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200/40 dark:border-slate-800">
              {[
                { id: 'sunrise', icon: Sunrise, title: 'Sunrise' },
                { id: 'noon', icon: Sun, title: 'Noon' },
                { id: 'dusk', icon: Moon, title: 'Dusk' }, // Dusk
                { id: 'night', icon: Moon, title: 'Night' }
              ].map((t) => {
                const IconComp = t.icon;
                const isSelected = timeOfDay === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTimeOfDay(t.id as TimeOfDay)}
                    className={`py-1.5 flex flex-col items-center justify-center rounded-lg transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                        : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                    }`}
                    title={t.title}
                  >
                    <IconComp className="w-3.5 h-3.5" />
                    <span className="text-[8px] mt-0.5 font-bold uppercase tracking-tighter">{t.id}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Rendering toggles */}
          <div className="space-y-2 pt-2 border-t border-slate-150 dark:border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
              Render Overlays
            </span>
            <div className="space-y-2">
              {/* Simulate Double story toggle */}
              <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-350 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={simulateDoubleStory}
                  onChange={(e) => setSimulateDoubleStory(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span className="font-semibold">Simulate 2-Story (First Floor)</span>
              </label>

              {/* Show annotations toggle */}
              <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-350 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showAnnotations}
                  onChange={(e) => setShowAnnotations(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span className="font-semibold">Show Architectural Ticks</span>
              </label>

              {/* Show scale entourage toggle */}
              <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-350 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showEntourage}
                  onChange={(e) => setShowEntourage(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span className="font-semibold">Scale Entourage (Trees/Scale)</span>
              </label>
            </div>
          </div>

          {/* Summary Details Badge */}
          <div className="p-3.5 bg-indigo-50/50 dark:bg-slate-950/40 rounded-2xl border border-indigo-100/50 dark:border-indigo-900/30 text-[10px] space-y-1.5">
            <h4 className="font-bold text-indigo-950 dark:text-indigo-400 flex items-center gap-1 uppercase tracking-widest text-[9px]">
              <Info className="w-3 h-3" /> Projection Specs
            </h4>
            <div className="text-slate-600 dark:text-slate-400 leading-normal space-y-1 font-mono">
              <div>• Plane Width: {projection === 'front' ? plotWidth : plotLength}ft</div>
              <div>• Total Height: {totalHeightFeet}ft</div>
              <div>• Storey Count: {simulateDoubleStory ? '2 Floors (Ground + 1)' : '1 Floor (Ground Only)'}</div>
              <div>• Plinth Level: +2.0ft</div>
            </div>
          </div>
        </div>

        {/* Right Column: Interative CAD Elevation Canvas Rendered with sharp responsive SVG */}
        <div className="lg:col-span-3 p-4 flex flex-col items-center justify-center relative overflow-hidden bg-slate-50 dark:bg-slate-950/40 min-h-[500px]">
          
          {/* Sky Backdrop & Sun/Moon with Ambient Gradients */}
          <div className="absolute inset-4 rounded-2xl overflow-hidden border border-slate-200/60 dark:border-slate-800 pointer-events-none z-0 shadow-inner">
            <svg className="w-full h-full" style={{ background: `linear-gradient(to bottom, ${envTheme.skyGradient.join(', ')})` }}>
              {/* Ambient overlay */}
              <rect width="100%" height="100%" fill={envTheme.skyOverlay} />
              
              {/* Starry night overlay */}
              {timeOfDay === 'night' && (
                <g opacity="0.8">
                  <circle cx="10%" cy="15%" r="1" fill="white" />
                  <circle cx="22%" cy="30%" r="1" fill="white" />
                  <circle cx="35%" cy="10%" r="1.5" fill="white" opacity="0.6" />
                  <circle cx="48%" cy="25%" r="1" fill="white" />
                  <circle cx="65%" cy="12%" r="1" fill="white" />
                  <circle cx="78%" cy="32%" r="1.5" fill="white" opacity="0.8" />
                  <circle cx="90%" cy="18%" r="1" fill="white" />
                </g>
              )}
              
              {/* Celestial Body: Sun or Moon */}
              <circle 
                cx={envTheme.sunX} 
                cy={envTheme.sunY} 
                r={envTheme.sunRadius} 
                fill={envTheme.sunColor} 
                filter="blur(1px)"
                opacity={timeOfDay === 'night' ? 0.95 : 0.85}
              />
              {/* Moon crescent cut for classic night */}
              {timeOfDay === 'night' && (
                <circle cx={envTheme.sunX - 8} cy={envTheme.sunY - 4} r={envTheme.sunRadius} fill="#030712" />
              )}
              
              {/* Subtle architectural grid lines behind layout for design studio look */}
              <g opacity="0.05" stroke="#475569" strokeWidth="1">
                {Array.from({ length: 30 }).map((_, i) => (
                  <line key={`v-${i}`} x1={i * 35} y1="0" x2={i * 35} y2="100%" />
                ))}
                {Array.from({ length: 20 }).map((_, i) => (
                  <line key={`h-${i}`} x1="0" y1={i * 35} x2="100%" y2={i * 35} />
                ))}
              </g>
            </svg>
          </div>

          {/* Interactive SVG Render Canvas */}
          <svg
            id="elevation-svg-canvas"
            viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
            className="w-full h-auto max-w-full z-10 select-none relative"
            style={{ filter: `drop-shadow(0 10px 25px rgba(0,0,0,0.1))` }}
          >
            
            {/* Patterns and Textures Declarations */}
            <defs>
              <linearGradient id="glass-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#93C5FD" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#60A5FA" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#1D4ED8" stopOpacity="0.65" />
              </linearGradient>
              <linearGradient id="parapet-glass-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#E2E8F0" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#94A3B8" stopOpacity="0.15" />
              </linearGradient>
              <pattern id="brick-pattern" width="24" height="12" patternUnits="userSpaceOnUse">
                <rect width="24" height="12" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
                <line x1="0" y1="6" x2="24" y2="6" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
                <line x1="12" y1="0" x2="12" y2="6" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
                <line x1="0" y1="6" x2="0" y2="12" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
                <line x1="24" y1="6" x2="24" y2="12" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
              </pattern>
              <pattern id="timber-pattern" width="10" height="60" patternUnits="userSpaceOnUse">
                <rect width="10" height="60" fill="none" stroke="rgba(0,0,0,0.12)" strokeWidth="0.5" />
                <line x1="5" y1="0" x2="5" y2="60" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
              </pattern>
              <pattern id="concrete-pattern" width="60" height="30" patternUnits="userSpaceOnUse">
                <rect width="60" height="30" fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="0.5" />
                <circle cx="5" cy="5" r="1" fill="rgba(0,0,0,0.15)" />
                <circle cx="55" cy="5" r="1" fill="rgba(0,0,0,0.15)" />
                <circle cx="5" cy="25" r="1" fill="rgba(0,0,0,0.15)" />
                <circle cx="55" cy="25" r="1" fill="rgba(0,0,0,0.15)" />
              </pattern>
              <pattern id="hatch-pattern" width="10" height="10" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2="0" y2="10" stroke="rgba(100, 116, 139, 0.35)" strokeWidth="1" />
              </pattern>
              <filter id="soft-shadow" x="-5%" y="-5%" width="110%" height="110%">
                <feDropShadow dx={envTheme.shadowDx} dy={envTheme.shadowDy} stdDeviation="10" floodColor={envTheme.shadowColor} floodOpacity="0.4" />
              </filter>
            </defs>

            {/* Ambient Ambient Sky Lighting Mask overlay */}
            <rect x="4" y="4" width={canvasWidth - 8} height={groundY - 4} fill={envTheme.ambientColor} className="pointer-events-none" />

            {/* Left/Right flanking trees for entourage sense of scale */}
            {showEntourage && (
              <g opacity={timeOfDay === 'night' ? 0.35 : 0.75} transition="opacity 0.3s">
                {/* Left pine trees group */}
                <path d="M70,380 L110,500 L30,500 Z" fill="#1E3F20" />
                <path d="M75,340 L105,440 L45,440 Z" fill="#2E5A30" />
                <path d="M80,300 L100,380 L60,380 Z" fill="#3D753F" />
                <rect x="86" y="500" width="8" height="20" fill="#5C4033" />
                
                <path d="M120,410 L150,500 L90,500 Z" fill="#163018" />
                <path d="M125,370 L145,450 L105,450 Z" fill="#204A23" />
                <rect x="131" y="500" width="6" height="20" fill="#5C4033" />

                {/* Right beautiful deciduous tree */}
                <rect x="880" y="460" width="12" height="60" fill="#422F25" />
                <circle cx="886" cy="420" r="45" fill="#1C3D1E" />
                <circle cx="910" cy="400" r="35" fill="#255427" />
                <circle cx="860" cy="390" r="38" fill="#2C6B30" />
                <circle cx="886" cy="360" r="28" fill="#36803A" />
              </g>
            )}

            {/* Boundary / Setback line markings */}
            {showAnnotations && (
              <g stroke="#94A3B8" strokeWidth="0.8" strokeDasharray="3,3" opacity="0.6">
                {/* Left boundary */}
                <line x1={centerOffset} y1="100" x2={centerOffset} y2={groundY} />
                <text x={centerOffset + 6} y="115" fill="#475569" fontSize="9" fontWeight="bold" fontFamily="monospace">LEFT SETBACK</text>
                
                {/* Right boundary */}
                <line x1={centerOffset + facadeWidthPixels} y1="100" x2={centerOffset + facadeWidthPixels} y2={groundY} />
                <text x={centerOffset + facadeWidthPixels - 92} y="115" fill="#475569" fontSize="9" fontWeight="bold" fontFamily="monospace">RIGHT SETBACK</text>
              </g>
            )}

            {/* MAIN BUILDING ENVELOPE SHADOW AND MASK GROUP */}
            <g filter="url(#soft-shadow)">
              
              {/* Plinth Base Block */}
              <rect
                x={centerOffset}
                y={groundY - plinthHeight}
                width={facadeWidthPixels}
                height={plinthHeight}
                fill="#334155" // Dark slate structural concrete base
                stroke={wallColors.stroke}
                strokeWidth="1.5"
                className="cursor-pointer transition-colors duration-350"
                onClick={() => setHoveredElement({
                  name: "Plinth Level Foundation",
                  description: "Water-safe plinth level, lifted +2.0ft above street road level for secure drainage and localized monsoon safety.",
                  x: centerOffset + facadeWidthPixels/2,
                  y: groundY - plinthHeight/2
                })}
              />
              {/* Plinth detailing: steps on left or center */}
              <g fill="#475569" stroke="#1E293B" strokeWidth="1">
                <rect x={centerOffset + 30} y={groundY - plinthHeight/2} width={15} height={plinthHeight/2} />
                <rect x={centerOffset + 15} y={groundY - plinthHeight/2 - 4} width={15} height={4} />
              </g>

              {/* 1. GROUND FLOOR RENDER PLANE */}
              {facadeRooms.ground.map((p, idx) => {
                const rx = centerOffset + p.start * scale;
                const rw = p.width * scale;
                const ry = groundY - plinthHeight - storyHeight;
                const rh = storyHeight;
                
                // Color variation slightly based on room index depth for depth shadow
                const fillCol = p.depth > 15 ? wallColors.secondary : wallColors.primary;
                const isGarage = p.room.type === 'garage';
                const isLawn = p.room.type === 'lawn';
                
                if (isLawn) return null; // lawns aren't drawn as solid walls

                return (
                  <g key={`gf-room-${p.room.id}`}>
                    {/* Main structural wall block */}
                    <rect
                      x={rx}
                      y={ry}
                      width={rw}
                      height={rh}
                      fill={fillCol}
                      stroke={wallColors.stroke}
                      strokeWidth={wallColors.strokeWidth}
                      className="cursor-pointer hover:brightness-105 transition-all"
                      onMouseEnter={() => setHoveredElement({
                        name: `${p.room.name}`,
                        description: `Ground floor room projection. Dimensions: ${p.room.width}ft x ${p.room.height}ft. Exterior wall with structural plaster.`,
                        x: rx + rw/2,
                        y: ry + rh/2
                      })}
                    />
                    
                    {/* Pattern Overlay depending on Material */}
                    {wallColors.texture && (
                      <rect
                        x={rx}
                        y={ry}
                        width={rw}
                        height={rh}
                        fill={`url(#${wallColors.texture})`}
                        opacity={finish === 'brick' ? 0.8 : 0.45}
                        className="pointer-events-none"
                      />
                    )}

                    {/* Architectural elements if room is Garage */}
                    {isGarage && (
                      <g>
                        {/* Roller shutter framing */}
                        <rect x={rx + 15} y={ry + 20} width={rw - 30} height={rh - 20} fill="#1E293B" opacity="0.9" />
                        {/* Shutter slats lines */}
                        {Array.from({ length: 12 }).map((_, sIdx) => (
                          <line 
                            key={`shutter-${sIdx}`} 
                            x1={rx + 18} 
                            y1={ry + 25 + sIdx * 7} 
                            x2={rx + rw - 18} 
                            y2={ry + 25 + sIdx * 7} 
                            stroke="#475569" 
                            strokeWidth="1.5" 
                          />
                        ))}
                        {/* Parked car silhouette if entourage active */}
                        {showEntourage && (
                          <path 
                            d={`M${rx + 30},${ry + rh - 10} C${rx + 35},${ry + rh - 40} ${rx + 50},${ry + rh - 45} ${rx + 65},${ry + rh - 45} C${rx + 80},${ry + rh - 45} ${rx + 90},${ry + rh - 30} ${rx + 95},${ry + rh - 10} Z`} 
                            fill="#0F172A" 
                            opacity="0.3" 
                          />
                        )}
                      </g>
                    )}

                    {/* Standard windows/doors placement centered in wall profile */}
                    {!isGarage && (
                      <g>
                        {/* Elevation Main Door on the very first room usually */}
                        {idx === 0 && (
                          <g>
                            {/* Door Frame */}
                            <rect x={rx + rw/2 - 18} y={ry + rh - 78} width={36} height={78} fill="#451A03" stroke="#1A0E06" strokeWidth="2" />
                            {/* Glass side panels or wooden detailing */}
                            <rect x={rx + rw/2 - 14} y={ry + rh - 74} width={28} height={74} fill="#854D0E" />
                            {/* Handle lock */}
                            <circle cx={rx + rw/2 + 8} cy={ry + rh - 38} r="2.5" fill="#FACC15" />
                            {/* Small overhead canopy / Chajja shade */}
                            <rect x={rx + rw/2 - 26} y={ry + rh - 83} width={52} height={5} fill="#475569" />
                          </g>
                        )}

                        {/* Windows on secondary walls */}
                        {idx > 0 && rw > 40 && (
                          <g>
                            {/* Window Frame */}
                            <rect x={rx + rw/2 - 28} y={ry + 25} width={56} height={42} fill="#334155" stroke="#1E293B" strokeWidth="2" />
                            {/* Glass Panels */}
                            <rect x={rx + rw/2 - 24} y={ry + 29} width={22} height={34} fill="url(#glass-grad)" />
                            <rect x={rx + rw/2 + 2} y={ry + 29} width={22} height={34} fill="url(#glass-grad)" />
                            
                            {/* Inside glow for Sunrise / Dusk / Night */}
                            {(timeOfDay === 'night' || timeOfDay === 'dusk' || timeOfDay === 'sunrise') && (
                              <rect x={rx + rw/2 - 24} y={ry + 29} width={48} height={34} fill={envTheme.windowGlow} opacity="0.6" className="pointer-events-none" />
                            )}
                            
                            {/* Center mullion */}
                            <line x1={rx + rw/2} y1={ry + 25} x2={rx + rw/2} y2={ry + 67} stroke="#1E293B" strokeWidth="2" />
                            {/* Window Sun shade / Chajja */}
                            <path d={`M${rx + rw/2 - 34},${ry + 25} L${rx + rw/2 - 38},${ry + 21} L${rx + rw/2 + 38},${ry + 21} L${rx + rw/2 + 34},${ry + 25} Z`} fill="#64748B" />
                          </g>
                        )}
                      </g>
                    )}
                  </g>
                );
              })}

              {/* 2. FIRST FLOOR RENDER PLANE (IF ACTIVE OR SIMULATED) */}
              {simulateDoubleStory && facadeRooms.first.map((p, idx) => {
                const rx = centerOffset + p.start * scale;
                const rw = p.width * scale;
                const ry = groundY - plinthHeight - storyHeight - storyHeight;
                const rh = storyHeight;
                
                const fillCol = p.depth > 15 ? wallColors.secondary : wallColors.primary;

                return (
                  <g key={`ff-room-${p.room.id}`}>
                    {/* Main structural wall block */}
                    <rect
                      x={rx}
                      y={ry}
                      width={rw}
                      height={rh}
                      fill={fillCol}
                      stroke={wallColors.stroke}
                      strokeWidth={wallColors.strokeWidth}
                      className="cursor-pointer hover:brightness-105 transition-all"
                      onMouseEnter={() => setHoveredElement({
                        name: `${p.room.name}`,
                        description: `First floor elevated room structure. Dimensions: ${p.room.width}ft x ${p.room.height}ft. Part of double-story layout.`,
                        x: rx + rw/2,
                        y: ry + rh/2
                      })}
                    />
                    
                    {/* Pattern Overlay depending on Material */}
                    {wallColors.texture && (
                      <rect
                        x={rx}
                        y={ry}
                        width={rw}
                        height={rh}
                        fill={`url(#${wallColors.texture})`}
                        opacity={finish === 'brick' ? 0.8 : 0.45}
                        className="pointer-events-none"
                      />
                    )}

                    {/* Standard windows/doors placement centered in wall profile */}
                    <g>
                      {/* Sliding glass balcony door on certain rooms */}
                      {idx === 0 && rw > 40 && (
                        <g>
                          {/* Balcony Railing */}
                          <rect x={rx + 10} y={ry + rh - 28} width={rw - 20} height={28} fill="none" stroke="#475569" strokeWidth="2.5" />
                          {/* Railing grills vertical */}
                          {Array.from({ length: Math.floor(rw / 10) }).map((_, grillIdx) => (
                            <line 
                              key={`grill-${grillIdx}`} 
                              x1={rx + 15 + grillIdx * 10} 
                              y1={ry + rh - 28} 
                              x2={rx + 15 + grillIdx * 10} 
                              y2={ry + rh} 
                              stroke="#64748B" 
                              strokeWidth="1.2" 
                            />
                          ))}
                          
                          {/* Double Glass Doors behind rail */}
                          <rect x={rx + rw/2 - 20} y={ry + rh - 64} width={40} height={64} fill="url(#glass-grad)" stroke="#1E293B" strokeWidth="2" />
                          <line x1={rx + rw/2} y1={ry + rh - 64} x2={rx + rw/2} y2={ry + rh} stroke="#1E293B" strokeWidth="2" />
                        </g>
                      )}

                      {/* Elevated Standard Window */}
                      {(idx > 0 || rw <= 40) && (
                        <g>
                          {/* Window Frame */}
                          <rect x={rx + rw/2 - 22} y={ry + 25} width={44} height={38} fill="#334155" stroke="#1E293B" strokeWidth="2" />
                          {/* Glass pane */}
                          <rect x={rx + rw/2 - 18} y={ry + 29} width={36} height={30} fill="url(#glass-grad)" />
                          
                          {/* Window internal lighting glow */}
                          {(timeOfDay === 'night' || timeOfDay === 'dusk' || timeOfDay === 'sunrise') && (
                            <rect x={rx + rw/2 - 18} y={ry + 29} width={36} height={30} fill={envTheme.windowGlow} opacity="0.65" className="pointer-events-none" />
                          )}
                          
                          <line x1={rx + rw/2} y1={ry + 25} x2={rx + rw/2} y2={ry + 63} stroke="#1E293B" strokeWidth="1.5" />
                          <line x1={rx + rw/2 - 22} y1={ry + 44} x2={rx + rw/2 + 22} y2={ry + 44} stroke="#1E293B" strokeWidth="1.5" />
                          {/* Chajja Sun-shade */}
                          <rect x={rx + rw/2 - 28} y={ry + 21} width={56} height={4} fill="#475569" />
                        </g>
                      )}
                    </g>
                  </g>
                );
              })}

              {/* 3. ROOF & ARCHITECTURAL STYLE HEADERS (MODERN PARAPET VS PITCHE / SPANISH ROOF) */}
              <g>
                {style === 'modern' && (
                  /* contemporary flat plaster slab with modern glass or concrete parapet */
                  <g>
                    {/* Roof Slab Line */}
                    <rect
                      x={centerOffset - 4}
                      y={groundY - plinthHeight - storyHeight - (simulateDoubleStory ? storyHeight : 0) - 8}
                      width={facadeWidthPixels + 8}
                      height={8}
                      fill="#1E293B"
                    />
                    
                    {/* Parapet Wall block */}
                    <rect
                      x={centerOffset}
                      y={groundY - plinthHeight - storyHeight - (simulateDoubleStory ? storyHeight : 0) - parapetHeight}
                      width={facadeWidthPixels}
                      height={parapetHeight - 8}
                      fill={wallColors.secondary}
                      stroke={wallColors.stroke}
                      strokeWidth={wallColors.strokeWidth}
                      className="cursor-pointer hover:opacity-95"
                      onClick={() => setHoveredElement({
                        name: "Modern Parapet Barrier",
                        description: "Contemporary 3.5ft flat terrace parapet wall styling, creating a clean box silhouette popular in luxury DHA/Bahria town sectors.",
                        x: centerOffset + facadeWidthPixels/2,
                        y: groundY - plinthHeight - storyHeight - (simulateDoubleStory ? storyHeight : 0) - parapetHeight/2
                      })}
                    />
                    {/* Decorative horizontal grooved lines on parapet */}
                    <line 
                      x1={centerOffset + 20} 
                      y1={groundY - plinthHeight - storyHeight - (simulateDoubleStory ? storyHeight : 0) - parapetHeight + 15}
                      x2={centerOffset + facadeWidthPixels - 20}
                      y2={groundY - plinthHeight - storyHeight - (simulateDoubleStory ? storyHeight : 0) - parapetHeight + 15}
                      stroke="rgba(255,255,255,0.4)"
                      strokeWidth="2"
                    />
                  </g>
                )}

                {style === 'spanish' && (
                  /* Spanish luxury villa clay terracotta tiling slanted roof peak */
                  <g>
                    {/* Roof Slab Line */}
                    <rect
                      x={centerOffset - 8}
                      y={groundY - plinthHeight - storyHeight - (simulateDoubleStory ? storyHeight : 0) - 8}
                      width={facadeWidthPixels + 16}
                      height={8}
                      fill="#78350F" // Brown slab
                    />
                    
                    {/* Slanted red tile roof peak */}
                    <polygon
                      points={`
                        ${centerOffset - 15},${groundY - plinthHeight - storyHeight - (simulateDoubleStory ? storyHeight : 0) - 8}
                        ${centerOffset + facadeWidthPixels/2},${groundY - plinthHeight - storyHeight - (simulateDoubleStory ? storyHeight : 0) - 75}
                        ${centerOffset + facadeWidthPixels + 15},${groundY - plinthHeight - storyHeight - (simulateDoubleStory ? storyHeight : 0) - 8}
                      `}
                      fill="#C2410C" // Burnt red Spanish tile clay
                      stroke="#7C2D12"
                      strokeWidth="2"
                      className="cursor-pointer"
                      onClick={() => setHoveredElement({
                        name: "Spanish Mediterranean Tile Peak",
                        description: "Elegant 30-degree pitched red clay tile roof structure, giving a highly premium Spanish/Italian style luxury aesthetic overlay.",
                        x: centerOffset + facadeWidthPixels/2,
                        y: groundY - plinthHeight - storyHeight - (simulateDoubleStory ? storyHeight : 0) - 40
                      })}
                    />
                    {/* Decorative small round window in attic triangle */}
                    <circle cx={centerOffset + facadeWidthPixels/2} cy={groundY - plinthHeight - storyHeight - (simulateDoubleStory ? storyHeight : 0) - 34} r="12" fill="#1E293B" stroke="#FBBF24" strokeWidth="2" />
                    <line x1={centerOffset + facadeWidthPixels/2 - 12} y1={groundY - plinthHeight - storyHeight - (simulateDoubleStory ? storyHeight : 0) - 34} x2={centerOffset + facadeWidthPixels/2 + 12} y2={groundY - plinthHeight - storyHeight - (simulateDoubleStory ? storyHeight : 0) - 34} stroke="#FBBF24" strokeWidth="1" />
                    <line x1={centerOffset + facadeWidthPixels/2} y1={groundY - plinthHeight - storyHeight - (simulateDoubleStory ? storyHeight : 0) - 46} x2={centerOffset + facadeWidthPixels/2} y2={groundY - plinthHeight - storyHeight - (simulateDoubleStory ? storyHeight : 0) - 22} stroke="#FBBF24" strokeWidth="1" />
                  </g>
                )}

                {style === 'traditional' && (
                  /* Gabled Peak Traditional brick cottage styling with single side chimney */
                  <g>
                    {/* Pitched triangle gables */}
                    <polygon
                      points={`
                        ${centerOffset - 10},${groundY - plinthHeight - storyHeight - (simulateDoubleStory ? storyHeight : 0)}
                        ${centerOffset + facadeWidthPixels/2},${groundY - plinthHeight - storyHeight - (simulateDoubleStory ? storyHeight : 0) - 85}
                        ${centerOffset + facadeWidthPixels + 10},${groundY - plinthHeight - storyHeight - (simulateDoubleStory ? storyHeight : 0)}
                      `}
                      fill={wallColors.primary}
                      stroke={wallColors.stroke}
                      strokeWidth={wallColors.strokeWidth}
                    />
                    {/* Pitched Roof Fascia border */}
                    <line 
                      x1={centerOffset - 12} 
                      y1={groundY - plinthHeight - storyHeight - (simulateDoubleStory ? storyHeight : 0)} 
                      x2={centerOffset + facadeWidthPixels/2} 
                      y2={groundY - plinthHeight - storyHeight - (simulateDoubleStory ? storyHeight : 0) - 87} 
                      stroke="#451A03" 
                      strokeWidth="5" 
                    />
                    <line 
                      x1={centerOffset + facadeWidthPixels + 12} 
                      y1={groundY - plinthHeight - storyHeight - (simulateDoubleStory ? storyHeight : 0)} 
                      x2={centerOffset + facadeWidthPixels/2} 
                      y2={groundY - plinthHeight - storyHeight - (simulateDoubleStory ? storyHeight : 0) - 87} 
                      stroke="#451A03" 
                      strokeWidth="5" 
                    />

                    {/* Classic Chimney stack rising from right roof flank */}
                    <rect 
                      x={centerOffset + facadeWidthPixels - 65} 
                      y={groundY - plinthHeight - storyHeight - (simulateDoubleStory ? storyHeight : 0) - 105} 
                      width={22} 
                      height={80} 
                      fill="#7C2D12" 
                      stroke="#451A03" 
                      strokeWidth="1.5" 
                    />
                    <rect 
                      x={centerOffset + facadeWidthPixels - 69} 
                      y={groundY - plinthHeight - storyHeight - (simulateDoubleStory ? storyHeight : 0) - 111} 
                      width={30} 
                      height={6} 
                      fill="#450A0A" 
                    />
                    
                    {/* Smoke puffs when entourage active */}
                    {showEntourage && (
                      <g opacity="0.3" fill="#94A3B8">
                        <circle cx={centerOffset + facadeWidthPixels - 54} cy={groundY - plinthHeight - storyHeight - (simulateDoubleStory ? storyHeight : 0) - 125} r="7" />
                        <circle cx={centerOffset + facadeWidthPixels - 47} cy={groundY - plinthHeight - storyHeight - (simulateDoubleStory ? storyHeight : 0) - 138} r="10" />
                        <circle cx={centerOffset + facadeWidthPixels - 38} cy={groundY - plinthHeight - storyHeight - (simulateDoubleStory ? storyHeight : 0) - 152} r="14" />
                      </g>
                    )}
                  </g>
                )}
              </g>

            </g> {/* END BUILDING ENVELOPE FILTER GROUP */}

            {/* Scale human entourage placed safely on the plinth/ground context */}
            {showEntourage && (
              <g opacity="0.8">
                {/* Scale Human silhouette placed on plinth */}
                <g fill="#1E293B" transform={`translate(${centerOffset + 65}, ${groundY - plinthHeight - 65}) scale(0.95)`}>
                  {/* Head */}
                  <circle cx="20" cy="12" r="5" />
                  {/* Neck */}
                  <line x1="20" y1="17" x2="20" y2="21" stroke="#1E293B" strokeWidth="2.5" />
                  {/* Body Torso */}
                  <path d="M12,21 L28,21 L25,48 L15,48 Z" />
                  {/* Legs */}
                  <line x1="16" y1="48" x2="16" y2="65" stroke="#1E293B" strokeWidth="3" />
                  <line x1="24" y1="48" x2="24" y2="65" stroke="#1E293B" strokeWidth="3" />
                  {/* Arms */}
                  <path d="M11,21 L8,38" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M29,21 L32,38" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" />
                  {/* Mini Clipboard label for scales */}
                  <text x="35" y="40" fill="#475569" fontSize="8" fontWeight="bold" fontFamily="monospace">SCALE H: 5.6ft</text>
                </g>
              </g>
            )}

            {/* SOIL & ROAD GEOMETRY FOOTINGS */}
            <g>
              {/* Earth/Soil fill hatch boundary below plinth */}
              <rect x="0" y={groundY} width={canvasWidth} height={canvasHeight - groundY} fill="url(#hatch-pattern)" />
              {/* Thick professional Ground Asphalt solid top-line */}
              <rect x="0" y={groundY} width={canvasWidth} height="4" fill="#1E293B" />
              {/* Road curb layer line */}
              <rect x="0" y={groundY + 12} width={canvasWidth} height="32" fill="#0F172A" />
              {/* Road markings */}
              <g stroke="#F59E0B" strokeWidth="3" strokeDasharray="30,20" opacity="0.65">
                <line x1="0" y1={groundY + 28} x2={canvasWidth} y2={groundY + 28} />
              </g>
            </g>

            {/* ARCHITECTURAL TICK ANNOTATIONS & LEVEL INDICATORS */}
            {showAnnotations && (
              <g fontFamily="monospace" fontSize="9" fontWeight="bold">
                {/* Elevation Marker 1: Top of Roof / Parapet */}
                <g transform={`translate(${centerOffset + facadeWidthPixels + 40}, ${groundY - plinthHeight - storyHeight - (simulateDoubleStory ? storyHeight : 0) - (style === 'modern' ? parapetHeight : 50)})`}>
                  <line x1="-30" y1="0" x2="10" y2="0" stroke="#334155" strokeWidth="1" />
                  <polygon points="0,0 -8,-4 -8,4" fill="#334155" />
                  <text x="15" y="3" fill="#334155">T.O. ROOF LEVEL +{totalHeightFeet.toFixed(1)}ft</text>
                </g>

                {/* Elevation Marker 2: First Floor Ceiling if simulated */}
                {simulateDoubleStory && (
                  <g transform={`translate(${centerOffset + facadeWidthPixels + 40}, ${groundY - plinthHeight - storyHeight - storyHeight})`}>
                    <line x1="-30" y1="0" x2="10" y2="0" stroke="#334155" strokeWidth="1" />
                    <polygon points="0,0 -8,-4 -8,4" fill="#334155" />
                    <text x="15" y="3" fill="#334155">1ST CEILING +12.0ft</text>
                  </g>
                )}

                {/* Elevation Marker 3: Ground Floor Ceiling */}
                <g transform={`translate(${centerOffset + facadeWidthPixels + 40}, ${groundY - plinthHeight - storyHeight})`}>
                  <line x1="-30" y1="0" x2="10" y2="0" stroke="#334155" strokeWidth="1" />
                  <polygon points="0,0 -8,-4 -8,4" fill="#334155" />
                  <text x="15" y="3" fill="#334155">GF CEILING +10.0ft</text>
                </g>

                {/* Elevation Marker 4: Plinth foundation level */}
                <g transform={`translate(${centerOffset + facadeWidthPixels + 40}, ${groundY - plinthHeight})`}>
                  <line x1="-30" y1="0" x2="10" y2="0" stroke="#047857" strokeWidth="1.2" />
                  <polygon points="0,0 -8,-4 -8,4" fill="#047857" />
                  <text x="15" y="3" fill="#047857" className="text-emerald-600">PLINTH LEVEL +2.0ft</text>
                </g>

                {/* Elevation Marker 5: Street / Ground Asphalt Level */}
                <g transform={`translate(${centerOffset + facadeWidthPixels + 40}, ${groundY})`}>
                  <line x1="-30" y1="0" x2="10" y2="0" stroke="#94A3B8" strokeWidth="1" />
                  <polygon points="0,0 -8,-4 -8,4" fill="#64748B" />
                  <text x="15" y="3" fill="#64748B">ROAD LEVEL +0.0ft</text>
                </g>

                {/* Horizontal overall dimension chain below ground line */}
                <g stroke="#475569" strokeWidth="1">
                  <line x1={centerOffset} y1={groundY + 60} x2={centerOffset + facadeWidthPixels} y2={groundY + 60} />
                  <line x1={centerOffset} y1={groundY + 55} x2={centerOffset} y2={groundY + 65} />
                  <line x1={centerOffset + facadeWidthPixels} y1={groundY + 55} x2={centerOffset + facadeWidthPixels} y2={groundY + 65} strokeWidth="1.5" />
                  
                  {/* Dimension text */}
                  <rect x={(canvasWidth / 2) - 50} y={groundY + 51} width="100" height="16" fill="white" stroke="#CBD5E1" rx="4" />
                  <text x="50%" y={groundY + 62} textAnchor="middle" stroke="none" fill="#1E293B" fontSize="9" fontWeight="extrabold">
                    SPAN: {projection === 'front' ? plotWidth : plotLength} {layout.unit}
                  </text>
                </g>
              </g>
            )}

          </svg>

          {/* Interactive element description card/tooltip at absolute bottom */}
          {hoveredElement ? (
            <div className="absolute bottom-6 left-6 right-6 z-30 bg-white/95 dark:bg-slate-900/95 p-3.5 rounded-2xl shadow-xl border border-indigo-150 dark:border-indigo-950/80 flex items-start gap-3 animate-in slide-in-from-bottom-3 duration-250 pointer-events-auto">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 rounded-xl text-indigo-600 dark:text-indigo-400 shrink-0">
                <Maximize2 className="w-4 h-4" />
              </div>
              <div className="flex-1 space-y-0.5">
                <h5 className="text-xs font-black text-slate-800 dark:text-slate-100 flex items-center justify-between">
                  <span>{hoveredElement.name}</span>
                  <button 
                    onClick={() => setHoveredElement(null)} 
                    className="text-[10px] text-slate-450 hover:text-slate-600 dark:hover:text-slate-200 transition-all cursor-pointer font-bold px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md"
                  >
                    Dismiss
                  </button>
                </h5>
                <p className="text-[10px] text-slate-500 dark:text-slate-450 leading-relaxed">
                  {hoveredElement.description}
                </p>
              </div>
            </div>
          ) : (
            <div className="absolute bottom-6 z-20 pointer-events-none select-none text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 bg-white/70 dark:bg-slate-900/70 py-1.5 px-4 rounded-full border border-slate-150 dark:border-slate-800/65 flex items-center gap-1">
              <Eye className="w-3 h-3 text-indigo-500" /> Hover over any wall, roof peak or level indicator for design specifications
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
