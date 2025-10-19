from __future__ import annotations

import enum


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
