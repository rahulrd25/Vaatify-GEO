'use client';

import React, { useState, useEffect } from 'react';
import { CreditCard, Sparkles, ExternalLink, Loader2, AlertTriangle, CheckCircle2, Zap } from 'lucide-react';
import { fetchBillingStatus, createCheckoutSession, createCustomerPortalSession, BillingStatus } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

interface BillingCardProps {
  apiKey?: string;
  userId?: string;
}

export function BillingCard({ apiKey, userId }: BillingCardProps) {
  const { sessionToken } = useAuth();
  const [billing, setBilling] = useState<BillingStatus | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchStatus = async () => {
      try {
        const status = await fetchBillingStatus({ apiKey, sessionToken, userId });
        if (isMounted) {
          setBilling(status);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchStatus();
    return () => {
      isMounted = false;
    };
  }, [apiKey, sessionToken, userId]);

  const handleUpgrade = async (plan: 'starter' | 'pro') => {
    setLoadingAction(plan);
    setError(null);
    try {
      const url = await createCheckoutSession(plan, undefined, { apiKey, sessionToken, userId });
      window.location.href = url;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to start checkout.';
      setError(message);
      setLoadingAction(null);
    }
  };

  const handlePortal = async () => {
    setLoadingAction('portal');
    setError(null);
    try {
      const url = await createCustomerPortalSession({ apiKey, sessionToken, userId });
      window.location.href = url;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to open customer portal.';
      setError(message);
      setLoadingAction(null);
    }
  };

  if (!billing) return null;

  const isExpired = billing.plan === 'expired';
  const isTrial = billing.is_trial;
  const isPro = billing.plan === 'pro';
  const isStarter = billing.plan === 'starter';
  const isEnterprise = billing.plan === 'enterprise';

  const limitNumber = billing.prompt_limit ?? (isExpired ? 0 : isStarter ? 25 : isPro ? 150 : null);
  const quotaPercent = limitNumber && limitNumber > 0
    ? Math.min(100, Math.round((billing.prompt_count / limitNumber) * 100))
    : isExpired ? 100 : 0;

  const planDisplayName = isExpired
    ? 'Subscription Required'
    : isTrial
    ? '14-Day Free Pro Trial'
    : `${billing.plan.charAt(0).toUpperCase() + billing.plan.slice(1)} Plan`;

  return (
    <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
      {/* Top Header Row: Icon + Plan Title + Status + Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-orange-50 dark:bg-orange-950/40 text-[#FE4D03] flex items-center justify-center shrink-0">
            <CreditCard className="h-4.5 w-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 dark:text-white text-sm">
                {planDisplayName}
              </span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                isExpired
                  ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400'
                  : isTrial
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
              }`}>
                {isExpired ? 'Trial Expired' : isTrial ? 'Active Trial' : billing.status}
              </span>
              {billing.status === 'past_due' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400">
                  <AlertTriangle className="h-3 w-3" /> Past Due
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {isExpired
                ? 'Your free evaluation period has ended. Choose a plan to restore automated scans.'
                : isTrial
                ? 'Enjoy unrestricted access to all 4 AI search engines and Agent Copilot.'
                : 'Automated recurring subscription with continuous GEO monitoring.'}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          {!isPro && !isEnterprise && (
            <button
              type="button"
              onClick={() => handleUpgrade('pro')}
              disabled={loadingAction !== null}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FE4D03] hover:bg-[#e04402] text-white text-xs font-semibold transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
            >
              {loadingAction === 'pro' ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Upgrade to Pro ($149)</span>
                </>
              )}
            </button>
          )}

          {(isExpired || (!isStarter && !isPro && !isEnterprise)) && (
            <button
              type="button"
              onClick={() => handleUpgrade('starter')}
              disabled={loadingAction !== null}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
            >
              {loadingAction === 'starter' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Starter ($49)'}
            </button>
          )}

          <button
            type="button"
            onClick={handlePortal}
            disabled={loadingAction !== null}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
            title="Manage payment method, view invoices, or cancel via Stripe Customer Portal"
          >
            {loadingAction === 'portal' ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <>
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Invoices</span>
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-2 text-rose-600 dark:text-rose-400 text-xs flex items-center justify-between bg-rose-50 dark:bg-rose-950/40 p-2 rounded-md">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="cursor-pointer font-bold ml-2">✕</button>
        </div>
      )}

      {/* Bottom Row: 3 Neat Metric Pillars */}
      <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-3 gap-4 pt-0.5">
        {/* Pillar 1: Quota Progress */}
        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1">
            <span className="font-medium">Tracked Queries Quota</span>
            <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">
              {billing.prompt_count} / {limitNumber !== null ? limitNumber : '∞'}
            </span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1.5">
            <div
              className={`h-full transition-all rounded-full ${
                isExpired ? 'bg-rose-500' : quotaPercent >= 90 ? 'bg-amber-500' : 'bg-[#FE4D03]'
              }`}
              style={{ width: `${Math.max(4, quotaPercent)}%` }}
            />
          </div>
        </div>

        {/* Pillar 2: Renewal / Expiry Cadence */}
        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800/80 flex flex-col justify-center">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            {billing.trial_ends_at ? 'Trial Ends On' : billing.current_period_end ? 'Next Billing Date' : 'Billing Status'}
          </span>
          <span className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-0.5">
            {billing.trial_ends_at
              ? new Date(billing.trial_ends_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
              : billing.current_period_end
              ? new Date(billing.current_period_end).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
              : isExpired
              ? 'Suspended'
              : 'Continuous'}
          </span>
        </div>

        {/* Pillar 3: Engine Entitlements */}
        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800/80 flex flex-col justify-center">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mb-1">
            Included Capabilities
          </span>
          <div className="flex items-center gap-3 text-[11px] text-slate-700 dark:text-slate-300 font-medium">
            <span className="inline-flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0" /> All 4 AI Engines
            </span>
            <span className="inline-flex items-center gap-1">
              <Zap className="h-3 w-3 text-amber-500 shrink-0" /> Daily Evaluation
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BillingCard;
