import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Calendar, Clock, BookOpen } from 'lucide-react';
import { getAllPosts } from '@/lib/blog';

export const metadata: Metadata = {
  title: 'Blog & Generative Engine Optimization Insights | Vaatify GEO',
  description:
    'In-depth guides, research reports, and actionable strategies for optimizing brand visibility and citations across ChatGPT, Perplexity, and Google AI Overviews.',
  alternates: {
    canonical: 'https://geo.vaatify.com/blog',
  },
  openGraph: {
    title: 'Blog & Generative Engine Optimization Insights | Vaatify GEO',
    description:
      'In-depth guides, research reports, and actionable strategies for optimizing brand visibility and citations across ChatGPT, Perplexity, and Google AI Overviews.',
    url: 'https://geo.vaatify.com/blog',
  },
};

export default function BlogListPage() {
  const posts = getAllPosts();

  return (
    <div className="py-16 md:py-24 bg-white text-slate-900 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-3xl mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-800 text-xs font-semibold mb-4">
            <BookOpen className="h-3.5 w-3.5 text-[#FE4D03]" />
            <span>GEO Research &amp; Guides</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-950">
            Generative Engine Optimization Insights
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
            Latest frameworks, research data, and practical guides on how modern brands win citations across ChatGPT Search, Google AI Overviews, and Perplexity.
          </p>
        </div>

        {/* Blog Post Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post) => (
            <article
              key={post.slug}
              className="p-6 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all flex flex-col justify-between shadow-2xs hover:shadow-xs"
            >
              <div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 mb-3">
                  <span className="px-2 py-0.5 rounded bg-orange-50 text-[#FE4D03] border border-orange-200/60 font-semibold uppercase tracking-wider text-[10px]">
                    {post.category}
                  </span>
                  <div className="flex items-center gap-1 font-medium">
                    <Clock className="h-3 w-3 text-slate-400" />
                    <span>{post.readTime}</span>
                  </div>
                </div>

                <h2 className="text-lg font-bold text-slate-900 tracking-tight hover:text-[#FE4D03] transition-colors leading-snug">
                  <Link href={`/blog/${post.slug}`}>
                    {post.title}
                  </Link>
                </h2>

                <p className="mt-3 text-xs text-slate-600 leading-relaxed line-clamp-3">
                  {post.excerpt}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                  <Calendar className="h-3 w-3 text-slate-400" />
                  <time dateTime={post.date}>
                    {new Date(post.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </time>
                </div>

                <Link
                  href={`/blog/${post.slug}`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#FE4D03] hover:text-[#e04402] transition-colors"
                >
                  <span>Read Guide</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
