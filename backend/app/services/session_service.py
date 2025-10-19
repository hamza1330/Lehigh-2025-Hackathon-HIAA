from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.models import Session, SessionParticipant, TimeLog
from app.models.enums import ParticipantRole, SessionStatus


async def get_session(session, session_id: uuid.UUID) -> Session | None:
    stmt = (
        select(Session)
        .where(Session.id == session_id)
        .options(selectinload(Session.participants).selectinload(SessionParticipant.user))
    )
    result = await session.execute(stmt)
    return result.scalar_one_or_none()


async def create_session(
    db,
    *,
    creator_id: uuid.UUID,
    group_id: uuid.UUID | None,
    scheduled_start: datetime | None = None,
) -> Session:
    new_session = Session(group_id=group_id, creator_id=creator_id, status=SessionStatus.SCHEDULED)
    if scheduled_start:
        new_session.started_at = scheduled_start
    db.add(new_session)
    await db.flush()

    host = SessionParticipant(session_id=new_session.id, user_id=creator_id, role=ParticipantRole.HOST)
    db.add(host)
    await db.flush()
    await db.refresh(new_session, attribute_names=["participants"])
    return new_session


async def update_session_status(db, session_obj: Session, status: SessionStatus, timestamp: datetime | None = None) -> Session:
    session_obj.status = status
    if status == SessionStatus.RUNNING and timestamp:
        session_obj.started_at = timestamp
    elif status in (SessionStatus.ENDED, SessionStatus.CANCELLED) and timestamp:
        session_obj.ended_at = timestamp
    db.add(session_obj)
    await db.flush()
    await db.refresh(session_obj, attribute_names=["participants"])
    return session_obj


async def add_time_log(db, participant: SessionParticipant, started_at: datetime, ended_at: datetime) -> TimeLog:
    log = TimeLog(participant_id=participant.id, started_at=started_at, ended_at=ended_at)
    db.add(log)
    await db.flush()
    return log


async def get_participant(db, session_id: uuid.UUID, user_id: uuid.UUID) -> SessionParticipant | None:
    result = await db.execute(
        select(SessionParticipant)
        .where(
            SessionParticipant.session_id == session_id,
            SessionParticipant.user_id == user_id,
        )
        .options(selectinload(SessionParticipant.user))
    )
    return result.scalar_one_or_none()


async def ensure_participant(db, session_id: uuid.UUID, user_id: uuid.UUID) -> SessionParticipant:
    participant = await get_participant(db, session_id, user_id)
    if participant is None:
        participant = SessionParticipant(session_id=session_id, user_id=user_id, role=ParticipantRole.PARTICIPANT)
        db.add(participant)
        await db.flush()
        await db.refresh(participant)
    return participant
