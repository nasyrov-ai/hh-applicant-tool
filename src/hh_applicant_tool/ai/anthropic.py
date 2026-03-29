import json
import logging
import shutil
import subprocess
from dataclasses import KW_ONLY, dataclass

from .base import AIError

logger = logging.getLogger(__package__)


class ClaudeCliError(AIError):
    pass


@dataclass
class ChatClaudeCli:
    """AI-чат через Claude Code CLI (подписка Claude Code Max, без API ключа)."""

    _: KW_ONLY
    system_prompt: str | None = None
    timeout: float = 60.0
    model: str = "claude-opus-4-6"

    def send_message(self, message: str) -> str:
        claude_bin = shutil.which("claude") or "claude"
        cmd = [
            claude_bin,
            "--print",
            "--model", self.model,
        ]

        if self.system_prompt:
            cmd.extend(["--system-prompt", self.system_prompt])

        full_message = message

        try:
            result = subprocess.run(
                cmd,
                input=full_message,
                capture_output=True,
                text=True,
                timeout=self.timeout,
            )

            if result.returncode != 0:
                stderr = result.stderr.strip()
                raise ClaudeCliError(
                    f"claude CLI exited with code {result.returncode}: {stderr}"
                )

            output = result.stdout.strip()
            if not output:
                raise ClaudeCliError("Empty response from claude CLI")

            return output

        except FileNotFoundError:
            raise ClaudeCliError(
                "claude CLI not found. Install: npm install -g @anthropic-ai/claude-code"
            )
        except subprocess.TimeoutExpired:
            raise ClaudeCliError(
                f"claude CLI timed out after {self.timeout}s"
            )
