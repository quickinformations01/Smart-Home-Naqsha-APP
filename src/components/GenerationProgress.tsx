import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Cpu, 
  Compass, 
  RefreshCw, 
  ShieldCheck, 
  Layers, 
  Boxes, 
  CheckCircle2, 
  CircleDot,
  Dna
} from 'lucide-react';

interface GenerationProgressProps {
  isOpen: boolean;
  onComplete?: () => void;
  durationMs?: number; // allow custom override, default 12000ms (12s)
}

interface EngineeringPhase {
  id: number;
  name: string;
  sub: string;
  icon: React.ComponentType<any>;
  range: [number, number];
  logs: string[];
}

const PHASES: EngineeringPhase[] = [
  {
    id: 1,
    name: "Site Analytics & Boundaries",
    sub: "Boundary constraints & vector spacing mapping",
    icon: Compass,
    range: [0, 25],
    logs: [
      "ESTABLISHING SITE MATRIX OVERLAYS (ANSI/IBC COMPLIANT)...",
      "PARSING PHYSICAL PLOT GEOMETRY BOUNDARIES...",
      "CALIBRATING GPS SPATIAL COORDINATE ACCURACY...",
      "NORMALIZING GROUND TOPO STRESS-LINES & ANGLE DEVIATIONS...",
      "SETTING UP SAFE BUFFER MARGINS & BUILDING CORRIDORS..."
    ]
  },
  {
    id: 2,
    name: "Solar & Environmental Physics",
    sub: "Sun trajectory, wind flow, & daylight harvesting",
    icon: Dna,
    range: [26, 55],
    logs: [
      "MAPPING SOLAR TRANSIT THERMAL PATHWAYS...",
      "MAXIMIZING MORNING SUNRISE INGRESS CO-EFFICIENTS...",
      "SIMULATING PASSIVE AIRFLOW & CROSS-VENTILATION CHANNELS...",
      "OPTIMIZING VASTU PRINCIPLE GRIDSETS FOR ALL-DAY WARMTH...",
      "RESOLVING WIND RESISTANCE AND PRESSURE DEFLECTION BUFFER..."
    ]
  },
  {
    id: 3,
    name: "Zoning & Load-Bearing Structuring",
    sub: "Wall tracing, stress safety limits, & door clearance",
    icon: Layers,
    range: [56, 85],
    logs: [
      "CALCULATING STRUCTURAL SPAN SAFETY RATIOS...",
      "PROJECTING LOAD-BEARING OUTER BRICKWORK CORRIDORS...",
      "ANCHORING CONCRETE BEAM STRESS ANCHORS & COLUMNS...",
      "PARTITIONING INTERNAL PUBLIC DRAWING & BEDROOM CORES...",
      "RUNNING CLASH-DETECTION PROTOCOLS ON DOOR ACCESS ARCS..."
    ]
  },
  {
    id: 4,
    name: "3D Polygonal Mesh Synthesis",
    sub: "Height extrusion, SVG matrices compile, & rendering",
    icon: Boxes,
    range: [86, 100],
    logs: [
      "EXTRUDING WALL GEOMETRIES INTO ISOMETRIC HEIGHT-MAPS...",
      "INJECTING HIGH-DEFINITION VENTILATION AND WINDOW SLITS...",
      "COMPILING LIGHTING MAPS AND SHADER OCCLUSION MATRICES...",
      "GENERATING STANDARDIZED BLUEPRINT SVG VECTOR INVENTORIES...",
      "NAQSHA VECTOR ARCHITECTURAL DRAFT VERIFIED AND LOCKED."
    ]
  }
];

export default function GenerationProgress({ 
  isOpen, 
  onComplete, 
  durationMs = 12000 
}: GenerationProgressProps) {
  const [progress, setProgress] = useState(0);
  const [activeLogs, setActiveLogs] = useState<string[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);
  
  // Guard onComplete from triggering effect re-runs
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Restart loading state when modal opens
  useEffect(() => {
    if (!isOpen) {
      setProgress(0);
      setActiveLogs([]);
      return;
    }

    const startTime = Date.now();
    const intervalTime = 60; // frequent updates for ultra-smooth fluid flow

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const calculatedProgress = Math.min((elapsed / durationMs) * 100, 100);
      
      setProgress(Math.floor(calculatedProgress));

      if (elapsed >= durationMs) {
        clearInterval(timer);
        setProgress(100);
        setTimeout(() => {
          if (onCompleteRef.current) {
            onCompleteRef.current();
          }
        }, 800); // sleek delay to admire 100% completion
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [isOpen, durationMs]);

  // Compute active phase on-the-fly from current progress state
  const currentPhase = PHASES.find(p => progress >= p.range[0] && progress <= p.range[1]) || PHASES[PHASES.length - 1];

  // Feed logs progressively during execution
  useEffect(() => {
    if (!isOpen) return;

    // Collect all logs up to current progress level
    let compiledLogs: string[] = [];
    
    PHASES.forEach(phase => {
      if (progress >= phase.range[0]) {
        // Calculate how far we are into this phase's logs
        const phaseProgress = (progress - phase.range[0]) / (phase.range[1] - phase.range[0]);
        const logsToShowCount = Math.min(
          Math.ceil(phaseProgress * phase.logs.length), 
          phase.logs.length
        );
        compiledLogs.push(...phase.logs.slice(0, logsToShowCount));
      }
    });

    setActiveLogs(compiledLogs);
  }, [progress, isOpen]);

  // Handle smooth logging auto-scroll
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeLogs]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
      {/* Cinematic grid lines scanning animation */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,24,38,0)_95%,rgba(99,102,241,0.15)_95%)] bg-[size:100%_40px] pointer-events-none animate-pulse duration-[3000ms]" style={{ animation: 'scan 4s linear infinite' }} />

      <div className="w-full max-w-2xl bg-slate-900/95 dark:bg-slate-950/95 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col space-y-6">
        
        {/* Holographic Glowing Ambient Accents */}
        <div className="absolute -top-12 -left-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800 relative z-10">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-tr from-indigo-500/10 to-blue-500/10 text-indigo-400 rounded-2xl border border-indigo-500/20 relative">
              <RefreshCw className="w-6.5 h-6.5 animate-spin text-indigo-400" style={{ animationDuration: '3s' }} />
              <Sparkles className="w-4 h-4 text-amber-400 absolute -top-1 -right-1 animate-bounce" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-black text-indigo-400 tracking-widest flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 animate-pulse text-indigo-400" />
                SMART BLUEPRINT AUTOMATION ENGINE
              </span>
              <h3 className="font-display text-xl font-black text-slate-50 uppercase tracking-wide">
                Compiling CAD Naqsha Layout
              </h3>
            </div>
          </div>
          <div className="bg-slate-800 border border-slate-700/60 rounded-2xl px-4 py-2 flex items-center space-x-2.5 shrink-0 self-start sm:self-auto">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] font-mono font-bold text-slate-350 tracking-wider">COMPILING CORE ARCH</span>
          </div>
        </div>

        {/* Cinematic Stepper Progress Tracker */}
        <div className="grid grid-cols-4 gap-2 relative z-10 pt-1">
          {PHASES.map((phase) => {
            const isCompleted = progress > phase.range[1];
            const isActive = progress >= phase.range[0] && progress <= phase.range[1];
            const PhaseIcon = phase.icon;

            return (
              <div key={phase.id} className="space-y-2">
                <div className="flex items-center space-x-1.5">
                  <div className={`p-1.5 rounded-lg border transition-all duration-300 ${
                    isCompleted 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-md shadow-emerald-500/5' 
                      : isActive 
                        ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30 shadow-md shadow-indigo-500/5' 
                        : 'bg-slate-900/40 text-slate-600 border-slate-800'
                  }`}>
                    <PhaseIcon className="w-3.5 h-3.5" />
                  </div>
                  <span className={`text-[9px] font-black uppercase tracking-widest hidden sm:inline ${
                    isCompleted ? 'text-emerald-400' : isActive ? 'text-indigo-400' : 'text-slate-600'
                  }`}>
                    Phase {phase.id}
                  </span>
                </div>
                {/* Horizontal line meter */}
                <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${
                      isCompleted 
                        ? 'bg-emerald-500' 
                        : isActive 
                          ? 'bg-indigo-500 animate-pulse' 
                          : 'bg-transparent'
                    }`}
                    style={{ width: isCompleted ? '100%' : isActive ? `${((progress - phase.range[0]) / (phase.range[1] - phase.range[0])) * 100}%` : '0%' }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Current Dynamic Phase Indicator Card */}
        <div className="bg-slate-950/40 border border-slate-800 p-4 rounded-2xl space-y-1.5 relative overflow-hidden">
          {/* Neon laser overlay sweeps left and right */}
          <div className="absolute top-0 bottom-0 left-0 w-1 bg-gradient-to-b from-indigo-500 to-blue-500 blur-[1px] shadow-lg shadow-indigo-500/50" style={{ animation: 'laser-sweep 3s ease-in-out infinite' }} />
          
          <div className="flex justify-between items-center pl-2">
            <div className="space-y-0.5">
              <span className="text-[9px] font-extrabold text-indigo-400 uppercase tracking-widest block">
                ACTIVE PHASE WORKLOAD
              </span>
              <h4 className="text-sm font-bold text-slate-100 uppercase">
                {currentPhase.name}
              </h4>
            </div>
            <div className="text-right">
              <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest block">
                OVERALL STACK
              </span>
              <span className="text-lg font-mono font-black text-indigo-400">
                {progress}%
              </span>
            </div>
          </div>

          {/* Smooth Linear Progress Bar with glowing point */}
          <div className="relative pt-2 pl-2">
            <div className="w-full h-3 bg-slate-900 border border-slate-800 rounded-full overflow-hidden relative">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-indigo-600 rounded-full transition-all duration-100 ease-out relative"
                style={{ width: `${progress}%` }}
              >
                {/* Glowing light bead at the edge */}
                {progress > 0 && progress < 100 && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white shadow-lg shadow-indigo-400 animate-ping" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* CAD Drafting Real-Time Logging Monitor Terminal */}
        <div className="space-y-2 relative z-10">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-slate-500" />
              CAD CORE TELEMETRY MATRIX
            </span>
            <div className="flex items-center space-x-1.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
              <span className="text-[9px] font-bold text-slate-400 font-mono tracking-tight">ENGINE FEEDING</span>
            </div>
          </div>

          <div className="h-44 bg-slate-950 border border-slate-800 rounded-2xl p-4.5 overflow-y-auto font-mono text-[10px] text-slate-400 space-y-2.5 shadow-inner">
            {activeLogs.length === 0 ? (
              <div className="text-slate-600 italic animate-pulse">Establishing core blueprint system protocols...</div>
            ) : (
              activeLogs.map((log, index) => {
                const isLatest = index === activeLogs.length - 1;
                return (
                  <div 
                    key={index} 
                    className={`flex items-start transition-all duration-150 ${
                      isLatest ? 'text-indigo-300 font-extrabold scale-[1.005]' : 'opacity-65 text-slate-400'
                    }`}
                  >
                    <span className="text-indigo-500 mr-2 shrink-0 select-none">&gt;&gt;</span>
                    <span className="tracking-tight leading-relaxed uppercase">{log}</span>
                  </div>
                );
              })
            )}
            <div ref={logsEndRef} />
          </div>
        </div>

        {/* Footer info block */}
        <div className="flex items-start gap-3 p-4 bg-slate-950/40 border border-slate-800 rounded-2xl relative z-10">
          <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
          <p className="text-[10.5px] text-slate-400 leading-normal tracking-tight font-medium">
            Smart Home Naqsha automates spatial layout zoning, load stress margins, Vastu sun alignments, and 3D meshes to build a compliant, highly optimized blueprint tailored specifically for your structural parameters.
          </p>
        </div>

      </div>

      <style>{`
        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        @keyframes laser-sweep {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(580px); }
        }
      `}</style>
    </div>
  );
}
