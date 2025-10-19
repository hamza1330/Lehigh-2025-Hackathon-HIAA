from __future__ import annotations

import uuid

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.database import get_db
from app.core.security import verify_token
from app.models import Profile
from app.services import auth_service

security = HTTPBearer(auto_error=False)
settings = get_settings()

PROVIDER = "cognito"
ANON_PROVIDER = "demo"
ANON_SUBJECT = "anonymous"
ANON_EMAIL = "anonymous@lockin.demo"


async def _ensure_profile(
    session: AsyncSession,
    *,
    provider: str,
    subject: str,
    email: str | None = None,
    display_name: str | None = None,
) -> Profile:
    profile, created = await auth_service.get_or_create_profile(
        session,
        provider=provider,
        subject=subject,
        email=email,
        display_name=display_name,
    )
    if created:
        await session.commit()
    else:
        await session.flush()
    return profile


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    session: AsyncSession = Depends(get_db),
) -> Profile:
    if credentials is None:
        if settings.allow_anonymous:
            return await _ensure_profile(
                session,
                provider=ANON_PROVIDER,
                subject=ANON_SUBJECT,
                email=ANON_EMAIL,
                display_name="Demo User",
            )
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    token = credentials.credentials
    try:
        payload = await verify_token(token)
    except JWTError as exc:  # pragma: no cover
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        ) from exc

    subject = payload.get("sub")
    if not subject:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token missing subject")

    email = payload.get("email")
    display_name = payload.get("name") or payload.get("cognito:username")

    return await _ensure_profile(
        session,
        provider=PROVIDER,
        subject=subject,
        email=email,
        display_name=display_name,
    )
