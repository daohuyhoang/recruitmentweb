"""Từ điển kỹ năng dùng chung trong tiến trình, nạp lại khi admin sửa kỹ năng/từ đồng nghĩa."""

import threading

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.matching.skills import SkillDictionary
from app.models import Skill, SkillAlias

_lock = threading.Lock()
_cache: SkillDictionary | None = None


def get_dictionary(db: Session) -> SkillDictionary:
    global _cache
    with _lock:
        if _cache is None:
            skills = db.execute(select(Skill.id, Skill.name).where(Skill.is_active)).all()
            aliases = db.execute(select(SkillAlias.skill_id, SkillAlias.alias).join(Skill).where(Skill.is_active)).all()
            _cache = SkillDictionary.build([tuple(r) for r in skills], [tuple(r) for r in aliases])
        return _cache


def invalidate() -> None:
    global _cache
    with _lock:
        _cache = None
