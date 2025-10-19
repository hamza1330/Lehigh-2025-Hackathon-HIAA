from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.models import Profile
from app.models.enums import GroupStatus, MemberRole
from app.schemas.group import GroupCreate, GroupListItem, GroupRead
from app.schemas.member import GroupMemberCreate, GroupMemberRead, GroupMemberUpdate
from app.schemas.progress import GroupProgressRow
from app.services import group_service, profile_service

router = APIRouter(prefix="/api/groups", tags=["groups"])


@router.get("", response_model=list[GroupListItem])
async def list_groups(
    status: GroupStatus | None = Query(default=None),
    current_user: Profile = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> list[GroupListItem]:
    groups = await group_service.list_groups_for_user(session, current_user.id, status=status)
    return [GroupListItem.model_validate(group) for group in groups]


@router.post("", response_model=GroupRead, status_code=status.HTTP_201_CREATED)
async def create_group(
    payload: GroupCreate,
    current_user: Profile = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> GroupRead:
    group = await group_service.create_group(session, current_user, payload)
    await session.commit()
    group_with_relations = await group_service.get_group(session, group.id)
    if group_with_relations is None:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Group creation failed")
    return GroupRead.model_validate(group_with_relations)


@router.post("/{group_id}:clone", response_model=GroupRead, status_code=status.HTTP_201_CREATED)
async def clone_group(
    group_id: uuid.UUID,
    current_user: Profile = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> GroupRead:
    group = await group_service.get_group(session, group_id)
    if group is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")

    new_group_id = await group_service.clone_group(session, group_id, current_user.id)
    await session.commit()
    cloned = await group_service.get_group(session, new_group_id)
    if cloned is None:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Clone failed")
    return GroupRead.model_validate(cloned)


@router.get("/{group_id}", response_model=GroupRead)
async def get_group(
    group_id: uuid.UUID,
    current_user: Profile = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> GroupRead:
    group = await group_service.get_group(session, group_id)
    if group is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")

    if all(member.user_id != current_user.id for member in group.members):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a member of this group")

    return GroupRead.model_validate(group)


@router.get("/{group_id}/members", response_model=list[GroupMemberRead])
async def list_members(
    group_id: uuid.UUID,
    current_user: Profile = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> list[GroupMemberRead]:
    group = await group_service.get_group(session, group_id)
    if group is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")
    if all(member.user_id != current_user.id for member in group.members):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a member of this group")

    memberships = await group_service.list_members(session, group_id)
    return [GroupMemberRead.model_validate(member) for member in memberships]


@router.post("/{group_id}/members", response_model=GroupMemberRead, status_code=status.HTTP_201_CREATED)
async def add_member(
    group_id: uuid.UUID,
    payload: GroupMemberCreate,
    current_user: Profile = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> GroupMemberRead:
    group = await group_service.get_group(session, group_id)
    if group is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")

    try:
        await group_service.require_admin(session, group_id, current_user.id)
    except PermissionError:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin rights required")

    invitee = await profile_service.get_profile(session, payload.user_id)
    if invitee is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    member = await group_service.add_member(session, group_id, invitee, payload.role)
    await session.commit()
    await session.refresh(member)

    return GroupMemberRead.model_validate(member)


@router.patch("/{group_id}/members/{membership_id}", response_model=GroupMemberRead)
async def update_member(
    group_id: uuid.UUID,
    membership_id: uuid.UUID,
    payload: GroupMemberUpdate,
    current_user: Profile = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> GroupMemberRead:
    membership = await group_service.get_membership_by_id(session, membership_id)
    if membership is None or membership.group_id != group_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Membership not found")

    try:
        await group_service.require_admin(session, group_id, current_user.id)
    except PermissionError:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin rights required")

    updated = await group_service.update_member(
        session,
        membership,
        role=payload.role,
        override_minutes=payload.override_period_target_minutes,
    )
    await session.commit()
    await session.refresh(updated)

    return GroupMemberRead.model_validate(updated)


@router.delete("/{group_id}/members/{membership_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_member(
    group_id: uuid.UUID,
    membership_id: uuid.UUID,
    current_user: Profile = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> None:
    membership = await group_service.get_membership_by_id(session, membership_id)
    if membership is None or membership.group_id != group_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Membership not found")

    try:
        await group_service.require_admin(session, group_id, current_user.id)
    except PermissionError:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin rights required")

    await group_service.remove_member(session, membership)
    await session.commit()


@router.post("/{group_id}:invite", status_code=status.HTTP_202_ACCEPTED)
async def invite_member(
    group_id: uuid.UUID,
    payload: GroupMemberCreate,
    current_user: Profile = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> dict[str, str]:
    group = await group_service.get_group(session, group_id)
    if group is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")

    try:
        await group_service.require_admin(session, group_id, current_user.id)
    except PermissionError:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin rights required")

    recipient = await profile_service.get_profile(session, payload.user_id)
    if recipient is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    await group_service.create_invite_notification(session, group, recipient, current_user)
    await session.commit()

    return {"status": "invited"}


@router.get("/{group_id}/progress/current", response_model=list[GroupProgressRow])
async def get_progress(
    group_id: uuid.UUID,
    current_user: Profile = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> list[GroupProgressRow]:
    group = await group_service.get_group(session, group_id)
    if group is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")
    if all(member.user_id != current_user.id for member in group.members):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a member of this group")

    rows = await group_service.fetch_progress(session, group_id)
    return [GroupProgressRow.model_validate(row) for row in rows]
