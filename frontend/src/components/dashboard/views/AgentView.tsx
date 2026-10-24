import AgentCopilot from '../AgentCopilot';
import { PromptItem, BrandProfile, OverviewMetrics } from '@/types';

interface AgentViewProps {
  apiKey: string;
  brandProfile: BrandProfile;
  prompts: PromptItem[];
  metrics: OverviewMetrics;
  onRefresh: () => void;
  onTriggerRun: () => Promise<void> | void;
  isLoading: boolean;
  userId?: string;
}

export default function AgentView({
  apiKey,
  brandProfile,
  prompts,
  metrics,
  onRefresh,
  onTriggerRun,
  isLoading,
  userId,
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
      userId={userId}
    />
  );
}
