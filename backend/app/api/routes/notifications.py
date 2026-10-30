from fastapi import APIRouter
from sqlalchemy import func, select, update

from app.api.deps import DB, CurrentUser
from app.models import Notification
from app.schemas import Message, NotificationOut

router = APIRouter(prefix="/notifications", tags=["Thông báo"])


@router.get("", response_model=list[NotificationOut])
def list_notifications(user: CurrentUser, db: DB, limit: int = 30) -> list[Notification]:
    stmt = (
        select(Notification)
        .where(Notification.user_id == user.id)
        .order_by(Notification.created_at.desc())
        .limit(min(limit, 100))
    )
    return list(db.scalars(stmt))


@router.get("/unread-count")
def unread_count(user: CurrentUser, db: DB) -> dict[str, int]:
    count = db.scalar(
        select(func.count()).select_from(Notification).where(Notification.user_id == user.id, ~Notification.is_read)
    )
    return {"count": count or 0}


@router.post("/{notification_id}/read", response_model=Message)
def mark_read(notification_id: int, user: CurrentUser, db: DB) -> Message:
    db.execute(
        update(Notification).where(Notification.id == notification_id, Notification.user_id == user.id).values(is_read=True)
    )
    db.commit()
    return Message(message="Đã đánh dấu đã đọc")


@router.post("/read-all", response_model=Message)
def mark_all_read(user: CurrentUser, db: DB) -> Message:
    db.execute(update(Notification).where(Notification.user_id == user.id, ~Notification.is_read).values(is_read=True))
    db.commit()
    return Message(message="Đã đánh dấu tất cả là đã đọc")
