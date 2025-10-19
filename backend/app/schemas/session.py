from __future__ import annotations

import uuid
from datetime import datetime

from app.models.enums import ParticipantRole, SessionStatus
from app.schemas.base import ORMModel
from app.schemas.profile import ProfileRead


class SessionParticipantRead(ORMModel):
    id: uuid.UUID
    session_id: uuid.UUID
    user_id: uuid.UUID
    role: ParticipantRole
    user: ProfileRead | None = None


class SessionRead(ORMModel):
    id: uuid.UUID
    group_id: uuid.UUID | None
    creator_id: uuid.UUID
    status: SessionStatus
    started_at: datetime | None
    ended_at: datetime | None
    created_at: datetime
    participants: list[SessionParticipantRead] = []


class SessionCreate(ORMModel):
    group_id: uuid.UUID | None = None
    scheduled_start: datetime | None = None


class SessionStatusUpdate(ORMModel):
    status: SessionStatus
    timestamp: datetime | None = None


class TimeLogCreate(ORMModel):
    user_id: uuid.UUID
    started_at: datetime
    ended_at: datetime


class SessionParticipantCreate(ORMModel):
    user_id: uuid.UUID
    role: ParticipantRole = ParticipantRole.PARTICIPANT
