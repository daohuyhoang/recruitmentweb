"""Thực nghiệm so sánh 3 thuật toán và điểm tổng hợp (chương đánh giá của báo cáo).

Quy trình:
  1. Xuất danh sách cặp CV–job để gán nhãn tay:
       python -m scripts.evaluate template nhan.csv
  2. Mở nhan.csv bằng Excel, điền cột relevance: 0 = không phù hợp, 1 = tạm phù hợp, 2 = rất phù hợp
  3. Nạp nhãn vào bảng relevance_labels:
       python -m scripts.evaluate import nhan.csv
  4. Chạy thực nghiệm, in bảng Precision@10, NDCG@10, thời gian:
       python -m scripts.evaluate run --k 10 --out ket_qua.csv

Chạy trong thư mục backend, sau khi đã cấu hình .env.
"""

import argparse
import csv
import math
import time
from collections.abc import Callable

from sqlalchemy import select
from sqlalchemy.dialects.mysql import insert as mysql_insert
from sqlalchemy.orm import selectinload

from app.db import SessionLocal
from app.matching.algorithms import hybrid_score
from app.models import Cv, CvSkill, Job, JobSkill, RelevanceLabel
from app.services import matching
from app.services.app_config import get_setting


def precision_at_k(ranked: list[int], labels: dict[int, int], k: int) -> float:
    """Tỷ lệ job phù hợp (nhãn ≥ 1) trong k job đầu."""
    top = ranked[:k]
    return sum(1 for j in top if labels.get(j, 0) >= 1) / k


def ndcg_at_k(ranked: list[int], labels: dict[int, int], k: int) -> float:
    """NDCG với gain = 2^nhãn - 1, chuẩn hóa theo thứ tự lý tưởng."""

    def dcg(rels: list[int]) -> float:
        return sum((2**r - 1) / math.log2(i + 2) for i, r in enumerate(rels))

    actual = dcg([labels.get(j, 0) for j in ranked[:k]])
    ideal = dcg(sorted(labels.values(), reverse=True)[:k])
    return actual / ideal if ideal else 0.0


def _load_cv(db, cv_id: int) -> Cv:
    return db.scalar(
        select(Cv).where(Cv.id == cv_id).options(selectinload(Cv.skills).joinedload(CvSkill.skill), selectinload(Cv.vector))
    )


def _labeled_jobs(db) -> list[Job]:
    ids = select(RelevanceLabel.job_id).distinct()
    return list(
        db.scalars(
            select(Job)
            .where(Job.id.in_(ids))
            .options(selectinload(Job.skills).joinedload(JobSkill.skill), selectinload(Job.vector))
        ).unique()
    )


def cmd_template(path: str) -> None:
    db = SessionLocal()
    cvs = list(db.scalars(select(Cv).where(Cv.deleted_at.is_(None))))
    jobs = list(db.scalars(select(Job).where(Job.status.in_(["approved", "closed"]))))
    with open(path, "w", newline="", encoding="utf-8-sig") as f:
        w = csv.writer(f)
        w.writerow(["cv_id", "cv_title", "job_id", "job_title", "relevance"])
        for cv in cvs:
            for job in jobs:
                w.writerow([cv.id, cv.title, job.id, job.title, ""])
    print(f"Đã ghi {len(cvs) * len(jobs)} cặp vào {path}. Điền cột relevance (0/1/2) rồi chạy lệnh import.")


def cmd_import(path: str) -> None:
    db = SessionLocal()
    rows = []
    with open(path, encoding="utf-8-sig") as f:
        for r in csv.DictReader(f):
            if (r.get("relevance") or "").strip() in ("0", "1", "2"):
                rows.append({"cv_id": int(r["cv_id"]), "job_id": int(r["job_id"]), "relevance": int(r["relevance"])})
    if not rows:
        print("Không có dòng nào đã gán nhãn.")
        return
    stmt = mysql_insert(RelevanceLabel).values(rows)
    db.execute(stmt.on_duplicate_key_update(relevance=stmt.inserted.relevance))
    db.commit()
    print(f"Đã nạp {len(rows)} nhãn.")


def cmd_run(k: int, out: str | None) -> None:
    db = SessionLocal()
    labels_by_cv: dict[int, dict[int, int]] = {}
    for lb in db.scalars(select(RelevanceLabel)):
        labels_by_cv.setdefault(lb.cv_id, {})[lb.job_id] = lb.relevance
    if not labels_by_cv:
        print("Chưa có nhãn trong relevance_labels. Chạy lệnh template và import trước.")
        return
    jobs = _labeled_jobs(db)
    weights = {key: float(v) for key, v in get_setting(db, "match_weights").items()}

    methods: dict[str, Callable[[matching.MatchOutcome], float]] = {
        "1. Coverage kỹ năng": lambda o: o.coverage,
        "2. TF-IDF + cosine": lambda o: o.tfidf,
        "3. Sentence-BERT": lambda o: o.semantic or 0.0,
        "Tổng hợp (hybrid)": lambda o: hybrid_score(
            {"coverage": o.coverage, "tfidf": o.tfidf, "semantic": o.semantic, "criteria": o.criteria}, weights
        ),
    }
    scores: dict[str, list[tuple[float, float]]] = {m: [] for m in methods}
    started = time.perf_counter()
    for cv_id, labels in labels_by_cv.items():
        cv = _load_cv(db, cv_id)
        if cv is None:
            continue
        outcomes = matching.compute_matches(db, cv, jobs)
        for name, key in methods.items():
            ranked = [o.job.id for o in sorted(outcomes, key=key, reverse=True)]
            scores[name].append((precision_at_k(ranked, labels, k), ndcg_at_k(ranked, labels, k)))
    elapsed = (time.perf_counter() - started) / max(len(labels_by_cv), 1)

    print(f"\n{len(labels_by_cv)} CV, {len(jobs)} job đã gán nhãn, k = {k}, trung bình {elapsed * 1000:.0f} ms/CV\n")
    print(f"{'Phương pháp':<22}{'P@' + str(k):>10}{'NDCG@' + str(k):>12}")
    rows = []
    for name, vals in scores.items():
        p = sum(v[0] for v in vals) / len(vals)
        n = sum(v[1] for v in vals) / len(vals)
        rows.append([name, f"{p:.4f}", f"{n:.4f}"])
        print(f"{name:<22}{p:>10.4f}{n:>12.4f}")
    if out:
        with open(out, "w", newline="", encoding="utf-8-sig") as f:
            w = csv.writer(f)
            w.writerow(["method", f"precision@{k}", f"ndcg@{k}"])
            w.writerows(rows)
        print(f"\nĐã ghi kết quả vào {out}")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = parser.add_subparsers(dest="cmd", required=True)
    sub.add_parser("template").add_argument("path")
    sub.add_parser("import").add_argument("path")
    run = sub.add_parser("run")
    run.add_argument("--k", type=int, default=10)
    run.add_argument("--out")
    args = parser.parse_args()
    if args.cmd == "template":
        cmd_template(args.path)
    elif args.cmd == "import":
        cmd_import(args.path)
    else:
        cmd_run(args.k, args.out)


if __name__ == "__main__":
    main()
