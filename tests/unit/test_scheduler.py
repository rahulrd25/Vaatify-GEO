import pytest
import os
from datetime import datetime, timezone
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient
from src.geo_tracker.api.app import create_app
from src.geo_tracker.storage.models import Base
from src.geo_tracker.storage.session import get_db_session
from src.geo_tracker.api.security.api_key import security_settings
from src.geo_tracker.scheduler.engine import compute_next_run

TEST_DB_URL = "sqlite:///test_scheduler.db"
app = create_app()
client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_db_and_env(monkeypatch):
    monkeypatch.setenv("API_KEY", security_settings.api_key)
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
    if os.path.exists("test_scheduler.db"):
        try:
            os.remove("test_scheduler.db")
        except OSError:
            pass

def test_compute_next_run_cadences():
    # Base: Monday, Oct 5, 2026 at 08:00 UTC (weekday = 0)
    base = datetime(2026, 10, 5, 8, 0, 0, tzinfo=timezone.utc)

    # 1. Daily before 09:00 UTC -> should be today at 09:00 UTC
    next_daily = compute_next_run("daily", hour_utc=9, minute_utc=0, base_time=base)
    assert next_daily == datetime(2026, 10, 5, 9, 0, 0, tzinfo=timezone.utc)

    # 2. Daily after 09:00 UTC -> should be tomorrow at 09:00 UTC
    base_after = datetime(2026, 10, 5, 10, 0, 0, tzinfo=timezone.utc)
    next_daily_after = compute_next_run("daily", hour_utc=9, minute_utc=0, base_time=base_after)
    assert next_daily_after == datetime(2026, 10, 6, 9, 0, 0, tzinfo=timezone.utc)

    # 3. Weekly (Monday at 09:00) when before 09:00 on Monday -> should be today at 09:00 UTC
    next_weekly = compute_next_run("weekly", day_of_week=0, hour_utc=9, minute_utc=0, base_time=base)
    assert next_weekly == datetime(2026, 10, 5, 9, 0, 0, tzinfo=timezone.utc)

    # 4. Weekly (Monday at 09:00) when after 09:00 on Monday -> should be next Monday (Oct 12)
    next_weekly_after = compute_next_run("weekly", day_of_week=0, hour_utc=9, minute_utc=0, base_time=base_after)
    assert next_weekly_after == datetime(2026, 10, 12, 9, 0, 0, tzinfo=timezone.utc)

    # 5. Off mode -> None
    assert compute_next_run("off", base_time=base) is None

def test_schedule_api_endpoints():
    headers = {security_settings.api_key_name: security_settings.api_key}

    # 1. GET schedule
    res = client.get("/api/v1/schedule", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "frequency" in data
    assert "day_of_week" in data
    assert "hour_utc" in data

    # 2. Update schedule to Daily at 10:00 UTC
    update_payload = {
        "frequency": "daily",
        "day_of_week": 0,
        "hour_utc": 10,
        "minute_utc": 0,
        "is_active": True
    }
    put_res = client.put("/api/v1/schedule", headers=headers, json=update_payload)
    assert put_res.status_code == 200
    updated_data = put_res.json()
    assert updated_data["frequency"] == "daily"
    assert updated_data["hour_utc"] == 10
    assert updated_data["next_run_at"] is not None
