"""Telegram notifications for worker events."""
from __future__ import annotations

import logging
import os
import threading
from typing import Any

import requests

logger = logging.getLogger(__package__)

_BOT_TOKEN = os.environ.get("TG_BOT_TOKEN", "")
_CHAT_ID = os.environ.get("TG_CHAT_ID", "")


def is_configured() -> bool:
    return bool(_BOT_TOKEN and _CHAT_ID)


def _send(text: str, parse_mode: str = "HTML") -> None:
    """Send message in background thread (non-blocking)."""
    if not is_configured():
        return

    def _do_send():
        try:
            requests.post(
                f"https://api.telegram.org/bot{_BOT_TOKEN}/sendMessage",
                json={
                    "chat_id": _CHAT_ID,
                    "text": text[:4096],
                    "parse_mode": parse_mode,
                    "disable_web_page_preview": True,
                },
                timeout=10,
            )
        except Exception as ex:
            logger.debug("Telegram send failed: %s", ex)

    threading.Thread(target=_do_send, daemon=True).start()


def notify_reply_sent(
    employer_name: str,
    vacancy_name: str,
    message: str,
    vacancy_url: str = "",
) -> None:
    """Notification: AI reply sent to employer."""
    link = f'<a href="{vacancy_url}">{vacancy_name}</a>' if vacancy_url else vacancy_name
    text = (
        f"💬 <b>Ответ отправлен</b>\n"
        f"🏢 {employer_name}\n"
        f"💼 {link}\n\n"
        f"<i>{_escape(message[:500])}</i>"
    )
    _send(text)


def notify_application_sent(
    vacancy_name: str,
    employer_name: str,
    vacancy_url: str = "",
    has_cover_letter: bool = False,
) -> None:
    """Notification: application sent to vacancy."""
    link = f'<a href="{vacancy_url}">{vacancy_name}</a>' if vacancy_url else vacancy_name
    letter_icon = "🤖" if has_cover_letter else "📄"
    text = (
        f"📨 <b>Отклик отправлен</b> {letter_icon}\n"
        f"🏢 {employer_name}\n"
        f"💼 {link}"
    )
    _send(text)


def notify_command_completed(command: str, duration_sec: int | None = None) -> None:
    """Notification: command finished successfully."""
    dur = f" за {duration_sec}с" if duration_sec else ""
    _send(f"✅ <b>{command}</b> завершена{dur}")


def notify_command_failed(command: str, error: str = "") -> None:
    """Notification: command failed."""
    err = f"\n<code>{_escape(error[:500])}</code>" if error else ""
    _send(f"❌ <b>{command}</b> ошибка{err}")


def notify_ai_rejected(
    vacancy_name: str, reason: str, message_preview: str = ""
) -> None:
    """Notification: AI message was rejected by validation."""
    preview = f"\n<i>{_escape(message_preview[:200])}</i>" if message_preview else ""
    _send(f"⚠️ <b>AI отклонён</b>: {reason}\n💼 {vacancy_name}{preview}")


def _escape(text: str) -> str:
    """Escape HTML special chars."""
    return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
