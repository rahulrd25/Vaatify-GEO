# Vaatify — Next.js 16 Web Application (vaatify.com)

This is the official web frontend and user-facing application for **Vaatify** ([vaatify.com](https://vaatify.com)).

It unifies the **Marketing & Educational Surface** (landing page, solutions, pricing, documentation, MDX blog, and interactive ROI calculator) with the **SaaS Product Platform** (Supabase authentication, multi-tenant brand onboarding wizard, real-time Share of Voice dashboard, and autonomous AI Copilot).

---

## Architecture & Route Groups

Built with **Next.js 16 (App Router)** and **Tailwind CSS / Vanilla styling tokens**:

* `src/app/(marketing)/` — Public-facing SEO pages:
  - `/` — Homepage with interactive value propositions, engine matrix, and dynamic live previews
  - `/solutions` — Platform feature breakdowns and use-cases
  - `/pricing` — Clear pricing tiers (Starter, Growth, Enterprise) with yearly billing discounts
  - `/roi` — Interactive citation ROI & revenue estimator
  - `/docs` — Getting started guide and API documentation
  - `/blog` — MDX-powered technical articles and GEO research
* `src/app/(auth)/` — Supabase authentication:
  - `/login` — Account sign-in with redirect parameter safety
  - `/signup` — Work email registration and verification
* `src/app/dashboard/` — SaaS Product Application:
  - Multi-tenant brand account onboarding wizard
  - Live Share of Voice (SoV) and citation rate gauges
  - Engine-by-engine breakdown (ChatGPT, Perplexity, Gemini, Claude, Google AI Overviews)
  - Competitor citation benchmarking matrix
  - Query management & intent classification
  - Autonomous AI Copilot chat with strategic suggestions
* `src/app/robots.ts` & `src/app/sitemap.ts` — Dynamic Next.js Metadata API generators
* `public/llms.txt` — Structured manifest formatted specifically for AI scrapers and LLMs
* `src/middleware.ts` — Edge middleware validating sessions with `@supabase/ssr`

---

## Local Development

### 1. Environment Variables

Create `.env.local` inside `frontend/`:

```ini
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_API_URL=http://127.0.0.1:8005
```

### 2. Install & Run

```bash
npm install
npm run dev -- --port 3000
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Verification & Quality Checks

Before committing or pushing changes:

```bash
# Type check TypeScript code
npx tsc --noEmit

# Run ESLint
npm run lint

# Build production bundle
npm run build
```
