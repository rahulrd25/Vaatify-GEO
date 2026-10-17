'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Building2,
  Users,
  Plus,
  Trash2,
  Check,
  Loader2,
  Clock,
  Play,
  Calendar,
  ShieldCheck,
  Globe
} from 'lucide-react';
import { BrandProfile, MonitoringSchedule } from '@/types';
import { apiUrl } from '@/lib/api';

interface SettingsViewProps {
  apiKey: string;
  brandProfile: BrandProfile;
  setBrandProfile: (profile: BrandProfile) => void;
  onRefresh: () => void;
}

export default function SettingsView({
  apiKey,
  brandProfile,
  setBrandProfile,
  onRefresh,
}: SettingsViewProps) {
  const [newCompName, setNewCompName] = useState('');
  const [newCompDomain, setNewCompDomain] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Schedule state
  const [schedule, setSchedule] = useState<MonitoringSchedule | null>(null);
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);
  const [isTriggering, setIsTriggering] = useState(false);
  const [scheduleMsg, setScheduleMsg] = useState<string | null>(null);

  const fetchSchedule = useCallback(async () => {
    try {
      const res = await fetch(apiUrl('/api/v1/schedule'), {
        headers: { 'X-API-Key': apiKey },
      });
      if (res.ok) {
        const data = await res.json();
        setSchedule(data);
      }
    } catch (err) {
      console.error('Failed to fetch monitoring schedule:', err);
    }
  }, [apiKey]);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      if (isMounted) {
        await fetchSchedule();
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [fetchSchedule]);

  const handleUpdateSchedule = async (newFrequency: 'daily' | 'weekly' | 'off') => {
    if (!schedule) return;
    setIsSavingSchedule(true);
    setScheduleMsg(null);
    try {
      const payload = {
        frequency: newFrequency,
        day_of_week: schedule.day_of_week,
        hour_utc: schedule.hour_utc,
        minute_utc: schedule.minute_utc,
        is_active: newFrequency !== 'off',
      };
      const res = await fetch(apiUrl('/api/v1/schedule'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
        },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const updated = await res.json();
        setSchedule(updated);
        setScheduleMsg(`Schedule set to ${newFrequency === 'off' ? 'Manual Only' : newFrequency.toUpperCase()}`);
        setTimeout(() => setScheduleMsg(null), 3000);
      }
    } catch (err) {
      console.error('Failed to update schedule:', err);
    } finally {
      setIsSavingSchedule(false);
    }
  };

  const handleTriggerNow = async () => {
    setIsTriggering(true);
    setScheduleMsg(null);
    try {
      const res = await fetch(apiUrl('/api/v1/schedule/trigger'), {
        method: 'POST',
        headers: { 'X-API-Key': apiKey },
      });
      if (res.ok) {
        setScheduleMsg('Audit dispatched in background worker.');
        setTimeout(() => {
          fetchSchedule();
          onRefresh();
          setScheduleMsg(null);
        }, 3000);
      }
    } catch (err) {
      console.error('Failed to trigger scheduled run:', err);
    } finally {
      setIsTriggering(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMsg(null);

    try {
      const res = await fetch(apiUrl('/api/v1/profile'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
        },
        body: JSON.stringify(brandProfile),
      });

      if (res.ok) {
        setSuccessMsg('Brand settings saved.');
        onRefresh();
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    } catch (err) {
      console.error('Failed to save profile:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddCompetitor = () => {
    if (!newCompName.trim() || !newCompDomain.trim()) return;
    setBrandProfile({
      ...brandProfile,
      competitors: [
        ...brandProfile.competitors,
        { name: newCompName.trim(), domain: newCompDomain.trim() },
      ],
    });
    setNewCompName('');
    setNewCompDomain('');
  };

  const handleRemoveCompetitor = (index: number) => {
    setBrandProfile({
      ...brandProfile,
      competitors: brandProfile.competitors.filter((_, idx) => idx !== index),
    });
  };

  return (
    <div className="space-y-4 max-w-6xl">
      {/* Compact Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Building2 className="h-4 w-4 text-orange-600" />
            Brand Profile & Competitor Matrix
          </h2>
          <p className="text-[11px] text-slate-500">
            Manage target domains and automated background evaluation schedules.
          </p>
        </div>
        {(successMsg || scheduleMsg) && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-700 font-medium self-start">
            <Check className="h-3.5 w-3.5" />
            <span>{successMsg || scheduleMsg}</span>
          </div>
        )}
      </div>

      {/* 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Column (5 Cols): Primary Brand & Schedule Cadence */}
        <div className="lg:col-span-5 space-y-4">
          {/* Primary Brand Identity Card */}
          <div className="card-white rounded-lg p-4 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5 text-orange-600" />
                Primary Brand
              </h3>
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Target Domain</span>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Brand Name
                </label>
                <input
                  type="text"
                  value={brandProfile.brand.name}
                  onChange={(e) =>
                    setBrandProfile({
                      ...brandProfile,
                      brand: { ...brandProfile.brand, name: e.target.value },
                    })
                  }
                  className="w-full px-2.5 py-1.5 rounded bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-orange-500 focus:bg-white font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Website Domain
                </label>
                <input
                  type="text"
                  value={brandProfile.brand.domain}
                  onChange={(e) =>
                    setBrandProfile({
                      ...brandProfile,
                      brand: { ...brandProfile.brand, domain: e.target.value },
                    })
                  }
                  placeholder="e.g. vaatify.com"
                  className="w-full px-2.5 py-1.5 rounded bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-orange-500 focus:bg-white font-mono"
                />
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Brand Identity</span>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Automated Monitoring Schedule Card */}
          <div className="card-white rounded-lg p-4 shadow-xs">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-emerald-600" />
                Audit Cadence & Timing
              </h3>
              {schedule && (
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  schedule.frequency === 'off'
                    ? 'bg-slate-100 text-slate-600'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}>
                  {schedule.frequency === 'off' ? 'Manual Only' : `${schedule.frequency} Active`}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mb-3">
              Select when background evaluations automatically run on AI engines.
            </p>

            {/* Cadence Option Cards with Explicit Timings */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              {/* Weekly */}
              <button
                type="button"
                disabled={isSavingSchedule}
                onClick={() => handleUpdateSchedule('weekly')}
                className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                  schedule?.frequency === 'weekly'
                    ? 'border-emerald-500 bg-emerald-50/50 ring-1 ring-emerald-500/20 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="text-xs font-bold text-slate-900">Weekly</div>
                <div className="text-[10px] text-slate-500 font-medium mt-0.5">Mon @ 9 AM UTC</div>
              </button>

              {/* Daily */}
              <button
                type="button"
                disabled={isSavingSchedule}
                onClick={() => handleUpdateSchedule('daily')}
                className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                  schedule?.frequency === 'daily'
                    ? 'border-emerald-500 bg-emerald-50/50 ring-1 ring-emerald-500/20 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="text-xs font-bold text-slate-900">Daily</div>
                <div className="text-[10px] text-slate-500 font-medium mt-0.5">Daily @ 9 AM UTC</div>
              </button>

              {/* Manual */}
              <button
                type="button"
                disabled={isSavingSchedule}
                onClick={() => handleUpdateSchedule('off')}
                className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                  schedule?.frequency === 'off'
                    ? 'border-slate-400 bg-slate-100 ring-1 ring-slate-400/20 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="text-xs font-bold text-slate-900">Manual</div>
                <div className="text-[10px] text-slate-500 font-medium mt-0.5">On-demand</div>
              </button>
            </div>

            {/* Schedule Status & Timing Details */}
            <div className="space-y-2 p-2.5 bg-slate-50 border border-slate-200 rounded-md">
              <div className="text-[11px] text-slate-700 font-medium flex items-start gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-slate-500 mt-0.5 shrink-0" />
                <div>
                  {schedule?.frequency === 'weekly' && (
                    <span><strong>Active Schedule:</strong> Every Monday at 09:00 UTC</span>
                  )}
                  {schedule?.frequency === 'daily' && (
                    <span><strong>Active Schedule:</strong> Every day at 09:00 UTC</span>
                  )}
                  {schedule?.frequency === 'off' && (
                    <span className="text-slate-500 italic">Automated audits disabled (manual trigger only)</span>
                  )}
                  {schedule?.frequency !== 'off' && schedule?.next_run_at && (
                    <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                      Next run: {new Date(schedule.next_run_at).toUTCString()}
                    </div>
                  )}
                </div>
              </div>

              {schedule?.last_run_at && (
                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1.5 border-t border-slate-200">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3 text-emerald-600" />
                    Last audit: {new Date(schedule.last_run_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="text-emerald-700 font-semibold uppercase">
                    {schedule.last_run_status || 'Success'}
                  </span>
                </div>
              )}

              <button
                type="button"
                onClick={handleTriggerNow}
                disabled={isTriggering}
                className="w-full mt-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isTriggering ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Auditing...</span>
                  </>
                ) : (
                  <>
                    <Play className="h-3 w-3 fill-current" />
                    <span>Run Audit Now</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </div>

        {/* Right Column (7 Cols): Competitor Matrix */}
        <div className="lg:col-span-7">
          <div className="card-white rounded-lg p-4 shadow-xs flex flex-col h-full">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-slate-700" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Benchmark Competitors
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                {brandProfile.competitors.length} tracked
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mb-3">
              AI engines evaluated against these competitor domains when generating answers.
            </p>

            {/* Quick Add Inline Form */}
            <div className="flex items-center gap-2 mb-3 p-2 bg-slate-50 border border-slate-200 rounded-md">
              <input
                type="text"
                value={newCompName}
                onChange={(e) => setNewCompName(e.target.value)}
                placeholder="Name (e.g. Peec)"
                className="w-1/2 px-2.5 py-1.5 rounded bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-orange-500"
              />
              <input
                type="text"
                value={newCompDomain}
                onChange={(e) => setNewCompDomain(e.target.value)}
                placeholder="Domain (e.g. peec.ai)"
                className="w-1/2 px-2.5 py-1.5 rounded bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-orange-500 font-mono"
              />
              <button
                type="button"
                onClick={handleAddCompetitor}
                className="flex items-center justify-center gap-1 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold cursor-pointer shrink-0"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add</span>
              </button>
            </div>

            {/* Competitors List */}
            <div className="overflow-y-auto max-h-[320px] rounded border border-slate-200 divide-y divide-slate-100">
              {brandProfile.competitors.length === 0 ? (
                <div className="py-6 text-center text-slate-500 text-xs">
                  No competitors added yet. Use the form above to benchmark competitors.
                </div>
              ) : (
                brandProfile.competitors.map((comp, idx) => (
                  <div key={idx} className="flex items-center justify-between px-3 py-2 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="h-6 w-6 rounded bg-slate-100 text-slate-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                        {comp.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-semibold text-slate-900 truncate">{comp.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono truncate">{comp.domain}</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveCompetitor(idx)}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                      title="Remove competitor"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Save Competitors Footer */}
            <div className="flex items-center justify-between pt-3 mt-auto border-t border-slate-100">
              <span className="text-[11px] text-slate-500">
                Remember to save after adding or removing competitors.
              </span>
              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Matrix</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
