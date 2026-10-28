import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { 
  ArrowLeft, 
  ExternalLink, 
  Key, 
  Server, 
  ShieldCheck
} from 'lucide-react';
import DocsCodeSnippet from '@/components/marketing/DocsCodeSnippet';

export const metadata: Metadata = {
  title: 'API Reference & Integration Documentation | Vaatify GEO',
  description:
    'Complete REST API documentation for programmatic generative engine evaluations, Share of Voice metrics, and competitor citation analysis.',
  alternates: {
    canonical: 'https://geo.vaatify.com/docs',
  },
  openGraph: {
    title: 'API Reference & Integration Documentation | Vaatify GEO',
    description:
      'Complete REST API documentation for programmatic generative engine evaluations, Share of Voice metrics, and competitor citation analysis.',
    url: 'https://geo.vaatify.com/docs',
  },
};

export default function DocsPage() {
  return (
    <div className="bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen">
      {/* Top Banner & Quick Links */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-2">
                <Link href="/" className="hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-1">
                  <ArrowLeft className="h-3 w-3" />
                  <span>Home</span>
                </Link>
                <span>/</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">API Documentation</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 dark:text-white tracking-tight">
                Vaatify GEO API Reference
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
                Programmatically trigger multi-engine search evaluations, retrieve deterministic Share of Voice metrics, and monitor citation flips.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <a
                href="https://vaatify-geo-engine.fly.dev/docs"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 px-3.5 py-2 rounded-md transition-colors shadow-2xs"
              >
                <span>Interactive Swagger UI</span>
                <ExternalLink className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
              </a>
              <Link
                href="/signup"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-[#FE4D03] hover:bg-[#e04402] px-3.5 py-2 rounded-md transition-colors shadow-xs"
              >
                <span>Get API Key</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container: Sidebar + Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left Sidebar Navigation (Sticky on Desktop) */}
          <aside className="lg:col-span-3">
            <div className="sticky top-24 space-y-6 text-xs border border-slate-200 dark:border-slate-800 rounded-lg p-5 bg-slate-50/50 dark:bg-slate-900/50">
              {/* Group 1 */}
              <div>
                <p className="font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 text-[10px] mb-2.5">
                  Getting Started
                </p>
                <nav className="space-y-1.5 font-medium text-slate-600 dark:text-slate-400">
                  <a href="#intro" className="block hover:text-[#FE4D03] transition-colors">
                    Overview &amp; Base URL
                  </a>
                  <a href="#auth" className="block hover:text-[#FE4D03] transition-colors">
                    Authentication
                  </a>
                  <a href="#errors" className="block hover:text-[#FE4D03] transition-colors">
                    Error Codes &amp; Limits
                  </a>
                </nav>
              </div>

              {/* Group 2 */}
              <div>
                <p className="font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 text-[10px] mb-2.5">
                  Core Endpoints
                </p>
                <nav className="space-y-1.5 font-medium text-slate-600 dark:text-slate-400">
                  <a href="#status" className="block hover:text-[#FE4D03] transition-colors">
                    GET /api/v1/status
                  </a>
                  <a href="#pipeline-run" className="block hover:text-[#FE4D03] transition-colors">
                    POST /api/v1/pipeline/run
                  </a>
                  <a href="#metrics" className="block hover:text-[#FE4D03] transition-colors">
                    GET /api/v1/metrics/overview
                  </a>
                  <a href="#runs-history" className="block hover:text-[#FE4D03] transition-colors">
                    GET /api/v1/runs
                  </a>
                  <a href="#brand-profile" className="block hover:text-[#FE4D03] transition-colors">
                    GET &amp; POST /api/v1/profile
                  </a>
                  <a href="#copilot" className="block hover:text-[#FE4D03] transition-colors">
                    POST /api/v1/agent/chat
                  </a>
                </nav>
              </div>

              {/* Group 3 */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
                <p className="font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 text-[10px] mb-2.5">
                  Developer Resources
                </p>
                <nav className="space-y-2 font-medium text-slate-600 dark:text-slate-400">
                  <a
                    href="https://vaatify-geo-engine.fly.dev/docs"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between text-slate-700 dark:text-slate-300 hover:text-[#FE4D03] transition-colors"
                  >
                    <span>OpenAPI Swagger</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                  <a
                    href="https://vaatify-geo-engine.fly.dev/health"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between text-slate-700 dark:text-slate-300 hover:text-[#FE4D03] transition-colors"
                  >
                    <span>Health Probe</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </nav>
              </div>
            </div>
          </aside>

          {/* Right Main Content */}
          <main className="lg:col-span-9 space-y-16">
            {/* 1. Introduction Section */}
            <section id="intro" className="scroll-mt-24 space-y-4">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded bg-orange-50 dark:bg-orange-950/40 text-[#FE4D03] border border-orange-200 dark:border-orange-800/60">
                  <Server className="h-4 w-4" />
                </span>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Overview &amp; Base URL</h2>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                The Vaatify GEO Engine provides predictable, deterministic REST APIs for evaluating brand citations across major AI search providers (OpenAI ChatGPT Search, Google AI Overviews, Perplexity Sonar, Anthropic Claude, and Google Gemini).
              </p>
              <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 font-mono text-xs flex items-center justify-between">
                <div>
                  <span className="text-slate-400 dark:text-slate-500">Production Base URL: </span>
                  <span className="font-semibold text-slate-900 dark:text-white">https://vaatify-geo-engine.fly.dev</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold">HTTPS Only</span>
              </div>
            </section>

            {/* 2. Authentication */}
            <section id="auth" className="scroll-mt-24 space-y-4 pt-8 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                  <Key className="h-4 w-4" />
                </span>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Authentication</h2>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                All protected endpoints require an API key passed in the <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-slate-900 dark:text-slate-200 text-xs">x-api-key</code> HTTP request header. Your API key can be provisioned in your workspace settings.
              </p>

              <DocsCodeSnippet
                curl={`curl -X GET "https://vaatify-geo-engine.fly.dev/api/v1/status" \\
  -H "x-api-key: geo_your_api_key_here"`}
                python={`import requests

response = requests.get(
    "https://vaatify-geo-engine.fly.dev/api/v1/status",
    headers={"x-api-key": "geo_your_api_key_here"}
)
print(response.json())`}
                node={`const response = await fetch("https://vaatify-geo-engine.fly.dev/api/v1/status", {
  method: "GET",
  headers: {
    "x-api-key": "geo_your_api_key_here"
  }
});
const data = await response.json();
console.log(data);`}
                response={`{
  "status": "active",
  "authenticated": true,
  "message": "Vaatify GEO Engine API is ready."
}`}
              />
            </section>

            {/* 3. Endpoint: Status */}
            <section id="status" className="scroll-mt-24 space-y-4 pt-8 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <span className="inline-block px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-mono text-xs font-bold mr-2">
                    GET
                  </span>
                  <span className="font-mono text-sm font-semibold text-slate-900 dark:text-white">/api/v1/status</span>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">Status Check</span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Verifies API key validity and returns engine health status. Use this endpoint for readiness checks in your internal orchestrators.
              </p>
            </section>

            {/* 4. Endpoint: Trigger Multi-Engine Evaluation */}
            <section id="pipeline-run" className="scroll-mt-24 space-y-4 pt-8 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <span className="inline-block px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 font-mono text-xs font-bold mr-2">
                    POST
                  </span>
                  <span className="font-mono text-sm font-semibold text-slate-900 dark:text-white">/api/v1/pipeline/run</span>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">Execute Audit</span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Triggers an automated evaluation scan across specified target prompt queries and AI search engines. Returns real-time citations, rankings, and mention sentiment.
              </p>

              {/* Parameters Table */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden text-xs">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 font-bold text-slate-700 dark:text-slate-300">
                    <tr>
                      <th className="p-3">Field</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">Required</th>
                      <th className="p-3">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-600 dark:text-slate-300">
                    <tr>
                      <td className="p-3 font-mono text-slate-900 dark:text-white">prompt_ids</td>
                      <td className="p-3 font-mono text-slate-500 dark:text-slate-400">string[]</td>
                      <td className="p-3 text-emerald-600 dark:text-emerald-400 font-semibold">Optional</td>
                      <td className="p-3">Array of query IDs to execute. If omitted, evaluates all active tracked queries.</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono text-slate-900 dark:text-white">engines</td>
                      <td className="p-3 font-mono text-slate-500 dark:text-slate-400">string[]</td>
                      <td className="p-3 text-emerald-600 dark:text-emerald-400 font-semibold">Optional</td>
                      <td className="p-3">
                        Engines to query: <code className="font-mono text-slate-800 dark:text-slate-200">&quot;chatgpt&quot;</code>, <code className="font-mono text-slate-800 dark:text-slate-200">&quot;perplexity&quot;</code>, <code className="font-mono text-slate-800 dark:text-slate-200">&quot;google_ai&quot;</code>, <code className="font-mono text-slate-800 dark:text-slate-200">&quot;claude&quot;</code>.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <DocsCodeSnippet
                curl={`curl -X POST "https://vaatify-geo-engine.fly.dev/api/v1/pipeline/run" \\
  -H "x-api-key: geo_your_api_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{"engines": ["chatgpt", "perplexity", "google_ai"]}'`}
                python={`import requests

payload = {
    "engines": ["chatgpt", "perplexity", "google_ai"]
}
response = requests.post(
    "https://vaatify-geo-engine.fly.dev/api/v1/pipeline/run",
    headers={"x-api-key": "geo_your_api_key_here"},
    json=payload
)
print(response.json())`}
                node={`const response = await fetch("https://vaatify-geo-engine.fly.dev/api/v1/pipeline/run", {
  method: "POST",
  headers: {
    "x-api-key": "geo_your_api_key_here",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    engines: ["chatgpt", "perplexity", "google_ai"]
  })
});
const result = await response.json();
console.log(result);`}
                response={`{
  "status": "completed",
  "run_id": "run_9824f1ac",
  "evaluated_queries": 15,
  "engines_scanned": ["chatgpt", "perplexity", "google_ai"],
  "brand_cited_count": 12,
  "share_of_voice": 0.80,
  "competitor_flips_detected": 0
}`}
              />
            </section>

            {/* 5. Endpoint: Metrics & Overview */}
            {/* 5. Endpoint: Metrics & Overview */}
            <section id="metrics" className="scroll-mt-24 space-y-4 pt-8 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <span className="inline-block px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-mono text-xs font-bold mr-2">
                    GET
                  </span>
                  <span className="font-mono text-sm font-semibold text-slate-900 dark:text-white">/api/v1/metrics/overview</span>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">Analytics</span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Calculates aggregate Share of Voice (SoV), overall citation volume, competitor displacement flips, and average recommendation rank depth.
              </p>

              <DocsCodeSnippet
                curl={`curl -X GET "https://vaatify-geo-engine.fly.dev/api/v1/metrics/overview" \\
  -H "x-api-key: geo_your_api_key_here"`}
                python={`import requests

response = requests.get(
    "https://vaatify-geo-engine.fly.dev/api/v1/metrics/overview",
    headers={"x-api-key": "geo_your_api_key_here"}
)
print(response.json())`}
                node={`const response = await fetch("https://vaatify-geo-engine.fly.dev/api/v1/metrics/overview", {
  headers: { "x-api-key": "geo_your_api_key_here" }
});
const metrics = await response.json();
console.log(metrics);`}
                response={`{
  "overall_sov": 0.648,
  "total_runs": 1248,
  "brand_citations": 809,
  "competitor_citations": 439,
  "recent_flips": [
    {
      "prompt": "best crm for sales automation",
      "engine": "chatgpt",
      "previous_winner": "yourcompany.com",
      "new_winner": "competitoralpha.com",
      "detected_at": "2026-10-24T08:30:00Z"
    }
  ]
}`}
              />
            </section>

            {/* 6. Endpoint: Evaluation History */}
            <section id="runs-history" className="scroll-mt-24 space-y-4 pt-8 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <span className="inline-block px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-mono text-xs font-bold mr-2">
                    GET
                  </span>
                  <span className="font-mono text-sm font-semibold text-slate-900 dark:text-white">/api/v1/runs</span>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">Historical Audits</span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Returns paginated historical evaluation records, including the synthesized answer text, cited URLs, and engine response timestamps.
              </p>
            </section>

            {/* 7. Endpoint: Brand Profile */}
            <section id="brand-profile" className="scroll-mt-24 space-y-4 pt-8 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <span className="inline-block px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 font-mono text-xs font-bold mr-2">
                    GET &amp; POST
                  </span>
                  <span className="font-mono text-sm font-semibold text-slate-900 dark:text-white">/api/v1/profile</span>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">Workspace Settings</span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Configure your tracked brand name, primary website domain, and named competitor domains for Share of Voice comparisons.
              </p>
            </section>

            {/* 8. Endpoint: Copilot Assistant */}
            <section id="copilot" className="scroll-mt-24 space-y-4 pt-8 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <span className="inline-block px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 font-mono text-xs font-bold mr-2">
                    POST
                  </span>
                  <span className="font-mono text-sm font-semibold text-slate-900 dark:text-white">/api/v1/agent/chat</span>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">AI Copilot</span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Send prompts to the Vaatify GEO Copilot to diagnose why specific buyer queries omit your brand and generate targeted content optimization recommendations.
              </p>
            </section>

            {/* 9. Errors & Status Codes */}
            <section id="errors" className="scroll-mt-24 space-y-4 pt-8 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                  <ShieldCheck className="h-4 w-4" />
                </span>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">HTTP Status Codes &amp; Errors</h2>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Standard HTTP response codes indicate whether an API request succeeded or failed.
              </p>

              <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden text-xs">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 font-bold text-slate-700 dark:text-slate-300">
                    <tr>
                      <th className="p-3">Status Code</th>
                      <th className="p-3">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-600 dark:text-slate-300">
                    <tr>
                      <td className="p-3 font-mono font-bold text-emerald-700 dark:text-emerald-400">200 OK</td>
                      <td className="p-3">Request succeeded. Response body contains requested resource or execution results.</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono font-bold text-amber-700 dark:text-amber-400">401 Unauthorized</td>
                      <td className="p-3">Missing or invalid <code className="font-mono text-slate-800 dark:text-slate-200">x-api-key</code> request header.</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono font-bold text-amber-700 dark:text-amber-400">422 Unprocessable</td>
                      <td className="p-3">Validation error in JSON request payload. Check field types and required properties.</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono font-bold text-red-700 dark:text-red-400">500 Server Error</td>
                      <td className="p-3">Internal engine error. Automated alerting notifies our engineering on-call.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
