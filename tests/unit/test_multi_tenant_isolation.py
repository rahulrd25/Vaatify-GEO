"""
Unit Tests for Multi-Tenant Account Data Separation & Isolation.
Verifies that accounts never leak queries, competitors, metrics, or runs across users.
"""
import pytest
import os
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from src.geo_tracker.storage.models import Base
from src.geo_tracker.storage.session import get_db_session
from src.geo_tracker.api.app import create_app

TEST_DB_URL = "sqlite:///test_multi_tenant_isolation.db"

@pytest.fixture(autouse=True)
def setup_test_env(monkeypatch):
    monkeypatch.setenv("DATABASE_URL", TEST_DB_URL)
    monkeypatch.setenv("API_KEY", "geo_DgroTYxwQp7dl5prrTMzjITh_Imt-BlsTbIp-TuBpPA")
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
    
    yield app

    app.dependency_overrides.clear()
    Base.metadata.drop_all(engine)
    if os.path.exists("test_multi_tenant_isolation.db"):
        try:
            os.remove("test_multi_tenant_isolation.db")
        except Exception:
            pass

def test_new_user_has_zero_prompts_and_zero_metrics(setup_test_env):
    app = setup_test_env
    client = TestClient(app)
    headers = {
        "X-API-Key": "geo_DgroTYxwQp7dl5prrTMzjITh_Imt-BlsTbIp-TuBpPA",
        "X-User-Id": "user_brand_new_123"
    }
    
    # 1. Check Prompts for new user
    res_prompts = client.get("/api/v1/prompts", headers=headers)
    assert res_prompts.status_code == 200
    assert res_prompts.json() == []  # MUST be empty!

    # 2. Check Metrics for new user
    res_metrics = client.get("/api/v1/metrics/overview", headers=headers)
    assert res_metrics.status_code == 200
    data = res_metrics.json()
    assert data["total_evaluations"] == 0
    assert data["active_prompts_count"] == 0
    assert data["overall_share_of_voice"] == 0.0

    # 3. Check Runs for new user
    res_runs = client.get("/api/v1/runs", headers=headers)
    assert res_runs.status_code == 200
    assert res_runs.json() == []

def test_tenant_data_isolation_between_two_users(setup_test_env):
    app = setup_test_env
    client = TestClient(app)
    user_a_headers = {
        "X-API-Key": "geo_DgroTYxwQp7dl5prrTMzjITh_Imt-BlsTbIp-TuBpPA",
        "X-User-Id": "user_alpha"
    }
    user_b_headers = {
        "X-API-Key": "geo_DgroTYxwQp7dl5prrTMzjITh_Imt-BlsTbIp-TuBpPA",
        "X-User-Id": "user_beta"
    }

    # 1. User Alpha onboards brand "AlphaCorp"
    onboard_payload_a = {
        "user_id": "user_alpha",
        "brand_name": "AlphaCorp",
        "brand_domain": "alphacorp.com",
        "industry": "B2B SaaS",
        "competitors": [{"name": "CompX", "domain": "compx.com"}],
        "prompts": ["Best CRM for startups", "Top alternatives to CompX"]
    }
    res_onboard = client.post("/api/v1/onboarding/complete", json=onboard_payload_a)
    assert res_onboard.status_code == 200

    # 2. User Alpha queries prompts -> sees 2 prompts
    res_prompts_a = client.get("/api/v1/prompts", headers=user_a_headers)
    assert res_prompts_a.status_code == 200
    assert len(res_prompts_a.json()) == 2
    prompt_texts_a = [p["prompt_text"] for p in res_prompts_a.json()]
    assert "Best CRM for startups" in prompt_texts_a

    # 3. User Beta queries prompts -> MUST SEE ZERO PROMPTS (Strict Isolation)
    res_prompts_b = client.get("/api/v1/prompts", headers=user_b_headers)
    assert res_prompts_b.status_code == 200
    assert res_prompts_b.json() == []

    # 4. User Beta queries profile -> sees empty brand
    res_profile_b = client.get("/api/v1/profile", headers=user_b_headers)
    assert res_profile_b.status_code == 200
    assert res_profile_b.json()["brand"]["name"] == ""
    assert res_profile_b.json()["competitors"] == []

    # 5. User Alpha queries profile -> sees AlphaCorp
    res_profile_a = client.get("/api/v1/profile", headers=user_a_headers)
    assert res_profile_a.status_code == 200
    assert res_profile_a.json()["brand"]["name"] == "AlphaCorp"
    assert len(res_profile_a.json()["competitors"]) == 1

    # 6. User Alpha adds a prompt via POST /api/v1/prompts
    res_add_p = client.post("/api/v1/prompts", json={"prompt_text": "Alpha custom prompt"}, headers=user_a_headers)
    assert res_add_p.status_code == 201
    alpha_prompt_id = res_add_p.json()["id"]

    # 7. User Beta attempts to delete User Alpha's prompt -> MUST FAIL with 403 Forbidden
    res_del_unauth = client.delete(f"/api/v1/prompts/{alpha_prompt_id}", headers=user_b_headers)
    assert res_del_unauth.status_code == 403

    # 8. User Beta adds their own prompt
    res_add_b = client.post("/api/v1/prompts", json={"prompt_text": "Beta query text"}, headers=user_b_headers)
    assert res_add_b.status_code == 201

    # User Alpha only sees their 3 prompts (2 from onboarding + 1 custom)
    res_p_a = client.get("/api/v1/prompts", headers=user_a_headers)
    assert len(res_p_a.json()) == 3
    assert not any(p["prompt_text"] == "Beta query text" for p in res_p_a.json())

    # User Beta only sees their 1 prompt
    res_p_b = client.get("/api/v1/prompts", headers=user_b_headers)
    assert len(res_p_b.json()) == 1
    assert res_p_b.json()[0]["prompt_text"] == "Beta query text"

    # 9. Schedule isolation
    client.put("/api/v1/schedule", json={"frequency": "daily", "day_of_week": 1, "hour_utc": 10, "minute_utc": 0, "is_active": True}, headers=user_a_headers)
    res_sch_b = client.get("/api/v1/schedule", headers=user_b_headers)
    assert res_sch_b.status_code == 200
    # User B should have default weekly schedule, not user A's daily
    assert res_sch_b.json()["frequency"] == "weekly"
