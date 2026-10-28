'use client';

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
  PieChart, Pie
} from 'recharts';
import { BarChart2, PieChart as PieIcon } from 'lucide-react';
import { EngineRateItem, CompetitorItem } from '@/types';

interface AnalyticsChartsProps {
  brandName?: string;
  overallSoV: number;
  engineRates?: EngineRateItem[];
  competitorRanking?: CompetitorItem[];
}

const ENGINE_COLORS: Record<string, string> = {
  perplexity: '#2563eb',
  claude: '#0284c7',
  gemini: '#475569',
  chatgpt: '#059669',
};

const PALETTE = ['#2563eb', '#64748b', '#94a3b8', '#cbd5e1', '#e2e8f0'];

export default function AnalyticsCharts({
  brandName = 'Brand',
  overallSoV = 0,
  engineRates = [],
  competitorRanking = [],
}: AnalyticsChartsProps) {
  // Format engine data: only from actual engineRates
  const formattedEngineData = (engineRates || []).map((item) => ({
    engine: item.engine.charAt(0).toUpperCase() + item.engine.slice(1).replace(/_/g, ' '),
    sov: item.sov,
    color: ENGINE_COLORS[item.engine.toLowerCase()] || '#2563eb',
  }));

  // Format competitor distribution data: only when evaluations or competitors exist
  const hasCompetitorData = competitorRanking.length > 0 || overallSoV > 0;
  const competitorData = hasCompetitorData
    ? [
        { name: `${brandName} (Target)`, value: overallSoV, color: '#2563eb' },
        ...competitorRanking.map((comp, idx) => ({
          name: comp.name,
          value: comp.citation_rate,
          color: PALETTE[(idx + 1) % PALETTE.length],
        })),
      ]
    : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      {/* 1. Engine Share of Voice Bar Chart */}
      <div className="lg:col-span-2 card-white rounded-lg p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">AI Search Engine Performance</h3>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">Citation Share of Voice percentage per engine</p>
          </div>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 border border-gray-200 dark:border-slate-700">
            Live Metrics
          </span>
        </div>

        {formattedEngineData.length > 0 ? (
          <div className="h-60 w-full min-h-[240px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={240}>
              <BarChart data={formattedEngineData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.2} vertical={false} />
                <XAxis dataKey="engine" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} unit="%" tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '6px', color: '#f8fafc', fontSize: '12px' }}
                  formatter={(value) => [`${value}%`, 'Citation Rate']}
                />
                <Bar dataKey="sov" radius={[4, 4, 0, 0]}>
                  {formattedEngineData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-60 w-full min-h-[240px] flex flex-col items-center justify-center border border-dashed border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50/50 dark:bg-slate-900/50 text-center p-6">
            <BarChart2 className="h-8 w-8 text-slate-300 dark:text-slate-600 mb-2" />
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">No Search Engine Evaluations Recorded</p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 max-w-xs">
              Citation Share of Voice will display here once your target search queries are evaluated across AI search engines.
            </p>
          </div>
        )}
      </div>

      {/* 2. Competitor Share Distribution */}
      <div className="card-white rounded-lg p-5 shadow-xs flex flex-col justify-between">
        <div>
          <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-1">Competitor Citation Share</h3>
          <p className="text-xs text-gray-500 dark:text-slate-400 mb-4">Comparison vs tracked competitors</p>

          {hasCompetitorData ? (
            <>
              <div className="h-44 w-full min-h-[176px]">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={176}>
                  <PieChart>
                    <Pie
                      data={competitorData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {competitorData.map((entry, index) => (
                        <Cell key={`pie-cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '6px', color: '#f8fafc', fontSize: '12px' }}
                      formatter={(val) => [`${val}%`, 'Share']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend */}
              <div className="space-y-1.5 mt-2 pt-3 border-t border-gray-200 dark:border-slate-800">
                {competitorData.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 truncate pr-2">
                      <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-gray-700 dark:text-slate-300 truncate">{item.name}</span>
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-white shrink-0">{item.value}%</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-56 w-full flex flex-col items-center justify-center border border-dashed border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50/50 dark:bg-slate-900/50 text-center p-4">
              <PieIcon className="h-7 w-7 text-slate-300 dark:text-slate-600 mb-2" />
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">No Competitor Data Yet</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 max-w-xs">
                Benchmark comparisons will populate when citations are detected for your brand or competitors.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

