from __future__ import annotations

import argparse
import datetime as dt
import logging
from typing import TYPE_CHECKING

import requests

from ..api.client import HH_BASE_URL
from ..api.errors import ApiError
from ..main import BaseNamespace, BaseOperation
from ..utils.date import parse_api_datetime

if TYPE_CHECKING:
    from ..main import HHApplicantTool

try:
    from hh_applicant_tool.worker import is_cancelled
except ImportError:
    def is_cancelled() -> bool:
        return False

logger = logging.getLogger(__package__)


class Namespace(BaseNamespace):
    cleanup: bool
    blacklist_discard: bool
    older_than: int
    dry_run: bool
    delete_chat: bool
    block_ats: bool


class Operation(BaseOperation):
    """Удалить отказы и/или старые отклики. Опционально так же удаляет чаты и блокирует работодателей. Из-за особенностей API эту команду иногда нужно вызывать больше одного раза."""

    __aliases__ = ["clear-negotiations", "delete-negotiations"]

    def setup_parser(self, parser: argparse.ArgumentParser) -> None:
        parser.add_argument(
            "-b",
            "--blacklist-discard",
            "--blacklist",
            action=argparse.BooleanOptionalAction,
            help="Блокировать работодателя за отказ",
        )
        parser.add_argument(
            "-o",
            "--older-than",
            type=int,
            help="Удаляет любые отклики старше N дней",
        )
        parser.add_argument(
            "-d",
            "--delete-chat",
            action="store_true",
            help="Удалить так же чат",
        )
        parser.add_argument(
            "--block-ats", action="store_true", help="Блокировать ATS"
        )
        parser.add_argument(
            "-n",
            "--dry-run",
            action="store_true",
            help="Тестовый запуск без реального удаления",
        )

    def run(self, tool: HHApplicantTool) -> None:
        self.tool = tool
        self.args = tool.args
        self.clear()

    def delete_chat(self, topic: int | str) -> bool:
        """Чат можно удалить только через веб-версию"""
        headers = {
            "X-Hhtmfrom": "main",
            "X-Hhtmsource": "negotiation_list",
            "X-Requested-With": "XMLHttpRequest",
            "X-Xsrftoken": self.tool.xsrf_token,
            "Referer": f"{HH_BASE_URL}/applicant/negotiations?hhtmFrom=main&hhtmFromLabel=header",
        }

        payload = {
            "topic": topic,
            "query": "?hhtmFrom=main&hhtmFromLabel=header",
            "substate": "HIDE",
        }

        try:
            r = self.tool.session.post(
                f"{HH_BASE_URL}/applicant/negotiations/trash",
                payload,
                headers=headers,
            )
            r.raise_for_status()
            return True
        except requests.RequestException as ex:
            logger.error(ex)
            return False

    def clear(self) -> None:
        blacklisted = self.tool.get_blacklisted()
        from itertools import chain
        all_negotiations = chain(
            self.tool.get_negotiations("active"),
            self.tool.get_negotiations("archived"),
        )
        for negotiation in all_negotiations:
            if is_cancelled():
                logger.info("Операция отменена пользователем")
                break
            vacancy = negotiation.get("vacancy")
            if not vacancy:
                continue

            # Если работодателя блокируют, то он превращается в null
            # ХХ позволяет скрывать компанию, когда id нет, а вместо имени "Крупная российская компания"
            # sqlite3.IntegrityError: NOT NULL constraint failed: negotiations.employer_id
            # try:
            #     storage.negotiations.save(negotiation)
            # except RepositoryError as e:
            #     logger.exception(e)

            # print(negotiation)
            # raise RuntimeError()

            if self.args.older_than:
                updated_at = parse_api_datetime(negotiation["updated_at"])
                # А хз какую временную зону сайт возвращает
                days_passed = (
                    dt.datetime.now(updated_at.tzinfo) - updated_at
                ).days
                logger.debug(f"{days_passed = }")
                if days_passed <= self.args.older_than:
                    continue
            elif negotiation["state"]["id"] != "discard":
                continue

            try:
                logger.debug(
                    "Пробуем отменить отклик на %s", vacancy["alternate_url"]
                )

                if not self.args.dry_run:
                    self.tool.api_client.delete(
                        f"/negotiations/active/{negotiation['id']}",
                    )

                    logger.info(
                        "Отменили отклик на вакансию: %s %s",
                        vacancy["alternate_url"],
                        vacancy["name"],
                    )

                if self.args.delete_chat:
                    logger.debug(
                        "Пробуем удалить чат с откликом на вакансию %s",
                        vacancy["alternate_url"],
                    )

                    if not self.args.dry_run:
                        if self.delete_chat(negotiation["id"]):
                            logger.info("Удалили чат #%s", negotiation["id"])

                try:
                    d = parse_api_datetime(
                        negotiation["updated_at"]
                    ) - parse_api_datetime(negotiation["created_at"])
                    ats_seconds = d.total_seconds()
                except (ValueError, TypeError, KeyError):
                    ats_seconds = -1

                logger.debug("Ответ на отклик пришел через %d сек.", ats_seconds)

                ats_detected = 0 <= ats_seconds <= 16 * 60

                if ats_detected:
                    employer_info = vacancy.get("employer") or {}
                    logger.info(
                        "Признаки использования ATS компанией: %s (%s)",
                        employer_info.get("name", "—"),
                        employer_info.get("alternate_url", "—"),
                    )

                employer = vacancy.get("employer", {})
                employer_id = employer.get("id")

                if (
                    (
                        self.args.blacklist_discard
                        or (self.args.block_ats and ats_detected)
                    )
                    and employer
                    and employer_id
                    and employer_id not in blacklisted
                ):
                    logger.debug(
                        "Пробуем заблокировать работодателя %s %s",
                        employer.get("alternate_url", "—"),
                        employer.get("name", "—"),
                    )

                    if not self.args.dry_run:
                        self.tool.api_client.put(
                            f"/employers/blacklisted/{employer_id}"
                        )
                        blacklisted.add(employer_id)

                        logger.info(
                            "Работодатель заблокирован: %s %s",
                            employer.get("alternate_url", "—"),
                            employer.get("name", "—"),
                        )
            except ApiError as err:
                logger.error(err)

        logger.info("Удаление откликов завершено.")
