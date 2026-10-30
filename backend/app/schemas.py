"""Dữ liệu vào/ra của API. Tên trường tiếng Anh; nội dung hiển thị do frontend lo."""

from datetime import date, datetime
from decimal import Decimal
from typing import Any, Generic, Literal, TypeVar

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator

T = TypeVar("T")

Role = Literal["candidate", "employer", "admin"]
UserStatus = Literal["active", "pending", "locked"]
EmploymentType = Literal["full_time", "part_time", "internship", "contract"]
WorkMode = Literal["onsite", "remote", "hybrid"]
EducationLevel = Literal["none", "high_school", "college", "university", "master", "doctor"]
JobStatus = Literal["draft", "pending", "approved", "rejected", "closed"]
ApplicationStatus = Literal["submitted", "viewed", "interview", "accepted", "rejected", "withdrawn"]
CompanySize = Literal["1-10", "11-50", "51-200", "201-500", "500+"]


class ORM(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class Page(BaseModel, Generic[T]):
    items: list[T]
    total: int
    page: int
    size: int


class Message(BaseModel):
    message: str


# ---------------------------------------------------------------- danh mục


class CityOut(ORM):
    id: int
    name: str
    slug: str


class CategoryOut(ORM):
    id: int
    parent_id: int | None
    name: str
    slug: str
    description: str | None = None
    icon: str | None = None
    sort_order: int = 0
    is_active: bool = True
    open_jobs: int = 0
    children: list["CategoryOut"] = []


class CategoryIn(BaseModel):
    parent_id: int | None = None
    name: str = Field(min_length=2, max_length=150)
    description: str | None = Field(default=None, max_length=500)
    icon: str | None = Field(default=None, max_length=50)
    sort_order: int = 0
    is_active: bool = True


class SkillOut(ORM):
    id: int
    name: str
    slug: str
    skill_type: str
    category_id: int | None
    is_active: bool
    aliases: list[str] = []
    usage_count: int = 0


class SkillIn(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    skill_type: Literal["hard", "soft", "language", "tool"] = "hard"
    category_id: int | None = None
    is_active: bool = True
    aliases: list[str] = []


# ---------------------------------------------------------------- tài khoản


class CompanyBrief(ORM):
    id: int
    name: str
    slug: str
    logo_url: str | None = None
    is_verified: bool = False


class UserOut(ORM):
    id: int
    email: str
    full_name: str
    phone: str | None
    avatar_url: str | None
    role: Role
    status: UserStatus
    created_at: datetime
    company: CompanyBrief | None = None


class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)
    full_name: str = Field(min_length=2, max_length=150)
    phone: str | None = Field(default=None, max_length=20)
    role: Literal["candidate", "employer"]
    company_name: str | None = Field(default=None, max_length=255)
    tax_code: str | None = Field(default=None, max_length=20)

    @model_validator(mode="after")
    def employer_needs_company(self) -> "RegisterIn":
        if self.role == "employer" and not (self.company_name or "").strip():
            raise ValueError("Nhà tuyển dụng cần nhập tên công ty")
        return self


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class AccountIn(BaseModel):
    full_name: str = Field(min_length=2, max_length=150)
    phone: str | None = Field(default=None, max_length=20)


class ChangePasswordIn(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8, max_length=72)


class ProfileIn(BaseModel):
    headline: str | None = Field(default=None, max_length=200)
    date_of_birth: date | None = None
    gender: Literal["male", "female", "other"] | None = None
    address: str | None = Field(default=None, max_length=255)
    city_id: int | None = None
    desired_category_id: int | None = None
    desired_salary_min: Decimal | None = Field(default=None, ge=0)
    desired_salary_max: Decimal | None = Field(default=None, ge=0)
    years_of_experience: Decimal | None = Field(default=None, ge=0, le=60)
    education_level: EducationLevel | None = None
    summary: str | None = None
    is_searchable: bool = True

    @model_validator(mode="after")
    def salary_range(self) -> "ProfileIn":
        if self.desired_salary_min and self.desired_salary_max and self.desired_salary_max < self.desired_salary_min:
            raise ValueError("Lương mong muốn tối đa phải lớn hơn hoặc bằng mức tối thiểu")
        return self


class ProfileOut(ProfileIn, ORM):
    user_id: int
    city: CityOut | None = None


class CompanyIn(BaseModel):
    name: str = Field(min_length=2, max_length=255)
    tax_code: str | None = Field(default=None, max_length=20)
    logo_url: str | None = Field(default=None, max_length=500)
    website: str | None = Field(default=None, max_length=255)
    email: EmailStr | None = None
    phone: str | None = Field(default=None, max_length=20)
    address: str | None = Field(default=None, max_length=255)
    city_id: int | None = None
    company_size: CompanySize | None = None
    description: str | None = None


class CompanyOut(CompanyIn, ORM):
    id: int
    slug: str
    is_verified: bool
    city: CityOut | None = None
    email: str | None = None
    open_jobs: int = 0


# ---------------------------------------------------------------- tin tuyển dụng


class JobSkillOut(BaseModel):
    skill_id: int
    name: str
    required: bool


class CategoryBrief(ORM):
    id: int
    name: str
    parent_id: int | None


class JobSummaryOut(BaseModel):
    id: int
    slug: str
    title: str
    company: CompanyBrief
    category: CategoryBrief
    city: CityOut
    employment_type: EmploymentType
    work_mode: WorkMode
    salary_min: Decimal | None
    salary_max: Decimal | None
    experience_min_years: Decimal
    experience_max_years: Decimal | None
    deadline: date
    published_at: datetime | None
    status: JobStatus
    skills: list[JobSkillOut]


class JobDetailOut(JobSummaryOut):
    description: str
    requirements: str
    benefits: str | None
    address: str | None
    education_level: EducationLevel
    vacancies: int
    view_count: int
    rejection_reason: str | None = None
    created_at: datetime
    application_count: int | None = None
    is_saved: bool | None = None
    application_id: int | None = None


class JobSkillIn(BaseModel):
    skill_id: int | None = None
    name: str | None = None  # tên kỹ năng; được ánh xạ qua từ điển nếu không có skill_id
    required: bool = True


class JobIn(BaseModel):
    title: str = Field(min_length=5, max_length=255)
    category_id: int
    description: str = Field(min_length=30)
    requirements: str = Field(min_length=20)
    benefits: str | None = None
    city_id: int
    address: str | None = Field(default=None, max_length=255)
    employment_type: EmploymentType = "full_time"
    work_mode: WorkMode = "onsite"
    experience_min_years: Decimal = Field(default=Decimal(0), ge=0, le=30)
    experience_max_years: Decimal | None = Field(default=None, ge=0, le=40)
    education_level: EducationLevel = "none"
    salary_min: Decimal | None = Field(default=None, ge=0)
    salary_max: Decimal | None = Field(default=None, ge=0)
    vacancies: int = Field(default=1, ge=1, le=1000)
    deadline: date
    skills: list[JobSkillIn] = Field(min_length=1)
    submit: bool = True  # False = lưu nháp, True = gửi duyệt

    @model_validator(mode="after")
    def check_ranges(self) -> "JobIn":
        if self.salary_min is not None and self.salary_max is not None and self.salary_max < self.salary_min:
            raise ValueError("Lương tối đa phải lớn hơn hoặc bằng lương tối thiểu")
        if self.experience_max_years is not None and self.experience_max_years < self.experience_min_years:
            raise ValueError("Số năm kinh nghiệm tối đa phải lớn hơn hoặc bằng tối thiểu")
        if self.submit and self.deadline < date.today():
            raise ValueError("Hạn nộp phải từ hôm nay trở đi")
        return self


class JobReviewIn(BaseModel):
    action: Literal["approve", "reject"]
    reason: str | None = Field(default=None, max_length=500)

    @model_validator(mode="after")
    def reason_required(self) -> "JobReviewIn":
        if self.action == "reject" and not (self.reason or "").strip():
            raise ValueError("Cần ghi lý do từ chối để nhà tuyển dụng sửa")
        return self


# ---------------------------------------------------------------- CV


class CvPersonal(BaseModel):
    full_name: str = ""
    email: str = ""
    phone: str = ""
    address: str = ""
    headline: str = ""


class CvExperience(BaseModel):
    company: str = ""
    position: str = ""
    start: str | None = None  # yyyy-mm
    end: str | None = None  # None = hiện tại
    description: str = ""


class CvEducation(BaseModel):
    school: str = ""
    major: str = ""
    degree: str = ""
    start: str | None = None
    end: str | None = None
    gpa: str | None = None


class CvProject(BaseModel):
    name: str = ""
    role: str = ""
    start: str | None = None
    end: str | None = None
    description: str = ""
    link: str | None = None


class CvCertificate(BaseModel):
    name: str = ""
    issuer: str = ""
    year: int | None = None


class CvContent(BaseModel):
    personal: CvPersonal = CvPersonal()
    objective: str = ""
    experiences: list[CvExperience] = []
    educations: list[CvEducation] = []
    projects: list[CvProject] = []
    certificates: list[CvCertificate] = []
    skills: list[str] = []
    strengths: str = ""


class CvSkillOut(BaseModel):
    skill_id: int
    name: str
    source: Literal["parsed", "manual"]


class CvOut(BaseModel):
    id: int
    title: str
    source: Literal["upload", "builder"]
    file_name: str | None
    file_size: int | None
    template: str
    parse_status: Literal["pending", "done", "failed"]
    parse_error: str | None
    is_default: bool
    created_at: datetime
    updated_at: datetime
    skills: list[CvSkillOut]
    content: CvContent | None = None


class CvCreateIn(BaseModel):
    title: str = Field(min_length=2, max_length=150)
    content: CvContent = CvContent()
    template: str = "classic"


class CvUpdateIn(BaseModel):
    title: str | None = Field(default=None, min_length=2, max_length=150)
    content: CvContent | None = None
    template: str | None = None
    manual_skills: list[str] | None = None  # thay toàn bộ kỹ năng tự thêm


class CvIssue(BaseModel):
    code: str
    section: str
    severity: Literal["high", "medium", "low"]
    message: str
    suggestion: str
    field: str | None = None


class EvaluationOut(BaseModel):
    id: int
    cv_id: int
    job_id: int | None
    job_title: str | None = None
    overall_score: int
    issues: list[CvIssue]
    sections: dict[str, Literal["ok", "warning", "missing"]]
    created_at: datetime


# ---------------------------------------------------------------- so khớp


class MatchComponents(BaseModel):
    coverage: float
    tfidf: float
    semantic: float | None
    criteria: float


class MatchSkill(BaseModel):
    skill_id: int
    name: str
    required: bool
    matched: bool


class MatchOut(BaseModel):
    job: JobSummaryOut
    score: float
    components: MatchComponents
    weights: dict[str, float]
    criteria_detail: dict[str, float]
    skills: list[MatchSkill]
    required_met: int
    required_total: int


class TopMatchesOut(BaseModel):
    cv: CvOut
    items: list[MatchOut]
    semantic_available: bool
    segmenter: str


# ---------------------------------------------------------------- ứng tuyển


class ApplicationIn(BaseModel):
    job_id: int
    cv_id: int
    cover_letter: str | None = Field(default=None, max_length=3000)


class StatusHistoryOut(ORM):
    from_status: ApplicationStatus | None
    to_status: ApplicationStatus
    note: str | None
    created_at: datetime


class CvBrief(ORM):
    id: int
    title: str
    source: str
    file_name: str | None


class CandidateApplicationOut(BaseModel):
    id: int
    job: JobSummaryOut
    cv: CvBrief
    status: ApplicationStatus
    match_score: Decimal | None
    cover_letter: str | None
    interview_at: datetime | None
    applied_at: datetime
    updated_at: datetime
    history: list[StatusHistoryOut]


class ApplicantBrief(BaseModel):
    id: int
    full_name: str
    email: str
    phone: str | None
    headline: str | None
    city: str | None
    years_of_experience: Decimal | None


class EmployerApplicationOut(BaseModel):
    id: int
    job_id: int
    job_title: str
    candidate: ApplicantBrief
    cv: CvBrief
    status: ApplicationStatus
    match_score: Decimal | None
    match_detail: dict[str, Any] | None
    cover_letter: str | None
    employer_note: str | None
    interview_at: datetime | None
    applied_at: datetime
    history: list[StatusHistoryOut]


class StatusUpdateIn(BaseModel):
    status: Literal["viewed", "interview", "accepted", "rejected"]
    note: str | None = Field(default=None, max_length=500)
    interview_at: datetime | None = None

    @field_validator("interview_at")
    @classmethod
    def strip_tz(cls, v: datetime | None) -> datetime | None:
        return v.replace(tzinfo=None) if v else v


class EmployerNoteIn(BaseModel):
    employer_note: str | None = Field(default=None, max_length=3000)


class NotificationOut(ORM):
    id: int
    type: str
    title: str
    message: str | None
    link: str | None
    is_read: bool
    created_at: datetime


# ---------------------------------------------------------------- admin


class AdminUserOut(UserOut):
    locked_reason: str | None
    last_login_at: datetime | None


class UserStatusIn(BaseModel):
    status: UserStatus
    reason: str | None = Field(default=None, max_length=500)


class SettingsIn(BaseModel):
    match_weights: dict[str, float] | None = None
    skill_weights: dict[str, float] | None = None
    top_k: int | None = Field(default=None, ge=1, le=50)
    cv_rules: dict[str, Any] | None = None

    @field_validator("match_weights")
    @classmethod
    def check_weights(cls, v: dict[str, float] | None) -> dict[str, float] | None:
        if v is None:
            return v
        if set(v) != {"coverage", "tfidf", "semantic", "criteria"}:
            raise ValueError("Cần đủ 4 trọng số: coverage, tfidf, semantic, criteria")
        if any(w < 0 for w in v.values()) or abs(sum(v.values()) - 1) > 0.001:
            raise ValueError("Trọng số không âm và có tổng bằng 1")
        return v


class CountItem(BaseModel):
    label: str
    value: int


class AdminStatsOut(BaseModel):
    total_candidates: int
    total_employers: int
    pending_employers: int
    total_jobs: int
    pending_jobs: int
    open_jobs: int
    total_applications: int
    applications_last_30_days: int
    applications_by_day: list[CountItem]
    jobs_by_category: list[CountItem]
    top_skills: list[CountItem]
    applications_by_status: list[CountItem]


class EmployerStatsOut(BaseModel):
    open_jobs: int
    pending_jobs: int
    total_applications: int
    new_applications: int
    interviews: int
    applications_by_status: list[CountItem]
