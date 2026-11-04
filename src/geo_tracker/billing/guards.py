from typing import Optional
from datetime import datetime, timezone
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from src.geo_tracker.storage.models import SubscriptionModel, PromptModel
from src.geo_tracker.billing.plans import get_prompt_limit, can_access_copilot


def get_user_subscription(session: Session, user_id: str) -> Optional[SubscriptionModel]:
    """Fetches the subscription row for a user. Returns None if not found."""
    return session.query(SubscriptionModel).filter(
        SubscriptionModel.user_id == user_id
    ).first()


def get_effective_plan(sub: Optional[SubscriptionModel]) -> str:
    """
    Resolves the plan the user is currently on.
    - If trialing and trial has not expired -> treat as 'pro' (14-day trial)
    - If trialing and trial IS expired -> 'expired' (must upgrade/renew, all quota halted)
    - If active paid subscription -> sub.plan ('starter', 'pro', 'enterprise')
    - If canceled or past_due with no active status -> 'expired'
    """
    if sub is None:
        return "expired"

    if sub.status == "trialing":
        if sub.trial_ends_at:
            trial_end = sub.trial_ends_at
            if trial_end.tzinfo is None:
                trial_end = trial_end.replace(tzinfo=timezone.utc)
            if datetime.now(timezone.utc) > trial_end:
                return "expired"
        return "pro"  # Active 14-day trial = Pro access

    if sub.status in ("active", "past_due"):
        return sub.plan

    # canceled / incomplete / expired
    return "expired"


def check_prompt_limit(session: Session, user_id: str) -> None:
    """
    Raises HTTP 402 if the user's trial is expired or they reached plan query limit.
    """
    sub = get_user_subscription(session, user_id)
    plan = get_effective_plan(sub)

    if plan == "expired":
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="Your 14-day trial has ended. Please choose a plan to continue tracking queries."
        )

    limit = get_prompt_limit(plan)
    if limit is None:
        return  # unlimited — enterprise

    current_count = session.query(PromptModel).filter(
        PromptModel.user_id == user_id,
        PromptModel.active == True
    ).count()

    if current_count >= limit:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail=(
                f"You have reached the {limit}-query limit on your {plan.capitalize()} plan. "
                "Upgrade to Pro or Enterprise to track more queries."
            )
        )


def check_copilot_access(session: Session, user_id: str) -> None:
    """
    Raises HTTP 402 if the user's plan does not include Agent Copilot access.
    Call this at the top of all /api/v1/agent endpoints.
    """
    sub = get_user_subscription(session, user_id)
    plan = get_effective_plan(sub)

    if not can_access_copilot(plan):
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail=(
                "Agent Copilot and AI citation suggestions require a Pro plan. "
                "Upgrade to unlock autonomous GEO recommendations."
            )
        )

