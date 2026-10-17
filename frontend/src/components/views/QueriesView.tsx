import { useState } from 'react';
import { Loader2, Plus, Play } from 'lucide-react';
import { PromptItem } from '@/types';
import { apiUrl } from '@/lib/api';


interface QueriesViewProps {
  apiKey: string;
  brandName: string;
  prompts: PromptItem[];
  onRefresh: () => void;
  onTriggerRun: () => void;
  isLoading: boolean;
}

export default function QueriesView({
  apiKey,
  brandName,
  prompts,
  onRefresh,
  onTriggerRun,
  isLoading,
}: QueriesViewProps) {
  const [newPromptText, setNewPromptText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittingTemplate, setSubmittingTemplate] = useState<string | null>(null);
  const [deactivatingId, setDeactivatingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 1-Click Suggestions
  const suggestions = [
    `Best AI MVP development agencies that build full-stack prototypes in 14 days`,
    `Top development partners for integrating RAG and LLM agents into startup MVPs`,
    `How to build and launch an AI-powered SaaS MVP under 2 weeks for founders`,
    `${brandName || 'Vaatify'} vs DevSquad for building generative AI web applications`,
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
      const res = await fetch(apiUrl('/api/v1/prompts'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
        },
        body: JSON.stringify({
          prompt_text: text.trim(),
          brand: brandName || 'Vaatify',
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
      const res = await fetch(apiUrl(`/api/v1/prompts/${id}`), {
        method: 'DELETE',
        headers: {
          'X-API-Key': apiKey,
        },
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Target Buyer Queries ({prompts.length} Tracked)
            </h2>
            <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
              Active Monitoring
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
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
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">
          Add Target Search Query
        </h3>
        <p className="text-xs text-slate-500 mb-3">
          Type custom buyer questions or click a preset template below:
        </p>

        {errorMsg && (
          <div className="mb-3 px-3 py-2 bg-rose-50 border border-rose-200 rounded text-xs text-rose-700 font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={(e) => { e.preventDefault(); handleAddPrompt(); }} className="flex flex-col sm:flex-row gap-2 mb-3">
          <input
            type="text"
            value={newPromptText}
            onChange={(e) => setNewPromptText(e.target.value)}
            placeholder="e.g. Best AI MVP engineering partners for B2B SaaS startups"
            className="flex-1 px-3 py-2 rounded bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-orange-500 focus:bg-white transition-colors"
          />
          <button
            type="submit"
            disabled={isSubmitting || !!submittingTemplate}
            className="flex items-center justify-center gap-1.5 px-4 py-2 rounded bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer shrink-0"
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
        <div className="pt-3 border-t border-slate-200">
          <div className="text-[11px] font-semibold text-slate-600 mb-2">Quick-Add Templates:</div>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((s, idx) => {
              const isAddingThis = submittingTemplate === s;
              return (
                <button
                  key={idx}
                  type="button"
                  disabled={isSubmitting || !!submittingTemplate}
                  onClick={() => handleAddPrompt(s)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 hover:bg-orange-50 hover:border-orange-200 hover:text-orange-800 text-slate-700 text-[11px] transition-colors border border-slate-200 text-left cursor-pointer disabled:opacity-50"
                >
                  {isAddingThis ? (
                    <Loader2 className="h-3 w-3 animate-spin text-orange-600 shrink-0" />
                  ) : (
                    <span className="text-slate-400 font-bold leading-none">+</span>
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
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Configured Search Queries
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Tested against: <span className="font-medium text-slate-700">Perplexity, Claude, Gemini, ChatGPT</span>
            </p>
          </div>

          <div className="w-full sm:w-64">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search queries..."
              className="w-full px-3 py-1.5 rounded bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-orange-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded border border-slate-200">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 uppercase tracking-wider font-semibold text-[11px]">
                <th className="py-2.5 px-3 w-12 text-center">#</th>
                <th className="py-2.5 px-3">Target Buyer Query</th>
                <th className="py-2.5 px-3">Brand Target</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-800">
              {filteredPrompts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500 text-xs">
                    {prompts.length === 0
                      ? 'No queries added yet. Click one of the quick templates above to begin.'
                      : 'No queries match your search filter.'}
                  </td>
                </tr>
              ) : (
                filteredPrompts.map((p, idx) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-slate-400 font-semibold text-center text-[11px]" title={`ID: ${p.id}`}>
                      #{idx + 1}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-900">{p.prompt_text}</td>
                    <td className="py-2.5 px-3 text-slate-600">{p.brand}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Active
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => handleDeletePrompt(p.id)}
                        disabled={deactivatingId === p.id}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-[11px] font-medium transition-colors cursor-pointer disabled:opacity-60"
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

