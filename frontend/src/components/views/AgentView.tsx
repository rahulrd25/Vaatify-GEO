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
    <AgentCopilot
      apiKey={apiKey}
      brandProfile={brandProfile}
      prompts={prompts}
      metrics={metrics}
      onRefresh={onRefresh}
      onTriggerRun={onTriggerRun}
      isLoading={isLoading}
    />
  );
}
