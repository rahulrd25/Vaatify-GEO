'use client';

import PromptsExplorer from '../PromptsExplorer';
import { RunItem } from '@/types';

interface ExplorerViewProps {
  runs: RunItem[];
  onRefresh?: () => void;
}

export default function ExplorerView({ runs, onRefresh }: ExplorerViewProps) {
  return (
    <div className="space-y-4">
      <PromptsExplorer runs={runs} onRefresh={onRefresh} />
    </div>
  );
}
