import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient
from src.geo_tracker.api.app import create_app
from src.geo_tracker.storage.session import get_db_session
from src.geo_tracker.storage.models import Base

@pytest.fixture
def client(tmp_path):
    test_db_url = f"sqlite:///{tmp_path}/test_onboard.db"
    engine = create_engine(test_db_url, echo=False, connect_args={"check_same_thread": False})
    Base.metadata.create_all(engine)
    TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    app = create_app()

    def override_get_db():
        db = TestingSession()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db_session] = override_get_db
    return TestClient(app)

def test_parse_work_email(client):
    res = client.get("/api/v1/onboarding/parse-email?email=alex@stripe.com")
    assert res.status_code == 200
    data = res.json()
    assert data["is_work_email"] is True
    assert data["domain"] == "stripe.com"
    assert data["name"] == "Stripe"

def test_parse_generic_email(client):
    res = client.get("/api/v1/onboarding/parse-email?email=test@gmail.com")
    assert res.status_code == 200
    data = res.json()
    assert data["is_work_email"] is False
    assert data["domain"] == ""

def test_suggest_onboarding_queries(client):
    res = client.post(
        "/api/v1/onboarding/suggest-queries",
        json={
            "brand_name": "Acme",
            "brand_domain": "acme.com",
            "industry": "B2B SaaS CRM"
        }
    )
    assert res.status_code == 200
    data = res.json()
    assert "suggested_queries" in data
    assert len(data["suggested_queries"]) >= 3

def test_complete_onboarding_and_status(client):
    payload = {
        "user_id": "usr_test123",
        "brand_name": "Acme Cloud",
        "brand_domain": "acmecloud.io",
        "industry": "Cloud Infrastructure",
        "competitors": [
            {"name": "AWS", "domain": "aws.amazon.com"}
        ],
        "prompts": [
            "Best cloud infrastructure platforms for AI startups"
        ]
    }
    res = client.post("/api/v1/onboarding/complete", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "completed"
    assert data["brand"]["name"] == "Acme Cloud"
    assert data["brand"]["onboarding_completed"] is True

    # Check status
    status_res = client.get("/api/v1/onboarding/status?user_id=usr_test123")
    assert status_res.status_code == 200
    status_data = status_res.json()
    assert status_data["onboarding_completed"] is True
    assert status_data["brand"]["name"] == "Acme Cloud"
