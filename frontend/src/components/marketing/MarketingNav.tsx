'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { Menu, X } from 'lucide-react';

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
    <header className="sticky top-0 z-50 w-full bg-white border-b border-slate-200">
      <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left-aligned brand and navigation links */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center">
            <Image
              src="/logo.svg"
              alt="Vaatify GEO"
              width={160}
              height={42}
              priority
              className="h-9 sm:h-10 w-auto object-contain"
            />
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/#product"
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Product
            </Link>
            <Link
              href="/#use-cases"
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Use Cases
            </Link>
            <Link
              href="/pricing"
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="/docs"
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Docs
            </Link>
            <Link
              href="/blog"
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Blog
            </Link>
          </nav>
        </div>

        {/* Right-aligned authentication links */}
        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center text-sm font-medium text-white bg-[#FE4D03] hover:bg-[#e04402] px-4 py-2 rounded-md transition-colors"
            >
              Go to Workspace
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center justify-center text-sm font-medium text-white bg-[#FE4D03] hover:bg-[#e04402] px-4 py-2 rounded-md transition-colors"
              >
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger menu toggle */}
        <div className="flex md:hidden items-center">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-600 hover:text-slate-900 focus:outline-hidden"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-3">
          <nav className="flex flex-col space-y-2.5">
            <Link
              href="/#product"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              Product
            </Link>
            <Link
              href="/#use-cases"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              Use Cases
            </Link>
            <Link
              href="/pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              Pricing
            </Link>
            <Link
              href="/docs"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              Docs
            </Link>
            <Link
              href="/blog"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              Blog
            </Link>
          </nav>

          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
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
                  className="w-full text-center text-sm font-medium text-slate-700 py-2 border border-slate-200 rounded-md hover:bg-slate-50 transition-colors"
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
