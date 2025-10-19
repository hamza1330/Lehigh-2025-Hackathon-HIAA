from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Select, select
from sqlalchemy.orm import selectinload

from app.models import Notification
from app.models.enums import NotificationStatus


async def list_notifications(
    session,
    user_id: uuid.UUID,
    *,
    unread: bool | None = None,
    cursor_created_at: datetime | None = None,
    cursor_id: uuid.UUID | None = None,
    limit: int = 20,
) -> list[Notification]:
    stmt: Select[tuple[Notification]] = (
        select(Notification)
        .where(Notification.recipient_id == user_id)
        .order_by(Notification.created_at.desc(), Notification.id.desc())
        .options(selectinload(Notification.group))
    )
    if unread is not None:
        if unread:
            stmt = stmt.where(Notification.status == NotificationStatus.PENDING)
        else:
            stmt = stmt.where(Notification.status != NotificationStatus.PENDING)
    if cursor_created_at and cursor_id:
        stmt = stmt.where(
            (Notification.created_at, Notification.id)
            < (cursor_created_at, cursor_id)
        )
    stmt = stmt.limit(min(limit, 100))
    result = await session.execute(stmt)
    return list(result.scalars().all())


async def mark_read(session, notification: Notification) -> Notification:
    if notification.status == NotificationStatus.PENDING:
        notification.status = NotificationStatus.READ
    notification.read_at = datetime.utcnow()
    session.add(notification)
    await session.flush()
    return notification


async def update_status(session, notification: Notification, status: NotificationStatus) -> Notification:
    notification.status = status
    if status == NotificationStatus.READ:
        notification.read_at = datetime.utcnow()
    session.add(notification)
    await session.flush()
    return notification


async def get_notification(session, notification_id: uuid.UUID, user_id: uuid.UUID) -> Notification | None:
    stmt = (
        select(Notification)
        .where(Notification.id == notification_id, Notification.recipient_id == user_id)
        .options(selectinload(Notification.group))
    )
    result = await session.execute(stmt)
    return result.scalar_one_or_none()
