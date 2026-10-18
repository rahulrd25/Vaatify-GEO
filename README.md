# Vaatify GEO — Generative Engine Optimization & AI Visibility Engine

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Python 3.12+](https://img.shields.io/badge/python-3.12+-blue.svg)](https://www.python.org/downloads/)
[![Next.js 16](https://img.shields.io/badge/Next.js-16.3-black.svg)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg)](https://fastapi.tiangolo.com/)
[![Alembic](https://img.shields.io/badge/Alembic-1.14+-red.svg)](https://alembic.sqlalchemy.org/)
[![Tests](https://img.shields.io/badge/tests-62%20passed-brightgreen.svg)]()

**Vaatify GEO** (`geo.vaatify.com`) is an enterprise-grade AI Search Visibility & Generative Engine Optimization platform. It continuously tracks brand citations, measures real-time Share of Voice (SoV) across AI search engines (ChatGPT, Perplexity, Gemini, Claude), benchmarks against competitors, and provides autonomous AI Copilot strategies to win top citation placements in AI answers.

---

## Key Capabilities

* **Multi-Tenant Account Partitioning**: Complete tenant isolation where brand profiles, target prompts, evaluation runs, drift alerts, and Copilot history are partitioned by `user_id` and `brand_id` with foreign-key cascade deletes.
* **Cryptographic Supabase JWT Authentication**: Direct verification of Supabase Bearer JWTs supporting local constant-time HMAC-SHA256 signature checking (`SUPABASE_JWT_SECRET`) and Supabase Auth API validation with in-memory TTL caching.
* **Automated User Onboarding**: Zero-friction onboarding detecting company brand names and domains directly from corporate work emails (filtering public webmail providers), with Copilot-suggested buyer search queries.
* **Multi-Engine AI Search Monitoring**: Multi-threaded parallel collectors across Perplexity Sonar, Gemini Grounded Search, Claude, OpenAI Search, and Playwright headless browsers.
* **Share of Voice (SoV) Intelligence**: Granular brand citation rates, engine-by-engine breakdown, citation flips detection, and competitor dominance scoring.
* **Autonomous GEO Copilot**: AI optimization agent providing actionable content recommendations, structural schema fixes, and citation strategies with prompt-injection guardrails.
* **Automated Background Scheduler**: Continuous evaluation scheduler with concurrency semaphore limits and staggered tenant dispatch.
* **Automated Database Migrations**: 100% production schema lifecycle managed through Alembic, running and verifying schema updates to `head` automatically on application startup.

---

## Architecture Overview

```
                                    ┌────────────────────────────────────────┐
                                    │    Next.js 16 Dashboard (Port 3000)    │
                                    │  (Auth, Onboarding, Agent, Overview)   │
                                    └──────────────────┬─────────────────────┘
                                                       │ Headers: Authorization: Bearer <jwt>
                                                       │          X-API-Key: <key>
                                                       ▼
                                    ┌────────────────────────────────────────┐
                                    │      FastAPI Gateway (Port 8005)       │
                                    │  (JWT Verifier, Rate Limiter, CORS)    │
                                    └───────┬────────────────────────┬───────┘
                                            │                        │
                  ┌─────────────────────────┴────────┐       ┌───────┴────────────────────────┐
                  │       Modular Domain Routers     │       │     AI Search Connectors       │
                  ├──────────────────────────────────┤       ├────────────────────────────────┤
                  │ • /onboarding - Brand Setup      │       │ • Perplexity Sonar API         │
                  │ • /metrics    - SoV & Flips      │       │ • Google Gemini Grounded       │
                  │ • /prompts    - Query Management │       │ • Anthropic Claude             │
                  │ • /pipeline   - Multi-Engine Run │       │ • OpenAI Search                │
                  │ • /profile    - Brand & Comps    │       │ • Playwright Browser Collector │
                  │ • /copilot    - AI Agent Defense │       └────────────────────────────────┘
                  │ • /schedule   - Cron Automation  │
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
├── frontend/                       # Next.js 16 Web Dashboard
│   ├── src/app/                    # App Router pages & layout
│   ├── src/components/
│   │   ├── auth/                   # Supabase authentication view
│   │   ├── onboarding/             # Step-by-step brand onboarding wizard
│   │   ├── views/                  # Tabbed views (Overview, Queries, Explorer, Settings, Agent)
│   │   └── AgentCopilot.tsx        # Interactive AI advisory copilot
│   ├── src/context/AuthContext.tsx # Supabase Auth state & session token provider
│   ├── src/lib/api.ts              # API URL helper & getAuthHeaders factory
│   └── src/lib/emailDomain.ts      # Work email domain & brand extraction
├── src/geo_tracker/
│   ├── agent/                      # Autonomous Copilot service & safety guardrails
│   ├── aggregation/                # Share of Voice & citation flip calculators
│   ├── api/
│   │   ├── middleware/             # Production/development CORS configuration
│   │   ├── routers/                # Modular domain routers (onboarding, metrics, copilot, etc.)
│   │   ├── security/               # Cryptographic JWT verifier, API key auth, rate limiter
│   │   └── utils/                  # Tenant resolution & email domain parser
│   ├── classification/             # JEV & domain matching algorithms
│   ├── connectors/                 # LLM & AI search engine collectors
│   ├── scheduler/                  # Background monitoring scheduler engine
│   └── storage/
│       ├── migrations/             # Alembic migration environment & versions (001_initial_schema.py)
│       ├── models.py               # Multi-tenant SQLAlchemy models
│       ├── session.py              # Engine factory, health checks, & startup migration runner
│       └── repository.py           # Database persistence repository
└── tests/                          # 62 unit & integration tests (100% passing)
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
SUPABASE_JWT_SECRET=your_jwt_secret_for_local_hmac   # Optional (falls back to Supabase Auth API)

# AI Search Engine APIs
PERPLEXITY_API_KEY=pplx-...
GEMINI_API_KEY=...
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-proj-...
TYPESAFE_API_KEY=...
```

### 2. Run the Backend

```bash
# Install dependencies
uv sync

# Start FastAPI server (database migrations run automatically to head on startup)
uv run uvicorn app.main:app --host 127.0.0.1 --port 8005 --reload
```

* Swagger API Documentation: [http://localhost:8005/docs](http://localhost:8005/docs)
* Health Probe: [http://localhost:8005/health](http://localhost:8005/health)

### 3. Run the Frontend Dashboard

In a separate terminal:

```bash
cd frontend
npm install
npm run dev -- --port 3000
```

* Web Dashboard: [http://localhost:3000](http://localhost:3000)

---

## Testing & Quality Assurance

### Run Test Suite (62 Tests)

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

## API Endpoints Reference

All `/api/v1/*` endpoints require the `X-API-Key` header and accept `Authorization: Bearer <jwt_token>`.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Public health check probe |
| `GET` | `/api/v1/status` | Protected status check |
| `GET` | `/api/v1/onboarding/parse-email` | Parse corporate work email for company domain |
| `POST` | `/api/v1/onboarding/suggest-queries` | Generate high-intent buyer queries for brand |
| `GET` | `/api/v1/onboarding/status` | Check tenant onboarding & brand account status |
| `POST` | `/api/v1/onboarding/complete` | Complete onboarding & persist brand profile |
| `GET` | `/api/v1/profile` | Get active tenant brand profile & competitor matrix |
| `PUT` | `/api/v1/profile` | Update tenant brand profile & competitor domains |
| `GET` | `/api/v1/prompts` | List tenant target queries with intent classification |
| `POST` | `/api/v1/prompts` | Add a new monitored query prompt |
| `DELETE`| `/api/v1/prompts/{id}` | Deactivate/remove a monitored prompt |
| `GET` | `/api/v1/metrics/overview` | Overall Share of Voice, per-engine metrics, competitors |
| `GET` | `/api/v1/runs` | Paginated citation evaluations across search engines |
| `POST` | `/api/v1/pipeline/run` | Trigger evaluation across active search engines |
| `POST` | `/api/v1/agent/chat` | AI Copilot advisory chat (with prompt injection defense) |
| `GET` | `/api/v1/schedule` | Get automated monitoring schedule for tenant |
| `PUT` | `/api/v1/schedule` | Update automated monitoring frequency (daily, weekly, manual) |
| `POST` | `/api/v1/schedule/trigger` | Manually dispatch scheduled evaluation audit |

---

## Security Model

* **Cryptographic JWT Verification**: Enforces Supabase Bearer token verification using constant-time HMAC-SHA256 checking or direct Supabase Auth validation. Spoofed client headers are neutralized.
* **Strict Multi-Tenant Isolation**: Queries and data operations are strictly scoped to the authenticated tenant (`user_id` / `brand_id`).
* **Constant-Time Key Verification**: All API key validations use `secrets.compare_digest` to prevent timing attacks.
* **Sliding-Window Rate Limiting**: In-memory sliding window rate limiters protect execution, copilot, and crawl endpoints.
* **Prompt Injection Defense**: Sanitization and input validation guardrails protect AI Copilot agents against adversarial instruction override.
* **Strict CORS Policy**: Production enforces explicit origin whitelisting (`ALLOWED_ORIGINS`).

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
