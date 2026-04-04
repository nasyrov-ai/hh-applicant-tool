from __future__ import annotations

from typing import ClassVar, Type

from ..models.application_message import ApplicationMessageModel
from ..models.base import BaseModel
from .base import BaseRepository


class ApplicationMessageRepository(BaseRepository):
    __table__: ClassVar[str] = "application_messages"
    model: ClassVar[Type[BaseModel]] = ApplicationMessageModel
