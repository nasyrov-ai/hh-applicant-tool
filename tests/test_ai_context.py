"""Unit tests for build_ai_context from ai/context.py."""

from __future__ import annotations

import unittest
from types import SimpleNamespace
from unittest.mock import MagicMock


def _make_storage(negotiations=None, vacancies=None):
    """Create a mock StorageFacade with .negotiations.find() and .vacancies.find()."""
    storage = MagicMock()
    storage.negotiations.find.return_value = negotiations or []
    storage.vacancies.find.return_value = vacancies or []
    return storage


def _neg(*, id=1, state="response", vacancy_id=100, employer_id=10, resume_id="r1"):
    return SimpleNamespace(
        id=id,
        state=state,
        vacancy_id=vacancy_id,
        employer_id=employer_id,
        resume_id=resume_id,
    )


def _vac(*, id=100, experience="between1And3", salary_from=None, salary_to=None):
    return SimpleNamespace(
        id=id,
        experience=experience,
        salary_from=salary_from,
        salary_to=salary_to,
    )


class TestBuildAiContextEmpty(unittest.TestCase):
    """Returns empty string when there is no negotiation history."""

    def test_no_negotiations(self):
        from hh_applicant_tool.ai.context import build_ai_context

        storage = _make_storage(negotiations=[], vacancies=[])
        vacancy = {"employer": {"id": 10}, "experience": {"id": "between1And3"}}

        result = build_ai_context(vacancy, "r1", storage)
        self.assertEqual(result, "")


class TestEmployerWarning(unittest.TestCase):
    """Returns employer discard warning when same employer previously discarded."""

    def test_same_employer_discards(self):
        from hh_applicant_tool.ai.context import build_ai_context

        negs = [
            _neg(id=1, state="discard", employer_id=42, vacancy_id=100),
            _neg(id=2, state="discard", employer_id=42, vacancy_id=101),
            _neg(id=3, state="response", employer_id=42, vacancy_id=102),
        ]
        vacs = [_vac(id=100), _vac(id=101), _vac(id=102)]
        storage = _make_storage(negotiations=negs, vacancies=vacs)

        vacancy = {"employer": {"id": 42}, "experience": {"id": "noExperience"}}
        result = build_ai_context(vacancy, "r1", storage)

        self.assertIn("ранее отклонил 2 из 3", result)
        self.assertIn("уникальные навыки", result)

    def test_no_employer_in_vacancy(self):
        from hh_applicant_tool.ai.context import build_ai_context

        negs = [_neg(id=1, state="discard", employer_id=42)]
        vacs = [_vac(id=100)]
        storage = _make_storage(negotiations=negs, vacancies=vacs)

        vacancy = {"employer": None, "experience": {"id": "noExperience"}}
        result = build_ai_context(vacancy, "r1", storage)

        # No employer hint should appear
        self.assertNotIn("отклонил", result)


class TestExperienceConversion(unittest.TestCase):
    """Returns experience hint when conversion is low."""

    def test_low_conversion_hint(self):
        from hh_applicant_tool.ai.context import build_ai_context

        # 6 negotiations with experience "between1And3", 0 invites => 0% conversion
        negs = [
            _neg(id=i, state="discard", vacancy_id=100 + i, employer_id=i + 10)
            for i in range(6)
        ]
        vacs = [_vac(id=100 + i, experience="between1And3") for i in range(6)]
        storage = _make_storage(negotiations=negs, vacancies=vacs)

        vacancy = {"employer": {"id": 999}, "experience": {"id": "between1And3"}}
        result = build_ai_context(vacancy, "r1", storage)

        self.assertIn("Конверсия", result)
        self.assertIn("0.0%", result)

    def test_high_conversion_no_hint(self):
        from hh_applicant_tool.ai.context import build_ai_context

        # 5 negotiations, 3 invites => 60% conversion — no low-conversion hint
        negs = [
            _neg(id=1, state="interview", vacancy_id=101, employer_id=11),
            _neg(id=2, state="interview", vacancy_id=102, employer_id=12),
            _neg(id=3, state="invitation_accepted", vacancy_id=103, employer_id=13),
            _neg(id=4, state="discard", vacancy_id=104, employer_id=14),
            _neg(id=5, state="response", vacancy_id=105, employer_id=15),
        ]
        vacs = [_vac(id=101 + i, experience="between1And3") for i in range(5)]
        storage = _make_storage(negotiations=negs, vacancies=vacs)

        vacancy = {"employer": {"id": 999}, "experience": {"id": "between1And3"}}
        result = build_ai_context(vacancy, "r1", storage)

        # Low conversion hint should NOT appear (60% > 10%)
        self.assertNotIn("Конверсия", result)

    def test_too_few_negotiations_no_hint(self):
        from hh_applicant_tool.ai.context import build_ai_context

        # Only 3 negotiations — below threshold of 5
        negs = [
            _neg(id=i, state="discard", vacancy_id=100 + i, employer_id=i + 10)
            for i in range(3)
        ]
        vacs = [_vac(id=100 + i, experience="between1And3") for i in range(3)]
        storage = _make_storage(negotiations=negs, vacancies=vacs)

        vacancy = {"employer": {"id": 999}, "experience": {"id": "between1And3"}}
        result = build_ai_context(vacancy, "r1", storage)

        self.assertNotIn("Конверсия", result)


class TestSalaryBucket(unittest.TestCase):
    """Test the internal _salary_bucket helper."""

    def test_buckets(self):
        from hh_applicant_tool.ai.context import _salary_bucket

        self.assertEqual(_salary_bucket(None), "unknown")
        self.assertEqual(_salary_bucket(0), "unknown")
        self.assertEqual(_salary_bucket(30_000), "<50k")
        self.assertEqual(_salary_bucket(75_000), "50-100k")
        self.assertEqual(_salary_bucket(150_000), "100-200k")
        self.assertEqual(_salary_bucket(250_000), "200-300k")
        self.assertEqual(_salary_bucket(500_000), "300k+")


if __name__ == "__main__":
    unittest.main()
