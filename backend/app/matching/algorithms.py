"""3 thuật toán so khớp, điểm tiêu chí và điểm tổng hợp. Các hàm ở đây không đụng tới database."""

from collections.abc import Sequence
from dataclasses import dataclass

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# ---------------------------------------------------------------- Thuật toán 1: Coverage


@dataclass(frozen=True)
class RequiredSkill:
    skill_id: int
    required: bool


@dataclass(frozen=True)
class CoverageResult:
    score: float
    matched: list[int]
    missing: list[int]


def skill_coverage(
    job_skills: Sequence[RequiredSkill], cv_skills: set[int], required_weight: float = 2, preferred_weight: float = 1
) -> CoverageResult:
    """Tỷ lệ đáp ứng kỹ năng có trọng số = Σ trọng số kỹ năng khớp / Σ trọng số kỹ năng job yêu cầu."""
    if not job_skills:
        return CoverageResult(1.0, [], [])
    total = got = 0.0
    matched: list[int] = []
    missing: list[int] = []
    for s in job_skills:
        weight = required_weight if s.required else preferred_weight
        total += weight
        if s.skill_id in cv_skills:
            got += weight
            matched.append(s.skill_id)
        else:
            missing.append(s.skill_id)
    return CoverageResult(got / total, matched, missing)


def jaccard(a: set[int], b: set[int]) -> float:
    """Dùng để so sánh trong thực nghiệm: |A∩B| / |A∪B|."""
    return len(a & b) / len(a | b) if a | b else 0.0


# ---------------------------------------------------------------- Thuật toán 2: TF-IDF + cosine


def tfidf_similarity(query: str, documents: Sequence[str]) -> list[float]:
    """Cosine giữa văn bản truy vấn (CV) và từng tài liệu (job). IDF học trên chính tập job + CV."""
    if not documents:
        return []
    vectorizer = TfidfVectorizer(ngram_range=(1, 2), sublinear_tf=True, token_pattern=r"(?u)[\w#+.]{2,}")
    try:
        matrix = vectorizer.fit_transform([*documents, query])
    except ValueError:  # toàn bộ văn bản rỗng
        return [0.0] * len(documents)
    scores = cosine_similarity(matrix[-1], matrix[:-1]).ravel()
    return [float(s) for s in scores]


# ---------------------------------------------------------------- Thuật toán 3: embedding + cosine


def cosine(a: Sequence[float] | None, b: Sequence[float] | None) -> float | None:
    """Cosine giữa 2 embedding, cắt về [0, 1] (giá trị âm coi như không liên quan)."""
    if a is None or b is None:
        return None
    va, vb = np.asarray(a, dtype=np.float32), np.asarray(b, dtype=np.float32)
    denom = float(np.linalg.norm(va) * np.linalg.norm(vb))
    if denom == 0:
        return 0.0
    return max(0.0, min(1.0, float(va @ vb) / denom))


# ---------------------------------------------------------------- Điểm tiêu chí

EDUCATION_ORDER = ["none", "high_school", "college", "university", "master", "doctor"]


@dataclass(frozen=True)
class CandidateFacts:
    years_of_experience: float | None = None
    education_level: str | None = None
    city_id: int | None = None
    desired_salary_min: float | None = None


@dataclass(frozen=True)
class JobFacts:
    experience_min_years: float = 0
    experience_max_years: float | None = None
    education_level: str = "none"
    city_id: int | None = None
    work_mode: str = "onsite"
    salary_max: float | None = None


def criteria_breakdown(c: CandidateFacts, j: JobFacts) -> dict[str, float]:
    """Mỗi tiêu chí cho điểm 0..1. Thiếu thông tin của ứng viên thì cho 0,5 (trung lập)."""
    result: dict[str, float] = {}

    if c.years_of_experience is None:
        result["experience"] = 0.5
    else:
        y, lo, hi = c.years_of_experience, j.experience_min_years, j.experience_max_years
        if y < lo:
            result["experience"] = max(0.0, 1 - (lo - y) / max(lo, 1))
        elif hi is not None and y > hi + 2:
            result["experience"] = 0.8  # thừa kinh nghiệm nhiều
        else:
            result["experience"] = 1.0

    if c.education_level is None:
        result["education"] = 0.5
    else:
        gap = EDUCATION_ORDER.index(j.education_level) - EDUCATION_ORDER.index(c.education_level)
        result["education"] = 1.0 if gap <= 0 else 0.5 if gap == 1 else 0.0

    if j.work_mode == "remote":
        result["location"] = 1.0
    elif c.city_id is None:
        result["location"] = 0.5
    elif c.city_id == j.city_id:
        result["location"] = 1.0
    else:
        result["location"] = 0.6 if j.work_mode == "hybrid" else 0.3

    if c.desired_salary_min and j.salary_max:
        result["salary"] = min(1.0, j.salary_max / c.desired_salary_min)

    return result


def criteria_score(c: CandidateFacts, j: JobFacts) -> float:
    parts = criteria_breakdown(c, j)
    return sum(parts.values()) / len(parts)


# ---------------------------------------------------------------- Điểm tổng hợp


def hybrid_score(components: dict[str, float | None], weights: dict[str, float]) -> float:
    """Điểm 0..100. Thành phần nào None (ví dụ chưa có embedding) thì bỏ và chia lại trọng số."""
    used = {k: w for k, w in weights.items() if components.get(k) is not None and w > 0}
    total_weight = sum(used.values())
    if total_weight == 0:
        return 0.0
    return 100 * sum(w * float(components[k] or 0) for k, w in used.items()) / total_weight
