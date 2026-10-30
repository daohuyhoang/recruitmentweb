from typing import Annotated

from fastapi import Query
from sqlalchemy import Select, func, select
from sqlalchemy.orm import Session

PageParam = Annotated[int, Query(ge=1)]
SizeParam = Annotated[int, Query(ge=1, le=100)]


def paginate(db: Session, stmt: Select, page: int, size: int) -> tuple[list, int]:
    total = db.scalar(select(func.count()).select_from(stmt.order_by(None).subquery())) or 0
    items = list(db.scalars(stmt.offset((page - 1) * size).limit(size)).unique())
    return items, total
