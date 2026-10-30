"""Bộ máy so khớp CV–job: chuẩn bị dữ liệu, gọi 3 thuật toán, tính điểm tổng hợp, lưu cache match_results."""

import logging
import threading
from dataclasses import dataclass, field
from datetime import date

from sqlalchemy import select
from sqlalchemy.dialects.mysql import insert as mysql_insert
from sqlalchemy.orm import Session, selectinload

from app.matching import semantic
from app.matching.algorithms import (
    CandidateFacts,
    JobFacts,
    RequiredSkill,
    cosine,
    criteria_breakdown,
    hybrid_score,
    skill_coverage,
    tfidf_similarity,
)
from app.matching.text import cv_content_to_text, job_to_text, segment
from app.models import CandidateProfile, Cv, CvSkill, CvVector, Job, JobSkill, JobVector, MatchResult
from app.services.app_config import get_setting
from app.services.skill_dictionary import get_dictionary

log = logging.getLogger(__name__)
_vector_lock = threading.RLock()


@dataclass
class MatchOutcome:
    job: Job
    score: float
    coverage: float
    tfidf: float
    semantic: float | None
    criteria: float
    criteria_detail: dict[str, float]
    matched: list[int]
    missing: list[int]
    weights: dict[str, float] = field(default_factory=dict)


# ---------------------------------------------------------------- chuẩn bị dữ liệu


def cv_text(cv: Cv) -> str:
    """CV tạo bằng form dùng nội dung có cấu trúc; CV tải lên mà chưa đọc được cấu trúc thì dùng văn bản thô."""
    text = cv_content_to_text(cv.content)
    if cv.source == "upload" and cv.raw_text and len(text) < 200:
        text = f"{text}\n{cv.raw_text}"
    return text


def refresh_cv_skills(db: Session, cv: Cv) -> None:
    """Đọc lại kỹ năng từ nội dung CV. Kỹ năng ứng viên tự thêm (manual) được giữ nguyên."""
    dictionary = get_dictionary(db)
    found = dictionary.extract(cv_text(cv))
    for name in (cv.content or {}).get("skills") or []:
        skill_id = dictionary.resolve(name)
        if skill_id:
            found.add(skill_id)
    manual = {s.skill_id for s in cv.skills if s.source == "manual"}
    cv.skills = [s for s in cv.skills if s.source == "manual"] + [
        CvSkill(skill_id=sid, source="parsed") for sid in sorted(found - manual)
    ]
    cv.vector = None  # nội dung đổi thì tính lại vector


def invalidate_job(job: Job) -> None:
    job.vector = None


def _embedding_model(db: Session) -> str:
    return str(get_setting(db, "embedding_model"))


def ensure_job_vectors(db: Session, jobs: list[Job]) -> None:
    # Khóa để luồng tính sẵn lúc khởi động và request đầu tiên không cùng ghi một dòng
    with _vector_lock:
        _ensure_job_vectors(db, jobs)


def _ensure_job_vectors(db: Session, jobs: list[Job]) -> None:
    model_name = _embedding_model(db)
    missing_text = [j for j in jobs if j.vector is None]
    if missing_text:
        # Luồng khác có thể vừa ghi xong: đọc lại từ database trước khi tạo mới
        stored = set(db.scalars(select(JobVector.job_id).where(JobVector.job_id.in_([j.id for j in missing_text]))))
        for job in missing_text:
            if job.id in stored:
                db.refresh(job, ["vector"])
        missing_text = [j for j in missing_text if j.vector is None]
    for job in missing_text:
        text = job_to_text(job.title, job.description, job.requirements, [s.skill.name for s in job.skills])
        job.vector = JobVector(job_id=job.id, segmented_text=segment(text))
    need_embedding = [j for j in jobs if j.vector and j.vector.embedding is None and semantic.is_available()]
    if need_embedding:
        texts = [job_to_text(j.title, j.description, j.requirements, [s.skill.name for s in j.skills]) for j in need_embedding]
        vectors = semantic.embed(texts, model_name)
        if vectors:
            for job, vec in zip(need_embedding, vectors, strict=True):
                job.vector.embedding = vec
                job.vector.embedding_model = model_name
    if missing_text or need_embedding:
        db.commit()


def ensure_cv_vector(db: Session, cv: Cv) -> CvVector:
    with _vector_lock:
        return _ensure_cv_vector(db, cv)


def _ensure_cv_vector(db: Session, cv: Cv) -> CvVector:
    model_name = _embedding_model(db)
    if cv.vector is None and db.get(CvVector, cv.id) is not None:
        db.refresh(cv, ["vector"])
    if cv.vector is None:
        cv.vector = CvVector(cv_id=cv.id, segmented_text=segment(cv_text(cv)))
        db.commit()
    if cv.vector.embedding is None and semantic.is_available():
        vectors = semantic.embed([cv_text(cv)], model_name)
        if vectors:
            cv.vector.embedding = vectors[0]
            cv.vector.embedding_model = model_name
            db.commit()
    return cv.vector


def candidate_facts(db: Session, user_id: int) -> CandidateFacts:
    p = db.get(CandidateProfile, user_id)
    if p is None:
        return CandidateFacts()
    return CandidateFacts(
        years_of_experience=float(p.years_of_experience) if p.years_of_experience is not None else None,
        education_level=p.education_level,
        city_id=p.city_id,
        desired_salary_min=float(p.desired_salary_min) if p.desired_salary_min else None,
    )


def job_facts(job: Job) -> JobFacts:
    return JobFacts(
        experience_min_years=float(job.experience_min_years or 0),
        experience_max_years=float(job.experience_max_years) if job.experience_max_years is not None else None,
        education_level=job.education_level,
        city_id=job.city_id,
        work_mode=job.work_mode,
        salary_max=float(job.salary_max) if job.salary_max is not None else None,
    )


def open_jobs_query():
    return (
        select(Job)
        .where(Job.status == "approved", Job.deadline >= date.today())
        .options(
            selectinload(Job.skills).joinedload(JobSkill.skill),
            selectinload(Job.vector),
            selectinload(Job.company),
            selectinload(Job.city),
        )
    )


# ---------------------------------------------------------------- tính điểm


def compute_matches(db: Session, cv: Cv, jobs: list[Job], corpus: list[Job] | None = None) -> list[MatchOutcome]:
    """Tính điểm CV với danh sách job. corpus: tập job để học IDF (mặc định chính là jobs)."""
    if not jobs:
        return []
    corpus = corpus or jobs
    ensure_job_vectors(db, list({j.id: j for j in [*corpus, *jobs]}.values()))
    cv_vec = ensure_cv_vector(db, cv)

    weights = {k: float(v) for k, v in get_setting(db, "match_weights").items()}
    skill_weights = get_setting(db, "skill_weights")
    cv_skill_ids = {s.skill_id for s in cv.skills}
    facts = candidate_facts(db, cv.candidate_id)

    corpus_ids = [j.id for j in corpus]
    extra = [j for j in jobs if j.id not in set(corpus_ids)]
    docs = [j.vector.segmented_text for j in [*corpus, *extra]]
    tfidf_by_job = dict(zip([*corpus_ids, *(j.id for j in extra)], tfidf_similarity(cv_vec.segmented_text, docs), strict=True))

    outcomes: list[MatchOutcome] = []
    for job in jobs:
        cov = skill_coverage(
            [RequiredSkill(s.skill_id, s.is_required) for s in job.skills],
            cv_skill_ids,
            required_weight=float(skill_weights["required"]),
            preferred_weight=float(skill_weights["preferred"]),
        )
        sem = cosine(cv_vec.embedding, job.vector.embedding if job.vector else None)
        detail = criteria_breakdown(facts, job_facts(job))
        crit = sum(detail.values()) / len(detail)
        components = {"coverage": cov.score, "tfidf": tfidf_by_job[job.id], "semantic": sem, "criteria": crit}
        outcomes.append(
            MatchOutcome(
                job=job,
                score=round(hybrid_score(components, weights), 2),
                coverage=cov.score,
                tfidf=tfidf_by_job[job.id],
                semantic=sem,
                criteria=crit,
                criteria_detail=detail,
                matched=cov.matched,
                missing=cov.missing,
                weights=weights,
            )
        )
    _save_cache(db, cv.id, outcomes)
    return outcomes


def _save_cache(db: Session, cv_id: int, outcomes: list[MatchOutcome]) -> None:
    rows = [
        {
            "cv_id": cv_id,
            "job_id": o.job.id,
            "total_score": o.score,
            "coverage_score": round(o.coverage, 4),
            "tfidf_score": round(o.tfidf, 4),
            "semantic_score": round(o.semantic, 4) if o.semantic is not None else None,
            "criteria_score": round(o.criteria, 4),
            "matched_skills": o.matched,
            "missing_skills": o.missing,
        }
        for o in outcomes
    ]
    stmt = mysql_insert(MatchResult).values(rows)
    stmt = stmt.on_duplicate_key_update({c: stmt.inserted[c] for c in rows[0] if c not in ("cv_id", "job_id")})
    db.execute(stmt)
    db.commit()


def top_matches(db: Session, cv: Cv, jobs: list[Job], limit: int) -> list[MatchOutcome]:
    outcomes = compute_matches(db, cv, jobs)
    outcomes.sort(key=lambda o: o.score, reverse=True)
    return outcomes[:limit]


def match_one(db: Session, cv: Cv, job: Job) -> MatchOutcome:
    corpus = list(db.scalars(open_jobs_query()).unique())
    return compute_matches(db, cv, [job], corpus=corpus)[0]
