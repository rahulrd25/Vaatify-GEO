"""
Unit Tests for Cryptographic Supabase JWT Authentication & Tenant Scoping.
Validates HMAC-SHA256 signature checking, expiration verification,
Supabase Auth endpoint integration, and tenant ID extraction.
"""
import os
import json
import time
import hmac
import hashlib
import pytest
from unittest.mock import MagicMock, patch
from fastapi import HTTPException

from src.geo_tracker.api.security.jwt_auth import (
    _base64url_encode,
    verify_jwt_signature_hs256,
    verify_jwt_via_supabase_api,
    verify_supabase_jwt,
    _TOKEN_CACHE
)
from src.geo_tracker.api.utils.tenant import get_current_user_id


def create_test_jwt(payload: dict, secret: str = "test-jwt-secret-key-1234567890") -> str:
    """Helper to create a cryptographically valid HS256 JWT for tests."""
    header = {"alg": "HS256", "typ": "JWT"}
    header_b64 = _base64url_encode(json.dumps(header).encode("utf-8"))
    payload_b64 = _base64url_encode(json.dumps(payload).encode("utf-8"))
    signing_input = f"{header_b64}.{payload_b64}".encode("ascii")
    sig = hmac.new(secret.encode("utf-8"), signing_input, hashlib.sha256).digest()
    sig_b64 = _base64url_encode(sig)
    return f"{header_b64}.{payload_b64}.{sig_b64}"


@pytest.fixture(autouse=True)
def clear_token_cache():
    _TOKEN_CACHE.clear()
    yield
    _TOKEN_CACHE.clear()


def test_hs256_jwt_valid_signature_success(monkeypatch):
    test_secret = "my-secret-key-32-bytes-minimum-length-!"
    monkeypatch.setenv("SUPABASE_JWT_SECRET", test_secret)

    payload = {
        "sub": "user_real_uuid_999",
        "email": "sarah@acme.com",
        "exp": time.time() + 3600
    }
    token = create_test_jwt(payload, test_secret)

    verified = verify_supabase_jwt(token)
    assert verified["sub"] == "user_real_uuid_999"
    assert verified["email"] == "sarah@acme.com"


def test_hs256_jwt_tampered_signature_failure(monkeypatch):
    test_secret = "my-secret-key-32-bytes-minimum-length-!"
    monkeypatch.setenv("SUPABASE_JWT_SECRET", test_secret)

    payload = {
        "sub": "user_real_uuid_999",
        "exp": time.time() + 3600
    }
    token = create_test_jwt(payload, "wrong-secret-key")

    with pytest.raises(HTTPException) as exc_info:
        verify_supabase_jwt(token)
    assert exc_info.value.status_code == 401
    assert "Invalid token signature" in exc_info.value.detail


def test_hs256_jwt_expired_token_failure(monkeypatch):
    test_secret = "my-secret-key-32-bytes-minimum-length-!"
    monkeypatch.setenv("SUPABASE_JWT_SECRET", test_secret)

    # Expired 100 seconds ago
    payload = {
        "sub": "user_expired_uuid",
        "exp": time.time() - 100
    }
    token = create_test_jwt(payload, test_secret)

    with pytest.raises(HTTPException) as exc_info:
        verify_supabase_jwt(token)
    assert exc_info.value.status_code == 401
    assert "token has expired" in exc_info.value.detail


def test_supabase_api_verification_success(monkeypatch):
    monkeypatch.delenv("SUPABASE_JWT_SECRET", raising=False)
    monkeypatch.setenv("NEXT_PUBLIC_SUPABASE_URL", "https://demo.supabase.co")
    monkeypatch.setenv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-test-key")

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {
        "id": "supabase_user_uuid_777",
        "email": "alex@company.com",
        "role": "authenticated"
    }

    dummy_token = "mock.header.payload.signature"
    # Create valid 3-part token
    dummy_token = create_test_jwt({"sub": "supabase_user_uuid_777", "exp": time.time() + 3600})

    with patch("httpx.Client.get", return_value=mock_resp) as mock_get:
        verified = verify_supabase_jwt(dummy_token)
        assert verified["sub"] == "supabase_user_uuid_777"
        assert verified["email"] == "alex@company.com"
        assert mock_get.called


def test_supabase_api_verification_invalid_401(monkeypatch):
    monkeypatch.delenv("SUPABASE_JWT_SECRET", raising=False)
    monkeypatch.setenv("NEXT_PUBLIC_SUPABASE_URL", "https://demo.supabase.co")
    monkeypatch.setenv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-test-key")

    mock_resp = MagicMock()
    mock_resp.status_code = 401
    mock_resp.json.return_value = {"message": "Invalid JWT"}

    dummy_token = create_test_jwt({"sub": "test", "exp": time.time() + 3600})

    with patch("httpx.Client.get", return_value=mock_resp):
        with pytest.raises(HTTPException) as exc_info:
            verify_supabase_jwt(dummy_token)
        assert exc_info.value.status_code == 401
        assert "Invalid, revoked, or expired" in exc_info.value.detail


def test_get_current_user_id_prioritizes_bearer_over_spoofed_header(monkeypatch):
    test_secret = "secret-key-for-tenant-test-12345"
    monkeypatch.setenv("SUPABASE_JWT_SECRET", test_secret)

    token = create_test_jwt({"sub": "legitimate_user_uuid", "exp": time.time() + 3600}, test_secret)

    resolved_uid = get_current_user_id(
        authorization=f"Bearer {token}",
        x_user_id="attacker_spoofed_user_uuid"
    )
    # Must strictly use verified user from JWT, completely discarding spoofed header
    assert resolved_uid == "legitimate_user_uuid"


def test_production_mode_rejects_missing_bearer_token(monkeypatch):
    monkeypatch.setenv("ENV", "production")

    with pytest.raises(HTTPException) as exc_info:
        get_current_user_id(
            authorization=None,
            x_user_id="some_user_without_token"
        )
    assert exc_info.value.status_code == 401
    assert "missing Bearer token" in exc_info.value.detail


def test_token_cache_avoids_repeated_api_calls(monkeypatch):
    monkeypatch.delenv("SUPABASE_JWT_SECRET", raising=False)
    monkeypatch.setenv("NEXT_PUBLIC_SUPABASE_URL", "https://demo.supabase.co")
    monkeypatch.setenv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-test-key")

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {"id": "cached_user_uuid", "email": "test@demo.com"}

    token = create_test_jwt({"sub": "cached_user_uuid", "exp": time.time() + 3600})

    with patch("httpx.Client.get", return_value=mock_resp) as mock_get:
        # First call -> hits API
        res1 = verify_supabase_jwt(token)
        assert res1["sub"] == "cached_user_uuid"
        assert mock_get.call_count == 1

        # Second call -> must use cache, no second API call
        res2 = verify_supabase_jwt(token)
        assert res2["sub"] == "cached_user_uuid"
        assert mock_get.call_count == 1
