from __future__ import annotations

import argparse
import getpass
import logging
import re
import secrets
from pathlib import Path
from typing import TYPE_CHECKING

from ..main import BaseNamespace, BaseOperation

if TYPE_CHECKING:
    from ..main import HHApplicantTool


logger = logging.getLogger(__name__)

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent.parent

SUPABASE_URL_PATTERN = re.compile(
    r"^https://[a-z0-9]+\.supabase\.co$"
)


class Namespace(BaseNamespace):
    supabase_url: str | None
    supabase_key: str | None
    anon_key: str | None
    dashboard_secret: str | None
    non_interactive: bool


class Operation(BaseOperation):
    """Интерактивная настройка Supabase и генерация .env файлов."""

    __aliases__: list = ["init"]

    def setup_parser(self, parser: argparse.ArgumentParser) -> None:
        parser.add_argument(
            "--supabase-url",
            help="URL проекта Supabase (https://xxx.supabase.co)",
        )
        parser.add_argument(
            "--supabase-key",
            help="Supabase service role key",
        )
        parser.add_argument(
            "--anon-key",
            help="Supabase anon (public) key",
        )
        parser.add_argument(
            "--dashboard-secret",
            help="Секрет для дашборда (по умолчанию генерируется случайный)",
        )
        parser.add_argument(
            "--non-interactive",
            action="store_true",
            default=False,
            help="Не запрашивать ввод, использовать только аргументы CLI",
        )

    def run(self, tool: HHApplicantTool) -> int | None:
        args = tool.args
        non_interactive = getattr(args, "non_interactive", False)

        # Welcome banner
        logger.info("=" * 60)
        logger.info("  hh-applicant-tool: Настройка Supabase")
        logger.info("=" * 60)
        logger.info("")

        # 1. Supabase URL
        supabase_url = getattr(args, "supabase_url", None)
        if not supabase_url:
            if non_interactive:
                logger.error("--supabase-url обязателен в неинтерактивном режиме")
                return 1
            supabase_url = input("Supabase URL (https://xxx.supabase.co): ").strip()

        if not SUPABASE_URL_PATTERN.match(supabase_url):
            logger.error(
                "Неверный формат URL. Ожидается https://xxx.supabase.co"
            )
            return 1

        # 2. Supabase service role key
        supabase_key = getattr(args, "supabase_key", None)
        if not supabase_key:
            if non_interactive:
                logger.error("--supabase-key обязателен в неинтерактивном режиме")
                return 1
            supabase_key = getpass.getpass("Supabase Service Role Key: ").strip()

        if not supabase_key.startswith("eyJ"):
            logger.error(
                "Неверный формат ключа. Service role key должен начинаться с 'eyJ'"
            )
            return 1

        # 3. Supabase anon key
        anon_key = getattr(args, "anon_key", None)
        if not anon_key:
            if non_interactive:
                logger.error("--anon-key обязателен в неинтерактивном режиме")
                return 1
            anon_key = getpass.getpass("Supabase Anon Key: ").strip()

        if not anon_key.startswith("eyJ"):
            logger.error(
                "Неверный формат ключа. Anon key должен начинаться с 'eyJ'"
            )
            return 1

        # 4. Test connection
        logger.info("Проверка подключения к Supabase...")
        try:
            from supabase import create_client
        except ImportError:
            logger.warning(
                "Библиотека supabase не установлена. "
                "Установите: pip install supabase. "
                "Пропускаю проверку подключения."
            )
        else:
            try:
                client = create_client(supabase_url, supabase_key)
                client.table("worker_status").select("*").limit(0).execute()
                logger.info("Подключение успешно!")
            except Exception as exc:
                error_msg = str(exc)
                if "relation" in error_msg and "does not exist" in error_msg:
                    logger.info(
                        "Подключение работает (таблицы еще не созданы — это нормально)."
                    )
                else:
                    logger.error("Ошибка подключения к Supabase: %s", exc)
                    return 1

        # 5. Schema instructions
        schema_path = PROJECT_ROOT / "docs" / "supabase-schema.sql"
        logger.info("")
        logger.info("Следующий шаг: создание таблиц в Supabase.")
        logger.info(
            "Откройте Supabase Dashboard > SQL Editor, "
            "скопируйте содержимое файла и выполните:"
        )
        logger.info("  %s", schema_path)
        logger.info("")

        # 6. Dashboard secret
        dashboard_secret = getattr(args, "dashboard_secret", None)
        if not dashboard_secret:
            if non_interactive:
                dashboard_secret = secrets.token_hex(16)
                logger.info("Сгенерирован DASHBOARD_SECRET.")
            else:
                default_secret = secrets.token_hex(16)
                user_input = input(
                    f"DASHBOARD_SECRET [{default_secret}]: "
                ).strip()
                dashboard_secret = user_input or default_secret

        # 7. Optional Telegram settings
        tg_bot_token = ""
        tg_chat_id = ""
        if not non_interactive:
            logger.info("")
            logger.info("Опционально: настройка Telegram-уведомлений.")
            tg_bot_token = input("TG_BOT_TOKEN (Enter чтобы пропустить): ").strip()
            if tg_bot_token:
                tg_chat_id = input("TG_CHAT_ID: ").strip()

        # 8. Write .env
        env_path = PROJECT_ROOT / ".env"
        if env_path.exists() and not non_interactive:
            overwrite = input(
                f"Файл {env_path} уже существует. Перезаписать? [y/N]: "
            ).strip().lower()
            if overwrite != "y":
                logger.info("Пропускаю запись .env")
                env_path = None

        if env_path is not None:
            env_lines = [
                f"SUPABASE_URL={supabase_url}",
                f"SUPABASE_SERVICE_KEY={supabase_key}",
                f"DASHBOARD_SECRET={dashboard_secret}",
            ]
            if tg_bot_token:
                env_lines.append(f"# Telegram")
                env_lines.append(f"TG_BOT_TOKEN={tg_bot_token}")
                env_lines.append(f"TG_CHAT_ID={tg_chat_id}")
            env_content = "\n".join(env_lines) + "\n"
            env_path.write_text(env_content, encoding="utf-8")
            logger.info("Записан файл: %s", env_path)

        # 9. Write dashboard/.env.local
        dashboard_env_path = PROJECT_ROOT / "dashboard" / ".env.local"
        if dashboard_env_path.exists() and not non_interactive:
            overwrite = input(
                f"Файл {dashboard_env_path} уже существует. Перезаписать? [y/N]: "
            ).strip().lower()
            if overwrite != "y":
                logger.info("Пропускаю запись dashboard/.env.local")
                dashboard_env_path = None

        if dashboard_env_path is not None:
            dashboard_env_path.parent.mkdir(parents=True, exist_ok=True)
            dashboard_lines = [
                f"NEXT_PUBLIC_SUPABASE_URL={supabase_url}",
                f"NEXT_PUBLIC_SUPABASE_ANON_KEY={anon_key}",
                f"DASHBOARD_SECRET={dashboard_secret}",
            ]
            dashboard_content = "\n".join(dashboard_lines) + "\n"
            dashboard_env_path.write_text(dashboard_content, encoding="utf-8")
            logger.info("Записан файл: %s", dashboard_env_path)

        # 10. Success
        logger.info("")
        logger.info("=" * 60)
        logger.info("  Настройка завершена!")
        logger.info("=" * 60)
        logger.info("")
        logger.info("Следующие шаги:")
        logger.info("  1. Выполните SQL-схему в Supabase SQL Editor")
        logger.info("  2. Авторизуйтесь: hh-applicant-tool authorize")
        logger.info("  3. Запустите дашборд: cd dashboard && npm run dev")
        logger.info("")

        return 0
