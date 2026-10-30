"""Nhận diện kỹ năng trong văn bản bằng từ điển kỹ năng + từ đồng nghĩa."""

import re
from dataclasses import dataclass, field

from app.matching.text import normalize

# Ký tự được coi là một phần của từ khi xét ranh giới (để "c#" không khớp trong "c#x", "node" không khớp "nodes")
_WORD_CHARS = r"\w#+"


@dataclass
class SkillDictionary:
    """terms: cụm từ viết thường -> skill_id. Cụm từ ngắn (≤ 2 ký tự) như "js", "go"
    dễ khớp nhầm nên chỉ khớp khi viết đúng hoa/thường như tên chuẩn hoặc viết hoa toàn bộ."""

    terms: dict[str, int]
    names: dict[int, str]
    _pattern: re.Pattern[str] | None = field(default=None, init=False, repr=False)
    _short: dict[str, int] = field(default_factory=dict, init=False, repr=False)

    @classmethod
    def build(cls, skills: list[tuple[int, str]], aliases: list[tuple[int, str]]) -> "SkillDictionary":
        terms: dict[str, int] = {}
        for skill_id, name in skills:
            terms[normalize(name)] = skill_id
        for skill_id, alias in aliases:
            terms[normalize(alias)] = skill_id
        return cls(terms=terms, names=dict(skills))

    def __post_init__(self) -> None:
        long_terms = [t for t in self.terms if len(t) > 2]
        # Cụm dài trước để "react native" thắng "react"
        long_terms.sort(key=len, reverse=True)
        if long_terms:
            body = "|".join(re.escape(t) for t in long_terms)
            self._pattern = re.compile(rf"(?<![{_WORD_CHARS}])(?:{body})(?![{_WORD_CHARS}])")
        for term, skill_id in self.terms.items():
            if len(term) <= 2:
                canonical = self.names.get(skill_id, "")
                variants = {term.upper()}
                if normalize(canonical) == term:
                    variants.add(canonical)
                for v in variants:
                    self._short[v] = skill_id

    def extract(self, text: str) -> set[int]:
        found: set[int] = set()
        if not text:
            return found
        lowered = normalize(text)
        if self._pattern is not None:
            for m in self._pattern.finditer(lowered):
                found.add(self.terms[m.group(0)])
        for variant, skill_id in self._short.items():
            if re.search(rf"(?<![{_WORD_CHARS}]){re.escape(variant)}(?![{_WORD_CHARS}])", text):
                found.add(skill_id)
        return found

    def resolve(self, name: str) -> int | None:
        """Tìm skill_id cho một tên kỹ năng người dùng nhập (tên chuẩn hoặc từ đồng nghĩa)."""
        return self.terms.get(normalize(name))
