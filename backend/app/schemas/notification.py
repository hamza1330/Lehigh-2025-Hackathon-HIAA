from __future__ import annotations

import uuid
from datetime import datetime

from app.models.enums import NotificationKind, NotificationStatus
from app.schemas.base import ORMModel
from app.schemas.group import GroupListItem


class NotificationRead(ORMModel):
    id: uuid.UUID
    recipient_id: uuid.UUID
    kind: NotificationKind
    status: NotificationStatus
    title: str | None
    body: str | None
    group_id: uuid.UUID | None
    created_at: datetime
    read_at: datetime | None
    group: GroupListItem | None = None
