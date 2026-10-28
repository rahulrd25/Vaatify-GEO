'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Sidebar,
  type NavTab,
  AgentView,
  OverviewView,
  QueriesView,
  ExplorerView,
  DriftView,
  SettingsView,
  UserSettingsView,
} from '@/components/dashboard';
import OnboardingWizard from '@/components/onboarding/OnboardingWizard';
import { useAuth } from '@/context/AuthContext';
import { PromptItem, BrandProfile, RunItem, OverviewMetrics } from '@/types';
import { apiUrl } from '@/lib/api';
import { Loader2, Sparkles, ArrowRight, X } from 'lucide-react';

const VALID_TABS: NavTab[] = [
  'agent',
  'overview',
  'queries',
  'explorer',
  'drift',
  'settings',
  'user_settings',
];

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 text-[#FE4D03] animate-spin mb-3" />
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Loading your brand workspace...</p>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}

function DashboardContent() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();

  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.replace('/login');
    }
  }, [user, isAuthLoading, router]);

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 text-[#FE4D03] animate-spin mb-3" />
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Loading your brand workspace...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 text-[#FE4D03] animate-spin mb-3" />
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Redirecting to sign in...</p>
      </div>
    );
  }

  return <MainDashboard />;
}

function MainDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, sessionToken, onboardingCompleted, setOnboardingCompleted, logout } = useAuth();
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(!onboardingCompleted);
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);

  const [apiKey] = useState(
    process.env.NEXT_PUBLIC_GEO_API_KEY || ''
  );

  const initialTabParam = searchParams.get('tab') as NavTab | null;
  const [currentTab, setCurrentTabState] = useState<NavTab>(() => {
    if (initialTabParam && VALID_TABS.includes(initialTabParam)) {
      return initialTabParam;
    }
    return 'agent';
  });

  const setCurrentTab = useCallback((tab: NavTab) => {
    setCurrentTabState(tab);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tab);
      window.history.pushState({}, '', url.toString());
    }
  }, []);

  // Listen for browser back / forward navigation to switch active tab
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab') as NavTab | null;
      if (tab && VALID_TABS.includes(tab)) {
        setCurrentTabState(tab);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

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
      ...(apiKey ? { 'X-API-Key': apiKey } : {}),
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
        ...(apiKey ? { 'X-API-Key': apiKey } : {}),
        ...(sessionToken ? { 'Authorization': `Bearer ${sessionToken}` } : {}),
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
              headers: {
                ...(apiKey ? { 'X-API-Key': apiKey } : {}),
                ...(sessionToken ? { 'Authorization': `Bearer ${sessionToken}` } : {}),
              }
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex transition-colors">
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
            <div className="mb-6 p-4 bg-gradient-to-r from-orange-50 via-white to-orange-50/60 dark:from-orange-950/30 dark:via-slate-900 dark:to-orange-950/20 border border-orange-200 dark:border-orange-900/50 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-orange-100 dark:bg-orange-900/50 border border-orange-200 dark:border-orange-800 flex items-center justify-center shrink-0">
                  <Sparkles className="h-4.5 w-4.5 text-[#FE4D03]" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    Welcome! Set up your brand account to activate real-time AI citation tracking
                  </h3>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
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
              onSignOut={async () => {
                await logout();
                router.replace('/');
              }}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
