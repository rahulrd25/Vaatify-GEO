'use client';

import { useState, useEffect, useCallback } from 'react';
import Sidebar, { NavTab } from '@/components/Sidebar';
import AgentView from '@/components/views/AgentView';
import OverviewView from '@/components/views/OverviewView';
import QueriesView from '@/components/views/QueriesView';
import ExplorerView from '@/components/views/ExplorerView';
import DriftView from '@/components/views/DriftView';
import SettingsView from '@/components/views/SettingsView';
import UserSettingsView from '@/components/views/UserSettingsView';
import AuthView from '@/components/auth/AuthView';
import OnboardingWizard from '@/components/onboarding/OnboardingWizard';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { PromptItem, BrandProfile, RunItem, OverviewMetrics } from '@/types';
import { apiUrl } from '@/lib/api';
import { Loader2, Sparkles, ArrowRight, X } from 'lucide-react';

export default function Home() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}

function AppShell() {
  const { user, isLoading: isAuthLoading } = useAuth();

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 text-[#FE4D03] animate-spin mb-3" />
        <p className="text-xs text-slate-500 font-medium">Loading your brand workspace...</p>
      </div>
    );
  }

  if (!user) {
    return <AuthView />;
  }

  return <MainDashboard />;
}

function MainDashboard() {
  const { user, sessionToken, onboardingCompleted, setOnboardingCompleted, logout } = useAuth();
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(!onboardingCompleted);
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);

  const [apiKey] = useState(
    process.env.NEXT_PUBLIC_GEO_API_KEY || 'geo_DgroTYxwQp7dl5prrTMzjITh_Imt-BlsTbIp-TuBpPA'
  );
  const [currentTab, setCurrentTab] = useState<NavTab>('agent');
  const [isLoading, setIsLoading] = useState(false);

  const brandDisplayName = user?.detectedBrand?.name || 'My Brand';
  const brandDomainName = user?.detectedBrand?.domain || '';

  const [metrics, setMetrics] = useState<OverviewMetrics>({
    brand_name: brandDisplayName,
    overall_share_of_voice: 0.0,
    total_evaluations: 0,
    active_prompts_count: 0,
    flips_count: 0,
    per_engine_rates: [],
    per_prompt_rates: {},
    competitor_ranking: [],
    flips: [],
  });

  const [prompts, setPrompts] = useState<PromptItem[]>([]);
  const [runs, setRuns] = useState<RunItem[]>([]);
  const [brandProfile, setBrandProfile] = useState<BrandProfile>({
    brand: { name: brandDisplayName, domain: brandDomainName },
    competitors: [],
  });

  const fetchBackendData = useCallback(async () => {
    const headers: Record<string, string> = {
      'X-API-Key': apiKey,
      ...(sessionToken ? { 'Authorization': `Bearer ${sessionToken}` } : {}),
      ...(user?.id ? { 'X-User-Id': user.id } : {})
    };
    const userQuery = user?.id ? `?user_id=${encodeURIComponent(user.id)}` : '';

    await Promise.allSettled([
      // 1. Fetch Metrics Overview
      fetch(apiUrl(`/api/v1/metrics/overview${userQuery}`), { headers })
        .then(async (res) => {
          if (res.ok) {
            const data = await res.json();
            setMetrics({
              ...data,
              brand_name: data.brand_name || brandDisplayName,
            });
          }
          else console.warn(`Metrics fetch responded with status ${res.status}`);
        })
        .catch((err) => console.warn('Metrics endpoint connection notice:', err)),

      // 2. Fetch Prompts
      fetch(apiUrl(`/api/v1/prompts${userQuery}`), { headers })
        .then(async (res) => {
          if (res.ok) setPrompts(await res.json());
          else console.warn(`Prompts fetch responded with status ${res.status}`);
        })
        .catch((err) => console.warn('Prompts endpoint connection notice:', err)),

      // 3. Fetch Recent Runs
      fetch(apiUrl(`/api/v1/runs${userQuery}`), { headers })
        .then(async (res) => {
          if (res.ok) setRuns(await res.json());
          else console.warn(`Runs fetch responded with status ${res.status}`);
        })
        .catch((err) => console.warn('Runs endpoint connection notice:', err)),

      // 4. Fetch Brand Profile
      fetch(apiUrl(`/api/v1/profile${userQuery}`), { headers })
        .then(async (res) => {
          if (res.ok) {
            const data = await res.json();
            if (data?.brand?.name) {
              setBrandProfile(data);
            }
          }
          else console.warn(`Profile fetch responded with status ${res.status}`);
        })
        .catch((err) => console.warn('Profile endpoint connection notice:', err)),
    ]);
  }, [apiKey, user, sessionToken, brandDisplayName]);

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
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
        ...(user?.id ? { 'X-User-Id': user.id } : {})
      };
      const res = await fetch(apiUrl('/api/v1/pipeline/run'), {
        method: 'POST',
        headers,
      });
      if (res.ok) {
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
        brandName={brandProfile.brand.name || user?.detectedBrand?.name || 'Acme'}
        queriesCount={prompts.length}
        alertsCount={metrics.flips_count ?? 0}
        onboardingCompleted={onboardingCompleted}
        onOpenOnboarding={() => setIsOnboardingOpen(true)}
      />

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-6 md:p-8 max-w-6xl w-full mx-auto">
          {/* Brand Setup Checklist / Welcome Banner */}
          {!onboardingCompleted && !isBannerDismissed && (
            <div className="mb-6 p-4 bg-gradient-to-r from-orange-50 via-white to-orange-50/60 border border-orange-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-orange-100 border border-orange-200 flex items-center justify-center shrink-0">
                  <Sparkles className="h-4.5 w-4.5 text-[#FE4D03]" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900">
                    Welcome! Set up your brand account to activate real-time AI citation tracking
                  </h3>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Configure your registered brand domain, benchmark competitors, and target buyer search queries.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                <button
                  onClick={() => setIsOnboardingOpen(true)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#FE4D03] hover:bg-[#e04402] rounded cursor-pointer transition-colors shadow-2xs flex items-center gap-1.5"
                >
                  <span>Set Up Brand Profile</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setIsBannerDismissed(true)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded cursor-pointer transition-colors"
                  title="Dismiss banner"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Onboarding Wizard Modal */}
          {isOnboardingOpen && (
            <OnboardingWizard
              onClose={() => setIsOnboardingOpen(false)}
              onComplete={() => {
                fetchBackendData();
                setOnboardingCompleted(true);
                setIsOnboardingOpen(false);
              }}
            />
          )}

          <div className={currentTab === 'agent' ? 'block' : 'hidden'}>
            <AgentView
              apiKey={apiKey}
              brandProfile={brandProfile}
              prompts={prompts}
              metrics={metrics}
              onRefresh={fetchBackendData}
              onTriggerRun={handleTriggerRun}
              isLoading={isLoading}
              userId={user?.id}
            />
          </div>

          <div className={currentTab === 'overview' ? 'block' : 'hidden'}>
            {currentTab === 'overview' && (
              <OverviewView
                brandName={brandProfile.brand.name || 'My Brand'}
                overallSoV={metrics.overall_share_of_voice ?? 0}
                totalEvaluations={metrics.total_evaluations ?? 0}
                activePrompts={metrics.active_prompts_count ?? prompts.length ?? 0}
                flipsCount={metrics.flips_count ?? 0}
                engineRates={metrics.per_engine_rates || []}
                competitorRanking={metrics.competitor_ranking || []}
              />
            )}
          </div>

          <div className={currentTab === 'queries' ? 'block' : 'hidden'}>
            <QueriesView
              apiKey={apiKey}
              brandName={brandProfile.brand.name || 'My Brand'}
              prompts={prompts}
              onRefresh={fetchBackendData}
              onTriggerRun={handleTriggerRun}
              isLoading={isLoading}
              userId={user?.id}
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
              userId={user?.id}
            />
          </div>

          <div className={currentTab === 'user_settings' ? 'block' : 'hidden'}>
            <UserSettingsView
              user={user}
              brandName={brandProfile.brand.name}
              brandDomain={brandProfile.brand.domain}
              onSignOut={logout}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
