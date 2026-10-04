'use client';

import { useState, useMemo } from 'react';
import { ExternalLink, RefreshCw, Clock, Search, Layers, ChevronDown, ChevronUp } from 'lucide-react';
import { RunItem } from '@/types';

interface PromptsExplorerProps {
  runs?: RunItem[];
  onRefresh?: () => void;
}

interface RunBatch {
  batchId: string;
  batchIndex: number;
  timeString: string;
  dateString: string;
  fullDate: string;
  runs: RunItem[];
  citedCount: number;
  totalCount: number;
  sov: number;
}

function formatExactTime(timestamp: string | null): { time: string; date: string; full: string } {
  if (!timestamp) {
    return { time: '—', date: '—', full: 'No timestamp' };
  }
  const dateObj = new Date(timestamp);
  if (isNaN(dateObj.getTime())) {
    return { time: timestamp, date: '', full: timestamp };
  }

  const time = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const date = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  const full = `${date} at ${time}`;

  return { time, date, full };
}

export default function PromptsExplorer({ runs = [], onRefresh }: PromptsExplorerProps) {
  const [search, setSearch] = useState('');
  const [engineFilter, setEngineFilter] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [collapsedBatches, setCollapsedBatches] = useState<Record<string, boolean>>({});

  const handleRefresh = async () => {
    if (!onRefresh) return;
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const toggleBatchCollapse = (batchId: string) => {
    setCollapsedBatches((prev) => ({
      ...prev,
      [batchId]: !prev[batchId],
    }));
  };

  // Filter runs by search & engine
  const filteredRuns = useMemo(() => {
    return runs.filter((row) => {
      const promptText = row.prompt_text || '';
      const promptId = row.prompt_id || '';
      const engine = row.engine || '';
      const matchesSearch =
        promptText.toLowerCase().includes(search.toLowerCase()) ||
        promptId.toLowerCase().includes(search.toLowerCase()) ||
        engine.toLowerCase().includes(search.toLowerCase());
      const matchesEngine =
        engineFilter === 'all' || engine.toLowerCase() === engineFilter.toLowerCase();
      return matchesSearch && matchesEngine;
    });
  }, [runs, search, engineFilter]);

  // Group filtered runs into logical evaluation batches (runs within 3 minutes of each other)
  const batches = useMemo<RunBatch[]>(() => {
    if (filteredRuns.length === 0) return [];

    const sorted = [...filteredRuns].sort((a, b) => {
      const timeA = a.run_timestamp ? new Date(a.run_timestamp).getTime() : 0;
      const timeB = b.run_timestamp ? new Date(b.run_timestamp).getTime() : 0;
      return timeB - timeA;
    });

    const grouped: RunBatch[] = [];
    let currentBatchRuns: RunItem[] = [];
    let lastTimestamp: number | null = null;

    sorted.forEach((run) => {
      const runTime = run.run_timestamp ? new Date(run.run_timestamp).getTime() : 0;

      if (lastTimestamp === null || Math.abs(lastTimestamp - runTime) <= 180000) {
        // Within 3 minutes -> same batch
        currentBatchRuns.push(run);
      } else {
        // New batch
        if (currentBatchRuns.length > 0) {
          const firstRun = currentBatchRuns[0];
          const timeInfo = formatExactTime(firstRun.run_timestamp);
          const cited = currentBatchRuns.filter((r) => r.brand_cited).length;
          grouped.push({
            batchId: `batch-${grouped.length + 1}-${firstRun.id}`,
            batchIndex: 0, // Assigned below
            timeString: timeInfo.time,
            dateString: timeInfo.date,
            fullDate: timeInfo.full,
            runs: currentBatchRuns,
            citedCount: cited,
            totalCount: currentBatchRuns.length,
            sov: currentBatchRuns.length > 0 ? (cited / currentBatchRuns.length) * 100 : 0,
          });
        }
        currentBatchRuns = [run];
      }
      lastTimestamp = runTime;
    });

    if (currentBatchRuns.length > 0) {
      const firstRun = currentBatchRuns[0];
      const timeInfo = formatExactTime(firstRun.run_timestamp);
      const cited = currentBatchRuns.filter((r) => r.brand_cited).length;
      grouped.push({
        batchId: `batch-${grouped.length + 1}-${firstRun.id}`,
        batchIndex: 0,
        timeString: timeInfo.time,
        dateString: timeInfo.date,
        fullDate: timeInfo.full,
        runs: currentBatchRuns,
        citedCount: cited,
        totalCount: currentBatchRuns.length,
        sov: currentBatchRuns.length > 0 ? (cited / currentBatchRuns.length) * 100 : 0,
      });
    }

    // Number batches sequentially (Batch #1 is oldest, highest is latest)
    const totalBatches = grouped.length;
    return grouped.map((b, idx) => ({
      ...b,
      batchIndex: totalBatches - idx,
    }));
  }, [filteredRuns]);

  // Fixed list of all 5 supported engines with real-time run counts
  const engineOptions = useMemo(() => {
    const standardEngines = [
      { id: 'chatgpt', label: 'ChatGPT' },
      { id: 'google_ai_overview', label: 'Google AI Overview' },
      { id: 'gemini', label: 'Gemini' },
      { id: 'perplexity', label: 'Perplexity' },
      { id: 'claude', label: 'Claude' },
    ];
    const counts: Record<string, number> = {};
    runs.forEach((r) => {
      const eng = r.engine || 'unknown';
      counts[eng] = (counts[eng] || 0) + 1;
    });
    return standardEngines.map((eng) => ({
      ...eng,
      count: counts[eng.id] || 0,
    }));
  }, [runs]);

  const latestRun = runs.length > 0 ? formatExactTime(runs[0].run_timestamp) : null;

  return (
    <div className="space-y-3 mb-8">
      {/* 1. Compact Unified Control Bar */}
      <div className="card-white rounded-xl px-4 py-3 shadow-xs border border-slate-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Citation Logs</h3>
          <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
            {batches.length} batches • {runs.length} runs
          </span>
          {latestRun && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-slate-500 ml-1">
              <Clock className="w-3 h-3 text-slate-400" />
              Latest: <strong className="font-mono text-slate-700">{latestRun.time}</strong>
            </span>
          )}
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          <select
            id="engine-select"
            value={engineFilter}
            onChange={(e) => setEngineFilter(e.target.value)}
            className="h-8 px-2.5 py-0.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 text-xs font-medium focus:outline-none focus:border-orange-500 focus:bg-white transition-colors cursor-pointer"
          >
            <option value="all">All Engines ({runs.length})</option>
            {engineOptions.map((eng) => (
              <option key={eng.id} value={eng.id}>
                {eng.label} ({eng.count})
              </option>
            ))}
          </select>

          <div className="relative flex-1 sm:w-52">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search query..."
              className="w-full h-8 pl-8 pr-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-orange-500 focus:bg-white transition-colors"
            />
          </div>

          {onRefresh && (
            <button
              type="button"
              onClick={handleRefresh}
              title="Refresh citation logs"
              className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-orange-600' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* 2. Grouped Batch Cards */}
      {batches.length === 0 ? (
        <div className="card-white rounded-xl p-12 text-center border border-slate-200">
          <p className="text-xs text-slate-500">
            {runs.length === 0
              ? 'No evaluation batches recorded yet. Run a search evaluation from Agent Copilot to start logging.'
              : 'No evaluation runs match your current search or engine filter.'}
          </p>
        </div>
      ) : (
        batches.map((batch, bIdx) => {
          const isCollapsed = collapsedBatches[batch.batchId];
          const isLatestBatch = bIdx === 0;

          return (
            <div
              key={batch.batchId}
              className={`rounded-xl border shadow-xs overflow-hidden transition-all bg-white ${
                isLatestBatch ? 'border-orange-200 ring-1 ring-orange-500/10' : 'border-slate-200'
              }`}
            >
              {/* Batch Header Bar */}
              <div
                onClick={() => toggleBatchCollapse(batch.batchId)}
                className="px-5 py-3.5 bg-slate-50/70 hover:bg-slate-100/60 border-b border-slate-200/80 flex items-center justify-between gap-4 cursor-pointer select-none"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                    <Layers className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                    <span>Batch #{batch.batchIndex}</span>
                    {isLatestBatch && (
                      <span className="text-[10px] uppercase font-bold text-orange-700 bg-orange-100/80 px-2 py-0.2 rounded border border-orange-200">
                        Latest Run
                      </span>
                    )}
                  </div>

                  <span className="text-slate-300">•</span>

                  <div className="flex items-center gap-1.5 text-xs text-slate-600 font-mono">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span className="font-semibold text-slate-800">{batch.timeString}</span>
                    <span className="text-slate-400 text-[11px]">({batch.dateString})</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="hidden sm:flex items-center gap-2 text-xs">
                    <span className="text-slate-500">
                      <strong>{batch.totalCount}</strong> queries evaluated
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="font-semibold text-emerald-700">
                      {batch.citedCount} citations ({batch.sov.toFixed(0)}% SoV)
                    </span>
                  </div>

                  <button
                    type="button"
                    className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
                  >
                    {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Batch Table */}
              {!isCollapsed && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50/40 text-slate-600 border-b border-slate-200/60 uppercase tracking-wider font-semibold text-[10px]">
                        <th className="py-2 px-3 w-10 text-center">#</th>
                        <th className="py-2 px-3">Target Query</th>
                        <th className="py-2 px-3">Engine</th>
                        <th className="py-2 px-3">Time</th>
                        <th className="py-2 px-3 text-center">Mentioned</th>
                        <th className="py-2 px-3 text-center">Cited</th>
                        <th className="py-2 px-3">Source URL</th>
                        <th className="py-2 px-3">Competitors Cited</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800">
                      {batch.runs.map((row, rIdx) => {
                        const timeInfo = formatExactTime(row.run_timestamp);
                        return (
                          <tr key={`${row.id}-${row.engine}-${rIdx}`} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-2.5 px-3 font-mono text-slate-400 font-semibold text-center text-[11px]">
                              #{rIdx + 1}
                            </td>
                            <td className="py-2.5 px-3 max-w-xs sm:max-w-sm md:max-w-md font-medium text-slate-900 relative group cursor-default">
                              <div className="truncate" title={row.prompt_text}>
                                {row.prompt_text}
                              </div>
                              {/* Hover Card for Full Prompt (Light Theme, Clipless Positioning) */}
                              <div className={`absolute left-3 ${rIdx === 0 ? 'top-full mt-1' : 'bottom-full mb-1'} z-50 hidden group-hover:block w-80 max-w-sm p-3 rounded-lg bg-white text-slate-800 text-xs font-normal shadow-lg pointer-events-none border border-slate-200 leading-relaxed whitespace-normal transition-all`}>
                                <div className="font-semibold text-slate-500 text-[10px] uppercase tracking-wider mb-1">Target Query:</div>
                                <div className="text-slate-900 font-medium">{row.prompt_text}</div>
                              </div>
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 capitalize">
                                {row.engine === 'google_ai_overview' ? 'Google AI' : row.engine}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                              {timeInfo.time}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              {row.brand_mentioned ? (
                                <span className="font-semibold text-emerald-700">Yes</span>
                              ) : (
                                <span className="text-slate-400">No</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              {row.brand_cited ? (
                                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200 text-[11px]">
                                  Cited
                                </span>
                              ) : (
                                <span className="text-slate-400 font-medium">Uncited</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-[11px]">
                              {row.citation_url ? (
                                <a
                                  href={row.citation_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 text-orange-700 hover:text-orange-900 hover:underline truncate max-w-[170px]"
                                  title={row.citation_url}
                                >
                                  <span className="truncate">{row.citation_url.replace(/^https?:\/\//, '')}</span>
                                  <ExternalLink className="h-3 w-3 shrink-0" />
                                </a>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3">
                              {row.competitors_cited && row.competitors_cited.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {row.competitors_cited.map((c, cIdx) => (
                                    <span
                                      key={cIdx}
                                      className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] border border-slate-200 font-medium"
                                    >
                                      {typeof c === 'string' ? c : c.name}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-slate-400 text-[11px]">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
