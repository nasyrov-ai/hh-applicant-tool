"""
HH Applicant Tool Worker Daemon.

Long-running process that:
1. Polls Supabase command_queue for pending commands
2. Executes them via the CLI tool programmatically
3. Streams logs to execution_logs table
4. Auto-syncs data back to Supabase after each operation
5. Manages cron schedules

Usage:
    python -m hh_applicant_tool.worker

Environment:
    SUPABASE_URL          — Supabase project URL
    SUPABASE_SERVICE_KEY  — Service role key (bypasses RLS)
    CONFIG_DIR            — hh-applicant-tool config directory (optional)
    HH_PROFILE_ID        — Profile ID (optional)
"""

from __future__ import annotations

import logging
import os
import platform
import signal
import sys
import threading
import time
from datetime import datetime, timezone
from typing import Any

logger = logging.getLogger("hh_applicant_tool.worker")

# Commands that are safe to execute remotely
ALLOWED_COMMANDS = {
    "apply-vacancies",
    "reply-employers",
    "update-resumes",
    "clear-negotiations",
    "sync-db",
    "list-resumes",
    "refresh-token",
    "test-session",
    "whoami",
}

POLL_INTERVAL = 3.0  # seconds (base; increases with backoff when idle)
POLL_INTERVAL_MAX = 30.0  # seconds (cap for backoff)
POLL_BACKOFF_FACTOR = 1.5
HEARTBEAT_INTERVAL = 30.0  # seconds
MAX_EXECUTION_TIME = 600  # 10 minutes
CANCEL_CHECK_INTERVAL = 2.0  # seconds

# Module-level cancellation state accessible by operations
_cancel_event: threading.Event | None = None


def is_cancelled() -> bool:
    """Check if the current command has been cancelled by the user."""
    return _cancel_event is not None and _cancel_event.is_set()


class WorkerDaemon:
    """Main worker process."""

    def __init__(self) -> None:
        self._running = True
        self._worker_id = f"{platform.node()}-{os.getpid()}"

        # Supabase connection
        url = os.environ.get("SUPABASE_URL")
        key = os.environ.get("SUPABASE_SERVICE_KEY")
        if not url or not key:
            logger.error(
                "SUPABASE_URL and SUPABASE_SERVICE_KEY must be set"
            )
            sys.exit(1)

        try:
            from supabase import create_client

            self.supabase = create_client(url, key)
        except ImportError:
            logger.error(
                "supabase package not installed. "
                "pip install supabase"
            )
            sys.exit(1)

        # Config loader
        from .worker_config import WorkerConfigLoader

        self.config_loader = WorkerConfigLoader(self.supabase)
        self.config_loader.load()

        # Cron scheduler
        from .worker_scheduler import CronScheduler

        self.scheduler = CronScheduler(self.supabase)

        # Signal handlers
        signal.signal(signal.SIGTERM, self._handle_signal)
        signal.signal(signal.SIGINT, self._handle_signal)

        self._cancellation_event: threading.Event | None = None
        self._current_command_id: str | None = None
        self._current_cmd_thread: threading.Thread | None = None
        self._heartbeat_stop = threading.Event()

    def _handle_signal(self, signum: int, frame: Any) -> None:
        logger.info("Received signal %d, shutting down...", signum)
        self._running = False
        self._heartbeat_stop.set()

    def _heartbeat_loop(self) -> None:
        """Background thread that sends heartbeats every HEARTBEAT_INTERVAL."""
        while not self._heartbeat_stop.wait(HEARTBEAT_INTERVAL):
            self._send_heartbeat("online")

    def _cleanup_stale_commands(self) -> None:
        """Mark commands that were running when worker crashed as failed."""
        try:
            result = (
                self.supabase.table("command_queue")
                .update(
                    {
                        "status": "failed",
                        "error_message": "Worker перезапущен — команда была прервана",
                        "completed_at": datetime.now(timezone.utc).isoformat(),
                    }
                )
                .eq("status", "running")
                .execute()
            )
            if result.data:
                logger.warning(
                    "Cleaned up %d stale running command(s)", len(result.data)
                )
        except Exception as ex:
            logger.warning("Failed to cleanup stale commands: %s", ex)

    def run(self) -> None:
        """Main loop."""
        logger.info(
            "Worker started (id=%s, pid=%d)", self._worker_id, os.getpid()
        )

        self._cleanup_stale_commands()
        self.scheduler.start()
        self._send_heartbeat("online")

        # Start heartbeat in background thread so it works during command execution
        heartbeat_thread = threading.Thread(
            target=self._heartbeat_loop, daemon=True
        )
        heartbeat_thread.start()

        current_interval = POLL_INTERVAL
        try:
            while self._running:
                try:
                    # Zombie thread protection: skip cycle if previous command thread is still alive
                    if self._current_cmd_thread is not None and self._current_cmd_thread.is_alive():
                        logger.warning(
                            "Previous command thread still alive, skipping poll cycle"
                        )
                        time.sleep(current_interval)
                        continue

                    command = self._poll_command()
                    if command:
                        current_interval = POLL_INTERVAL  # Reset backoff
                        self._execute_command(command)
                    else:
                        time.sleep(current_interval)
                        # Exponential backoff when idle
                        current_interval = min(
                            current_interval * POLL_BACKOFF_FACTOR,
                            POLL_INTERVAL_MAX,
                        )

                except KeyboardInterrupt:
                    break
                except Exception as ex:
                    logger.error("Worker loop error: %s", ex)
                    time.sleep(current_interval)
        finally:
            self._heartbeat_stop.set()
            heartbeat_thread.join(timeout=5)
            self.scheduler.stop()
            self._send_heartbeat("offline")
            logger.info("Worker stopped")

    def _poll_command(self) -> dict | None:
        """Fetch the oldest pending command from the queue."""
        try:
            result = (
                self.supabase.table("command_queue")
                .select("*")
                .eq("status", "pending")
                .order("created_at", desc=False)
                .limit(1)
                .execute()
            )

            if not result.data:
                return None

            command = result.data[0]

            # Claim it atomically
            self._command_started_at = datetime.now(timezone.utc)
            claim_result = (
                self.supabase.table("command_queue")
                .update(
                    {
                        "status": "running",
                        "worker_id": self._worker_id,
                        "started_at": self._command_started_at.isoformat(),
                    }
                )
                .eq("id", command["id"])
                .eq("status", "pending")  # Optimistic lock
                .execute()
            )

            if not claim_result.data:
                return None  # Another worker claimed it

            return claim_result.data[0]

        except Exception as ex:
            logger.error("Poll error: %s", ex)
            return None

    def _check_cancellation(self) -> None:
        """Background thread: poll command status and set event if cancelled."""
        while (
            self._cancellation_event is not None
            and not self._cancellation_event.is_set()
        ):
            try:
                result = (
                    self.supabase.table("command_queue")
                    .select("status")
                    .eq("id", self._current_command_id)
                    .single()
                    .execute()
                )
                if result.data and result.data["status"] == "cancelled":
                    logger.info("Command cancelled by user")
                    self._cancellation_event.set()
                    return
            except Exception:
                pass  # Non-critical, will retry
            # Sleep in small increments so thread can exit quickly
            for _ in range(int(CANCEL_CHECK_INTERVAL * 10)):
                if (
                    self._cancellation_event is None
                    or self._cancellation_event.is_set()
                ):
                    return
                time.sleep(0.1)

    def _execute_command(self, command: dict) -> None:
        """Execute a command from the queue."""
        global _cancel_event

        cmd_id = command["id"]
        cmd_name = command["command"]
        cmd_args = command.get("args") or {}

        logger.info("Executing: %s (id=%s)", cmd_name, cmd_id)

        # Validate command
        if cmd_name not in ALLOWED_COMMANDS:
            self._fail_command(cmd_id, f"Command not allowed: {cmd_name}")
            return

        # Setup cancellation
        self._current_command_id = cmd_id
        self._cancellation_event = threading.Event()
        _cancel_event = self._cancellation_event

        cancel_thread = threading.Thread(
            target=self._check_cancellation, daemon=True
        )
        cancel_thread.start()

        # Attach log handler for this command
        from .worker_logging import SupabaseLogHandler

        tool_logger = logging.getLogger("hh_applicant_tool")
        log_handler = SupabaseLogHandler(self.supabase, cmd_id)
        log_handler.setFormatter(logging.Formatter("%(message)s"))
        log_handler.setLevel(logging.DEBUG)
        tool_logger.addHandler(log_handler)

        exit_code = 0
        error_message = None
        was_cancelled = False

        try:
            # Reload config before each operation
            self.config_loader.load()

            # Build argv
            argv = self.config_loader.build_argv(cmd_name, cmd_args)
            logger.info("argv: %s", argv)

            # Execute via HHApplicantTool in a thread with timeout
            from .main import HHApplicantTool

            cmd_result_holder: list[Any] = []
            cmd_error_holder: list[Exception] = []

            def _run_tool() -> None:
                try:
                    r = HHApplicantTool(argv).run()
                    cmd_result_holder.append(r)
                except Exception as e:
                    cmd_error_holder.append(e)

            cmd_thread = threading.Thread(target=_run_tool, daemon=True)
            self._current_cmd_thread = cmd_thread
            cmd_thread.start()
            cmd_thread.join(timeout=MAX_EXECUTION_TIME)

            if cmd_thread.is_alive():
                # Timed out — signal cancellation so the tool can stop gracefully
                if self._cancellation_event:
                    self._cancellation_event.set()
                cmd_thread.join(timeout=10)
                raise TimeoutError(
                    f"Command exceeded MAX_EXECUTION_TIME ({MAX_EXECUTION_TIME}s)"
                )

            if cmd_error_holder:
                raise cmd_error_holder[0]

            result = cmd_result_holder[0] if cmd_result_holder else 0
            exit_code = result if isinstance(result, int) else 0

        except Exception as ex:
            exit_code = 1
            error_message = str(ex)
            logger.error("Command failed: %s", ex)

        finally:
            # Check if cancelled during execution
            was_cancelled = self._cancellation_event.is_set()

            # Cleanup cancellation
            self._cancellation_event.set()  # Signal thread to stop
            cancel_thread.join(timeout=3)
            self._cancellation_event = None
            self._current_command_id = None
            _cancel_event = None

            # Flush remaining logs
            log_handler.close()
            tool_logger.removeHandler(log_handler)

            # Update command status (don't overwrite if already cancelled)
            if was_cancelled:
                status = "cancelled"
                error_message = error_message or "Отменено пользователем"
            else:
                status = "completed" if exit_code == 0 else "failed"

            completed_at = datetime.now(timezone.utc)
            try:
                self.supabase.table("command_queue").update(
                    {
                        "status": status,
                        "exit_code": exit_code,
                        "error_message": error_message,
                        "completed_at": completed_at.isoformat(),
                    }
                ).eq("id", cmd_id).execute()
            except Exception as ex:
                logger.error("Failed to update command status: %s", ex)

            # Telegram notification
            from .utils.telegram import notify_command_completed, notify_command_failed
            started_at = getattr(self, "_command_started_at", None)
            duration = int((completed_at - started_at).total_seconds()) if started_at else None
            if status == "completed":
                notify_command_completed(cmd_name, duration)
            elif status == "failed":
                notify_command_failed(cmd_name, error_message or "")

            # Auto-sync after every operation (except sync-db itself)
            if cmd_name != "sync-db":
                self._auto_sync()

    def _auto_sync(self) -> None:
        """Run sync-db after each operation to push fresh data to Supabase."""
        try:
            from .main import HHApplicantTool

            logger.info("Auto-sync starting...")
            HHApplicantTool(["sync-db"]).run()
            logger.info("Auto-sync completed")
        except Exception as ex:
            logger.warning("Auto-sync failed: %s", ex)

    def _fail_command(self, cmd_id: str, error: str) -> None:
        """Mark command as failed with error message."""
        logger.error("Command %s failed: %s", cmd_id, error)
        try:
            self.supabase.table("command_queue").update(
                {
                    "status": "failed",
                    "exit_code": 1,
                    "error_message": error,
                    "completed_at": datetime.now(timezone.utc).isoformat(),
                }
            ).eq("id", cmd_id).execute()
        except Exception as ex:
            logger.error("Failed to mark command as failed: %s", ex)

    def _send_heartbeat(self, status: str) -> None:
        """Update worker_status table."""
        try:
            self.supabase.table("worker_status").upsert(
                {
                    "worker_id": self._worker_id,
                    "status": status,
                    "last_seen_at": datetime.now(timezone.utc).isoformat(),
                    "version": "1.0.0",
                    "hostname": platform.node(),
                }
            ).execute()
        except Exception:
            pass  # Non-critical


def main() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname).1s] %(name)s: %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    daemon = WorkerDaemon()
    daemon.run()


if __name__ == "__main__":
    main()
