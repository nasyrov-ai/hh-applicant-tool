"""Поиск горячих вакансий и отправка Telegram-уведомлений."""

from __future__ import annotations

import argparse
import logging
from datetime import datetime, timezone, timedelta
from typing import TYPE_CHECKING, Any

from ..main import BaseNamespace, BaseOperation
from ..utils import telegram

if TYPE_CHECKING:
    from ..main import HHApplicantTool

logger = logging.getLogger(__package__)


class Namespace(BaseNamespace):
    hours: int
    top: int
    salary_multiplier: float


class Operation(BaseOperation):
    """Найти горячие вакансии и отправить в Telegram."""

    __aliases__ = ("hot",)

    def setup_parser(self, parser: argparse.ArgumentParser) -> None:
        parser.add_argument(
            "--hours",
            type=int,
            default=24,
            help="За сколько часов искать свежие вакансии (default: 24)",
        )
        parser.add_argument(
            "--top",
            type=int,
            default=5,
            help="Сколько горячих вакансий показать (default: 5)",
        )
        parser.add_argument(
            "--salary-multiplier",
            type=float,
            default=1.5,
            help="Множитель для salary_min (default: 1.5)",
        )

    def run(self, tool: HHApplicantTool) -> None:
        args: Namespace = tool.args  # type: ignore[assignment]
        storage = tool.storage

        # Get salary threshold from config
        salary_min = int(tool.config.get("salary_min", 0) or 0)
        salary_threshold = int(salary_min * args.salary_multiplier) if salary_min else 0

        cutoff = datetime.now(timezone.utc) - timedelta(hours=args.hours)
        cutoff_str = cutoff.isoformat()

        # Query fresh vacancies from local DB
        all_vacancies = list(storage.vacancies.find())
        fresh = []
        for v in all_vacancies:
            pub = v.published_at
            if not pub:
                continue
            if isinstance(pub, str):
                try:
                    pub = datetime.fromisoformat(pub.replace("Z", "+00:00"))
                except (ValueError, TypeError):
                    continue
            if pub.tzinfo is None:
                pub = pub.replace(tzinfo=timezone.utc)
            if pub < cutoff:
                continue
            fresh.append(v)

        logger.info("Свежих вакансий за %d ч: %d", args.hours, len(fresh))

        # Score vacancies
        scored: list[tuple[float, Any]] = []
        for v in fresh:
            score = 0.0
            sal = v.salary_from or v.salary_to or 0
            if salary_threshold and sal >= salary_threshold:
                score += 50 + (sal - salary_threshold) / 1000
            elif sal > 0:
                score += sal / 1000

            # Freshness bonus (newer = higher)
            pub = v.published_at
            if isinstance(pub, str):
                try:
                    pub = datetime.fromisoformat(pub.replace("Z", "+00:00"))
                except (ValueError, TypeError):
                    pub = None
            if pub:
                if pub.tzinfo is None:
                    pub = pub.replace(tzinfo=timezone.utc)
                hours_ago = (datetime.now(timezone.utc) - pub).total_seconds() / 3600
                if hours_ago < 6:
                    score += 30  # very fresh bonus

            scored.append((score, v))

        # Check watchlist
        watchlist_ids = set()
        try:
            for w in storage.employer_watchlist.find(notify=True):
                watchlist_ids.add(w.employer_id)
        except Exception:
            pass  # table may not exist yet

        # Separate watchlist hits
        watchlist_hits = []
        regular_hot = []
        for score, v in scored:
            emp_id = v.employer_id if hasattr(v, "employer_id") else None
            if emp_id and emp_id in watchlist_ids:
                watchlist_hits.append((score + 100, v))  # priority boost
            else:
                regular_hot.append((score, v))

        # Sort and take top N
        all_sorted = sorted(watchlist_hits + regular_hot, key=lambda x: x[0], reverse=True)
        top = all_sorted[: args.top]

        if not top:
            logger.info("Горячих вакансий не найдено")
            return

        # Build Telegram message
        lines = [f"<b>🔥 Горячие вакансии ({len(top)})</b>\n"]
        for i, (score, v) in enumerate(top, 1):
            sal_str = _format_salary(v.salary_from, v.salary_to, v.currency)
            emp_id = v.employer_id if hasattr(v, "employer_id") else None
            star = "⭐ " if emp_id and emp_id in watchlist_ids else ""
            name = getattr(v, "name", "?")
            url = getattr(v, "alternate_url", "")
            area = getattr(v, "area_name", "")

            line = f"{i}. {star}<a href=\"{url}\">{_escape(name)}</a>"
            if sal_str:
                line += f" — {sal_str}"
            if area:
                line += f" — {_escape(area)}"
            lines.append(line)

        message = "\n".join(lines)
        logger.info("Sending hot vacancies to Telegram:\n%s", message)

        if telegram.is_configured():
            telegram._send(message)
            logger.info("Уведомление отправлено в Telegram")
        else:
            logger.warning("Telegram не настроен")
            print(message)


def _format_salary(
    sal_from: int | None,
    sal_to: int | None,
    currency: str | None,
) -> str:
    if not sal_from and not sal_to:
        return ""
    c = currency or "RUR"
    sym = {"RUR": "₽", "USD": "$", "EUR": "€"}.get(c, c)
    if sal_from and sal_to:
        return f"{sal_from:,}–{sal_to:,} {sym}".replace(",", " ")
    if sal_from:
        return f"от {sal_from:,} {sym}".replace(",", " ")
    return f"до {sal_to:,} {sym}".replace(",", " ")


def _escape(text: str) -> str:
    return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
