from sqlalchemy.orm import Session

from app.models import Notification

APPLICATION_STATUS_LABELS = {
    "submitted": "Đã nộp",
    "viewed": "Đã xem",
    "interview": "Mời phỏng vấn",
    "accepted": "Đạt",
    "rejected": "Chưa phù hợp",
    "withdrawn": "Đã rút",
}


def notify(db: Session, user_id: int, type_: str, title: str, message: str | None = None, link: str | None = None) -> None:
    """Thêm thông báo vào phiên hiện tại; người gọi tự commit cùng thay đổi chính."""
    db.add(Notification(user_id=user_id, type=type_, title=title, message=message, link=link))
