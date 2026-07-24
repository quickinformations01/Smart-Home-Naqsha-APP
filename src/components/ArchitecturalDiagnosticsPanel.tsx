import React, { useState } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Maximize2,
  Wind,
  Sun,
  Eye,
  Sliders,
  Layers,
  Sparkles,
  ArrowRight,
  Info,
  Building,
  Ruler,
  Compass,
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { LayoutDiagnosticReport, RoomDiagnostic } from '../utils/analysisEngine';

interface ArchitecturalDiagnosticsPanelProps {
  report: LayoutDiagnosticReport;
  onSelectRoom?: (roomId: string) => void;
  onClose?: () => void;
}

export const ArchitecturalDiagnosticsPanel: React.FC<ArchitecturalDiagnosticsPanelProps> = ({
  report,
  onSelectRoom,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'rooms' | 'optimizations' | 'zoning'>('overview');
  const [roomFilter, setRoomFilter] = useState<'all' | 'issues'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedRoomId, setExpandedRoomId] = useState<string | null>(null);

  const getScoreColor = (score: number, maxScore: number = 20) => {
    const pct = (score / maxScore) * 100;
    if (pct >= 80) return 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800';
    if (pct >= 60) return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800';
    return 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800';
  };

  const getStatusBadge = (status: 'good' | 'acceptable' | 'warning' | 'error') => {
    switch (status) {
      case 'good':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300/60">
            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            Good
          </span>
        );
      case 'acceptable':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300/60">
            <Info className="w-3 h-3 text-blue-600 dark:text-blue-400" />
            Acceptable
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300/60">
            <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
            Warning
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300/60">
            <XCircle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
            Needs Fix
          </span>
        );
    }
  };

  const filteredRooms = report.roomDiagnostics.filter((r) => {
    if (roomFilter === 'issues' && r.status === 'good') return false;
    if (selectedCategory !== 'all') {
      if (selectedCategory === 'proportions' && r.aspectRatioCategory === 'ideal') return false;
      if (selectedCategory === 'ventilation' && r.windowAnalysis.windowCount > 0) return false;
    }
    return true;
  });

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-w-5xl w-full mx-auto my-4 text-slate-800 dark:text-slate-100 font-sans">
      {/* Top Header Banner */}
      <div className="p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white flex flex-wrap items-center justify-between gap-4 border-b border-slate-800">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-blue-600/30 border border-blue-400/30 backdrop-blur-md">
            <ShieldCheck className="w-8 h-8 text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[10px] font-black uppercase tracking-widest">
                Client-Side CAD Rule Engine
              </span>
              <span className="text-[10px] font-mono text-slate-400">Deterministic</span>
            </div>
            <h2 className="text-xl font-black tracking-tight text-white mt-1">
              Architectural Analysis & Design Diagnostics
            </h2>
            <p className="text-xs text-slate-300 font-medium">
              Pure client-side civil engineering verification & room proportion evaluation
            </p>
          </div>
        </div>

        {/* Big Overall Quality Score Gauge */}
        <div className="flex items-center gap-4 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-700/80">
          <div className="text-right">
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Quality Score
            </div>
            <div className="text-xs font-bold text-slate-300">
              {report.overallScore >= 80 ? 'Optimal Architecture' : report.overallScore >= 65 ? 'Acceptable Layout' : 'Needs Optimization'}
            </div>
          </div>
          <div
            className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center font-mono font-black border-2 shadow-inner ${getScoreColor(
              report.overallScore,
              100
            )}`}
          >
            <span className="text-2xl leading-none">{report.overallScore}</span>
            <span className="text-[9px] text-slate-400 font-normal">/100</span>
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center justify-between px-6 pt-3 bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 flex-wrap gap-2">
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2.5 text-xs font-black rounded-t-xl transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 border-t-2 border-blue-500 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Score Breakdown</span>
          </button>

          <button
            onClick={() => setActiveTab('rooms')}
            className={`px-4 py-2.5 text-xs font-black rounded-t-xl transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'rooms'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 border-t-2 border-blue-500 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Ruler className="w-3.5 h-3.5" />
            <span>Room CAD Audit ({report.roomDiagnostics.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('optimizations')}
            className={`px-4 py-2.5 text-xs font-black rounded-t-xl transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'optimizations'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 border-t-2 border-blue-500 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Smart Recommendations ({report.actionableOptimizations.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('zoning')}
            className={`px-4 py-2.5 text-xs font-black rounded-t-xl transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'zoning'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 border-t-2 border-blue-500 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Zoning & Open Area</span>
          </button>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
          >
            Close Panel
          </button>
        )}
      </div>

      {/* Main Tab Content */}
      <div className="p-6 max-h-[75vh] overflow-y-auto space-y-6">
        {/* TAB 1: OVERVIEW & SUB-SCORES */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* 5 Sub-Score Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {[
                {
                  key: 'proportions',
                  title: 'Room Proportions',
                  score: report.categoryScores.proportionsScore,
                  icon: Ruler,
                  desc: 'Aspect ratios, length-width balances & min sizes',
                },
                {
                  key: 'ventilation',
                  title: 'Daylight & Air',
                  score: report.categoryScores.ventilationScore,
                  icon: Wind,
                  desc: 'Window ratios, OTS shafts & cross-ventilation',
                },
                {
                  key: 'circulation',
                  title: 'Circulation & Flow',
                  score: report.categoryScores.circulationScore,
                  icon: Maximize2,
                  desc: 'Corridor Area, door swings & clearances',
                },
                {
                  key: 'privacy',
                  title: 'Privacy & Zoning',
                  score: report.categoryScores.privacyScore,
                  icon: Eye,
                  desc: 'Public vs family private zone buffers',
                },
                {
                  key: 'structure',
                  title: 'Structural Realism',
                  score: report.categoryScores.structuralScore,
                  icon: Building,
                  desc: 'Wall spans, beam load alignment & column grids',
                },
              ].map((sub) => {
                const IconComp = sub.icon;
                return (
                  <div
                    key={sub.key}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                          <IconComp className="w-4 h-4" />
                        </div>
                        <span className="font-mono text-sm font-black text-slate-900 dark:text-slate-100">
                          {sub.score}/20
                        </span>
                      </div>
                      <div className="text-xs font-black text-slate-800 dark:text-slate-200">
                        {sub.title}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-tight mt-1">
                        {sub.desc}
                      </div>
                    </div>

                    <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 mt-3 overflow-hidden">
                      <div
                        className="bg-blue-600 dark:bg-blue-400 h-1.5 rounded-full"
                        style={{ width: `${(sub.score / 20) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Global Issues & Architectural Diagnostics Warnings */}
            {report.globalIssues.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span>Detected Layout Design Warnings ({report.globalIssues.length})</span>
                </h3>

                <div className="space-y-3">
                  {report.globalIssues.map((issue, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/60 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2 py-0.5 rounded bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 font-mono text-[10px] font-black uppercase">
                          {issue.category}
                        </span>
                        {issue.roomNames && (
                          <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                            Affected: {issue.roomNames.join(', ')}
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-extrabold text-amber-900 dark:text-amber-200">
                        {issue.title}
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300">
                        {issue.message}
                      </p>
                      <div className="text-[11px] bg-white/80 dark:bg-slate-900/80 p-2.5 rounded-xl border border-amber-200/50 dark:border-amber-900/50 text-slate-600 dark:text-slate-400">
                        <strong className="text-slate-900 dark:text-slate-100">Why this matters:</strong>{' '}
                        {issue.why}
                      </div>
                      <div className="text-[11px] font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                        <ArrowRight className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span>Recommended Fix: {issue.recommendation}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ROOM BY ROOM CAD AUDIT */}
        {activeTab === 'rooms' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setRoomFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    roomFilter === 'all'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
                  }`}
                >
                  All Rooms ({report.roomDiagnostics.length})
                </button>
                <button
                  onClick={() => setRoomFilter('issues')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    roomFilter === 'issues'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
                  }`}
                >
                  Rooms Needing Attention (
                  {report.roomDiagnostics.filter((r) => r.status !== 'good').length})
                </button>
              </div>

              <div className="text-xs text-slate-500 font-medium font-mono">
                Evaluating Aspect Ratios, Window Ratios & Usability
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredRooms.map((room) => {
                const isExpanded = expandedRoomId === room.roomId;
                return (
                  <div
                    key={room.roomId}
                    className={`p-4 rounded-2xl border transition-all ${
                      room.status === 'error'
                        ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-300 dark:border-rose-900/60'
                        : room.status === 'warning'
                        ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-300 dark:border-amber-900/60'
                        : 'bg-slate-50/50 dark:bg-slate-950/40 border-slate-200/80 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase font-mono">
                            {room.roomName}
                          </h4>
                          {getStatusBadge(room.status)}
                        </div>
                        <div className="text-xs font-extrabold text-blue-600 dark:text-blue-400 font-mono mt-0.5">
                          {room.dimensions.lengthFt} ft × {room.dimensions.widthFt} ft (
                          {room.dimensions.areaSqFt} sq ft)
                        </div>
                      </div>

                      {onSelectRoom && (
                        <button
                          onClick={() => onSelectRoom(room.roomId)}
                          className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 hover:bg-blue-100 cursor-pointer text-[10px] font-bold flex items-center gap-1"
                        >
                          Highlight
                        </button>
                      )}
                    </div>

                    {/* Room Key Metrics Pills */}
                    <div className="grid grid-cols-3 gap-2 mt-3 font-mono text-[10px]">
                      <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                        <span className="block text-slate-400 font-sans font-medium">Aspect Ratio</span>
                        <strong className="text-slate-800 dark:text-slate-200 font-black">
                          {room.dimensions.aspectRatio} ({room.aspectRatioCategory})
                        </strong>
                      </div>

                      <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                        <span className="block text-slate-400 font-sans font-medium">Window Ratio</span>
                        <strong className="text-slate-800 dark:text-slate-200 font-black">
                          {room.windowAnalysis.windowToFloorRatioPct}%
                        </strong>
                      </div>

                      <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                        <span className="block text-slate-400 font-sans font-medium">Usability</span>
                        <strong className="text-emerald-600 dark:text-emerald-400 font-black">
                          {room.circulationUsability.furnitureUsabilityScore}%
                        </strong>
                      </div>
                    </div>

                    {/* Warnings & Suggestions */}
                    {room.warnings.length > 0 && (
                      <div className="mt-3 space-y-1.5">
                        {room.warnings.map((w, wIdx) => (
                          <div
                            key={wIdx}
                            className="p-2 rounded-xl bg-amber-100/60 dark:bg-amber-950/50 text-[11px] font-medium text-amber-900 dark:text-amber-200 flex items-start gap-1.5"
                          >
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                            <span>{w}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <button
                      onClick={() => setExpandedRoomId(isExpanded ? null : room.roomId)}
                      className="mt-3 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>{isExpanded ? 'Hide Detailed CAD Spec' : 'View Full CAD Spec & Airflow'}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                        <div className="text-slate-600 dark:text-slate-400">
                          <strong>Sunlight Profile:</strong> {room.sunlightEstimate.orientationExposure}
                        </div>
                        <div className="text-slate-600 dark:text-slate-400">
                          <strong>Airflow Potential:</strong> {room.windowAnalysis.airflowPotential.toUpperCase()} (
                          {room.windowAnalysis.crossVentilation ? 'Cross-Ventilated' : 'Single Direction'})
                        </div>
                        {room.suggestions.length > 0 && (
                          <div className="p-2.5 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 text-[11px] text-blue-900 dark:text-blue-200">
                            <strong>Architect Suggestion:</strong> {room.suggestions.join(' ')}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: SMART RECOMMENDATIONS & FIXES */}
        {activeTab === 'optimizations' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-xs text-blue-900 dark:text-blue-200">
              <h3 className="font-extrabold text-sm mb-1">Architectural Layout Optimization Recommendations</h3>
              <p>
                Calculated by analyzing aspect ratios, airflow shafts, and door clearances against
                residential engineering rules.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {report.actionableOptimizations.map((opt, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-mono text-[10px] font-black uppercase">
                      {opt.category}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      {opt.expectedImpact}
                    </span>
                  </div>

                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    {opt.title}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {opt.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: ZONING & OPEN SPACE */}
        {activeTab === 'zoning' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-sans font-extrabold block">
                  Built-Up Area
                </span>
                <span className="text-2xl font-black text-slate-900 dark:text-white">
                  {report.zoningBalance.builtUpAreaSqFt} sq ft
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-sans font-extrabold block">
                  Open Space / Lawn / Shafts
                </span>
                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  {report.zoningBalance.openSpaceSqFt} sq ft ({report.zoningBalance.openSpacePct}%)
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-sans font-extrabold block">
                  Circulation Area
                </span>
                <span className="text-2xl font-black text-blue-600 dark:text-blue-400">
                  {report.circulationMetrics.corridorAreaSqFt} sq ft ({report.circulationMetrics.circulationRatioPct}%)
                </span>
              </div>
            </div>

            {/* Functional Zone Distribution Bar */}
            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider">
                Functional Zone Distribution
              </h4>
              <div className="w-full h-4 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden flex">
                <div
                  className="bg-blue-500 h-full"
                  style={{ width: `${report.zoningBalance.privateZonePct}%` }}
                  title={`Private Zone (Bedrooms & Baths): ${report.zoningBalance.privateZonePct}%`}
                />
                <div
                  className="bg-amber-500 h-full"
                  style={{ width: `${report.zoningBalance.publicZonePct}%` }}
                  title={`Public Zone (Drawing & Porch): ${report.zoningBalance.publicZonePct}%`}
                />
                <div
                  className="bg-emerald-500 h-full"
                  style={{ width: `${report.zoningBalance.serviceZonePct}%` }}
                  title={`Service Zone (Kitchen & Stairs): ${report.zoningBalance.serviceZonePct}%`}
                />
              </div>

              <div className="flex items-center gap-6 text-xs font-bold pt-1">
                <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                  <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" />
                  Private Zone ({report.zoningBalance.privateZonePct}%)
                </span>
                <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                  <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
                  Public Zone ({report.zoningBalance.publicZonePct}%)
                </span>
                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                  Service Zone ({report.zoningBalance.serviceZonePct}%)
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArchitecturalDiagnosticsPanel;
