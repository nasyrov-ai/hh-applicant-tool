"""Logging handler that streams log records to Supabase execution_logs table."""

from __future__ import annotations

import logging
import time
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    pass


class SupabaseLogHandler(logging.Handler):
    """Buffers log records and flushes to execution_logs in batches."""

    def __init__(
        self,
        supabase_client: Any,
        command_id: str,
        flush_interval: float = 1.0,
        max_buffer: int = 50,
    ):
        super().__init__()
        self.client = supabase_client
        self.command_id = command_id
        self.flush_interval = flush_interval
        self.max_buffer = max_buffer
        self._buffer: list[dict] = []
        self._last_flush = time.monotonic()

    def emit(self, record: logging.LogRecord) -> None:
        try:
            message = self.format(record)
            self._buffer.append(
                {
                    "command_id": self.command_id,
                    "level": record.levelname,
                    "message": message,
                }
            )

            now = time.monotonic()
            if (
                len(self._buffer) >= self.max_buffer
                or now - self._last_flush >= self.flush_interval
            ):
                self.flush()
        except Exception:
            self.handleError(record)

    def flush(self) -> None:
        if not self._buffer:
            return

        batch = self._buffer[:]
        self._buffer.clear()
        self._last_flush = time.monotonic()

        try:
            self.client.table("execution_logs").insert(batch).execute()
        except Exception:
            # Return to buffer but cap size to prevent OOM
            max_size = self.max_buffer * 10
            self._buffer = (batch + self._buffer)[-max_size:]

    def close(self) -> None:
        self.flush()
        super().close()
