import React, { useState, useEffect } from 'react';
import { Sparkles, Check, ChevronRight, RotateCcw, Home, ShowerHead, Eye, Trees, CarFront, ChefHat } from 'lucide-react';
import { NaqshaSummary } from '../types';

interface RecommendationCardProps {
  initialSummary: NaqshaSummary;
  onConfirm: (customSummary: NaqshaSummary) => void;
  onCancel: () => void;
  width: number;
  length: number;
  unit: 'ft' | 'm';
}

export default function RecommendationCard({
  initialSummary,
  onConfirm,
  onCancel,
  width,
  length,
  unit,
}: RecommendationCardProps) {
  const [bedrooms, setBedrooms] = useState<number>(initialSummary.recommendedBedrooms);
  const [bathrooms, setBathrooms] = useState<number>(initialSummary.bathrooms);
  const [kitchen, setKitchen] = useState<string>(initialSummary.kitchen);
  const [drawingRoom, setDrawingRoom] = useState<string>(initialSummary.drawingRoom);
  const [garage, setGarage] = useState<string>(initialSummary.garage);
  const [lawn, setLawn] = useState<string>(initialSummary.lawn);

  // Synchronize when initialSummary changes
  useEffect(() => {
    setBedrooms(initialSummary.recommendedBedrooms);
    setBathrooms(initialSummary.bathrooms);
    setKitchen(initialSummary.kitchen);
    setDrawingRoom(initialSummary.drawingRoom);
    setGarage(initialSummary.garage);
    setLawn(initialSummary.lawn);
  }, [initialSummary]);

  const handleConfirm = () => {
    onConfirm({
      recommendedBedrooms: bedrooms,
      bathrooms,
      kitchen,
      tvLounge: 'Yes',
      drawingRoom,
      garage,
      lawn,
      otherFeatures: initialSummary.otherFeatures,
    });
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-blue-900/10 dark:shadow-none transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl border border-amber-500/10">
            <Sparkles className="w-5 h-5 animate-pulse text-amber-500" />
          </div>
          <div>
            <h2 className="text-xl font-display font-black tracking-tight text-slate-950 dark:text-white uppercase">
              AI Smart Recommendations
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Tailored layout for your{' '}
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {width} x {length} {unit}
              </span>{' '}
              plot
            </p>
          </div>
        </div>

        <button
          onClick={onCancel}
          className="self-start text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center space-x-1 py-1.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          id="re-enter-btn"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Re-enter size</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
        {/* Bedrooms */}
        <div className="p-5 border border-slate-100 dark:border-slate-800 rounded-2xl bg-slate-50/30 dark:bg-slate-800/40 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-300">
              <Home className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-semibold">Recommended Bedrooms</span>
            </div>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-0.5 rounded-full">
              AI suggestion: {initialSummary.recommendedBedrooms}
            </span>
          </div>
          <div className="flex items-center space-x-3">
            {[1, 2, 3, 4].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => {
                  setBedrooms(num);
                  // Auto scale bathrooms to match bedrooms
                  setBathrooms(Math.min(num, 3));
                }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-extrabold border transition-all duration-150 cursor-pointer ${
                  bedrooms === num
                    ? 'bg-gradient-to-br from-blue-600 to-indigo-700 border-transparent text-white shadow-lg shadow-blue-500/15'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                {num}
              </button>
            ))}
          </div>
        </div>

        {/* Bathrooms */}
        <div className="p-5 border border-slate-100 dark:border-slate-800 rounded-2xl bg-slate-50/30 dark:bg-slate-800/40 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-300">
              <ShowerHead className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-semibold">Bathrooms</span>
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-300 px-2 py-0.5 rounded-full">
              AI suggestion: {initialSummary.bathrooms}
            </span>
          </div>
          <div className="flex items-center space-x-3">
            {[1, 2, 3].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setBathrooms(num)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-extrabold border transition-all duration-150 cursor-pointer ${
                  bathrooms === num
                    ? 'bg-gradient-to-br from-emerald-600 to-teal-700 border-transparent text-white shadow-lg shadow-emerald-500/15'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                {num}
              </button>
            ))}
          </div>
        </div>

        {/* Kitchen Style */}
        <div className="p-5 border border-slate-100 dark:border-slate-800 rounded-2xl bg-slate-50/30 dark:bg-slate-800/40 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-300">
              <ChefHat className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-semibold">Kitchen Configuration</span>
            </div>
          </div>
          <div className="flex space-x-3">
            {['Closed Kitchen', 'Open Kitchen'].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setKitchen(type)}
                className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-extrabold border transition-all duration-150 cursor-pointer ${
                  kitchen.toLowerCase().includes(type.toLowerCase().split(' ')[0])
                    ? 'bg-gradient-to-br from-blue-600 to-indigo-700 border-transparent text-white shadow-lg shadow-blue-500/15'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Drawing Room */}
        <div className="p-5 border border-slate-100 dark:border-slate-800 rounded-2xl bg-slate-50/30 dark:bg-slate-800/40 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-300">
              <Eye className="w-4 h-4 text-purple-500" />
              <span className="text-sm font-semibold">Drawing Room (Guest Area)</span>
            </div>
          </div>
          <div className="flex space-x-3">
            {['Yes', 'No'].map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setDrawingRoom(opt)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-extrabold border transition-all duration-150 cursor-pointer ${
                  drawingRoom === opt
                    ? 'bg-gradient-to-br from-blue-600 to-indigo-700 border-transparent text-white shadow-lg shadow-blue-500/15'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* Garage */}
        <div className="p-5 border border-slate-100 dark:border-slate-800 rounded-2xl bg-slate-50/30 dark:bg-slate-800/40 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-300">
              <CarFront className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-semibold">Car Garage / Porch</span>
            </div>
          </div>
          <div className="flex space-x-3">
            {['1 Car', 'No'].map((opt) => {
              const matches = (opt === 'No' && garage === 'No') || (opt !== 'No' && garage !== 'No');
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setGarage(opt === 'No' ? 'No' : '1 Car')}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-extrabold border transition-all duration-150 cursor-pointer ${
                    matches
                      ? 'bg-gradient-to-br from-blue-600 to-indigo-700 border-transparent text-white shadow-lg shadow-blue-500/15'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>

        {/* Lawn */}
        <div className="p-5 border border-slate-100 dark:border-slate-800 rounded-2xl bg-slate-50/30 dark:bg-slate-800/40 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-300">
              <Trees className="w-4 h-4 text-teal-500" />
              <span className="text-sm font-semibold">Front Lawn / Open Space</span>
            </div>
          </div>
          <div className="flex space-x-3">
            {['Front Lawn', 'No'].map((opt) => {
              const matches = (opt === 'No' && lawn === 'No') || (opt !== 'No' && lawn !== 'No');
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setLawn(opt === 'No' ? 'No' : 'Front Lawn')}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-extrabold border transition-all duration-150 cursor-pointer ${
                    matches
                      ? 'bg-gradient-to-br from-blue-600 to-indigo-700 border-transparent text-white shadow-lg shadow-blue-500/15'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* AI Features & Explanations list */}
      {initialSummary.otherFeatures && initialSummary.otherFeatures.length > 0 && (
        <div className="mb-8 p-4 bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 rounded-2xl">
          <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-2">
            Integrated Features list
          </span>
          <ul className="space-y-1.5">
            {initialSummary.otherFeatures.map((feat, index) => (
              <li key={index} className="flex items-start text-xs text-slate-600 dark:text-slate-300">
                <Check className="w-3.5 h-3.5 text-blue-500 mr-2 mt-0.5 shrink-0" />
                <span>{feat}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Submit / Actions */}
      <div className="flex items-center space-x-4">
        <button
          onClick={handleConfirm}
          className="flex-1 py-4 px-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 hover:from-blue-500 hover:via-indigo-500 hover:to-indigo-600 text-white font-display font-extrabold text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-indigo-500/15 hover:shadow-indigo-500/25 flex items-center justify-center space-x-2 transition-all duration-150 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
          id="confirm-generate-btn"
        >
          <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
          <span>Compile CAD Blueprint & 3D Model</span>
          <ChevronRight className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  );
}
