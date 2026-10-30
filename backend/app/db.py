from collections.abc import Iterator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import get_settings

# READ COMMITTED: mỗi câu lệnh thấy dữ liệu luồng khác vừa ghi (mặc định REPEATABLE READ của MySQL
# giữ ảnh chụp từ đầu transaction, làm luồng tính vector và request ghi trùng nhau)
engine = create_engine(get_settings().database_url, pool_pre_ping=True, pool_recycle=3600, isolation_level="READ COMMITTED")
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


def get_db() -> Iterator[Session]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
