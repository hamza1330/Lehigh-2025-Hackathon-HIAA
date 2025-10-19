from __future__ import annotations

import uuid
from datetime import datetime

from app.models.enums import GoalPeriod, GroupStatus
from app.schemas.base import ORMModel
from app.schemas.member import GroupMemberRead
from app.schemas.session import SessionRead


class GroupRead(ORMModel):
    id: uuid.UUID
    owner_id: uuid.UUID
    name: str
    description: str | None
    start_at: datetime
    end_at: datetime
    timezone: str
    period: GoalPeriod
    period_target_minutes: int
    status: GroupStatus
    created_at: datetime
    updated_at: datetime
    members: list[GroupMemberRead] = []
    sessions: list[SessionRead] = []


class GroupCreate(ORMModel):
    name: str
    description: str | None = None
    start_at: datetime
    end_at: datetime
    timezone: str
    period: GoalPeriod
    period_target_minutes: int


class GroupListItem(ORMModel):
    id: uuid.UUID
    owner_id: uuid.UUID
    name: str
    description: str | None
    start_at: datetime
    end_at: datetime
    timezone: str
    period: GoalPeriod
    period_target_minutes: int
    status: GroupStatus
    created_at: datetime
    updated_at: datetime
