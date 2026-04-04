from __future__ import annotations

from typing import ClassVar, Type

from ..models.base import BaseModel
from ..models.employer_watchlist import EmployerWatchlistModel
from .base import BaseRepository


class EmployerWatchlistRepository(BaseRepository):
    __table__: ClassVar[str] = "employer_watchlist"
    model: ClassVar[Type[BaseModel]] = EmployerWatchlistModel
    pkey: ClassVar[str] = "employer_id"
