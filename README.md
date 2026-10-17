# Vaatify GEO — Generative Engine Optimization & AI Visibility Engine

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Python 3.12+](https://img.shields.io/badge/python-3.12+-blue.svg)](https://www.python.org/downloads/)
[![Next.js 16](https://img.shields.io/badge/Next.js-16.3-black.svg)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg)](https://fastapi.tiangolo.com/)
[![Tests](https://img.shields.io/badge/tests-43%20passed-brightgreen.svg)]()

**Vaatify GEO** (`geo.vaatify.com`) is an enterprise-grade AI Search Visibility & Generative Engine Optimization platform. It continuously tracks brand citations, measures real-time Share of Voice (SoV) across AI search engines (ChatGPT, Perplexity, Gemini, Claude), benchmarks against competitors, and provides autonomous AI Copilot strategies to win top citation placements in AI answers.

---

## Key Capabilities

* **Multi-Engine AI Search Monitoring**: Multi-threaded parallel collectors across Perplexity Sonar, Gemini Grounded Search, Claude, OpenAI Search, and Playwright headless browsers.
* **Share of Voice (SoV) Intelligence**: Granular brand citation rates, engine-by-engine breakdown, citation flips detection, and competitor dominance scoring.
* **Autonomous GEO Copilot**: AI optimization agent providing actionable content recommendations, structural schema fixes, and citation strategies with prompt-injection guardrails.
* **Continuous Background Scheduler**: Autonomous monitoring pipeline running scheduled evaluations and drift detection alerts.
* **Production-Grade Microservices Architecture**: Decoupled Next.js 16 dashboard with built-in same-origin reverse proxy, modular FastAPI routers, and resilient database connection management (PostgreSQL / Supabase + SQLite fallback).

---

## Architecture Overview

```
                                      ┌────────────────────────────────────────┐
                                      │   Next.js 16 Dashboard (Port 3000)     │
                                      │  (Overview, Queries, Explorer, Agent)  │
                                      └──────────────────┬─────────────────────┘
                                                         │ Same-origin /api rewrites
                                                         ▼
                                      ┌────────────────────────────────────────┐
                                      │     FastAPI Gateway (Port 8005)        │
                                      │  (Rate Limiter, API Key Auth, CORS)    │
                                      └───────┬────────────────────────┬───────┘
                                              │                        │
                    ┌─────────────────────────┴────────┐       ┌───────┴────────────────────────┐
                    │       Modular Domain Routers     │       │     AI Search Connectors       │
                    ├──────────────────────────────────┤       ├────────────────────────────────┤
                    │ • /metrics  - SoV & Flips        │       │ • Perplexity Sonar API         │
                    │ • /prompts  - Query Management   │       │ • Google Gemini Grounded       │
                    │ • /pipeline - Multi-Engine Exec  │       │ • Anthropic Claude             │
                    │ • /profile  - Brand & Comps      │       │ • OpenAI Search                │
                    │ • /copilot  - AI Agent & Defense │       │ • Playwright Browser Collector │
                    │ • /schedule - Cron Automation    │       └────────────────────────────────┘
                    └─────────────────┬────────────────┘
                                      │
                                      ▼
                        ┌───────────────────────────┐
                        │   Storage & Persistence   │
                        ├───────────────────────────┤
                        │ Primary: Supabase Postgres│
                        │ Fallback: SQLite Demo DB  │
                        └───────────────────────────┘
```

---

## Directory Structure

```
├── app/
│   └── main.py                     # Minimal ASGI application entrypoint
├── config/
│   ├── competitors.yaml            # Tracked competitor definitions
│   └── prompts.yaml                # Monitored query prompts & intent categories
├── frontend/                       # Next.js 16 Web Dashboard
│   ├── src/app/                    # App Router pages & layouts
│   ├── src/components/             # UI views (Overview, Queries, Agent, Charts)
│   ├── src/lib/api.ts              # API client & reverse proxy helper
│   └── next.config.ts              # Rewrite proxy & compiler configuration
├── src/geo_tracker/
│   ├── agent/                      # Autonomous Copilot service & safety guardrails
│   ├── aggregation/                # Share of Voice & citation flip calculators
│   ├── api/
│   │   ├── middleware/             # Production/development CORS & security
│   │   ├── routers/                # Modular domain routers (metrics, pipeline, etc.)
│   │   └── security/               # API key verification & sliding-window rate limiters
│   ├── classification/             # JEV & domain matching algorithms
│   ├── connectors/                 # LLM & AI search engine collectors
│   ├── scheduler/                  # Background monitoring scheduler
│   └── storage/                    # SQLAlchemy models, migrations, & session manager
└── tests/                          # Comprehensive pytest test suite (43 tests)
```

---

## Quickstart & Local Setup

### Prerequisites

* **Python 3.12+** with [`uv`](https://github.com/astral-sh/uv) installed
* **Node.js 18+** & `npm`

### 1. Clone & Configure Environment

```bash
git clone https://github.com/rahulrd25/Vaatify-GEO.git
cd Vaatify-GEO

# Backend environment configuration
cp .env.example .env

# Frontend environment configuration
cd frontend && cp .env.example .env.local && cd ..
```

Edit `.env` with your API keys:
```ini
API_KEY=your_secure_api_key
DATABASE_URL=postgresql://user:pass@host:5432/postgres  # Or leave empty for local SQLite
PERPLEXITY_API_KEY=pplx-...
GEMINI_API_KEY=...
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-proj-...
ENV=development
```

### 2. Backend Setup & Run

```bash
# Install Python dependencies
uv sync

# Run database checks & migrations
uv run python -c "from src.geo_tracker.storage.migrations import run_startup_checks_and_migrations; run_startup_checks_and_migrations()"

# Start FastAPI backend (Port 8005)
uv run uvicorn app.main:app --port 8005 --reload
```

* Swagger UI: [http://localhost:8005/docs](http://localhost:8005/docs)
* Health Probe: [http://localhost:8005/health](http://localhost:8005/health)

### 3. Frontend Dashboard Setup & Run

In a separate terminal:

```bash
cd frontend
npm install
npm run dev -- --port 3000
```

* Dashboard: [http://localhost:3000](http://localhost:3000)

---

## Testing & Quality Assurance

### Run Backend Unit & Integration Tests

```bash
uv run --offline pytest tests/ -o pythonpath=.
```

### Run Frontend Static Type Checks

```bash
cd frontend && npx tsc --noEmit
```

---

## API Endpoints Reference

All `/api/v1/*` endpoints require the `X-API-Key` header.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Public health check probe |
| `GET` | `/api/v1/status` | Protected authentication validation |
| `GET` | `/api/v1/metrics/overview` | Overall Share of Voice, per-engine metrics, competitor rankings |
| `GET` | `/api/v1/runs` | Paginated citation evaluations across search engines |
| `GET` | `/api/v1/prompts` | Monitored query list with intent classification |
| `POST` | `/api/v1/prompts` | Add a new target query prompt |
| `POST` | `/api/v1/pipeline/run` | Trigger evaluation across active search engines |
| `POST` | `/api/v1/agent/chat` | Interact with the AI Copilot (with prompt injection defense) |
| `GET` | `/api/v1/schedule/status` | Background monitoring scheduler status |
| `POST` | `/api/v1/schedule/trigger` | Manually invoke scheduled evaluation job |

---

## Security Model

* **Constant-Time Key Verification**: All API key validations use `secrets.compare_digest` to prevent timing attacks.
* **Sliding-Window Rate Limiting**: In-memory rate limiting applied to execution and copilot endpoints to prevent quota exhaustion.
* **Strict Production CORS**: Development allows local origins, while production strictly enforces explicit whitelisting via `ALLOWED_ORIGINS`.
* **Zero Hardcoded Secrets**: All keys, database connections, and documentation passwords require runtime environment injection.
* **Prompt Injection Guardrails**: Strict input sanitization patterns and length bounds applied before sending user inputs to LLM agents.

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
