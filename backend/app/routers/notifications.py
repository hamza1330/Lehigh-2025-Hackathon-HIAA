from __future__ import annotations

import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.models import Profile
from app.models.enums import NotificationKind, NotificationStatus
from app.schemas.notification import NotificationRead
from app.services import group_service, notification_service

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


@router.get("", response_model=list[NotificationRead])
async def list_notifications(
    unread: bool | None = Query(default=None),
    cursor_created_at: datetime | None = Query(default=None),
    cursor_id: uuid.UUID | None = Query(default=None),
    limit: int = Query(default=20, ge=1, le=100),
    current_user: Profile = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> list[NotificationRead]:
    rows = await notification_service.list_notifications(
        session,
        current_user.id,
        unread=unread,
        cursor_created_at=cursor_created_at,
        cursor_id=cursor_id,
        limit=limit,
    )
    return [NotificationRead.model_validate(row) for row in rows]


@router.get("/{notification_id}", response_model=NotificationRead)
async def get_notification_detail(
    notification_id: uuid.UUID,
    current_user: Profile = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> NotificationRead:
    notification = await notification_service.get_notification(session, notification_id, current_user.id)
    if notification is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
    return NotificationRead.model_validate(notification)


@router.post("/{notification_id}:read", response_model=NotificationRead)
async def mark_read(
    notification_id: uuid.UUID,
    current_user: Profile = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> NotificationRead:
    notification = await notification_service.get_notification(session, notification_id, current_user.id)
    if notification is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")

    async with session.begin():
        updated = await notification_service.mark_read(session, notification)
    return NotificationRead.model_validate(updated)


async def _ensure_invite(notification) -> None:
    if notification.kind != NotificationKind.GROUP_INVITE:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Not an invite notification")
    if notification.group_id is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invite missing group context")
    if notification.status not in (NotificationStatus.PENDING, NotificationStatus.READ):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invite already resolved")


@router.post("/{notification_id}:accept", response_model=NotificationRead)
async def accept_invite(
    notification_id: uuid.UUID,
    current_user: Profile = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> NotificationRead:
    notification = await notification_service.get_notification(session, notification_id, current_user.id)
    if notification is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
    await _ensure_invite(notification)

    group = await group_service.get_group(session, notification.group_id)
    if group is None:
        raise HTTPException(status_code=status.HTTP_410_GONE, detail="Group no longer exists")

    async with session.begin():
        try:
            await group_service.add_member(session, group.id, current_user)
        except ValueError:
            pass
        updated = await notification_service.update_status(session, notification, NotificationStatus.ACCEPTED)

    return NotificationRead.model_validate(updated)


@router.post("/{notification_id}:decline", response_model=NotificationRead)
async def decline_invite(
    notification_id: uuid.UUID,
    current_user: Profile = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> NotificationRead:
    notification = await notification_service.get_notification(session, notification_id, current_user.id)
    if notification is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
    await _ensure_invite(notification)

    async with session.begin():
        updated = await notification_service.update_status(session, notification, NotificationStatus.DECLINED)

    return NotificationRead.model_validate(updated)
