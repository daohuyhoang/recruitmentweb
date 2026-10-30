from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=BACKEND_DIR / ".env", env_file_encoding="utf-8", extra="ignore")

    database_url: str = "mysql+pymysql://root:@localhost:3306/recruitment?charset=utf8mb4"
    jwt_secret: str = "doi-chuoi-bi-mat-nay"
    jwt_expire_minutes: int = 60 * 24
    cors_origins: list[str] = ["http://localhost:5173"]
    upload_dir: Path = BACKEND_DIR / "uploads"
    max_upload_mb: int = 5
    # Tắt để chạy nhanh khi không cần thuật toán 3 (không tải model Sentence-BERT)
    semantic_enabled: bool = True


@lru_cache
def get_settings() -> Settings:
    return Settings()
