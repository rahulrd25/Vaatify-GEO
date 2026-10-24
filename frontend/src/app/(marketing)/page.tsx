import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { 
  ArrowRight, 
  Globe, 
  BarChart3, 
  CalendarCheck, 
  CheckCircle2, 
  Building,
  Target,
  Briefcase
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { buttonVariants } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Track Brand Visibility Across AI Search Engines',
  description:
    'Vaatify GEO continuously monitors generative search engines to identify where your brand is cited, track competitor mentions, and notify you when rankings change.',
  alternates: {
    canonical: 'https://geo.vaatify.com',
  },
  openGraph: {
    title: 'Track Brand Visibility Across AI Search Engines | Vaatify GEO',
    description:
      'Continuous multi-engine evaluation and citation intelligence for modern brands across OpenAI, Perplexity, Google Gemini, and Claude.',
    url: 'https://geo.vaatify.com',
  },
  twitter: {
    title: 'Track Brand Visibility Across AI Search Engines | Vaatify GEO',
    description:
      'Continuous multi-engine evaluation and citation intelligence for modern brands across OpenAI, Perplexity, Google Gemini, and Claude.',
  },
};

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
    <div className="flex flex-col gap-20 py-12 md:py-16 bg-white text-slate-900">
      {/* 1. Hero Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-800 text-xs font-semibold mb-6">
          <span>Vaatify GEO &middot; Generative Engine Optimization</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-950 leading-[1.15]">
          Track your brand visibility across AI search engines
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed">
          Vaatify GEO continuously monitors generative search engines to identify where your brand is cited, track competitor mentions, and notify you when rankings change.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          {user ? (
            <Link
              href="/dashboard"
              className={buttonVariants({ variant: 'default', className: 'w-full sm:w-auto' })}
            >
              <span>Go to Dashboard</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <>
              <Link
                href="/signup?redirect=/dashboard"
                className={buttonVariants({ variant: 'default', className: 'w-full sm:w-auto' })}
              >
                <span>Create Account &amp; Start Onboarding</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className={buttonVariants({ variant: 'outline', className: 'w-full sm:w-auto' })}
              >
                Sign In to Workspace
              </Link>
            </>
          )}
        </div>
      </section>

      {/* 2. Social Proof / Engine Logos Strip */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="pt-8 pb-10 border-y border-slate-200 flex flex-col items-center">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-6 text-center">
            Analyzes data from:
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 w-full max-w-4xl">
            {/* OpenAI */}
            <div className="flex items-center justify-center gap-2.5 p-3 rounded-md border border-slate-200 bg-slate-50">
              <svg className="w-4 h-4 text-slate-800" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.28 9.37a5.99 5.99 0 0 0-.52-4.88 6.06 6.06 0 0 0-4.4-3.05 6.07 6.07 0 0 0-5.32 1.35 6.02 6.02 0 0 0-4.08.38 6.06 6.06 0 0 0-3.3 3.9A6.04 6.04 0 0 0 2 11.23a6.04 6.04 0 0 0 .52 4.88 6.06 6.06 0 0 0 4.4 3.05 6.05 6.05 0 0 0 5.32-1.35 6.02 6.02 0 0 0 4.08-.38 6.06 6.06 0 0 0 3.3-3.9 6.04 6.04 0 0 0 2.66-4.16ZM12 13.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Z" />
              </svg>
              <span className="text-xs font-semibold text-slate-800 tracking-tight">OpenAI</span>
            </div>

            {/* Perplexity */}
            <div className="flex items-center justify-center gap-2.5 p-3 rounded-md border border-slate-200 bg-slate-50">
              <svg className="w-4 h-4 text-slate-800" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2a1 1 0 0 1 1 1v6.586l4.293-4.293a1 1 0 1 1 1.414 1.414L14.414 11H21a1 1 0 1 1 0 2h-6.586l4.293 4.293a1 1 0 0 1-1.414 1.414L13 14.414V21a1 1 0 1 1-2 0v-6.586l-4.293 4.293a1 1 0 0 1-1.414-1.414L9.586 13H3a1 1 0 1 1 0-2h6.586L5.293 6.707a1 1 0 0 1 1.414-1.414L11 9.586V3a1 1 0 0 1 1-1Z" />
              </svg>
              <span className="text-xs font-semibold text-slate-800 tracking-tight">Perplexity</span>
            </div>

            {/* Google Gemini */}
            <div className="flex items-center justify-center gap-2.5 p-3 rounded-md border border-slate-200 bg-slate-50">
              <svg className="w-4 h-4 text-slate-800" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C12 7.52 7.52 12 2 12c5.52 0 10 4.48 10 10 0-5.52 4.48-10 10-10-5.52 0-10-4.48-10-10Z" />
              </svg>
              <span className="text-xs font-semibold text-slate-800 tracking-tight">Google Gemini</span>
            </div>

            {/* Claude */}
            <div className="flex items-center justify-center gap-2.5 p-3 rounded-md border border-slate-200 bg-slate-50">
              <svg className="w-4 h-4 text-slate-800" viewBox="0 0 24 24" fill="currentColor">
                <path d="M4.5 9.5a1 1 0 0 1 1-1h13a1 1 0 1 1 0 2h-13a1 1 0 0 1-1-1Zm2 5a1 1 0 0 1 1-1h9a1 1 0 1 1 0 2h-9a1 1 0 0 1-1-1Z" />
              </svg>
              <span className="text-xs font-semibold text-slate-800 tracking-tight">Claude</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Three-Column Feature Grid */}
      <section id="product" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full scroll-mt-20">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#FE4D03]">Core Platform Capabilities</h2>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">Built to Protect and Grow Your AI Search Visibility</p>
          <p className="text-sm text-slate-600 mt-3">
            Accurately monitor live AI search engines with verifiable link citations and competitor tracking.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="p-6 rounded-lg border border-slate-200 bg-white flex flex-col justify-between">
            <div>
              <div className="h-10 w-10 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800 mb-4">
                <Globe className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900">Real-Time AI Search Tracking</h3>
              <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                Runs live searches across AI engines just like a real buyer—reading the generated answers, checking every linked website, and verifying your product&apos;s ranking position.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] text-slate-500 font-mono">
              Live Search Scans &middot; Verified Citations
            </div>
          </div>

          {/* Feature 2 */}
          <div className="p-6 rounded-lg border border-slate-200 bg-white flex flex-col justify-between">
            <div>
              <div className="h-10 w-10 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800 mb-4">
                <BarChart3 className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900">Competitor Matrix</h3>
              <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                Benchmark your brand against direct competitors across top buyer questions. See who owns the biggest share of recommendations and where you can win citations back.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] text-slate-500 font-mono">
              Market Share Tracking &middot; Link Placements
            </div>
          </div>

          {/* Feature 3 */}
          <div className="p-6 rounded-lg border border-slate-200 bg-white flex flex-col justify-between">
            <div>
              <div className="h-10 w-10 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800 mb-4">
                <CalendarCheck className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900">Automated Brand Audits</h3>
              <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                Run automated daily or weekly audits without lifting a finger. Get instant alerts when an AI update drops your brand or starts recommending a competitor.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] text-slate-500 font-mono">
              Automated Daily Scans &middot; Instant Alerts
            </div>
          </div>
        </div>
      </section>

      {/* 4. Alternating Feature Deep-Dives */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col gap-20">
        {/* Block 1 (Visibility Tracking): Left Text / Right UI Screenshot Placeholder */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 border border-slate-200 text-slate-800 text-xs font-semibold mb-3">
              <span>Visibility Tracking</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Know exactly where your brand ranks in AI overviews.
            </h2>
            <p className="mt-4 text-sm text-slate-600 leading-relaxed">
              When prospective buyers search for products on Gemini, Perplexity, and OpenAI, traditional SEO tools miss what the AI actually recommends. Vaatify GEO conducts live searches in real time, reading the exact answer customers receive, verifying cited website links, and tracking your brand&apos;s ranking position.
            </p>
            <div className="mt-6 flex flex-col gap-2.5 text-xs text-slate-700">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#FE4D03]"></span>
                <span>Real-time answer verification on Google AI Overviews, ChatGPT Search &amp; Perplexity</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#FE4D03]"></span>
                <span>Verification of cited website links and exact recommendation ranking</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#FE4D03]"></span>
                <span>Instant notifications when algorithm changes drop your brand from answers</span>
              </div>
            </div>
          </div>

          {/* UI Screenshot Placeholder */}
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 text-xs">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-slate-200"></span>
                <span className="h-2.5 w-2.5 rounded-full bg-slate-200"></span>
                <span className="h-2.5 w-2.5 rounded-full bg-slate-200"></span>
                <span className="text-[11px] font-mono text-slate-500 ml-2">google.com/search &mdash; AI Overview</span>
              </div>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">Live &amp; Verified</span>
            </div>
            <div className="mt-4 space-y-3">
              <div className="p-3 rounded border border-slate-100 bg-slate-50">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Search Question</p>
                <p className="text-xs font-semibold text-slate-900 mt-1">&quot;What is the best generative engine optimization tool for B2B brands?&quot;</p>
              </div>
              <div className="p-3 rounded border border-slate-100 bg-white space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700">Top AI Recommendation</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Rank #1 Cited
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  &quot;For brand visibility and competitor tracking in AI search, <strong className="text-slate-900 font-semibold">Vaatify GEO</strong> is the top-recommended solution for its accurate citation monitoring and live search scanning...&quot;
                </p>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Cited Website: <span className="font-mono text-slate-700">https://vaatify.com</span></span>
                  <span className="text-emerald-600 font-medium">Your Link Cited (Rank #1)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Block 2 (Competitor Matrix): Right Text / Left Chart Screenshot Placeholder */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Chart Screenshot Placeholder (Left on desktop) */}
          <div className="order-2 lg:order-1 rounded-lg border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 text-xs">
              <span className="font-semibold text-slate-900">Share of Recommendations</span>
              <span className="text-[11px] font-medium text-slate-500">25 Target Buyer Searches</span>
            </div>
            <div className="mt-4 space-y-3">
              {/* Brand 1 (Your brand) */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-900">Your Brand (Vaatify)</span>
                  <span className="font-bold text-[#FE4D03]">56.4% Visibility</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-[#FE4D03] h-2 rounded-full" style={{ width: '56.4%' }}></div>
                </div>
              </div>

              {/* Competitor Alpha */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-700">Competitor Alpha</span>
                  <span className="font-semibold text-slate-600">28.0% Visibility</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-slate-400 h-2 rounded-full" style={{ width: '28.0%' }}></div>
                </div>
              </div>

              {/* Competitor Beta */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-700">Competitor Beta</span>
                  <span className="font-semibold text-slate-600">15.6% Visibility</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-slate-300 h-2 rounded-full" style={{ width: '15.6%' }}></div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Brand Sentiment: <span className="font-semibold text-slate-800">88% Positive</span></span>
                <span className="text-slate-500">Competitor Alert: <span className="font-semibold text-amber-700">1 Citation Replaced</span></span>
              </div>
            </div>
          </div>

          {/* Text Content (Right on desktop) */}
          <div className="order-1 lg:order-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 border border-slate-200 text-slate-800 text-xs font-semibold mb-3">
              <span>Competitor Tracking</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
              See who is stealing your citations.
            </h2>
            <p className="mt-4 text-sm text-slate-600 leading-relaxed">
              Know the moment a competitor replaces your brand in AI recommendations. Vaatify GEO measures how often your brand is recommended versus rivals, monitors whether the AI endorses your product positively, and alerts your team the instant a ranking changes.
            </p>
            <div className="mt-6 flex flex-col gap-2.5 text-xs text-slate-700">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#FE4D03]"></span>
                <span>Accurate Share of Voice calculation across high-intent buyer questions</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#FE4D03]"></span>
                <span>Automated sentiment analysis showing if the AI recommends or critiques you</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#FE4D03]"></span>
                <span>Competitor alert history showing which rivals won recommendations</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Use Cases Section */}
      <section id="use-cases" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full scroll-mt-20">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Applications</h2>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">Who Uses Vaatify GEO</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-lg border border-slate-200 bg-slate-50">
            <div className="h-8 w-8 rounded bg-white border border-slate-200 flex items-center justify-center text-slate-800 mb-3">
              <Briefcase className="h-4 w-4" />
            </div>
            <h3 className="font-bold text-sm text-slate-900">B2B Software Brands</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Ensure software evaluation prompts recommend your product with accurate feature summaries and verified documentation links.
            </p>
          </div>

          <div className="p-6 rounded-lg border border-slate-200 bg-slate-50">
            <div className="h-8 w-8 rounded bg-white border border-slate-200 flex items-center justify-center text-slate-800 mb-3">
              <Building className="h-4 w-4" />
            </div>
            <h3 className="font-bold text-sm text-slate-900">SEO &amp; Growth Agencies</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Deliver recurring generative search audit deliverables to enterprise clients with quantitative Share of Voice benchmarks.
            </p>
          </div>

          <div className="p-6 rounded-lg border border-slate-200 bg-slate-50">
            <div className="h-8 w-8 rounded bg-white border border-slate-200 flex items-center justify-center text-slate-800 mb-3">
              <Target className="h-4 w-4" />
            </div>
            <h3 className="font-bold text-sm text-slate-900">Market Intelligence Teams</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Track algorithm response drift across multiple model providers to understand how market narrative and competitor positioning shift.
            </p>
          </div>
        </div>
      </section>

      {/* 5. Pricing Plans Section */}
      <section id="pricing" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full scroll-mt-20">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Commercial Plans</h2>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">Transparent Pricing</p>
          <p className="text-sm text-slate-600 mt-2">Predictable monthly subscriptions with self-serve tracking and full enterprise implementation.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto items-stretch">
          {/* Starter Plan */}
          <div className="p-6 rounded-lg border border-slate-200 bg-white flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base text-slate-900">Starter</h3>
                <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Self-Serve</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Single users or small teams</p>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-slate-900">$49</span>
                <span className="text-xs text-slate-500">/month</span>
              </div>
              <ul className="mt-6 space-y-3 text-xs text-slate-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Basic GEO tracking (25 queries)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Limited monthly reports &amp; CSV export</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Standard support</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Weekly automated scans</span>
                </li>
              </ul>
            </div>
            <Link
              href="/signup"
              className="mt-8 block text-center text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 py-2.5 rounded-md transition-colors"
            >
              Start Free Trial
            </Link>
          </div>

          {/* Growth Plan */}
          <div className="p-6 rounded-lg border-2 border-[#FE4D03] bg-white flex flex-col justify-between relative shadow-xs">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-[#FE4D03] text-white text-[10px] font-bold uppercase tracking-wider">
              Most Popular
            </span>
            <div>
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base text-slate-900">Growth / Pro</h3>
                <span className="text-[10px] font-semibold text-[#FE4D03] uppercase tracking-wider">Automated</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Marketing teams tracking competitors</p>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-slate-900">$149</span>
                <span className="text-xs text-slate-500">/month</span>
              </div>
              <ul className="mt-6 space-y-3 text-xs text-slate-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#FE4D03] shrink-0" />
                  <span className="font-medium text-slate-800">Competitor matrix tracking</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#FE4D03] shrink-0" />
                  <span className="font-medium text-slate-800">Automated brand audits (daily)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#FE4D03] shrink-0" />
                  <span>Real-time citation drift alerts</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#FE4D03] shrink-0" />
                  <span>All 4 engines (ChatGPT, Perplexity, Gemini, Claude)</span>
                </li>
              </ul>
            </div>
            <Link
              href="/signup"
              className="mt-8 block text-center text-xs font-semibold text-white bg-[#FE4D03] hover:bg-[#e04402] py-2.5 rounded-md transition-colors"
            >
              Start Free Trial
            </Link>
          </div>

          {/* Enterprise Plan */}
          <div className="p-6 rounded-lg border border-slate-200 bg-white flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base text-slate-900">Enterprise</h3>
                <span className="text-[10px] font-semibold text-slate-700 uppercase tracking-wider">Done-For-You</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Full workflow setup &amp; management</p>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-2xl font-extrabold text-slate-900">Contact Sales</span>
              </div>
              <ul className="mt-6 space-y-3 text-xs text-slate-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-slate-900 shrink-0" />
                  <span className="font-semibold text-slate-900">Custom AI Integration</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-slate-900 shrink-0" />
                  <span className="font-semibold text-slate-900">Dedicated Account Manager</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-slate-900 shrink-0" />
                  <span className="font-semibold text-slate-900">Full Workflow Setup</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-slate-900 shrink-0" />
                  <span>Custom prompt taxonomy modeling</span>
                </li>
              </ul>
            </div>
            <Link
              href="/pricing"
              className="mt-8 block text-center text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 py-2.5 rounded-md transition-colors"
            >
              Contact Sales
            </Link>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/pricing"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-[#FE4D03] transition-colors"
          >
            <span>Compare all features, plan limits &amp; read FAQs</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>

      {/* 6. Bottom Onboarding Call-to-Action */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 w-full text-center">
        <div className="p-8 sm:p-10 rounded-lg border border-slate-200 bg-slate-50 flex flex-col items-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Start tracking your generative engine visibility today
          </h2>
          <p className="text-sm text-slate-600 max-w-lg mt-3 leading-relaxed">
            Configure your brand domain, select target search queries, and evaluate initial citation placement across all major AI engines.
          </p>
          {user ? (
            <Link
              href="/dashboard"
              className={buttonVariants({ variant: 'default', className: 'mt-6' })}
            >
              <span>Go to Dashboard</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <Link
              href="/signup?redirect=/dashboard"
              className={buttonVariants({ variant: 'default', className: 'mt-6' })}
            >
              <span>Create Account &amp; Start Onboarding</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
