from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.models import Profile
from app.schemas.profile import ProfileRead, ProfileUpdate

router = APIRouter(prefix="/api/me", tags=["profile"])


@router.get("", response_model=ProfileRead)
async def read_me(current_user: Profile = Depends(get_current_user)) -> ProfileRead:
    return ProfileRead.model_validate(current_user)


@router.patch("", response_model=ProfileRead)
async def update_me(
    payload: ProfileUpdate,
    session: AsyncSession = Depends(get_db),
    current_user: Profile = Depends(get_current_user),
) -> ProfileRead:
    if payload.display_name is not None:
        current_user.display_name = payload.display_name
    if payload.avatar_url is not None:
        current_user.avatar_url = payload.avatar_url

    session.add(current_user)
    await session.commit()
    await session.refresh(current_user)
    return ProfileRead.model_validate(current_user)
