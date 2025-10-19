from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from uuid import UUID
from app.models import GroupStatus, MemberRole, SessionStatus, GoalPeriod, NotificationKind, NotificationStatus

# Base schemas
class ProfileBase(BaseModel):
    email: EmailStr
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None

class ProfileCreate(ProfileBase):
    pass

class ProfileUpdate(BaseModel):
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None

class Profile(ProfileBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Auth schemas
class AuthIdentityCreate(BaseModel):
    provider: str
    subject: str
    email: EmailStr
    display_name: Optional[str] = None

class AuthIdentity(BaseModel):
    id: UUID
    provider: str
    subject: str
    profile_id: UUID
    
    class Config:
        from_attributes = True

# Group schemas
class GroupBase(BaseModel):
    name: str
    description: Optional[str] = None
    start_at: datetime
    end_at: datetime
    timezone: str = "America/New_York"
    period: GoalPeriod = GoalPeriod.DAILY
    period_target_minutes: int = 60

class GroupCreate(GroupBase):
    pass

class GroupUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    end_at: Optional[datetime] = None
    timezone: Optional[str] = None
    period: Optional[GoalPeriod] = None
    period_target_minutes: Optional[int] = None

class Group(GroupBase):
    id: UUID
    owner_id: UUID
    status: GroupStatus
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Group Member schemas
class GroupMemberBase(BaseModel):
    role: MemberRole = MemberRole.MEMBER
    override_period_target_minutes: Optional[int] = None

class GroupMemberCreate(GroupMemberBase):
    user_id: UUID

class GroupMemberUpdate(BaseModel):
    override_period_target_minutes: Optional[int] = None

class GroupMember(GroupMemberBase):
    id: UUID
    group_id: UUID
    user_id: UUID
    created_at: datetime
    
    class Config:
        from_attributes = True

# Session schemas
class SessionBase(BaseModel):
    group_id: Optional[UUID] = None
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None

class SessionCreate(SessionBase):
    pass

class SessionUpdate(BaseModel):
    status: Optional[SessionStatus] = None
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None

class Session(SessionBase):
    id: UUID
    creator_id: UUID
    status: SessionStatus
    created_at: datetime
    
    class Config:
        from_attributes = True

# Session Participant schemas
class SessionParticipantBase(BaseModel):
    role: str = "participant"

class SessionParticipantCreate(SessionParticipantBase):
    user_id: UUID

class SessionParticipant(SessionParticipantBase):
    id: UUID
    session_id: UUID
    user_id: UUID
    
    class Config:
        from_attributes = True

# Time Log schemas
class TimeLogBase(BaseModel):
    started_at: datetime
    ended_at: datetime

class TimeLogCreate(TimeLogBase):
    pass

class TimeLog(TimeLogBase):
    id: UUID
    participant_id: UUID
    created_at: datetime
    
    class Config:
        from_attributes = True

# Notification schemas
class NotificationBase(BaseModel):
    kind: NotificationKind
    title: Optional[str] = None
    body: Optional[str] = None
    group_id: Optional[UUID] = None

class NotificationCreate(NotificationBase):
    recipient_id: UUID

class NotificationUpdate(BaseModel):
    status: Optional[NotificationStatus] = None

class Notification(NotificationBase):
    id: UUID
    recipient_id: UUID
    status: NotificationStatus
    created_at: datetime
    read_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Progress schemas
class ProgressEntry(BaseModel):
    group_id: UUID
    user_id: UUID
    period_start: datetime
    period_end: datetime
    seconds_done: int
    target_minutes: int
    goal_met: bool
    
    class Config:
        from_attributes = True

# Avatar upload schemas
class AvatarUploadResponse(BaseModel):
    upload_url: str
    avatar_url: str
    expires_in: int

# Response schemas with relationships
class GroupWithMembers(Group):
    members: List[GroupMember] = []

class SessionWithParticipants(Session):
    participants: List[SessionParticipant] = []

class ProfileWithMemberships(Profile):
    group_memberships: List[GroupMember] = []
