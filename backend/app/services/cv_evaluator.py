"""Chức năng 3: đánh giá CV theo quy tắc và gợi ý sửa, có thể theo một job cụ thể."""

import re
from dataclasses import asdict, dataclass
from typing import Any, Literal

from app.matching.skills import SkillDictionary

Severity = Literal["high", "medium", "low"]
PENALTY: dict[Severity, int] = {"high": 12, "medium": 6, "low": 2}
GENERIC_OBJECTIVE = ["môi trường năng động", "môi trường chuyên nghiệp", "phát triển bản thân", "học hỏi thêm kinh nghiệm"]


@dataclass
class Issue:
    code: str
    section: str
    severity: Severity
    message: str
    suggestion: str
    field: str | None = None  # đường dẫn trên form, ví dụ experiences.0.description


@dataclass
class JobRequirement:
    title: str
    required: list[str]  # tên kỹ năng
    preferred: list[str]


def _words(text: str | None) -> int:
    return len((text or "").split())


def evaluate_cv(
    content: dict[str, Any], rules: dict[str, Any], dictionary: SkillDictionary, job: JobRequirement | None = None
) -> tuple[int, list[dict[str, Any]], dict[str, str]]:
    """Trả về (điểm 0..100, danh sách vấn đề, trạng thái từng mục: ok / warning / missing)."""
    issues: list[Issue] = []
    personal = content.get("personal") or {}
    experiences = content.get("experiences") or []
    educations = content.get("educations") or []
    projects = content.get("projects") or []
    skills = [s for s in content.get("skills") or [] if s.strip()]
    objective = (content.get("objective") or "").strip()
    min_words = int(rules.get("min_experience_words", 20))
    cliches = [c.lower() for c in rules.get("cliches", [])]

    # Thông tin cá nhân
    for key, label in (("full_name", "họ tên"), ("email", "email"), ("phone", "số điện thoại")):
        if not (personal.get(key) or "").strip():
            issues.append(
                Issue(
                    f"missing_{key}",
                    "personal",
                    "high",
                    f"Thiếu {label}.",
                    f"Thêm {label} để nhà tuyển dụng liên hệ được với bạn.",
                    f"personal.{key}",
                )
            )

    # Mục tiêu nghề nghiệp
    if not objective:
        issues.append(
            Issue(
                "missing_objective",
                "objective",
                "medium",
                "Chưa có mục tiêu nghề nghiệp.",
                "Viết 2–3 câu: vị trí muốn ứng tuyển, thế mạnh chính và mục tiêu trong 1–2 năm tới.",
                "objective",
            )
        )
    else:
        lowered = objective.lower()
        generic = [p for p in GENERIC_OBJECTIVE + cliches if p in lowered]
        if generic:
            issues.append(
                Issue(
                    "generic_objective",
                    "objective",
                    "medium",
                    f'Mục tiêu viết chung chung ("{generic[0]}").',
                    "Nêu cụ thể vị trí, kỹ năng bạn sẽ đóng góp và kết quả muốn đạt, ví dụ: "
                    '"Trở thành frontend chính của sản phẩm trong 2 năm, tập trung React và hiệu năng".',
                    "objective",
                )
            )
        elif _words(objective) < 12:
            issues.append(
                Issue(
                    "short_objective",
                    "objective",
                    "low",
                    "Mục tiêu nghề nghiệp quá ngắn.",
                    "Bổ sung vị trí mong muốn và thế mạnh chính của bạn.",
                    "objective",
                )
            )
        if job and not any(w in lowered for w in job.title.lower().split() if len(w) > 3):
            issues.append(
                Issue(
                    "objective_not_targeted",
                    "objective",
                    "low",
                    f"Mục tiêu chưa nhắc tới vị trí {job.title}.",
                    f"Sửa mục tiêu để nói rõ bạn ứng tuyển vị trí {job.title}.",
                    "objective",
                )
            )

    # Kinh nghiệm
    if not experiences:
        if projects:
            issues.append(
                Issue(
                    "missing_experience",
                    "experiences",
                    "medium",
                    "Chưa có kinh nghiệm làm việc.",
                    "Nếu là sinh viên mới ra trường, hãy mô tả kỹ dự án và vai trò của bạn ở mục Dự án.",
                    "experiences",
                )
            )
        else:
            issues.append(
                Issue(
                    "missing_experience",
                    "experiences",
                    "high",
                    "Chưa có kinh nghiệm làm việc hay dự án nào.",
                    "Thêm kinh nghiệm thực tập, làm thêm hoặc dự án môn học có liên quan.",
                    "experiences",
                )
            )
    for idx, exp in enumerate(experiences):
        where = f"{exp.get('position') or 'Vị trí'} tại {exp.get('company') or 'công ty'}"
        desc = exp.get("description") or ""
        if not (exp.get("position") and exp.get("company")):
            issues.append(
                Issue(
                    "experience_missing_title",
                    "experiences",
                    "low",
                    "Kinh nghiệm thiếu chức danh hoặc tên công ty.",
                    "Ghi đủ chức danh và tên công ty.",
                    f"experiences.{idx}",
                )
            )
        if _words(desc) < min_words:
            issues.append(
                Issue(
                    "short_experience",
                    "experiences",
                    "medium",
                    f'Mô tả "{where}" quá ngắn ({_words(desc)} từ).',
                    f"Viết ít nhất {min_words} từ: bạn làm gì, dùng công cụ nào, kết quả ra sao.",
                    f"experiences.{idx}.description",
                )
            )
        if desc and not re.search(r"\d", desc):
            issues.append(
                Issue(
                    "no_metrics",
                    "experiences",
                    "medium",
                    f'"{where}" chưa có kết quả đo được.',
                    "Thêm con số: số người dùng, % tăng doanh thu, thời gian giảm được… "
                    'Ví dụ: "giảm thời gian tải trang từ 4 giây xuống 1,3 giây".',
                    f"experiences.{idx}.description",
                )
            )

    # Học vấn
    if not educations:
        issues.append(
            Issue(
                "missing_education",
                "educations",
                "medium",
                "Chưa có thông tin học vấn.",
                "Thêm trường, chuyên ngành và thời gian học.",
                "educations",
            )
        )

    # Kỹ năng
    if not skills:
        issues.append(
            Issue(
                "missing_skills",
                "skills",
                "high",
                "Chưa liệt kê kỹ năng.",
                "Liệt kê các kỹ năng chuyên môn, công cụ bạn dùng thành thạo.",
                "skills",
            )
        )
    elif len(skills) < 3:
        issues.append(
            Issue(
                "few_skills",
                "skills",
                "low",
                "Danh sách kỹ năng còn ít.",
                "Bổ sung công cụ, ngôn ngữ, phần mềm bạn đã dùng trong công việc.",
                "skills",
            )
        )

    # Từ sáo rỗng
    full_text = " ".join([objective, content.get("strengths") or "", *(e.get("description") or "" for e in experiences)]).lower()
    found = [c for c in cliches if c in full_text]
    if found:
        issues.append(
            Issue(
                "cliches",
                "strengths",
                "medium",
                "Dùng từ sáo rỗng: " + ", ".join(found) + ".",
                'Thay bằng việc cụ thể chứng minh, ví dụ "tự học TypeScript trong 1 tháng và áp dụng vào dự án" '
                'thay cho "ham học hỏi".',
                "strengths",
            )
        )

    # Theo job
    if job:
        cv_skill_ids = {dictionary.resolve(s) for s in skills} | dictionary.extract(full_text)
        missing_required = [s for s in job.required if dictionary.resolve(s) not in cv_skill_ids]
        missing_preferred = [s for s in job.preferred if dictionary.resolve(s) not in cv_skill_ids]
        if missing_required:
            issues.append(
                Issue(
                    "missing_required_skills",
                    "skills",
                    "high",
                    "Chưa thấy kỹ năng bắt buộc: " + ", ".join(missing_required) + ".",
                    "Nếu bạn đã có các kỹ năng này, thêm vào mục Kỹ năng và nêu dự án/công việc đã dùng. "
                    "Nếu chưa, đây là các kỹ năng nên học trước khi ứng tuyển.",
                    "skills",
                )
            )
        if missing_preferred:
            issues.append(
                Issue(
                    "missing_preferred_skills",
                    "skills",
                    "low",
                    "Chưa có kỹ năng ưu tiên: " + ", ".join(missing_preferred) + ".",
                    "Không bắt buộc, nhưng có sẽ được cộng điểm.",
                    "skills",
                )
            )
        exp_text = (
            " ".join((e.get("description") or "") for e in experiences)
            + " "
            + " ".join((p.get("description") or "") for p in projects)
        )
        exp_ids = dictionary.extract(exp_text)
        unproven = [s for s in job.required if s not in missing_required and dictionary.resolve(s) not in exp_ids]
        if unproven:
            issues.append(
                Issue(
                    "unproven_skills",
                    "experiences",
                    "low",
                    "Có kỹ năng nhưng chưa thấy trong kinh nghiệm: " + ", ".join(unproven) + ".",
                    "Nhắc đến các kỹ năng này trong mô tả công việc hoặc dự án để chứng minh.",
                    "experiences",
                )
            )

    score = max(0, 100 - sum(PENALTY[i.severity] for i in issues))
    missing_codes = {
        "objective": "missing_objective",
        "experiences": "missing_experience",
        "educations": "missing_education",
        "skills": "missing_skills",
    }
    codes = {i.code for i in issues}
    sections: dict[str, str] = {}
    for key in ("personal", "objective", "experiences", "educations", "skills"):
        if missing_codes.get(key) in codes:
            sections[key] = "missing"
        else:
            sections[key] = "warning" if any(i.section == key for i in issues) else "ok"
    return score, [asdict(i) for i in issues], sections
