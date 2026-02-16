import logging
import re

from django.conf import settings

logger = logging.getLogger(__name__)


_LEET_MAP = {
    "0": "о",
    "o": "о",
    "O": "О",
    "@": "а",
    "a": "а",
    "A": "А",
    "6": "б",
    "b": "б",
    "B": "В",
    "e": "е",
    "E": "Е",
    "3": "з",
    "k": "к",
    "K": "К",
    "m": "м",
    "M": "М",
    "h": "н",
    "H": "Н",
    "p": "р",
    "P": "Р",
    "c": "с",
    "C": "С",
    "T": "Т",
    "t": "т",
    "y": "у",
    "Y": "У",
    "x": "х",
    "X": "Х",
    "$": "с",
    "1": "і",
    "!": "і",
    "|": "і",
    "u": "у",
    "U": "У",
    "d": "д",
    "D": "Д",
}

_NOISE_CHARS = re.compile(r"[\s\-_.*+~`'\"\\/,;:!?#%^&()0-9]")


_PROFANITY_ROOTS = [
    r"[хx][уy][ейияёюйжle]",
    r"[хx][уy][ил]",
    r"[пp][иieё][зz3][дd]",
    r"[пp][иieё][дd][аaоo@eе]?[рr]",
    r"[бb6][лl][яьъ]",
    r"[еёe][бb6]",
    r"[ёе][бb6][аaуулиioо]",
    r"[сsc$][уy][кk][аa]",
    r"[сsc$][уy][чc][аоьк]",
    r"[мm][уy][дd][аоиeё]",
    r"[дd][еe][рr][ьъ][мm]",
    r"[гg][аa@][нnh][дd][оo0]н",
    r"[жj][оo0][пp][аa@у]",
    r"[зz3][аa@][лl][уy][пp]",
    r"[мm][аa@]н[дd][аa@]",
    r"[пp][аa@][дd][оo0]н[оo0]?[кk]",
    r"[шш][лl][юy][хx]",
    r"[шш][аa@][лl][аa@][вvб]",
    r"[пp][оo0][хx][уy]",
    r"[нnh][аa@][хx][уy]",
    r"[зz3][аa@][еёe][бb6]",
    r"[оo0][тt][ъь]?[еёe][бb6]",
    r"[уy][ёеe][бb6]",
    r"[вv][ыy][бb6][лl]?[яь]",
    r"[дd][рr][оo0][чc]",
    r"[мm][иie]н[еёe][тt]",
    r"[еёe][бb6][аa@]?[нnh]",
    r"[еёe][бb6][аa@][тt]",
    r"[еёe][бb6][лl]",
    r"[тt][рr][аa@][хx]",
    r"[пp][еe][рr][дd]",
]


def _build_profanity_pattern():
    extra_words = getattr(settings, "PROFANITY_EXTRA_WORDS", [])
    all_roots = list(_PROFANITY_ROOTS)

    for word in extra_words:
        all_roots.append(re.escape(word.lower()))

    combined = "|".join(f"(?:{root})" for root in all_roots)
    return re.compile(combined, re.IGNORECASE | re.UNICODE)


_profanity_re = _build_profanity_pattern()


def _normalize(text: str) -> str:
    chars = []
    for ch in text:
        chars.append(_LEET_MAP.get(ch, ch))
    normalized = "".join(chars)

    normalized = normalized.lower()

    normalized = _NOISE_CHARS.sub("", normalized)
    normalized = re.sub(r"(.)\1{2,}", r"\1", normalized)

    return normalized


def contains_profanity(text: str) -> bool:
    if not text:
        return False

    normalized = _normalize(text)
    match = _profanity_re.search(normalized)

    if match and logger.isEnabledFor(logging.DEBUG):
        logger.debug(
            "Profanity detected: matched '%s' in normalized text", match.group()
        )

    return match is not None


def censor_text(text: str) -> str:
    if not text:
        return text

    words = text.split()
    result = []
    for word in words:
        if contains_profanity(word):
            result.append("***")
        else:
            result.append(word)
    return " ".join(result)


def get_profanity_error_message() -> str:
    return getattr(
        settings,
        "PROFANITY_ERROR_MESSAGE",
        "Текст содержит недопустимые выражения. Пожалуйста, перефразируйте.",
    )
