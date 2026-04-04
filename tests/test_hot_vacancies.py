"""Unit tests for helper functions in operations/hot_vacancies.py."""

from __future__ import annotations

import unittest


class TestFormatSalary(unittest.TestCase):
    """Test _format_salary helper."""

    def test_no_salary(self):
        from hh_applicant_tool.operations.hot_vacancies import _format_salary

        self.assertEqual(_format_salary(None, None, None), "")
        self.assertEqual(_format_salary(0, 0, None), "")

    def test_range(self):
        from hh_applicant_tool.operations.hot_vacancies import _format_salary

        result = _format_salary(100_000, 200_000, "RUR")
        self.assertIn("100", result)
        self.assertIn("200", result)
        self.assertIn("₽", result)
        self.assertIn("–", result)

    def test_from_only(self):
        from hh_applicant_tool.operations.hot_vacancies import _format_salary

        result = _format_salary(100_000, None, "RUR")
        self.assertTrue(result.startswith("от"))
        self.assertIn("₽", result)

    def test_to_only(self):
        from hh_applicant_tool.operations.hot_vacancies import _format_salary

        result = _format_salary(None, 200_000, "RUR")
        self.assertTrue(result.startswith("до"))
        self.assertIn("₽", result)

    def test_usd_symbol(self):
        from hh_applicant_tool.operations.hot_vacancies import _format_salary

        result = _format_salary(5_000, None, "USD")
        self.assertIn("$", result)

    def test_eur_symbol(self):
        from hh_applicant_tool.operations.hot_vacancies import _format_salary

        result = _format_salary(5_000, None, "EUR")
        self.assertIn("€", result)

    def test_unknown_currency(self):
        from hh_applicant_tool.operations.hot_vacancies import _format_salary

        result = _format_salary(5_000, None, "GBP")
        self.assertIn("GBP", result)

    def test_default_currency(self):
        from hh_applicant_tool.operations.hot_vacancies import _format_salary

        result = _format_salary(100_000, None, None)
        self.assertIn("₽", result)

    def test_space_separator(self):
        from hh_applicant_tool.operations.hot_vacancies import _format_salary

        result = _format_salary(1_000_000, None, "RUR")
        # Commas replaced with spaces
        self.assertNotIn(",", result)
        self.assertIn(" ", result)


class TestEscape(unittest.TestCase):
    """Test _escape HTML escaping helper."""

    def test_plain_text(self):
        from hh_applicant_tool.operations.hot_vacancies import _escape

        self.assertEqual(_escape("Hello World"), "Hello World")

    def test_ampersand(self):
        from hh_applicant_tool.operations.hot_vacancies import _escape

        self.assertEqual(_escape("A & B"), "A &amp; B")

    def test_angle_brackets(self):
        from hh_applicant_tool.operations.hot_vacancies import _escape

        self.assertEqual(_escape("<script>alert(1)</script>"), "&lt;script&gt;alert(1)&lt;/script&gt;")

    def test_mixed(self):
        from hh_applicant_tool.operations.hot_vacancies import _escape

        self.assertEqual(_escape("a < b & c > d"), "a &lt; b &amp; c &gt; d")


if __name__ == "__main__":
    unittest.main()
