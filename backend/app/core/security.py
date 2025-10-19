from __future__ import annotations

import time
from typing import Any

import httpx
from jose import JWTError, jwt

from app.core.config import get_settings

settings = get_settings()

_ISSUER = None
_JWKS_CACHE: dict[str, Any] = {}
_JWKS_EXP = 0.0
_JWKS_TTL = 60 * 60  # 1 hour


def _issuer() -> str:
    global _ISSUER
    if _ISSUER is None:
        if not settings.aws_region or not settings.cognito_user_pool_id:
            raise RuntimeError("Cognito configuration is missing")
        _ISSUER = f"https://cognito-idp.{settings.aws_region}.amazonaws.com/{settings.cognito_user_pool_id}"
    return _ISSUER


async def _refresh_jwks() -> None:
    global _JWKS_CACHE, _JWKS_EXP
    jwks_url = f"{_issuer()}/.well-known/jwks.json"
    async with httpx.AsyncClient(timeout=10) as client:
        response = await client.get(jwks_url)
        response.raise_for_status()
        data = response.json()
        _JWKS_CACHE = {key["kid"]: key for key in data.get("keys", [])}
        _JWKS_EXP = time.time() + _JWKS_TTL


async def get_signing_key(kid: str) -> dict[str, Any]:
    if not _JWKS_CACHE or time.time() >= _JWKS_EXP:
        await _refresh_jwks()
    key = _JWKS_CACHE.get(kid)
    if not key:
        await _refresh_jwks()
        key = _JWKS_CACHE.get(kid)
    if not key:
        raise JWTError("Unable to find matching JWKS key")
    return key


async def verify_token(token: str) -> dict[str, Any]:
    if not settings.cognito_app_client_id:
        raise RuntimeError("Cognito app client id not configured")

    header = jwt.get_unverified_header(token)
    kid = header.get("kid")
    if not kid:
        raise JWTError("Token header missing 'kid'")

    key = await get_signing_key(kid)
    payload = jwt.decode(
        token,
        key,
        algorithms=["RS256"],
        audience=settings.cognito_app_client_id,
        issuer=_issuer(),
    )
    return payload
