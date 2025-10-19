from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.core.database import get_db
from app.models import Profile
from app.api.routes.auth import get_current_user

router = APIRouter()

@router.post("/maintenance/archive-expired-groups")
async def archive_expired_groups(
    current_user: Profile = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Archive expired groups (admin function)"""
    # In a real application, you'd check if the user is an admin
    # For now, we'll allow any authenticated user to call this
    
    try:
        result = db.execute(text("SELECT archive_expired_groups()"))
        archived_count = result.scalar()
        
        db.commit()
        
        return {
            "message": f"Successfully archived {archived_count} expired groups",
            "archived_count": archived_count
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to archive expired groups: {str(e)}"
        )
