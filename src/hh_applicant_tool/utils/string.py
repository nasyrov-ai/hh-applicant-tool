from __future__ import annotations

import random
import re
from typing import Any


def shorten(s: str, limit: int = 75, ellipsis: str = "…") -> str:
    return s[:limit] + bool(s[limit:]) * ellipsis


def rand_text(s: str) -> str:
    while (
        temp := re.sub(
            r"{([^{}]+)}",
            lambda m: random.choice(
                m.group(1).split("|"),
            ),
            s,
        )
    ) != s:
        s = temp
    return s


def bool2str(v: bool) -> str:
    return str(v).lower()


# К удалению
def list2str(items: list[Any] | None) -> str:
    return ",".join(f"{v}" for v in items) if items else ""


def unescape_string(text: str) -> str:
    if not text:
        return ""
    return (
        text.replace(r"\\", "\x00")
        .replace(r"\n", "\n")
        .replace(r"\r", "\r")
        .replace(r"\t", "\t")
        .replace("\x00", "\\")
    )


def br2nl(s: str) -> str:
    return re.sub(r"<br\s*/?>", "\n", s, flags=re.I)


def strip_tags(content: str) -> str:
    content = br2nl(content)
    content = re.sub(r"<[^>]+>", "", content)
    # content = re.sub(r"\s+", " ", content)
    return content.strip()


# Паттерны бреда, который AI не должен отправлять работодателю
_GARBAGE_PATTERNS = re.compile(
    r"[А-ЯЁ][а-яё]+,?\s*(эта вакансия|эту вакансию|тебе|твоём? опыт)"
    r"|не подходит под тво[йи]"
    r"|не соответствует тво"
    r"|в твоём опыте нет"
    r"|имеет смысл (смотреть|искать|рассмотреть)"
    r"|рекомендую (тебе|обратить|рассмотреть|поискать)"
    r"|навредит репутации"
    r"|честное письмо.*невозможно"
    r"|написать честное"
    r"|не могу написать"
    r"|отказываюсь"
    r"|к сожалению.*не подходи"
    r"|вакансии типа"
    r"|лучше подойд[уёе]т"
    r"|^```"
    r"|^\*\*"
    r"|^##"
    r"|^Вот (несколько|пример|вариант|мой|возможн)"
    r"|^Конечно|^Хорошо,? я"
    r"|^(Вариант|Вариация) \d"
    r"|Отправить\?|отправить\?"
    r"|^На данный момент переписка"
    r"|мяч на стороне"
    r"|вот (вариант|текст|сообщение|ответ):"
    r"|если хотите (добавить|отправить|написать)"
    r"|могу предложить"
    r"|можете (отправить|использовать|написать)"
    r"|готовый (текст|вариант|ответ)"
    r"|\[имя\]|\[Имя\]|\[ИМЯ\]|\[name\]|\[Name\]|\[ваше.имя\]"
    r"|\[компания\]|\[Company\]|\[город\]|\[должность\]"
    r"|замени.{0,20}placeholder|замени.{0,20}перед отправкой"
    r"|⚠️|обрати внимание.*замени"
    r"|скажи мне.{0,20}(имя|его|её)"
    r"|не знаю тво(его|й|ё)",
    re.IGNORECASE | re.MULTILINE,
)

# TODO: make configurable via settings (currently hardcoded for non-programmer profile)
_FAKE_SKILLS_PATTERNS = re.compile(
    r"(опыт|владею|знаю|пишу|работаю|разрабатыва).{0,20}"
    r"(Python|Java|C\+\+|C#|Go|Rust|Ruby|PHP|Kotlin|Swift|TypeScript|JavaScript|React|Vue|Angular|Django|FastAPI|Flask|Spring|Laravel|Rails)"
    r"|(Senior|Middle|Junior).{0,10}(Developer|Разработчик|Программист)"
    r"|глубок\w+ (опыт|знани).{0,15}(программирован|разработк|кодирован)"
    r"|years?.{0,5}(of|experience).{0,10}(programming|development|coding)",
    re.IGNORECASE,
)


# Канцелярский AI-стиль — мёртвые гiveaways
_AI_STYLE_PATTERNS = re.compile(
    r"в рамках (данной|этой|вашей|моей)"
    r"|являюсь.{0,15}(специалистом|профессионалом|экспертом)"
    r"|обладаю.{0,10}(опытом|навыками|компетенциями)"
    r"|осуществлял\w*"
    r"|данная (вакансия|позиция|должность)"
    r"|считаю,?\s*что мой опыт.{0,20}(соответствует|подходит|идеально)"
    r"|готов внести (свой )?вклад"
    r"|хочу выразить (свой )?интерес"
    r"|с (большим |огромным )?(интересом|энтузиазмом) (ознакомился|прочитал|узнал)"
    r"|ваша (компания|организация) (является|представляет)"
    r"|буду рад (возможности|стать частью|присоединиться)"
    r"|позвольте (представить|предложить)"
    r"|Dear Hiring (Team|Manager)|To Whom It May Concern"
    r"|Cover Letter|Сопроводительное письмо"
    r"|I (am writing|would like) to (express|apply)"
    r"|I am (confident|excited|thrilled|eager)",
    re.IGNORECASE,
)

# Паттерны утечки AI-природы
_AI_LEAK_PATTERNS = re.compile(
    r"как (языковая модель|искусственный интеллект|AI|ИИ)"
    r"|я (не могу|не имею возможности).{0,20}(чувствовать|испытывать)"
    r"|as an? (AI|language model|assistant)"
    r"|I('m| am) (an? )?(AI|language model|chatbot)",
    re.IGNORECASE,
)


def validate_ai_message(text: str, max_len: int = 1500, min_len: int = 30) -> str | None:
    """Проверяет AI-ответ на бред. Возвращает None если сообщение ок, иначе причину."""
    if not text or not text.strip():
        return "пустой ответ"
    text = text.strip()
    if len(text) < min_len:
        return f"слишком короткий ({len(text)} символов)"
    if len(text) > max_len:
        return f"слишком длинный ({len(text)} символов)"
    if _GARBAGE_PATTERNS.search(text):
        return "содержит мета-комментарий или бред"
    if _FAKE_SKILLS_PATTERNS.search(text):
        return "врёт про знание языков программирования"
    # Placeholder'ы в квадратных скобках: [имя], [Name], [ваша компания] и т.п.
    if re.search(r"\[[А-Яа-яA-Za-z][А-Яа-яA-Za-z\s_-]{1,25}\]", text):
        return "содержит placeholder в квадратных скобках"
    # Проверка на markdown
    if text.count("**") >= 2 or text.count("##") >= 1:
        return "содержит markdown"
    if _AI_STYLE_PATTERNS.search(text):
        return "канцелярский AI-стиль"
    if _AI_LEAK_PATTERNS.search(text):
        return "утечка AI-природы"
    return None
