import AgentCopilot from '@/components/AgentCopilot';
import { PromptItem, BrandProfile, OverviewMetrics } from '@/types';

interface AgentViewProps {
  apiKey: string;
  brandProfile: BrandProfile;
  prompts: PromptItem[];
  metrics: OverviewMetrics;
  onRefresh: () => void;
  onTriggerRun: () => Promise<void> | void;
  isLoading: boolean;
}

export default function AgentView({
  apiKey,
  brandProfile,
  prompts,
  metrics,
  onRefresh,
  onTriggerRun,
  isLoading,
}: AgentViewProps) {
  return (
    <div className="space-y-4">
      {/* Clean, Simple Header */}
      <div>
        <h2 className="text-base font-bold text-slate-900 tracking-tight">
          GEO Agent
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Ask questions, add target search queries, or manage competitors for {brandProfile.brand.name}
        </p>
      </div>

      {/* Main Agent Copilot Component */}
      <AgentCopilot
        apiKey={apiKey}
        brandProfile={brandProfile}
        prompts={prompts}
        metrics={metrics}
        onRefresh={onRefresh}
        onTriggerRun={onTriggerRun}
        isLoading={isLoading}
      />
    </div>
  );
}
