import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Cpu, Layers, Hammer, Compass, CheckCircle2, RefreshCw } from 'lucide-react';

interface GenerationProgressProps {
  isOpen: boolean;
}

interface StepInfo {
  min: number;
  max: number;
  text: string;
  logs: string[];
}

const STEPS: StepInfo[] = [
  {
    min: 0,
    max: 15,
    text: "Initializing Architectural Sandbox...",
    logs: [
      "Establishing high-fidelity vector drafting space",
      "Loading standard building-code sets (ANSI/IBC)",
      "Aligning coordinate systems for CAD template overlays",
      "Retrieving structural reference databases"
    ]
  },
  {
    min: 16,
    max: 35,
    text: "Analyzing Solar Facing & Wind Ingress...",
    logs: [
      "Evaluating Vastu and solar thermal trajectory",
      "Maximizing morning light penetration vectors",
      "Configuring passive ventilation flow pathways",
      "Checking layout setbacks and site buffer zones"
    ]
  },
  {
    min: 36,
    max: 55,
    text: "Drafting Exterior Walls & Foundations...",
    logs: [
      "Projecting outer plot limits as non-passable",
      "Drawing thick load-bearing perimeter brickwork",
      "Aligning structural support pillars and beam anchors",
      "Verifying structural span safety factors"
    ]
  },
  {
    min: 56,
    max: 75,
    text: "Partitioning Internal Rooms & Circulation...",
    logs: [
      "Tracing central TV lounge and dining layout",
      "Fitting bedroom partitions with functional boundaries",
      "Fitting dedicated kitchen and bathroom zones",
      "Optimizing circulation space & corridor flow"
    ]
  },
  {
    min: 76,
    max: 90,
    text: "Fitting Ventilation Openings & Custom Doors...",
    logs: [
      "Punching window apertures for optimal light factor",
      "Anchoring standard entry doors with swing arcs",
      "Running physical clash checks on door arcs",
      "Assigning room identification labels"
    ]
  },
  {
    min: 91,
    max: 98,
    text: "Extruding 3D Polygons & Textures...",
    logs: [
      "Lifting wall coordinates into 3D isometric height-maps",
      "Applying material shaders for floor planes",
      "Rendering ambient spatial shadow layers",
      "Optimizing mesh vertices for live camera orbit"
    ]
  },
  {
    min: 99,
    max: 100,
    text: "Optimizing Blueprints & Compiling Naqsha...",
    logs: [
      "Running final room area calculation scans",
      "Generating standard schedule inventories",
      "Packaging custom SVG vectors for blueprint render",
      "Architectural draft verified. Compilation successful!"
    ]
  }
];

export default function GenerationProgress({ isOpen }: GenerationProgressProps) {
  const [progress, setProgress] = useState(0);
  const [activeLogs, setActiveLogs] = useState<string[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Active step details
  const activeStep = STEPS.find(s => progress >= s.min && progress <= s.max) || STEPS[0];

  useEffect(() => {
    if (!isOpen) {
      setProgress(0);
      setActiveLogs([]);
      return;
    }

    // Progress bar progressive loading
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 98) {
          // Stay at 98 until parent unmounts/closes it
          return 98;
        }
        
        // Dynamic increments: faster at start, slower as it nears completion
        let increment = 1;
        if (prev < 40) {
          increment = Math.floor(Math.random() * 4) + 3; // 3-6%
        } else if (prev < 75) {
          increment = Math.floor(Math.random() * 3) + 2; // 2-4%
        } else {
          increment = Math.floor(Math.random() * 2) + 1; // 1-2%
        }

        const nextVal = Math.min(prev + increment, 98);
        return nextVal;
      });
    }, 180);

    return () => clearInterval(interval);
  }, [isOpen]);

  // Handle addition of logs dynamically over progress
  useEffect(() => {
    if (!isOpen) return;

    // Based on the current progress, add matching log records with a little stagger
    const currentStepLogs = activeStep.logs;
    // Find logs that aren't already included
    currentStepLogs.forEach((log, idx) => {
      const isLogged = activeLogs.includes(log);
      if (!isLogged) {
        // Add log with some delay so they stream in beautifully
        const timer = setTimeout(() => {
          setActiveLogs(prev => {
            if (prev.includes(log)) return prev;
            return [...prev, log];
          });
        }, idx * 450);
        return () => clearTimeout(timer);
      }
    });
  }, [progress, isOpen, activeStep, activeLogs]);

  // Scroll to bottom of logs on update
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeLogs]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
      <div className="w-full max-w-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
        
        {/* Dynamic Glowing Aura behind */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-blue-500/10 dark:bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header with animating icon */}
        <div className="flex items-center space-x-4 relative">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-2xl relative">
            <RefreshCw className="w-6 h-6 animate-spin duration-3000" />
            <Sparkles className="w-3.5 h-3.5 text-amber-500 absolute -top-1.5 -right-1.5 animate-bounce" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-black text-blue-600 dark:text-blue-400 tracking-wider">
              Smart Architectural Engine
            </span>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              Drafting House Naqsha
            </h3>
          </div>
        </div>

        {/* Progress Display with percentage */}
        <div className="space-y-2">
          <div className="flex justify-between items-end">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {activeStep.text}
            </span>
            <span className="text-sm font-mono font-black text-blue-600 dark:text-blue-400">
              {progress}%
            </span>
          </div>

          {/* Progress bar container */}
          <div className="w-full h-3 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden border border-slate-200/50 dark:border-slate-800">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600 rounded-full shadow-lg shadow-blue-500/20 transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* CAD Drafting Live Diagnostic Console */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Cpu className="w-3 h-3 text-slate-500" />
              CAD Draft Console logs
            </span>
            <div className="flex items-center space-x-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[8px] font-bold text-slate-400 font-mono">LIVE FEED</span>
            </div>
          </div>

          <div className="h-40 bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-4 overflow-y-auto font-mono text-[10px] text-slate-600 dark:text-slate-400 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
            {activeLogs.length === 0 ? (
              <div className="text-slate-400 dark:text-slate-500 italic">Starting draft systems...</div>
            ) : (
              activeLogs.map((log, index) => {
                const isLatest = index === activeLogs.length - 1;
                return (
                  <div key={index} className={`flex items-start ${isLatest ? 'text-slate-900 dark:text-white font-semibold' : 'opacity-70'}`}>
                    <span className="text-blue-500 mr-2 shrink-0 select-none">&gt;</span>
                    <span>{log}</span>
                  </div>
                );
              })
            )}
            <div ref={logsEndRef} />
          </div>
        </div>

        {/* Proportional footnote explaining what's happening */}
        <div className="flex items-center space-x-2.5 p-3.5 bg-indigo-50/50 dark:bg-indigo-950/10 border border-indigo-100/50 dark:border-indigo-900/20 rounded-2xl">
          <Compass className="w-4 h-4 text-indigo-500 dark:text-indigo-400 shrink-0" />
          <p className="text-[10px] text-indigo-700/80 dark:text-indigo-300/80 leading-relaxed">
            The Naqsha engine automatically designs layout orientations, fits rooms, aligns load-bearing pathways, and compiles a comprehensive 3D structure based on your plot parameters.
          </p>
        </div>

      </div>
    </div>
  );
}
