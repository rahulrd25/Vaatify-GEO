import React from 'react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import MarketingNav from '@/components/marketing/MarketingNav';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://geo.vaatify.com'),
  title: {
    default: 'Vaatify GEO | Generative Engine Optimization SaaS',
    template: '%s | Vaatify GEO',
  },
  description:
    'Track your brand visibility, competitor share of voice, and citation displacement across ChatGPT, Perplexity, Google Gemini, and Claude.',
  keywords: [
    'Generative Engine Optimization',
    'GEO',
    'AI SEO',
    'ChatGPT Search visibility',
    'Perplexity citation tracking',
    'Google AI Overviews ranking',
    'Share of Voice',
    'AI search engine optimization',
    'Citation drift',
  ],
  authors: [{ name: 'Vaatify' }],
  creator: 'DECCAN ADAPTIVE INTELLIGENCE LIMITED',
  publisher: 'DECCAN ADAPTIVE INTELLIGENCE LIMITED',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://geo.vaatify.com',
    siteName: 'Vaatify GEO',
    title: 'Vaatify GEO | Generative Engine Optimization SaaS',
    description:
      'Continuous multi-engine evaluation and citation intelligence for modern brands across OpenAI, Perplexity, Google, and Anthropic.',
    images: [
      {
        url: '/icon.svg',
        width: 1200,
        height: 630,
        alt: 'Vaatify GEO Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vaatify GEO | Generative Engine Optimization SaaS',
    description:
      'Track your brand visibility, competitor share of voice, and citation displacement across AI search engines.',
    images: ['/icon.svg'],
    creator: '@vaatify',
  },
  alternates: {
    canonical: 'https://geo.vaatify.com',
  },
};

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let user = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    user = null;
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col justify-between selection:bg-[#FE4D03]/20 selection:text-[#FE4D03]">
      {/* 1. Global Navigation Header (Server-initialized auth) */}
      <MarketingNav initialUser={user ? { id: user.id, email: user.email || '' } : null} />

      {/* 2. Main Body Content (Server Component) */}
      <main className="flex-1">
        {children}
      </main>

      {/* 3. Global Footer (Server Component) */}
      <footer className="border-t border-slate-200 bg-white py-6 px-4 sm:px-6 lg:px-8">
        <div className="w-full flex flex-col md:flex-row items-start md:items-center justify-between gap-6 text-xs text-slate-500">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
            <Link href="/" className="flex items-center shrink-0">
              <Image
                src="/logo.svg"
                alt="Vaatify GEO"
                width={140}
                height={36}
                className="h-7 sm:h-8 w-auto object-contain"
              />
            </Link>
            <div className="sm:border-l sm:border-slate-200 sm:pl-4 space-y-0.5">
              <p className="font-medium text-slate-700">
                &copy; {new Date().getFullYear()} DECCAN ADAPTIVE INTELLIGENCE LIMITED. All rights reserved.
              </p>
              <p className="text-[11px] text-slate-400">
                Company Number: 16694122
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-5 sm:gap-6 shrink-0">
            <a
              href="https://www.linkedin.com/company/vaatifyme/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Vaatify on LinkedIn"
              className="hover:text-slate-900 transition-colors flex items-center gap-1.5"
            >
              <svg className="h-3.5 w-3.5 fill-current text-slate-500 hover:text-[#0A66C2] transition-colors" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
              </svg>
              <span>LinkedIn</span>
            </a>
            <a href="mailto:hello@vaatify.com" className="hover:text-slate-900 transition-colors">
              hello@vaatify.com
            </a>
            <Link href="/privacy" className="hover:text-slate-900 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-slate-900 transition-colors">
              Terms of Service
            </Link>
            <Link href="/docs" className="hover:text-slate-900 transition-colors">
              Docs
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
