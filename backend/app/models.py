from sqlalchemy import Column, String, Integer, DateTime, Boolean, ForeignKey, Text, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum
from app.core.database import Base

class GroupStatus(str, enum.Enum):
    PENDING = "pending"
    ACTIVE = "active"
    ARCHIVED = "archived"

class MemberRole(str, enum.Enum):
    OWNER = "owner"
    ADMIN = "admin"
    MEMBER = "member"

class ParticipantRole(str, enum.Enum):
    HOST = "host"
    PARTICIPANT = "participant"

class SessionStatus(str, enum.Enum):
    SCHEDULED = "scheduled"
    RUNNING = "running"
    PAUSED = "paused"
    ENDED = "ended"
    CANCELLED = "cancelled"

class GoalPeriod(str, enum.Enum):
    DAILY = "daily"
    WEEKLY = "weekly"

class NotificationKind(str, enum.Enum):
    GROUP_INVITE = "group_invite"
    MILESTONE_MEMBER = "milestone_member"
    MILESTONE_GROUP = "milestone_group"
    SESSION_REMINDER = "session_reminder"
    GENERIC = "generic"

class NotificationStatus(str, enum.Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    DECLINED = "declined"
    READ = "read"

class Profile(Base):
    __tablename__ = "profiles"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, nullable=False)
    display_name = Column(String)
    avatar_url = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    auth_identities = relationship("AuthIdentity", back_populates="profile")
    owned_groups = relationship("Group", back_populates="owner")
    group_memberships = relationship("GroupMember", back_populates="user")
    created_sessions = relationship("Session", back_populates="creator")
    session_participations = relationship("SessionParticipant", back_populates="user")
    notifications = relationship("Notification", back_populates="recipient")

class AuthIdentity(Base):
    __tablename__ = "auth_identities"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    provider = Column(String, nullable=False)
    subject = Column(String, nullable=False)
    profile_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    
    # Relationships
    profile = relationship("Profile", back_populates="auth_identities")

class Group(Base):
    __tablename__ = "groups"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="RESTRICT"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text)
    start_at = Column(DateTime(timezone=True), server_default=func.now())
    end_at = Column(DateTime(timezone=True), nullable=False)
    timezone = Column(String, nullable=False, default="America/New_York")
    period = Column(SQLEnum(GoalPeriod), nullable=False, default=GoalPeriod.DAILY)
    period_target_minutes = Column(Integer, nullable=False, default=60)
    status = Column(SQLEnum(GroupStatus), nullable=False, default=GroupStatus.ACTIVE)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    owner = relationship("Profile", back_populates="owned_groups")
    members = relationship("GroupMember", back_populates="group")
    sessions = relationship("Session", back_populates="group")
    notifications = relationship("Notification", back_populates="group")

class GroupMember(Base):
    __tablename__ = "group_members"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    group_id = Column(UUID(as_uuid=True), ForeignKey("groups.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    role = Column(SQLEnum(MemberRole), nullable=False, default=MemberRole.MEMBER)
    override_period_target_minutes = Column(Integer)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    group = relationship("Group", back_populates="members")
    user = relationship("Profile", back_populates="group_memberships")

class Session(Base):
    __tablename__ = "sessions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    group_id = Column(UUID(as_uuid=True), ForeignKey("groups.id", ondelete="SET NULL"))
    creator_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="RESTRICT"), nullable=False)
    status = Column(SQLEnum(SessionStatus), nullable=False, default=SessionStatus.SCHEDULED)
    started_at = Column(DateTime(timezone=True))
    ended_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    group = relationship("Group", back_populates="sessions")
    creator = relationship("Profile", back_populates="created_sessions")
    participants = relationship("SessionParticipant", back_populates="session")

class SessionParticipant(Base):
    __tablename__ = "session_participants"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    role = Column(SQLEnum(ParticipantRole), nullable=False, default=ParticipantRole.PARTICIPANT)
    
    # Relationships
    session = relationship("Session", back_populates="participants")
    user = relationship("Profile", back_populates="session_participations")
    time_logs = relationship("TimeLog", back_populates="participant")

class TimeLog(Base):
    __tablename__ = "time_logs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    participant_id = Column(UUID(as_uuid=True), ForeignKey("session_participants.id", ondelete="CASCADE"), nullable=False)
    started_at = Column(DateTime(timezone=True), nullable=False)
    ended_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    participant = relationship("SessionParticipant", back_populates="time_logs")

class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    recipient_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    kind = Column(SQLEnum(NotificationKind), nullable=False)
    status = Column(SQLEnum(NotificationStatus), nullable=False, default=NotificationStatus.PENDING)
    title = Column(String)
    body = Column(Text)
    group_id = Column(UUID(as_uuid=True), ForeignKey("groups.id", ondelete="SET NULL"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    read_at = Column(DateTime(timezone=True))
    
    # Relationships
    recipient = relationship("Profile", back_populates="notifications")
    group = relationship("Group", back_populates="notifications")
