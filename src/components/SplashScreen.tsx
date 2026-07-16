import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Compass, Cpu, Layers, HardHat } from 'lucide-react';

interface SplashScreenProps {
  onComplete: () => void;
}

const TELEMETRY_LINES = [
  'INITIALIZING DESIGN COORDINATE ENGINE...',
  'CALCULATING BEARING CAPACITY SPANS...',
  'GENERATING PROCEDURAL ROOM BLUEPRINTS...',
  'OPTIMIZING SOLAR ORIENTATION VECTORS...',
  'PRE-LOADING 3D AMBIENT DAYLIGHT SHADERS...',
  'STYLING SCENIC LANDSCAPING ALGORITHMS...',
  'SYSTEM READY. LAUNCHING WORKSPACE...'
];

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [telemetryIndex, setTelemetryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [show, setShow] = useState(true);

  // Rotate telemetry text
  useEffect(() => {
    const textTimer = setInterval(() => {
      setTelemetryIndex((prev) => (prev < TELEMETRY_LINES.length - 1 ? prev + 1 : prev));
    }, 380);

    return () => clearInterval(textTimer);
  }, []);

  // Update progress bar
  useEffect(() => {
    const progressTimer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressTimer);
          // Wait 300ms after progress reaches 100%, then trigger fade out and complete
          setTimeout(() => {
            setShow(false);
          }, 300);
          return 100;
        }
        // Smooth logarithmic loading curve
        const increment = Math.max(1, Math.floor((100 - prev) * 0.15));
        return prev + increment;
      });
    }, 100);

    return () => clearInterval(progressTimer);
  }, []);

  // Trigger main completion when fade out completes
  const handleAnimationEnd = () => {
    if (!show) {
      onComplete();
    }
  };

  return (
    <AnimatePresence onExitComplete={handleAnimationEnd}>
      {show && (
        <motion.div
          id="splash-screen-container"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className="fixed inset-0 z-[9999] bg-[#090d16] flex flex-col items-center justify-center p-6 select-none overflow-hidden"
        >
          {/* Futuristic blueprint technical grid background */}
          <div 
            className="absolute inset-0 opacity-[0.06] pointer-events-none"
            style={{
              backgroundImage: `
                radial-gradient(circle, #3b82f6 1px, transparent 1px),
                linear-gradient(to right, rgba(59, 130, 246, 0.1) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
              `,
              backgroundSize: '24px 24px, 48px 48px, 48px 48px',
              backgroundPosition: 'center'
            }}
          />

          {/* Ambient center glowing pulse behind the house outline */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-blue-600/10 dark:bg-blue-500/10 rounded-full filter blur-[80px] animate-pulse pointer-events-none" />

          {/* Core drafting anim hub */}
          <div className="relative z-10 flex flex-col items-center justify-center max-w-lg w-full text-center space-y-8">
            
            {/* Self-assembling wireframe blueprint structure with Framer Motion */}
            <div className="relative w-40 h-40 flex items-center justify-center">
              {/* Spinning technical compass coordinate circles */}
              <motion.div
                initial={{ rotate: 0 }}
                animate={{ rotate: 360 }}
                transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 border border-dashed border-blue-500/20 rounded-full"
              />
              <motion.div
                initial={{ rotate: 0 }}
                animate={{ rotate: -360 }}
                transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-4 border border-blue-400/30 rounded-full"
                style={{ borderTopColor: 'transparent', borderBottomColor: 'transparent' }}
              />

              {/* Central Drafting Blueprint Icon */}
              <motion.div
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="relative z-10 p-5 bg-slate-900/80 rounded-3xl border border-blue-500/30 shadow-[0_0_30px_rgba(37,99,235,0.25)]"
              >
                <svg
                  className="w-16 h-16 text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Outer Roof lines drawing in */}
                  <motion.path
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.5, delay: 0.2, ease: 'easeInOut' }}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                  {/* Precision measuring crosshairs and points */}
                  <motion.circle
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.4, delay: 1.6 }}
                    cx="12"
                    cy="3"
                    r="1.5"
                    fill="#fbbf24"
                    stroke="#fbbf24"
                  />
                  <motion.circle
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.4, delay: 1.7 }}
                    cx="3"
                    cy="12"
                    r="1.5"
                    fill="#3b82f6"
                    stroke="#3b82f6"
                  />
                  <motion.circle
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.4, delay: 1.8 }}
                    cx="21"
                    cy="12"
                    r="1.5"
                    fill="#3b82f6"
                    stroke="#3b82f6"
                  />
                  
                  {/* Internal blueprint grid layout details inside the house */}
                  <motion.path
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 1, 0.5, 1] }}
                    transition={{ duration: 1.2, delay: 1.2, repeat: Infinity, repeatType: 'reverse' }}
                    strokeWidth="1"
                    strokeDasharray="2 2"
                    d="M9 21V12h6v9"
                  />
                </svg>
              </motion.div>

              {/* Floating drafting vector markers */}
              <div className="absolute top-2 left-2 text-[8px] font-mono text-blue-500/60 font-bold select-none">
                YAW: 45°
              </div>
              <div className="absolute bottom-2 right-2 text-[8px] font-mono text-blue-500/60 font-bold select-none">
                Z-Z: GRID
              </div>
            </div>

            {/* Application Branding Info */}
            <div className="space-y-3">
              <motion.div
                initial={{ y: 15, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="flex items-center justify-center space-x-2"
              >
                <Layers className="w-4 h-4 text-amber-500 animate-pulse" />
                <span className="text-[10px] font-extrabold text-amber-500 tracking-[0.25em] uppercase">
                  ENGINEERING CORE v2.4
                </span>
              </motion.div>

              <motion.h1
                initial={{ y: 15, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="text-2xl sm:text-3xl font-black text-white tracking-wider font-sans uppercase"
              >
                Smart Home <span className="text-blue-500">Naqsha</span>
              </motion.h1>

              <motion.p
                initial={{ y: 15, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="text-[11px] text-slate-400 font-medium tracking-wide max-w-xs mx-auto"
              >
                Procedural 2D Drafting & Interactive 3D Architecture
              </motion.p>
            </div>

            {/* Industrial Load Progress Bar */}
            <div className="space-y-4 w-11/12 max-w-sm mx-auto">
              <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800/80 p-[1px] relative">
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full relative"
                  style={{ width: `${progress}%` }}
                  layoutId="splash-progress-bar"
                >
                  {/* Glowing end indicator dot */}
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-300 rounded-full shadow-[0_0_10px_#60a5fa]" />
                </motion.div>
              </div>

              {/* Interactive telemetry compilation logger */}
              <div className="h-6 overflow-hidden flex items-center justify-center">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={telemetryIndex}
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 0.8 }}
                    exit={{ y: -10, opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className="text-[9px] font-mono text-blue-400 font-semibold tracking-widest flex items-center gap-2 justify-center"
                  >
                    <span className="inline-block w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping" />
                    <span>{TELEMETRY_LINES[telemetryIndex]}</span>
                    <span className="text-slate-500">({progress}%)</span>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* Subtle disclaimer notes at the bottom */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              transition={{ delay: 1 }}
              className="absolute bottom-6 inset-x-0 text-center text-[9px] font-mono text-slate-600 uppercase tracking-widest"
            >
              Architectural Engine © {new Date().getFullYear()} Naqsha Studio
            </motion.div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
