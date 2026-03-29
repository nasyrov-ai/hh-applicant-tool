from __future__ import annotations

import argparse
import logging
from typing import TYPE_CHECKING

from ..main import BaseNamespace, BaseOperation

if TYPE_CHECKING:
    from ..main import HHApplicantTool


logger = logging.getLogger(__package__)


class Namespace(BaseNamespace):
    pass


class Operation(BaseOperation):
    """Обновляет access_token и refresh_token в случае необходимости."""

    __aliases__ = ["refresh"]

    def setup_parser(self, parser: argparse.ArgumentParser) -> None:
        pass

    def run(self, tool: HHApplicantTool) -> None:
        if tool.api_client.is_access_expired:
            tool.api_client.refresh_access_token()
            if not tool.save_token():
                logger.warning("Токен не был обновлен!")
                return 1
            logger.info("Токен успешно обновлен.")
        else:
            logger.info("Токен не истек, обновление не требуется.")
