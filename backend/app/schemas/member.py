from __future__ import annotations

import uuid

from app.models.enums import MemberRole
from app.schemas.base import ORMModel
from app.schemas.profile import ProfileRead


class GroupMemberRead(ORMModel):
    id: uuid.UUID
    group_id: uuid.UUID
    user_id: uuid.UUID
    role: MemberRole
    override_period_target_minutes: int | None
    user: ProfileRead | None = None


class GroupMemberCreate(ORMModel):
    user_id: uuid.UUID
    role: MemberRole = MemberRole.MEMBER
    override_period_target_minutes: int | None = None


class GroupMemberUpdate(ORMModel):
    role: MemberRole | None = None
    override_period_target_minutes: int | None = None
