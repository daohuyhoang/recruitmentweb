import uuid
from datetime import date, datetime
from decimal import Decimal
from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, File, Form, HTTPException, Query, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import joinedload, selectinload

from app.api.deps import DB, Candidate
from app.api.pagination import PageParam, SizeParam, paginate
from app.api.routes.public import job_load_options
from app.api.serializers import candidate_application, cv_out, job_summary, match_out
from app.core.config import get_settings
from app.matching import semantic
from app.matching.text import segmenter_name
from app.models import (
    Application,
    ApplicationStatusHistory,
    CandidateProfile,
    Category,
    Cv,
    CvEvaluation,
    CvSkill,
    Job,
    JobSkill,
    SavedJob,
)
from app.schemas import (
    ApplicationIn,
    CandidateApplicationOut,
    CvCreateIn,
    CvOut,
    CvUpdateIn,
    EvaluationOut,
    JobSummaryOut,
    MatchOut,
    Message,
    Page,
    ProfileIn,
    ProfileOut,
    TopMatchesOut,
)
from app.services import matching
from app.services.app_config import get_setting
from app.services.cv_evaluator import JobRequirement, evaluate_cv
from app.services.cv_parser import CvFileError, extract_text, parse_cv_text
from app.services.notify import notify
from app.services.skill_dictionary import get_dictionary

router = APIRouter(prefix="/candidate", tags=["Ứng viên"])

ALLOWED_EXTENSIONS = {
    ".pdf": "application/pdf",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}


# ---------------------------------------------------------------- hồ sơ


def _profile(db: DB, user_id: int) -> CandidateProfile:
    profile = db.get(CandidateProfile, user_id)
    if profile is None:
        profile = CandidateProfile(user_id=user_id)
        db.add(profile)
        db.commit()
    return profile


@router.get("/profile", response_model=ProfileOut)
def get_profile(user: Candidate, db: DB) -> CandidateProfile:
    return _profile(db, user.id)


@router.put("/profile", response_model=ProfileOut)
def update_profile(data: ProfileIn, user: Candidate, db: DB) -> CandidateProfile:
    profile = _profile(db, user.id)
    for key, value in data.model_dump().items():
        setattr(profile, key, value)
    db.commit()
    db.refresh(profile)
    return profile


# ---------------------------------------------------------------- CV


def _cv_query(user_id: int):
    return (
        select(Cv)
        .where(Cv.candidate_id == user_id, Cv.deleted_at.is_(None))
        .options(selectinload(Cv.skills).joinedload(CvSkill.skill), selectinload(Cv.vector))
    )


def _get_cv(db: DB, user_id: int, cv_id: int) -> Cv:
    cv = db.scalar(_cv_query(user_id).where(Cv.id == cv_id))
    if cv is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Không tìm thấy CV")
    return cv


def _default_cv(db: DB, user_id: int, cv_id: int | None) -> Cv:
    if cv_id is not None:
        return _get_cv(db, user_id, cv_id)
    cvs = list(db.scalars(_cv_query(user_id).order_by(Cv.is_default.desc(), Cv.updated_at.desc())))
    if not cvs:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Bạn chưa có CV. Hãy tải CV lên hoặc tạo CV mới.")
    return cvs[0]


def _first_cv_becomes_default(db: DB, user_id: int, cv: Cv) -> None:
    has_default = db.scalar(select(Cv.id).where(Cv.candidate_id == user_id, Cv.is_default, Cv.deleted_at.is_(None)))
    if not has_default:
        cv.is_default = True


@router.get("/cvs", response_model=list[CvOut])
def list_cvs(user: Candidate, db: DB) -> list[CvOut]:
    return [cv_out(cv) for cv in db.scalars(_cv_query(user.id).order_by(Cv.is_default.desc(), Cv.updated_at.desc()))]


@router.post("/cvs", response_model=CvOut, status_code=status.HTTP_201_CREATED)
def create_cv(data: CvCreateIn, user: Candidate, db: DB) -> CvOut:
    """Tạo CV bằng form. Thông tin cá nhân trống thì lấy từ tài khoản."""
    content = data.content.model_dump()
    personal = content["personal"]
    personal["full_name"] = personal["full_name"] or user.full_name
    personal["email"] = personal["email"] or user.email
    personal["phone"] = personal["phone"] or (user.phone or "")
    cv = Cv(
        candidate_id=user.id, title=data.title, source="builder", content=content, template=data.template, parse_status="done"
    )
    _first_cv_becomes_default(db, user.id, cv)
    db.add(cv)
    db.flush()
    matching.refresh_cv_skills(db, cv)
    db.commit()
    return cv_out(_get_cv(db, user.id, cv.id), with_content=True)


@router.post("/cvs/upload", response_model=CvOut, status_code=status.HTTP_201_CREATED)
async def upload_cv(user: Candidate, db: DB, file: UploadFile = File(...), title: str | None = Form(default=None)) -> CvOut:
    settings = get_settings()
    filename = file.filename or "cv"
    ext = Path(filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Chỉ nhận file PDF hoặc DOCX")
    data = await file.read()
    if len(data) > settings.max_upload_mb * 1024 * 1024:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"File lớn hơn {settings.max_upload_mb} MB")

    folder = settings.upload_dir / "cvs" / str(user.id)
    folder.mkdir(parents=True, exist_ok=True)
    stored = folder / f"{uuid.uuid4().hex}{ext}"
    stored.write_bytes(data)

    cv = Cv(
        candidate_id=user.id,
        title=(title or Path(filename).stem)[:150],
        source="upload",
        file_path=str(stored.relative_to(settings.upload_dir)),
        file_name=filename[:255],
        file_size=len(data),
        mime_type=ALLOWED_EXTENSIONS[ext],
    )
    try:
        text = extract_text(data, filename)
        dictionary = get_dictionary(db)
        skill_names = [dictionary.names[i] for i in sorted(dictionary.extract(text))]
        cv.raw_text = text
        cv.content = parse_cv_text(text, skill_names)
        cv.parse_status = "done"
    except CvFileError as exc:
        cv.parse_status = "failed"
        cv.parse_error = str(exc)
    _first_cv_becomes_default(db, user.id, cv)
    db.add(cv)
    db.flush()
    if cv.parse_status == "done":
        matching.refresh_cv_skills(db, cv)
    db.commit()
    return cv_out(_get_cv(db, user.id, cv.id), with_content=True)


@router.get("/cvs/{cv_id}", response_model=CvOut)
def get_cv(cv_id: int, user: Candidate, db: DB) -> CvOut:
    return cv_out(_get_cv(db, user.id, cv_id), with_content=True)


@router.put("/cvs/{cv_id}", response_model=CvOut)
def update_cv(cv_id: int, data: CvUpdateIn, user: Candidate, db: DB) -> CvOut:
    cv = _get_cv(db, user.id, cv_id)
    if data.title is not None:
        cv.title = data.title
    if data.template is not None:
        cv.template = data.template
    if data.content is not None:
        cv.content = data.content.model_dump()
        cv.parse_status = "done"
        cv.parse_error = None
    if data.manual_skills is not None:
        dictionary = get_dictionary(db)
        ids = {sid for name in data.manual_skills if (sid := dictionary.resolve(name))}
        cv.skills = [s for s in cv.skills if s.source == "parsed" and s.skill_id not in ids] + [
            CvSkill(skill_id=sid, source="manual") for sid in sorted(ids)
        ]
    if data.content is not None:
        matching.refresh_cv_skills(db, cv)
    elif data.manual_skills is not None:
        cv.vector = None
    db.commit()
    return cv_out(_get_cv(db, user.id, cv.id), with_content=True)


@router.post("/cvs/{cv_id}/default", response_model=Message)
def set_default_cv(cv_id: int, user: Candidate, db: DB) -> Message:
    target = _get_cv(db, user.id, cv_id)
    for cv in db.scalars(select(Cv).where(Cv.candidate_id == user.id, Cv.is_default)):
        cv.is_default = False
    target.is_default = True
    db.commit()
    return Message(message=f'Đã đặt "{target.title}" làm CV chính')


@router.delete("/cvs/{cv_id}", response_model=Message)
def delete_cv(cv_id: int, user: Candidate, db: DB) -> Message:
    """Xóa mềm: CV đã dùng ứng tuyển vẫn còn cho nhà tuyển dụng xem."""
    cv = _get_cv(db, user.id, cv_id)
    cv.deleted_at = datetime.now()
    if cv.is_default:
        cv.is_default = False
        other = db.scalar(_cv_query(user.id).where(Cv.id != cv.id).order_by(Cv.updated_at.desc()))
        if other:
            other.is_default = True
    db.commit()
    return Message(message="Đã xóa CV")


@router.get("/cvs/{cv_id}/file")
def download_cv_file(cv_id: int, user: Candidate, db: DB) -> FileResponse:
    cv = _get_cv(db, user.id, cv_id)
    return cv_file_response(cv)


def cv_file_response(cv: Cv) -> FileResponse:
    if not cv.file_path:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "CV này tạo bằng form, không có file gốc")
    path = get_settings().upload_dir / cv.file_path
    if not path.exists():
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Không tìm thấy file CV trên máy chủ")
    return FileResponse(path, media_type=cv.mime_type, filename=cv.file_name)


# ---------------------------------------------------------------- chức năng 3: đánh giá CV


@router.post("/cvs/{cv_id}/evaluate", response_model=EvaluationOut)
def evaluate(cv_id: int, user: Candidate, db: DB, job_id: int | None = None) -> EvaluationOut:
    cv = _get_cv(db, user.id, cv_id)
    if not cv.content:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "CV chưa đọc được nội dung. Hãy mở CV và điền vào form trước.")
    requirement = None
    job = None
    if job_id is not None:
        job = db.scalar(select(Job).where(Job.id == job_id).options(selectinload(Job.skills).joinedload(JobSkill.skill)))
        if job is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Không tìm thấy tin tuyển dụng")
        requirement = JobRequirement(
            title=job.title,
            required=[s.skill.name for s in job.skills if s.is_required],
            preferred=[s.skill.name for s in job.skills if not s.is_required],
        )
    score, issues, sections = evaluate_cv(cv.content, get_setting(db, "cv_rules"), get_dictionary(db), requirement)
    row = CvEvaluation(cv_id=cv.id, job_id=job_id, overall_score=score, issues=issues)
    db.add(row)
    db.commit()
    return EvaluationOut(
        id=row.id,
        cv_id=cv.id,
        job_id=job_id,
        job_title=job.title if job else None,
        overall_score=score,
        issues=issues,
        sections=sections,
        created_at=row.created_at or datetime.now(),
    )


# ---------------------------------------------------------------- chức năng 1, 2: so khớp


@router.get("/matches", response_model=TopMatchesOut)
def top_matches(
    user: Candidate,
    db: DB,
    cv_id: int | None = None,
    city_id: int | None = None,
    category_id: int | None = None,
    salary_min: Decimal | None = None,
    limit: int | None = None,
) -> TopMatchesOut:
    """Top việc phù hợp nhất với CV (mặc định CV chính), có lọc cứng theo địa điểm, ngành, lương."""
    cv = _default_cv(db, user.id, cv_id)
    stmt = matching.open_jobs_query()
    if city_id:
        stmt = stmt.where(Job.city_id == city_id)
    if category_id:
        stmt = stmt.where(
            (Job.category_id == category_id) | Job.category_id.in_(select(Category.id).where(Category.parent_id == category_id))
        )
    if salary_min is not None:
        stmt = stmt.where(Job.salary_max >= salary_min)
    jobs = list(db.scalars(stmt.options(joinedload(Job.category))).unique())
    k = limit or int(get_setting(db, "top_k"))
    outcomes = matching.top_matches(db, cv, jobs, k)
    cv_skill_ids = {s.skill_id for s in cv.skills}
    return TopMatchesOut(
        cv=cv_out(cv),
        items=[match_out(o, cv_skill_ids) for o in outcomes],
        semantic_available=semantic.is_available() and any(o.semantic is not None for o in outcomes),
        segmenter=segmenter_name(),
    )


@router.get("/jobs/{job_id}/match", response_model=MatchOut)
def job_match(job_id: int, user: Candidate, db: DB, cv_id: int | None = None) -> MatchOut:
    """Phân tích độ phù hợp và kỹ năng còn thiếu của CV với một việc."""
    cv = _default_cv(db, user.id, cv_id)
    job = db.scalar(select(Job).where(Job.id == job_id).options(*job_load_options(), selectinload(Job.vector)))
    if job is None or job.status not in ("approved", "closed"):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Không tìm thấy tin tuyển dụng")
    outcome = matching.match_one(db, cv, job)
    return match_out(outcome, {s.skill_id for s in cv.skills})


# ---------------------------------------------------------------- ứng tuyển


def _application_query(user_id: int):
    return (
        select(Application)
        .where(Application.candidate_id == user_id)
        .options(
            joinedload(Application.job).options(*job_load_options()),
            joinedload(Application.cv),
            selectinload(Application.history),
        )
    )


@router.post("/applications", response_model=CandidateApplicationOut, status_code=status.HTTP_201_CREATED)
def apply(data: ApplicationIn, user: Candidate, db: DB) -> CandidateApplicationOut:
    job = db.scalar(select(Job).where(Job.id == data.job_id).options(*job_load_options(), selectinload(Job.vector)))
    if job is None or job.status != "approved" or job.deadline < date.today():
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Tin tuyển dụng đã đóng hoặc không còn nhận hồ sơ")
    cv = _get_cv(db, user.id, data.cv_id)
    if db.scalar(select(Application.id).where(Application.job_id == job.id, Application.candidate_id == user.id)):
        raise HTTPException(status.HTTP_409_CONFLICT, "Bạn đã ứng tuyển việc này rồi")

    outcome = matching.match_one(db, cv, job)
    app = Application(
        job_id=job.id,
        candidate_id=user.id,
        cv_id=cv.id,
        cover_letter=data.cover_letter,
        match_score=Decimal(str(outcome.score)),
        match_detail={
            "coverage": round(outcome.coverage, 4),
            "tfidf": round(outcome.tfidf, 4),
            "semantic": round(outcome.semantic, 4) if outcome.semantic is not None else None,
            "criteria": round(outcome.criteria, 4),
            "matched_skills": outcome.matched,
            "missing_skills": outcome.missing,
        },
    )
    app.history = [ApplicationStatusHistory(from_status=None, to_status="submitted", changed_by=user.id)]
    db.add(app)
    try:
        db.flush()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, "Bạn đã ứng tuyển việc này rồi") from None
    notify(
        db,
        job.company.owner_id,
        "new_application",
        "Có hồ sơ mới",
        f"{user.full_name} ứng tuyển {job.title}, điểm phù hợp {round(outcome.score)}.",
        f"/nha-tuyen-dung/tin/{job.id}/ung-vien",
    )
    db.commit()
    return candidate_application(db.scalar(_application_query(user.id).where(Application.id == app.id)))


@router.get("/applications", response_model=Page[CandidateApplicationOut])
def my_applications(
    user: Candidate,
    db: DB,
    page: PageParam = 1,
    size: SizeParam = 20,
    status_: Annotated[str | None, Query(alias="status")] = None,
) -> Page[CandidateApplicationOut]:
    stmt = _application_query(user.id).order_by(Application.applied_at.desc())
    if status_:
        stmt = stmt.where(Application.status == status_)
    items, total = paginate(db, stmt, page, size)
    return Page(items=[candidate_application(a) for a in items], total=total, page=page, size=size)


@router.get("/applications/{application_id}", response_model=CandidateApplicationOut)
def my_application(application_id: int, user: Candidate, db: DB) -> CandidateApplicationOut:
    app = db.scalar(_application_query(user.id).where(Application.id == application_id))
    if app is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Không tìm thấy hồ sơ ứng tuyển")
    return candidate_application(app)


@router.post("/applications/{application_id}/withdraw", response_model=CandidateApplicationOut)
def withdraw(application_id: int, user: Candidate, db: DB) -> CandidateApplicationOut:
    app = db.scalar(_application_query(user.id).where(Application.id == application_id))
    if app is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Không tìm thấy hồ sơ ứng tuyển")
    if app.status not in ("submitted", "viewed", "interview"):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Hồ sơ đã có kết quả, không rút được nữa")
    app.history.append(ApplicationStatusHistory(from_status=app.status, to_status="withdrawn", changed_by=user.id))
    app.status = "withdrawn"
    notify(
        db,
        app.job.company.owner_id,
        "application_status",
        "Ứng viên rút hồ sơ",
        f"{user.full_name} đã rút hồ sơ ứng tuyển {app.job.title}.",
        f"/nha-tuyen-dung/tin/{app.job_id}/ung-vien",
    )
    db.commit()
    return candidate_application(app)


# ---------------------------------------------------------------- việc đã lưu


@router.get("/saved-jobs", response_model=list[JobSummaryOut])
def saved_jobs(user: Candidate, db: DB) -> list[JobSummaryOut]:
    rows = db.scalars(
        select(SavedJob)
        .where(SavedJob.candidate_id == user.id)
        .order_by(SavedJob.created_at.desc())
        .options(joinedload(SavedJob.job).options(*job_load_options()))
    ).unique()
    return [job_summary(r.job) for r in rows]


@router.post("/saved-jobs/{job_id}", response_model=Message)
def save_job(job_id: int, user: Candidate, db: DB) -> Message:
    if db.get(Job, job_id) is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Không tìm thấy tin tuyển dụng")
    if db.get(SavedJob, (user.id, job_id)) is None:
        db.add(SavedJob(candidate_id=user.id, job_id=job_id))
        db.commit()
    return Message(message="Đã lưu việc")


@router.delete("/saved-jobs/{job_id}", response_model=Message)
def unsave_job(job_id: int, user: Candidate, db: DB) -> Message:
    row = db.get(SavedJob, (user.id, job_id))
    if row:
        db.delete(row)
        db.commit()
    return Message(message="Đã bỏ lưu")
