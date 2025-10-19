from __future__ import annotations

import uuid
from typing import Tuple

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.models import AuthIdentity, Profile


async def get_profile_by_identity(session, provider: str, subject: str) -> Profile | None:
    stmt = (
        select(AuthIdentity)
        .options(selectinload(AuthIdentity.profile))
        .where(AuthIdentity.provider == provider, AuthIdentity.subject == subject)
    )
    result = await session.execute(stmt)
    identity = result.scalar_one_or_none()
    return identity.profile if identity else None


async def get_or_create_profile(
    session,
    provider: str,
    subject: str,
    email: str | None = None,
    display_name: str | None = None,
) -> tuple[Profile, bool]:
    profile = await get_profile_by_identity(session, provider, subject)
    created = False
    if profile:
        return profile, created

    generated_email = email or f"{subject}@{provider}.lockin"
    profile = Profile(email=generated_email.lower(), display_name=display_name)
    session.add(profile)
    await session.flush()

    identity = AuthIdentity(provider=provider, subject=subject, profile=profile)
    session.add(identity)
    await session.flush()
    created = True

    return profile, created
