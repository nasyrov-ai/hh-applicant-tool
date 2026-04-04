from __future__ import annotations

from datetime import datetime
from typing import Any

from .base import BaseModel, mapped


class ApplicationMessageModel(BaseModel):
    id: str | None = mapped(default=None, skip_src=True)
    negotiation_id: int | None = None
    vacancy_id: int
    resume_id: str
    employer_id: int | None = None
    message_text: str
    message_type: str = "template"
    ai_model: str | None = None
    created_at: datetime | None = mapped(default=None, skip_src=True)
    updated_at: datetime | None = mapped(default=None, skip_src=True)

    def to_db(self) -> dict[str, Any]:
        data = super().to_db()
        # Let SQLite generate id/timestamps via DEFAULT
        for key in ("id", "created_at", "updated_at"):
            if data.get(key) is None:
                data.pop(key, None)
        return data
