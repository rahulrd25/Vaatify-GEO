import os
import secrets
from fastapi import Security, HTTPException, status
from fastapi.security import APIKeyHeader
from pydantic_settings import BaseSettings, SettingsConfigDict

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
