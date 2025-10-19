from __future__ import annotations

import uuid

from pydantic import EmailStr

from app.schemas.base import ORMModel


class ProfileRead(ORMModel):
    id: uuid.UUID
    email: EmailStr
    display_name: str | None = None
    avatar_url: str | None = None


class ProfileUpdate(ORMModel):
    display_name: str | None = None
    avatar_url: str | None = None
