"""Thuật toán 3: Sentence-BERT. Model chỉ tải khi cần lần đầu và có thể không có (gói không bắt buộc)."""

import logging
import threading
from typing import Any

from app.core.config import get_settings

log = logging.getLogger(__name__)

_lock = threading.Lock()
_model: Any = None
_model_name: str | None = None
_failed = False


def get_model(model_name: str) -> Any | None:
    global _model, _model_name, _failed
    if not get_settings().semantic_enabled or _failed:
        return None
    with _lock:
        if _model is not None and _model_name == model_name:
            return _model
        try:
            from sentence_transformers import SentenceTransformer

            log.info("Đang tải model %s (lần đầu có thể mất vài phút)", model_name)
            _model = SentenceTransformer(model_name, device="cpu")
            _model_name = model_name
            return _model
        except Exception as exc:  # không cài sentence-transformers hoặc không tải được model
            log.warning("Không dùng được thuật toán 3: %s", exc)
            _failed = True
            return None


def embed(texts: list[str], model_name: str) -> list[list[float]] | None:
    model = get_model(model_name)
    if model is None or not texts:
        return None
    vectors = model.encode(texts, batch_size=16, normalize_embeddings=True, show_progress_bar=False)
    return [[round(float(x), 6) for x in v] for v in vectors]


def is_available() -> bool:
    return not _failed and get_settings().semantic_enabled
