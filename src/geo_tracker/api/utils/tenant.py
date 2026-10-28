"""
Tenant & User Scoping Utility for Vaatify GEO.
Resolves the active BrandProfileModel for an authenticated user,
enforcing strict multi-tenant isolation across all endpoints.
"""
import os
import secrets
from typing import Optional
from fastapi import Header, Query, HTTPException, status, Security
from sqlalchemy.orm import Session
from sqlalchemy import select

from src.geo_tracker.storage.models import BrandProfileModel
from src.geo_tracker.api.security.jwt_auth import verify_supabase_jwt
from src.geo_tracker.api.security.api_key import api_key_header, get_expected_api_key
from src.geo_tracker.config import is_production


def get_current_user_id(
    authorization: Optional[str] = Header(None, alias="Authorization"),
    x_user_id: Optional[str] = Header(None, alias="X-User-Id"),
    user_id: Optional[str] = Query(None, alias="user_id"),
    api_key: Optional[str] = Security(api_key_header),
) -> Optional[str]:
    """
    Extracts and cryptographically validates the authenticated user ID.
    1. If 'Authorization: Bearer <token>' is present:
       Decodes and cryptographically verifies the Supabase JWT, extracting 'sub'.
    2. If a valid API key is provided:
       Resolves tenant from X-User-Id or user_id query parameter.
    3. In non-production (development/testing):
       Falls back to X-User-Id or user_id query parameter.
    4. In production without Bearer token or API key:
       Rejects request with HTTP 401.
    """
    auth_val = authorization if isinstance(authorization, str) else None
    x_user_val = x_user_id if isinstance(x_user_id, str) else None
    user_val = user_id if isinstance(user_id, str) else None
    api_key_val = api_key if isinstance(api_key, str) else None

    if auth_val:
        auth_clean = auth_val.strip()
        if auth_clean.lower().startswith("bearer "):
            token = auth_clean[7:].strip()
            if token:
                try:
                    payload = verify_supabase_jwt(token)
                    uid = payload.get("sub") or payload.get("id")
                    if uid:
                        return str(uid).strip()
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Authentication token missing user subject ('sub').",
                        headers={"WWW-Authenticate": "Bearer"},
                    )
                except HTTPException:
                    if is_production():
                        raise

    # If valid API key is present, allow developer/admin tenant scoping
    if api_key_val and api_key_val.strip():
        expected_key = get_expected_api_key()
        if secrets.compare_digest(api_key_val.strip(), expected_key):
            uid = x_user_val or user_val
            return str(uid).strip() if uid and uid.strip() else None

    if is_production():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required: missing Bearer token in Authorization header.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Development / Testing fallback
    uid = x_user_val or user_val
    if uid:
        uid = str(uid).strip()
    return uid if uid else None



def get_user_brand(session: Session, user_id: Optional[str]) -> Optional[BrandProfileModel]:
    """
    Fetches the BrandProfileModel strictly owned by the specified user_id.
    If user_id is None, returns the single default brand (for backwards compatibility/CLI),
    or None if no brands exist.
    """
    if user_id:
        return session.scalar(
            select(BrandProfileModel).where(BrandProfileModel.user_id == user_id)
        )
    return session.scalar(select(BrandProfileModel))
