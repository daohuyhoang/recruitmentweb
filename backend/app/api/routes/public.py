"""API công khai: danh mục, tìm kiếm việc làm, chi tiết việc làm, công ty."""

from datetime import date
from decimal import Decimal
from typing import Annotated, Literal

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.dialects.mysql import match as mysql_match
from sqlalchemy.orm import joinedload, selectinload

from app.api.deps import DB, OptionalUser
from app.api.pagination import PageParam, SizeParam, paginate
from app.api.serializers import job_detail, job_summary, skill_out
from app.models import Application, Category, City, Company, Job, JobSkill, SavedJob, Skill, SkillAlias, User
from app.schemas import CategoryOut, CityOut, CompanyOut, CountItem, JobDetailOut, JobSummaryOut, Page, SkillOut

router = APIRouter(tags=["Công khai"])


def open_job_filter():
    return (Job.status == "approved") & (Job.deadline >= date.today())


def job_load_options():
    return (
        joinedload(Job.company),
        joinedload(Job.category),
        joinedload(Job.city),
        selectinload(Job.skills).joinedload(JobSkill.skill),
    )


@router.get("/cities", response_model=list[CityOut])
def list_cities(db: DB) -> list[City]:
    return list(db.scalars(select(City).order_by(City.sort_order)))


@router.get("/categories", response_model=list[CategoryOut])
def list_categories(db: DB) -> list[CategoryOut]:
    """Cây ngành nghề (cấp 1) và nhóm công việc (cấp 2) kèm số tin đang mở."""
    counts = dict(db.execute(select(Job.category_id, func.count()).where(open_job_filter()).group_by(Job.category_id)).all())
    categories = list(db.scalars(select(Category).where(Category.is_active).order_by(Category.sort_order)))
    children: dict[int, list[CategoryOut]] = {}
    for c in categories:
        if c.parent_id is not None:
            children.setdefault(c.parent_id, []).append(
                CategoryOut.model_validate(c).model_copy(update={"open_jobs": counts.get(c.id, 0), "children": []})
            )
    result = []
    for c in categories:
        if c.parent_id is None:
            kids = children.get(c.id, [])
            result.append(
                CategoryOut.model_validate(c).model_copy(
                    update={"children": kids, "open_jobs": sum(k.open_jobs for k in kids) + counts.get(c.id, 0)}
                )
            )
    return result


@router.get("/skills", response_model=list[SkillOut])
def search_skills(
    db: DB, q: Annotated[str, Query(max_length=50)] = "", limit: Annotated[int, Query(le=50)] = 15
) -> list[SkillOut]:
    """Gợi ý kỹ năng khi nhập (tìm theo tên chuẩn và từ đồng nghĩa)."""
    stmt = select(Skill).where(Skill.is_active).options(selectinload(Skill.aliases)).order_by(Skill.name).limit(limit)
    if q.strip():
        like = f"%{q.strip()}%"
        stmt = stmt.where(
            or_(Skill.name.like(like), Skill.id.in_(select(SkillAlias.skill_id).where(SkillAlias.alias.like(like))))
        )
    return [skill_out(s) for s in db.scalars(stmt)]


@router.get("/stats", response_model=list[CountItem])
def public_stats(db: DB) -> list[CountItem]:
    return [
        CountItem(label="open_jobs", value=db.scalar(select(func.count()).select_from(Job).where(open_job_filter())) or 0),
        CountItem(label="companies", value=db.scalar(select(func.count()).select_from(Company).where(Company.is_verified)) or 0),
        CountItem(
            label="candidates", value=db.scalar(select(func.count()).select_from(User).where(User.role == "candidate")) or 0
        ),
    ]


@router.get("/jobs", response_model=Page[JobSummaryOut])
def search_jobs(
    db: DB,
    page: PageParam = 1,
    size: SizeParam = 20,
    q: Annotated[str | None, Query(max_length=100)] = None,
    category_id: int | None = None,
    city_id: int | None = None,
    company_id: int | None = None,
    employment_type: str | None = None,
    work_mode: str | None = None,
    salary_min: Decimal | None = None,
    experience_max: Decimal | None = Query(default=None, description="Số năm kinh nghiệm của ứng viên"),
    sort: Literal["newest", "salary", "deadline"] = "newest",
) -> Page[JobSummaryOut]:
    stmt = select(Job).where(open_job_filter()).options(*job_load_options())
    if q and q.strip():
        keyword = q.strip().replace('"', " ")
        # Đặt trong ngoặc kép: parser ngram chỉ khớp đúng cụm từ (xem database/README.md)
        stmt = stmt.where(
            or_(
                mysql_match(Job.title, Job.description, Job.requirements, against=f'"{keyword}"').in_boolean_mode(),
                Job.company_id.in_(select(Company.id).where(Company.name.like(f"%{keyword}%"))),
            )
        )
    if category_id:
        stmt = stmt.where(
            or_(Job.category_id == category_id, Job.category_id.in_(select(Category.id).where(Category.parent_id == category_id)))
        )
    if city_id:
        stmt = stmt.where(Job.city_id == city_id)
    if company_id:
        stmt = stmt.where(Job.company_id == company_id)
    if employment_type:
        stmt = stmt.where(Job.employment_type == employment_type)
    if work_mode:
        stmt = stmt.where(Job.work_mode == work_mode)
    if salary_min is not None:
        stmt = stmt.where(Job.salary_max >= salary_min)
    if experience_max is not None:
        stmt = stmt.where(Job.experience_min_years <= experience_max)
    order = {
        "newest": (Job.published_at.desc(), Job.id.desc()),
        "salary": (Job.salary_max.is_(None), Job.salary_max.desc(), Job.id.desc()),
        "deadline": (Job.deadline.asc(), Job.id.desc()),
    }[sort]
    items, total = paginate(db, stmt.order_by(*order), page, size)
    return Page(items=[job_summary(j) for j in items], total=total, page=page, size=size)


@router.get("/jobs/{job_id}", response_model=JobDetailOut)
def get_job(job_id: int, db: DB, user: OptionalUser) -> JobDetailOut:
    job = db.scalar(select(Job).where(Job.id == job_id).options(*job_load_options()))
    is_owner = user is not None and user.role == "employer" and job is not None and job.company.owner_id == user.id
    is_admin = user is not None and user.role == "admin"
    if job is None or (job.status not in ("approved", "closed") and not (is_owner or is_admin)):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Không tìm thấy tin tuyển dụng")
    extra: dict = {}
    if user is not None and user.role == "candidate":
        extra["is_saved"] = db.get(SavedJob, (user.id, job.id)) is not None
        extra["application_id"] = db.scalar(
            select(Application.id).where(Application.job_id == job.id, Application.candidate_id == user.id)
        )
    if not (is_owner or is_admin):
        job.view_count += 1
        db.commit()
    return job_detail(job, **extra)


@router.get("/companies/{company_id}", response_model=CompanyOut)
def get_company(company_id: int, db: DB) -> CompanyOut:
    company = db.scalar(select(Company).where(Company.id == company_id).options(joinedload(Company.city)))
    if company is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Không tìm thấy công ty")
    open_jobs = db.scalar(select(func.count()).select_from(Job).where(open_job_filter(), Job.company_id == company.id)) or 0
    return CompanyOut.model_validate(company).model_copy(update={"open_jobs": open_jobs})
