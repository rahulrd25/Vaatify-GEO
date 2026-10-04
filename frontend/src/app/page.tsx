'use client';

import { useState, useEffect, useCallback } from 'react';
import Sidebar, { NavTab } from '@/components/Sidebar';
import TopNavbar from '@/components/TopNavbar';
import AgentView from '@/components/views/AgentView';
import OverviewView from '@/components/views/OverviewView';
import QueriesView from '@/components/views/QueriesView';
import ExplorerView from '@/components/views/ExplorerView';
import DriftView from '@/components/views/DriftView';
import SettingsView from '@/components/views/SettingsView';
import { PromptItem, BrandProfile, RunItem, OverviewMetrics } from '@/types';
import { apiUrl } from '@/lib/api';


export default function Home() {
  const [apiKey, setApiKey] = useState('geo_DgroTYxwQp7dl5prrTMzjITh_Imt-BlsTbIp-TuBpPA');
  const [currentTab, setCurrentTab] = useState<NavTab>('agent');
  const [isLoading, setIsLoading] = useState(false);

  const [metrics, setMetrics] = useState<OverviewMetrics>({
    brand_name: 'Vaatify',
    overall_share_of_voice: 66.7,
    total_evaluations: 18,
    active_prompts_count: 6,
    flips_count: 2,
    per_engine_rates: [],
    per_prompt_rates: {},
    competitor_ranking: [],
    flips: [],
  });

  const [prompts, setPrompts] = useState<PromptItem[]>([]);
  const [runs, setRuns] = useState<RunItem[]>([]);
  const [brandProfile, setBrandProfile] = useState<BrandProfile>({
    brand: { name: 'Vaatify', domain: 'vaatify.com' },
    competitors: [
      { name: 'DevSquad', domain: 'devsquad.com' },
      { name: 'Altar.io', domain: 'altar.io' },
      { name: 'MVP.dev', domain: 'mvp.dev' },
      { name: 'BuildWithTitan', domain: 'buildwithtitan.com' },
    ],
  });


  const fetchBackendData = useCallback(async () => {
    try {
      // 1. Fetch Metrics Overview
      const metricsRes = await fetch(apiUrl('/api/v1/metrics/overview'), {
        headers: { 'X-API-Key': apiKey },
      });
      if (metricsRes.ok) {
        const data = await metricsRes.json();
        setMetrics(data);
      }

      // 2. Fetch Prompts
      const promptsRes = await fetch(apiUrl('/api/v1/prompts'), {
        headers: { 'X-API-Key': apiKey },
      });
      if (promptsRes.ok) {
        const data = await promptsRes.json();
        setPrompts(data);
      }

      // 3. Fetch Recent Runs
      const runsRes = await fetch(apiUrl('/api/v1/runs'), {
        headers: { 'X-API-Key': apiKey },
      });
      if (runsRes.ok) {
        const data = await runsRes.json();
        setRuns(data);
      }

      // 4. Fetch Brand Profile
      const profileRes = await fetch(apiUrl('/api/v1/profile'), {
        headers: { 'X-API-Key': apiKey },
      });
      if (profileRes.ok) {
        const data = await profileRes.json();
        setBrandProfile(data);
      }
    } catch (err) {
      console.warn('Backend connection warning:', err);
    }
  }, [apiKey]);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      if (isMounted) {
        await fetchBackendData();
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [fetchBackendData]);

  const handleTriggerRun = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(apiUrl('/api/v1/pipeline/run'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
        },
      });
      if (res.ok) {
        // Poll backend pipeline status until complete (max 30s)
        for (let i = 0; i < 15; i++) {
          await new Promise((r) => setTimeout(r, 2000));
          await fetchBackendData();
          try {
            const statusRes = await fetch(apiUrl('/api/v1/pipeline/status'), {
              headers: { 'X-API-Key': apiKey }
            });
            if (statusRes.ok) {
              const statusData = await statusRes.json();
              if (!statusData.is_running) {
                break;
              }
            }
          } catch {
            // Ignore temporary polling errors
          }
        }
        await fetchBackendData();
      }
    } catch (err) {
      console.error('Failed to trigger pipeline run:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      {/* 1. Left Sidebar Workspace Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        brandName={brandProfile.brand.name || 'Vaatify'}
        queriesCount={prompts.length}
        alertsCount={metrics.flips_count ?? 0}
      />

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopNavbar
          apiKey={apiKey}
          setApiKey={setApiKey}
          brandName={brandProfile.brand.name || 'Vaatify'}
          brandDomain={brandProfile.brand.domain || 'vaatify.com'}
          onTriggerRun={handleTriggerRun}
          isLoading={isLoading}
        />

        <main className="flex-1 p-6 md:p-8 max-w-6xl w-full mx-auto">
          <div className={currentTab === 'agent' ? 'block' : 'hidden'}>
            <AgentView
              apiKey={apiKey}
              brandProfile={brandProfile}
              prompts={prompts}
              metrics={metrics}
              onRefresh={fetchBackendData}
              onTriggerRun={handleTriggerRun}
              isLoading={isLoading}
            />
          </div>

          <div className={currentTab === 'overview' ? 'block' : 'hidden'}>
            <OverviewView
              brandName={brandProfile.brand.name || 'Vaatify'}
              overallSoV={metrics.overall_share_of_voice ?? 0}
              totalEvaluations={metrics.total_evaluations ?? 0}
              activePrompts={metrics.active_prompts_count ?? prompts.length ?? 0}
              flipsCount={metrics.flips_count ?? 0}
              engineRates={metrics.per_engine_rates || []}
              competitorRanking={metrics.competitor_ranking || []}
            />
          </div>

          <div className={currentTab === 'queries' ? 'block' : 'hidden'}>
            <QueriesView
              apiKey={apiKey}
              brandName={brandProfile.brand.name || 'Vaatify'}
              prompts={prompts}
              onRefresh={fetchBackendData}
              onTriggerRun={handleTriggerRun}
              isLoading={isLoading}
            />
          </div>

          <div className={currentTab === 'explorer' ? 'block' : 'hidden'}>
            <ExplorerView runs={runs} onRefresh={fetchBackendData} />
          </div>

          <div className={currentTab === 'drift' ? 'block' : 'hidden'}>
            <DriftView flips={metrics.flips || []} />
          </div>

          <div className={currentTab === 'settings' ? 'block' : 'hidden'}>
            <SettingsView
              apiKey={apiKey}
              brandProfile={brandProfile}
              setBrandProfile={setBrandProfile}
              onRefresh={fetchBackendData}
            />
          </div>
        </main>
      </div>
    </div>
  );
}



