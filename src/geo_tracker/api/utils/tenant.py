"""
Tenant & User Scoping Utility for Vaatify GEO.
Resolves the active BrandProfileModel for an authenticated user,
enforcing strict multi-tenant isolation across all endpoints.
"""
import os
from typing import Optional
from fastapi import Header, Query, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select

from src.geo_tracker.storage.models import BrandProfileModel
from src.geo_tracker.api.security.jwt_auth import verify_supabase_jwt


def get_current_user_id(
    authorization: Optional[str] = Header(None, alias="Authorization"),
    x_user_id: Optional[str] = Header(None, alias="X-User-Id"),
    user_id: Optional[str] = Query(None, alias="user_id"),
) -> Optional[str]:
    """
    Extracts and cryptographically validates the authenticated user ID.
    1. If 'Authorization: Bearer <token>' is present:
       Decodes and cryptographically verifies the Supabase JWT, extracting 'sub'.
    2. If no Bearer token is provided:
       - In production (ENV=production): rejects request with HTTP 401.
       - In non-production (development/testing): falls back to X-User-Id or user_id query parameter.
    """
    if authorization:
        auth_clean = authorization.strip()
        if auth_clean.lower().startswith("bearer "):
            token = auth_clean[7:].strip()
            if token:
                payload = verify_supabase_jwt(token)
                uid = payload.get("sub") or payload.get("id")
                if uid:
                    return str(uid).strip()
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication token missing user subject ('sub').",
                    headers={"WWW-Authenticate": "Bearer"},
                )

    is_prod = os.getenv("ENV", "development").lower() == "production"
    if is_prod:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required: missing Bearer token in Authorization header.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Development / Testing fallback
    uid = x_user_id or user_id
    if uid:
        uid = uid.strip()
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
