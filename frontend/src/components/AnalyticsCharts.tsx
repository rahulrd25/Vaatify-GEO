'use client';

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
  PieChart, Pie
} from 'recharts';
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
  brandName = 'Vaatify',
  overallSoV = 66.7,
  engineRates = [],
  competitorRanking = [],
}: AnalyticsChartsProps) {

  // Format engine data
  const formattedEngineData = engineRates.length > 0
    ? engineRates.map((item) => ({
        engine: item.engine.charAt(0).toUpperCase() + item.engine.slice(1),
        sov: item.sov,
        color: ENGINE_COLORS[item.engine.toLowerCase()] || '#2563eb',
      }))
    : [
        { engine: 'Perplexity', sov: 100, color: '#2563eb' },
        { engine: 'Claude', sov: 33.3, color: '#0284c7' },
        { engine: 'Gemini', sov: 100, color: '#475569' },
      ];

  // Format competitor distribution data
  const competitorData = [
    { name: `${brandName} (Target)`, value: overallSoV, color: '#2563eb' },
    ...competitorRanking.map((comp, idx) => ({
      name: comp.name,
      value: comp.citation_rate,
      color: PALETTE[(idx + 1) % PALETTE.length],
    })),
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      {/* 1. Engine Share of Voice Bar Chart */}
      <div className="lg:col-span-2 card-white rounded-lg p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">AI Search Engine Performance</h3>
            <p className="text-xs text-gray-500 mt-0.5">Citation Share of Voice percentage per engine</p>
          </div>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200">
            Live Metrics
          </span>
        </div>
        <div className="h-60 w-full min-h-[240px]">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={240}>
            <BarChart data={formattedEngineData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="engine" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} unit="%" tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '6px', color: '#0f172a', fontSize: '12px' }}
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
      </div>

      {/* 2. Competitor Share Distribution */}
      <div className="card-white rounded-lg p-5 shadow-xs flex flex-col justify-between">
        <div>
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-1">Competitor Citation Share</h3>
          <p className="text-xs text-gray-500 mb-4">Comparison vs tracked competitors</p>
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
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '6px', color: '#0f172a', fontSize: '12px' }}
                  formatter={(val) => [`${val}%`, 'Share']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Legend */}
        <div className="space-y-1.5 mt-2 pt-3 border-t border-gray-200">
          {competitorData.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 truncate pr-2">
                <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-gray-700 truncate">{item.name}</span>
              </div>
              <span className="font-semibold text-gray-900 shrink-0">{item.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

