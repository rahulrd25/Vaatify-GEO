import os
import secrets
from typing import Optional
from fastapi import Security, HTTPException, status, Header, Query
from fastapi.security import APIKeyHeader
from pydantic_settings import BaseSettings, SettingsConfigDict

from src.geo_tracker.api.security.jwt_auth import verify_supabase_jwt
from src.geo_tracker.config import is_production

class SecuritySettings(BaseSettings):
    api_key: str = ""
    api_key_name: str = "X-API-Key"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

security_settings = SecuritySettings()
api_key_header = APIKeyHeader(name=security_settings.api_key_name, auto_error=False)

def get_expected_api_key() -> str:
    """
    Retrieves the expected API key from environment variables or settings.
    Guarantees no hardcoded fallback key can ever be used in production.
    """
    key = os.getenv("API_KEY") or security_settings.api_key
    if not key or not key.strip():
        raise RuntimeError("CRITICAL SECURITY ERROR: 'API_KEY' environment variable is not set. Refusing to boot without an explicit secret key.")
    return key.strip()

def verify_api_key(api_key: str = Security(api_key_header)) -> str:
    """
    Validates API key passed via X-API-Key header using constant-time comparison.
    Used for machine-to-machine, developer, and administrative endpoints.
    """
    expected_key = get_expected_api_key()

    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Missing required API key header '{security_settings.api_key_name}'",
            headers={"WWW-Authenticate": "ApiKey"},
        )
    
    if not secrets.compare_digest(api_key, expected_key):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key provided",
            headers={"WWW-Authenticate": "ApiKey"},
        )
    
    return api_key


def verify_api_or_user_auth(
    api_key: Optional[str] = Security(api_key_header),
    authorization: Optional[str] = Header(None, alias="Authorization"),
    x_user_id: Optional[str] = Header(None, alias="X-User-Id"),
    user_id: Optional[str] = Query(None, alias="user_id"),
) -> None:
    """
    Dual Authentication Guard for Application Endpoints.
    Grants access if the caller provides:
    1. A valid X-API-Key (developer, script, or server-to-server access), OR
    2. A valid Supabase JWT Bearer token (authenticated dashboard web users), OR
    3. In development/testing environments: user identity via X-User-Id or user_id query parameter.

    Rejects requests that provide an invalid API key, invalid Bearer token, or no authentication credentials.
    """
    api_key_val = api_key if isinstance(api_key, str) else None
    auth_val = authorization if isinstance(authorization, str) else None
    x_user_val = x_user_id if isinstance(x_user_id, str) else None
    user_val = user_id if isinstance(user_id, str) else None

    # 1. If API key is provided, validate it strictly
    if api_key_val and api_key_val.strip():
        expected_key = get_expected_api_key()
        if not secrets.compare_digest(api_key_val.strip(), expected_key):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid API key provided",
                headers={"WWW-Authenticate": "ApiKey"},
            )
        return

    # 2. Check for User Authentication (Bearer Token)
    if auth_val:
        auth_clean = auth_val.strip()
        if auth_clean.lower().startswith("bearer "):
            token = auth_clean[7:].strip()
            if token:
                try:
                    payload = verify_supabase_jwt(token)
                    uid = payload.get("sub") or payload.get("id")
                    if uid:
                        return
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Authentication token missing user subject ('sub').",
                        headers={"WWW-Authenticate": "Bearer"},
                    )
                except HTTPException:
                    if is_production():
                        raise
            elif is_production():
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Empty Bearer token provided in Authorization header.",
                    headers={"WWW-Authenticate": "Bearer"},
                )
        elif is_production():
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid Authorization header scheme. Expected 'Bearer <token>'.",
                headers={"WWW-Authenticate": "Bearer"},
            )

    # 3. Development / Testing user identity fallback
    if not is_production():
        uid = x_user_val or user_val
        if uid and uid.strip():
            return

    # 4. No valid credentials provided
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication required: provide a valid API key or Bearer token.",
        headers={"WWW-Authenticate": "Bearer, ApiKey"},
    )

