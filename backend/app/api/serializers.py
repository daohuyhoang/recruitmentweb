"""Chuyển model sang schema trả về. Gom ở một chỗ để mọi router trả cùng một dạng dữ liệu."""

from app.models import Application, Cv, Job, Skill
from app.schemas import (
    CandidateApplicationOut,
    CategoryBrief,
    CityOut,
    CompanyBrief,
    CvBrief,
    CvContent,
    CvOut,
    CvSkillOut,
    JobDetailOut,
    JobSkillOut,
    JobSummaryOut,
    MatchComponents,
    MatchOut,
    MatchSkill,
    SkillOut,
    StatusHistoryOut,
)
from app.services.matching import MatchOutcome


def job_summary(job: Job) -> JobSummaryOut:
    return JobSummaryOut(
        id=job.id,
        slug=job.slug,
        title=job.title,
        company=CompanyBrief.model_validate(job.company),
        category=CategoryBrief.model_validate(job.category),
        city=CityOut.model_validate(job.city),
        employment_type=job.employment_type,
        work_mode=job.work_mode,
        salary_min=job.salary_min,
        salary_max=job.salary_max,
        experience_min_years=job.experience_min_years,
        experience_max_years=job.experience_max_years,
        deadline=job.deadline,
        published_at=job.published_at,
        status=job.status,
        skills=[JobSkillOut(skill_id=s.skill_id, name=s.skill.name, required=s.is_required) for s in job.skills],
    )


def job_detail(job: Job, **extra) -> JobDetailOut:
    return JobDetailOut(
        **job_summary(job).model_dump(),
        description=job.description,
        requirements=job.requirements,
        benefits=job.benefits,
        address=job.address,
        education_level=job.education_level,
        vacancies=job.vacancies,
        view_count=job.view_count,
        rejection_reason=job.rejection_reason,
        created_at=job.created_at,
        **extra,
    )


def cv_out(cv: Cv, with_content: bool = False) -> CvOut:
    return CvOut(
        id=cv.id,
        title=cv.title,
        source=cv.source,
        file_name=cv.file_name,
        file_size=cv.file_size,
        template=cv.template,
        parse_status=cv.parse_status,
        parse_error=cv.parse_error,
        is_default=cv.is_default,
        created_at=cv.created_at,
        updated_at=cv.updated_at,
        skills=sorted(
            (CvSkillOut(skill_id=s.skill_id, name=s.skill.name, source=s.source) for s in cv.skills), key=lambda s: s.name.lower()
        ),
        content=CvContent.model_validate(cv.content) if with_content and cv.content else None,
    )


def match_out(o: MatchOutcome, cv_skill_ids: set[int]) -> MatchOut:
    skills = [
        MatchSkill(skill_id=s.skill_id, name=s.skill.name, required=s.is_required, matched=s.skill_id in cv_skill_ids)
        for s in o.job.skills
    ]
    required = [s for s in skills if s.required]
    return MatchOut(
        job=job_summary(o.job),
        score=o.score,
        components=MatchComponents(coverage=o.coverage, tfidf=o.tfidf, semantic=o.semantic, criteria=o.criteria),
        weights=o.weights,
        criteria_detail=o.criteria_detail,
        skills=skills,
        required_met=sum(s.matched for s in required),
        required_total=len(required),
    )


def candidate_application(app: Application) -> CandidateApplicationOut:
    return CandidateApplicationOut(
        id=app.id,
        job=job_summary(app.job),
        cv=CvBrief.model_validate(app.cv),
        status=app.status,
        match_score=app.match_score,
        cover_letter=app.cover_letter,
        interview_at=app.interview_at,
        applied_at=app.applied_at,
        updated_at=app.updated_at,
        history=[StatusHistoryOut.model_validate(h) for h in app.history],
    )


def skill_out(skill: Skill, usage_count: int = 0) -> SkillOut:
    return SkillOut(
        id=skill.id,
        name=skill.name,
        slug=skill.slug,
        skill_type=skill.skill_type,
        category_id=skill.category_id,
        is_active=skill.is_active,
        aliases=[a.alias for a in skill.aliases],
        usage_count=usage_count,
    )
