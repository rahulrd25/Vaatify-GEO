# Vaatify GEO (Generative Engine Optimization)

**Vaatify GEO** (`geo.vaatify.com`) is an enterprise AI Search Visibility & Generative Engine Optimization platform. Vaatify GEO monitors brand citations, measures Share of Voice (SoV) across AI search engines (ChatGPT, Perplexity, Gemini, Claude), benchmarks against competitors, and provides autonomous AI Copilot recommendations to win top citation spots.


## Features

- **AI Search Monitoring**: Track brand visibility, sentiment, and citations across LLM prompts.
- **Share of Voice (SoV) Analytics**: Calculate brand vs competitor share of voice across prompt clusters.
- **GEO Content Audit**: Evaluate content against AI citation heuristics (structured tables, quantitative evidence, entity clarity, schema).
- **Competitor Benchmarking**: Compare citation rates and reference sources against competitors.
- **Optimization Action Engine**: Generate targeted recommendations and content rewrites to maximize LLM citations.

## Quickstart

### 1. Install Dependencies
```bash
uv sync
```

### 2. Run Tests
```bash
uv run --offline pytest -o pythonpath=.
```

### 3. Start Development Server
```bash
uv run uvicorn app.main:app --port 8005 --reload
```
