"""Đọc cấu hình trong bảng app_settings, có giá trị mặc định khi bảng thiếu khóa."""

from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import AppSetting

DEFAULTS: dict[str, Any] = {
    "match_weights": {"coverage": 0.4, "tfidf": 0.2, "semantic": 0.3, "criteria": 0.1},
    "skill_weights": {"required": 2, "preferred": 1},
    "embedding_model": "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2",
    "top_k": 10,
    "cv_rules": {
        "required_sections": ["personal", "objective", "experiences", "educations", "skills"],
        "min_experience_words": 20,
        "cliches": ["chăm chỉ", "ham học hỏi", "nhiệt tình", "năng động", "chịu được áp lực"],
    },
}


def get_setting(db: Session, key: str) -> Any:
    row = db.get(AppSetting, key)
    return row.setting_value if row else DEFAULTS[key]


def get_all_settings(db: Session) -> dict[str, Any]:
    stored = {r.setting_key: r.setting_value for r in db.scalars(select(AppSetting))}
    return {**DEFAULTS, **stored}
