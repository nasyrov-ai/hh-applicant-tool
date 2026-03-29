from __future__ import annotations

import argparse
import json
import logging
import os
import re
from datetime import datetime, timezone
from typing import TYPE_CHECKING, Any

from ..main import BaseNamespace, BaseOperation

if TYPE_CHECKING:
    from ..main import HHApplicantTool

logger = logging.getLogger(__package__)

BATCH_SIZE = 200

# Порядок важен: FK-зависимости (employers -> vacancies -> negotiations)
SYNC_TABLES = [
    "employers",
    "vacancies",
    "resumes",
    "negotiations",
    "vacancy_contacts",
    "employer_sites",
]

# Столбцы, хранящие JSON в SQLite (TEXT), но ожидаемые как JSONB в Supabase
JSONB_COLUMNS: dict[str, set[str]] = {
    "vacancies": {"professional_roles"},
}

# Таблицы, для которых upsert должен использовать составной ключ конфликта
# вместо первичного ключа (например, employer_sites не имеет стабильного id)
COMPOSITE_CONFLICT: dict[str, str] = {
    "employer_sites": "employer_id,site_url",
}

# Столбцы, которые нужно исключить при upsert (автогенерируемые на стороне БД)
EXCLUDE_COLUMNS: dict[str, set[str]] = {
    "employer_sites": {"id"},
}

# Regex для проверки ISO datetime без таймзоны
_NAIVE_DT_RE = re.compile(r"^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(\.\d+)?$")


class Namespace(BaseNamespace):
    full: bool
    dry_run: bool
    supabase_url: str | None
    supabase_key: str | None


class Operation(BaseOperation):
    """Синхронизация локальной SQLite базы с Supabase для дашборда."""

    __aliases__ = ["sync", "push-db"]

    def setup_parser(self, parser: argparse.ArgumentParser) -> None:
        parser.add_argument(
            "--full",
            action="store_true",
            help="Полная синхронизация (игнорировать время последней синхронизации)",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Только показать что будет синхронизировано, без реальной отправки",
        )
        parser.add_argument(
            "--supabase-url",
            help="URL проекта Supabase (или env SUPABASE_URL)",
        )
        parser.add_argument(
            "--supabase-key",
            help="Service role key Supabase (или env SUPABASE_SERVICE_KEY)",
        )

    def run(self, tool: HHApplicantTool) -> None:
        try:
            from supabase import create_client
        except ImportError:
            logger.error(
                "Пакет supabase не установлен. "
                "Установите: poetry install --extras dashboard"
            )
            return 1

        args: Namespace = tool.args

        url = (
            args.supabase_url
            or os.getenv("SUPABASE_URL")
            or tool.config.get("supabase", {}).get("url")
        )
        key = (
            args.supabase_key
            or os.getenv("SUPABASE_SERVICE_KEY")
            or tool.config.get("supabase", {}).get("service_key")
        )

        if not url or not key:
            logger.error(
                "Укажите SUPABASE_URL и SUPABASE_SERVICE_KEY "
                "(аргументы, env или config.json)"
            )
            return 1

        dry_run: bool = getattr(args, "dry_run", False)

        if dry_run:
            logger.info("=== DRY RUN: данные НЕ будут отправлены ===")

        supabase = create_client(url, key)
        db = tool.db

        # Получаем время последней синхронизации
        last_synced: dict[str, str] = {}
        if not args.full:
            try:
                result = supabase.table("sync_log").select("*").execute()
                for row in result.data:
                    last_synced[row["table_name"]] = row["last_synced_at"]
            except Exception as ex:
                logger.warning("Не удалось прочитать sync_log: %s", ex)

        total_synced = 0
        # BUG 4 fix: track per-table success to only update sync_log on full success
        sync_results: dict[str, tuple[int, bool]] = {}

        for table_name in SYNC_TABLES:
            since = last_synced.get(table_name) if not args.full else None

            # BUG 3 fix: read raw SQL instead of going through models that strip fields
            rows = self._read_raw_rows(db, table_name, since)

            if not rows:
                logger.info("%-20s -- нет новых данных", table_name)
                sync_results[table_name] = (0, True)
                continue

            # Post-process rows for Supabase compatibility
            rows = self._prepare_rows(table_name, rows)

            if dry_run:
                logger.info(
                    "%-20s -- %d записей для синхронизации (dry-run)",
                    table_name,
                    len(rows),
                )
                sync_results[table_name] = (len(rows), True)
                total_synced += len(rows)
                continue

            # Батчевый upsert в Supabase
            synced, all_ok = self._upsert_batched(supabase, table_name, rows)
            sync_results[table_name] = (synced, all_ok)
            total_synced += synced

            logger.info(
                "%-20s -- синхронизировано %d записей%s",
                table_name,
                synced,
                "" if all_ok else " (с ошибками)",
            )

        # BUG 4 fix: only update sync_log for tables where ALL batches succeeded
        if not dry_run:
            now = datetime.now(timezone.utc).isoformat()
            for table_name, (synced, all_ok) in sync_results.items():
                if not all_ok or synced == 0:
                    continue
                try:
                    supabase.table("sync_log").upsert(
                        {
                            "table_name": table_name,
                            "last_synced_at": now,
                            "rows_synced": synced,
                        }
                    ).execute()
                except Exception as ex:
                    logger.warning(
                        "Не удалось обновить sync_log для %s: %s",
                        table_name,
                        ex,
                    )

        logger.info("Синхронизация завершена. Всего: %d записей", total_synced)

    def _read_raw_rows(
        self,
        db: Any,
        table_name: str,
        since: str | None,
    ) -> list[dict[str, Any]]:
        """Read all columns directly from SQLite via raw SQL.

        This avoids going through model.to_db() which can strip fields
        like updated_at or created_at that the model doesn't declare.
        """
        if since:
            sql = (
                f"SELECT * FROM {table_name} "
                f"WHERE updated_at > ? ORDER BY rowid"
            )
            cur = db.execute(sql, (since,))
        else:
            sql = f"SELECT * FROM {table_name} ORDER BY rowid"
            cur = db.execute(sql)

        columns = [desc[0] for desc in cur.description]
        result = []
        for raw_row in cur.fetchall():
            row = dict(zip(columns, raw_row))
            result.append(row)
        return result

    def _prepare_rows(
        self,
        table_name: str,
        rows: list[dict[str, Any]],
    ) -> list[dict[str, Any]]:
        """Apply all necessary transformations before sending to Supabase."""
        jsonb_cols = JSONB_COLUMNS.get(table_name, set())
        exclude_cols = EXCLUDE_COLUMNS.get(table_name, set())

        result = []
        for row in rows:
            cleaned = {}
            for k, v in row.items():
                # Skip auto-increment columns that Supabase manages
                if k in exclude_cols:
                    continue

                # BUG 5 fix: parse JSON strings back to objects for JSONB columns
                if k in jsonb_cols and isinstance(v, str):
                    try:
                        v = json.loads(v)
                    except (json.JSONDecodeError, TypeError):
                        pass

                # BUG 6 fix: append timezone to naive datetime strings
                if isinstance(v, str) and _NAIVE_DT_RE.match(v):
                    v = v + "+00:00"

                # BUG 1 fix: convert hex IDs to UUID format for vacancy_contacts
                if table_name == "vacancy_contacts" and k == "id":
                    v = self._hex_to_uuid(v)

                # Send all fields including None -- removing None prevents
                # syncing cleared/nulled fields to Supabase
                cleaned[k] = v

            result.append(cleaned)
        return result

    @staticmethod
    def _hex_to_uuid(hex_str: str) -> str:
        """Convert a 32-char hex string to UUID format (8-4-4-4-12).

        If the value is already a valid UUID or not a 32-char hex string,
        return it as-is.
        """
        if not hex_str or "-" in hex_str or len(hex_str) != 32:
            return hex_str
        try:
            # Validate it's actually hex
            int(hex_str, 16)
        except ValueError:
            return hex_str
        return (
            f"{hex_str[:8]}-{hex_str[8:12]}-{hex_str[12:16]}"
            f"-{hex_str[16:20]}-{hex_str[20:]}"
        )

    def _upsert_batched(
        self,
        supabase: Any,
        table_name: str,
        rows: list[dict[str, Any]],
    ) -> tuple[int, bool]:
        """Upsert data in batches. Returns (count_synced, all_succeeded)."""
        total = 0
        all_ok = True
        on_conflict = COMPOSITE_CONFLICT.get(table_name)

        for i in range(0, len(rows), BATCH_SIZE):
            batch = rows[i : i + BATCH_SIZE]
            try:
                # BUG 2 fix: use composite conflict key for tables like employer_sites
                query = supabase.table(table_name)
                if on_conflict:
                    query.upsert(batch, on_conflict=on_conflict).execute()
                else:
                    query.upsert(batch).execute()
                total += len(batch)
            except Exception as ex:
                logger.error(
                    "Ошибка upsert %s (batch %d-%d): %s",
                    table_name,
                    i,
                    i + len(batch),
                    ex,
                )
                all_ok = False
        return total, all_ok
