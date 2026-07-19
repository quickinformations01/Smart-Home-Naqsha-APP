import React, { useState } from 'react';
import { Ruler, Sparkles, Sliders } from 'lucide-react';

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
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-lg shadow-slate-100/50 dark:shadow-none transition">
      <div className="flex items-center space-x-3 mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="p-2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-lg">
          <Ruler className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xs uppercase tracking-widest text-slate-400 dark:text-slate-500 font-extrabold block">
            Plot Dimensions Configuration
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Provide actual length and width to generate the house map.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Unit Selector */}
        <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/30 p-2 rounded-xl border border-slate-200 dark:border-slate-800">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Measurement Unit</span>
          <div className="inline-flex rounded-lg p-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setUnit('ft')}
              className={`px-3 py-1 text-[10px] font-bold rounded transition-all ${
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
              className={`px-3 py-1 text-[10px] font-bold rounded transition-all ${
                unit === 'm'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Meters (m)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Plot Width */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400">
              Width ({unit})
            </label>
            <div className="relative">
              <input
                type="number"
                value={width}
                onChange={(e) => setWidth(e.target.value)}
                placeholder="e.g. 30"
                min="10"
                step="any"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-sm"
                required
                id="plot-width-input"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-mono font-bold">
                {unit}
              </span>
            </div>
          </div>

          {/* Plot Length */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400">
              Length ({unit})
            </label>
            <div className="relative">
              <input
                type="number"
                value={length}
                onChange={(e) => setLength(e.target.value)}
                placeholder="e.g. 50"
                min="15"
                step="any"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-sm"
                required
                id="plot-length-input"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-mono font-bold">
                {unit}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Plot Type */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400">
              Plot Location Type
            </label>
            <div className="grid grid-cols-3 gap-1 bg-slate-50 dark:bg-slate-800/30 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setPlotType('standard')}
                className={`py-2 text-[10px] sm:text-xs font-bold rounded-lg transition-all ${
                  plotType === 'standard'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Standard
              </button>
              <button
                type="button"
                onClick={() => setPlotType('corner-left')}
                className={`py-2 text-[10px] sm:text-xs font-bold rounded-lg transition-all ${
                  plotType === 'corner-left'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Left Corner
              </button>
              <button
                type="button"
                onClick={() => setPlotType('corner-right')}
                className={`py-2 text-[10px] sm:text-xs font-bold rounded-lg transition-all ${
                  plotType === 'corner-right'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Right Corner
              </button>
            </div>
          </div>

          {/* Facing Direction */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400">
              Facing Direction (Compass)
            </label>
            <select
              value={facing}
              onChange={(e) => setFacing(e.target.value as any)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-sm"
            >
              <option value="east" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">East (🌅 Morning Sun)</option>
              <option value="west" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">West (🌇 Evening Warmth)</option>
              <option value="north" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">North (❄️ Ambient Diffused)</option>
              <option value="south" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">South (☀️ All-day Sunshine)</option>
            </select>
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-500 font-medium bg-red-50 dark:bg-red-950/30 p-3 rounded-xl border border-red-200 dark:border-red-900">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-2xl shadow-lg shadow-blue-500/20 dark:shadow-none focus:outline-none focus:ring-4 focus:ring-blue-500/20 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          id="generate-btn"
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Analyzing Dimensions...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              <span>Generate Naqsha</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
