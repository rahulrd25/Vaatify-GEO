"""
Security Audit Regression Test Suite.
Verifies all security fixes and provides automated scanners to prevent:
1. BOLA / Account Takeovers
2. Master API Key leaks in frontend or Swagger OpenAPI specs
3. Unbounded memory leaks in in-memory rate limiters
4. Denial-of-Wallet unauthenticated LLM endpoints
5. Cross-tenant recommendation / data leaks
6. Protocol-relative open redirects (CWE-601)
7. Production environment configuration mismatches
"""
import os
import re
import uuid
import pytest
from pathlib import Path
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from src.geo_tracker.storage.models import Base, BrandProfileModel, PromptModel, AgentRecommendationModel
from src.geo_tracker.storage.session import get_db_session
from src.geo_tracker.api.app import create_app, custom_openapi
from src.geo_tracker.config import is_production
from src.geo_tracker.api.security.api_key import security_settings
from src.geo_tracker.api.security.rate_limiter import InMemoryRateLimiter, rate_limiter

TEST_DB_URL = "sqlite:///test_security_regressions.db"


@pytest.fixture(autouse=True)
def setup_security_test_env(monkeypatch):
    monkeypatch.setenv("DATABASE_URL", TEST_DB_URL)
    monkeypatch.setenv("API_KEY", "geo_audit_master_secret_key_1234567890")
    monkeypatch.setenv("PERPLEXITY_API_KEY", "test-key")
    monkeypatch.setenv("ANTHROPIC_API_KEY", "test-key")
    monkeypatch.setenv("GEMINI_API_KEY", "test-key")
    monkeypatch.setenv("TYPESAFE_API_KEY", "test-key")

    engine = create_engine(TEST_DB_URL, echo=False, connect_args={"check_same_thread": False})
    Base.metadata.create_all(engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    def override_get_db_session():
        db = TestingSessionLocal()
        try:
            yield db
            db.commit()
        except Exception:
            db.rollback()
            raise
        finally:
            db.close()

    app = create_app()
    app.dependency_overrides[get_db_session] = override_get_db_session

    yield {
        "app": app,
        "engine": engine,
        "Session": TestingSessionLocal
    }

    app.dependency_overrides.clear()
    Base.metadata.drop_all(engine)
    if os.path.exists("test_security_regressions.db"):
        try:
            os.remove("test_security_regressions.db")
        except Exception:
            pass


# ==============================================================================
# 1. Environment Detection Tests
# ==============================================================================
def test_is_production_detection(monkeypatch):
    """Verifies that is_production() checks both ENV and ENVIRONMENT accurately."""
    monkeypatch.setenv("ENV", "production")
    monkeypatch.delenv("ENVIRONMENT", raising=False)
    assert is_production() is True

    monkeypatch.delenv("ENV", raising=False)
    monkeypatch.setenv("ENVIRONMENT", "production")
    assert is_production() is True

    monkeypatch.setenv("ENV", "development")
    monkeypatch.setenv("ENVIRONMENT", "staging")
    assert is_production() is False


# ==============================================================================
# 2. BOLA & Onboarding Authorization Tests
# ==============================================================================
def test_onboarding_bola_user_id_mismatch_blocked(setup_security_test_env):
    """Verifies that an authenticated user cannot overwrite or modify another tenant's brand."""
    app = setup_security_test_env["app"]
    client = TestClient(app)

    headers = {
        "X-API-Key": "geo_audit_master_secret_key_1234567890",
        "X-User-Id": "user_alice"
    }

    payload = {
        "user_id": "user_victim_bob",  # Attempting to hijack bob's account
        "brand_name": "Hijacked Brand",
        "brand_domain": "hijacked.com",
        "industry": "Cybersecurity",
        "competitors": [{"name": "Comp1", "domain": "comp1.com"}],
        "prompts": ["Who is the best?"]
    }

    res = client.post("/api/v1/onboarding/complete", json=payload, headers=headers)
    assert res.status_code == 403
    assert "Forbidden" in res.json()["detail"]


def test_onboarding_production_auth_enforced(setup_security_test_env, monkeypatch):
    """Verifies that completing onboarding without authentication in production is rejected with 401."""
    monkeypatch.setenv("ENVIRONMENT", "production")
    app = setup_security_test_env["app"]
    client = TestClient(app)

    headers = {
        "X-API-Key": "geo_audit_master_secret_key_1234567890"
        # No X-User-Id and no Authorization Bearer token
    }

    payload = {
        "brand_name": "Anonymous Brand",
        "brand_domain": "anon.com",
        "industry": "SaaS"
    }

    res = client.post("/api/v1/onboarding/complete", json=payload, headers=headers)
    assert res.status_code == 401
    assert "Authentication required" in res.json()["detail"]


# ==============================================================================
# 3. Denial-of-Wallet & Rate Limiting Tests
# ==============================================================================
def test_onboarding_suggest_queries_rate_limiting(setup_security_test_env):
    """Verifies that /suggest-queries enforces rate limits to prevent DoW attacks."""
    app = setup_security_test_env["app"]
    client = TestClient(app)

    payload = {
        "brand_name": "TestCorp",
        "brand_domain": "testcorp.io",
        "industry": "FinTech"
    }

    # Reset in-memory rate limiter client state
    rate_limiter._history.clear()

    # The limit is 10 requests per minute
    statuses = []
    for _ in range(12):
        res = client.post("/api/v1/onboarding/suggest-queries", json=payload)
        statuses.append(res.status_code)

    assert 429 in statuses
    assert statuses[-1] == 429


# ==============================================================================
# 4. Secret Leakage Prevention in Swagger / OpenAPI
# ==============================================================================
def test_openapi_schema_does_not_leak_master_api_key(setup_security_test_env):
    """Ensures Swagger UI schema does not embed the active security_settings.api_key."""
    app = setup_security_test_env["app"]
    schema = custom_openapi(app)

    schema_str = str(schema)
    secret_key = security_settings.api_key
    assert secret_key not in schema_str
    assert "geo_audit_master_secret_key_1234567890" not in schema_str

    api_scheme = schema["components"]["securitySchemes"]["APIKeyHeader"]
    assert "geo_live_..." in api_scheme["description"]


# ==============================================================================
# 5. Cross-Tenant Recommendation Isolation Tests
# ==============================================================================
def test_recommendations_tenant_isolation(setup_security_test_env):
    """Ensures recommendations generated for Tenant A's prompts are never leaked to Tenant B."""
    app = setup_security_test_env["app"]
    Session = setup_security_test_env["Session"]
    client = TestClient(app)

    db = Session()
    try:
        # Create Prompt for Tenant A
        prompt_a = PromptModel(
            id="prompt_secret_tenant_a",
            user_id="tenant_a",
            prompt_text="Confidential prompt for Tenant A",
            brand="BrandA",
            active=True
        )
        db.add(prompt_a)
        db.flush()

        # Create Recommendation tied to Tenant A's prompt
        rec_a = AgentRecommendationModel(
            id="rec_confidential_a",
            prompt_id=prompt_a.id,
            recommendation_type="content_gap",
            title="Tenant A Private Secret Recommendation",
            suggestion_text="Confidential strategic advisory for Brand A",
            priority="high",
            status="pending"
        )
        db.add(rec_a)
        db.commit()
    finally:
        db.close()

    # Query as Tenant B
    headers_b = {
        "X-API-Key": "geo_audit_master_secret_key_1234567890",
        "X-User-Id": "tenant_b"
    }
    res_b = client.get("/api/v1/agent/recommendations", headers=headers_b)
    assert res_b.status_code == 200
    rec_titles_b = [r["title"] for r in res_b.json()]
    assert "Tenant A Private Secret Recommendation" not in rec_titles_b

    # Query as Tenant A
    headers_a = {
        "X-API-Key": "geo_audit_master_secret_key_1234567890",
        "X-User-Id": "tenant_a"
    }
    res_a = client.get("/api/v1/agent/recommendations", headers=headers_a)
    assert res_a.status_code == 200
    rec_titles_a = [r["title"] for r in res_a.json()]
    assert "Tenant A Private Secret Recommendation" in rec_titles_a


# ==============================================================================
# 6. In-Memory Rate Limiter Memory Leak & Bounds Tests
# ==============================================================================
def test_rate_limiter_memory_exhaustion_protection():
    """Verifies that creating thousands of arbitrary client IDs does not cause unbounded RAM growth."""
    limiter = InMemoryRateLimiter()
    limiter.MAX_TRACKED_KEYS = 50

    # Flood with 100 distinct client identifiers
    for i in range(100):
        limiter.check_rate_limit(client_id=f"ip_{i}", action="test_action", max_requests=10, window_seconds=60)

    # Size must be strictly capped at MAX_TRACKED_KEYS
    assert len(limiter._history) <= limiter.MAX_TRACKED_KEYS

    # Test expired key pruning
    # Manually expire timestamps
    for key in list(limiter._history.keys()):
        limiter._history[key] = [0.0]  # Old timestamp

    limiter._prune_expired_keys(now=100000.0)
    assert len(limiter._history) == 0


# ==============================================================================
# 7. Static Codebase Scanners (Pre-Push Regression Guards)
# ==============================================================================
def test_static_scanner_frontend_no_hardcoded_keys():
    """Scans frontend/src to verify no real or live geo_ API keys are hardcoded in client source."""
    workspace_root = Path(__file__).resolve().parents[2]
    frontend_src = workspace_root / "frontend" / "src"
    assert frontend_src.exists(), f"Frontend source path {frontend_src} does not exist"

    # Pattern matches standard geo_ API keys like 'geo_DgroTYxw...'
    key_pattern = re.compile(r"['\"]geo_[A-Za-z0-9_\-]{25,}['\"]")

    offending_files = []
    for filepath in frontend_src.rglob("*"):
        if filepath.suffix in [".ts", ".tsx", ".js", ".jsx"]:
            try:
                content = filepath.read_text(encoding="utf-8")
                matches = key_pattern.findall(content)
                if matches:
                    offending_files.append((str(filepath.relative_to(workspace_root)), matches))
            except Exception:
                pass

    assert not offending_files, f"Hardcoded API keys discovered in frontend source files: {offending_files}"


def test_jwt_auth_production_enforcement(monkeypatch):
    """Verifies that in production, invalid JWT tokens are strictly rejected and not allowed to bypass."""
    from src.geo_tracker.api.security.jwt_auth import verify_supabase_jwt
    from fastapi import HTTPException

    monkeypatch.setenv("ENVIRONMENT", "production")
    monkeypatch.setenv("SUPABASE_JWT_SECRET", "super-secret-key-12345678901234567890")

    # Tampered/forged token
    fake_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkZvcmdlciJ9.invalidSignatureHere"

    with pytest.raises(HTTPException) as exc_info:
        verify_supabase_jwt(fake_token)

    assert exc_info.value.status_code == 401


def test_cors_production_whitelist(monkeypatch):
    """Verifies that production CORS enforces explicit origins and avoids open dev regexes."""
    from fastapi import FastAPI
    from fastapi.middleware.cors import CORSMiddleware
    from src.geo_tracker.api.middleware.cors import setup_cors

    monkeypatch.setenv("ENVIRONMENT", "production")
    test_app = FastAPI()
    setup_cors(test_app)

    # Inspect installed CORSMiddleware
    cors_middleware = [m for m in test_app.user_middleware if m.cls == CORSMiddleware]
    assert len(cors_middleware) == 1
    kwargs = cors_middleware[0].kwargs

    assert "https://vaatify.com" in kwargs["allow_origins"]
    assert "allow_origin_regex" not in kwargs or kwargs.get("allow_origin_regex") is None


def test_static_scanner_open_redirect_patterns():
    """Scans frontend auth views to verify redirect parameters guard against protocol-relative URLs."""
    workspace_root = Path(__file__).resolve().parents[2]
    auth_view = workspace_root / "frontend" / "src" / "components" / "auth" / "AuthView.tsx"
    assert auth_view.exists(), f"AuthView.tsx not found at {auth_view}"

    content = auth_view.read_text(encoding="utf-8")
    assert "!redirect.startsWith('//')" in content, "AuthView must guard against protocol-relative '//' open redirects"
    assert "!redirect.startsWith('/\\\\')" in content or "!redirect.startsWith('/\\')" in content, \
        "AuthView must guard against protocol-relative '/\\' open redirects"


