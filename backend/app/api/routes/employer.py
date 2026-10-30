import re
import unicodedata
from datetime import date, datetime, timedelta
from decimal import Decimal
from typing import Annotated, Literal

from fastapi import APIRouter, HTTPException, Query, status
from fastapi.responses import FileResponse
from sqlalchemy import func, select
from sqlalchemy.orm import joinedload, selectinload

from app.api.deps import DB, Employer, employer_company, ensure_active_employer
from app.api.pagination import PageParam, SizeParam, paginate
from app.api.routes.candidate import cv_file_response
from app.api.routes.public import job_load_options
from app.api.serializers import cv_out, job_detail
from app.models import Application, ApplicationStatusHistory, CandidateProfile, Company, Cv, CvSkill, Job, JobSkill, User
from app.schemas import (
    ApplicantBrief,
    CompanyIn,
    CompanyOut,
    CountItem,
    CvBrief,
    CvOut,
    EmployerApplicationOut,
    EmployerNoteIn,
    EmployerStatsOut,
    JobDetailOut,
    JobIn,
    Message,
    Page,
    StatusHistoryOut,
    StatusUpdateIn,
)
from app.services import matching
from app.services.notify import APPLICATION_STATUS_LABELS, notify
from app.services.skill_dictionary import get_dictionary

router = APIRouter(prefix="/employer", tags=["Nhà tuyển dụng"])

# Trạng thái hồ sơ được phép chuyển tới từ mỗi trạng thái
TRANSITIONS: dict[str, set[str]] = {
    "submitted": {"viewed", "interview", "accepted", "rejected"},
    "viewed": {"interview", "accepted", "rejected"},
    "interview": {"accepted", "rejected"},
}


def _slugify(text: str) -> str:
    text = text.replace("đ", "d").replace("Đ", "D")
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", "-", text).strip("-")


# ---------------------------------------------------------------- công ty


@router.get("/company", response_model=CompanyOut)
def get_my_company(user: Employer, db: DB) -> CompanyOut:
    company = employer_company(db, user)
    return CompanyOut.model_validate(company)


@router.put("/company", response_model=CompanyOut)
def update_my_company(data: CompanyIn, user: Employer, db: DB) -> CompanyOut:
    company = employer_company(db, user)
    if data.tax_code and db.scalar(select(Company.id).where(Company.tax_code == data.tax_code, Company.id != company.id)):
        raise HTTPException(status.HTTP_409_CONFLICT, "Mã số thuế đã được công ty khác đăng ký")
    for key, value in data.model_dump().items():
        setattr(company, key, value)
    db.commit()
    db.refresh(company)
    return CompanyOut.model_validate(company)


@router.get("/stats", response_model=EmployerStatsOut)
def stats(user: Employer, db: DB) -> EmployerStatsOut:
    company = employer_company(db, user)
    job_ids = select(Job.id).where(Job.company_id == company.id)
    by_status = dict(
        db.execute(
            select(Application.status, func.count()).where(Application.job_id.in_(job_ids)).group_by(Application.status)
        ).all()
    )
    return EmployerStatsOut(
        open_jobs=db.scalar(
            select(func.count())
            .select_from(Job)
            .where(Job.company_id == company.id, Job.status == "approved", Job.deadline >= date.today())
        )
        or 0,
        pending_jobs=db.scalar(select(func.count()).select_from(Job).where(Job.company_id == company.id, Job.status == "pending"))
        or 0,
        total_applications=sum(by_status.values()),
        new_applications=db.scalar(
            select(func.count())
            .select_from(Application)
            .where(Application.job_id.in_(job_ids), Application.applied_at >= datetime.now() - timedelta(days=7))
        )
        or 0,
        interviews=by_status.get("interview", 0),
        applications_by_status=[CountItem(label=k, value=v) for k, v in by_status.items()],
    )


# ---------------------------------------------------------------- tin tuyển dụng


def _my_job(db: DB, company: Company, job_id: int) -> Job:
    job = db.scalar(
        select(Job).where(Job.id == job_id, Job.company_id == company.id).options(*job_load_options(), selectinload(Job.vector))
    )
    if job is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Không tìm thấy tin tuyển dụng")
    return job


def _application_count(db: DB, job_id: int) -> int:
    return db.scalar(select(func.count()).select_from(Application).where(Application.job_id == job_id)) or 0


def _apply_job_data(db: DB, job: Job, data: JobIn) -> None:
    fields = data.model_dump(exclude={"skills", "submit"})
    for key, value in fields.items():
        setattr(job, key, value)
    dictionary = get_dictionary(db)
    skills: dict[int, bool] = {}
    unknown: list[str] = []
    for s in data.skills:
        skill_id = s.skill_id or (dictionary.resolve(s.name) if s.name else None)
        if skill_id is None:
            unknown.append(s.name or "?")
            continue
        skills[skill_id] = skills.get(skill_id, False) or s.required
    if unknown:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "Kỹ năng chưa có trong từ điển: " + ", ".join(unknown) + ". Chọn kỹ năng trong danh sách gợi ý.",
        )
    job.skills = [JobSkill(skill_id=sid, is_required=req) for sid, req in skills.items()]
    matching.invalidate_job(job)


@router.get("/jobs", response_model=Page[JobDetailOut])
def my_jobs(
    user: Employer,
    db: DB,
    page: PageParam = 1,
    size: SizeParam = 20,
    status_: Annotated[str | None, Query(alias="status")] = None,
) -> Page[JobDetailOut]:
    company = employer_company(db, user)
    stmt = select(Job).where(Job.company_id == company.id).options(*job_load_options()).order_by(Job.created_at.desc())
    if status_:
        stmt = stmt.where(Job.status == status_)
    items, total = paginate(db, stmt, page, size)
    counts = (
        dict(
            db.execute(
                select(Application.job_id, func.count())
                .where(Application.job_id.in_([j.id for j in items]))
                .group_by(Application.job_id)
            ).all()
        )
        if items
        else {}
    )
    return Page(items=[job_detail(j, application_count=counts.get(j.id, 0)) for j in items], total=total, page=page, size=size)


@router.post("/jobs", response_model=JobDetailOut, status_code=status.HTTP_201_CREATED)
def create_job(data: JobIn, user: Employer, db: DB) -> JobDetailOut:
    ensure_active_employer(user)
    company = employer_company(db, user)
    job = Job(
        company_id=company.id,
        created_by=user.id,
        slug=f"tmp-{datetime.now().timestamp()}",
        status="pending" if data.submit else "draft",
    )
    _apply_job_data(db, job, data)
    db.add(job)
    db.flush()
    job.slug = f"{_slugify(job.title)}-{job.id}"
    db.commit()
    return job_detail(_my_job(db, company, job.id), application_count=0)


@router.get("/jobs/{job_id}", response_model=JobDetailOut)
def get_my_job(job_id: int, user: Employer, db: DB) -> JobDetailOut:
    company = employer_company(db, user)
    job = _my_job(db, company, job_id)
    return job_detail(job, application_count=_application_count(db, job.id))


@router.put("/jobs/{job_id}", response_model=JobDetailOut)
def update_job(job_id: int, data: JobIn, user: Employer, db: DB) -> JobDetailOut:
    """Sửa tin. Tin đã duyệt hoặc bị từ chối khi sửa và gửi lại sẽ chờ admin duyệt lại."""
    ensure_active_employer(user)
    company = employer_company(db, user)
    job = _my_job(db, company, job_id)
    if job.status == "closed":
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Tin đã đóng. Mở lại tin trước khi sửa.")
    _apply_job_data(db, job, data)
    job.slug = f"{_slugify(job.title)}-{job.id}"
    if data.submit:
        job.status = "pending"
        job.rejection_reason = None
    elif job.status in ("draft", "rejected"):
        job.status = "draft"
    db.commit()
    return job_detail(_my_job(db, company, job.id), application_count=_application_count(db, job.id))


@router.post("/jobs/{job_id}/close", response_model=JobDetailOut)
def close_job(job_id: int, user: Employer, db: DB) -> JobDetailOut:
    company = employer_company(db, user)
    job = _my_job(db, company, job_id)
    if job.status not in ("approved", "pending"):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Chỉ đóng được tin đang hiển thị hoặc đang chờ duyệt")
    job.status = "closed"
    job.closed_at = datetime.now()
    db.commit()
    return job_detail(job, application_count=_application_count(db, job.id))


@router.post("/jobs/{job_id}/reopen", response_model=JobDetailOut)
def reopen_job(job_id: int, user: Employer, db: DB, deadline: date | None = None) -> JobDetailOut:
    ensure_active_employer(user)
    company = employer_company(db, user)
    job = _my_job(db, company, job_id)
    if job.status != "closed":
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Tin chưa đóng")
    if deadline:
        job.deadline = deadline
    if job.deadline < date.today():
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Hạn nộp đã qua. Chọn hạn nộp mới để mở lại tin.")
    # Tin đã từng được duyệt thì mở lại ngay, chưa từng duyệt thì chờ duyệt
    job.status = "approved" if job.published_at else "pending"
    job.closed_at = None
    db.commit()
    return job_detail(job, application_count=_application_count(db, job.id))


@router.delete("/jobs/{job_id}", response_model=Message)
def delete_job(job_id: int, user: Employer, db: DB) -> Message:
    company = employer_company(db, user)
    job = _my_job(db, company, job_id)
    if job.status not in ("draft", "rejected") or _application_count(db, job.id):
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, "Chỉ xóa được tin nháp hoặc bị từ chối chưa có hồ sơ. Tin khác hãy đóng lại."
        )
    db.delete(job)
    db.commit()
    return Message(message="Đã xóa tin")


# ---------------------------------------------------------------- hồ sơ ứng tuyển


def _applications_query(company_id: int):
    return (
        select(Application)
        .join(Job)
        .where(Job.company_id == company_id)
        .options(
            joinedload(Application.job),
            joinedload(Application.candidate).joinedload(User.profile).joinedload(CandidateProfile.city),
            joinedload(Application.cv),
            selectinload(Application.history),
        )
    )


def _employer_application(app: Application) -> EmployerApplicationOut:
    profile = app.candidate.profile
    return EmployerApplicationOut(
        id=app.id,
        job_id=app.job_id,
        job_title=app.job.title,
        candidate=ApplicantBrief(
            id=app.candidate.id,
            full_name=app.candidate.full_name,
            email=app.candidate.email,
            phone=app.candidate.phone,
            headline=profile.headline if profile else None,
            city=profile.city.name if profile and profile.city else None,
            years_of_experience=profile.years_of_experience if profile else None,
        ),
        cv=CvBrief.model_validate(app.cv),
        status=app.status,
        match_score=app.match_score,
        match_detail=app.match_detail,
        cover_letter=app.cover_letter,
        employer_note=app.employer_note,
        interview_at=app.interview_at,
        applied_at=app.applied_at,
        history=[StatusHistoryOut.model_validate(h) for h in app.history],
    )


def _my_application(db: DB, company: Company, application_id: int) -> Application:
    app = db.scalar(_applications_query(company.id).where(Application.id == application_id))
    if app is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Không tìm thấy hồ sơ ứng tuyển")
    return app


@router.get("/applications", response_model=Page[EmployerApplicationOut])
def list_applications(
    user: Employer,
    db: DB,
    page: PageParam = 1,
    size: SizeParam = 20,
    job_id: int | None = None,
    status_: Annotated[str | None, Query(alias="status")] = None,
    min_score: Decimal | None = None,
    sort: Literal["score", "newest"] = "score",
) -> Page[EmployerApplicationOut]:
    """Danh sách ứng viên, mặc định xếp theo điểm phù hợp (dùng lại thuật toán theo chiều ngược lại)."""
    company = employer_company(db, user)
    stmt = _applications_query(company.id)
    if job_id:
        stmt = stmt.where(Application.job_id == job_id)
    if status_:
        stmt = stmt.where(Application.status == status_)
    if min_score is not None:
        stmt = stmt.where(Application.match_score >= min_score)
    order = (
        (Application.match_score.desc(), Application.applied_at.desc()) if sort == "score" else (Application.applied_at.desc(),)
    )
    items, total = paginate(db, stmt.order_by(*order), page, size)
    return Page(items=[_employer_application(a) for a in items], total=total, page=page, size=size)


@router.get("/applications/{application_id}", response_model=EmployerApplicationOut)
def get_application(application_id: int, user: Employer, db: DB) -> EmployerApplicationOut:
    """Mở hồ sơ lần đầu sẽ tự chuyển trạng thái sang Đã xem và báo cho ứng viên."""
    company = employer_company(db, user)
    app = _my_application(db, company, application_id)
    if app.status == "submitted":
        _change_status(db, app, user, "viewed", None)
        db.commit()
    return _employer_application(app)


@router.get("/applications/{application_id}/cv", response_model=CvOut)
def get_application_cv(application_id: int, user: Employer, db: DB) -> CvOut:
    company = employer_company(db, user)
    app = _my_application(db, company, application_id)
    cv = db.scalar(select(Cv).where(Cv.id == app.cv_id).options(selectinload(Cv.skills).joinedload(CvSkill.skill)))
    return cv_out(cv, with_content=True)


@router.get("/applications/{application_id}/cv/file")
def download_application_cv(application_id: int, user: Employer, db: DB) -> FileResponse:
    company = employer_company(db, user)
    app = _my_application(db, company, application_id)
    return cv_file_response(app.cv)


def _change_status(db: DB, app: Application, user: User, new_status: str, note: str | None) -> None:
    if new_status not in TRANSITIONS.get(app.status, set()):
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            f'Không chuyển được từ "{APPLICATION_STATUS_LABELS[app.status]}" sang "{APPLICATION_STATUS_LABELS[new_status]}"',
        )
    app.history.append(ApplicationStatusHistory(from_status=app.status, to_status=new_status, changed_by=user.id, note=note))
    app.status = new_status
    company_name = app.job.company.name if app.job.company else "Nhà tuyển dụng"
    titles = {
        "viewed": "Nhà tuyển dụng đã xem hồ sơ",
        "interview": "Bạn được mời phỏng vấn",
        "accepted": "Chúc mừng, bạn đã trúng tuyển",
        "rejected": "Hồ sơ chưa phù hợp",
    }
    notify(
        db,
        app.candidate_id,
        "application_status",
        titles[new_status],
        f"{company_name} · {app.job.title}" + (f": {note}" if note else ""),
        f"/ho-so-da-nop/{app.id}",
    )


@router.put("/applications/{application_id}/status", response_model=EmployerApplicationOut)
def update_status(application_id: int, data: StatusUpdateIn, user: Employer, db: DB) -> EmployerApplicationOut:
    company = employer_company(db, user)
    app = _my_application(db, company, application_id)
    if data.status == "interview":
        if data.interview_at is None:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Chọn thời gian phỏng vấn")
        app.interview_at = data.interview_at
    _change_status(db, app, user, data.status, data.note)
    db.commit()
    return _employer_application(app)


@router.put("/applications/{application_id}/note", response_model=EmployerApplicationOut)
def update_note(application_id: int, data: EmployerNoteIn, user: Employer, db: DB) -> EmployerApplicationOut:
    company = employer_company(db, user)
    app = _my_application(db, company, application_id)
    app.employer_note = data.employer_note
    db.commit()
    return _employer_application(app)


@router.post("/jobs/{job_id}/rescore", response_model=Message)
def rescore(job_id: int, user: Employer, db: DB) -> Message:
    """Tính lại điểm phù hợp cho mọi hồ sơ của tin (sau khi sửa yêu cầu kỹ năng)."""
    company = employer_company(db, user)
    job = _my_job(db, company, job_id)
    apps = list(db.scalars(select(Application).where(Application.job_id == job.id)))
    corpus = list(db.scalars(matching.open_jobs_query()).unique())
    for app in apps:
        cv = db.scalar(select(Cv).where(Cv.id == app.cv_id).options(selectinload(Cv.skills), selectinload(Cv.vector)))
        o = matching.compute_matches(db, cv, [job], corpus=corpus)[0]
        app.match_score = Decimal(str(o.score))
        app.match_detail = {
            "coverage": round(o.coverage, 4),
            "tfidf": round(o.tfidf, 4),
            "semantic": round(o.semantic, 4) if o.semantic is not None else None,
            "criteria": round(o.criteria, 4),
            "matched_skills": o.matched,
            "missing_skills": o.missing,
        }
    db.commit()
    return Message(message=f"Đã tính lại điểm cho {len(apps)} hồ sơ")
