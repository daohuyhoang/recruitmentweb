from collections.abc import Callable
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.db import get_db
from app.models import Company, User

bearer = HTTPBearer(auto_error=False)

DB = Annotated[Session, Depends(get_db)]


def _user_from_token(db: Session, credentials: HTTPAuthorizationCredentials | None) -> User | None:
    if credentials is None:
        return None
    user_id = decode_access_token(credentials.credentials)
    if user_id is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại")
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Tài khoản không còn tồn tại")
    if user.status == "locked":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Tài khoản đã bị khóa")
    return user


def get_current_user(db: DB, credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer)]) -> User:
    user = _user_from_token(db, credentials)
    if user is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Bạn cần đăng nhập")
    return user


def get_optional_user(db: DB, credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer)]) -> User | None:
    try:
        return _user_from_token(db, credentials)
    except HTTPException:
        return None


CurrentUser = Annotated[User, Depends(get_current_user)]
OptionalUser = Annotated[User | None, Depends(get_optional_user)]


def require_role(role: str) -> Callable[[User], User]:
    def checker(user: CurrentUser) -> User:
        if user.role != role:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Bạn không có quyền dùng chức năng này")
        return user

    return checker


Candidate = Annotated[User, Depends(require_role("candidate"))]
Employer = Annotated[User, Depends(require_role("employer"))]
Admin = Annotated[User, Depends(require_role("admin"))]


def employer_company(db: Session, user: User) -> Company:
    company = db.query(Company).filter(Company.owner_id == user.id).one_or_none()
    if company is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Tài khoản chưa có thông tin công ty")
    return company


def ensure_active_employer(user: User) -> None:
    if user.status != "active":
        raise HTTPException(
            status.HTTP_403_FORBIDDEN, "Tài khoản nhà tuyển dụng đang chờ duyệt. Bạn sẽ đăng tin được sau khi admin duyệt."
        )
