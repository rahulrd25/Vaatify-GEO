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
  creator: 'Vaatify Inc.',
  publisher: 'Vaatify Inc.',
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
      <footer className="border-t border-slate-200 bg-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <Image
                src="/icon.svg"
                alt="Vaatify"
                width={24}
                height={24}
                className="w-6 h-6"
              />
              <span className="font-bold text-sm tracking-tight text-slate-900">Vaatify</span>
              <span className="text-xs text-slate-400 ml-2">SaaS Generative Engine Optimization</span>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-sm text-slate-600">
              <Link href="/#product" className="hover:text-slate-900 transition-colors">
                Product
              </Link>
              <Link href="/#use-cases" className="hover:text-slate-900 transition-colors">
                Use Cases
              </Link>
              <Link href="/pricing" className="hover:text-slate-900 transition-colors">
                Pricing
              </Link>
              <Link href="/docs" className="hover:text-slate-900 transition-colors">
                Docs
              </Link>
              <Link href="/blog" className="hover:text-slate-900 transition-colors">
                Blog
              </Link>
              {user ? (
                <Link
                  href="/dashboard"
                  className="text-[#FE4D03] font-medium hover:text-[#e04402] transition-colors"
                >
                  Go to Workspace
                </Link>
              ) : (
                <>
                  <Link href="/login" className="hover:text-slate-900 transition-colors">
                    Sign In
                  </Link>
                  <Link href="/signup" className="text-[#FE4D03] font-medium hover:text-[#e04402] transition-colors">
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <p>&copy; {new Date().getFullYear()} Vaatify Inc. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <Link href="/login" className="hover:text-slate-700 transition-colors">
                Privacy Policy
              </Link>
              <Link href="/login" className="hover:text-slate-700 transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
