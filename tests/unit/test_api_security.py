import pytest
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient
from src.geo_tracker.api.app import create_app
from src.geo_tracker.storage.models import Base
from src.geo_tracker.storage.session import get_db_session

app = create_app()
client = TestClient(app)
AUTH_HEADERS = {"X-API-Key": "geoagent_secret_key_2026"}

TEST_DB_URL = "sqlite:///test_api_security.db"

@pytest.fixture(autouse=True)
def setup_db_and_env(monkeypatch):
    monkeypatch.setenv("API_KEY", "geoagent_secret_key_2026")
    monkeypatch.setenv("PERPLEXITY_API_KEY", "pplx-test")
    monkeypatch.setenv("ANTHROPIC_API_KEY", "sk-ant-test")
    monkeypatch.setenv("GEMINI_API_KEY", "gemini-test")
    monkeypatch.setenv("TYPESAFE_API_KEY", "ts-test")
    monkeypatch.setenv("DATABASE_URL", TEST_DB_URL)

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

    app.dependency_overrides[get_db_session] = override_get_db_session
    yield
    app.dependency_overrides.clear()
    Base.metadata.drop_all(engine)
    if os.path.exists("test_api_security.db"):
        try:
            os.remove("test_api_security.db")
        except OSError:
            pass

def test_unprotected_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_protected_route_missing_api_key():
    response = client.get("/api/v1/status")
    assert response.status_code == 401
    assert "Missing required API key header" in response.json()["detail"]

def test_protected_route_invalid_api_key():
    response = client.get("/api/v1/status", headers={"X-API-Key": "wrong_key"})
    assert response.status_code == 401
    assert "Invalid API key provided" in response.json()["detail"]

def test_protected_route_valid_api_key():
    response = client.get("/api/v1/status", headers=AUTH_HEADERS)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "active"
    assert data["authenticated"] is True

def test_prompts_crud_endpoints():
    # 1. Add new prompt
    payload = {
        "id": "p-test-crud",
        "brand": "Omnia",
        "prompt_text": "Is Omnia effective for GEO?",
        "active": True
    }
    create_res = client.post("/api/v1/prompts", json=payload, headers=AUTH_HEADERS)
    assert create_res.status_code == 201
    assert create_res.json()["id"] == "p-test-crud"

    # 2. List prompts
    list_res = client.get("/api/v1/prompts", headers=AUTH_HEADERS)
    assert list_res.status_code == 200
    prompts = list_res.json()
    assert any(p["id"] == "p-test-crud" for p in prompts)

    # 3. Deactivate prompt
    del_res = client.delete("/api/v1/prompts/p-test-crud", headers=AUTH_HEADERS)
    assert del_res.status_code == 200
    assert del_res.json()["status"] == "deactivated"

def test_metrics_overview_endpoint():
    res = client.get("/api/v1/metrics/overview", headers=AUTH_HEADERS)
    assert res.status_code == 200
    data = res.json()
    assert "overall_share_of_voice" in data
    assert "total_evaluations" in data
    assert "active_prompts_count" in data
