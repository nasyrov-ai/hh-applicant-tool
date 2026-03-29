"""Load worker configuration from Supabase worker_config table."""

from __future__ import annotations

import logging
from typing import Any

logger = logging.getLogger(__name__)


class WorkerConfigLoader:
    """Loads config from Supabase worker_config table, falls back to local config."""

    def __init__(self, supabase_client: Any):
        self.client = supabase_client
        self._cache: dict[str, Any] = {}

    def load(self) -> dict[str, Any]:
        """Load all config from worker_config table."""
        try:
            result = self.client.table("worker_config").select("*").execute()
            self._cache = {row["key"]: row["value"] for row in result.data}
            logger.debug("Loaded %d config entries from Supabase", len(self._cache))
        except Exception as ex:
            logger.warning("Failed to load worker config from Supabase: %s", ex)

        return self._cache

    def get(self, key: str, default: Any = None) -> Any:
        return self._cache.get(key, default)

    def build_argv(self, command: str, args: dict) -> list[str]:
        """Build CLI argv from command name and args dict.

        Args dict maps CLI flag names (without --) to values.
        Boolean True → flag present, False → omitted.
        Lists → repeated flags.
        """
        argv = [command]

        # Merge with stored config defaults for this command
        defaults = self.get(f"defaults.{command}", {})
        merged = {**defaults, **args}

        # Remove internal keys
        merged = {k: v for k, v in merged.items() if not k.startswith("_")}

        for key, value in merged.items():
            flag = f"--{key.replace('_', '-')}"

            if isinstance(value, bool):
                if value:
                    argv.append(flag)
            elif isinstance(value, list):
                for item in value:
                    argv.extend([flag, str(item)])
            elif value is not None:
                argv.extend([flag, str(value)])

        return argv
