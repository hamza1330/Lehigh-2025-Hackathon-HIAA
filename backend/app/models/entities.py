from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, Enum, ForeignKey, Integer, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import CITEXT, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base
from app.models.enums import (
    GoalPeriod,
    GroupStatus,
    MemberRole,
    NotificationKind,
    NotificationStatus,
    ParticipantRole,
    SessionStatus,
)


def enum_values(enum_cls):
    """Return the `.value` strings so Enum columns write lowercase values."""
    return [member.value for member in enum_cls]


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class UpdatedTimestampMixin(TimestampMixin):
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )


class Profile(UpdatedTimestampMixin, Base):
    __tablename__ = "profiles"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(CITEXT(), unique=True, nullable=False)
    display_name: Mapped[str | None] = mapped_column(Text)
    avatar_url: Mapped[str | None] = mapped_column(Text)

    identities: Mapped[list[AuthIdentity]] = relationship(
        back_populates="profile", cascade="all, delete-orphan", passive_deletes=True
    )
    memberships: Mapped[list[GroupMember]] = relationship(back_populates="user", passive_deletes=True)
    owned_groups: Mapped[list[Group]] = relationship(back_populates="owner", passive_deletes=True)
    created_sessions: Mapped[list[Session]] = relationship(back_populates="creator", passive_deletes=True)
    notifications: Mapped[list[Notification]] = relationship(back_populates="recipient", passive_deletes=True)


class AuthIdentity(Base):
    __tablename__ = "auth_identities"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    provider: Mapped[str] = mapped_column(Text, nullable=False)
    subject: Mapped[str] = mapped_column(Text, nullable=False)
    profile_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False
    )

    profile: Mapped[Profile] = relationship(back_populates="identities")

    __table_args__ = (UniqueConstraint("provider", "subject", name="uq_auth_identities_provider_subject"),)


class Group(UpdatedTimestampMixin, Base):
    __tablename__ = "groups"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="RESTRICT"), nullable=False
    )
    name: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)

    start_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    end_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    timezone: Mapped[str] = mapped_column(Text, nullable=False, server_default="America/New_York")

    period: Mapped[GoalPeriod] = mapped_column(
        Enum(GoalPeriod, name="goal_period", values_callable=enum_values, create_constraint=False),
        nullable=False,
        default=GoalPeriod.DAILY,
    )
    period_target_minutes: Mapped[int] = mapped_column(Integer, nullable=False, default=60)
    status: Mapped[GroupStatus] = mapped_column(
        Enum(GroupStatus, name="group_status", values_callable=enum_values, create_constraint=False),
        nullable=False,
        default=GroupStatus.ACTIVE,
    )

    owner: Mapped[Profile] = relationship(back_populates="owned_groups")
    members: Mapped[list[GroupMember]] = relationship(back_populates="group", cascade="all, delete-orphan")
    sessions: Mapped[list[Session]] = relationship(back_populates="group", passive_deletes=True)
    notifications: Mapped[list[Notification]] = relationship(back_populates="group", passive_deletes=True)

    __table_args__ = (CheckConstraint("end_at > start_at", name="ck_groups_end_gt_start"),)


class GroupMember(TimestampMixin, Base):
    __tablename__ = "group_members"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    group_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("groups.id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False
    )
    role: Mapped[MemberRole] = mapped_column(
        Enum(MemberRole, name="member_role", values_callable=enum_values, create_constraint=False),
        nullable=False,
        default=MemberRole.MEMBER,
    )
    override_period_target_minutes: Mapped[int | None] = mapped_column(Integer)

    group: Mapped[Group] = relationship(back_populates="members")
    user: Mapped[Profile] = relationship(back_populates="memberships")

    __table_args__ = (
        UniqueConstraint("group_id", "user_id", name="uq_group_members_group_user"),
        CheckConstraint(
            "override_period_target_minutes IS NULL OR override_period_target_minutes > 0",
            name="ck_group_members_override_positive",
        ),
    )


class Session(TimestampMixin, Base):
    __tablename__ = "sessions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    group_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("groups.id", ondelete="SET NULL"), nullable=True
    )
    creator_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="RESTRICT"), nullable=False
    )
    status: Mapped[SessionStatus] = mapped_column(
        Enum(SessionStatus, name="session_status", values_callable=enum_values, create_constraint=False),
        nullable=False,
        default=SessionStatus.SCHEDULED,
    )
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    group: Mapped[Group | None] = relationship(back_populates="sessions")
    creator: Mapped[Profile] = relationship(back_populates="created_sessions")
    participants: Mapped[list[SessionParticipant]] = relationship(
        back_populates="session", cascade="all, delete-orphan"
    )

    __table_args__ = (
        CheckConstraint("ended_at IS NULL OR started_at IS NOT NULL", name="ck_sessions_end_requires_start"),
        CheckConstraint("ended_at IS NULL OR ended_at >= started_at", name="ck_sessions_end_after_start"),
    )


class SessionParticipant(Base):
    __tablename__ = "session_participants"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False
    )
    role: Mapped[ParticipantRole] = mapped_column(
        Enum(ParticipantRole, name="participant_role", values_callable=enum_values, create_constraint=False),
        nullable=False,
        default=ParticipantRole.PARTICIPANT,
    )

    session: Mapped[Session] = relationship(back_populates="participants")
    user: Mapped[Profile] = relationship()
    logs: Mapped[list[TimeLog]] = relationship(back_populates="participant", cascade="all, delete-orphan")

    __table_args__ = (UniqueConstraint("session_id", "user_id", name="uq_session_participants_session_user"),)


class TimeLog(TimestampMixin, Base):
    __tablename__ = "time_logs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    participant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("session_participants.id", ondelete="CASCADE"), nullable=False
    )
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    ended_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    participant: Mapped[SessionParticipant] = relationship(back_populates="logs")

    __table_args__ = (CheckConstraint("ended_at >= started_at", name="ck_time_logs_end_after_start"),)


class Notification(TimestampMixin, Base):
    __tablename__ = "notifications"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    recipient_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False
    )
    kind: Mapped[NotificationKind] = mapped_column(
        Enum(NotificationKind, name="notification_kind", values_callable=enum_values, create_constraint=False),
        nullable=False,
    )
    status: Mapped[NotificationStatus] = mapped_column(
        Enum(NotificationStatus, name="notification_status", values_callable=enum_values, create_constraint=False),
        nullable=False,
    )
    title: Mapped[str | None] = mapped_column(Text)
    body: Mapped[str | None] = mapped_column(Text)
    group_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("groups.id", ondelete="SET NULL"), nullable=True
    )

    recipient: Mapped[Profile] = relationship(back_populates="notifications")
    group: Mapped[Group | None] = relationship(back_populates="notifications")

    __table_args__ = (
        CheckConstraint("status IS NOT NULL", name="ck_notifications_status_not_null"),
    )
