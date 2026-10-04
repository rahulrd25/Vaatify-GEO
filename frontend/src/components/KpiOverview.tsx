'use client';

import { TrendingUp, Layers, Search, Bell } from 'lucide-react';

interface KpiOverviewProps {
  brandName?: string;
  overallSoV: number;
  totalEvaluations: number;
  activePrompts: number;
  flipsCount: number;
}

export default function KpiOverview({
  brandName = 'Vaatify',
  overallSoV,
  totalEvaluations,
  activePrompts,
  flipsCount,
}: KpiOverviewProps) {

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
      {/* 1. Share of Voice */}
      <div className="card-white rounded-lg p-4 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Share of Voice</span>
          <TrendingUp className="h-4 w-4 text-orange-600" />
        </div>
        <div className="text-2xl font-bold text-slate-900 tracking-tight">{overallSoV}%</div>
        <p className="text-[11px] text-slate-500 mt-1">{brandName} citation rate</p>
      </div>

      {/* 2. Total Evaluations */}
      <div className="card-white rounded-lg p-4 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Evaluations</span>
          <Layers className="h-4 w-4 text-slate-400" />
        </div>
        <div className="text-2xl font-bold text-slate-900 tracking-tight">{totalEvaluations}</div>
        <p className="text-[11px] text-slate-500 mt-1">Engine runs executed</p>
      </div>

      {/* 3. Active Prompts */}
      <div className="card-white rounded-lg p-4 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Target Queries</span>
          <Search className="h-4 w-4 text-emerald-600" />
        </div>
        <div className="text-2xl font-bold text-slate-900 tracking-tight">{activePrompts}</div>
        <p className="text-[11px] text-slate-500 mt-1">Active buyer queries</p>
      </div>

      {/* 4. Citation Flips */}
      <div className="card-white rounded-lg p-4 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Citation Shifts</span>
          <Bell className="h-4 w-4 text-amber-500" />
        </div>
        <div className="text-2xl font-bold text-slate-900 tracking-tight">{flipsCount}</div>
        <p className="text-[11px] text-slate-500 mt-1">Status changes detected</p>
      </div>
    </div>
  );
}


