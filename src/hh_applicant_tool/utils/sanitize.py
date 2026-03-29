"""Санитизация текста вакансий для защиты от prompt injection."""
from __future__ import annotations

import re


# Zero-width и невидимые Unicode-символы
_INVISIBLE_CHARS = re.compile(
    r"[\u200b\u200c\u200d\u200e\u200f\u2060\u2061\u2062\u2063\u2064"
    r"\ufeff\u00ad\u034f\u061c\u180e\u2028\u2029\u202a-\u202e"
    r"\u2066-\u2069\ufff9-\ufffb]"
)

# Паттерны prompt injection в описаниях вакансий
_INJECTION_PATTERNS = re.compile(
    r"ignore.{0,20}(previous|above|prior|all).{0,20}instructions"
    r"|forget.{0,20}(previous|your|all).{0,20}(instructions|rules|prompt)"
    r"|you are now|new instructions|system prompt"
    r"|disregard.{0,20}(above|previous|prior)"
    r"|override.{0,20}(instructions|prompt|rules)"
    r"|act as|pretend.{0,10}(you|to be)"
    r"|if you are (an? )?ai|if you are (a )?language model"
    r"|start your (letter|response|reply|message|answer) with"
    r"|must (include|mention|say|write|begin|start)"
    r"|do not (apply|respond|write) (if|unless)"
    r"|AI.?applicant|automated.?application"
    r"|prove.{0,10}(you are|that you).{0,10}(human|not.{0,5}(ai|bot|robot))",
    re.IGNORECASE,
)

# Несуществующие технологии — ловушки для AI
_FAKE_TECH = re.compile(
    r"QuantumFlux|NeuralBridge|SynapticCore|HyperThread\.js"
    r"|DeepMesh|CogniFlow|BrainStack|NeuroLang",
    re.IGNORECASE,
)


def sanitize_vacancy_text(text: str) -> str:
    """Удаляет невидимые символы и HTML-комментарии из текста вакансии."""
    if not text:
        return ""
    # HTML-комментарии (могут содержать скрытые инструкции)
    text = re.sub(r"<!--.*?-->", "", text, flags=re.DOTALL)
    # Невидимые Unicode-символы
    text = _INVISIBLE_CHARS.sub("", text)
    # Множественные пробелы
    text = re.sub(r"[ \t]{3,}", "  ", text)
    return text.strip()


def detect_injection(text: str) -> str | None:
    """Проверяет текст вакансии на признаки prompt injection.
    Возвращает None если чисто, иначе описание проблемы."""
    if _INJECTION_PATTERNS.search(text):
        return "prompt injection detected"
    if _FAKE_TECH.search(text):
        return "fake technology trap detected"
    return None


def postprocess_letter(text: str) -> str:
    """Постобработка AI-письма: убирает артефакты, делает текст чище."""
    if not text:
        return ""
    text = text.strip()
    # Убираем обрамляющие кавычки
    if (text.startswith('"') and text.endswith('"')) or \
       (text.startswith('«') and text.endswith('»')):
        text = text[1:-1].strip()
    # Убираем markdown
    text = re.sub(r"\*\*(.+?)\*\*", r"\1", text)
    text = re.sub(r"__(.+?)__", r"\1", text)
    text = re.sub(r"^#+\s*", "", text, flags=re.MULTILINE)
    text = re.sub(r"^---+\s*$", "", text, flags=re.MULTILINE)
    text = re.sub(r"^- ", "", text, flags=re.MULTILINE)
    text = re.sub(r"```.*?```", "", text, flags=re.DOTALL)
    # Убираем "С уважением, [имя]" в конце — AI любит добавлять
    text = re.sub(
        r"\n*С уважением,?\s*\n?.*$", "", text, flags=re.IGNORECASE
    )
    # Убираем лишние пустые строки
    text = re.sub(r"\n{3,}", "\n\n", text)
    text = text.strip()
    # Обрезаем до ~800 символов по последнему предложению
    if len(text) > 800:
        cut = text[:800].rfind(".")
        if cut > 200:
            text = text[:cut + 1]
    return text
