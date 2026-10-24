# Vaatify — Generative Engine Optimization & AI Visibility Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Python 3.12+](https://img.shields.io/badge/python-3.12+-blue.svg)](https://www.python.org/downloads/)
[![Next.js 16](https://img.shields.io/badge/Next.js-16.3-black.svg)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg)](https://fastapi.tiangolo.com/)
[![Alembic](https://img.shields.io/badge/Alembic-1.14+-red.svg)](https://alembic.sqlalchemy.org/)
[![Tests](https://img.shields.io/badge/tests-73%20passed-brightgreen.svg)]()

**Vaatify** ([vaatify.com](https://vaatify.com)) is the unified product platform and Generative Engine Optimization (GEO) intelligence engine for modern brands. It continuously tracks brand citations, measures real-time Share of Voice (SoV) across commercial AI engines (ChatGPT, Perplexity, Gemini, Claude, and Google AI Overviews), benchmarks against competitors, and provides autonomous AI Copilot strategies to win top recommendation placements in AI search results.

The platform unifies the **Vaatify Web Presence & Marketing Surface** (high-performance SEO, documentation, pricing, interactive ROI calculator, MDX technical blog, LLM-crawling manifest, and dynamic sitemaps) with the **Full SaaS Product Application** (authentication, multi-tenant onboarding wizard, live analytics overview, citation drift alerts, and autonomous Copilot).

---

## Key Capabilities

* **Unified Product Platform (`vaatify.com`)**: Product-led design seamlessly linking educational resources, pricing, interactive ROI estimators, and live product onboarding into a single cohesive experience.
* **Multi-Engine AI Search Monitoring**: Multi-threaded collectors tracking queries across Perplexity Sonar, Google Gemini Grounded Search, Anthropic Claude, OpenAI Search, and Playwright headless browser collectors for Google AI Overviews.
* **Cryptographic In-Memory JWT Authentication**: Sub-millisecond (<0.1ms) Bearer token verification using local constant-time HMAC-SHA256 signature checking (`SUPABASE_JWT_SECRET`) with automatic fallback to Supabase Auth API validation and TTL caching.
* **Multi-Tenant Account Partitioning**: Complete tenant isolation where brand profiles, target prompts, evaluation runs, drift alerts, and Copilot history are strictly partitioned by `user_id` and `brand_id` with foreign-key cascade deletes.
* **Automated User Onboarding**: Frictionless brand detection extracting company brand names and domains directly from corporate work emails (filtering public webmail providers), paired with AI Copilot suggested buyer queries.
* **Share of Voice (SoV) & Citation Intelligence**: Granular brand citation rates, engine-by-engine breakdown, competitor dominance scoring, and real-time detection of citation flips.
* **Autonomous GEO Copilot**: Proactive AI optimization agent providing actionable content recommendations, structured schema fixes, and citation gap strategies with strict prompt-injection guardrails.
* **Machine-Readable LLM & SEO Optimization**: Features native `/llms.txt`, programmatic `/robots.txt` via Next.js Metadata API, dynamic XML sitemaps (`/sitemap.xml`), and structured OpenGraph metadata.
* **Automated Background Scheduler**: Continuous evaluation scheduler with concurrency semaphore limits and staggered tenant dispatch.
* **Self-Migrating Database**: 100% production schema lifecycle managed through Alembic, running and verifying schema updates to `head` automatically on application boot.

---

## Architecture Overview

```
                                    ┌─────────────────────────────────────────────────────────┐
                                    │               Next.js 16 Web Application                │
                                    │                      (vaatify.com)                      │
                                    ├────────────────────────────┬────────────────────────────┤
                                    │    Marketing & SEO Surface │    SaaS Product Dashboard  │
                                    │  • / - Landing & Hero      │  • /dashboard - SoV & Runs │
                                    │  • /pricing, /solutions    │  • /login, /signup         │
                                    │  • /docs, /blog (MDX)      │  • Step Wizard Onboarding  │
                                    │  • /roi - ROI Calculator   │  • Agent Copilot Advisory  │
                                    │  • /llms.txt, /robots.txt  │  • Competitor Matrix       │
                                    └─────────────┬──────────────┴─────────────┬──────────────┘
                                                  │                            │
                                                  │ Requests: Bearer <jwt>     │
                                                  │           X-API-Key        │
                                                  ▼                            ▼
                                    ┌─────────────────────────────────────────────────────────┐
                                    │               FastAPI Gateway & Engine                  │
                                    │       (HMAC JWT Verifier, Rate Limiter, CORS)           │
                                    └─────────────┬────────────────────────────┬──────────────┘
                                                  │                            │
                        ┌─────────────────────────┴────────┐         ┌─────────┴────────────────────────┐
                        │       Modular Domain Routers     │         │       AI Search Connectors       │
                        ├──────────────────────────────────┤         ├──────────────────────────────────┤
                        │ • /onboarding - Brand Setup      │         │ • Perplexity Sonar API           │
                        │ • /metrics    - SoV & Flips      │         │ • Google Gemini Grounded Search  │
                        │ • /prompts    - Query Management │         │ • Anthropic Claude 3.5           │
                        │ • /pipeline   - Multi-Engine Run │         │ • OpenAI Search Models           │
                        │ • /profile    - Brand & Comps    │         │ • Playwright Browser Collector   │
                        │ • /copilot    - Autonomous Agent │         │   (Google AI Overviews)          │
                        │ • /schedule   - Cron Automation  │         └──────────────────────────────────┘
                        └─────────────────┬────────────────┘
                                          │
                                          ▼
                            ┌───────────────────────────┐
                            │    PostgreSQL (Supabase)  │
                            ├───────────────────────────┤
                            │ • brand_profiles (user_id)│
                            │ • competitors (brand_id)  │
                            │ • prompts (brand_id)      │
                            │ • runs (FK prompt_id)     │
                            │ • drift_alerts            │
                            │ • agent_recommendations   │
                            │ • monitoring_schedules    │
                            └───────────────────────────┘
```

---

## Directory Structure

```
├── alembic.ini                     # Alembic database migration configuration
├── app/
│   └── main.py                     # Minimal ASGI application entrypoint
├── config/
│   ├── competitors.yaml            # Fallback benchmark competitor definitions
│   └── prompts.yaml                # Monitored query templates & intent categories
├── frontend/                       # Next.js 16 Web Application (vaatify.com)
│   ├── content/blog/               # MDX technical blog posts & GEO research
│   ├── public/                     # Static assets & llms.txt AI crawler manifest
│   ├── src/app/
│   │   ├── (auth)/                 # Auth routes (/login, /signup)
│   │   ├── (marketing)/            # Marketing routes (/, /pricing, /solutions, /docs, /blog, /roi)
│   │   ├── dashboard/              # Full SaaS Product Dashboard (/dashboard)
│   │   ├── robots.ts               # Programmatic Next.js Metadata robots.txt
│   │   └── sitemap.ts              # Programmatic Next.js XML sitemap generator
│   ├── src/components/
│   │   ├── auth/                   # Supabase authentication views
│   │   ├── dashboard/              # Product dashboard components & tab views
│   │   ├── marketing/              # Marketing navigation, hero, pricing, & ROI calculator
│   │   └── onboarding/             # Step-by-step corporate brand setup wizard
│   ├── src/lib/
│   │   ├── api.ts                  # API client & auth headers factory
│   │   ├── blog.ts                 # MDX file reading and metadata parser
│   │   └── supabase/               # Browser & server Supabase SSR clients
│   └── src/proxy.ts                # Next.js 16 network proxy & Edge session refresh
├── src/geo_tracker/
│   ├── agent/                      # Autonomous Copilot service & safety guardrails
│   ├── aggregation/                # Share of Voice & citation flip calculators
│   ├── api/
│   │   ├── middleware/             # Production/development CORS configuration
│   │   ├── routers/                # Modular domain routers (onboarding, metrics, copilot, etc.)
│   │   ├── security/               # Cryptographic JWT verifier, API key auth, bounded rate limiter
│   │   └── utils/                  # Tenant resolution & email domain parser
│   ├── classification/             # JEV & domain matching algorithms
│   ├── connectors/                 # Commercial LLM & AI search engine collectors
│   ├── scheduler/                  # Background monitoring scheduler engine
│   └── storage/
│       ├── migrations/             # Alembic migration environment & versions
│       ├── models.py               # Multi-tenant SQLAlchemy models
│       ├── session.py              # Engine factory, health checks, & startup migration runner
│       └── repository.py           # Database persistence repository
└── tests/                          # 73 unit & integration tests (100% passing)
    ├── unit/
    │   ├── test_security_audit_regressions.py  # Security regression tests & static pre-push scanners
    │   └── test_multi_tenant_isolation.py      # Account boundary verification
    └── integration/
```

---

## Quickstart & Local Setup

### Prerequisites

* **Python 3.12+** with [`uv`](https://github.com/astral-sh/uv)
* **Node.js 18+** & `npm`
* **Supabase** project (PostgreSQL + Auth)

### 1. Environment Setup

```bash
# Clone repository
git clone https://github.com/rahulrd25/Vaatify-GEO.git
cd Vaatify-GEO

# Backend environment configuration
cp .env.example .env
```

Configure `.env`:
```ini
API_KEY=your_secure_api_key
ENV=development

# Database & Supabase
DATABASE_URL=postgresql://postgres:password@db.xxxx.supabase.co:5432/postgres
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_JWT_SECRET=your_supabase_jwt_secret   # Enables sub-millisecond local HMAC verification

# AI Search Engine APIs
PERPLEXITY_API_KEY=pplx-...
GEMINI_API_KEY=...
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-proj-...
TYPESAFE_API_KEY=...
```

### 2. Run the Backend API

```bash
# Install dependencies
uv sync

# Start FastAPI server (database migrations execute automatically to head on startup)
uv run uvicorn app.main:app --host 127.0.0.1 --port 8005 --reload
```

* Swagger API Documentation: [http://localhost:8005/docs](http://localhost:8005/docs)
* Health Probe: [http://localhost:8005/health](http://localhost:8005/health)

### 3. Run the Frontend (Web Presence & SaaS Dashboard)

In a separate terminal:

```bash
cd frontend
npm install
npm run dev -- --port 3000
```

* Web Application: [http://localhost:3000](http://localhost:3000)
* Marketing & SEO Surface: [http://localhost:3000/](http://localhost:3000/)
* Product Dashboard: [http://localhost:3000/dashboard](http://localhost:3000/dashboard)

---

## Testing & Quality Assurance

Our CI/CD pipeline enforces static analysis, security scans, and 100% test passing before code changes can be merged.

### Run Backend & Security Test Suite (73 Tests)

```bash
PYTHONPATH=. uv run pytest tests/
```

### Run Frontend Static Type Checks & Linting

```bash
cd frontend
npx tsc --noEmit
npm run lint
```

---

## Security Architecture

* **Cryptographic In-Memory JWT Verification**: Verifies incoming Supabase Bearer tokens using constant-time HMAC-SHA256 checking against `SUPABASE_JWT_SECRET`. Token tampering is rejected in `<0.1ms` without network overhead.
* **Strict Multi-Tenant Isolation**: Queries and mutations are enforced strictly against `current_user_id` and the tenant's registered `brand_id`.
* **BOLA / IDOR Protection**: Endpoint authorization guards prevent authenticated users from reading, modifying, or overwriting other tenants' brands or prompt recommendations.
* **Constant-Time Key Verification**: All API key validations use `secrets.compare_digest` to prevent timing attacks.
* **DoS & Memory Leak Prevention**: The in-memory sliding-window rate limiter is capped at `10,000` keys with automated periodic pruning of expired timestamps to prevent memory exhaustion attacks.
* **Denial-of-Wallet Guards**: High-cost LLM endpoints (such as onboarding query suggestions) enforce IP-based rate limiting (10 req/min).
* **Open Redirect (CWE-601) Neutralization**: Redirect parameters in authentication flows are validated to reject protocol-relative URLs (`//` and `/\`).
* **OpenAPI Secret Sanitization**: OpenAPI specs (`/docs` and `/openapi.json`) use generic placeholder syntax, ensuring secret keys are never exposed in documentation.
* **Strict Production CORS**: Whitelists only explicit production domains (`https://vaatify.com` and `https://geo.vaatify.com`), blocking wildcard regexes.

---

## Production Deployment

### Backend (Fly.io)

The backend is containerized with Python 3.12, Playwright, and Headless Chromium to execute live AI Overview DOM scraping alongside multi-engine API collectors.

```bash
# Set production secrets
fly secrets set \
  DATABASE_URL="postgresql://..." \
  SUPABASE_URL="https://..." \
  SUPABASE_ANON_KEY="..." \
  SUPABASE_JWT_SECRET="..." \
  API_KEY="..." \
  OPENAI_API_KEY="..." \
  ALLOWED_ORIGINS="https://vaatify.com" \
  --app vaatify-geo-engine

# Deploy
fly deploy
```

### Frontend (Vercel)

The frontend deploys as a Next.js 16 Edge-ready application on Vercel with automatic SSR authentication middleware, static page generation, and ISR for MDX blog posts:

```bash
# Configure Vercel environment variables:
# NEXT_PUBLIC_SUPABASE_URL
# NEXT_PUBLIC_SUPABASE_ANON_KEY
# NEXT_PUBLIC_API_URL=https://vaatify-geo-engine.fly.dev
```

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
