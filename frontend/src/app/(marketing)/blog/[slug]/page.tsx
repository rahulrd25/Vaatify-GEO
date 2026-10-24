import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Calendar, Clock, User, ArrowRight } from 'lucide-react';
import { getAllPosts, getPostBySlug } from '@/lib/blog';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    return {
      title: 'Post Not Found | Vaatify GEO Blog',
    };
  }

  const title = `${post.title} | Vaatify GEO`;
  const description = post.excerpt;
  const url = `https://geo.vaatify.com/blog/${slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      type: 'article',
      publishedTime: post.date,
      authors: [post.author],
      siteName: 'Vaatify GEO',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      creator: '@vaatify',
    },
  };
}

function renderInline(text: string): React.ReactNode {
  // Matches bold (**text**), italic (*text*), code (`text`), and markdown links [text](url)
  const regex = /(\*\*.*?\*\*|\*.*?\*|`.*?`|\[.*?\]\(.*?\))/g;
  const parts = text.split(regex);

  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-bold text-slate-950">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={i} className="italic text-slate-800">{part.slice(1, -1)}</em>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={i} className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-900 text-xs font-mono font-medium">
          {part.slice(1, -1)}
        </code>
      );
    }
    const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
    if (linkMatch) {
      const [, label, href] = linkMatch;
      const isExternal = href.startsWith('http');
      return (
        <a
          key={i}
          href={href}
          target={isExternal ? '_blank' : undefined}
          rel={isExternal ? 'noopener noreferrer' : undefined}
          className="text-[#FE4D03] hover:underline font-medium"
        >
          {label}
        </a>
      );
    }
    return part;
  });
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <article className="py-12 md:py-20 bg-white text-slate-900 min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation Breadcrumb */}
        <div className="mb-8">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to All Articles</span>
          </Link>
        </div>

        {/* Article Header */}
        <header className="border-b border-slate-200 pb-8 mb-10">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-orange-50 text-[#FE4D03] border border-orange-200/60 font-semibold uppercase tracking-wider text-[11px] mb-4">
            <span>{post.category}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-950 leading-tight">
            {post.title}
          </h1>

          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
            {post.excerpt}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-6 text-xs text-slate-500 font-medium">
            <div className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-slate-400" />
              <span>{post.author}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              <time dateTime={post.date}>
                {new Date(post.date).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </time>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              <span>{post.readTime}</span>
            </div>
          </div>
        </header>

        {/* Article Body */}
        <div className="prose prose-slate max-w-none text-slate-800 text-sm sm:text-base leading-relaxed space-y-6">
          {post.content.split('\n\n').map((paragraph, index) => {
            const trimmed = paragraph.trim();
            if (!trimmed) return null;

            // Heading 1 or Heading 2
            if (trimmed.startsWith('# ')) {
              return null; // Skip main h1 since rendered above in header
            }
            if (trimmed.startsWith('## ')) {
              return (
                <h2 key={index} className="text-xl sm:text-2xl font-bold text-slate-900 mt-10 mb-4 pt-4 border-t border-slate-100">
                  {renderInline(trimmed.replace(/^##\s+/, ''))}
                </h2>
              );
            }
            if (trimmed.startsWith('### ')) {
              return (
                <h3 key={index} className="text-lg font-bold text-slate-900 mt-6 mb-2">
                  {renderInline(trimmed.replace(/^###\s+/, ''))}
                </h3>
              );
            }

            // Horizontal Rule
            if (trimmed === '---') {
              return <hr key={index} className="my-8 border-slate-200" />;
            }

            // Blockquote
            if (trimmed.startsWith('> ')) {
              return (
                <blockquote key={index} className="border-l-4 border-[#FE4D03] pl-4 py-2 italic text-slate-700 bg-slate-50 rounded-r">
                  {renderInline(trimmed.replace(/^>\s+/, ''))}
                </blockquote>
              );
            }

            // Table rendering (starts with |)
            if (trimmed.startsWith('|')) {
              const lines = trimmed.split('\n').filter((l) => l.trim().startsWith('|'));
              if (lines.length >= 2) {
                const headerLine = lines[0];
                const dataLines = lines.slice(1).filter((l) => !l.includes('---'));
                const headers = headerLine.split('|').map((c) => c.trim()).filter(Boolean);

                return (
                  <div key={index} className="overflow-x-auto my-6 border border-slate-200 rounded-lg">
                    <table className="w-full text-left text-xs sm:text-sm border-collapse">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-900 font-semibold">
                        <tr>
                          {headers.map((h, hIdx) => (
                            <th key={hIdx} className="p-3 border-r border-slate-200 last:border-r-0">
                              {renderInline(h)}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {dataLines.map((rowLine, rIdx) => {
                          const cells = rowLine.split('|').map((c) => c.trim()).filter(Boolean);
                          return (
                            <tr key={rIdx} className="hover:bg-slate-50/50">
                              {cells.map((cell, cIdx) => (
                                <td key={cIdx} className="p-3 border-r border-slate-100 last:border-r-0 text-slate-700">
                                  {renderInline(cell)}
                                </td>
                              ))}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              }
            }

            // Bullet List
            if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
              const items = trimmed.split('\n').filter((l) => l.trim().startsWith('- ') || l.trim().startsWith('* '));
              return (
                <ul key={index} className="list-disc pl-5 space-y-2 text-slate-700 my-4">
                  {items.map((item, itemIdx) => (
                    <li key={itemIdx}>{renderInline(item.replace(/^[-*]\s+/, ''))}</li>
                  ))}
                </ul>
              );
            }

            // Numbered List
            if (/^\d+\.\s/.test(trimmed)) {
              const items = trimmed.split('\n').filter((l) => /^\d+\.\s/.test(l.trim()));
              return (
                <ol key={index} className="list-decimal pl-5 space-y-2 text-slate-700 my-4">
                  {items.map((item, itemIdx) => (
                    <li key={itemIdx}>{renderInline(item.replace(/^\d+\.\s+/, ''))}</li>
                  ))}
                </ol>
              );
            }

            // Standard Paragraph
            return (
              <p key={index} className="text-slate-700 leading-relaxed">
                {renderInline(trimmed)}
              </p>
            );
          })}
        </div>

        {/* Bottom CTA for Readers */}
        <div className="mt-16 p-8 rounded-xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <h3 className="font-bold text-base text-slate-900">
              Track Your Brand in AI Search Engines
            </h3>
            <p className="text-xs text-slate-600 mt-1 max-w-md">
              Start evaluating your citation Share of Voice across ChatGPT, Google AI Overviews, and Perplexity today.
            </p>
          </div>
          <Link
            href="/signup"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-[#FE4D03] hover:bg-[#e04402] px-4 py-2.5 rounded-md transition-colors shrink-0"
          >
            <span>Start Free Trial</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}
