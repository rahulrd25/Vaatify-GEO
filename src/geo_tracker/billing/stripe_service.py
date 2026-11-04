import os
from typing import Optional, Dict, Any
from fastapi import HTTPException, status

def _get_stripe():
    try:
        import stripe
        return stripe
    except ImportError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="The 'stripe' Python package is not installed. Please run 'uv add stripe' or 'pip install stripe'."
        )

def _get_stripe_key() -> str:
    key = os.getenv("STRIPE_SECRET_KEY", "").strip()
    if not key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Stripe is not configured on the server (STRIPE_SECRET_KEY missing)."
        )
    return key

def _get_base_frontend_url() -> str:
    """
    Dynamically resolves the frontend base URL based on config or ENV.
    """
    configured = os.getenv("FRONTEND_URL", "").strip()
    if configured:
        return configured.rstrip("/")
    
    env = os.getenv("ENV", "development").lower().strip()
    if env == "production":
        return "https://geo.vaatify.com"
    return "http://localhost:3000"

def _get_webhook_secret() -> str:
    """
    Resolves webhook signing secret based on environment:
    STRIPE_WEBHOOK_SECRET -> STRIPE_PROD_WEBHOOK_SECRET (prod) -> STRIPE_DEV_WEBHOOK_SECRET (dev)
    """
    secret = os.getenv("STRIPE_WEBHOOK_SECRET", "").strip()
    if not secret:
        env = os.getenv("ENV", "development").lower().strip()
        if env == "production":
            secret = os.getenv("STRIPE_PROD_WEBHOOK_SECRET", "").strip()
        else:
            secret = os.getenv("STRIPE_DEV_WEBHOOK_SECRET", "").strip()
    
    if not secret:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No Stripe webhook secret configured for this environment."
        )
    return secret

def _get_price_id_for_plan(plan: str) -> str:
    plan_clean = plan.lower().strip()
    if plan_clean == "starter":
        price_id = os.getenv("STRIPE_PRICE_STARTER", "").strip()
    elif plan_clean == "pro":
        price_id = (
            os.getenv("STRIPE_PRICE_PRO", "").strip()
            or os.getenv("STRIPE_PRO_PLAN_PRICE_ID", "").strip()
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid plan '{plan}'. Choose 'starter' or 'pro'."
        )
    
    if not price_id:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Price ID for plan '{plan_clean}' is not configured in environment."
        )
    return price_id

def create_checkout_session(
    user_id: str,
    email: Optional[str],
    plan: str,
    customer_id: Optional[str] = None
) -> str:
    stripe_lib = _get_stripe()
    stripe_lib.api_key = _get_stripe_key()
    price_id = _get_price_id_for_plan(plan)
    base_url = _get_base_frontend_url()

    success_url = (
        os.getenv("STRIPE_SUCCESS_URL")
        or f"{base_url}/dashboard?payment=success&session_id={{CHECKOUT_SESSION_ID}}"
    )
    cancel_url = (
        os.getenv("STRIPE_CANCEL_URL")
        or f"{base_url}/pricing?payment=cancelled"
    )

    session_params: Dict[str, Any] = {
        "mode": "subscription",
        "line_items": [{"price": price_id, "quantity": 1}],
        "client_reference_id": user_id,
        "metadata": {
            "user_id": user_id,
            "plan": plan.lower().strip(),
        },
        "subscription_data": {
            "metadata": {
                "user_id": user_id,
                "plan": plan.lower().strip(),
            }
        },
        "success_url": success_url,
        "cancel_url": cancel_url,
    }

    if customer_id:
        session_params["customer"] = customer_id
    elif email:
        session_params["customer_email"] = email

    try:
        session = stripe_lib.checkout.Session.create(**session_params)
        return session.url
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Stripe error creating checkout session: {str(e)}"
        )

def create_customer_portal_session(customer_id: str) -> str:
    stripe_lib = _get_stripe()
    stripe_lib.api_key = _get_stripe_key()
    base_url = _get_base_frontend_url()

    try:
        portal = stripe_lib.billing_portal.Session.create(
            customer=customer_id,
            return_url=f"{base_url}/dashboard"
        )
        return portal.url
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Stripe error creating customer portal: {str(e)}"
        )

def construct_webhook_event(payload_bytes: bytes, sig_header: str) -> Any:
    stripe_lib = _get_stripe()
    webhook_secret = _get_webhook_secret()

    try:
        event = stripe_lib.Webhook.construct_event(
            payload=payload_bytes,
            sig_header=sig_header,
            secret=webhook_secret
        )
        return event
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Webhook signature verification failed: {str(e)}"
        )
