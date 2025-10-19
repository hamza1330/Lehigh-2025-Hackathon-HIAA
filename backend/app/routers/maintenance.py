from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.models import Profile

router = APIRouter(prefix="/api/maintenance", tags=["maintenance"])


@router.post("/archive-expired-groups")
async def archive_expired_groups(
    current_user: Profile = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> dict[str, int]:
    # In a real app, restrict to admins / cron jobs.
    result = await session.execute(text("SELECT archive_expired_groups() AS affected"))
    row = result.mappings().first()
    count = int(row["affected"]) if row else 0
    return {"archived": count}
