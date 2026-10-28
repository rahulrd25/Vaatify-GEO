'use client';

import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { FlipItem } from '@/types';

interface DriftFeedProps {
  flips?: FlipItem[];
}

export default function DriftFeed({ flips = [] }: DriftFeedProps) {
  return (
    <div className="card-white rounded-lg p-5 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Citation Drift & Flip Alerts</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Status shifts detected between consecutive search evaluations</p>
        </div>
        <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
          {flips.length} {flips.length === 1 ? 'Alert' : 'Alerts'}
        </span>
      </div>

      {flips.length === 0 ? (
        <div className="py-8 text-center text-slate-500 dark:text-slate-400 text-xs bg-slate-50/50 dark:bg-slate-900/50 rounded border border-slate-200 dark:border-slate-800">
          No citation status changes detected yet across evaluation runs.
        </div>
      ) : (
        <div className="space-y-2">
          {flips.map((alert, idx) => (
            <div
              key={`${alert.prompt_id}-${alert.engine}-${idx}`}
              className="flex items-center justify-between p-3 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                    alert.flip_type === 'gained_citation'
                      ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/60'
                      : 'bg-rose-100 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800/60'
                  }`}
                >
                  {alert.flip_type === 'gained_citation' ? (
                    <>
                      <ArrowUpRight className="h-3.5 w-3.5" />
                      <span>GAINED</span>
                    </>
                  ) : (
                    <>
                      <ArrowDownRight className="h-3.5 w-3.5" />
                      <span>LOST</span>
                    </>
                  )}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {alert.flip_type === 'gained_citation' ? 'Gained Citation' : 'Lost Citation'}
                    </span>
                    <span className="text-slate-400 dark:text-slate-600">•</span>
                    <span className="font-mono text-orange-700 dark:text-orange-400 font-semibold">{alert.prompt_id}</span>
                    <span className="text-slate-400 dark:text-slate-600">•</span>
                    <span className="capitalize text-slate-700 dark:text-slate-300 font-medium">{alert.engine}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {alert.flip_type === 'gained_citation'
                      ? 'Target brand domain was cited in the latest evaluation run.'
                      : 'Target brand domain dropped citation in the latest evaluation run.'}
                  </p>
                </div>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 shrink-0 font-medium font-mono">
                {alert.new_timestamp ? new Date(alert.new_timestamp).toLocaleDateString() : 'Latest'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


