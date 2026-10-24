import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import PricingFaq from '@/components/marketing/PricingFaq';

export const metadata: Metadata = {
  title: 'Pricing & Plans | Vaatify GEO',
  description:
    'Transparent pricing for generative engine optimization. Self-serve tracking for growing brands and full Done-For-You enterprise setups.',
  alternates: {
    canonical: 'https://geo.vaatify.com/pricing',
  },
  openGraph: {
    title: 'Pricing & Plans | Vaatify GEO',
    description:
      'Transparent pricing for generative engine optimization. Self-serve tracking for growing brands and full Done-For-You enterprise setups.',
    url: 'https://geo.vaatify.com/pricing',
  },
  twitter: {
    title: 'Pricing & Plans | Vaatify GEO',
    description:
      'Transparent pricing for generative engine optimization. Self-serve tracking for growing brands and full Done-For-You enterprise setups.',
  },
};

export default function PricingPage() {
  return (
    <div className="py-16 md:py-24 bg-white text-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-800 text-xs font-semibold mb-4">
            <span>Predictable SaaS Subscriptions</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-950">
            Simple, Transparent Pricing
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
            Choose the plan that fits your growth stage. Scale from self-serve monitoring to fully managed enterprise implementation.
          </p>
        </div>

        {/* 3-Column Pricing Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
          {/* Tier 1: Starter / Self-Serve */}
          <div className="p-8 rounded-xl border border-slate-200 bg-white flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">Starter</h2>
                <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Self-Serve</span>
              </div>
              <p className="text-xs text-slate-600 mt-2">
                Designed for single founders and small teams tracking initial brand search visibility.
              </p>

              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-slate-900">$49</span>
                <span className="text-xs text-slate-500">/month</span>
              </div>

              <div className="mt-8 border-t border-slate-100 pt-6">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Included capabilities</p>
                <ul className="space-y-3.5 text-xs text-slate-600">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Basic GEO tracking (up to 25 target queries)</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Limited monthly reports &amp; CSV export</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Standard email support</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Weekly automated evaluation scans</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Coverage for ChatGPT &amp; Google AI</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-10">
              <Link
                href="/signup"
                className="w-full inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 py-3 rounded-md transition-colors"
              >
                <span>Start Free Trial</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Tier 2: Growth / Pro (Most Popular) */}
          <div className="p-8 rounded-xl border-2 border-[#FE4D03] bg-white flex flex-col justify-between relative shadow-sm">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-[#FE4D03] text-white text-[10px] font-bold uppercase tracking-wider">
              Most Popular
            </span>

            <div>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">Growth / Pro</h2>
                <span className="text-[11px] font-semibold text-[#FE4D03] uppercase tracking-wider">Automated Matrix</span>
              </div>
              <p className="text-xs text-slate-600 mt-2">
                Built for active marketing teams needing competitor matrix tracking and automated brand audits.
              </p>

              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-slate-900">$149</span>
                <span className="text-xs text-slate-500">/month</span>
              </div>

              <div className="mt-8 border-t border-slate-100 pt-6">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Everything in Starter, plus</p>
                <ul className="space-y-3.5 text-xs text-slate-600">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-[#FE4D03] shrink-0 mt-0.5" />
                    <span className="font-medium text-slate-800">Competitor matrix tracking (up to 5 competitors)</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-[#FE4D03] shrink-0 mt-0.5" />
                    <span className="font-medium text-slate-800">Automated brand audits (daily scan frequency)</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-[#FE4D03] shrink-0 mt-0.5" />
                    <span>Real-time citation flip and drift alerts</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-[#FE4D03] shrink-0 mt-0.5" />
                    <span>150 Tracked high-intent buyer prompts</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-[#FE4D03] shrink-0 mt-0.5" />
                    <span>All 4 engines: ChatGPT, Perplexity, Gemini &amp; Claude</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-[#FE4D03] shrink-0 mt-0.5" />
                    <span>Priority email &amp; chat support</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-10">
              <Link
                href="/signup"
                className="w-full inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-white bg-[#FE4D03] hover:bg-[#e04402] py-3 rounded-md transition-colors"
              >
                <span>Start Free Trial</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Tier 3: Enterprise / Done-For-You */}
          <div className="p-8 rounded-xl border border-slate-200 bg-white flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">Enterprise</h2>
                <span className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider">Done-For-You</span>
              </div>
              <p className="text-xs text-slate-600 mt-2">
                Complete white-glove setup and ongoing management. We configure, maintain, and optimize your GEO presence.
              </p>

              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-slate-900">Contact Sales</span>
              </div>

              <div className="mt-8 border-t border-slate-100 pt-6">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Enterprise deliverables</p>
                <ul className="space-y-3.5 text-xs text-slate-600">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-slate-900 shrink-0 mt-0.5" />
                    <span className="font-semibold text-slate-900">Custom AI Integration</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-slate-900 shrink-0 mt-0.5" />
                    <span className="font-semibold text-slate-900">Dedicated Account Manager</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-slate-900 shrink-0 mt-0.5" />
                    <span className="font-semibold text-slate-900">Full Workflow Setup</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-slate-900 shrink-0 mt-0.5" />
                    <span>Custom buyer prompt taxonomy modeling</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-slate-900 shrink-0 mt-0.5" />
                    <span>Dedicated high-frequency tracking servers &amp; custom scan intervals</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-slate-900 shrink-0 mt-0.5" />
                    <span>White-glove monthly executive drift reporting</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-slate-900 shrink-0 mt-0.5" />
                    <span>Custom SLA &amp; shared private Slack channel</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-10">
              <Link
                href="/signup"
                className="w-full inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-900 bg-white border border-slate-300 hover:bg-slate-50 py-3 rounded-md transition-colors"
              >
                <span>Contact Sales</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* FAQs Accordion Section */}
        <section className="mt-24 pt-16 border-t border-slate-200">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Frequently Asked Questions
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-2">
              Everything you need to know about our billing, tracking methodology, and managed enterprise onboarding.
            </p>
          </div>

          <PricingFaq />
        </section>
      </div>
    </div>
  );
}
