'use client';

import { useState, useRef, useEffect, ReactNode, KeyboardEvent } from 'react';
import { 
  Sparkles, Send, Play, CheckCircle2, 
  Loader2, Database, Search, Users, Activity, CornerDownLeft,
  Edit2, Check, Plus, Trash2
} from 'lucide-react';
import { PromptItem, BrandProfile, OverviewMetrics, RunItem } from '@/types';
import { apiUrl } from '@/lib/api';

interface MetricChip {
  label: string;
  value: string | number;
  highlight?: boolean;
}

interface ProposalItem {
  id: string;
  type: 'prompt' | 'competitor' | 'evaluation';
  title: string;
  data: {
    prompt_text?: string;
    name?: string;
    domain?: string;
  };
  status: 'pending' | 'saving' | 'saved' | 'dismissed';
  isEditing?: boolean;
}

interface AgentMessage {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: string;
  chips?: MetricChip[];
  proposals?: ProposalItem[];
  toolCall?: {
    name: string;
    status: 'running' | 'completed' | 'failed';
    detail: string;
  };
}

interface AgentCopilotProps {
  apiKey: string;
  brandProfile: BrandProfile;
  prompts: PromptItem[];
  metrics: OverviewMetrics;
  onRefresh: () => void;
  onTriggerRun: () => Promise<void> | void;
  isLoading: boolean;
}

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function getCurrentTimeString(): string {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Simple Markdown Formatter
function FormattedText({ text }: { text: string }) {
  const lines = text.split('\n');

  return (
    <div className="space-y-2 text-sm leading-relaxed text-slate-800">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-0.5" />;

        // Markdown Headers
        if (trimmed.startsWith('### ')) {
          return (
            <h4 key={idx} className="text-xs font-bold uppercase tracking-wider text-slate-900 pt-1 pb-0.5">
              {renderInlineFormatting(trimmed.replace(/^###\s+/, ''))}
            </h4>
          );
        }
        if (trimmed.startsWith('## ') || trimmed.startsWith('# ')) {
          return (
            <h3 key={idx} className="text-sm font-bold text-slate-900 pt-1.5 pb-0.5">
              {renderInlineFormatting(trimmed.replace(/^#{1,2}\s+/, ''))}
            </h3>
          );
        }

        // Bullet point
        if (trimmed.startsWith('•') || trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          const content = trimmed.replace(/^[•\-\*]\s*/, '');
          return (
            <div key={idx} className="flex items-start gap-2 ml-1 text-slate-700">
              <span className="h-1.5 w-1.5 rounded-full bg-orange-600 mt-2 shrink-0" />
              <div>{renderInlineFormatting(content)}</div>
            </div>
          );
        }

        // Numbered list
        const numMatch = trimmed.match(/^(\d+)\.\s*(.*)$/);
        if (numMatch) {
          return (
            <div key={idx} className="flex items-start gap-2 ml-1 text-slate-700">
              <span className="font-semibold text-orange-600 shrink-0 font-mono text-xs mt-0.5">{numMatch[1]}.</span>
              <div>{renderInlineFormatting(numMatch[2])}</div>
            </div>
          );
        }

        return <p key={idx}>{renderInlineFormatting(trimmed)}</p>;
      })}
    </div>
  );
}

function renderInlineFormatting(str: string): ReactNode[] {
  const tokens = str.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g);

  return tokens.map((token, i) => {
    if (token.startsWith('**') && token.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-slate-900">
          {token.slice(2, -2)}
        </strong>
      );
    }
    if (token.startsWith('`') && token.endsWith('`')) {
      return (
        <code key={i} className="px-1.5 py-0.5 rounded bg-orange-50/70 text-orange-800 font-mono text-xs font-medium border border-orange-200/80">
          {token.slice(1, -1)}
        </code>
      );
    }
    if (token.startsWith('*') && token.endsWith('*')) {
      return <em key={i} className="italic text-slate-600">{token.slice(1, -1)}</em>;
    }
    return token;
  });
}

export default function AgentCopilot({
  apiKey,
  brandProfile,
  prompts,
  metrics,
  onRefresh,
  onTriggerRun,
}: AgentCopilotProps) {
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState<AgentMessage[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('geo_copilot_chat_history');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {
        // fallback
      }
    }
    return [];
  });

  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (messages.length > 0) {
      try {
        localStorage.setItem('geo_copilot_chat_history', JSON.stringify(messages));
      } catch {
        // ignore quota errors
      }
    }
  }, [messages]);

  const handleClearHistory = () => {
    setMessages([]);
    try {
      localStorage.removeItem('geo_copilot_chat_history');
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  const starterCards = [
    {
      icon: Search,
      title: 'Generate Target Queries',
      desc: 'Suggest 3 high-converting 14-day MVP buyer queries to review and save',
      prompt: 'Suggest 3 high-converting buyer intent queries for Vaatify',
    },
    {
      icon: Users,
      title: 'Competitor Benchmark',
      desc: 'See how DevSquad and Altar.io perform against Vaatify',
      prompt: 'Who are our top tracked competitors and what are their citation rates?',
    },
    {
      icon: Activity,
      title: 'Current Share of Voice',
      desc: 'Check brand citation rates across all AI search engines',
      prompt: 'What is our current Share of Voice across AI engines?',
    },
    {
      icon: Play,
      title: 'Run Search Evaluation',
      desc: 'Trigger live queries across Perplexity, Claude, Gemini, and ChatGPT',
      prompt: 'Run full search evaluation across all engines',
    },
  ];

  // Save a proposed query to Supabase after user confirmation
  const handleSaveProposal = async (msgId: string, proposalId: string) => {
    const msg = messages.find((m) => m.id === msgId);
    if (!msg || !msg.proposals) return;

    const prop = msg.proposals.find((p) => p.id === proposalId);
    if (!prop || prop.status === 'saved') return;

    // Update status to saving
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId
          ? {
              ...m,
              proposals: m.proposals?.map((p) =>
                p.id === proposalId ? { ...p, status: 'saving' } : p
              ),
            }
          : m
      )
    );

    try {
      if (prop.type === 'prompt' && prop.data.prompt_text) {
        const res = await fetch(apiUrl('/api/v1/prompts'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': apiKey,
          },
          body: JSON.stringify({
            prompt_text: prop.data.prompt_text.trim(),
            brand: brandProfile.brand.name || 'Vaatify',
          }),
        });

        if (res.ok) {
          const newP = await res.json();
          onRefresh();
          setMessages((prev) =>
            prev.map((m) =>
              m.id === msgId
                ? {
                    ...m,
                    proposals: m.proposals?.map((p) =>
                      p.id === proposalId
                        ? { ...p, status: 'saved', title: `Saved: "${prop.data.prompt_text}" (ID: ${newP.id})` }
                        : p
                    ),
                  }
                : m
            )
          );
        } else {
          throw new Error('Failed to save prompt');
        }
      } else if (prop.type === 'competitor' && prop.data.name && prop.data.domain) {
        const updatedComps = [
          ...brandProfile.competitors.filter((c) => c.name.toLowerCase() !== prop.data.name?.toLowerCase()),
          { name: prop.data.name.trim(), domain: prop.data.domain.trim() }
        ];

        const res = await fetch(apiUrl('/api/v1/profile'), {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': apiKey,
          },
          body: JSON.stringify({
            brand: brandProfile.brand,
            competitors: updatedComps,
          }),
        });

        if (res.ok) {
          onRefresh();
          setMessages((prev) =>
            prev.map((m) =>
              m.id === msgId
                ? {
                    ...m,
                    proposals: m.proposals?.map((p) =>
                      p.id === proposalId
                        ? { ...p, status: 'saved', title: `Saved: ${prop.data.name} (${prop.data.domain})` }
                        : p
                    ),
                  }
                : m
            )
          );
        }
      }
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId
            ? {
                ...m,
                proposals: m.proposals?.map((p) =>
                  p.id === proposalId ? { ...p, status: 'pending' } : p
                ),
              }
            : m
        )
      );
    }
  };

  // Save all proposals in a message batch
  const handleSaveAllProposals = async (msgId: string) => {
    const msg = messages.find((m) => m.id === msgId);
    if (!msg || !msg.proposals) return;

    for (const prop of msg.proposals) {
      if (prop.status === 'pending') {
        await handleSaveProposal(msgId, prop.id);
      }
    }
  };

  // Toggle edit state of a proposal
  const handleToggleEdit = (msgId: string, proposalId: string) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId
          ? {
              ...m,
              proposals: m.proposals?.map((p) =>
                p.id === proposalId ? { ...p, isEditing: !p.isEditing } : p
              ),
            }
          : m
      )
    );
  };

  // Update proposal text in state
  const handleUpdateProposalText = (msgId: string, proposalId: string, newText: string) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId
          ? {
              ...m,
              proposals: m.proposals?.map((p) =>
                p.id === proposalId
                  ? { ...p, data: { ...p.data, prompt_text: newText } }
                  : p
              ),
            }
          : m
      )
    );
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isProcessing) return;

    const userMsg: AgentMessage = {
      id: generateId('user'),
      sender: 'user',
      text: query,
      timestamp: getCurrentTimeString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsProcessing(true);

    const lower = query.toLowerCase().trim();

    // 1. Evaluation Pipeline Execution (Special Tool Call)
    if (lower.includes('run evaluation') || lower.includes('run pipeline') || lower.includes('run search evaluation') || lower.includes('run full')) {
      const agentMsgId = generateId('agent');
      setMessages((prev) => [
        ...prev,
        {
          id: agentMsgId,
          sender: 'agent',
          text: `Executing search evaluation across ChatGPT, Gemini, and Google AI Overviews for **${brandProfile.brand.name}**...`,
          timestamp: getCurrentTimeString(),
          toolCall: {
            name: 'execute_geo_pipeline',
            status: 'running',
            detail: `Evaluating target queries across live search engines...`,
          }
        }
      ]);

      try {
        await onTriggerRun();

        // Fetch fresh run counts and metrics
        let sov = metrics.overall_share_of_voice ?? 0;
        let recentCitationsCount = 0;
        let rawRuns: RunItem[] = [];
        let topCompetitorsList: [string, number][] = [];

        try {
          const [freshMetricsRes, freshRunsRes] = await Promise.all([
            fetch(apiUrl('/api/v1/metrics/overview'), { headers: { 'X-API-Key': apiKey } }),
            fetch(apiUrl('/api/v1/runs?limit=30'), { headers: { 'X-API-Key': apiKey } })
          ]);
          if (freshMetricsRes.ok) {
            const mData = await freshMetricsRes.json();
            sov = mData.overall_share_of_voice ?? sov;
          }
          if (freshRunsRes.ok) {
            rawRuns = await freshRunsRes.json();
            recentCitationsCount = rawRuns.filter((r) => r.brand_cited).length;

            const compMap: Record<string, number> = {};
            rawRuns.forEach((r) => {
              (r.competitors_cited || []).forEach((c) => {
                const name = typeof c === 'string' ? c : (c as { name?: string }).name;
                if (name) compMap[name] = (compMap[name] || 0) + 1;
              });
            });
            topCompetitorsList = Object.entries(compMap).sort((a, b) => b[1] - a[1]);
          }
        } catch {
          // fallback to local props
        }

        // Concise, human agentic assessment
        const topComp = topCompetitorsList[0]?.[0] || 'competitors';
        let finding = '';
        let nextStep = '';

        if (sov === 0) {
          finding = `None of the tested engines cited ${brandProfile.brand.name}. AI models are currently directing recommendations to incumbents like **${topComp}**.`;
          nextStep = `Add 2-3 comparison queries (e.g. "${brandProfile.brand.name} vs ${topComp}") to establish initial search visibility.`;
        } else if (sov < 35) {
          finding = `${brandProfile.brand.name} is cited on direct brand queries, but **${topComp}** leads on generic category searches like "best MVP agency".`;
          nextStep = `Add 2-3 high-intent buyer queries to win broader category search share.`;
        } else if (sov < 70) {
          finding = `Healthy visibility established across active engines. Your domain is consistently referenced in AI answer syntheses.`;
          nextStep = `Monitor drift in the Drift Alerts tab to protect high-converting positions.`;
        } else {
          finding = `Dominant market presence. ${brandProfile.brand.name} leads competitor citation frequency across tested engines.`;
          nextStep = `Expand query portfolio to adjacent service keywords.`;
        }

        const completionText = `Live search evaluation complete for **${brandProfile.brand.name}**.\n\n` +
          `**Finding**: ${finding}\n\n` +
          `**Recommendation**: ${nextStep}`;

        const metricChips: MetricChip[] = [
          { label: 'Share of Voice', value: `${sov.toFixed(1)}%`, highlight: true },
          { label: 'Brand Citations', value: `${recentCitationsCount}` },
          { label: 'Top Competitor', value: topCompetitorsList[0] ? topCompetitorsList[0][0] : 'None' },
        ];

        setMessages((prev) =>
          prev.map((m) =>
            m.id === agentMsgId
              ? {
                  ...m,
                  text: completionText,
                  chips: metricChips,
                  toolCall: {
                    name: 'execute_geo_pipeline',
                    status: 'completed',
                    detail: `Evaluation complete. Citation logs updated.`,
                  }
                }
              : m
          )
        );
      } catch {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === agentMsgId
              ? {
                  ...m,
                  text: `Could not complete evaluation. Please check backend connection.`,
                  toolCall: {
                    name: 'execute_geo_pipeline',
                    status: 'failed',
                    detail: 'Connection error during execution.',
                  },
                }
              : m
          )
        );
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    // 2. Call Backend AI Agent Copilot Endpoint (/api/v1/agent/chat)
    try {
      const historyPayload = messages.slice(-6).map((m) => ({
        sender: m.sender,
        text: m.text,
      }));

      const res = await fetch(apiUrl('/api/v1/agent/chat'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
        },
        body: JSON.stringify({
          message: query,
          history: historyPayload,
          active_prompts: (prompts || []).map((p) => p.prompt_text),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const formattedProposals: ProposalItem[] = (data.proposals || []).map((p: {
          id?: string;
          type: 'prompt' | 'competitor' | 'evaluation';
          title?: string;
          data?: { prompt_text?: string; name?: string; domain?: string };
        }) => ({
          id: p.id || generateId('prop'),
          type: p.type,
          title: p.title || p.data?.prompt_text || `${p.data?.name} (${p.data?.domain})`,
          data: p.data || {},
          status: 'pending' as const,
          isEditing: false,
        }));

        setMessages((prev) => [
          ...prev,
          {
            id: generateId('agent'),
            sender: 'agent',
            text: data.reply || 'I processed your request.',
            timestamp: getCurrentTimeString(),
            proposals: formattedProposals.length > 0 ? formattedProposals : undefined,
            chips: data.chips && data.chips.length > 0 ? data.chips : undefined,
          }
        ]);
      } else {
        throw new Error('API returned non-200');
      }
    } catch {
      // Graceful offline fallback
      setMessages((prev) => [
        ...prev,
        {
          id: generateId('agent'),
          sender: 'agent',
          text: `I'm tracking AI search visibility for **${brandProfile.brand.name}** (\`${brandProfile.brand.domain}\`).\n\nYou can ask me to suggest target buyer queries, track competitors, or check your current citation share.`,
          timestamp: getCurrentTimeString(),
        }
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[calc(100vh-10rem)] min-h-[520px] max-h-[750px] overflow-hidden">
      {/* Top Header Bar */}
      <div className="px-6 py-3.5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="h-6 w-6 rounded-md bg-orange-600 text-white flex items-center justify-center shadow-2xs">
            <Sparkles className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-xs font-semibold text-slate-900">AI Copilot</span>
        </div>

        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <button
              onClick={handleClearHistory}
              title="Clear chat history"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-800 text-xs font-medium transition-colors cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Message Stream Area */}
      <div className="flex-1 px-6 py-6 overflow-y-auto space-y-6 text-sm">
        {messages.length === 0 && (
          <div className="max-w-2xl mx-auto pt-6 pb-2 space-y-4">
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">How can I help with {brandProfile.brand.name}?</h3>
              <p className="text-xs text-slate-500">Select an action below or type your instruction.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
              {starterCards.map((card, idx) => {
                const IconComponent = card.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(card.prompt)}
                    disabled={isProcessing}
                    className="p-3.5 rounded-xl bg-slate-50 hover:bg-orange-50/40 border border-slate-200/80 hover:border-orange-200 text-left transition-all cursor-pointer group space-y-1"
                  >
                    <div className="flex items-center gap-2 font-semibold text-xs text-slate-900 group-hover:text-orange-700">
                      <IconComponent className="h-3.5 w-3.5 text-orange-600" />
                      <span>{card.title}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-1">{card.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            {msg.sender === 'user' ? (
              <div className="max-w-md bg-orange-600 text-white px-4 py-2.5 rounded-2xl rounded-tr-xs text-sm shadow-2xs leading-relaxed">
                {msg.text}
              </div>
            ) : (
              <div className="max-w-2xl w-full space-y-3">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-slate-800 space-y-3">
                  <FormattedText text={msg.text} />

                  {/* Interactive Action Proposal Cards (Human in the Loop Confirmation) */}
                  {msg.proposals && msg.proposals.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-slate-200/70">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                        <span>Proposed Items ({msg.proposals.length})</span>
                        {msg.proposals.some((p) => p.status === 'pending') && msg.proposals.length > 1 && (
                          <button
                            onClick={() => handleSaveAllProposals(msg.id)}
                            className="text-orange-700 hover:text-orange-800 font-semibold cursor-pointer flex items-center gap-1 text-xs"
                          >
                            <Plus className="h-3 w-3" />
                            <span>Save All</span>
                          </button>
                        )}
                      </div>

                      <div className="space-y-2">
                        {msg.proposals.map((prop) => (
                          <div
                            key={prop.id}
                            className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2"
                          >
                            {prop.isEditing ? (
                              <div className="space-y-2">
                                <input
                                  type="text"
                                  value={prop.data.prompt_text || prop.data.name || ''}
                                  onChange={(e) =>
                                    handleUpdateProposalText(msg.id, prop.id, e.target.value)
                                  }
                                  className="w-full px-3 py-1.5 rounded-md bg-slate-50 border border-orange-500 text-xs text-slate-900 focus:outline-none"
                                />
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => handleToggleEdit(msg.id, prop.id)}
                                    className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium cursor-pointer"
                                  >
                                    Done
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                                <div className="font-medium text-slate-900 flex-1">
                                  {prop.status === 'saved' ? (
                                    <span className="text-emerald-700 font-semibold flex items-center gap-1.5">
                                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                      {prop.title}
                                    </span>
                                  ) : (
                                    <span className="text-slate-800">
                                      {prop.data.prompt_text || `${prop.data.name} (${prop.data.domain})`}
                                    </span>
                                  )}
                                </div>

                                {prop.status !== 'saved' && (
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <button
                                      onClick={() => handleToggleEdit(msg.id, prop.id)}
                                      className="px-2.5 py-1 rounded border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-medium cursor-pointer flex items-center gap-1"
                                      title="Edit text"
                                    >
                                      <Edit2 className="h-3 w-3" />
                                      <span>Edit</span>
                                    </button>

                                    <button
                                      onClick={() => handleSaveProposal(msg.id, prop.id)}
                                      disabled={prop.status === 'saving'}
                                      className="px-3 py-1 rounded bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold cursor-pointer flex items-center gap-1 shadow-2xs disabled:opacity-50"
                                    >
                                      {prop.status === 'saving' ? (
                                        <>
                                          <Loader2 className="h-3 w-3 animate-spin" />
                                          <span>Saving...</span>
                                        </>
                                      ) : (
                                        <>
                                          <Check className="h-3 w-3" />
                                          <span>Save</span>
                                        </>
                                      )}
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Visual Metric Chips */}
                  {msg.chips && (
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200/60">
                      {msg.chips.map((c, i) => (
                        <div
                          key={i}
                          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium border ${
                            c.highlight
                              ? 'bg-orange-50 text-orange-800 border-orange-200'
                              : 'bg-white text-slate-700 border-slate-200'
                          }`}
                        >
                          <span className="text-slate-500 font-normal">{c.label}:</span>
                          <span className="font-semibold">{c.value}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Tool Execution Card */}
                  {msg.toolCall && (
                    <div className="p-3 rounded-xl bg-white border border-slate-200 text-left space-y-1 shadow-2xs mt-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono font-semibold text-slate-700 flex items-center gap-1.5">
                          <Database className="h-3.5 w-3.5 text-orange-600" />
                          {msg.toolCall.name}
                        </span>
                        {msg.toolCall.status === 'running' && (
                          <span className="flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Executing...
                          </span>
                        )}
                        {msg.toolCall.status === 'completed' && (
                          <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <CheckCircle2 className="h-3 w-3" />
                            Success
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-mono text-slate-500">{msg.toolCall.detail}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            <span className="text-[10px] text-slate-400 px-1 mt-1">{msg.timestamp}</span>
          </div>
        ))}

        {isProcessing && (
          <div className="flex items-center gap-2 text-xs text-slate-500 italic p-3 bg-slate-50 rounded-xl border border-slate-100 w-fit">
            <Loader2 className="h-4 w-4 animate-spin text-orange-600" />
            <span>Processing request...</span>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Spacious Floating Input Container (Fixed at Bottom) */}
      <div className="p-4 bg-white border-t border-slate-100 shrink-0">
        <div className="max-w-3xl mx-auto rounded-2xl border border-slate-200 bg-slate-50/50 p-2 focus-within:border-orange-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-orange-100 transition-all shadow-2xs">
          <textarea
            ref={textareaRef}
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Ask a question or enter an instruction (e.g. "Suggest 3 buyer queries", "Add competitor: DevSquad", "Run evaluation")...`}
            className="w-full px-3 py-1.5 bg-transparent border-0 text-slate-900 text-sm focus:outline-none resize-none placeholder:text-slate-400 leading-relaxed"
          />

          <div className="flex items-center justify-between px-2 pt-1.5 border-t border-slate-200/50 text-xs text-slate-400">
            <span className="flex items-center gap-1 text-[11px]">
              <CornerDownLeft className="h-3 w-3 text-slate-400" />
              <span>Press <strong className="font-semibold text-slate-600">Enter</strong> to send</span>
            </span>

            <button
              onClick={() => handleSendMessage()}
              disabled={!input.trim() || isProcessing}
              className="h-8 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-30 cursor-pointer"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Send</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
