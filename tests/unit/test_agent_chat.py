"""
Tests for Copilot Agent Service and /api/v1/agent/chat endpoint.
"""
import pytest
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient
from src.geo_tracker.api.app import create_app
from src.geo_tracker.storage.models import Base
from src.geo_tracker.storage.session import get_db_session
from src.geo_tracker.agent.copilot_service import CopilotAgentService, AgentChatRequest

app = create_app()
client = TestClient(app)
AUTH_HEADERS = {"X-API-Key": "geoagent_secret_key_2026"}
TEST_DB_URL = "sqlite:///test_agent_chat.db"

@pytest.fixture(autouse=True)
def setup_db_and_env(monkeypatch):
    monkeypatch.setenv("API_KEY", "geoagent_secret_key_2026")
    monkeypatch.setenv("PERPLEXITY_API_KEY", "pplx-test")
    monkeypatch.setenv("ANTHROPIC_API_KEY", "sk-ant-test")
    monkeypatch.setenv("GEMINI_API_KEY", "")
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
    if os.path.exists("test_agent_chat.db"):
        try:
            os.remove("test_agent_chat.db")
        except OSError:
            pass

def test_copilot_service_heuristic_suggestions():
    service = CopilotAgentService()
    req = AgentChatRequest(message="Suggest 3 buyer intent queries for Acme")
    brand_profile = {
        "brand": {"name": "Acme", "domain": "acme.com"},
        "competitors": [{"name": "HubSpot", "domain": "hubspot.com"}]
    }
    prompts = [{"prompt_text": "Sample Query"}]
    metrics = {"overall_share_of_voice": 66.7, "total_evaluations": 10, "flips_count": 1}

    resp = service.process_chat(req, brand_profile, prompts, metrics)
    assert resp.reply != ""
    assert len(resp.proposals) >= 1
    assert resp.proposals[0].type == "prompt"
    assert resp.proposals[0].status == "pending"

def test_agent_chat_api_endpoint():
    response = client.post(
        "/api/v1/agent/chat",
        headers=AUTH_HEADERS,
        json={"message": "Suggest 3 buyer queries for Acme"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "reply" in data
    assert "proposals" in data
    assert isinstance(data["proposals"], list)
