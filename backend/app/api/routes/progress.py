from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List
from uuid import UUID

from app.core.database import get_db
from app.models import Profile, GroupMember
from app.schemas import ProgressEntry
from app.api.routes.auth import get_current_user

router = APIRouter()

@router.get("/groups/{group_id}/progress/current", response_model=List[ProgressEntry])
async def get_group_progress(
    group_id: UUID,
    current_user: Profile = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current period progress for all group members"""
    # Check if user is a member of the group
    membership = db.query(GroupMember).filter(
        GroupMember.group_id == group_id,
        GroupMember.user_id == current_user.id
    ).first()
    
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of this group"
        )
    
    # Query the progress view
    result = db.execute(
        text("SELECT * FROM group_member_period_progress WHERE group_id = :group_id ORDER BY seconds_done DESC"),
        {"group_id": str(group_id)}
    )
    
    progress_entries = []
    for row in result:
        progress_entries.append(ProgressEntry(
            group_id=row.group_id,
            user_id=row.user_id,
            period_start=row.period_start,
            period_end=row.period_end,
            seconds_done=row.seconds_done,
            target_minutes=row.target_minutes,
            goal_met=row.goal_met
        ))
    
    return progress_entries
