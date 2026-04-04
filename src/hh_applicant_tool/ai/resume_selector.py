"""Smart resume selection based on historical conversion data."""

from __future__ import annotations

import logging
import re
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from ..storage.facade import StorageFacade

logger = logging.getLogger(__package__)

# Russian stop words for keyword matching
_STOP_WORDS = frozenset(
    "и в на не с по для из к от до о за при но из-за что как"
    .split()
)


def select_best_resume(
    vacancy: dict[str, Any],
    resumes: list[dict[str, Any]],
    storage: StorageFacade,
    cached_stats: dict | None = None,
) -> dict[str, Any]:
    """Pick the best resume for this vacancy based on historical performance.

    Returns the best resume dict. Falls back to first resume if scoring fails.
    """
    if len(resumes) <= 1:
        return resumes[0]

    try:
        scores = {}
        stats = cached_stats if cached_stats is not None else _build_resume_stats(storage)

        experience = vacancy.get("experience", {})
        exp_id = experience.get("id") if isinstance(experience, dict) else experience
        salary = vacancy.get("salary") or {}
        sal_from = salary.get("from") if isinstance(salary, dict) else None
        sal_to = salary.get("to") if isinstance(salary, dict) else None
        sal_mid = (
            (sal_from + sal_to) / 2 if sal_from and sal_to else sal_from or sal_to
        )
        sal_bucket = _salary_bucket(sal_mid)
        vacancy_name = vacancy.get("name", "")

        for resume in resumes:
            rid = resume["id"]
            score = 0.0

            rs = stats.get(rid)
            if rs:
                # Weight 0.4: conversion by experience level
                if exp_id and exp_id in rs["by_exp"]:
                    exp_data = rs["by_exp"][exp_id]
                    if exp_data["total"] >= 3:
                        score += 0.4 * (exp_data["invites"] / exp_data["total"])

                # Weight 0.3: conversion by salary range
                if sal_bucket and sal_bucket in rs["by_salary"]:
                    sal_data = rs["by_salary"][sal_bucket]
                    if sal_data["total"] >= 3:
                        score += 0.3 * (sal_data["invites"] / sal_data["total"])

            # Weight 0.3: keyword match between resume title and vacancy name
            resume_title = resume.get("title", "")
            score += 0.3 * _keyword_similarity(vacancy_name, resume_title)

            scores[rid] = score

        best_id = max(scores, key=scores.get)  # type: ignore[arg-type]
        best = next((r for r in resumes if r["id"] == best_id), resumes[0])

        if best["id"] != resumes[0]["id"]:
            logger.info(
                "Smart resume: selected '%s' (score %.2f) over '%s' (score %.2f)",
                best.get("title", best["id"]),
                scores[best["id"]],
                resumes[0].get("title", resumes[0]["id"]),
                scores[resumes[0]["id"]],
            )

        return best

    except Exception:
        logger.debug("Resume selection failed, using first resume", exc_info=True)
        return resumes[0]


def _build_resume_stats(
    storage: StorageFacade,
) -> dict[str, dict[str, dict[str, dict[str, int]]]]:
    """Build per-resume conversion stats grouped by experience and salary."""
    all_negs = list(storage.negotiations.find())
    if not all_negs:
        return {}

    result: dict[str, Any] = {}

    all_vacs = {v.id: v for v in storage.vacancies.find()}

    for n in all_negs:
        rid = n.resume_id
        if not rid:
            continue

        if rid not in result:
            result[rid] = {"by_exp": {}, "by_salary": {}}

        v = all_vacs.get(n.vacancy_id)
        if not v:
            continue

        is_invite = n.state == "interview" or n.state.startswith("invitation")

        # By experience
        exp = v.experience or "unknown"
        if exp not in result[rid]["by_exp"]:
            result[rid]["by_exp"][exp] = {"total": 0, "invites": 0}
        result[rid]["by_exp"][exp]["total"] += 1
        if is_invite:
            result[rid]["by_exp"][exp]["invites"] += 1

        # By salary
        sal_mid = _vacancy_mid(v)
        bucket = _salary_bucket(sal_mid)
        if bucket not in result[rid]["by_salary"]:
            result[rid]["by_salary"][bucket] = {"total": 0, "invites": 0}
        result[rid]["by_salary"][bucket]["total"] += 1
        if is_invite:
            result[rid]["by_salary"][bucket]["invites"] += 1

    return result


def _keyword_similarity(text_a: str, text_b: str) -> float:
    """Jaccard similarity between tokenized texts (excluding stop words)."""
    tokens_a = _tokenize(text_a)
    tokens_b = _tokenize(text_b)
    if not tokens_a or not tokens_b:
        return 0.0
    intersection = tokens_a & tokens_b
    union = tokens_a | tokens_b
    return len(intersection) / len(union) if union else 0.0


def _tokenize(text: str) -> set[str]:
    words = set(re.findall(r"[a-zа-яё]+", text.lower()))
    return words - _STOP_WORDS


def _salary_bucket(mid: float | int | None) -> str:
    if not mid:
        return "unknown"
    if mid < 50_000:
        return "<50k"
    if mid < 100_000:
        return "50-100k"
    if mid < 200_000:
        return "100-200k"
    if mid < 300_000:
        return "200-300k"
    return "300k+"


def _vacancy_mid(v: Any) -> float | None:
    sf = getattr(v, "salary_from", None)
    st = getattr(v, "salary_to", None)
    if sf and st:
        return (sf + st) / 2
    return sf or st
