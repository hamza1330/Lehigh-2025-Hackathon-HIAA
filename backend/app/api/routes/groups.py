from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Optional
from uuid import UUID

from app.core.database import get_db
from app.models import Profile, Group, GroupMember, Notification
from app.schemas import (
    GroupCreate, GroupUpdate, Group as GroupSchema, GroupWithMembers,
    GroupMemberCreate, GroupMemberUpdate, GroupMember as GroupMemberSchema,
    NotificationCreate, Notification as NotificationSchema
)
from app.api.routes.auth import get_current_user

router = APIRouter()

@router.post("/groups", response_model=GroupSchema)
async def create_group(
    group_data: GroupCreate,
    current_user: Profile = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new group"""
    group = Group(
        owner_id=current_user.id,
        **group_data.dict()
    )
    db.add(group)
    db.flush()  # Get the ID
    
    # Add owner as a member
    owner_member = GroupMember(
        group_id=group.id,
        user_id=current_user.id,
        role="owner"
    )
    db.add(owner_member)
    db.commit()
    db.refresh(group)
    return group

@router.get("/groups", response_model=List[GroupSchema])
async def list_groups(
    status: Optional[str] = None,
    current_user: Profile = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List groups for current user"""
    query = db.query(Group).join(GroupMember).filter(GroupMember.user_id == current_user.id)
    
    if status:
        query = query.filter(Group.status == status)
    
    return query.all()

@router.get("/groups/{group_id}", response_model=GroupWithMembers)
async def get_group(
    group_id: UUID,
    current_user: Profile = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get group details"""
    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found"
        )
    
    # Check if user is a member
    membership = db.query(GroupMember).filter(
        GroupMember.group_id == group_id,
        GroupMember.user_id == current_user.id
    ).first()
    
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of this group"
        )
    
    return group

@router.post("/groups/{group_id}:clone", response_model=GroupSchema)
async def clone_group(
    group_id: UUID,
    current_user: Profile = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Clone an existing group"""
    # Check if user is a member of the original group
    membership = db.query(GroupMember).filter(
        GroupMember.group_id == group_id,
        GroupMember.user_id == current_user.id
    ).first()
    
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of this group"
        )
    
    # Call the database function
    result = db.execute(text("SELECT clone_group(:group_id, :user_id)"), {
        "group_id": str(group_id),
        "user_id": str(current_user.id)
    })
    
    new_group_id = result.scalar()
    if not new_group_id:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to clone group"
        )
    
    # Return the new group
    new_group = db.query(Group).filter(Group.id == new_group_id).first()
    return new_group

@router.get("/groups/{group_id}/members", response_model=List[GroupMemberSchema])
async def list_group_members(
    group_id: UUID,
    current_user: Profile = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List group members"""
    # Check if user is a member
    membership = db.query(GroupMember).filter(
        GroupMember.group_id == group_id,
        GroupMember.user_id == current_user.id
    ).first()
    
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of this group"
        )
    
    return db.query(GroupMember).filter(GroupMember.group_id == group_id).all()

@router.post("/groups/{group_id}/members", response_model=GroupMemberSchema)
async def add_group_member(
    group_id: UUID,
    member_data: GroupMemberCreate,
    current_user: Profile = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add a member to the group (owner/admin only)"""
    # Check if current user is owner or admin
    membership = db.query(GroupMember).filter(
        GroupMember.group_id == group_id,
        GroupMember.user_id == current_user.id
    ).first()
    
    if not membership or membership.role not in ["owner", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only owners and admins can add members"
        )
    
    # Check if user is already a member
    existing_member = db.query(GroupMember).filter(
        GroupMember.group_id == group_id,
        GroupMember.user_id == member_data.user_id
    ).first()
    
    if existing_member:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is already a member"
        )
    
    # Add member
    member = GroupMember(
        group_id=group_id,
        **member_data.dict()
    )
    db.add(member)
    
    # Create invitation notification
    notification = Notification(
        recipient_id=member_data.user_id,
        kind="group_invite",
        title=f"You've been invited to join {membership.group.name}",
        body=f"You've been invited to join the group '{membership.group.name}'",
        group_id=group_id
    )
    db.add(notification)
    
    db.commit()
    db.refresh(member)
    return member

@router.patch("/groups/{group_id}/members/{user_id}", response_model=GroupMemberSchema)
async def update_group_member(
    group_id: UUID,
    user_id: UUID,
    member_update: GroupMemberUpdate,
    current_user: Profile = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update group member settings (owner/admin only)"""
    # Check if current user is owner or admin
    membership = db.query(GroupMember).filter(
        GroupMember.group_id == group_id,
        GroupMember.user_id == current_user.id
    ).first()
    
    if not membership or membership.role not in ["owner", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only owners and admins can update members"
        )
    
    # Find the member to update
    member = db.query(GroupMember).filter(
        GroupMember.group_id == group_id,
        GroupMember.user_id == user_id
    ).first()
    
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found"
        )
    
    # Update member
    for field, value in member_update.dict(exclude_unset=True).items():
        setattr(member, field, value)
    
    db.commit()
    db.refresh(member)
    return member

@router.delete("/groups/{group_id}/members/{user_id}")
async def remove_group_member(
    group_id: UUID,
    user_id: UUID,
    current_user: Profile = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remove a member from the group"""
    # Check if current user is owner or admin, or removing themselves
    membership = db.query(GroupMember).filter(
        GroupMember.group_id == group_id,
        GroupMember.user_id == current_user.id
    ).first()
    
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of this group"
        )
    
    # Allow removal if owner/admin or removing self
    if membership.role not in ["owner", "admin"] and user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only owners and admins can remove other members"
        )
    
    # Find the member to remove
    member = db.query(GroupMember).filter(
        GroupMember.group_id == group_id,
        GroupMember.user_id == user_id
    ).first()
    
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found"
        )
    
    db.delete(member)
    db.commit()
    
    return {"message": "Member removed successfully"}

@router.post("/groups/{group_id}:invite")
async def invite_to_group(
    group_id: UUID,
    recipient_id: UUID,
    current_user: Profile = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Send invitation to join group"""
    # Check if current user is owner or admin
    membership = db.query(GroupMember).filter(
        GroupMember.group_id == group_id,
        GroupMember.user_id == current_user.id
    ).first()
    
    if not membership or membership.role not in ["owner", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only owners and admins can send invitations"
        )
    
    # Create invitation notification
    notification = Notification(
        recipient_id=recipient_id,
        kind="group_invite",
        title=f"You've been invited to join {membership.group.name}",
        body=f"You've been invited to join the group '{membership.group.name}'",
        group_id=group_id
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)
    
    return {"message": "Invitation sent successfully"}
