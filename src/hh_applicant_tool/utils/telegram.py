"""Telegram notifications for worker events."""
from __future__ import annotations

import json
import logging
import os
import threading
import time
from typing import Any

import requests

logger = logging.getLogger(__package__)

_BOT_TOKEN = os.environ.get("TG_BOT_TOKEN", "")
_CHAT_ID = os.environ.get("TG_CHAT_ID", "")
_LAST_UPDATE_ID = 0


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


def _send_sync(text: str, parse_mode: str = "HTML") -> int | None:
    """Send message synchronously. Returns message_id."""
    if not is_configured():
        return None
    try:
        resp = requests.post(
            f"https://api.telegram.org/bot{_BOT_TOKEN}/sendMessage",
            json={
                "chat_id": _CHAT_ID,
                "text": text[:4096],
                "parse_mode": parse_mode,
                "disable_web_page_preview": True,
            },
            timeout=10,
        )
        data = resp.json()
        if data.get("ok"):
            return data["result"]["message_id"]
    except Exception as ex:
        logger.debug("Telegram send failed: %s", ex)
    return None


def _send_with_buttons(
    text: str, buttons: list[list[dict]], parse_mode: str = "HTML"
) -> int | None:
    """Send message with inline keyboard. Returns message_id."""
    if not is_configured():
        return None
    try:
        resp = requests.post(
            f"https://api.telegram.org/bot{_BOT_TOKEN}/sendMessage",
            json={
                "chat_id": _CHAT_ID,
                "text": text[:4096],
                "parse_mode": parse_mode,
                "disable_web_page_preview": True,
                "reply_markup": {"inline_keyboard": buttons},
            },
            timeout=10,
        )
        data = resp.json()
        if data.get("ok"):
            return data["result"]["message_id"]
    except Exception as ex:
        logger.debug("Telegram send failed: %s", ex)
    return None


def _flush_updates() -> None:
    """Flush old updates so we only get fresh replies."""
    global _LAST_UPDATE_ID
    try:
        resp = requests.get(
            f"https://api.telegram.org/bot{_BOT_TOKEN}/getUpdates",
            params={"offset": -1, "limit": 1},
            timeout=10,
        )
        data = resp.json()
        if data.get("ok") and data.get("result"):
            _LAST_UPDATE_ID = data["result"][-1]["update_id"] + 1
    except Exception:
        pass


def _wait_for_reply(timeout_sec: int = 300) -> str | None:
    """Wait for a text reply or callback_query from the user.
    Returns reply text, or None on timeout."""
    global _LAST_UPDATE_ID
    deadline = time.monotonic() + timeout_sec

    while time.monotonic() < deadline:
        try:
            resp = requests.get(
                f"https://api.telegram.org/bot{_BOT_TOKEN}/getUpdates",
                params={
                    "offset": _LAST_UPDATE_ID,
                    "timeout": 10,
                    "allowed_updates": ["message", "callback_query"],
                },
                timeout=15,
            )
            data = resp.json()
            if not data.get("ok"):
                time.sleep(2)
                continue

            for update in data.get("result", []):
                _LAST_UPDATE_ID = update["update_id"] + 1

                # Inline button callback
                cb = update.get("callback_query")
                if cb and str(cb.get("from", {}).get("id")) == _CHAT_ID:
                    # Acknowledge the callback
                    try:
                        requests.post(
                            f"https://api.telegram.org/bot{_BOT_TOKEN}/answerCallbackQuery",
                            json={"callback_query_id": cb["id"]},
                            timeout=5,
                        )
                    except Exception:
                        pass
                    return cb.get("data", "")

                # Text message reply
                msg = update.get("message", {})
                if (
                    str(msg.get("chat", {}).get("id")) == _CHAT_ID
                    and msg.get("text")
                ):
                    return msg["text"]

        except Exception:
            time.sleep(2)

    return None


def ask_review(
    employer_name: str,
    vacancy_name: str,
    vacancy_url: str,
    last_messages: list[str],
    ai_draft: str,
    timeout_sec: int = 300,
) -> str | None:
    """Ask user to review AI reply via Telegram.

    Returns:
        - The AI draft if user approves (button or "ок")
        - Custom text if user types their own reply
        - None if user skips or timeout
    """
    if not is_configured():
        return ai_draft  # No Telegram — send as-is

    link = f'<a href="{vacancy_url}">{_escape(vacancy_name)}</a>' if vacancy_url else _escape(vacancy_name)

    # Last 3 messages for context
    history = ""
    for msg in last_messages[-3:]:
        history += f"  {_escape(msg[:150])}\n"

    text = (
        f"❓ <b>Нужна проверка</b>\n\n"
        f"🏢 {_escape(employer_name)}\n"
        f"💼 {link}\n\n"
        f"<b>Последние сообщения:</b>\n{history}\n"
        f"<b>AI хочет ответить:</b>\n<i>{_escape(ai_draft[:600])}</i>\n\n"
        f"Нажми ✅ чтобы отправить, ❌ чтобы пропустить, или напиши свой вариант (5 мин)"
    )

    buttons = [
        [
            {"text": "✅ Отправить", "callback_data": "__approve__"},
            {"text": "❌ Пропустить", "callback_data": "__skip__"},
        ]
    ]

    _flush_updates()
    msg_id = _send_with_buttons(text, buttons)
    if not msg_id:
        return ai_draft

    reply = _wait_for_reply(timeout_sec)

    if reply is None:
        _send("⏰ Таймаут — пропускаю чат")
        return None
    if reply == "__approve__":
        _send("👍 Отправляю")
        return ai_draft
    if reply == "__skip__":
        _send("⏭ Пропущено")
        return None

    # User typed custom reply
    _send(f"👍 Отправляю твой вариант")
    return reply


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
