'use client';

import DriftFeed from '@/components/DriftFeed';
import { FlipItem } from '@/types';

interface DriftViewProps {
  flips: FlipItem[];
}

export default function DriftView({ flips }: DriftViewProps) {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">
          Citation Drift & Model Flip Alerts ({flips.length})
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Automatic alerts when AI model updates cause brand citations to be gained or lost
        </p>
      </div>

      {/* Drift Component */}
      <DriftFeed flips={flips} />
    </div>
  );
}
