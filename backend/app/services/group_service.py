from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Select, select, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import selectinload

from app.models import Group, GroupMember, Notification, Profile, Session
from app.models.enums import GoalPeriod, GroupStatus, MemberRole, NotificationKind, NotificationStatus
from app.schemas.group import GroupCreate


async def list_groups_for_user(
    session,
    user_id: uuid.UUID,
    status: GroupStatus | str | None = None,
) -> list[Group]:
    stmt: Select[tuple[Group]] = (
        select(Group)
        .join(GroupMember, GroupMember.group_id == Group.id)
        .where(GroupMember.user_id == user_id)
        .options(selectinload(Group.members).selectinload(GroupMember.user))
        .options(selectinload(Group.sessions).selectinload(Session.participants))
        .distinct()
        .order_by(Group.created_at.desc())
    )
    if status is not None:
        status_obj = status
        if not isinstance(status_obj, GroupStatus):
            try:
                status_obj = GroupStatus(status_obj.lower())
            except ValueError:
                raise ValueError(f"Invalid group status: {status}") from None
        stmt = stmt.where(Group.status == status_obj.value)
    result = await session.execute(stmt)
    return list(result.scalars().all())


async def get_group(session, group_id: uuid.UUID) -> Group | None:
    stmt = (
        select(Group)
        .where(Group.id == group_id)
        .options(selectinload(Group.members).selectinload(GroupMember.user))
        .options(selectinload(Group.sessions).selectinload(Session.participants))
    )
    result = await session.execute(stmt)
    return result.scalar_one_or_none()


async def create_group(session, owner: Profile, payload: GroupCreate) -> Group:
    period_value: GoalPeriod
    if isinstance(payload.period, GoalPeriod):
        period_value = payload.period
    else:
        try:
            period_value = GoalPeriod(payload.period.lower())
        except ValueError as exc:
            raise ValueError(f"Invalid goal period: {payload.period}") from exc

    group = Group(
        owner_id=owner.id,
        name=payload.name,
        description=payload.description,
        start_at=payload.start_at,
        end_at=payload.end_at,
        timezone=payload.timezone,
        period=period_value.value,
        period_target_minutes=payload.period_target_minutes,
        status=GroupStatus.ACTIVE.value,
    )
    session.add(group)
    await session.flush()

    owner_membership = GroupMember(
        group_id=group.id,
        user_id=owner.id,
        role=MemberRole.OWNER,
    )
    session.add(owner_membership)
    await session.flush()

    return group


async def clone_group(session, original_group_id: uuid.UUID, new_owner_id: uuid.UUID) -> uuid.UUID:
    result = await session.execute(
        text("SELECT clone_group(:gid, :owner) AS id"),
        {"gid": str(original_group_id), "owner": str(new_owner_id)},
    )
    row = result.mappings().first()
    return uuid.UUID(str(row["id"]))


async def get_group_member_by_user(session, group_id: uuid.UUID, user_id: uuid.UUID) -> GroupMember | None:
    stmt = select(GroupMember).where(GroupMember.group_id == group_id, GroupMember.user_id == user_id)
    result = await session.execute(stmt)
    return result.scalar_one_or_none()


async def get_membership_by_id(session, membership_id: uuid.UUID) -> GroupMember | None:
    result = await session.execute(select(GroupMember).where(GroupMember.id == membership_id))
    return result.scalar_one_or_none()


async def require_admin(session, group_id: uuid.UUID, user_id: uuid.UUID) -> GroupMember:
    membership = await get_group_member_by_user(session, group_id, user_id)
    if membership is None or membership.role not in (MemberRole.OWNER, MemberRole.ADMIN):
        raise PermissionError("Admin privileges required")
    return membership


async def list_members(session, group_id: uuid.UUID) -> list[GroupMember]:
    stmt = (
        select(GroupMember)
        .where(GroupMember.group_id == group_id)
        .options(selectinload(GroupMember.user))
        .order_by(GroupMember.created_at)
    )
    result = await session.execute(stmt)
    return list(result.scalars().all())


async def add_member(session, group_id: uuid.UUID, user: Profile, role: MemberRole = MemberRole.MEMBER) -> GroupMember:
    membership = GroupMember(group_id=group_id, user_id=user.id, role=role)
    session.add(membership)
    try:
        await session.flush()
    except IntegrityError as exc:
        raise ValueError("User already a member") from exc
    return membership


async def update_member(
    session,
    membership: GroupMember,
    *,
    role: MemberRole | None = None,
    override_minutes: int | None | bool = None,
) -> GroupMember:
    if role is not None:
        membership.role = role
    if override_minutes is not None:
        membership.override_period_target_minutes = override_minutes if override_minutes is not False else None
    session.add(membership)
    await session.flush()
    return membership


async def remove_member(session, membership: GroupMember) -> None:
    await session.delete(membership)
    await session.flush()


async def create_invite_notification(
    session,
    group: Group,
    recipient: Profile,
    sender: Profile,
) -> Notification:
    notification = Notification(
        recipient_id=recipient.id,
        kind=NotificationKind.GROUP_INVITE,
        status=NotificationStatus.PENDING,
        title=f"{sender.display_name or sender.email} invited you",
        body=f"Join {group.name} to lock in together",
        group_id=group.id,
    )
    session.add(notification)
    await session.flush()
    return notification


async def fetch_progress(session, group_id: uuid.UUID) -> list[dict[str, object]]:
    stmt = text(
        "SELECT * FROM group_member_period_progress WHERE group_id = :group_id ORDER BY seconds_done DESC"
    )
    result = await session.execute(stmt, {"group_id": str(group_id)})
    rows = result.mappings().all()
    return [dict(row) for row in rows]
