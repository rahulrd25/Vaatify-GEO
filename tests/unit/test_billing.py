"""
Unit tests for the Billing, Stripe Integration, Usage Quota Guards, and Webhooks.
Tests every individual layer in isolation using SQLite in-memory test databases and mocks.
"""
import pytest
from datetime import datetime, timezone, timedelta
from unittest.mock import patch, MagicMock
from fastapi import FastAPI, HTTPException
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.pool import StaticPool
from sqlalchemy.orm import sessionmaker

from src.geo_tracker.storage.models import Base, SubscriptionModel, PromptModel, StripeEventModel, BrandProfileModel
from src.geo_tracker.storage.session import get_db_session
from src.geo_tracker.billing.plans import get_prompt_limit, can_access_copilot, can_access_full_reports
from src.geo_tracker.billing.guards import (
    get_user_subscription,
    get_effective_plan,
    check_prompt_limit,
    check_copilot_access,
)
from src.geo_tracker.billing.stripe_service import (
    _get_base_frontend_url,
    _get_price_id_for_plan,
    _get_webhook_secret,
    create_checkout_session,
    create_customer_portal_session,
)
from src.geo_tracker.api.routers.billing import router as billing_router
from src.geo_tracker.api.routers.prompts import router as prompts_router
from src.geo_tracker.api.routers.copilot import router as copilot_router


@pytest.fixture
def db_session():
    """In-memory SQLite database session fixture with StaticPool."""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client(db_session):
    """FastAPI TestClient with overridden DB dependency."""
    app = FastAPI()
    app.dependency_overrides[get_db_session] = lambda: db_session
    app.include_router(billing_router)
    app.include_router(prompts_router)
    app.include_router(copilot_router)
    return TestClient(app)


# ==============================================================================
# 1. PLAN LIMITS & POLICY TESTS
# ==============================================================================

def test_plan_limits_configuration():
    """Verifies that plan prompt limits and feature entitlements adhere to specifications."""
    assert get_prompt_limit("expired") == 0
    assert get_prompt_limit("starter") == 25
    assert get_prompt_limit("pro") == 150
    assert get_prompt_limit("enterprise") is None

    assert can_access_copilot("starter") is False
    assert can_access_copilot("pro") is True
    assert can_access_copilot("enterprise") is True

    assert can_access_full_reports("starter") is False
    assert can_access_full_reports("pro") is True


# ==============================================================================
# 2. EFFECTIVE PLAN RESOLUTION & TRIAL LIFECYCLE
# ==============================================================================

def test_effective_plan_active_trial():
    """Active trial (< 14 days) should resolve to 'pro'."""
    sub = SubscriptionModel(
        user_id="u1",
        plan="pro",
        status="trialing",
        trial_ends_at=datetime.now(timezone.utc) + timedelta(days=5),
    )
    assert get_effective_plan(sub) == "pro"


def test_effective_plan_expired_trial():
    """Expired trial should resolve to 'expired' (halted access)."""
    sub = SubscriptionModel(
        user_id="u1",
        plan="pro",
        status="trialing",
        trial_ends_at=datetime.now(timezone.utc) - timedelta(days=1),
    )
    assert get_effective_plan(sub) == "expired"


def test_effective_plan_no_subscription():
    """Users with no subscription record resolve to 'expired'."""
    assert get_effective_plan(None) == "expired"


def test_effective_plan_paid_statuses():
    """Paid subscriptions resolve to their assigned tier."""
    sub_active = SubscriptionModel(user_id="u1", plan="starter", status="active")
    assert get_effective_plan(sub_active) == "starter"

    sub_past_due = SubscriptionModel(user_id="u2", plan="pro", status="past_due")
    assert get_effective_plan(sub_past_due) == "pro"

    sub_canceled = SubscriptionModel(user_id="u3", plan="pro", status="canceled")
    assert get_effective_plan(sub_canceled) == "expired"


# ==============================================================================
# 3. GUARD ENFORCEMENT (PROMPT QUOTA & COPILOT LOCK)
# ==============================================================================

def test_check_prompt_limit_expired(db_session):
    """Expired users cannot create queries."""
    with pytest.raises(HTTPException) as exc:
        check_prompt_limit(db_session, user_id="u_expired")
    assert exc.value.status_code == 402
    assert "trial has ended" in exc.value.detail


def test_check_prompt_limit_starter_enforced(db_session):
    """Starter user is stopped upon reaching 25 active queries."""
    sub = SubscriptionModel(user_id="u_starter", plan="starter", status="active")
    db_session.add(sub)

    # Add 25 prompts
    for i in range(25):
        db_session.add(PromptModel(
            id=f"q_{i}",
            user_id="u_starter",
            brand="Brand",
            prompt_text=f"Query {i}",
            active=True
        ))
    db_session.commit()

    with pytest.raises(HTTPException) as exc:
        check_prompt_limit(db_session, user_id="u_starter")
    assert exc.value.status_code == 402
    assert "25-query limit" in exc.value.detail


def test_check_prompt_limit_starter_under_quota(db_session):
    """Starter user with under 25 prompts succeeds without error."""
    sub = SubscriptionModel(user_id="u_starter_ok", plan="starter", status="active")
    db_session.add(sub)
    db_session.commit()

    # Should not raise
    check_prompt_limit(db_session, user_id="u_starter_ok")


def test_check_copilot_access(db_session):
    """Starter users are denied Copilot access; Pro users are allowed."""
    sub_starter = SubscriptionModel(user_id="u_starter", plan="starter", status="active")
    sub_pro = SubscriptionModel(user_id="u_pro", plan="pro", status="active")
    db_session.add_all([sub_starter, sub_pro])
    db_session.commit()

    with pytest.raises(HTTPException) as exc:
        check_copilot_access(db_session, user_id="u_starter")
    assert exc.value.status_code == 402
    assert "require a Pro plan" in exc.value.detail

    # Pro should pass cleanly
    check_copilot_access(db_session, user_id="u_pro")


# ==============================================================================
# 4. STRIPE SERVICE CONFIGURATION & SESSIONS
# ==============================================================================

def test_stripe_service_urls(monkeypatch):
    """Tests dynamic URL resolution for dev vs production."""
    monkeypatch.setenv("ENV", "development")
    monkeypatch.delenv("FRONTEND_URL", raising=False)
    assert _get_base_frontend_url() == "http://localhost:3000"

    monkeypatch.setenv("ENV", "production")
    assert _get_base_frontend_url() == "https://geo.vaatify.com"


def test_stripe_service_webhook_secrets(monkeypatch):
    """Tests dynamic webhook secret selection."""
    monkeypatch.setenv("ENV", "development")
    monkeypatch.delenv("STRIPE_WEBHOOK_SECRET", raising=False)
    monkeypatch.setenv("STRIPE_DEV_WEBHOOK_SECRET", "whsec_dev_test")
    monkeypatch.setenv("STRIPE_PROD_WEBHOOK_SECRET", "whsec_prod_test")

    assert _get_webhook_secret() == "whsec_dev_test"

    monkeypatch.setenv("ENV", "production")
    assert _get_webhook_secret() == "whsec_prod_test"


def test_create_checkout_session_mock(monkeypatch):
    """Tests creating a Stripe checkout session with proper parameters."""
    monkeypatch.setenv("STRIPE_SECRET_KEY", "sk_test_mock")
    monkeypatch.setenv("STRIPE_PRICE_STARTER", "price_starter_123")

    mock_session = MagicMock()
    mock_session.url = "https://checkout.stripe.com/c/pay/cs_test_mock"

    with patch("stripe.checkout.Session.create", return_value=mock_session) as mock_create:
        url = create_checkout_session(
            user_id="usr_test_1",
            email="test@vaatify.com",
            plan="starter",
            customer_id=None
        )
        assert url == "https://checkout.stripe.com/c/pay/cs_test_mock"
        mock_create.assert_called_once()
        call_kwargs = mock_create.call_args[1]
        assert call_kwargs["client_reference_id"] == "usr_test_1"
        assert call_kwargs["metadata"]["plan"] == "starter"


# ==============================================================================
# 5. BILLING API ENDPOINTS
# ==============================================================================

def test_api_billing_status_endpoint(client, db_session):
    """GET /api/v1/billing/status returns correct subscription data."""
    trial_end = datetime.now(timezone.utc) + timedelta(days=10)
    sub = SubscriptionModel(
        user_id="u_test_api",
        plan="pro",
        status="trialing",
        trial_ends_at=trial_end,
    )
    db_session.add(sub)
    db_session.commit()

    res = client.get("/api/v1/billing/status?user_id=u_test_api")
    assert res.status_code == 200
    data = res.json()
    assert data["plan"] == "pro"
    assert data["status"] == "trialing"
    assert data["is_trial"] is True
    assert data["prompt_limit"] == 150
    assert data["features"]["copilot"] is True


def test_api_checkout_endpoint(client, monkeypatch):
    """POST /api/v1/billing/checkout returns checkout URL."""
    with patch("src.geo_tracker.api.routers.billing.create_checkout_session", return_value="https://checkout.mock/123"):
        res = client.post(
            "/api/v1/billing/checkout?user_id=u_test",
            json={"plan": "pro", "email": "test@example.com"}
        )
        assert res.status_code == 200
        assert res.json()["checkout_url"] == "https://checkout.mock/123"


def test_api_portal_endpoint_no_customer(client, db_session):
    """POST /api/v1/billing/portal without a Stripe customer returns 404."""
    res = client.post("/api/v1/billing/portal?user_id=u_no_sub")
    assert res.status_code == 404
    assert "No active Stripe customer found" in res.json()["detail"]


# ==============================================================================
# 6. WEBHOOKS & IDEMPOTENCY
# ==============================================================================

def test_webhook_missing_signature(client):
    """Webhook rejects calls without Stripe-Signature header."""
    res = client.post("/api/v1/billing/webhook", content=b"{}")
    assert res.status_code == 400
    assert "Missing required Stripe-Signature" in res.json()["detail"]


def test_webhook_checkout_completed_and_idempotency(client, db_session):
    """
    Webhook processes checkout.session.completed, activates user plan,
    and second call is deduplicated idempotently.
    """
    event_payload = {
        "id": "evt_unique_101",
        "type": "checkout.session.completed",
        "data": {
            "object": {
                "client_reference_id": "u_new_buyer",
                "metadata": {"plan": "pro"},
                "customer": "cus_stripe_101",
                "subscription": "sub_stripe_101"
            }
        }
    }

    with patch("src.geo_tracker.api.routers.billing.construct_webhook_event", return_value=event_payload):
        # 1. First webhook execution
        res1 = client.post(
            "/api/v1/billing/webhook",
            headers={"Stripe-Signature": "t=123,v1=mock_sig"},
            content=b"{}"
        )
        assert res1.status_code == 200
        assert res1.json()["status"] == "success"

        # Verify DB updated
        sub = db_session.query(SubscriptionModel).filter(SubscriptionModel.user_id == "u_new_buyer").first()
        assert sub is not None
        assert sub.plan == "pro"
        assert sub.status == "active"
        assert sub.stripe_customer_id == "cus_stripe_101"

        # Verify event logged in stripe_events table
        logged_evt = db_session.query(StripeEventModel).filter(StripeEventModel.id == "evt_unique_101").first()
        assert logged_evt is not None

        # 2. Second webhook execution (Stripe retry)
        res2 = client.post(
            "/api/v1/billing/webhook",
            headers={"Stripe-Signature": "t=123,v1=mock_sig"},
            content=b"{}"
        )
        assert res2.status_code == 200
        assert res2.json()["status"] == "already_processed"
