import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { 
  ArrowRight, 
  CheckCircle2, 
  TrendingUp, 
  ShieldCheck, 
  Cpu, 
  Bell, 
  Sparkles,
  AlertTriangle,
  Search,
  ExternalLink
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { buttonVariants } from '@/components/ui/button';
import { 
  Accordion, 
  AccordionItem, 
  AccordionTrigger, 
  AccordionContent 
} from '@/components/ui/accordion';

export const metadata: Metadata = {
  title: 'Track Brand Visibility Across AI Search Engines | Vaatify GEO',
  description:
    'Vaatify GEO continuously monitors generative search engines to identify where your brand is cited, track competitor mentions, and notify you when rankings change.',
  alternates: {
    canonical: 'https://vaatify.com',
  },
  openGraph: {
    title: 'Track Brand Visibility Across AI Search Engines | Vaatify GEO',
    description:
      'Continuous multi-engine evaluation and citation intelligence for modern brands across OpenAI, Perplexity, Google Gemini, and Claude.',
    url: 'https://vaatify.com',
  },
  twitter: {
    title: 'Track Brand Visibility Across AI Search Engines | Vaatify GEO',
    description:
      'Continuous multi-engine evaluation and citation intelligence for modern brands across OpenAI, Perplexity, Google Gemini, and Claude.',
  },
};

const AI_ENGINES = [
  {
    name: 'OpenAI (ChatGPT)',
    logo: '/logos/openai.svg',
    alt: 'OpenAI (ChatGPT) Logo',
  },
  {
    name: 'Perplexity',
    logo: '/logos/perplexity.svg',
    alt: 'Perplexity Logo',
  },
  {
    name: 'Google Gemini',
    logo: '/logos/gemini.svg',
    alt: 'Google Gemini Logo',
  },
  {
    name: 'Anthropic Claude',
    logo: '/logos/claude.svg',
    alt: 'Anthropic Claude Logo',
  },
];

export default async function MarketingHomePage() {
  let user = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    user = null;
  }

  return (
    <div className="flex flex-col gap-20 pt-6 sm:pt-8 md:pt-10 pb-16 bg-white text-slate-900">
      {/* =====================================================================
          1. HERO SECTION (SPLIT: CLEAN READABLE TEXT & MOVING CHAIN ANIMATION)
         ===================================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 sm:pt-4 md:pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-start">
          {/* Left Column: Spacious, Uncluttered Copy */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            <h1 className="text-4xl sm:text-5xl lg:text-[2.85rem] xl:text-[3.25rem] font-extrabold tracking-tight text-slate-950 leading-[1.14]">
              Track your{' '}
              <span className="text-[#FE4D03]">
                brand visibility
              </span>{' '}
              across AI search engines
            </h1>

            <p className="mt-5 text-base sm:text-lg text-slate-600 leading-relaxed font-normal max-w-xl font-sans tracking-normal">
              Vaatify GEO continuously monitors generative search engines to identify where your brand is cited, track competitor mentions, and notify you when rankings change.
            </p>

            <div className="mt-12 sm:mt-14 lg:mt-16 flex flex-col sm:flex-row items-center gap-3.5 w-full sm:w-auto">
              {user ? (
                <Link
                  href="/dashboard"
                  className={buttonVariants({ variant: 'default', className: 'w-full sm:w-auto px-6 py-2.5 h-11 text-sm font-semibold' })}
                >
                  <span>Go to Workspace</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <>
                  <Link
                    href="/signup?redirect=/dashboard"
                    className={buttonVariants({ variant: 'default', className: 'w-full sm:w-auto px-6 py-2.5 h-11 text-sm font-semibold' })}
                  >
                    <span>Register My Brand</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/login"
                    className={buttonVariants({ variant: 'outline', className: 'w-full sm:w-auto px-6 py-2.5 h-11 text-sm font-semibold' })}
                  >
                    Sign In to Workspace
                  </Link>
                </>
              )}
            </div>

            <div className="mt-6 sm:mt-7 flex flex-wrap items-center gap-4 text-xs text-slate-500 font-medium">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Daily automated search audits</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Live verification across 4 top AI engines</span>
              </div>
            </div>
          </div>

          {/* Right Column: Moving Chain Theme Animation (Borderless, Cardless) */}
          <div className="lg:col-span-5 relative w-full flex flex-col items-center justify-start pt-1 sm:pt-1.5">
            {/* Ambient Background Aura */}
            <div className="absolute inset-0 bg-gradient-to-tr from-[#FE4D03]/10 via-amber-500/5 to-transparent blur-2xl pointer-events-none rounded-3xl" />

            {/* The Connected Theme Flow */}
            <div className="relative z-10 w-full flex flex-col items-center">
              {/* Chain Node 1: Target Brand / Prompt Input */}
              <div className="animate-float-soft flex items-center justify-between gap-3 px-4 py-2.5 rounded-full bg-white/95 border border-slate-200/90 shadow-[0_4px_16px_-4px_rgba(15,23,42,0.08)] backdrop-blur-md w-full max-w-sm">
                <div className="flex items-center gap-2.5">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <span className="text-xs font-bold text-slate-900 font-mono">yourbrand.com</span>
                </div>
                <span className="text-[10px] font-mono font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200/80">
                  Prompt: &quot;Top GEO Tools&quot;
                </span>
              </div>

              {/* Moving Chain Connector 1 */}
              <div className="flex flex-col items-center my-1 relative">
                <div className="w-0.5 h-9 bg-slate-200 relative overflow-hidden rounded-full">
                  <div className="animate-vertical-beam" />
                </div>
                <span className="text-[9px] font-mono font-semibold uppercase tracking-widest text-slate-400 my-0.5">
                  dispatching queries
                </span>
                <div className="w-0.5 h-3 bg-slate-200 relative overflow-hidden rounded-full">
                  <div className="animate-vertical-beam" style={{ animationDelay: '0.3s' }} />
                </div>
              </div>

              {/* Chain Node 2: Multi-Engine AI Cluster */}
              <div className="relative w-full max-w-md flex flex-col items-center">
                {/* Soft Animated Radar Ripple in Background */}
                <div className="absolute inset-0 -m-3 rounded-3xl bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-transparent blur-xl pointer-events-none animate-pulse-radar" />

                {/* Cluster Header Pill */}
                <div className="relative z-10 mb-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 border border-slate-200/90 shadow-2xs backdrop-blur-sm">
                  <Cpu className="h-3.5 w-3.5 text-[#FE4D03]" />
                  <span className="text-[11px] font-bold text-slate-800 tracking-tight">
                    Live Generative Search Synthesis
                  </span>
                  <span className="flex h-1.5 w-1.5 rounded-full bg-[#FE4D03] animate-pulse ml-0.5" />
                </div>

                {/* 4 Connected Engine Pills */}
                <div className="relative z-10 grid grid-cols-2 gap-2.5 w-full max-w-sm">
                  {AI_ENGINES.map((engine, idx) => (
                    <div
                      key={`hero-engine-${idx}`}
                      className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/95 border border-slate-200/90 shadow-[0_2px_10px_-2px_rgba(15,23,42,0.06)] hover:border-slate-300 transition-all backdrop-blur-sm"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={engine.logo}
                          alt={engine.alt}
                          className="w-4 h-4 shrink-0 object-contain"
                          loading="eager"
                        />
                        <span className="text-xs font-semibold text-slate-800 truncate">
                          {engine.name.split(' ')[0]}
                        </span>
                      </div>
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Moving Chain Connector 2 */}
              <div className="flex flex-col items-center my-1 relative">
                <div className="w-0.5 h-9 bg-slate-200 relative overflow-hidden rounded-full">
                  <div className="animate-vertical-beam" style={{ animationDelay: '0.6s' }} />
                </div>
                <span className="text-[9px] font-mono font-semibold uppercase tracking-widest text-[#FE4D03] my-0.5">
                  verified citations
                </span>
                <div className="w-0.5 h-3 bg-slate-200 relative overflow-hidden rounded-full">
                  <div className="animate-vertical-beam" style={{ animationDelay: '0.9s' }} />
                </div>
              </div>

              {/* Chain Node 3: Deterministic Citation & Ranking Result */}
              <div className="animate-float-soft flex flex-col gap-2 p-3.5 rounded-2xl bg-white/95 border border-emerald-200/90 shadow-[0_8px_24px_-6px_rgba(16,185,129,0.18)] backdrop-blur-md w-full max-w-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/80">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Rank #1 Recommended</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-slate-500">
                    100% Deterministic
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-600 pt-1 border-t border-slate-100">
                  <span className="font-mono text-slate-900 font-medium truncate">
                    yourbrand.com/platform
                  </span>
                  <span className="text-emerald-700 font-bold shrink-0 ml-2">
                    +34% Share of Voice
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          2. SOCIAL PROOF / DATA SOURCES BAR (Seamless Floating Moving Ribbon)
         ===================================================================== */}
      <section className="w-full relative overflow-hidden mt-6 md:mt-10 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-6">
          <p className="font-subheading text-xs sm:text-sm font-medium text-slate-500">
            Integrated with &amp; monitoring leading AI platforms
          </p>
        </div>

        {/* Marquee Track with Edge Gradient Masks */}
        <div className="relative w-full overflow-hidden">
          {/* Left & Right gradient fade masks (fading from page white) */}
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-16 sm:w-32 z-10 bg-gradient-to-r from-white to-transparent" />
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-16 sm:w-32 z-10 bg-gradient-to-l from-white to-transparent" />

          <div className="flex w-max animate-marquee py-1">
            {/* Set 1 */}
            <div className="flex shrink-0 items-center gap-8 pr-8">
              {[...AI_ENGINES, ...AI_ENGINES].map((engine, idx) => (
                <div
                  key={`engine-set1-${idx}`}
                  className="flex items-center gap-3.5 px-6 py-3.5 rounded-2xl border border-slate-200/90 bg-white text-slate-900 text-sm font-semibold whitespace-nowrap shadow-[0_2px_8px_-2px_rgba(15,23,42,0.06)] hover:border-slate-300 hover:shadow-md transition-all cursor-default"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={engine.logo}
                    alt={engine.alt}
                    className="w-6 h-6 shrink-0 object-contain"
                    loading="eager"
                  />
                  <span className="tracking-tight">{engine.name}</span>
                </div>
              ))}
            </div>

            {/* Set 2 (Identical duplicate for seamless infinite loop) */}
            <div className="flex shrink-0 items-center gap-8 pr-8" aria-hidden="true">
              {[...AI_ENGINES, ...AI_ENGINES].map((engine, idx) => (
                <div
                  key={`engine-set2-${idx}`}
                  className="flex items-center gap-3.5 px-6 py-3.5 rounded-2xl border border-slate-200/90 bg-white text-slate-900 text-sm font-semibold whitespace-nowrap shadow-[0_2px_8px_-2px_rgba(15,23,42,0.06)] hover:border-slate-300 hover:shadow-md transition-all cursor-default"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={engine.logo}
                    alt={engine.alt}
                    className="w-6 h-6 shrink-0 object-contain"
                    loading="eager"
                  />
                  <span className="tracking-tight">{engine.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          3. SECTION 1: THE PROBLEM (AGITATION)
         ===================================================================== */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="p-8 sm:p-12 rounded-xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white shadow-xs">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium font-mono mb-5">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
            <span>The Search Paradigm Shift</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight leading-tight">
            Traditional SEO is no longer enough.
          </h2>

          <p className="mt-6 text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
            Buyers are bypassing traditional search results and asking AI agents directly. If your brand is not cited in the AI overview, you are invisible to the next generation of search traffic. Vaatify GEO gives you the deterministic data you need to optimize for Answer Engines.
          </p>

          <div className="mt-8 pt-8 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
            <div className="space-y-1">
              <p className="text-2xl font-black text-slate-900 tracking-tight">60%+</p>
              <p className="text-xs text-slate-500 font-medium">Zero-click generative answers bypassing traditional blue links</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-black text-[#FE4D03] tracking-tight">4.2x</p>
              <p className="text-xs text-slate-500 font-medium">Higher conversion rate when recommended directly in AI answers</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-black text-slate-900 tracking-tight">100%</p>
              <p className="text-xs text-slate-500 font-medium">Deterministic verification across ChatGPT, Perplexity, Gemini &amp; Claude</p>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          4. SECTION 2: CORE FEATURES (ALTERNATING LAYOUT)
         ===================================================================== */}
      <section id="features" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col gap-24 scroll-mt-20">
        {/* Feature Block 1: Citation Mapping (Left Text / Right Visual) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 border border-slate-200 text-slate-800 text-[11px] font-medium font-mono mb-3">
              <Search className="h-3.5 w-3.5 text-[#FE4D03]" />
              <span>Feature 01 &middot; Citation Mapping</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Know exactly where your brand ranks in AI overviews.
            </h2>
            <p className="mt-4 text-sm text-slate-600 leading-relaxed">
              Stop guessing what AI models think about your company. Vaatify runs real-time queries across GPT-4o, Claude, Gemini, and Perplexity to capture exactly how and when your brand is recommended. We extract live citations and source links so you can measure actual visibility.
            </p>
            <div className="mt-6 flex flex-col gap-2.5 text-xs text-slate-700">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#FE4D03]"></span>
                <span>Real-time queries across GPT-4o, Claude 3.5, Gemini &amp; Perplexity</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#FE4D03]"></span>
                <span>Live citation anchor extraction and exact recommendation ranking</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#FE4D03]"></span>
                <span>Deterministic source link tracking to quantify true visibility share</span>
              </div>
            </div>
          </div>

          {/* Visual Element 1: Multi-Engine Citation Mention Dashboard */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 text-xs">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="font-semibold text-slate-900">Live Citation Mentions Over Time</span>
              </div>
              <span className="text-[11px] font-mono text-slate-500">4 Active Engines</span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/80">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-slate-500">ChatGPT (GPT-4o)</span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/60 px-1.5 py-0.5 rounded">Rank #1</span>
                </div>
                <p className="text-xl font-bold text-slate-950 mt-1">88.4%</p>
                <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-[#FE4D03] h-full rounded-full" style={{ width: '88.4%' }}></div>
                </div>
              </div>

              <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/80">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-slate-500">Perplexity Sonar</span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/60 px-1.5 py-0.5 rounded">Rank #1</span>
                </div>
                <p className="text-xl font-bold text-slate-950 mt-1">92.1%</p>
                <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-[#FE4D03] h-full rounded-full" style={{ width: '92.1%' }}></div>
                </div>
              </div>

              <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/80">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-slate-500">Claude 3.5</span>
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-100/60 px-1.5 py-0.5 rounded">Rank #2</span>
                </div>
                <p className="text-xl font-bold text-slate-950 mt-1">81.5%</p>
                <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-slate-700 h-full rounded-full" style={{ width: '81.5%' }}></div>
                </div>
              </div>

              <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/80">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-slate-500">Google Gemini</span>
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-100/60 px-1.5 py-0.5 rounded">Rank #2</span>
                </div>
                <p className="text-xl font-bold text-slate-950 mt-1">74.0%</p>
                <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-slate-700 h-full rounded-full" style={{ width: '74.0%' }}></div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span className="truncate">Sample Query: &quot;Top GEO intelligence tools&quot;</span>
              <span className="text-emerald-600 font-semibold shrink-0 ml-2">Verified Citation</span>
            </div>
          </div>
        </div>

        {/* Feature Block 2: Competitor Matrix (Right Text / Left Visual) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Visual Element 2: Competitor Comparison Matrix Table */}
          <div className="order-2 lg:order-1 rounded-xl border border-slate-200 bg-white p-5 shadow-xs overflow-x-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 text-xs">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-[#FE4D03]" />
                <span className="font-semibold text-slate-900">Competitor Share of Voice &amp; Sentiment</span>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">Category: SaaS</span>
            </div>

            <table className="w-full text-left mt-3 text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-500 uppercase">
                  <th className="py-2 pr-3">Brand</th>
                  <th className="py-2 px-3">Share of Voice</th>
                  <th className="py-2 px-3">Sentiment</th>
                  <th className="py-2 pl-3">Win Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="bg-orange-50/40 font-semibold text-slate-900">
                  <td className="py-2.5 pr-3 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-[#FE4D03]"></span>
                    <span>Your Brand</span>
                  </td>
                  <td className="py-2.5 px-3 font-bold text-[#FE4D03]">58.4%</td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      94% Positive
                    </span>
                  </td>
                  <td className="py-2.5 pl-3 font-bold text-emerald-600">78%</td>
                </tr>
                <tr className="text-slate-700">
                  <td className="py-2.5 pr-3">Competitor Alpha</td>
                  <td className="py-2.5 px-3">24.2%</td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px]">
                      74% Mixed
                    </span>
                  </td>
                  <td className="py-2.5 pl-3">32%</td>
                </tr>
                <tr className="text-slate-700">
                  <td className="py-2.5 pr-3">Competitor Beta</td>
                  <td className="py-2.5 px-3">12.6%</td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px]">
                      62% Neutral
                    </span>
                  </td>
                  <td className="py-2.5 pl-3">18%</td>
                </tr>
                <tr className="text-slate-700">
                  <td className="py-2.5 pr-3">Competitor Gamma</td>
                  <td className="py-2.5 px-3">4.8%</td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px]">
                      50% Neutral
                    </span>
                  </td>
                  <td className="py-2.5 pl-3">6%</td>
                </tr>
              </tbody>
            </table>

            <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
              <span>Sentiment polarity derived from synthesized AI answer bodies</span>
              <span className="text-[#FE4D03] font-medium">+14.2% MoM</span>
            </div>
          </div>

          {/* Text Content */}
          <div className="order-1 lg:order-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 border border-slate-200 text-slate-800 text-[11px] font-medium font-mono mb-3">
              <TrendingUp className="h-3.5 w-3.5 text-[#FE4D03]" />
              <span>Feature 02 &middot; Competitor Matrix</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
              See who is capturing your industry&apos;s citations.
            </h2>
            <p className="mt-4 text-sm text-slate-600 leading-relaxed">
              AI search is a zero-sum game. Our engine analyzes Share of Voice (SoV) and sentiment to show you exactly which competitors are being recommended instead of you. Identify the specific queries where you are losing ground and reverse-engineer their citation sources.
            </p>
            <div className="mt-6 flex flex-col gap-2.5 text-xs text-slate-700">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#FE4D03]"></span>
                <span>Quantitative Share of Voice (SoV) across commercial intent prompts</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#FE4D03]"></span>
                <span>Sentiment analysis highlighting how warmly each model endorses rivals</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#FE4D03]"></span>
                <span>Reverse-engineer competitor citation sources to win recommendations back</span>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Block 3: Automated Audits & Alerts (Left Text / Right Visual) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 border border-slate-200 text-slate-800 text-[11px] font-medium font-mono mb-3">
              <Bell className="h-3.5 w-3.5 text-[#FE4D03]" />
              <span>Feature 03 &middot; Automated Audits &amp; Alerts</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Catch ranking drops before they impact revenue.
            </h2>
            <p className="mt-4 text-sm text-slate-600 leading-relaxed">
              Search models update continuously. Vaatify’s global scheduler runs daily and weekly automated brand visibility audits. Get notified instantly when a competitor displaces your brand in a critical AI overview, complete with actionable data on how the response changed.
            </p>
            <div className="mt-6 flex flex-col gap-2.5 text-xs text-slate-700">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#FE4D03]"></span>
                <span>Automated continuous background scheduler across all prompt groups</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#FE4D03]"></span>
                <span>Instant notifications when a competitor displaces your brand citation</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#FE4D03]"></span>
                <span>Synthesized response diffs showing exactly how the answer evolved</span>
              </div>
            </div>
          </div>

          {/* Visual Element 3: Clean Alert / Notification Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 text-xs">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded bg-amber-50 text-amber-700 border border-amber-200">
                  <Bell className="h-3.5 w-3.5" />
                </div>
                <span className="font-semibold text-slate-900">Citation Displacement Alert &middot; Perplexity Sonar</span>
              </div>
              <span className="text-[10px] font-mono text-slate-500">Today, 09:14 AM</span>
            </div>

            <div className="mt-4 space-y-3">
              <div className="p-3 rounded-lg border border-slate-100 bg-slate-50 text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Monitored Query</span>
                <p className="font-semibold text-slate-900 mt-0.5">&quot;Best generative engine optimization tool for B2B brands&quot;</p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg border border-slate-100 bg-white space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Previous Scan</span>
                  <p className="font-bold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Your Brand (Rank #1)</span>
                  </p>
                  <p className="text-[11px] text-slate-500">2 Verified Citations Cited</p>
                </div>

                <div className="p-3 rounded-lg border border-amber-200 bg-amber-50/40 space-y-1">
                  <span className="text-[10px] font-bold text-amber-700 uppercase">Current Scan</span>
                  <p className="font-bold text-amber-800 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3 text-amber-600" />
                    <span>Displaced to Rank #2</span>
                  </p>
                  <p className="text-[11px] text-slate-600">Competitor Alpha cited at #1</p>
                </div>
              </div>

              <div className="p-2.5 rounded bg-slate-50 border border-slate-100 flex items-center justify-between text-[11px]">
                <span className="text-slate-600">Copilot Recommendation: Add Schema-marked comparison table</span>
                <span className="text-[#FE4D03] font-semibold cursor-pointer hover:underline flex items-center gap-1">
                  <span>View Diff</span>
                  <ExternalLink className="h-3 w-3" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* =====================================================================
          6. SECTION 3: THE TECHNICAL EDGE
         ===================================================================== */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="p-8 sm:p-12 md:p-14 rounded-2xl border border-slate-800 bg-slate-950 text-white relative overflow-hidden flex flex-col items-center text-center">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#FE4D03]/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-medium font-mono mb-4 border border-white/15">
            <Cpu className="h-3.5 w-3.5 text-[#FE4D03]" />
            <span>Deterministic Architecture</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight max-w-2xl">
            Built for real verification, not estimated rankings.
          </h2>

          <p className="mt-5 text-base sm:text-lg text-slate-300 leading-relaxed font-subheading max-w-2xl">
            Many tools guess how brands rank using simulated queries. Vaatify GEO runs live searches directly across ChatGPT, Perplexity, Claude, Gemini, and Google AI Overviews, capturing the exact answers and citations your buyers see.
          </p>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-3xl text-left">
            <div className="p-4 sm:p-5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3.5">
              <ShieldCheck className="h-5 w-5 text-[#FE4D03] shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-white">Live Search Coverage</h3>
                <p className="text-xs text-slate-400 mt-1 font-subheading">
                  Monitors live API queries and browser-rendered AI answers together, giving you complete visibility across all top AI engines.
                </p>
              </div>
            </div>

            <div className="p-4 sm:p-5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3.5">
              <Sparkles className="h-5 w-5 text-[#FE4D03] shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-white">Direct Citation Links</h3>
                <p className="text-xs text-slate-400 mt-1 font-subheading">
                  Extracts the actual cited URLs, brand mentions, and source links straight from the result. No guesswork or synthetic scores.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          6. SECTION 4: PRICING (THE HYBRID MODEL)
         ===================================================================== */}
      <section id="pricing" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full scroll-mt-20">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-950">
            Predictable pricing for proactive marketing teams.
          </h2>
          <p className="text-sm text-slate-600 mt-3">
            Choose the tier that matches your brand footprint, from self-serve founder tracking to full enterprise engineering implementation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto items-stretch">
          {/* Tier 1: Starter */}
          <div className="p-6 rounded-xl border border-slate-200 bg-white flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base text-slate-900">Starter</h3>
                <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Self-Serve</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Single users &amp; founders</p>

              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-slate-900">$49</span>
                <span className="text-xs text-slate-500">/ month</span>
              </div>

              <ul className="mt-6 space-y-3 text-xs text-slate-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Track up to 5 brand keywords</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Weekly visibility audits</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Data from ChatGPT &amp; Perplexity</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Standard support</span>
                </li>
              </ul>
            </div>

            <Link
              href="/signup?plan=starter"
              className="mt-8 block text-center text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 py-2.5 rounded-md transition-colors"
            >
              Start Free Trial
            </Link>
          </div>

          {/* Tier 2: Growth (Most Popular) */}
          <div className="p-6 rounded-xl border-2 border-[#FE4D03] bg-white flex flex-col justify-between relative shadow-md">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-[#FE4D03] text-white text-[10px] font-bold uppercase tracking-wider shadow-xs">
              Most Popular
            </span>

            <div>
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base text-slate-900">Growth</h3>
                <span className="text-[10px] font-semibold text-[#FE4D03] uppercase tracking-wider">Automated</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Marketing teams &amp; agencies</p>

              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-slate-900">$149</span>
                <span className="text-xs text-slate-500">/ month</span>
              </div>

              <ul className="mt-6 space-y-3 text-xs text-slate-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#FE4D03] shrink-0" />
                  <span className="font-medium text-slate-800">Track up to 25 keywords</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#FE4D03] shrink-0" />
                  <span className="font-medium text-slate-800">Full Competitor Matrix &amp; Share of Voice</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#FE4D03] shrink-0" />
                  <span>Daily visibility audits</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#FE4D03] shrink-0" />
                  <span>Data from ChatGPT, Perplexity, Gemini, Claude</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#FE4D03] shrink-0" />
                  <span>Exportable reporting</span>
                </li>
              </ul>
            </div>

            <Link
              href="/signup?plan=growth"
              className="mt-8 block text-center text-xs font-semibold text-white bg-[#FE4D03] hover:bg-[#e04402] py-2.5 rounded-md transition-colors"
            >
              Start Free Trial
            </Link>
          </div>

          {/* Tier 3: Enterprise / Done-For-You */}
          <div className="p-6 rounded-xl border border-slate-200 bg-white flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base text-slate-900">Enterprise</h3>
                <span className="text-[10px] font-semibold text-slate-700 uppercase tracking-wider">Done-For-You</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Companies needing custom implementation</p>

              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-2xl font-extrabold text-slate-900">Custom Pricing</span>
              </div>

              <ul className="mt-6 space-y-3 text-xs text-slate-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-slate-900 shrink-0" />
                  <span className="font-semibold text-slate-900">Unlimited keyword tracking</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-slate-900 shrink-0" />
                  <span>Custom API integrations to your CRM</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-slate-900 shrink-0" />
                  <span>Dedicated Account Manager</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-slate-900 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-slate-900 font-semibold">Full Workflow Setup:</strong> Our engineering team configures, integrates, and manages your GEO tracking architecture.
                  </span>
                </li>
              </ul>
            </div>

            <a
              href="mailto:hello@vaatify.com?subject=Enterprise%20Inquiry%20-%20Vaatify%20GEO"
              className="mt-8 block text-center text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 py-2.5 rounded-md transition-colors"
            >
              Contact Sales
            </a>
          </div>
        </div>
      </section>

      {/* =====================================================================
          7. SECTION 5: FAQ (ACCORDION)
         ===================================================================== */}
      <section id="faq" className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 w-full scroll-mt-20">
        <div className="text-center mb-10">
          <h2 className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-slate-400">Frequently Asked Questions</h2>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">Everything You Need to Know</p>
        </div>

        <Accordion type="single" collapsible defaultValue="faq-1" className="w-full">
          {/* FAQ 1 */}
          <AccordionItem value="faq-1">
            <AccordionTrigger>How is Vaatify GEO different from standard SEO tools?</AccordionTrigger>
            <AccordionContent>
              Standard SEO tools track blue links on Google. Vaatify tracks the generative AI responses that sit above the traditional search results, analyzing how language models synthesize and recommend your brand.
            </AccordionContent>
          </AccordionItem>

          {/* FAQ 2 */}
          <AccordionItem value="faq-2">
            <AccordionTrigger>Do you use APIs to guess the responses?</AccordionTrigger>
            <AccordionContent>
              No. We run live searches directly across commercial AI models and browser-rendered overviews, capturing the exact citations and rankings your buyers see in real time.
            </AccordionContent>
          </AccordionItem>

          {/* FAQ 3 */}
          <AccordionItem value="faq-3">
            <AccordionTrigger>Can you help us build custom AI workflows beyond just tracking?</AccordionTrigger>
            <AccordionContent>
              Yes. Through our Enterprise tier, our internal engineering team can build custom AI features, RAG systems, and workflow automations specific to your business needs.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      {/* =====================================================================
          8. FOOTER CTA
         ===================================================================== */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 w-full text-center">
        <div className="p-8 sm:p-10 md:p-12 rounded-2xl border border-slate-200 bg-gradient-to-b from-white via-slate-50/60 to-slate-50 shadow-xs flex flex-col items-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-950">
            Stop losing traffic to AI search engines.
          </h2>

          <p className="text-sm sm:text-base text-slate-600 max-w-xl mt-3 leading-relaxed font-sans">
            Start tracking your Generative Engine Optimization metrics today.
          </p>

          {user ? (
            <Link
              href="/dashboard"
              className={buttonVariants({ variant: 'default', className: 'mt-6' })}
            >
              <span>Go to Workspace</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <Link
              href="/signup?redirect=/dashboard"
              className={buttonVariants({ variant: 'default', className: 'mt-6' })}
            >
              <span>Register My Brand</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
