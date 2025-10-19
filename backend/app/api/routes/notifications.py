from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from datetime import datetime

from app.core.database import get_db
from app.models import Profile, Notification
from app.schemas import Notification as NotificationSchema, NotificationUpdate
from app.api.routes.auth import get_current_user

router = APIRouter()

@router.get("/notifications", response_model=List[NotificationSchema])
async def list_notifications(
    unread: Optional[bool] = None,
    cursor_created_at: Optional[datetime] = None,
    cursor_id: Optional[UUID] = None,
    limit: int = 20,
    current_user: Profile = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List notifications for current user"""
    query = db.query(Notification).filter(Notification.recipient_id == current_user.id)
    
    if unread is not None:
        if unread:
            query = query.filter(Notification.read_at.is_(None))
        else:
            query = query.filter(Notification.read_at.isnot(None))
    
    # Cursor-based pagination
    if cursor_created_at and cursor_id:
        query = query.filter(
            (Notification.created_at < cursor_created_at) |
            ((Notification.created_at == cursor_created_at) & (Notification.id < cursor_id))
        )
    
    query = query.order_by(Notification.created_at.desc(), Notification.id.desc())
    query = query.limit(limit)
    
    return query.all()

@router.post("/notifications/{notification_id}:read")
async def mark_notification_read(
    notification_id: UUID,
    current_user: Profile = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark a notification as read"""
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.recipient_id == current_user.id
    ).first()
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    notification.read_at = datetime.utcnow()
    db.commit()
    
    return {"message": "Notification marked as read"}

@router.post("/invites/{notification_id}:accept")
async def accept_invite(
    notification_id: UUID,
    current_user: Profile = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Accept a group invitation"""
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.recipient_id == current_user.id,
        Notification.kind == "group_invite"
    ).first()
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invitation not found"
        )
    
    if not notification.group_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid invitation"
        )
    
    # Check if user is already a member
    from app.models import GroupMember
    existing_member = db.query(GroupMember).filter(
        GroupMember.group_id == notification.group_id,
        GroupMember.user_id == current_user.id
    ).first()
    
    if existing_member:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already a member of this group"
        )
    
    # Add user to group
    member = GroupMember(
        group_id=notification.group_id,
        user_id=current_user.id,
        role="member"
    )
    db.add(member)
    
    # Update notification status
    notification.status = "accepted"
    notification.read_at = datetime.utcnow()
    
    db.commit()
    
    return {"message": "Invitation accepted successfully"}

@router.post("/invites/{notification_id}:decline")
async def decline_invite(
    notification_id: UUID,
    current_user: Profile = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Decline a group invitation"""
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.recipient_id == current_user.id,
        Notification.kind == "group_invite"
    ).first()
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invitation not found"
        )
    
    # Update notification status
    notification.status = "declined"
    notification.read_at = datetime.utcnow()
    
    db.commit()
    
    return {"message": "Invitation declined successfully"}
