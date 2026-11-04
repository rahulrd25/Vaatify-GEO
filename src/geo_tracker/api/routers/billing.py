"""
Billing & Subscription Router.
Provides endpoints for querying subscription status, generating Checkout sessions,
and generating Stripe Customer Portal sessions.
"""
import logging
from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status, Request, Header
from sqlalchemy.orm import Session

from src.geo_tracker.api.security.api_key import verify_api_or_user_auth
from src.geo_tracker.api.utils.tenant import get_current_user_id
from src.geo_tracker.storage.session import get_db_session
from src.geo_tracker.storage.models import PromptModel, SubscriptionModel, StripeEventModel
from src.geo_tracker.billing.guards import get_user_subscription, get_effective_plan
from src.geo_tracker.billing.plans import get_prompt_limit, can_access_copilot, can_access_full_reports
from src.geo_tracker.billing.stripe_service import (
    create_checkout_session,
    create_customer_portal_session,
    construct_webhook_event
)

logger = logging.getLogger("geo_tracker.billing")

router = APIRouter(prefix="/api/v1/billing", tags=["Billing & Subscriptions"])

class CheckoutRequest(BaseModel):
    plan: str
    email: Optional[str] = None

class StatusResponse(BaseModel):
    plan: str
    status: str
    is_trial: bool
    trial_ends_at: Optional[str] = None
    current_period_end: Optional[str] = None
    prompt_count: int
    prompt_limit: Optional[int] = None
    features: dict

@router.get(
    "/status",
    response_model=StatusResponse,
    summary="Get Current Billing & Plan Status",
    dependencies=[Depends(verify_api_or_user_auth)]
)
def get_billing_status(
    user_id: Optional[str] = Depends(get_current_user_id),
    session: Session = Depends(get_db_session)
):
    """Returns the authenticated tenant's plan status, prompt quota, and feature permissions."""
    if not user_id:
        return StatusResponse(
            plan="enterprise",
            status="active",
            is_trial=False,
            trial_ends_at=None,
            current_period_end=None,
            prompt_count=0,
            prompt_limit=None,
            features={"copilot": True, "full_reports": True}
        )

    sub = get_user_subscription(session, user_id)
    effective_plan = get_effective_plan(sub)
    limit = get_prompt_limit(effective_plan)

    active_prompts_count = session.query(PromptModel).filter(
        PromptModel.user_id == user_id,
        PromptModel.active == True
    ).count()

    is_trial = bool(sub and sub.status == "trialing")

    return StatusResponse(
        plan=effective_plan,
        status=sub.status if sub else "active",
        is_trial=is_trial,
        trial_ends_at=sub.trial_ends_at.isoformat() if sub and sub.trial_ends_at else None,
        current_period_end=sub.current_period_end.isoformat() if sub and sub.current_period_end else None,
        prompt_count=active_prompts_count,
        prompt_limit=limit,
        features={
            "copilot": can_access_copilot(effective_plan),
            "full_reports": can_access_full_reports(effective_plan)
        }
    )

@router.post(
    "/checkout",
    summary="Create Stripe Checkout Session",
    dependencies=[Depends(verify_api_or_user_auth)]
)
def checkout(
    request: CheckoutRequest,
    user_id: Optional[str] = Depends(get_current_user_id),
    session: Session = Depends(get_db_session)
):
    """Creates a Stripe Checkout Session URL for upgrading/purchasing a plan."""
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User ID required to initiate subscription checkout."
        )

    sub = get_user_subscription(session, user_id)
    customer_id = sub.stripe_customer_id if sub else None

    checkout_url = create_checkout_session(
        user_id=user_id,
        email=request.email,
        plan=request.plan,
        customer_id=customer_id
    )

    return {"checkout_url": checkout_url}

@router.post(
    "/portal",
    summary="Create Stripe Customer Portal Session",
    dependencies=[Depends(verify_api_or_user_auth)]
)
def customer_portal(
    user_id: Optional[str] = Depends(get_current_user_id),
    session: Session = Depends(get_db_session)
):
    """Creates a link to Stripe Customer Portal to manage cards and subscriptions."""
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User ID required to access customer portal."
        )

    sub = get_user_subscription(session, user_id)
    if not sub or not sub.stripe_customer_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active Stripe customer found for this account. Subscribe to a plan first."
        )

    portal_url = create_customer_portal_session(customer_id=sub.stripe_customer_id)
    return {"portal_url": portal_url}


@router.post(
    "/webhook",
    summary="Stripe Webhook Listener (Idempotent & Cryptographically Signed)",
    status_code=status.HTTP_200_OK
)
async def stripe_webhook(
    request: Request,
    stripe_signature: Optional[str] = Header(None, alias="Stripe-Signature"),
    session: Session = Depends(get_db_session)
):
    """
    Receives and processes asynchronous Stripe events.
    Enforces HMAC cryptographic signature check and event deduplication via stripe_events table.
    """
    if not stripe_signature:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing required Stripe-Signature header."
        )

    # Must read raw bytes directly for accurate HMAC verification
    payload_bytes = await request.body()
    event = construct_webhook_event(payload_bytes, stripe_signature)

    event_id = event.get("id")
    event_type = event.get("type")
    data_object = event.get("data", {}).get("object", {})

    logger.info(f"Incoming Stripe webhook: event_id={event_id}, type={event_type}")

    # 1. Idempotency Check
    existing_event = session.query(StripeEventModel).filter(StripeEventModel.id == event_id).first()
    if existing_event:
        logger.info(f"Event {event_id} already processed. Returning 200 OK.")
        return {"status": "already_processed", "event_id": event_id}

    # 2. Process business logic based on event type
    try:
        if event_type == "checkout.session.completed":
            user_id = data_object.get("client_reference_id") or data_object.get("metadata", {}).get("user_id")
            plan = data_object.get("metadata", {}).get("plan", "starter")
            customer_id = data_object.get("customer")
            subscription_id = data_object.get("subscription")

            if user_id:
                sub = session.query(SubscriptionModel).filter(SubscriptionModel.user_id == user_id).first()
                if not sub:
                    sub = SubscriptionModel(
                        user_id=user_id,
                        plan=plan,
                        status="active",
                        stripe_customer_id=customer_id,
                        stripe_subscription_id=subscription_id
                    )
                    session.add(sub)
                else:
                    sub.plan = plan
                    sub.status = "active"
                    if customer_id:
                        sub.stripe_customer_id = customer_id
                    if subscription_id:
                        sub.stripe_subscription_id = subscription_id
                session.commit()
                logger.info(f"Subscription activated for user_id={user_id}, plan={plan}")

        elif event_type in ("customer.subscription.updated", "customer.subscription.created"):
            subscription_id = data_object.get("id")
            customer_id = data_object.get("customer")
            status_str = data_object.get("status")  # active, trialing, past_due, canceled
            current_period_end_ts = data_object.get("current_period_end")

            sub = session.query(SubscriptionModel).filter(
                (SubscriptionModel.stripe_subscription_id == subscription_id) |
                (SubscriptionModel.stripe_customer_id == customer_id)
            ).first()

            if sub:
                sub.status = status_str or sub.status
                if current_period_end_ts:
                    sub.current_period_end = datetime.fromtimestamp(current_period_end_ts, tz=timezone.utc)
                plan_meta = data_object.get("metadata", {}).get("plan")
                if plan_meta:
                    sub.plan = plan_meta
                session.commit()
                logger.info(f"Subscription {subscription_id} updated: status={sub.status}, plan={sub.plan}")

        elif event_type == "customer.subscription.deleted":
            subscription_id = data_object.get("id")
            sub = session.query(SubscriptionModel).filter(
                SubscriptionModel.stripe_subscription_id == subscription_id
            ).first()
            if sub:
                sub.status = "canceled"
                session.commit()
                logger.info(f"Subscription {subscription_id} canceled.")

        elif event_type == "invoice.payment_succeeded":
            customer_id = data_object.get("customer")
            subscription_id = data_object.get("subscription")
            sub = session.query(SubscriptionModel).filter(
                (SubscriptionModel.stripe_subscription_id == subscription_id) |
                (SubscriptionModel.stripe_customer_id == customer_id)
            ).first()
            if sub:
                if sub.status == "past_due":
                    sub.status = "active"
                session.commit()
                logger.info(f"Invoice payment succeeded for customer {customer_id}.")

        elif event_type == "invoice.payment_failed":
            customer_id = data_object.get("customer")
            subscription_id = data_object.get("subscription")
            sub = session.query(SubscriptionModel).filter(
                (SubscriptionModel.stripe_subscription_id == subscription_id) |
                (SubscriptionModel.stripe_customer_id == customer_id)
            ).first()
            if sub:
                sub.status = "past_due"
                session.commit()
                logger.warning(f"Invoice payment failed for customer {customer_id}, status set to past_due.")

    except Exception as exc:
        logger.error(f"Error handling Stripe webhook event {event_id}: {str(exc)}", exc_info=True)
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error executing webhook logic: {str(exc)}"
        )

    # 3. Log event as successfully processed for idempotency
    try:
        processed_record = StripeEventModel(id=event_id)
        session.add(processed_record)
        session.commit()
    except Exception:
        session.rollback()

    return {"status": "success", "event_id": event_id}

