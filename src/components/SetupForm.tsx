import React, { useState } from 'react';
import { 
  Ruler, 
  Sparkles, 
  Compass, 
  Layout, 
  HelpCircle, 
  ChevronRight, 
  Check, 
  MapPin, 
  Sun, 
  ArrowUpRight,
  Sliders,
  Sunrise,
  Sunset,
  Moon,
  Building2,
  CornerUpLeft,
  CornerUpRight,
  Wind,
  CheckCircle2,
  Info,
  ShieldCheck,
  Layers
} from 'lucide-react';
import { motion } from 'motion/react';

interface SetupFormProps {
  onGenerate: (
    width: number,
    length: number,
    unit: 'ft' | 'm',
    plotType: 'corner' | 'corner-left' | 'corner-right' | 'standard',
    facing: 'north' | 'south' | 'east' | 'west'
  ) => void;
  isLoading: boolean;
}

export default function SetupForm({ onGenerate, isLoading }: SetupFormProps) {
  const [width, setWidth] = useState<string>('30');
  const [length, setLength] = useState<string>('50');
  const [unit, setUnit] = useState<'ft' | 'm'>('ft');
  const [plotType, setPlotType] = useState<'corner' | 'corner-left' | 'corner-right' | 'standard'>('standard');
  const [facing, setFacing] = useState<'north' | 'south' | 'east' | 'west'>('east');
  const [error, setError] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseFloat(width);
    const l = parseFloat(length);

    if (isNaN(w) || w <= 0) {
      setError('Please enter a valid plot width.');
      return;
    }
    if (isNaN(l) || l <= 0) {
      setError('Please enter a valid plot length.');
      return;
    }
    if (w < 10 || l < 15) {
      setError(`Plot dimensions are too small to generate a residential layout (Min 10x15 ${unit}).`);
      return;
    }

    setError('');
    onGenerate(w, l, unit, plotType, facing);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-100/50 dark:shadow-none transition-all duration-300 relative overflow-hidden">
      {/* Decorative backdrop glow */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-3xl -translate-y-12 translate-x-12 pointer-events-none" />

      <div className="flex items-center space-x-4 mb-8 border-b border-slate-100 dark:border-slate-850 pb-5">
        <div className="p-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl border border-blue-500/10 shadow-inner">
          <Ruler className="w-5.5 h-5.5" />
        </div>
        <div>
          <h2 className="text-sm font-display font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
            Plot Layout Configuration
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium leading-normal">
            Enter your site parameters. The AI architect will compile a fully ventilated spatial blueprint.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Unit Selector */}
        <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-950/50 p-2 rounded-2xl border border-slate-200/60 dark:border-slate-800/80">
          <span className="text-xs font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wider pl-2 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-slate-400" /> Metric System
          </span>
          <div className="inline-flex rounded-xl p-1 bg-slate-100 dark:bg-slate-850/80 border border-slate-200/50 dark:border-slate-800/50">
            <button
              type="button"
              onClick={() => setUnit('ft')}
              className={`px-4.5 py-2 text-[10px] font-black uppercase rounded-lg transition-all duration-150 cursor-pointer flex items-center gap-1.5 ${
                unit === 'ft'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-md border border-slate-200/20'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {unit === 'ft' && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
              <span>Feet (ft)</span>
            </button>
            <button
              type="button"
              onClick={() => setUnit('m')}
              className={`px-4.5 py-2 text-[10px] font-black uppercase rounded-lg transition-all duration-150 cursor-pointer flex items-center gap-1.5 ${
                unit === 'm'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-md border border-slate-200/20'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {unit === 'm' && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
              <span>Meters (m)</span>
            </button>
          </div>
        </div>

        {/* Width and Length Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Plot Width */}
          <div className="space-y-2">
            <label className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Plot Width ({unit})
            </label>
            <div className="relative">
              <input
                type="number"
                value={width}
                onChange={(e) => setWidth(e.target.value)}
                placeholder="e.g. 30"
                min="10"
                step="any"
                className="w-full p-3.5 bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-extrabold text-sm"
                required
                id="plot-width-input"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-mono font-bold uppercase">
                {unit}
              </span>
            </div>
          </div>

          {/* Plot Length */}
          <div className="space-y-2">
            <label className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Plot Length ({unit})
            </label>
            <div className="relative">
              <input
                type="number"
                value={length}
                onChange={(e) => setLength(e.target.value)}
                placeholder="e.g. 50"
                min="15"
                step="any"
                className="w-full p-3.5 bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-extrabold text-sm"
                required
                id="plot-length-input"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-mono font-bold uppercase">
                {unit}
              </span>
            </div>
          </div>
        </div>

        {/* Plot Aspect Type (Corner & Zoning Selection) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-blue-500" />
              <span>Plot Location & Road Aspect</span>
            </label>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
              Zoning & Ventilation
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              {
                id: 'standard',
                title: 'Standard Plot',
                tag: '1 Front Road',
                subtitle: 'Front Road Only',
                desc: 'Closed on left, right & back by adjacent plots.',
                icon: Building2,
                svg: (
                  <svg viewBox="0 0 100 60" className="w-full h-12 rounded-lg bg-slate-100 dark:bg-slate-900 p-1">
                    {/* Neighbors (Left, Right, Top) */}
                    <rect x="2" y="2" width="22" height="42" rx="2" fill="currentColor" className="text-slate-300 dark:text-slate-800" />
                    <rect x="76" y="2" width="22" height="42" rx="2" fill="currentColor" className="text-slate-300 dark:text-slate-800" />
                    <rect x="26" y="2" width="48" height="10" rx="2" fill="currentColor" className="text-slate-300 dark:text-slate-800" />
                    {/* Plot Center */}
                    <rect x="26" y="14" width="48" height="30" rx="3" fill="currentColor" className="text-blue-500/20 dark:text-blue-500/30 stroke-blue-500" strokeWidth="1.5" />
                    <text x="50" y="32" textAnchor="middle" className="text-[8px] font-black fill-blue-600 dark:fill-blue-400">PLOT</text>
                    {/* Front Road */}
                    <rect x="2" y="46" width="96" height="12" rx="2" fill="currentColor" className="text-slate-400 dark:text-slate-700" />
                    <line x1="10" y1="52" x2="90" y2="52" stroke="currentColor" className="text-slate-200 dark:text-slate-500" strokeDasharray="3 3" strokeWidth="1" />
                    <text x="50" y="55" textAnchor="middle" className="text-[7px] font-bold fill-white">FRONT ROAD</text>
                  </svg>
                )
              },
              {
                id: 'corner-left',
                title: 'Left Corner',
                tag: '2 Open Roads',
                subtitle: 'Front + Left Street',
                desc: 'Open road on left side for extra light & side doors.',
                icon: CornerUpLeft,
                svg: (
                  <svg viewBox="0 0 100 60" className="w-full h-12 rounded-lg bg-slate-100 dark:bg-slate-900 p-1">
                    {/* Neighbors (Right, Top) */}
                    <rect x="76" y="2" width="22" height="42" rx="2" fill="currentColor" className="text-slate-300 dark:text-slate-800" />
                    <rect x="26" y="2" width="48" height="10" rx="2" fill="currentColor" className="text-slate-300 dark:text-slate-800" />
                    {/* Left Street */}
                    <rect x="2" y="2" width="22" height="56" rx="2" fill="currentColor" className="text-slate-400 dark:text-slate-700" />
                    <text x="13" y="30" textAnchor="middle" className="text-[6px] font-bold fill-white" transform="rotate(-90 13 30)">LEFT STREET</text>
                    {/* Plot Center */}
                    <rect x="26" y="14" width="48" height="30" rx="3" fill="currentColor" className="text-blue-500/20 dark:text-blue-500/30 stroke-blue-500" strokeWidth="1.5" />
                    <text x="50" y="32" textAnchor="middle" className="text-[8px] font-black fill-blue-600 dark:fill-blue-400">PLOT</text>
                    {/* Ventilation indicators */}
                    <circle cx="26" cy="22" r="2" fill="currentColor" className="text-cyan-400" />
                    <circle cx="26" cy="36" r="2" fill="currentColor" className="text-cyan-400" />
                    {/* Front Road */}
                    <rect x="26" y="46" width="72" height="12" rx="2" fill="currentColor" className="text-slate-400 dark:text-slate-700" />
                    <text x="62" y="55" textAnchor="middle" className="text-[7px] font-bold fill-white">FRONT ROAD</text>
                  </svg>
                )
              },
              {
                id: 'corner-right',
                title: 'Right Corner',
                tag: '2 Open Roads',
                subtitle: 'Front + Right Street',
                desc: 'Open road on right side for extra light & side doors.',
                icon: CornerUpRight,
                svg: (
                  <svg viewBox="0 0 100 60" className="w-full h-12 rounded-lg bg-slate-100 dark:bg-slate-900 p-1">
                    {/* Neighbors (Left, Top) */}
                    <rect x="2" y="2" width="22" height="42" rx="2" fill="currentColor" className="text-slate-300 dark:text-slate-800" />
                    <rect x="26" y="2" width="48" height="10" rx="2" fill="currentColor" className="text-slate-300 dark:text-slate-800" />
                    {/* Right Street */}
                    <rect x="76" y="2" width="22" height="56" rx="2" fill="currentColor" className="text-slate-400 dark:text-slate-700" />
                    <text x="87" y="30" textAnchor="middle" className="text-[6px] font-bold fill-white" transform="rotate(90 87 30)">RIGHT STREET</text>
                    {/* Plot Center */}
                    <rect x="26" y="14" width="48" height="30" rx="3" fill="currentColor" className="text-blue-500/20 dark:text-blue-500/30 stroke-blue-500" strokeWidth="1.5" />
                    <text x="50" y="32" textAnchor="middle" className="text-[8px] font-black fill-blue-600 dark:fill-blue-400">PLOT</text>
                    {/* Ventilation indicators */}
                    <circle cx="74" cy="22" r="2" fill="currentColor" className="text-cyan-400" />
                    <circle cx="74" cy="36" r="2" fill="currentColor" className="text-cyan-400" />
                    {/* Front Road */}
                    <rect x="2" y="46" width="72" height="12" rx="2" fill="currentColor" className="text-slate-400 dark:text-slate-700" />
                    <text x="38" y="55" textAnchor="middle" className="text-[7px] font-bold fill-white">FRONT ROAD</text>
                  </svg>
                )
              },
              {
                id: 'corner',
                title: 'Dual Corner',
                tag: '3 Open Sides',
                subtitle: 'Boulevard / Dual Street',
                desc: 'Maximum open air & panoramic dual-façade architecture.',
                icon: Layers,
                svg: (
                  <svg viewBox="0 0 100 60" className="w-full h-12 rounded-lg bg-slate-100 dark:bg-slate-900 p-1">
                    {/* Left & Right Streets */}
                    <rect x="2" y="2" width="20" height="56" rx="2" fill="currentColor" className="text-slate-400 dark:text-slate-700" />
                    <rect x="78" y="2" width="20" height="56" rx="2" fill="currentColor" className="text-slate-400 dark:text-slate-700" />
                    {/* Top Neighbor */}
                    <rect x="24" y="2" width="52" height="10" rx="2" fill="currentColor" className="text-slate-300 dark:text-slate-800" />
                    {/* Plot Center */}
                    <rect x="24" y="14" width="52" height="30" rx="3" fill="currentColor" className="text-blue-500/20 dark:text-blue-500/30 stroke-blue-500" strokeWidth="1.5" />
                    <text x="50" y="32" textAnchor="middle" className="text-[8px] font-black fill-blue-600 dark:fill-blue-400">PLOT</text>
                    {/* Air indicators */}
                    <circle cx="24" cy="29" r="2" fill="currentColor" className="text-cyan-400" />
                    <circle cx="76" cy="29" r="2" fill="currentColor" className="text-cyan-400" />
                    {/* Front Road */}
                    <rect x="2" y="46" width="96" height="12" rx="2" fill="currentColor" className="text-slate-400 dark:text-slate-700" />
                    <text x="50" y="55" textAnchor="middle" className="text-[7px] font-bold fill-white">FRONT ROAD</text>
                  </svg>
                )
              }
            ].map((item) => {
              const isSelected = plotType === item.id;
              const IconComp = item.icon;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setPlotType(item.id as any)}
                  className={`p-3.5 rounded-2xl text-left border transition-all duration-300 flex flex-col justify-between relative cursor-pointer group hover:scale-[1.02] active:scale-[0.98] ${
                    isSelected
                      ? 'bg-blue-500/5 dark:bg-blue-500/10 border-blue-500 shadow-md shadow-blue-500/5 ring-2 ring-blue-500/30'
                      : 'bg-slate-50/60 dark:bg-slate-950/40 hover:bg-slate-50 dark:hover:bg-slate-950/80 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  {/* Top Badge & Title */}
                  <div>
                    <div className="flex justify-between items-center w-full mb-1.5">
                      <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        isSelected 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}>
                        {item.tag}
                      </span>
                      {isSelected ? (
                        <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />
                      ) : (
                        <IconComp className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
                      )}
                    </div>

                    <h4 className="text-xs font-black tracking-tight text-slate-900 dark:text-white uppercase mt-1">
                      {item.title}
                    </h4>
                    <p className="text-[10px] text-blue-600 dark:text-blue-400 font-bold tracking-tight">
                      {item.subtitle}
                    </p>
                  </div>

                  {/* Micro Diagram */}
                  <div className="my-2.5">
                    {item.svg}
                  </div>

                  {/* Description */}
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-tight">
                    {item.desc}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Dynamic Ventilation & Zoning Note */}
          <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/20 text-xs text-slate-700 dark:text-slate-300 font-medium">
            <Wind className="w-4 h-4 text-blue-500 shrink-0 animate-pulse" />
            <span className="text-[11px] leading-snug">
              {plotType === 'standard' && (
                <><strong>Standard Plot Selected:</strong> Generates central ventilation courtyards & air ducts for inner rooms.</>
              )}
              {plotType === 'corner-left' && (
                <><strong>Left Corner Plot Selected:</strong> Auto-integrates natural light windows along the left side street boundary.</>
              )}
              {plotType === 'corner-right' && (
                <><strong>Right Corner Plot Selected:</strong> Auto-integrates natural light windows along the right side street boundary.</>
              )}
              {plotType === 'corner' && (
                <><strong>Dual Corner Plot Selected:</strong> Integrates panoramic side street windows for maximum cross-ventilation.</>
              )}
            </span>
          </div>
        </div>

        {/* Facing Direction Compass with beautiful solar paths */}
        <div className="space-y-2">
          <label className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
            <span>Compass Facing Direction</span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-normal flex items-center gap-1">
              <Compass className="w-3 h-3 text-blue-500" /> Determines Sun Paths
            </span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { id: 'east', title: 'East', sub: 'Morning Sun', icon: Sunrise, iconColor: 'text-amber-500' },
              { id: 'west', title: 'West', sub: 'Evening Glow', icon: Sunset, iconColor: 'text-orange-500' },
              { id: 'north', title: 'North', sub: 'Ambient Light', icon: Moon, iconColor: 'text-indigo-400' },
              { id: 'south', title: 'South', sub: 'All-day Warmth', icon: Sun, iconColor: 'text-yellow-500' },
            ].map((dir) => {
              const isSelected = facing === dir.id;
              const IconComponent = dir.icon;
              return (
                <button
                  key={dir.id}
                  type="button"
                  onClick={() => setFacing(dir.id as any)}
                  className={`p-4 rounded-2xl text-center border transition-all duration-300 flex flex-col items-center justify-center relative cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${
                    isSelected
                      ? 'bg-blue-500/5 dark:bg-blue-500/10 border-blue-500 shadow-lg shadow-blue-500/5 scale-[1.02]'
                      : 'bg-slate-50/50 dark:bg-slate-950/40 hover:bg-slate-50 dark:hover:bg-slate-950/80 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className={`p-2.5 rounded-xl mb-2 transition-all duration-300 ${isSelected ? 'bg-white dark:bg-slate-800 shadow-inner scale-110' : 'bg-slate-100 dark:bg-slate-900/50'}`}>
                    <IconComponent className={`w-5 h-5 ${dir.iconColor}`} />
                  </div>
                  <span className="text-[11px] font-display font-black text-slate-900 dark:text-white uppercase leading-none block">
                    {dir.title}
                  </span>
                  <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold leading-none block mt-1 tracking-tight">
                    {dir.sub}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <p className="text-xs text-red-500 font-bold bg-red-50 dark:bg-red-950/20 p-4 rounded-2xl border border-red-200 dark:border-red-950/50 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 via-indigo-650 to-indigo-700 hover:from-blue-500 hover:via-indigo-555 hover:to-indigo-600 text-white font-display font-extrabold text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-indigo-500/15 hover:shadow-indigo-500/25 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 active:scale-[0.98] transition-all hover:scale-[1.01] duration-150 disabled:opacity-75 disabled:cursor-not-allowed flex items-center justify-center space-x-2.5 cursor-pointer"
          id="generate-btn"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Compiling Spatial Analytics...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4.5 h-4.5 text-white animate-pulse" />
              <span>Compile & Propose Map</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
