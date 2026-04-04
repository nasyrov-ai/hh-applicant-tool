from __future__ import annotations

from datetime import datetime

from .base import BaseModel


class EmployerWatchlistModel(BaseModel):
    employer_id: int
    employer_name: str
    notify: bool = True
    created_at: datetime | None = None
