from __future__ import annotations

import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.models import Profile
from app.models.enums import SessionStatus
from app.schemas.session import (
    SessionCreate,
    SessionRead,
    SessionParticipantRead,
    SessionStatusUpdate,
    TimeLogCreate,
)
from app.services import group_service, session_service

router = APIRouter(prefix="/api/sessions", tags=["sessions"])


@router.post("", response_model=SessionRead, status_code=status.HTTP_201_CREATED)
async def create_session(
    payload: SessionCreate,
    current_user: Profile = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> SessionRead:
    if payload.group_id:
        group = await group_service.get_group(session, payload.group_id)
        if group is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")
        if all(member.user_id != current_user.id for member in group.members):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a member of this group")

    created = await session_service.create_session(
        session,
        creator_id=current_user.id,
        group_id=payload.group_id,
        scheduled_start=payload.scheduled_start,
    )
    await session.commit()
    db_session = await session_service.get_session(session, created.id)
    if db_session is None:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Session creation failed")
    return SessionRead.model_validate(db_session)


@router.get("/{session_id}", response_model=SessionRead)
async def get_session(
    session_id: uuid.UUID,
    current_user: Profile = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> SessionRead:
    db_session = await session_service.get_session(session, session_id)
    if db_session is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    if db_session.group_id:
        group = await group_service.get_group(session, db_session.group_id)
        if group is None or all(member.user_id != current_user.id for member in group.members):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed")

    return SessionRead.model_validate(db_session)


@router.post("/{session_id}:status", response_model=SessionRead)
async def update_session_status(
    session_id: uuid.UUID,
    payload: SessionStatusUpdate,
    current_user: Profile = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> SessionRead:
    db_session = await session_service.get_session(session, session_id)
    if db_session is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    if db_session.creator_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only host can modify session")

    timestamp = payload.timestamp or datetime.utcnow()

    updated = await session_service.update_session_status(session, db_session, payload.status, timestamp)
    await session.commit()
    refreshed = await session_service.get_session(session, session_id)
    if refreshed is None:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Session update failed")
    return SessionRead.model_validate(refreshed)


@router.post("/{session_id}/participants", response_model=SessionParticipantRead, status_code=status.HTTP_201_CREATED)
async def ensure_participant(
    session_id: uuid.UUID,
    current_user: Profile = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> SessionParticipantRead:
    db_session = await session_service.get_session(session, session_id)
    if db_session is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    if db_session.group_id:
        group = await group_service.get_group(session, db_session.group_id)
        if group is None or all(member.user_id != current_user.id for member in group.members):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed")

    participant = await session_service.ensure_participant(session, session_id, current_user.id)
    await session.commit()
    return SessionParticipantRead.model_validate(participant)


@router.post("/{session_id}/logs", status_code=status.HTTP_201_CREATED)
async def create_time_log(
    session_id: uuid.UUID,
    payload: TimeLogCreate,
    current_user: Profile = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> dict[str, str]:
    db_session = await session_service.get_session(session, session_id)
    if db_session is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    if db_session.group_id:
        group = await group_service.get_group(session, db_session.group_id)
        if group is None or all(member.user_id != current_user.id for member in group.members):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed")

    participant = await session_service.ensure_participant(session, session_id, payload.user_id)

    await session_service.add_time_log(
        session,
        participant,
        started_at=payload.started_at,
        ended_at=payload.ended_at,
    )
    await session.commit()
    return {"status": "logged"}
