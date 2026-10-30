"""Model SQLAlchemy, khớp với database/schema.sql (schema.sql là bản gốc).

Cột ENUM trong MySQL được ánh xạ thành str; giá trị hợp lệ do database kiểm tra
và do các kiểu Literal trong app/schemas.py giới hạn ở tầng API.
"""

from datetime import date, datetime
from decimal import Decimal
from typing import Any

from sqlalchemy import JSON, BigInteger, Boolean, Date, DateTime, ForeignKey, Integer, Numeric, SmallInteger, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


def created_col() -> Mapped[datetime]:
    return mapped_column(DateTime, server_default=func.now())


def updated_col() -> Mapped[datetime]:
    return mapped_column(DateTime, server_default=func.now(), onupdate=func.now())


# ---------------------------------------------------------------- danh mục


class City(Base):
    __tablename__ = "cities"
    id: Mapped[int] = mapped_column(SmallInteger, primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    slug: Mapped[str] = mapped_column(String(100), unique=True)
    sort_order: Mapped[int] = mapped_column(SmallInteger, default=0)


class Category(Base):
    __tablename__ = "categories"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    parent_id: Mapped[int | None] = mapped_column(ForeignKey("categories.id"))
    name: Mapped[str] = mapped_column(String(150))
    slug: Mapped[str] = mapped_column(String(150), unique=True)
    description: Mapped[str | None] = mapped_column(String(500))
    icon: Mapped[str | None] = mapped_column(String(50))
    sort_order: Mapped[int] = mapped_column(SmallInteger, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = created_col()
    updated_at: Mapped[datetime] = updated_col()

    parent: Mapped["Category | None"] = relationship(remote_side="Category.id", back_populates="children")
    children: Mapped[list["Category"]] = relationship(back_populates="parent", order_by="Category.sort_order")


class Skill(Base):
    __tablename__ = "skills"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(100), unique=True)
    slug: Mapped[str] = mapped_column(String(100), unique=True)
    skill_type: Mapped[str] = mapped_column(String(20), default="hard")
    category_id: Mapped[int | None] = mapped_column(ForeignKey("categories.id"))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = created_col()
    updated_at: Mapped[datetime] = updated_col()

    aliases: Mapped[list["SkillAlias"]] = relationship(
        back_populates="skill", cascade="all, delete-orphan", order_by="SkillAlias.alias"
    )


class SkillAlias(Base):
    __tablename__ = "skill_aliases"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    skill_id: Mapped[int] = mapped_column(ForeignKey("skills.id", ondelete="CASCADE"))
    alias: Mapped[str] = mapped_column(String(100), unique=True)

    skill: Mapped[Skill] = relationship(back_populates="aliases")


class AppSetting(Base):
    __tablename__ = "app_settings"
    setting_key: Mapped[str] = mapped_column(String(100), primary_key=True)
    setting_value: Mapped[Any] = mapped_column(JSON)
    description: Mapped[str | None] = mapped_column(String(255))
    updated_at: Mapped[datetime] = updated_col()


# ---------------------------------------------------------------- tài khoản


class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    full_name: Mapped[str] = mapped_column(String(150))
    phone: Mapped[str | None] = mapped_column(String(20))
    avatar_url: Mapped[str | None] = mapped_column(String(500))
    role: Mapped[str] = mapped_column(String(20))
    status: Mapped[str] = mapped_column(String(20), default="active")
    locked_reason: Mapped[str | None] = mapped_column(String(500))
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime)
    created_at: Mapped[datetime] = created_col()
    updated_at: Mapped[datetime] = updated_col()

    profile: Mapped["CandidateProfile | None"] = relationship(back_populates="user", uselist=False)
    company: Mapped["Company | None"] = relationship(back_populates="owner", uselist=False)


class CandidateProfile(Base):
    __tablename__ = "candidate_profiles"
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    headline: Mapped[str | None] = mapped_column(String(200))
    date_of_birth: Mapped[date | None] = mapped_column(Date)
    gender: Mapped[str | None] = mapped_column(String(10))
    address: Mapped[str | None] = mapped_column(String(255))
    city_id: Mapped[int | None] = mapped_column(ForeignKey("cities.id"))
    desired_category_id: Mapped[int | None] = mapped_column(ForeignKey("categories.id"))
    desired_salary_min: Mapped[Decimal | None] = mapped_column(Numeric(6, 1))
    desired_salary_max: Mapped[Decimal | None] = mapped_column(Numeric(6, 1))
    years_of_experience: Mapped[Decimal | None] = mapped_column(Numeric(3, 1))
    education_level: Mapped[str | None] = mapped_column(String(20))
    summary: Mapped[str | None] = mapped_column(Text)
    is_searchable: Mapped[bool] = mapped_column(Boolean, default=True)
    updated_at: Mapped[datetime] = updated_col()

    user: Mapped[User] = relationship(back_populates="profile")
    city: Mapped[City | None] = relationship()


class Company(Base):
    __tablename__ = "companies"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True)
    name: Mapped[str] = mapped_column(String(255))
    slug: Mapped[str] = mapped_column(String(255), unique=True)
    tax_code: Mapped[str | None] = mapped_column(String(20), unique=True)
    logo_url: Mapped[str | None] = mapped_column(String(500))
    website: Mapped[str | None] = mapped_column(String(255))
    email: Mapped[str | None] = mapped_column(String(255))
    phone: Mapped[str | None] = mapped_column(String(20))
    address: Mapped[str | None] = mapped_column(String(255))
    city_id: Mapped[int | None] = mapped_column(ForeignKey("cities.id"))
    company_size: Mapped[str | None] = mapped_column(String(10))
    description: Mapped[str | None] = mapped_column(Text)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = created_col()
    updated_at: Mapped[datetime] = updated_col()

    owner: Mapped[User] = relationship(back_populates="company")
    city: Mapped[City | None] = relationship()


# ---------------------------------------------------------------- tin tuyển dụng


class Job(Base):
    __tablename__ = "jobs"
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    company_id: Mapped[int] = mapped_column(ForeignKey("companies.id", ondelete="CASCADE"))
    created_by: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    category_id: Mapped[int] = mapped_column(ForeignKey("categories.id"))
    title: Mapped[str] = mapped_column(String(255))
    slug: Mapped[str] = mapped_column(String(300), unique=True)
    description: Mapped[str] = mapped_column(Text)
    requirements: Mapped[str] = mapped_column(Text)
    benefits: Mapped[str | None] = mapped_column(Text)
    city_id: Mapped[int] = mapped_column(ForeignKey("cities.id"))
    address: Mapped[str | None] = mapped_column(String(255))
    employment_type: Mapped[str] = mapped_column(String(20), default="full_time")
    work_mode: Mapped[str] = mapped_column(String(10), default="onsite")
    experience_min_years: Mapped[Decimal] = mapped_column(Numeric(3, 1), default=0)
    experience_max_years: Mapped[Decimal | None] = mapped_column(Numeric(3, 1))
    education_level: Mapped[str] = mapped_column(String(20), default="none")
    salary_min: Mapped[Decimal | None] = mapped_column(Numeric(6, 1))
    salary_max: Mapped[Decimal | None] = mapped_column(Numeric(6, 1))
    vacancies: Mapped[int] = mapped_column(SmallInteger, default=1)
    deadline: Mapped[date] = mapped_column(Date)
    status: Mapped[str] = mapped_column(String(10), default="pending")
    rejection_reason: Mapped[str | None] = mapped_column(String(500))
    reviewed_by: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime)
    published_at: Mapped[datetime | None] = mapped_column(DateTime)
    closed_at: Mapped[datetime | None] = mapped_column(DateTime)
    view_count: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = created_col()
    updated_at: Mapped[datetime] = updated_col()

    company: Mapped[Company] = relationship()
    category: Mapped[Category] = relationship()
    city: Mapped[City] = relationship()
    skills: Mapped[list["JobSkill"]] = relationship(
        back_populates="job", cascade="all, delete-orphan", order_by="(JobSkill.is_required.desc(), JobSkill.skill_id)"
    )
    vector: Mapped["JobVector | None"] = relationship(cascade="all, delete-orphan", uselist=False)


class JobSkill(Base):
    __tablename__ = "job_skills"
    job_id: Mapped[int] = mapped_column(ForeignKey("jobs.id", ondelete="CASCADE"), primary_key=True)
    skill_id: Mapped[int] = mapped_column(ForeignKey("skills.id"), primary_key=True)
    is_required: Mapped[bool] = mapped_column(Boolean, default=True)

    job: Mapped[Job] = relationship(back_populates="skills")
    skill: Mapped[Skill] = relationship(lazy="joined")


class JobVector(Base):
    __tablename__ = "job_vectors"
    job_id: Mapped[int] = mapped_column(ForeignKey("jobs.id", ondelete="CASCADE"), primary_key=True)
    segmented_text: Mapped[str] = mapped_column(Text)
    embedding: Mapped[list[float] | None] = mapped_column(JSON)
    embedding_model: Mapped[str | None] = mapped_column(String(150))
    updated_at: Mapped[datetime] = updated_col()


# ---------------------------------------------------------------- CV


class Cv(Base):
    __tablename__ = "cvs"
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    candidate_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    title: Mapped[str] = mapped_column(String(150))
    source: Mapped[str] = mapped_column(String(10))
    file_path: Mapped[str | None] = mapped_column(String(500))
    file_name: Mapped[str | None] = mapped_column(String(255))
    file_size: Mapped[int | None] = mapped_column(Integer)
    mime_type: Mapped[str | None] = mapped_column(String(100))
    raw_text: Mapped[str | None] = mapped_column(Text)
    content: Mapped[dict[str, Any] | None] = mapped_column(JSON)
    template: Mapped[str] = mapped_column(String(50), default="classic")
    parse_status: Mapped[str] = mapped_column(String(10), default="pending")
    parse_error: Mapped[str | None] = mapped_column(String(500))
    is_default: Mapped[bool] = mapped_column(Boolean, default=False)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime)
    created_at: Mapped[datetime] = created_col()
    updated_at: Mapped[datetime] = updated_col()

    candidate: Mapped[User] = relationship()
    skills: Mapped[list["CvSkill"]] = relationship(back_populates="cv", cascade="all, delete-orphan")
    vector: Mapped["CvVector | None"] = relationship(cascade="all, delete-orphan", uselist=False)


class CvSkill(Base):
    __tablename__ = "cv_skills"
    cv_id: Mapped[int] = mapped_column(ForeignKey("cvs.id", ondelete="CASCADE"), primary_key=True)
    skill_id: Mapped[int] = mapped_column(ForeignKey("skills.id"), primary_key=True)
    source: Mapped[str] = mapped_column(String(10), default="parsed")

    cv: Mapped[Cv] = relationship(back_populates="skills")
    skill: Mapped[Skill] = relationship(lazy="joined")


class CvVector(Base):
    __tablename__ = "cv_vectors"
    cv_id: Mapped[int] = mapped_column(ForeignKey("cvs.id", ondelete="CASCADE"), primary_key=True)
    segmented_text: Mapped[str] = mapped_column(Text)
    embedding: Mapped[list[float] | None] = mapped_column(JSON)
    embedding_model: Mapped[str | None] = mapped_column(String(150))
    updated_at: Mapped[datetime] = updated_col()


class CvEvaluation(Base):
    __tablename__ = "cv_evaluations"
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    cv_id: Mapped[int] = mapped_column(ForeignKey("cvs.id", ondelete="CASCADE"))
    job_id: Mapped[int | None] = mapped_column(ForeignKey("jobs.id", ondelete="SET NULL"))
    overall_score: Mapped[int] = mapped_column(SmallInteger)
    issues: Mapped[list[dict[str, Any]]] = mapped_column(JSON)
    created_at: Mapped[datetime] = created_col()


# ---------------------------------------------------------------- so khớp


class MatchResult(Base):
    __tablename__ = "match_results"
    cv_id: Mapped[int] = mapped_column(ForeignKey("cvs.id", ondelete="CASCADE"), primary_key=True)
    job_id: Mapped[int] = mapped_column(ForeignKey("jobs.id", ondelete="CASCADE"), primary_key=True)
    total_score: Mapped[Decimal] = mapped_column(Numeric(5, 2))
    coverage_score: Mapped[Decimal] = mapped_column(Numeric(5, 4))
    tfidf_score: Mapped[Decimal] = mapped_column(Numeric(5, 4))
    semantic_score: Mapped[Decimal | None] = mapped_column(Numeric(5, 4))
    criteria_score: Mapped[Decimal] = mapped_column(Numeric(5, 4))
    matched_skills: Mapped[list[int]] = mapped_column(JSON)
    missing_skills: Mapped[list[int]] = mapped_column(JSON)
    computed_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())


class RelevanceLabel(Base):
    __tablename__ = "relevance_labels"
    cv_id: Mapped[int] = mapped_column(ForeignKey("cvs.id", ondelete="CASCADE"), primary_key=True)
    job_id: Mapped[int] = mapped_column(ForeignKey("jobs.id", ondelete="CASCADE"), primary_key=True)
    relevance: Mapped[int] = mapped_column(SmallInteger)
    labeled_by: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    created_at: Mapped[datetime] = created_col()


# ---------------------------------------------------------------- ứng tuyển


class Application(Base):
    __tablename__ = "applications"
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    job_id: Mapped[int] = mapped_column(ForeignKey("jobs.id", ondelete="CASCADE"))
    candidate_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    cv_id: Mapped[int] = mapped_column(ForeignKey("cvs.id"))
    cover_letter: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(10), default="submitted")
    match_score: Mapped[Decimal | None] = mapped_column(Numeric(5, 2))
    match_detail: Mapped[dict[str, Any] | None] = mapped_column(JSON)
    employer_note: Mapped[str | None] = mapped_column(Text)
    interview_at: Mapped[datetime | None] = mapped_column(DateTime)
    applied_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = updated_col()

    job: Mapped[Job] = relationship()
    candidate: Mapped[User] = relationship()
    cv: Mapped[Cv] = relationship()
    history: Mapped[list["ApplicationStatusHistory"]] = relationship(
        back_populates="application", cascade="all, delete-orphan", order_by="ApplicationStatusHistory.created_at"
    )


class ApplicationStatusHistory(Base):
    __tablename__ = "application_status_history"
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    application_id: Mapped[int] = mapped_column(ForeignKey("applications.id", ondelete="CASCADE"))
    from_status: Mapped[str | None] = mapped_column(String(10))
    to_status: Mapped[str] = mapped_column(String(10))
    changed_by: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    note: Mapped[str | None] = mapped_column(String(500))
    created_at: Mapped[datetime] = created_col()

    application: Mapped[Application] = relationship(back_populates="history")


class SavedJob(Base):
    __tablename__ = "saved_jobs"
    candidate_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    job_id: Mapped[int] = mapped_column(ForeignKey("jobs.id", ondelete="CASCADE"), primary_key=True)
    created_at: Mapped[datetime] = created_col()

    job: Mapped[Job] = relationship()


class Notification(Base):
    __tablename__ = "notifications"
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    type: Mapped[str] = mapped_column(String(30))
    title: Mapped[str] = mapped_column(String(255))
    message: Mapped[str | None] = mapped_column(String(1000))
    link: Mapped[str | None] = mapped_column(String(500))
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = created_col()
