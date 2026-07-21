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
  Sliders
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
              className={`px-4 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all cursor-pointer ${
                unit === 'ft'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Feet (ft)
            </button>
            <button
              type="button"
              onClick={() => setUnit('m')}
              className={`px-4 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all cursor-pointer ${
                unit === 'm'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Meters (m)
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

        {/* Plot Aspect Type (Corner Selection) */}
        <div className="space-y-2">
          <label className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Plot Location Aspect (Zoning & Ventilation)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { id: 'standard', title: 'Standard Lot', desc: 'Closed sides, front road' },
              { id: 'corner-left', title: 'Left Corner', desc: 'Side lawn / road access' },
              { id: 'corner-right', title: 'Right Corner', desc: 'Side lawn / road access' },
            ].map((item) => {
              const isSelected = plotType === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setPlotType(item.id as any)}
                  className={`p-3.5 rounded-2xl text-left border transition-all duration-200 flex flex-col justify-between h-20 relative cursor-pointer ${
                    isSelected
                      ? 'bg-blue-500/5 dark:bg-blue-500/10 border-blue-500 shadow-sm ring-1 ring-blue-500/50'
                      : 'bg-slate-50/50 dark:bg-slate-950/40 hover:bg-slate-50 dark:hover:bg-slate-950/80 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex justify-between items-center w-full">
                    <span className="text-[11px] font-black tracking-tight text-slate-900 dark:text-white uppercase">
                      {item.title}
                    </span>
                    <Layout className={`w-3.5 h-3.5 ${isSelected ? 'text-blue-500' : 'text-slate-400'}`} />
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-none mt-1">
                    {item.desc}
                  </span>
                </button>
              );
            })}
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
              { id: 'east', title: 'East', sub: 'Morning Sun', icon: '🌅' },
              { id: 'west', title: 'West', sub: 'Evening Glow', icon: '🌇' },
              { id: 'north', title: 'North', sub: 'Ambient Light', icon: '❄️' },
              { id: 'south', title: 'South', sub: 'All-day Warmth', icon: '☀️' },
            ].map((dir) => {
              const isSelected = facing === dir.id;
              return (
                <button
                  key={dir.id}
                  type="button"
                  onClick={() => setFacing(dir.id as any)}
                  className={`p-3 rounded-2xl text-center border transition-all duration-200 flex flex-col items-center justify-center relative cursor-pointer ${
                    isSelected
                      ? 'bg-blue-500/5 dark:bg-blue-500/10 border-blue-500 shadow-md scale-[1.01]'
                      : 'bg-slate-50/50 dark:bg-slate-950/40 hover:bg-slate-50 dark:hover:bg-slate-950/80 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <span className="text-base mb-1.5">{dir.icon}</span>
                  <span className="text-[11px] font-bold text-slate-900 dark:text-white uppercase leading-none block">
                    {dir.title}
                  </span>
                  <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium leading-none block mt-1">
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
