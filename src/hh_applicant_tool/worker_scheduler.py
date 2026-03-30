"""Cron scheduler thread — checks cron_schedules table and enqueues commands."""

from __future__ import annotations

import logging
import threading
import time
from datetime import datetime, timezone
from typing import Any

logger = logging.getLogger(__name__)


class CronScheduler:
    """Background thread that polls cron_schedules and inserts pending commands."""

    def __init__(self, supabase_client: Any, check_interval: float = 60.0):
        self.client = supabase_client
        self.check_interval = check_interval
        self._stop_event = threading.Event()
        self._thread: threading.Thread | None = None

    def start(self) -> None:
        self._thread = threading.Thread(
            target=self._run_loop, daemon=True, name="cron-scheduler"
        )
        self._thread.start()
        logger.info("Cron scheduler started (interval=%ds)", self.check_interval)

    def stop(self) -> None:
        self._stop_event.set()
        if self._thread:
            self._thread.join(timeout=10)

    def _run_loop(self) -> None:
        while not self._stop_event.is_set():
            try:
                self._check_schedules()
            except Exception as ex:
                logger.error("Cron scheduler error: %s", ex)

            self._stop_event.wait(self.check_interval)

    def _check_schedules(self) -> None:
        try:
            from croniter import croniter
        except ImportError:
            logger.warning(
                "croniter не установлен, расписание не работает. "
                "pip install croniter"
            )
            return

        now = datetime.now(timezone.utc)

        result = (
            self.client.table("cron_schedules")
            .select("*")
            .eq("enabled", True)
            .execute()
        )

        for schedule in result.data:
            try:
                cron_expr = schedule["cron_expression"]
                next_run = schedule.get("next_run_at")

                # Если next_run_at не установлен — вычисляем
                if not next_run:
                    cron = croniter(cron_expr, now)
                    next_dt = cron.get_next(datetime)
                    self._update_next_run(schedule["id"], next_dt)
                    continue

                next_dt = datetime.fromisoformat(next_run)
                if now >= next_dt:
                    # Пора запускать
                    self._enqueue_command(
                        schedule["command"],
                        schedule.get("args") or {},
                        schedule["id"],
                    )

                    # Вычисляем следующий запуск
                    cron = croniter(cron_expr, now)
                    new_next = cron.get_next(datetime)
                    self._update_schedule_after_run(schedule["id"], now, new_next)
            except (ValueError, KeyError, TypeError) as ex:
                logger.warning(
                    "Skipping schedule %s — invalid cron expression %r: %s",
                    schedule.get("id"),
                    schedule.get("cron_expression"),
                    ex,
                )

    def _enqueue_command(
        self, command: str, args: dict, schedule_id: str
    ) -> None:
        try:
            # Prevent duplicate commands
            existing = (
                self.client.table("command_queue")
                .select("id")
                .eq("command", command)
                .in_("status", ["pending", "running"])
                .execute()
            )
            if existing.data:
                logger.info(
                    "Skipping scheduled %s — already pending/running", command
                )
                return

            self.client.table("command_queue").insert(
                {
                    "command": command,
                    "args": {**args, "_scheduled_by": schedule_id},
                    "status": "pending",
                }
            ).execute()
            logger.info("Scheduled command enqueued: %s", command)
        except Exception as ex:
            logger.error("Failed to enqueue scheduled command %s: %s", command, ex)

    def _update_next_run(self, schedule_id: str, next_dt: datetime) -> None:
        try:
            self.client.table("cron_schedules").update(
                {"next_run_at": next_dt.isoformat()}
            ).eq("id", schedule_id).execute()
        except Exception as ex:
            logger.error("Failed to update next_run_at: %s", ex)

    def _update_schedule_after_run(
        self, schedule_id: str, last_run: datetime, next_run: datetime
    ) -> None:
        try:
            self.client.table("cron_schedules").update(
                {
                    "last_run_at": last_run.isoformat(),
                    "next_run_at": next_run.isoformat(),
                }
            ).eq("id", schedule_id).execute()
        except Exception as ex:
            logger.error("Failed to update schedule after run: %s", ex)
