export interface PromptItem {
  id: string;
  brand: string;
  prompt_text: string;
  active: boolean;
}

export interface BrandProfile {
  brand: {
    name: string;
    domain: string;
  };
  competitors: Array<{
    name: string;
    domain: string;
  }>;
}

export interface RunItem {
  id: string;
  prompt_id: string;
  prompt_text: string;
  engine: string;
  brand_mentioned: boolean;
  brand_cited: boolean;
  citation_url: string | null;
  competitors_mentioned: string[];
  competitors_cited: { name: string; url: string }[];
  run_timestamp: string | null;
}

export interface EngineRateItem {
  engine: string;
  sov: number;
  total_runs: number;
  cited_runs: number;
}

export interface CompetitorItem {
  name: string;
  citation_count: number;
  citation_rate: number;
}

export interface FlipItem {
  prompt_id: string;
  engine: string;
  flip_type: string;
  previous_status: boolean;
  new_status: boolean;
  previous_timestamp?: string;
  new_timestamp?: string;
}

export interface OverviewMetrics {
  brand_name: string;
  overall_share_of_voice: number;
  total_evaluations: number;
  active_prompts_count: number;
  flips_count: number;
  per_engine_rates: EngineRateItem[];
  per_prompt_rates: Record<string, unknown>;
  competitor_ranking: CompetitorItem[];
  flips: FlipItem[];
}

export interface MonitoringSchedule {
  id: string;
  brand: string;
  frequency: 'daily' | 'weekly' | 'off';
  day_of_week: number;
  hour_utc: number;
  minute_utc: number;
  is_active: boolean;
  last_run_at: string | null;
  next_run_at: string | null;
  last_run_status: string | null;
}

