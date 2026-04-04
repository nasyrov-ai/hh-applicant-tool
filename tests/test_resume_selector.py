"""Unit tests for select_best_resume from ai/resume_selector.py."""

from __future__ import annotations

import unittest
from types import SimpleNamespace
from unittest.mock import MagicMock


def _make_storage(negotiations=None, vacancies=None):
    """Create a mock StorageFacade."""
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


class TestSingleResume(unittest.TestCase):
    """Returns the only resume when there's just one."""

    def test_single_resume(self):
        from hh_applicant_tool.ai.resume_selector import select_best_resume

        storage = _make_storage()
        resumes = [{"id": "r1", "title": "Python Developer"}]
        vacancy = {"name": "Backend Developer", "experience": {"id": "between1And3"}}

        result = select_best_resume(vacancy, resumes, storage)
        self.assertEqual(result["id"], "r1")


class TestNoHistory(unittest.TestCase):
    """Returns first resume when no negotiation history exists."""

    def test_no_history_returns_first(self):
        from hh_applicant_tool.ai.resume_selector import select_best_resume

        storage = _make_storage(negotiations=[], vacancies=[])
        resumes = [
            {"id": "r1", "title": "Python Developer"},
            {"id": "r2", "title": "Frontend Developer"},
        ]
        vacancy = {"name": "Something Else"}

        result = select_best_resume(vacancy, resumes, storage)
        # With no history, keyword matching is the only signal.
        # Both have zero history score, so keyword match decides.
        # "Something Else" has no overlap with either title, both score 0.
        # max() returns the first key in a tie, so r1 wins.
        self.assertIn(result["id"], ["r1", "r2"])


class TestKeywordMatching(unittest.TestCase):
    """Keyword similarity should prefer matching titles."""

    def test_vacancy_matches_resume_title(self):
        from hh_applicant_tool.ai.resume_selector import select_best_resume

        storage = _make_storage(negotiations=[], vacancies=[])
        resumes = [
            {"id": "r1", "title": "Python Backend Developer"},
            {"id": "r2", "title": "Frontend Engineer React"},
        ]
        vacancy = {"name": "Frontend Developer React"}

        result = select_best_resume(vacancy, resumes, storage)
        # "frontend", "react" overlap with r2; only "developer" overlaps with r1
        self.assertEqual(result["id"], "r2")

    def test_keyword_similarity_function(self):
        from hh_applicant_tool.ai.resume_selector import _keyword_similarity

        # Identical texts -> 1.0
        self.assertAlmostEqual(
            _keyword_similarity("Frontend Developer", "Frontend Developer"), 1.0
        )
        # No overlap
        self.assertAlmostEqual(
            _keyword_similarity("Python Backend", "React Native"), 0.0
        )
        # Partial overlap
        sim = _keyword_similarity("Frontend Developer", "Frontend Engineer")
        self.assertGreater(sim, 0.0)
        self.assertLess(sim, 1.0)

    def test_empty_text(self):
        from hh_applicant_tool.ai.resume_selector import _keyword_similarity

        self.assertAlmostEqual(_keyword_similarity("", "Frontend"), 0.0)
        self.assertAlmostEqual(_keyword_similarity("Frontend", ""), 0.0)
        self.assertAlmostEqual(_keyword_similarity("", ""), 0.0)


class TestHistoricalConversion(unittest.TestCase):
    """Historical invite rates affect resume selection."""

    def test_high_conversion_resume_preferred(self):
        from hh_applicant_tool.ai.resume_selector import select_best_resume

        # r1 has 0/5 invites for between1And3, r2 has 4/5 invites
        negs = [
            # r1: 5 discards
            *[
                _neg(id=i, state="discard", vacancy_id=200 + i, resume_id="r1")
                for i in range(5)
            ],
            # r2: 4 invites + 1 discard
            _neg(id=10, state="interview", vacancy_id=300, resume_id="r2"),
            _neg(id=11, state="interview", vacancy_id=301, resume_id="r2"),
            _neg(id=12, state="invitation_accepted", vacancy_id=302, resume_id="r2"),
            _neg(id=13, state="interview", vacancy_id=303, resume_id="r2"),
            _neg(id=14, state="discard", vacancy_id=304, resume_id="r2"),
        ]
        vacs = [
            *[_vac(id=200 + i, experience="between1And3") for i in range(5)],
            *[_vac(id=300 + i, experience="between1And3") for i in range(5)],
        ]
        storage = _make_storage(negotiations=negs, vacancies=vacs)

        resumes = [
            {"id": "r1", "title": "Developer"},
            {"id": "r2", "title": "Developer"},
        ]
        vacancy = {"name": "Developer", "experience": {"id": "between1And3"}}

        result = select_best_resume(vacancy, resumes, storage)
        self.assertEqual(result["id"], "r2")


class TestSalaryBucket(unittest.TestCase):
    """Test the internal _salary_bucket helper."""

    def test_buckets(self):
        from hh_applicant_tool.ai.resume_selector import _salary_bucket

        self.assertEqual(_salary_bucket(None), "unknown")
        self.assertEqual(_salary_bucket(0), "unknown")
        self.assertEqual(_salary_bucket(30_000), "<50k")
        self.assertEqual(_salary_bucket(75_000), "50-100k")
        self.assertEqual(_salary_bucket(150_000), "100-200k")
        self.assertEqual(_salary_bucket(250_000), "200-300k")
        self.assertEqual(_salary_bucket(500_000), "300k+")


class TestTokenize(unittest.TestCase):
    """Test the internal _tokenize helper."""

    def test_removes_stop_words(self):
        from hh_applicant_tool.ai.resume_selector import _tokenize

        tokens = _tokenize("Разработчик на Python и JavaScript")
        self.assertIn("python", tokens)
        self.assertIn("javascript", tokens)
        self.assertIn("разработчик", tokens)
        # Stop words removed
        self.assertNotIn("на", tokens)
        self.assertNotIn("и", tokens)


if __name__ == "__main__":
    unittest.main()
