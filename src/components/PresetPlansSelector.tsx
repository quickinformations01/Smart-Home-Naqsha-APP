import React from 'react';
import { PRESET_PLANS, PresetPlan } from '../utils/presetPlans';
import { Compass, Grid, Sparkles, Map, Layout, ArrowRight } from 'lucide-react';

interface PresetPlansSelectorProps {
  onSelectPlan: (plan: PresetPlan) => void;
}

export default function PresetPlansSelector({ onSelectPlan }: PresetPlansSelectorProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-1 pb-2 border-b border-slate-200 dark:border-slate-800">
        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <Layout className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          Choose from 5 Professional House Plans (Presets)
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Skip layout creation and load a beautifully optimized architectural blueprint designed by experts.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {PRESET_PLANS.map((plan) => (
          <div
            key={plan.id}
            onClick={() => onSelectPlan(plan)}
            className="md:col-span-1 flex flex-col justify-between p-5 border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-700 rounded-3xl bg-white dark:bg-slate-900 hover:shadow-lg hover:shadow-blue-500/5 dark:hover:shadow-none transition-all duration-200 cursor-pointer group relative overflow-hidden"
          >
            {/* Top border ambient highlight */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2.5 py-1 rounded-full">
                  Preset plan
                </span>
                <span className="text-xs font-bold text-slate-400 font-mono">
                  {plan.width}x{plan.length} {plan.unit}
                </span>
              </div>

              <div>
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                  {plan.name}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                  {plan.description}
                </p>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
              {/* Specs Bento Grid */}
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="bg-slate-50 dark:bg-slate-800/40 p-1.5 rounded-xl text-center">
                  <span className="block text-slate-400 font-semibold uppercase text-[8px] tracking-wider">Bedrooms</span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-200">{plan.bedrooms} Beds</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/40 p-1.5 rounded-xl text-center">
                  <span className="block text-slate-400 font-semibold uppercase text-[8px] tracking-wider">Baths</span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-200">{plan.bathrooms} Baths</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/40 p-1.5 rounded-xl text-center flex items-center justify-center gap-1">
                  <Compass className="w-3.5 h-3.5 text-blue-500" />
                  <span className="font-extrabold uppercase text-slate-700 dark:text-slate-300">{plan.facing}</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/40 p-1.5 rounded-xl text-center">
                  <span className="block text-slate-400 font-semibold uppercase text-[8px] tracking-wider">Plot</span>
                  <span className="font-extrabold capitalize text-slate-700 dark:text-slate-300">{plan.plotType}</span>
                </div>
              </div>

              {/* Action trigger */}
              <div className="flex items-center justify-between text-xs font-bold text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform">
                <span>Load House Plan</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
