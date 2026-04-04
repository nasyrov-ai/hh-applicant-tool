"""Build performance context for AI prompts based on historical data."""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING, Any

from .resume_selector import _salary_bucket, _vacancy_mid

if TYPE_CHECKING:
    from ..storage.facade import StorageFacade

logger = logging.getLogger(__package__)


def build_ai_context(
    vacancy: dict[str, Any],
    resume_id: str,
    storage: StorageFacade,
    cached_negs: list | None = None,
    cached_vacs: dict | None = None,
) -> str:
    """Return a context block for the AI prompt based on past performance.

    Queries local SQLite only. Returns empty string if no relevant data.
    """
    hints: list[str] = []

    try:
        employer_id = (vacancy.get("employer") or {}).get("id")
        experience = vacancy.get("experience", {})
        exp_id = experience.get("id") if isinstance(experience, dict) else experience
        salary = vacancy.get("salary") or {}
        sal_from = salary.get("from") if isinstance(salary, dict) else None
        sal_to = salary.get("to") if isinstance(salary, dict) else None

        # Load all negotiations and vacancies (local SQLite — fast)
        all_negs = cached_negs if cached_negs is not None else list(storage.negotiations.find())
        if not all_negs:
            return ""

        all_vacs = cached_vacs if cached_vacs is not None else {v.id: v for v in storage.vacancies.find()}

        # Signal 1: same employer history
        if employer_id:
            emp_negs = [n for n in all_negs if n.employer_id == employer_id]
            emp_discards = sum(1 for n in emp_negs if n.state == "discard")
            if emp_discards > 0:
                hints.append(
                    f"Этот работодатель ранее отклонил {emp_discards} из "
                    f"{len(emp_negs)} откликов. Подчеркни уникальные навыки."
                )

        # Signal 2: experience level conversion
        if exp_id:
            exp_negs = [
                n for n in all_negs
                if (v := all_vacs.get(n.vacancy_id)) and v.experience == exp_id
            ]
            if len(exp_negs) >= 5:
                invites = sum(
                    1
                    for n in exp_negs
                    if n.state == "interview" or n.state.startswith("invitation")
                )
                rate = invites / len(exp_negs) * 100
                if rate < 10:
                    hints.append(
                        f"Конверсия для вакансий с таким опытом: {rate:.1f}%. "
                        "Будь конкретнее в описании релевантных навыков."
                    )

        # Signal 3: salary range performance
        if sal_from or sal_to:
            mid = (
                (sal_from + sal_to) / 2
                if sal_from and sal_to
                else sal_from or sal_to
            )
            bucket = _salary_bucket(mid)
            bucket_negs = [
                n for n in all_negs
                if (v := all_vacs.get(n.vacancy_id))
                and _salary_bucket(_vacancy_mid(v)) == bucket
            ]
            if len(bucket_negs) >= 5:
                invites = sum(
                    1
                    for n in bucket_negs
                    if n.state == "interview" or n.state.startswith("invitation")
                )
                rate = invites / len(bucket_negs) * 100
                if rate > 15:
                    hints.append(
                        f"Вакансии в этом диапазоне зарплат дают хорошую конверсию "
                        f"({rate:.1f}%). Уверенный тон уместен."
                    )

    except Exception:
        logger.debug("Failed to build AI context", exc_info=True)
        return ""

    if not hints:
        return ""

    lines = "\n".join(f"- {h}" for h in hints)
    return (
        "=== КОНТЕКСТ НА ОСНОВЕ СТАТИСТИКИ (используй для адаптации тона) ===\n"
        f"{lines}\n"
        "=== КОНЕЦ КОНТЕКСТА ==="
    )
