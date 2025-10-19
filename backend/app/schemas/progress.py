from __future__ import annotations

import uuid
from datetime import datetime

from app.schemas.base import ORMModel


class GroupProgressRow(ORMModel):
    group_id: uuid.UUID
    user_id: uuid.UUID
    period_start: datetime
    period_end: datetime
    seconds_done: int
    target_minutes: int
    goal_met: bool
