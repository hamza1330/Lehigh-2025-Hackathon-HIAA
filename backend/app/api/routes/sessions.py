from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from datetime import datetime

from app.core.database import get_db
from app.models import Profile, Session as SessionModel, SessionParticipant, TimeLog, GroupMember
from app.schemas import (
    SessionCreate, SessionUpdate, Session as SessionSchema, SessionWithParticipants,
    SessionParticipantCreate, SessionParticipant as SessionParticipantSchema,
    TimeLogCreate, TimeLog as TimeLogSchema
)
from app.api.routes.auth import get_current_user

router = APIRouter()

@router.post("/sessions", response_model=SessionSchema)
async def create_session(
    session_data: SessionCreate,
    current_user: Profile = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new session"""
    # If group_id is provided, check if user is a member
    if session_data.group_id:
        membership = db.query(GroupMember).filter(
            GroupMember.group_id == session_data.group_id,
            GroupMember.user_id == current_user.id
        ).first()
        
        if not membership:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not a member of this group"
            )
    
    session = SessionModel(
        creator_id=current_user.id,
        **session_data.dict()
    )
    db.add(session)
    db.flush()  # Get the ID
    
    # Add creator as a participant
    participant = SessionParticipant(
        session_id=session.id,
        user_id=current_user.id,
        role="host"
    )
    db.add(participant)
    db.commit()
    db.refresh(session)
    return session

@router.post("/sessions/{session_id}:start")
async def start_session(
    session_id: UUID,
    current_user: Profile = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Start a session"""
    session = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    # Check if user is a participant
    participant = db.query(SessionParticipant).filter(
        SessionParticipant.session_id == session_id,
        SessionParticipant.user_id == current_user.id
    ).first()
    
    if not participant:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a participant in this session"
        )
    
    session.status = "running"
    session.started_at = datetime.utcnow()
    db.commit()
    
    return {"message": "Session started successfully"}

@router.post("/sessions/{session_id}:pause")
async def pause_session(
    session_id: UUID,
    current_user: Profile = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Pause a session"""
    session = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    # Check if user is a participant
    participant = db.query(SessionParticipant).filter(
        SessionParticipant.session_id == session_id,
        SessionParticipant.user_id == current_user.id
    ).first()
    
    if not participant:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a participant in this session"
        )
    
    session.status = "paused"
    db.commit()
    
    return {"message": "Session paused successfully"}

@router.post("/sessions/{session_id}:resume")
async def resume_session(
    session_id: UUID,
    current_user: Profile = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Resume a session"""
    session = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    # Check if user is a participant
    participant = db.query(SessionParticipant).filter(
        SessionParticipant.session_id == session_id,
        SessionParticipant.user_id == current_user.id
    ).first()
    
    if not participant:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a participant in this session"
        )
    
    session.status = "running"
    db.commit()
    
    return {"message": "Session resumed successfully"}

@router.post("/sessions/{session_id}:stop")
async def stop_session(
    session_id: UUID,
    current_user: Profile = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Stop a session"""
    session = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    # Check if user is a participant
    participant = db.query(SessionParticipant).filter(
        SessionParticipant.session_id == session_id,
        SessionParticipant.user_id == current_user.id
    ).first()
    
    if not participant:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a participant in this session"
        )
    
    session.status = "ended"
    session.ended_at = datetime.utcnow()
    db.commit()
    
    return {"message": "Session stopped successfully"}

@router.post("/sessions/{session_id}/logs", response_model=TimeLogSchema)
async def create_time_log(
    session_id: UUID,
    time_log_data: TimeLogCreate,
    current_user: Profile = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a time log for a session"""
    # Check if user is a participant
    participant = db.query(SessionParticipant).filter(
        SessionParticipant.session_id == session_id,
        SessionParticipant.user_id == current_user.id
    ).first()
    
    if not participant:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a participant in this session"
        )
    
    time_log = TimeLog(
        participant_id=participant.id,
        **time_log_data.dict()
    )
    db.add(time_log)
    db.commit()
    db.refresh(time_log)
    return time_log

@router.get("/sessions/{session_id}", response_model=SessionWithParticipants)
async def get_session(
    session_id: UUID,
    current_user: Profile = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get session details"""
    session = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    # Check if user is a participant
    participant = db.query(SessionParticipant).filter(
        SessionParticipant.session_id == session_id,
        SessionParticipant.user_id == current_user.id
    ).first()
    
    if not participant:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a participant in this session"
        )
    
    return session

@router.get("/sessions/{session_id}/participants", response_model=List[SessionParticipantSchema])
async def list_session_participants(
    session_id: UUID,
    current_user: Profile = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List session participants"""
    # Check if user is a participant
    participant = db.query(SessionParticipant).filter(
        SessionParticipant.session_id == session_id,
        SessionParticipant.user_id == current_user.id
    ).first()
    
    if not participant:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a participant in this session"
        )
    
    return db.query(SessionParticipant).filter(
        SessionParticipant.session_id == session_id
    ).all()
