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
  ArrowUpLeft,
  Sliders,
  Sunrise,
  Sunset,
  Moon,
  Building,
  Building2,
  Maximize2,
  Grid,
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

        {/* Quick Footprint Presets */}
        <div className="space-y-2">
          <label className="block text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Grid className="w-3.5 h-3.5 text-blue-500" />
            <span>Popular Architectural Footprint Presets</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { label: "60' x 50'", w: '60', l: '50', u: 'ft', desc: '3,000 sq ft Modern CAD Blueprint' },
              { label: "30' x 50'", w: '30', l: '50', u: 'ft', desc: '1,500 sq ft Standard Plot' },
              { label: "35' x 70'", w: '35', l: '70', u: 'ft', desc: '2,450 sq ft Executive Plot' },
              { label: "50' x 90'", w: '50', l: '90', u: 'ft', desc: '4,500 sq ft Grand Villa' },
            ].map((preset) => {
              const isActive = width === preset.w && length === preset.l && unit === preset.u;
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    setWidth(preset.w);
                    setLength(preset.l);
                    setUnit(preset.u as 'ft' | 'm');
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-blue-50/90 dark:bg-blue-950/50 border-blue-500 text-blue-700 dark:text-blue-300 shadow-sm'
                      : 'bg-slate-50/50 dark:bg-slate-950/40 border-slate-200/80 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="text-xs font-black font-mono">{preset.label}</div>
                  <div className="text-[9px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">{preset.desc}</div>
                </button>
              );
            })}
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
            <label className="block text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500">
                <MapPin className="w-4 h-4" />
              </span>
              <span>Plot Location & Road Aspect</span>
            </label>
            <span className="text-[10px] font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-widest bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/50 px-2.5 py-1 rounded-full flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" /> Architectural Zoning
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {[
              {
                id: 'standard',
                title: 'Standard Plot',
                tag: '1 Front Road',
                subtitle: 'Single Road Façade',
                desc: 'Flanked by neighboring plots on left, right & rear.',
                icon: Building,
                svg: (
                  <svg viewBox="0 0 100 52" className="w-full h-12 rounded-xl bg-slate-950 p-1.5 border border-slate-800/80 shadow-inner transition-opacity">
                    {/* Neighbor Blocks */}
                    <rect x="2" y="2" width="22" height="34" rx="3" fill="#1e293b" stroke="#334155" strokeWidth="1" />
                    <rect x="76" y="2" width="22" height="34" rx="3" fill="#1e293b" stroke="#334155" strokeWidth="1" />
                    <rect x="26" y="2" width="48" height="8" rx="2" fill="#1e293b" stroke="#334155" strokeWidth="1" />
                    {/* Active Plot */}
                    <rect x="26" y="12" width="48" height="24" rx="3" fill="rgba(37, 99, 235, 0.25)" stroke="#3b82f6" strokeWidth="1.5" />
                    <text x="50" y="26" textAnchor="middle" className="text-[8px] font-black fill-blue-400 tracking-wider font-mono">STANDARD</text>
                    {/* Front Road */}
                    <rect x="2" y="38" width="96" height="12" rx="3" fill="#0f172a" stroke="#1e293b" strokeWidth="1" />
                    <line x1="6" y1="44" x2="94" y2="44" stroke="#f59e0b" strokeWidth="1" strokeDasharray="3 2" />
                    <text x="50" y="47" textAnchor="middle" className="text-[6px] font-extrabold fill-slate-300 tracking-widest uppercase">FRONT ROAD</text>
                  </svg>
                )
              },
              {
                id: 'corner-left',
                title: 'Corner Plot (Left)',
                tag: '2 Open Roads',
                subtitle: 'Front + Left Street',
                desc: 'Open left boundary for secondary gate & dual light.',
                icon: ArrowUpLeft,
                svg: (
                  <svg viewBox="0 0 100 52" className="w-full h-12 rounded-xl bg-slate-950 p-1.5 border border-slate-800/80 shadow-inner transition-opacity">
                    {/* Neighbor Blocks */}
                    <rect x="76" y="2" width="22" height="34" rx="3" fill="#1e293b" stroke="#334155" strokeWidth="1" />
                    <rect x="26" y="2" width="48" height="8" rx="2" fill="#1e293b" stroke="#334155" strokeWidth="1" />
                    {/* Left Street */}
                    <rect x="2" y="2" width="22" height="48" rx="3" fill="#0f172a" stroke="#1e293b" strokeWidth="1" />
                    <line x1="13" y1="5" x2="13" y2="45" stroke="#f59e0b" strokeWidth="1" strokeDasharray="3 2" />
                    <text x="13" y="25" textAnchor="middle" className="text-[5px] font-extrabold fill-slate-300 tracking-widest uppercase" transform="rotate(-90 13 25)">LEFT STREET</text>
                    {/* Active Plot */}
                    <rect x="26" y="12" width="48" height="24" rx="3" fill="rgba(37, 99, 235, 0.25)" stroke="#3b82f6" strokeWidth="1.5" />
                    <text x="50" y="26" textAnchor="middle" className="text-[8px] font-black fill-blue-400 tracking-wider font-mono">LEFT CORNER</text>
                    <circle cx="26" cy="18" r="2" fill="#22d3ee" className="animate-pulse" />
                    <circle cx="26" cy="28" r="2" fill="#22d3ee" className="animate-pulse" />
                    {/* Front Road */}
                    <rect x="26" y="38" width="72" height="12" rx="3" fill="#0f172a" stroke="#1e293b" strokeWidth="1" />
                    <line x1="28" y1="44" x2="94" y2="44" stroke="#f59e0b" strokeWidth="1" strokeDasharray="3 2" />
                    <text x="60" y="47" textAnchor="middle" className="text-[6px] font-extrabold fill-slate-300 tracking-widest uppercase">FRONT ROAD</text>
                  </svg>
                )
              },
              {
                id: 'corner-right',
                title: 'Corner Plot (Right)',
                tag: '2 Open Roads',
                subtitle: 'Front + Right Street',
                desc: 'Open right street boundary for maximum breeze & windows.',
                icon: ArrowUpRight,
                svg: (
                  <svg viewBox="0 0 100 52" className="w-full h-12 rounded-xl bg-slate-950 p-1.5 border border-slate-800/80 shadow-inner transition-opacity">
                    {/* Neighbor Blocks */}
                    <rect x="2" y="2" width="22" height="34" rx="3" fill="#1e293b" stroke="#334155" strokeWidth="1" />
                    <rect x="26" y="2" width="48" height="8" rx="2" fill="#1e293b" stroke="#334155" strokeWidth="1" />
                    {/* Right Street */}
                    <rect x="76" y="2" width="22" height="48" rx="3" fill="#0f172a" stroke="#1e293b" strokeWidth="1" />
                    <line x1="87" y1="5" x2="87" y2="45" stroke="#f59e0b" strokeWidth="1" strokeDasharray="3 2" />
                    <text x="87" y="25" textAnchor="middle" className="text-[5px] font-extrabold fill-slate-300 tracking-widest uppercase" transform="rotate(90 87 25)">RIGHT STREET</text>
                    {/* Active Plot */}
                    <rect x="26" y="12" width="48" height="24" rx="3" fill="rgba(37, 99, 235, 0.25)" stroke="#3b82f6" strokeWidth="1.5" />
                    <text x="50" y="26" textAnchor="middle" className="text-[8px] font-black fill-blue-400 tracking-wider font-mono">RIGHT CORNER</text>
                    <circle cx="74" cy="18" r="2" fill="#22d3ee" className="animate-pulse" />
                    <circle cx="74" cy="28" r="2" fill="#22d3ee" className="animate-pulse" />
                    {/* Front Road */}
                    <rect x="2" y="38" width="72" height="12" rx="3" fill="#0f172a" stroke="#1e293b" strokeWidth="1" />
                    <line x1="6" y1="44" x2="72" y2="44" stroke="#f59e0b" strokeWidth="1" strokeDasharray="3 2" />
                    <text x="38" y="47" textAnchor="middle" className="text-[6px] font-extrabold fill-slate-300 tracking-widest uppercase">FRONT ROAD</text>
                  </svg>
                )
              },
              {
                id: 'corner',
                title: 'Three-Side Open Plot',
                tag: '3 Open Sides',
                subtitle: 'Panoramic Boulevard',
                desc: '3-sided open exposure for luxury dual-façade residence.',
                icon: Maximize2,
                svg: (
                  <svg viewBox="0 0 100 52" className="w-full h-12 rounded-xl bg-slate-950 p-1.5 border border-slate-800/80 shadow-inner transition-opacity">
                    {/* Left & Right Streets */}
                    <rect x="2" y="2" width="20" height="48" rx="3" fill="#0f172a" stroke="#1e293b" strokeWidth="1" />
                    <rect x="78" y="2" width="20" height="48" rx="3" fill="#0f172a" stroke="#1e293b" strokeWidth="1" />
                    {/* Top Neighbor */}
                    <rect x="24" y="2" width="52" height="8" rx="2" fill="#1e293b" stroke="#334155" strokeWidth="1" />
                    {/* Active Plot */}
                    <rect x="24" y="12" width="52" height="24" rx="3" fill="rgba(37, 99, 235, 0.25)" stroke="#3b82f6" strokeWidth="1.5" />
                    <text x="50" y="26" textAnchor="middle" className="text-[8px] font-black fill-blue-400 tracking-wider font-mono">3-SIDE OPEN</text>
                    <circle cx="24" cy="24" r="2" fill="#22d3ee" className="animate-pulse" />
                    <circle cx="76" cy="24" r="2" fill="#22d3ee" className="animate-pulse" />
                    {/* Front Road */}
                    <rect x="2" y="38" width="96" height="12" rx="3" fill="#0f172a" stroke="#1e293b" strokeWidth="1" />
                    <line x1="6" y1="44" x2="94" y2="44" stroke="#f59e0b" strokeWidth="1" strokeDasharray="3 2" />
                    <text x="50" y="47" textAnchor="middle" className="text-[6px] font-extrabold fill-slate-300 tracking-widest uppercase">MAIN BOULEVARD</text>
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
                  className={`p-4 rounded-[16px] text-left border transition-all duration-300 flex flex-col justify-between relative cursor-pointer group hover:-translate-y-1 active:translate-y-0 ${
                    isSelected
                      ? 'bg-gradient-to-br from-blue-600 via-emerald-600 to-teal-700 text-white border-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.35)] ring-2 ring-emerald-300/80 scale-[1.02]'
                      : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 hover:border-blue-300 dark:hover:border-blue-700 shadow-sm'
                  }`}
                >
                  {/* Top Badge & Header */}
                  <div>
                    <div className="flex justify-between items-center w-full mb-2">
                      <span className={`text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full ${
                        isSelected 
                          ? 'bg-white/20 text-white backdrop-blur-md border border-white/30' 
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}>
                        {item.tag}
                      </span>
                      {isSelected ? (
                        <div className="w-5.5 h-5.5 rounded-full bg-white text-emerald-600 flex items-center justify-center shrink-0 shadow-md">
                          <CheckCircle2 className="w-4 h-4 fill-emerald-600 text-white" />
                        </div>
                      ) : (
                        <div className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/60 transition-all shadow-xs">
                          <IconComp className="w-4 h-4" />
                        </div>
                      )}
                    </div>

                    <h4 className={`text-xs font-black tracking-tight uppercase mt-1 flex items-center gap-1.5 font-sans ${
                      isSelected ? 'text-white' : 'text-slate-900 dark:text-white'
                    }`}>
                      <span>{item.title}</span>
                    </h4>
                    <p className={`text-[10px] font-bold tracking-tight mt-0.5 ${
                      isSelected ? 'text-emerald-100' : 'text-blue-600 dark:text-blue-400'
                    }`}>
                      {item.subtitle}
                    </p>
                  </div>

                  {/* Architectural SVG Diagram */}
                  <div className="my-2.5">
                    {item.svg}
                  </div>

                  {/* Subtitle / Short Description */}
                  <p className={`text-[10px] font-medium leading-normal ${
                    isSelected ? 'text-slate-100/95' : 'text-slate-500 dark:text-slate-400'
                  }`}>
                    {item.desc}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Dynamic Ventilation & Zoning Note */}
          <div className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 border border-blue-500/25 text-xs text-slate-800 dark:text-slate-200 font-medium shadow-sm">
            <Wind className="w-4 h-4 text-blue-500 shrink-0 animate-pulse" />
            <span className="text-[11px] leading-relaxed">
              {plotType === 'standard' && (
                <><strong>Standard Plot Configured:</strong> Integrates central ventilation courtyards & air ducts for interior rooms.</>
              )}
              {plotType === 'corner-left' && (
                <><strong>Left Corner Plot Configured:</strong> Auto-integrates side street windows & optional lawn gate along the left boundary.</>
              )}
              {plotType === 'corner-right' && (
                <><strong>Right Corner Plot Configured:</strong> Auto-integrates side street windows & corner entrance options along the right boundary.</>
              )}
              {plotType === 'corner' && (
                <><strong>Dual Corner Boulevard Configured:</strong> Maximizes dual-façade natural light & cross-ventilation windows.</>
              )}
            </span>
          </div>
        </div>

        {/* Facing Direction Compass with solar paths */}
        <div className="space-y-2.5">
          <label className="block text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-blue-500" />
              <span>Compass Facing Direction</span>
            </span>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
              Determines Vastu & Sun Paths
            </span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { id: 'east', title: 'East Facing', sub: 'Morning Sun (Vastu Ideal)', icon: Sunrise, iconColor: 'text-amber-500' },
              { id: 'west', title: 'West Facing', sub: 'Evening Sun & Air', icon: Sunset, iconColor: 'text-orange-500' },
              { id: 'north', title: 'North Facing', sub: 'Soft Ambient Light', icon: Moon, iconColor: 'text-indigo-400' },
              { id: 'south', title: 'South Facing', sub: 'All-Day Warmth', icon: Sun, iconColor: 'text-yellow-500' },
            ].map((dir) => {
              const isSelected = facing === dir.id;
              const IconComponent = dir.icon;
              return (
                <button
                  key={dir.id}
                  type="button"
                  onClick={() => setFacing(dir.id as any)}
                  className={`p-3.5 rounded-2xl text-center border transition-all duration-300 flex flex-col items-center justify-center relative cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${
                    isSelected
                      ? 'bg-blue-600/10 dark:bg-blue-500/15 border-blue-500 shadow-md shadow-blue-500/10 ring-2 ring-blue-500/40'
                      : 'bg-white/80 dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-900 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className={`p-2 rounded-xl mb-1.5 transition-all duration-300 ${isSelected ? 'bg-blue-500 text-white shadow-sm scale-110' : 'bg-slate-100 dark:bg-slate-800'}`}>
                    <IconComponent className={`w-4 h-4 ${isSelected ? 'text-white' : dir.iconColor}`} />
                  </div>
                  <span className="text-[11px] font-black text-slate-900 dark:text-white uppercase leading-none block">
                    {dir.title}
                  </span>
                  <span className="text-[9px] text-slate-500 dark:text-slate-400 font-bold leading-none block mt-1 tracking-tight">
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
