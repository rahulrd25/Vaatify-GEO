'use client';

import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CodeSnippetProps {
  curl: string;
  python: string;
  node: string;
  response?: string;
}

export default function DocsCodeSnippet({ curl, python, node, response }: CodeSnippetProps) {
  const [activeTab, setActiveTab] = useState<'curl' | 'python' | 'node'>('curl');
  const [copied, setCopied] = useState(false);

  const getCode = () => {
    switch (activeTab) {
      case 'curl':
        return curl;
      case 'python':
        return python;
      case 'node':
        return node;
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getCode());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950 text-slate-200 overflow-hidden text-xs shadow-xs">
      {/* Code Header with language tabs and copy button */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800 bg-slate-900/80">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('curl')}
            className={`px-2.5 py-1 rounded text-[11px] font-mono font-medium transition-colors cursor-pointer ${
              activeTab === 'curl'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            cURL
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('python')}
            className={`px-2.5 py-1 rounded text-[11px] font-mono font-medium transition-colors cursor-pointer ${
              activeTab === 'python'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Python
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('node')}
            className={`px-2.5 py-1 rounded text-[11px] font-mono font-medium transition-colors cursor-pointer ${
              activeTab === 'node'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Node.js
          </button>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] text-slate-400 hover:text-white transition-colors cursor-pointer"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Body */}
      <div className="p-4 overflow-x-auto font-mono text-[11.5px] leading-relaxed text-slate-200">
        <pre>{getCode()}</pre>
      </div>

      {/* Response Preview if available */}
      {response && (
        <div className="border-t border-slate-800 bg-slate-900/40">
          <div className="px-3 py-1.5 border-b border-slate-800/80 text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Response 200 OK</span>
            <span className="text-emerald-400 font-semibold">application/json</span>
          </div>
          <div className="p-4 overflow-x-auto font-mono text-[11px] leading-relaxed text-slate-300">
            <pre>{response}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
