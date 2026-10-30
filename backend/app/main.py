import logging
import threading
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes import admin, auth, candidate, employer, notifications, public
from app.core.config import get_settings
from app.db import SessionLocal
from app.services import matching

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
log = logging.getLogger("app")


def _warm_up() -> None:
    """Tính sẵn vector cho các tin đang mở (tải model Sentence-BERT ở lần đầu)."""
    db = SessionLocal()
    try:
        jobs = list(db.scalars(matching.open_jobs_query()).unique())
        matching.ensure_job_vectors(db, jobs)
        log.info("Đã chuẩn bị vector cho %d tin tuyển dụng", len(jobs))
    except Exception:
        log.exception("Không chuẩn bị được vector tin tuyển dụng")
    finally:
        db.close()


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    get_settings().upload_dir.mkdir(parents=True, exist_ok=True)
    threading.Thread(target=_warm_up, daemon=True).start()
    yield


app = FastAPI(
    title="KhớpViệc API",
    version="1.0.0",
    description="API website tuyển dụng có gợi ý việc làm theo CV",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_settings().cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

for module in (auth, public, candidate, employer, admin, notifications):
    app.include_router(module.router, prefix="/api")


@app.exception_handler(RequestValidationError)
async def validation_error(_: Request, exc: RequestValidationError) -> JSONResponse:
    """Trả lỗi dạng {detail: "câu đầu tiên", errors: [...]} để frontend hiện thẳng câu tiếng Việt."""
    errors = []
    for err in exc.errors():
        msg = str(err.get("msg", "")).removeprefix("Value error, ")
        errors.append({"field": ".".join(str(p) for p in err.get("loc", [])[1:]), "message": msg})
    first = errors[0]["message"] if errors else "Dữ liệu không hợp lệ"
    return JSONResponse(status_code=422, content={"detail": first, "errors": errors})


@app.get("/api/health", tags=["Hệ thống"])
def health() -> dict[str, str]:
    return {"status": "ok"}
