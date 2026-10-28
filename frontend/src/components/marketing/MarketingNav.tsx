'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Menu, X } from 'lucide-react';
import { BrandLogo } from '@/components/common/BrandLogo';
import { ThemeToggle } from '@/components/common/ThemeToggle';

interface MarketingNavProps {
  initialUser?: {
    id: string;
    email?: string;
  } | null;
}

export default function MarketingNav({ initialUser }: MarketingNavProps = {}) {
  const { user: clientUser } = useAuth();
  const user = clientUser || initialUser || null;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left-aligned brand and navigation links */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center" aria-label="Vaatify GEO Home">
            <BrandLogo
              priority
              className="h-9 sm:h-10 w-auto object-contain"
            />
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/#product"
              className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Product
            </Link>
            <Link
              href="/#use-cases"
              className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Use Cases
            </Link>
            <Link
              href="/pricing"
              className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="/docs"
              className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Docs
            </Link>
            <Link
              href="/blog"
              className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Blog
            </Link>
          </nav>
        </div>

        {/* Right-aligned authentication & theme toggle */}
        <div className="hidden md:flex items-center gap-3">
          <ThemeToggle />

          {user ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center text-sm font-medium text-white bg-[#FE4D03] hover:bg-[#e04402] px-4 py-2 rounded-md transition-colors shadow-xs"
            >
              Go to Workspace
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors px-2 py-1.5"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center justify-center text-sm font-medium text-white bg-[#FE4D03] hover:bg-[#e04402] px-4 py-2 rounded-md transition-colors shadow-xs"
              >
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Mobile controls (theme toggle + hamburger menu) */}
        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white focus:outline-hidden"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-4 space-y-3">
          <nav className="flex flex-col space-y-2.5">
            <Link
              href="/#product"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            >
              Product
            </Link>
            <Link
              href="/#use-cases"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            >
              Use Cases
            </Link>
            <Link
              href="/pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            >
              Pricing
            </Link>
            <Link
              href="/docs"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            >
              Docs
            </Link>
            <Link
              href="/blog"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            >
              Blog
            </Link>
          </nav>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
            {user ? (
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center text-sm font-medium text-white bg-[#FE4D03] hover:bg-[#e04402] px-4 py-2 rounded-md transition-colors"
              >
                Go to Workspace
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center text-sm font-medium text-slate-700 dark:text-slate-200 py-2 border border-slate-200 dark:border-slate-800 rounded-md hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center text-sm font-medium text-white bg-[#FE4D03] hover:bg-[#e04402] px-4 py-2 rounded-md transition-colors"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
