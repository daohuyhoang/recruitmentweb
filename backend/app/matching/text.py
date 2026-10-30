"""Chuẩn hóa và tách từ tiếng Việt cho TF-IDF."""

import re
import unicodedata
from functools import lru_cache
from typing import Any

_SPACES = re.compile(r"\s+")
_NON_WORD = re.compile(r"[^\w#+./ ]+")


def normalize(text: str) -> str:
    """Viết thường, chuẩn Unicode NFC, gộp khoảng trắng. Giữ nguyên dấu tiếng Việt."""
    text = unicodedata.normalize("NFC", text).lower()
    return _SPACES.sub(" ", text).strip()


@lru_cache(maxsize=1)
def _underthesea_tokenize():
    try:
        from underthesea import word_tokenize

        return word_tokenize
    except Exception:  # thư viện không bắt buộc
        return None


def segment(text: str) -> str:
    """Tách từ: "học máy" -> "học_máy". Không có underthesea thì giữ nguyên từng âm tiết;
    TF-IDF với n-gram (1, 2) bù lại một phần cho việc không tách từ."""
    text = normalize(_NON_WORD.sub(" ", text))
    tokenize = _underthesea_tokenize()
    if tokenize is None:
        return text
    try:
        return normalize(tokenize(text, format="text"))
    except Exception:
        return text


def segmenter_name() -> str:
    return "underthesea" if _underthesea_tokenize() else "syllable"


def cv_content_to_text(content: dict[str, Any] | None) -> str:
    """Ghép CV có cấu trúc thành một đoạn văn bản để so khớp."""
    if not content:
        return ""
    parts: list[str] = []
    personal = content.get("personal") or {}
    parts.append(personal.get("headline") or "")
    parts.append(content.get("objective") or "")
    for exp in content.get("experiences") or []:
        parts += [exp.get("position") or "", exp.get("company") or "", exp.get("description") or ""]
    for edu in content.get("educations") or []:
        parts += [edu.get("major") or "", edu.get("school") or ""]
    for prj in content.get("projects") or []:
        parts += [prj.get("name") or "", prj.get("role") or "", prj.get("description") or ""]
    for cert in content.get("certificates") or []:
        parts.append(cert.get("name") or "")
    parts.append(", ".join(content.get("skills") or []))
    parts.append(content.get("strengths") or "")
    return "\n".join(p for p in parts if p)


def job_to_text(title: str, description: str, requirements: str, skill_names: list[str]) -> str:
    return "\n".join([title, description, requirements, ", ".join(skill_names)])
