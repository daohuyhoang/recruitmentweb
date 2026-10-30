import re
import unicodedata
from datetime import datetime

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.api.deps import DB, CurrentUser
from app.core.security import create_access_token, hash_password, verify_password
from app.models import CandidateProfile, Company, User
from app.schemas import AccountIn, ChangePasswordIn, LoginIn, Message, RegisterIn, TokenOut, UserOut
from app.services.notify import notify

router = APIRouter(prefix="/auth", tags=["Tài khoản"])


def slugify(text: str) -> str:
    text = text.replace("đ", "d").replace("Đ", "D")
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", "-", text).strip("-") or "cong-ty"


def unique_slug(db: DB, model, base: str) -> str:
    slug, n = base, 2
    while db.scalar(select(model.id).where(model.slug == slug)):
        slug, n = f"{base}-{n}", n + 1
    return slug


@router.post("/register", response_model=TokenOut, status_code=status.HTTP_201_CREATED)
def register(data: RegisterIn, db: DB) -> TokenOut:
    email = data.email.lower()
    if db.scalar(select(User.id).where(User.email == email)):
        raise HTTPException(status.HTTP_409_CONFLICT, "Email này đã được đăng ký")
    if data.tax_code and db.scalar(select(Company.id).where(Company.tax_code == data.tax_code)):
        raise HTTPException(status.HTTP_409_CONFLICT, "Mã số thuế đã được công ty khác đăng ký")

    user = User(
        email=email,
        password_hash=hash_password(data.password),
        full_name=data.full_name.strip(),
        phone=data.phone,
        role=data.role,
        # Nhà tuyển dụng phải chờ admin duyệt mới được đăng tin
        status="pending" if data.role == "employer" else "active",
    )
    db.add(user)
    db.flush()
    if data.role == "candidate":
        db.add(CandidateProfile(user_id=user.id))
    else:
        name = (data.company_name or "").strip()
        db.add(Company(owner_id=user.id, name=name, slug=unique_slug(db, Company, slugify(name)), tax_code=data.tax_code))
        for admin_id in db.scalars(select(User.id).where(User.role == "admin")):
            notify(
                db,
                admin_id,
                "system",
                "Có nhà tuyển dụng chờ duyệt",
                f"{name} vừa đăng ký tài khoản.",
                "/admin/tai-khoan?trang-thai=pending",
            )
    user.last_login_at = datetime.now()
    db.commit()
    db.refresh(user)
    return TokenOut(access_token=create_access_token(user.id, user.role), user=UserOut.model_validate(user))


@router.post("/login", response_model=TokenOut)
def login(data: LoginIn, db: DB) -> TokenOut:
    user = db.scalar(select(User).where(User.email == data.email.lower()))
    if user is None or not verify_password(data.password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Email hoặc mật khẩu không đúng")
    if user.status == "locked":
        reason = f" Lý do: {user.locked_reason}" if user.locked_reason else ""
        raise HTTPException(status.HTTP_403_FORBIDDEN, f"Tài khoản đã bị khóa.{reason}")
    user.last_login_at = datetime.now()
    db.commit()
    return TokenOut(access_token=create_access_token(user.id, user.role), user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut)
def me(user: CurrentUser) -> User:
    return user


@router.put("/me", response_model=UserOut)
def update_me(data: AccountIn, user: CurrentUser, db: DB) -> User:
    user.full_name = data.full_name.strip()
    user.phone = data.phone
    db.commit()
    return user


@router.post("/change-password", response_model=Message)
def change_password(data: ChangePasswordIn, user: CurrentUser, db: DB) -> Message:
    if not verify_password(data.current_password, user.password_hash):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Mật khẩu hiện tại không đúng")
    user.password_hash = hash_password(data.new_password)
    db.commit()
    return Message(message="Đã đổi mật khẩu")
