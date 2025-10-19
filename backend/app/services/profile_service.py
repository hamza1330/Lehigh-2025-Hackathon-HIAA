from __future__ import annotations

import uuid

from sqlalchemy import select

from app.models import Profile


async def get_profile(session, profile_id: uuid.UUID) -> Profile | None:
    result = await session.execute(select(Profile).where(Profile.id == profile_id))
    return result.scalar_one_or_none()
