# ==============================================================================
# Full Browser Container for Vaatify GEO Engine
# Tailored for Railway, Render, Fly.io, and Cloud Run
# Pre-bakes Python 3.12, Playwright, and Headless Chromium with all OS dependencies.
# ==============================================================================

FROM mcr.microsoft.com/playwright/python:v1.49.1-noble

# Prevent python from buffering stdout/stderr and writing bytecode
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONPATH=/app \
    PORT=8000 \
    PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

WORKDIR /app

# Install Astral uv for ultra-fast, reproducible dependency management
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Copy dependency specifications first for Docker layer caching
COPY pyproject.toml uv.lock* /app/

# Install dependencies into a dedicated virtual environment
RUN uv sync --frozen --no-dev --no-install-project

# Add virtual environment binaries (uvicorn, alembic, python) to PATH
ENV PATH="/app/.venv/bin:$PATH"

# Ensure Chromium browser binary matches the installed playwright revision
RUN playwright install chromium

# Copy configuration and application source code
COPY alembic.ini /app/
COPY config/ /app/config/
COPY src/ /app/src/
COPY app/ /app/app/

# Expose default HTTP port
EXPOSE 8000

# Container health probe checking the public /health route
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
    CMD python3 -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:' + '${PORT:-8000}' + '/health')" || exit 1

# Launch Uvicorn dynamically binding to $PORT (injected by Railway / Render)
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
