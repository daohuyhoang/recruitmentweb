import re
import unicodedata
from datetime import date, datetime, timedelta
from typing import Annotated, Any

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import func, or_, select, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import joinedload, selectinload

from app.api.deps import DB, Admin
from app.api.pagination import PageParam, SizeParam, paginate
from app.api.routes.public import job_load_options
from app.api.serializers import job_detail, skill_out
from app.models import Application, AppSetting, Category, CvSkill, Job, JobSkill, Skill, SkillAlias, User
from app.schemas import (
    AdminStatsOut,
    AdminUserOut,
    CategoryIn,
    CategoryOut,
    CountItem,
    JobDetailOut,
    JobReviewIn,
    Message,
    Page,
    SettingsIn,
    SkillIn,
    SkillOut,
    UserStatusIn,
)
from app.services import skill_dictionary
from app.services.app_config import get_all_settings
from app.services.notify import notify

router = APIRouter(prefix="/admin", tags=["Quản trị"])


def _slugify(value: str) -> str:
    value = value.replace("đ", "d").replace("Đ", "D").replace("#", "sharp").replace("+", "plus")
    value = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", "-", value).strip("-") or "muc"


# ---------------------------------------------------------------- thống kê


@router.get("/stats", response_model=AdminStatsOut)
def stats(_: Admin, db: DB) -> AdminStatsOut:
    totals = db.execute(text("SELECT * FROM v_admin_stats")).mappings().one()
    since = date.today() - timedelta(days=29)
    by_day = dict(
        db.execute(
            select(func.date(Application.applied_at), func.count())
            .where(Application.applied_at >= since)
            .group_by(func.date(Application.applied_at))
        ).all()
    )
    parent = Category.__table__.alias("parent")
    by_category = db.execute(
        select(parent.c.name, func.count(Job.id))
        .select_from(Job)
        .join(Category, Category.id == Job.category_id)
        .join(parent, parent.c.id == Category.parent_id)
        .where(Job.status == "approved", Job.deadline >= date.today())
        .group_by(parent.c.name)
        .order_by(func.count(Job.id).desc())
    ).all()
    top_skills = db.execute(
        select(Skill.name, func.count())
        .join(JobSkill)
        .join(Job)
        .where(Job.status == "approved", Job.deadline >= date.today())
        .group_by(Skill.name)
        .order_by(func.count().desc())
        .limit(10)
    ).all()
    by_status = db.execute(select(Application.status, func.count()).group_by(Application.status)).all()
    return AdminStatsOut(
        **{k: int(v) for k, v in totals.items()},
        applications_by_day=[
            CountItem(label=(since + timedelta(days=i)).isoformat(), value=by_day.get(since + timedelta(days=i), 0))
            for i in range(30)
        ],
        jobs_by_category=[CountItem(label=n, value=c) for n, c in by_category],
        top_skills=[CountItem(label=n, value=c) for n, c in top_skills],
        applications_by_status=[CountItem(label=s, value=c) for s, c in by_status],
    )


# ---------------------------------------------------------------- tài khoản


@router.get("/users", response_model=Page[AdminUserOut])
def list_users(
    _: Admin,
    db: DB,
    page: PageParam = 1,
    size: SizeParam = 20,
    role: str | None = None,
    status_: Annotated[str | None, Query(alias="status")] = None,
    q: str | None = None,
) -> Page[AdminUserOut]:
    stmt = select(User).options(joinedload(User.company)).order_by(User.created_at.desc())
    if role:
        stmt = stmt.where(User.role == role)
    if status_:
        stmt = stmt.where(User.status == status_)
    if q and q.strip():
        like = f"%{q.strip()}%"
        stmt = stmt.where(or_(User.email.like(like), User.full_name.like(like)))
    items, total = paginate(db, stmt, page, size)
    return Page(items=[AdminUserOut.model_validate(u) for u in items], total=total, page=page, size=size)


@router.put("/users/{user_id}/status", response_model=AdminUserOut)
def set_user_status(user_id: int, data: UserStatusIn, admin: Admin, db: DB) -> AdminUserOut:
    """Duyệt nhà tuyển dụng (pending → active), khóa hoặc mở khóa tài khoản."""
    user = db.scalar(select(User).where(User.id == user_id).options(joinedload(User.company)))
    if user is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Không tìm thấy tài khoản")
    if user.id == admin.id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Không thể đổi trạng thái tài khoản của chính bạn")
    if data.status == "locked" and not (data.reason or "").strip():
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Cần ghi lý do khóa tài khoản")
    was_pending = user.status == "pending"
    user.status = data.status
    user.locked_reason = data.reason if data.status == "locked" else None
    if data.status == "active" and was_pending and user.role == "employer":
        if user.company:
            user.company.is_verified = True
        notify(
            db,
            user.id,
            "account_approved",
            "Tài khoản đã được duyệt",
            "Bạn đã có thể đăng tin tuyển dụng.",
            "/nha-tuyen-dung/tin/tao-moi",
        )
    db.commit()
    return AdminUserOut.model_validate(user)


# ---------------------------------------------------------------- kiểm duyệt tin


@router.get("/jobs", response_model=Page[JobDetailOut])
def list_jobs(
    _: Admin,
    db: DB,
    page: PageParam = 1,
    size: SizeParam = 20,
    status_: Annotated[str | None, Query(alias="status")] = "pending",
    q: str | None = None,
) -> Page[JobDetailOut]:
    stmt = select(Job).options(*job_load_options()).order_by(Job.updated_at.desc())
    if status_:
        stmt = stmt.where(Job.status == status_)
    if q and q.strip():
        stmt = stmt.where(Job.title.like(f"%{q.strip()}%"))
    items, total = paginate(db, stmt, page, size)
    return Page(items=[job_detail(j) for j in items], total=total, page=page, size=size)


@router.post("/jobs/{job_id}/review", response_model=JobDetailOut)
def review_job(job_id: int, data: JobReviewIn, admin: Admin, db: DB) -> JobDetailOut:
    job = db.scalar(select(Job).where(Job.id == job_id).options(*job_load_options()))
    if job is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Không tìm thấy tin tuyển dụng")
    if job.status != "pending":
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Chỉ duyệt được tin đang chờ duyệt")
    now = datetime.now()
    job.reviewed_by, job.reviewed_at = admin.id, now
    if data.action == "approve":
        job.status = "approved"
        job.rejection_reason = None
        job.published_at = job.published_at or now
        notify(
            db,
            job.company.owner_id,
            "job_approved",
            "Tin tuyển dụng đã được duyệt",
            f"Tin {job.title} đang hiển thị với ứng viên.",
            f"/nha-tuyen-dung/tin/{job.id}",
        )
    else:
        job.status = "rejected"
        job.rejection_reason = data.reason
        notify(
            db,
            job.company.owner_id,
            "job_rejected",
            "Tin tuyển dụng bị từ chối",
            f"Tin {job.title}: {data.reason}",
            f"/nha-tuyen-dung/tin/{job.id}",
        )
    db.commit()
    return job_detail(job)


# ---------------------------------------------------------------- ngành nghề


@router.get("/categories", response_model=list[CategoryOut])
def all_categories(_: Admin, db: DB) -> list[CategoryOut]:
    counts = dict(db.execute(select(Job.category_id, func.count()).group_by(Job.category_id)).all())
    rows = list(db.scalars(select(Category).order_by(Category.sort_order)))
    result = []
    for c in rows:
        if c.parent_id is None:
            kids = [
                CategoryOut.model_validate(k).model_copy(update={"open_jobs": counts.get(k.id, 0), "children": []})
                for k in rows
                if k.parent_id == c.id
            ]
            result.append(
                CategoryOut.model_validate(c).model_copy(update={"children": kids, "open_jobs": sum(k.open_jobs for k in kids)})
            )
    return result


@router.post("/categories", response_model=CategoryOut, status_code=status.HTTP_201_CREATED)
def create_category(data: CategoryIn, _: Admin, db: DB) -> CategoryOut:
    if data.parent_id is not None:
        parent = db.get(Category, data.parent_id)
        if parent is None or parent.parent_id is not None:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Danh mục cha phải là một ngành nghề (cấp 1)")
    category = Category(**data.model_dump(), slug=_slugify(data.name))
    db.add(category)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, "Tên danh mục đã tồn tại") from None
    return CategoryOut.model_validate(category).model_copy(update={"children": []})


@router.put("/categories/{category_id}", response_model=CategoryOut)
def update_category(category_id: int, data: CategoryIn, _: Admin, db: DB) -> CategoryOut:
    category = db.get(Category, category_id)
    if category is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Không tìm thấy danh mục")
    for key, value in data.model_dump().items():
        setattr(category, key, value)
    category.slug = _slugify(data.name)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, "Tên danh mục đã tồn tại") from None
    return CategoryOut.model_validate(category).model_copy(update={"children": []})


@router.delete("/categories/{category_id}", response_model=Message)
def delete_category(category_id: int, _: Admin, db: DB) -> Message:
    category = db.get(Category, category_id)
    if category is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Không tìm thấy danh mục")
    in_use = db.scalar(select(func.count()).select_from(Job).where(Job.category_id == category_id)) or 0
    has_children = db.scalar(select(func.count()).select_from(Category).where(Category.parent_id == category_id)) or 0
    if in_use or has_children:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "Danh mục đang có tin tuyển dụng hoặc nhóm con. Hãy ẩn danh mục (bỏ chọn Đang dùng) thay vì xóa.",
        )
    db.delete(category)
    db.commit()
    return Message(message="Đã xóa danh mục")


# ---------------------------------------------------------------- từ điển kỹ năng


def _skill_out(db: DB, skill: Skill) -> SkillOut:
    usage = (db.scalar(select(func.count()).select_from(JobSkill).where(JobSkill.skill_id == skill.id)) or 0) + (
        db.scalar(select(func.count()).select_from(CvSkill).where(CvSkill.skill_id == skill.id)) or 0
    )
    return skill_out(skill, usage)


@router.get("/skills", response_model=Page[SkillOut])
def list_skills(
    _: Admin, db: DB, page: PageParam = 1, size: SizeParam = 50, q: str | None = None, category_id: int | None = None
) -> Page[SkillOut]:
    stmt = select(Skill).options(selectinload(Skill.aliases)).order_by(Skill.name)
    if q and q.strip():
        like = f"%{q.strip()}%"
        stmt = stmt.where(
            or_(Skill.name.like(like), Skill.id.in_(select(SkillAlias.skill_id).where(SkillAlias.alias.like(like))))
        )
    if category_id:
        stmt = stmt.where(Skill.category_id == category_id)
    items, total = paginate(db, stmt, page, size)
    return Page(items=[_skill_out(db, s) for s in items], total=total, page=page, size=size)


def _save_skill(db: DB, skill: Skill, data: SkillIn) -> SkillOut:
    skill.name = data.name.strip()
    skill.slug = _slugify(skill.name)
    skill.skill_type = data.skill_type
    skill.category_id = data.category_id
    skill.is_active = data.is_active
    aliases = sorted({a.strip().lower() for a in data.aliases if a.strip() and a.strip().lower() != skill.name.lower()})
    skill.aliases = [SkillAlias(alias=a) for a in aliases]
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, "Tên kỹ năng hoặc từ đồng nghĩa đã thuộc về kỹ năng khác") from None
    skill_dictionary.invalidate()
    db.refresh(skill)
    return _skill_out(db, skill)


@router.post("/skills", response_model=SkillOut, status_code=status.HTTP_201_CREATED)
def create_skill(data: SkillIn, _: Admin, db: DB) -> SkillOut:
    skill = Skill()
    db.add(skill)
    return _save_skill(db, skill, data)


@router.put("/skills/{skill_id}", response_model=SkillOut)
def update_skill(skill_id: int, data: SkillIn, _: Admin, db: DB) -> SkillOut:
    skill = db.scalar(select(Skill).where(Skill.id == skill_id).options(selectinload(Skill.aliases)))
    if skill is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Không tìm thấy kỹ năng")
    # Xóa từ đồng nghĩa cũ trước để không vướng ràng buộc UNIQUE khi thêm lại
    skill.aliases = []
    db.flush()
    return _save_skill(db, skill, data)


@router.delete("/skills/{skill_id}", response_model=Message)
def delete_skill(skill_id: int, _: Admin, db: DB) -> Message:
    skill = db.get(Skill, skill_id)
    if skill is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Không tìm thấy kỹ năng")
    db.delete(skill)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, "Kỹ năng đang được tin tuyển dụng hoặc CV sử dụng. Hãy tắt kỹ năng thay vì xóa."
        ) from None
    skill_dictionary.invalidate()
    return Message(message="Đã xóa kỹ năng")


# ---------------------------------------------------------------- cấu hình thuật toán


@router.get("/settings")
def get_settings_(_: Admin, db: DB) -> dict[str, Any]:
    return get_all_settings(db)


@router.put("/settings")
def update_settings(data: SettingsIn, _: Admin, db: DB) -> dict[str, Any]:
    for key, value in data.model_dump(exclude_none=True).items():
        row = db.get(AppSetting, key)
        if row is None:
            db.add(AppSetting(setting_key=key, setting_value=value))
        else:
            row.setting_value = value
    db.commit()
    return get_all_settings(db)
