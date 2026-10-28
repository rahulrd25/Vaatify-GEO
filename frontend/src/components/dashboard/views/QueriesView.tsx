import { useState } from 'react';
import { Loader2, Plus, Play } from 'lucide-react';
import { PromptItem } from '@/types';
import { apiUrl } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';


interface QueriesViewProps {
  apiKey: string;
  brandName: string;
  prompts: PromptItem[];
  onRefresh: () => void;
  onTriggerRun: () => void;
  isLoading: boolean;
  userId?: string;
}

export default function QueriesView({
  apiKey,
  brandName,
  prompts,
  onRefresh,
  onTriggerRun,
  isLoading,
  userId,
}: QueriesViewProps) {
  const { sessionToken } = useAuth();
  const [newPromptText, setNewPromptText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittingTemplate, setSubmittingTemplate] = useState<string | null>(null);
  const [deactivatingId, setDeactivatingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 1-Click Suggestions
  const suggestions = [
    `Best CRM and pipeline automation software for B2B sales teams in 2026`,
    `Top customer success and onboarding platforms for SaaS companies`,
    `How to choose between ${brandName || 'Acme'} and competitors for enterprise workflows`,
    `${brandName || 'Acme'} vs HubSpot for lead generation and pipeline intelligence`,
  ];

  const handleAddPrompt = async (textToAdd?: string) => {
    const text = textToAdd || newPromptText;
    if (!text.trim()) {
      setErrorMsg('Please enter a target search query.');
      return;
    }

    if (textToAdd) {
      setSubmittingTemplate(textToAdd);
    } else {
      setIsSubmitting(true);
    }
    setErrorMsg(null);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(apiKey ? { 'X-API-Key': apiKey } : {}),
      };
      if (sessionToken) headers['Authorization'] = `Bearer ${sessionToken}`;
      if (userId) headers['X-User-Id'] = userId;

      const res = await fetch(apiUrl(`/api/v1/prompts${userId ? `?user_id=${encodeURIComponent(userId)}` : ''}`), {
        method: 'POST',
        headers,
        body: JSON.stringify({
          prompt_text: text.trim(),
          brand: brandName || 'My Brand',
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || 'Failed to add query.');
      }

      setNewPromptText('');
      await onRefresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setErrorMsg(message);
    } finally {
      setIsSubmitting(false);
      setSubmittingTemplate(null);
    }
  };

  const handleDeletePrompt = async (id: string) => {
    setDeactivatingId(id);
    try {
      const headers: Record<string, string> = {
        ...(apiKey ? { 'X-API-Key': apiKey } : {}),
      };
      if (sessionToken) headers['Authorization'] = `Bearer ${sessionToken}`;
      if (userId) headers['X-User-Id'] = userId;

      const res = await fetch(apiUrl(`/api/v1/prompts/${id}${userId ? `?user_id=${encodeURIComponent(userId)}` : ''}`), {
        method: 'DELETE',
        headers,
      });

      if (res.ok) {
        await onRefresh();
      }
    } catch (err) {
      console.error('Failed to deactivate prompt:', err);
    } finally {
      setDeactivatingId(null);
    }
  };

  const filteredPrompts = prompts.filter(
    (p) =>
      p.prompt_text.toLowerCase().includes(search.toLowerCase()) ||
      p.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* 1. Header & Action Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
              Target Buyer Queries ({prompts.length} Tracked)
            </h2>
            <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
              Active Monitoring
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            These queries are automatically executed across AI engines to test whether {brandName} is recommended and cited.
          </p>
        </div>

        <button
          onClick={onTriggerRun}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50 cursor-pointer shrink-0"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Running Evaluations...</span>
            </>
          ) : (
            <>
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>Run All Engine Evaluations</span>
            </>
          )}
        </button>
      </div>

      {/* 2. Add Query Form with 1-Click Suggestions */}
      <div className="card-white rounded-lg p-5 shadow-xs">
        <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-1">
          Add Target Search Query
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
          Type custom buyer questions or click a preset template below:
        </p>

        {errorMsg && (
          <div className="mb-3 px-3 py-2 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded text-xs text-rose-700 dark:text-rose-400 font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={(e) => { e.preventDefault(); handleAddPrompt(); }} className="flex flex-col sm:flex-row gap-2 mb-3">
          <input
            type="text"
            value={newPromptText}
            onChange={(e) => setNewPromptText(e.target.value)}
            placeholder="e.g. Best AI MVP engineering partners for B2B SaaS startups"
            className="flex-1 px-3 py-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-orange-500 focus:bg-white dark:focus:bg-slate-900 transition-colors"
          />
          <button
            type="submit"
            disabled={isSubmitting || !!submittingTemplate}
            className="flex items-center justify-center gap-1.5 px-4 py-2 rounded bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer shrink-0"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Adding...</span>
              </>
            ) : (
              <>
                <Plus className="h-3.5 w-3.5" />
                <span>Add Query</span>
              </>
            )}
          </button>
        </form>

        {/* 1-Click Suggestions */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
          <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-2">Quick-Add Templates:</div>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((s, idx) => {
              const isAddingThis = submittingTemplate === s;
              return (
                <button
                  key={idx}
                  type="button"
                  disabled={isSubmitting || !!submittingTemplate}
                  onClick={() => handleAddPrompt(s)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-orange-50 dark:hover:bg-orange-950/40 hover:border-orange-200 dark:hover:border-orange-800/60 hover:text-orange-800 dark:hover:text-orange-300 text-slate-700 dark:text-slate-300 text-[11px] transition-colors border border-slate-200 dark:border-slate-700 text-left cursor-pointer disabled:opacity-50"
                >
                  {isAddingThis ? (
                    <Loader2 className="h-3 w-3 animate-spin text-orange-600 shrink-0" />
                  ) : (
                    <span className="text-slate-400 dark:text-slate-500 font-bold leading-none">+</span>
                  )}
                  <span>{s}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Tracked Queries List */}
      <div className="card-white rounded-lg p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Configured Search Queries
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Tested against: <span className="font-medium text-slate-700 dark:text-slate-300">Perplexity, Claude, Gemini, ChatGPT</span>
            </p>
          </div>

          <div className="w-full sm:w-64">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search queries..."
              className="w-full px-3 py-1.5 rounded bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-orange-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider font-semibold text-[11px]">
                <th className="py-2.5 px-3 w-12 text-center">#</th>
                <th className="py-2.5 px-3">Target Buyer Query</th>
                <th className="py-2.5 px-3">Brand Target</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
              {filteredPrompts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500 dark:text-slate-400 text-xs">
                    {prompts.length === 0
                      ? 'No queries added yet. Click one of the quick templates above to begin.'
                      : 'No queries match your search filter.'}
                  </td>
                </tr>
              ) : (
                filteredPrompts.map((p, idx) => (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-slate-400 dark:text-slate-500 font-semibold text-center text-[11px]" title={`ID: ${p.id}`}>
                      #{idx + 1}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-white">{p.prompt_text}</td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">{p.brand}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                        Active
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => handleDeletePrompt(p.id)}
                        disabled={deactivatingId === p.id}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-900/50 text-[11px] font-medium transition-colors cursor-pointer disabled:opacity-60"
                      >
                        {deactivatingId === p.id ? (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin text-rose-600" />
                            <span>Deactivating...</span>
                          </>
                        ) : (
                          <span>Deactivate</span>
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

