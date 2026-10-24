import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <header className="px-6 py-4 flex items-center justify-between border-b border-slate-200/60 bg-white/80 backdrop-blur-md">
        <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
          <Image
            src="/icon.svg"
            alt="Vaatify"
            width={28}
            height={28}
            className="w-7 h-7"
          />
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-base tracking-tight text-slate-900">Vaatify</span>
            <span className="text-[10px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded bg-orange-50 text-[#FE4D03] border border-orange-200/60">
              GEO
            </span>
          </div>
        </Link>
        <Link
          href="/"
          className="text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
        >
          &larr; Back to website
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        {children}
      </main>

      <footer className="py-4 text-center text-xs text-slate-400 border-t border-slate-200/60">
        &copy; {new Date().getFullYear()} Vaatify Inc. All rights reserved. &middot; Generative Engine Optimization Intelligence
      </footer>
    </div>
  );
}
