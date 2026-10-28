"""
Cryptographic Supabase JWT Authentication & Token Verification.
Verifies signed Bearer tokens to extract authenticated tenant user IDs,
supporting both local HMAC-SHA256 signature verification and
direct cryptographic validation against the Supabase Auth API with in-memory caching.
"""
import os
import json
import time
import base64
import hmac
import hashlib
from typing import Dict, Any, Tuple
from fastapi import HTTPException, status
import httpx

# In-memory cache for verified tokens: token_hash -> (payload, expire_at)
_TOKEN_CACHE: Dict[str, Tuple[Dict[str, Any], float]] = {}
CACHE_TTL_SECONDS = 60.0


def _base64url_decode(input_str: str) -> bytes:
    """Decodes standard base64url string with proper padding."""
    rem = len(input_str) % 4
    if rem > 0:
        input_str += "=" * (4 - rem)
    return base64.urlsafe_b64decode(input_str)


def _base64url_encode(data: bytes) -> str:
    """Encodes bytes to base64url string without trailing padding."""
    return base64.urlsafe_b64encode(data).decode("ascii").rstrip("=")


def decode_jwt_unverified(token: str) -> Tuple[Dict[str, Any], Dict[str, Any], bytes, str, str]:
    """
    Decodes JWT token into header and payload without verifying signature.
    Raises HTTPException 401 if token structure is malformed.
    """
    parts = token.strip().split(".")
    if len(parts) != 3:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Malformed authentication token: expected standard 3-segment JWT.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    header_b64, payload_b64, sig_b64 = parts
    try:
        header = json.loads(_base64url_decode(header_b64).decode("utf-8"))
        payload = json.loads(_base64url_decode(payload_b64).decode("utf-8"))
        sig = _base64url_decode(sig_b64)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Failed to decode token segments: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return header, payload, sig, header_b64, payload_b64


def verify_jwt_signature_hs256(token: str, secret: str) -> Dict[str, Any]:
    """
    Cryptographically verifies HS256 JWT signature using constant-time HMAC comparison.
    Validates expiration timestamp (exp).
    """
    header, payload, actual_sig, header_b64, payload_b64 = decode_jwt_unverified(token)

    if header.get("alg") != "HS256":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Unsupported JWT algorithm '{header.get('alg')}' for local HMAC verification.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    signing_input = f"{header_b64}.{payload_b64}".encode("ascii")
    expected_sig = hmac.new(secret.encode("utf-8"), signing_input, hashlib.sha256).digest()

    matched = hmac.compare_digest(expected_sig, actual_sig)
    if not matched:
        # Supabase generates base64-encoded JWT secrets; check base64-decoded bytes if applicable
        try:
            b64_secret = base64.b64decode(secret)
            expected_sig_b64 = hmac.new(b64_secret, signing_input, hashlib.sha256).digest()
            if hmac.compare_digest(expected_sig_b64, actual_sig):
                matched = True
        except Exception:
            pass

    if not matched:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token signature: cryptographic verification failed.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Validate expiration
    exp = payload.get("exp")
    if exp is not None and time.time() > float(exp):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token has expired.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return payload


def verify_jwt_via_supabase_api(token: str, supabase_url: str, anon_key: str) -> Dict[str, Any]:
    """
    Cryptographically validates token by querying the Supabase Auth verification endpoint.
    Handles asymmetric (RS256/ES256) and project-signed Supabase tokens.
    """
    endpoint = f"{supabase_url.rstrip('/')}/auth/v1/user"
    headers = {
        "Authorization": f"Bearer {token}",
        "apikey": anon_key,
    }

    try:
        with httpx.Client(timeout=5.0) as client:
            resp = client.get(endpoint, headers=headers)
            if resp.status_code == 200:
                user_data = resp.json()
                return {
                    "sub": user_data.get("id"),
                    "email": user_data.get("email"),
                    "role": user_data.get("role", "authenticated"),
                    "user_metadata": user_data.get("user_metadata", {}),
                }
            elif resp.status_code in (401, 403):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid, revoked, or expired Supabase authentication token.",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail=f"Supabase Auth service returned unexpected status {resp.status_code}.",
                )
    except httpx.RequestError as err:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Unable to reach Supabase Auth service for token verification: {str(err)}",
        )


def verify_supabase_jwt(token: str) -> Dict[str, Any]:
    """
    Main verification pipeline for incoming Supabase JWT Bearer tokens.
    Uses in-memory TTL caching to maintain high API throughput.
    """
    token_clean = token.strip()
    if not token_clean:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Empty authentication token provided.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 1. Check in-memory cache
    token_hash = hashlib.sha256(token_clean.encode("utf-8")).hexdigest()
    now = time.time()
    if token_hash in _TOKEN_CACHE:
        cached_payload, expire_at = _TOKEN_CACHE[token_hash]
        if now < expire_at:
            return cached_payload
        else:
            del _TOKEN_CACHE[token_hash]

    # 2. Strategy A: Local secret HMAC-SHA256 (if SUPABASE_JWT_SECRET is configured)
    jwt_secret = os.getenv("SUPABASE_JWT_SECRET")
    if jwt_secret and jwt_secret.strip():
        payload = verify_jwt_signature_hs256(token_clean, jwt_secret.strip())
        cache_duration = min(CACHE_TTL_SECONDS, max(5.0, float(payload.get("exp", now + 60)) - now))
        _TOKEN_CACHE[token_hash] = (payload, now + cache_duration)
        return payload

    # 3. Strategy B: Supabase Auth Verification API
    supabase_url = os.getenv("NEXT_PUBLIC_SUPABASE_URL") or os.getenv("SUPABASE_URL")
    supabase_anon_key = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY") or os.getenv("SUPABASE_ANON_KEY")

    if supabase_url and supabase_anon_key:
        payload = verify_jwt_via_supabase_api(token_clean, supabase_url.strip(), supabase_anon_key.strip())
        _TOKEN_CACHE[token_hash] = (payload, now + CACHE_TTL_SECONDS)
        return payload

    # 4. Fallback if no verification secrets or URLs are available (local development only)
    from src.geo_tracker.config import is_production
    if is_production():
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Server configuration error: Neither SUPABASE_JWT_SECRET nor NEXT_PUBLIC_SUPABASE_URL is configured for token verification.",
        )

    # In non-production without configured Supabase URL, decode payload for testing
    _, payload, _, _, _ = decode_jwt_unverified(token_clean)
    return payload
