'use client';

import React, { useState } from 'react';
import { BrandLogo } from '@/components/common/BrandLogo';
import { useAuth } from '@/context/AuthContext';
import { apiUrl } from '@/lib/api';
import {
  Globe,
  Building2,
  Users,
  Search,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  CheckCircle2,
  Loader2,
  X,
} from 'lucide-react';

interface CompetitorRow {
  name: string;
  domain: string;
}

export interface OnboardingWizardProps {
  onClose?: () => void;
  onComplete?: () => void;
}

export default function OnboardingWizard({ onClose, onComplete }: OnboardingWizardProps) {
  const { user, sessionToken, detectedBrand, setOnboardingCompleted, logout } = useAuth();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuggestingQueries, setIsSuggestingQueries] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Step 1: Brand Identity (pre-populated from work email if available)
  const [brandName, setBrandName] = useState(detectedBrand?.name || 'My Brand');
  const [brandDomain, setBrandDomain] = useState(detectedBrand?.domain || '');
  const [industry, setIndustry] = useState('B2B SaaS / Software');

  // Step 2: Competitors
  const [competitors, setCompetitors] = useState<CompetitorRow[]>([
    { name: '', domain: '' },
    { name: '', domain: '' },
  ]);

  // Step 3: Target Queries
  const [manualQueryInput, setManualQueryInput] = useState('');
  const [prompts, setPrompts] = useState<string[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);

  // Competitor row helpers
  const handleCompetitorChange = (index: number, field: 'name' | 'domain', value: string) => {
    const updated = [...competitors];
    updated[index][field] = value;
    setCompetitors(updated);
  };

  const handleAddCompetitor = () => {
    if (competitors.length < 5) {
      setCompetitors([...competitors, { name: '', domain: '' }]);
    }
  };

  const handleRemoveCompetitor = (index: number) => {
    setCompetitors(competitors.filter((_, i) => i !== index));
  };

  // Query helpers
  const handleAddManualQuery = () => {
    const trimmed = manualQueryInput.trim();
    if (trimmed && !prompts.includes(trimmed)) {
      setPrompts([...prompts, trimmed]);
      setManualQueryInput('');
    }
  };

  const handleRemoveQuery = (index: number) => {
    setPrompts(prompts.filter((_, i) => i !== index));
  };

  const handleAddSuggestedQuery = (queryText: string) => {
    if (!prompts.includes(queryText)) {
      setPrompts([...prompts, queryText]);
    }
  };

  // AI query suggestions trigger
  const handleFetchAiSuggestions = async () => {
    setIsSuggestingQueries(true);
    setErrorMsg('');
    try {
      const res = await fetch(apiUrl('/api/v1/onboarding/suggest-queries'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand_name: brandName,
          brand_domain: brandDomain,
          industry,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setAiSuggestions(data.suggested_queries || []);
      }
    } catch {
      setErrorMsg('Failed to fetch AI query suggestions. You can enter queries manually.');
    } finally {
      setIsSuggestingQueries(false);
    }
  };

  // Step 1 validation
  const handleNextStep1 = () => {
    if (!brandName.trim()) {
      setErrorMsg('Please enter your brand name.');
      return;
    }
    if (!brandDomain.trim() || !brandDomain.includes('.')) {
      setErrorMsg('Please enter a valid website domain (e.g. yourcompany.com).');
      return;
    }
    setErrorMsg('');
    setStep(2);
  };

  // Step 2 validation
  const handleNextStep2 = () => {
    setErrorMsg('');
    setStep(3);
  };

  // Final submission
  const handleCompleteOnboarding = async () => {
    if (prompts.length === 0) {
      setErrorMsg('Please add at least one target buyer query to track.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const payload = {
        user_id: user?.id,
        brand_name: brandName.trim(),
        brand_domain: brandDomain.trim().toLowerCase(),
        industry,
        competitors: competitors.filter((c) => c.name.trim() && c.domain.trim()),
        prompts: prompts,
      };

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (sessionToken) headers['Authorization'] = `Bearer ${sessionToken}`;
      if (user?.id) headers['X-User-Id'] = user.id;

      const res = await fetch(apiUrl('/api/v1/onboarding/complete'), {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setOnboardingCompleted(true);
        if (onComplete) onComplete();
        if (onClose) onClose();
      } else {
        setErrorMsg('Failed to complete onboarding. Please try again.');
      }
    } catch {
      setErrorMsg('Network error connecting to onboarding service.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isModal = Boolean(onClose);

  const innerContent = (
    <div className={`w-full max-w-2xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 ${isModal ? 'rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto' : 'p-6 sm:p-8 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800'}`}>
      {/* Top Header if Modal */}
      {isModal && (
        <div className="flex items-center justify-between px-6 py-3.5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <BrandLogo
              width={120}
              height={30}
              priority
              className="h-6 w-auto object-contain"
            />
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 border-l border-slate-300 dark:border-slate-700 pl-2">
              Brand Onboarding
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white font-medium cursor-pointer transition-colors"
            >
              Explore workspace first →
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <div className={isModal ? 'p-6 sm:p-7' : ''}>
        {/* Multi-step progress indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2 px-1">
            <span className={step >= 1 ? 'text-[#FE4D03] font-bold' : ''}>1. Brand & Domain</span>
            <span className={step >= 2 ? 'text-[#FE4D03] font-bold' : ''}>2. Competitors</span>
            <span className={step >= 3 ? 'text-[#FE4D03] font-bold' : ''}>3. Target Queries</span>
          </div>
          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-[#FE4D03] h-full transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-2.5 bg-red-50 border border-red-200 rounded text-xs text-red-700">
            {errorMsg}
          </div>
        )}

          {/* STEP 1: Brand & Domain */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-[#FE4D03]" />
                  <span>Set up your primary brand</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  We pre-filled your company details from your work email. You can customize them below.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Brand Name
                  </label>
                  <input
                    type="text"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    placeholder="e.g. Acme, Stripe, Linear"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:outline-hidden focus:ring-1 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Website Domain
                  </label>
                  <div className="relative rounded-md shadow-xs">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Globe className="h-3.5 w-3.5 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      value={brandDomain}
                      onChange={(e) => setBrandDomain(e.target.value)}
                      placeholder="e.g. company.com"
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded focus:outline-hidden focus:ring-1 focus:ring-orange-500"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Used to measure brand citation links across Perplexity, Claude, and Gemini.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Industry / Category
                  </label>
                  <select
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:outline-hidden focus:ring-1 focus:ring-orange-500 bg-white"
                  >
                    <option value="B2B SaaS / Software">B2B SaaS / Software</option>
                    <option value="AI / Machine Learning">AI & Machine Learning</option>
                    <option value="Fintech & Payments">Fintech & Payments</option>
                    <option value="Developer Tools / Cloud">Developer Tools / Cloud</option>
                    <option value="E-Commerce / Direct-to-Consumer">E-Commerce / D2C</option>
                    <option value="Agency / Professional Services">Agency / Consulting</option>
                    <option value="Healthcare & BioTech">Healthcare & BioTech</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={handleNextStep1}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#FE4D03] hover:bg-[#e04402] rounded cursor-pointer"
                >
                  <span>Next: Add Competitors</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Competitors */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Users className="h-4 w-4 text-[#FE4D03]" />
                  <span>Benchmark against competitors</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Add 2 to 4 competitor domains to benchmark your Share of Voice (SOV) and win citations from them.
                </p>
              </div>

              <div className="space-y-2.5 pt-2">
                {competitors.map((comp, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="w-1/2">
                      <input
                        type="text"
                        value={comp.name}
                        onChange={(e) => handleCompetitorChange(idx, 'name', e.target.value)}
                        placeholder={`Competitor #${idx + 1} Name`}
                        className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded focus:outline-hidden focus:ring-1 focus:ring-orange-500"
                      />
                    </div>
                    <div className="w-1/2">
                      <input
                        type="text"
                        value={comp.domain}
                        onChange={(e) => handleCompetitorChange(idx, 'domain', e.target.value)}
                        placeholder="domain.com"
                        className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded focus:outline-hidden focus:ring-1 focus:ring-orange-500"
                      />
                    </div>
                    {competitors.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveCompetitor(idx)}
                        className="p-1.5 text-slate-400 hover:text-red-500 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}

                {competitors.length < 5 && (
                  <button
                    type="button"
                    onClick={handleAddCompetitor}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#FE4D03] hover:text-[#d03e00] pt-1 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add another competitor</span>
                  </button>
                )}
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded cursor-pointer"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={handleNextStep2}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#FE4D03] hover:bg-[#e04402] rounded cursor-pointer"
                >
                  <span>Next: Target Queries</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Target Buyer Queries */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Search className="h-4 w-4 text-[#FE4D03]" />
                  <span>Target Buyer Search Queries</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Enter questions high-intent buyers ask AI engines when researching your product.
                </p>
              </div>

              {/* Manual Entry */}
              <div className="pt-1">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Manual Entry
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={manualQueryInput}
                    onChange={(e) => setManualQueryInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddManualQuery();
                      }
                    }}
                    placeholder="e.g. Best AI prototypes development agency in 2026"
                    className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded focus:outline-hidden focus:ring-1 focus:ring-orange-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddManualQuery}
                    className="px-3 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded border border-slate-200 cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* AI Copilot Suggestions Trigger */}
              <div className="p-3 bg-orange-50/60 border border-orange-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-[#FE4D03]" />
                    <span className="text-xs font-semibold text-slate-900">
                      AI Copilot Suggestions
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleFetchAiSuggestions}
                    disabled={isSuggestingQueries}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#FE4D03] hover:text-[#d03e00] bg-white px-2.5 py-1 border border-orange-200 rounded shadow-2xs cursor-pointer disabled:opacity-50"
                  >
                    {isSuggestingQueries ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3 w-3" />
                        <span>Suggest with AI</span>
                      </>
                    )}
                  </button>
                </div>

                {/* AI Suggestions Pill Grid */}
                {aiSuggestions.length > 0 && (
                  <div className="mt-2.5 space-y-1.5">
                    <p className="text-[11px] text-slate-500">
                      Click any query below to add to your tracking list:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {aiSuggestions.map((sq, i) => {
                        const isAdded = prompts.includes(sq);
                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => handleAddSuggestedQuery(sq)}
                            disabled={isAdded}
                            className={`text-left text-[11px] px-2.5 py-1 rounded border transition-colors flex items-center gap-1.5 ${
                              isAdded
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-800 opacity-60 cursor-default'
                                : 'bg-white border-slate-200 text-slate-700 hover:border-orange-300 hover:text-orange-900 cursor-pointer'
                            }`}
                          >
                            {isAdded ? (
                              <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0" />
                            ) : (
                              <Plus className="h-3 w-3 text-orange-500 shrink-0" />
                            )}
                            <span className="line-clamp-1">{sq}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Active Selected Prompts List */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Tracked Queries ({prompts.length})
                </label>
                {prompts.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2">
                    No queries added yet. Type a query above or click &quot;Suggest with AI&quot;.
                  </p>
                ) : (
                  <div className="space-y-1.5 max-h-44 overflow-y-auto">
                    {prompts.map((p, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between px-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs text-slate-800"
                      >
                        <span className="truncate pr-2">{p}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveQuery(idx)}
                          className="text-slate-400 hover:text-red-500 cursor-pointer shrink-0"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded cursor-pointer"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={handleCompleteOnboarding}
                  disabled={isSubmitting || prompts.length === 0}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-[#FE4D03] hover:bg-[#e04402] rounded cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Initializing Brand Engine...</span>
                    </>
                  ) : (
                    <>
                      <span>Complete & Launch AI Tracker</span>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
        {innerContent}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="flex items-center justify-between mb-4 px-1 text-xs">
          <button
            type="button"
            onClick={logout}
            className="text-slate-500 hover:text-slate-900 font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Sign Out / Back to Sign Up</span>
          </button>
          {user && (
            <span className="text-[11px] text-slate-400">
              Signed in as <strong className="text-slate-700 font-semibold">{user.email}</strong>
            </span>
          )}
        </div>

        <div className="flex justify-center mb-5">
          <BrandLogo
            width={160}
            height={40}
            priority
            className="h-9 w-auto object-contain"
          />
        </div>

        {innerContent}
      </div>
    </div>
  );
}
