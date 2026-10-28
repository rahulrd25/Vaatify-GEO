'use client';

import KpiOverview from '../KpiOverview';
import AnalyticsCharts from '../AnalyticsCharts';
import { EngineRateItem, CompetitorItem } from '@/types';

interface OverviewViewProps {
  brandName: string;
  overallSoV: number;
  totalEvaluations: number;
  activePrompts: number;
  flipsCount: number;
  engineRates: EngineRateItem[];
  competitorRanking: CompetitorItem[];
}

export default function OverviewView({
  brandName,
  overallSoV,
  totalEvaluations,
  activePrompts,
  flipsCount,
  engineRates,
  competitorRanking,
}: OverviewViewProps) {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
          Visibility & Competitor Gap Dashboard
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Real-time brand recommendations, citation rates, and competitor share across AI search engines
        </p>
      </div>

      {/* 1. KPI Cards */}
      <KpiOverview
        brandName={brandName}
        overallSoV={overallSoV}
        totalEvaluations={totalEvaluations}
        activePrompts={activePrompts}
        flipsCount={flipsCount}
      />



      {/* 2. Visualizations */}
      <AnalyticsCharts
        brandName={brandName}
        overallSoV={overallSoV}
        engineRates={engineRates}
        competitorRanking={competitorRanking}
      />

      {/* 3. Competitor Head-to-Head Matrix */}
      <div className="card-white rounded-lg p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Competitor Benchmark Matrix
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Citation frequency vs target competitors across all evaluations
            </p>
          </div>
        </div>

        <div className="overflow-x-auto rounded border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider font-semibold text-[11px]">
                <th className="py-2.5 px-3">Brand / Competitor</th>
                <th className="py-2.5 px-3 text-center">Type</th>
                <th className="py-2.5 px-3 text-center">Citation Rate</th>
                <th className="py-2.5 px-3 text-right">Total Citations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
              {/* Primary Target Brand */}
              <tr className="bg-orange-50/50 dark:bg-orange-950/20 font-medium">
                <td className="py-2.5 px-3 font-semibold text-orange-950 dark:text-orange-300">{brandName} (Your Brand)</td>
                <td className="py-2.5 px-3 text-center">
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-orange-100 dark:bg-orange-950/40 text-orange-800 dark:text-orange-300 border border-orange-200 dark:border-orange-800/60">
                    Target Brand
                  </span>
                </td>
                <td className="py-2.5 px-3 text-center font-bold text-orange-700 dark:text-orange-400">{overallSoV}%</td>
                <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900 dark:text-white">
                  {Math.round((overallSoV / 100) * totalEvaluations)}
                </td>
              </tr>

              {/* Competitors */}
              {competitorRanking.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-slate-500 dark:text-slate-400 text-xs">
                    No competitor citations recorded yet.
                  </td>
                </tr>
              ) : (
                competitorRanking.map((comp, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-white">{comp.name}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        Competitor
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-semibold text-slate-700 dark:text-slate-300">
                      {comp.citation_rate}%
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-700 dark:text-slate-300">
                      {comp.citation_count}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
