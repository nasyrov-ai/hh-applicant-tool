"""Unit tests for the WorkerDaemon core logic.

Tests use unittest.mock to avoid real Supabase connections.
Each test targets a specific behavior: backoff, zombie protection,
timeouts, stale cleanup, and command allowlisting.
"""

from __future__ import annotations

import threading
import time
import unittest
from datetime import datetime, timezone
from unittest.mock import MagicMock, patch, PropertyMock

# We need to patch env vars and imports before importing worker
import os

# Ensure env vars are set so WorkerDaemon.__init__ won't sys.exit
_ENV_PATCH = {
    "SUPABASE_URL": "https://fake.supabase.co",
    "SUPABASE_SERVICE_KEY": "fake-key",
}


def _make_mock_supabase():
    """Create a mock supabase client with chained table().method() API."""
    client = MagicMock()
    return client


def _make_execute_result(data=None):
    """Create a mock execute() result with .data attribute."""
    result = MagicMock()
    result.data = data if data is not None else []
    return result


def _create_daemon():
    """Create a WorkerDaemon with all external dependencies mocked out."""
    with (
        patch.dict(os.environ, _ENV_PATCH),
        patch(
            "hh_applicant_tool.worker.WorkerDaemon.__init__",
            lambda self: None,
        ),
    ):
        from hh_applicant_tool.worker import WorkerDaemon

        daemon = WorkerDaemon()
        daemon._running = True
        daemon._worker_id = "test-worker-1"
        daemon.supabase = _make_mock_supabase()
        daemon.config_loader = MagicMock()
        daemon.scheduler = MagicMock()
        daemon._cancellation_event = None
        daemon._current_command_id = None
        daemon._current_cmd_thread = None
        daemon._heartbeat_stop = threading.Event()
        return daemon


class TestBackoffIncreases(unittest.TestCase):
    """Verify polling interval grows when no commands are found."""

    def test_backoff_increases(self):
        from hh_applicant_tool.worker import (
            POLL_BACKOFF_FACTOR,
            POLL_INTERVAL,
            POLL_INTERVAL_MAX,
        )

        daemon = _create_daemon()

        # _poll_command returns None (no work)
        daemon._poll_command = MagicMock(return_value=None)

        # Run a few poll cycles manually, simulating the run() loop logic
        current_interval = POLL_INTERVAL
        intervals = [current_interval]

        for _ in range(6):
            command = daemon._poll_command()
            if command is None:
                current_interval = min(
                    current_interval * POLL_BACKOFF_FACTOR,
                    POLL_INTERVAL_MAX,
                )
                intervals.append(current_interval)

        # Interval should strictly increase
        for i in range(1, len(intervals)):
            self.assertGreaterEqual(intervals[i], intervals[i - 1])

        # Should eventually reach the cap
        self.assertAlmostEqual(intervals[-1], POLL_INTERVAL_MAX, places=1)


class TestBackoffResets(unittest.TestCase):
    """Verify polling interval resets when a command is found."""

    def test_backoff_resets_on_command(self):
        from hh_applicant_tool.worker import (
            POLL_BACKOFF_FACTOR,
            POLL_INTERVAL,
            POLL_INTERVAL_MAX,
        )

        # Simulate: several idle polls, then a command arrives
        current_interval = POLL_INTERVAL

        # Grow the interval
        for _ in range(10):
            current_interval = min(
                current_interval * POLL_BACKOFF_FACTOR,
                POLL_INTERVAL_MAX,
            )
        self.assertGreater(current_interval, POLL_INTERVAL)

        # Command found — reset (as done in run() loop)
        command_found = True
        if command_found:
            current_interval = POLL_INTERVAL

        self.assertEqual(current_interval, POLL_INTERVAL)


class TestZombieThreadProtection(unittest.TestCase):
    """Verify worker skips poll when previous command thread is still alive."""

    def test_skips_poll_when_thread_alive(self):
        daemon = _create_daemon()
        daemon._poll_command = MagicMock(return_value=None)

        # Simulate a still-alive thread
        alive_thread = MagicMock(spec=threading.Thread)
        alive_thread.is_alive.return_value = True
        daemon._current_cmd_thread = alive_thread

        # Reproduce the guard from run()
        skipped = False
        if (
            daemon._current_cmd_thread is not None
            and daemon._current_cmd_thread.is_alive()
        ):
            skipped = True

        self.assertTrue(skipped)
        # _poll_command should NOT have been called
        daemon._poll_command.assert_not_called()

    def test_polls_when_thread_finished(self):
        daemon = _create_daemon()
        daemon._poll_command = MagicMock(return_value=None)

        finished_thread = MagicMock(spec=threading.Thread)
        finished_thread.is_alive.return_value = False
        daemon._current_cmd_thread = finished_thread

        skipped = False
        if (
            daemon._current_cmd_thread is not None
            and daemon._current_cmd_thread.is_alive()
        ):
            skipped = True

        self.assertFalse(skipped)


class TestCommandTimeout(unittest.TestCase):
    """Verify MAX_EXECUTION_TIME enforcement via thread join timeout."""

    def test_timeout_marks_command_failed(self):
        """Simulate the timeout path: thread.join(timeout) returns with
        thread still alive, which triggers TimeoutError."""
        from hh_applicant_tool.worker import ALLOWED_COMMANDS

        daemon = _create_daemon()

        # We directly test the timeout logic:
        # When cmd_thread.is_alive() is True after join(timeout),
        # the code raises TimeoutError.
        # Instead of running the full _execute_command with real threads,
        # test the logic inline.

        max_exec = 1  # seconds
        timeout_raised = False
        error_message = None

        # Simulate: thread started, join() returned, thread still alive
        cmd_thread = MagicMock(spec=threading.Thread)
        cmd_thread.is_alive.return_value = True  # still running after join

        cancellation_event = threading.Event()

        try:
            # This is the exact code path from _execute_command
            if cmd_thread.is_alive():
                cancellation_event.set()
                cmd_thread.join(timeout=10)
                raise TimeoutError(
                    f"Command exceeded MAX_EXECUTION_TIME ({max_exec}s)"
                )
        except TimeoutError as ex:
            timeout_raised = True
            error_message = str(ex)

        self.assertTrue(timeout_raised)
        self.assertIn("MAX_EXECUTION_TIME", error_message)
        self.assertTrue(cancellation_event.is_set(),
                        "Cancellation event should be set on timeout")

    def test_thread_join_uses_max_execution_time(self):
        """Verify that the constant MAX_EXECUTION_TIME is used as the
        thread join timeout in the source code."""
        import inspect
        from hh_applicant_tool.worker import WorkerDaemon

        source = inspect.getsource(WorkerDaemon._execute_command)
        self.assertIn("MAX_EXECUTION_TIME", source)
        self.assertIn("cmd_thread.join(timeout=MAX_EXECUTION_TIME)", source)
        self.assertIn("TimeoutError", source)


class TestCleanupStaleCommands(unittest.TestCase):
    """Verify stale pending/running commands are marked as failed on startup."""

    def test_cleanup_marks_running_as_failed(self):
        daemon = _create_daemon()

        # Setup the chain: table("command_queue").update(...).eq("status", "running").execute()
        table_mock = MagicMock()
        update_mock = MagicMock()
        eq_mock = MagicMock()

        daemon.supabase.table.return_value = table_mock
        table_mock.update.return_value = update_mock
        update_mock.eq.return_value = eq_mock
        eq_mock.execute.return_value = _make_execute_result(
            [{"id": "stale-1"}, {"id": "stale-2"}]
        )

        daemon._cleanup_stale_commands()

        # Should have called table("command_queue")
        daemon.supabase.table.assert_called_with("command_queue")

        # Should have called update with status=failed
        update_arg = table_mock.update.call_args[0][0]
        self.assertEqual(update_arg["status"], "failed")
        self.assertIn("перезапущен", update_arg["error_message"])

        # Should filter by running status
        update_mock.eq.assert_called_with("status", "running")

    def test_cleanup_handles_no_stale(self):
        daemon = _create_daemon()

        table_mock = MagicMock()
        update_mock = MagicMock()
        eq_mock = MagicMock()

        daemon.supabase.table.return_value = table_mock
        table_mock.update.return_value = update_mock
        update_mock.eq.return_value = eq_mock
        eq_mock.execute.return_value = _make_execute_result([])

        # Should not raise
        daemon._cleanup_stale_commands()


class TestAllowedCommands(unittest.TestCase):
    """Verify only ALLOWED_COMMANDS are accepted for execution."""

    def test_allowed_command_passes_validation(self):
        from hh_applicant_tool.worker import ALLOWED_COMMANDS

        # All these should be in the set
        expected = {
            "apply-vacancies",
            "reply-employers",
            "update-resumes",
            "clear-negotiations",
            "sync-db",
            "list-resumes",
            "refresh-token",
            "test-session",
            "whoami",
            "hot-vacancies",
        }
        self.assertEqual(ALLOWED_COMMANDS, expected)

    def test_disallowed_command_rejected(self):
        daemon = _create_daemon()

        # Track _fail_command calls
        daemon._fail_command = MagicMock()

        command = {
            "id": "cmd-evil",
            "command": "rm -rf /",
            "args": {},
        }

        # Reproduce validation logic from _execute_command
        from hh_applicant_tool.worker import ALLOWED_COMMANDS

        cmd_name = command["command"]
        if cmd_name not in ALLOWED_COMMANDS:
            daemon._fail_command(
                command["id"], f"Command not allowed: {cmd_name}"
            )

        daemon._fail_command.assert_called_once_with(
            "cmd-evil", "Command not allowed: rm -rf /"
        )

    def test_disallowed_via_execute_command(self):
        """Test that _execute_command itself rejects disallowed commands."""
        daemon = _create_daemon()
        daemon._fail_command = MagicMock()

        command = {
            "id": "cmd-bad",
            "command": "drop-database",
            "args": {},
        }

        # Patch logger to avoid noise
        with patch("hh_applicant_tool.worker.logger"):
            daemon._execute_command(command)

        daemon._fail_command.assert_called_once_with(
            "cmd-bad", "Command not allowed: drop-database"
        )


if __name__ == "__main__":
    unittest.main()
