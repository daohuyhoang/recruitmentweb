"""Đọc file CV (PDF, DOCX) và tách thành CV có cấu trúc để điền sẵn vào form.

Tách mục dựa trên tiêu đề phổ biến (tiếng Việt và tiếng Anh). Kết quả là bản nháp:
ứng viên kiểm tra và sửa lại trên form trước khi dùng.
"""

import re
from io import BytesIO
from typing import Any

SECTION_KEYWORDS: dict[str, list[str]] = {
    "objective": ["mục tiêu nghề nghiệp", "mục tiêu", "giới thiệu", "tóm tắt", "objective", "summary", "about me", "profile"],
    "experiences": ["kinh nghiệm làm việc", "kinh nghiệm", "quá trình làm việc", "work experience", "experience", "employment"],
    "educations": ["học vấn", "trình độ học vấn", "quá trình học tập", "education"],
    "skills": ["kỹ năng", "kĩ năng", "skills", "technical skills", "công nghệ"],
    "projects": ["dự án", "projects", "project"],
    "certificates": ["chứng chỉ", "giải thưởng", "certificates", "certifications", "awards"],
    "strengths": ["điểm mạnh", "sở thích", "strengths", "interests", "hobbies"],
}
EMAIL = re.compile(r"[\w.+-]+@[\w-]+\.[\w.-]+")
PHONE = re.compile(r"(?:\+84|0)(?:[\s.-]?\d){9,10}")
DATE_RANGE = re.compile(
    r"(?P<start>(?:\d{1,2}[/.-])?\d{4})\s*(?:-|–|—|đến|to)\s*(?P<end>(?:\d{1,2}[/.-])?\d{4}|nay|hiện tại|present|now)",
    re.IGNORECASE,
)
BULLET = re.compile(r"^[\s•●▪◦\-*+·]+")


class CvFileError(ValueError):
    pass


def extract_text(data: bytes, filename: str) -> str:
    name = filename.lower()
    if name.endswith(".pdf"):
        import pymupdf

        try:
            with pymupdf.open(stream=data, filetype="pdf") as doc:
                text = "\n".join(page.get_text() for page in doc)
        except Exception as exc:
            raise CvFileError("Không đọc được file PDF. File có thể bị hỏng hoặc đặt mật khẩu.") from exc
    elif name.endswith(".docx"):
        import docx

        try:
            document = docx.Document(BytesIO(data))
        except Exception as exc:
            raise CvFileError("Không đọc được file DOCX. Hãy lưu lại bằng Word rồi tải lên lại.") from exc
        lines = [p.text for p in document.paragraphs]
        for table in document.tables:
            for row in table.rows:
                lines.append(" | ".join(cell.text for cell in row.cells))
        text = "\n".join(lines)
    else:
        raise CvFileError("Chỉ nhận file PDF hoặc DOCX.")
    text = text.replace("\xa0", " ").strip()
    if len(text) < 50:
        raise CvFileError("File gần như không có chữ. CV dạng ảnh chụp chưa được hỗ trợ, hãy tải bản PDF xuất từ Word.")
    return text


def _heading_of(line: str) -> str | None:
    clean = BULLET.sub("", line).strip().rstrip(":").lower()
    if not clean or len(clean) > 40:
        return None
    for section, keywords in SECTION_KEYWORDS.items():
        if any(clean == k or clean.startswith(k + " ") for k in keywords):
            return section
    return None


def _normalize_month(value: str) -> str | None:
    value = value.strip().lower()
    if value in ("nay", "hiện tại", "present", "now"):
        return None
    m = re.match(r"(?:(\d{1,2})[/.-])?(\d{4})", value)
    if not m:
        return None
    month = int(m.group(1) or 1)
    return f"{m.group(2)}-{month:02d}"


def _split_items(lines: list[str]) -> list[list[str]]:
    """Mỗi mục kinh nghiệm/học vấn bắt đầu ở dòng có khoảng thời gian."""
    items: list[list[str]] = []
    for line in lines:
        if DATE_RANGE.search(line) or not items:
            items.append([line])
        else:
            items[-1].append(line)
    return [i for i in items if any(x.strip() for x in i)]


def _period(lines: list[str]) -> tuple[str | None, str | None, list[str]]:
    for idx, line in enumerate(lines):
        m = DATE_RANGE.search(line)
        if m:
            rest = DATE_RANGE.sub("", line).strip(" |-–,")
            new_lines = lines.copy()
            new_lines[idx] = rest
            return _normalize_month(m.group("start")), _normalize_month(m.group("end")), [x for x in new_lines if x]
    return None, None, lines


def parse_cv_text(text: str, skill_names: list[str]) -> dict[str, Any]:
    lines = [BULLET.sub("", ln).strip() for ln in text.splitlines()]
    lines = [ln for ln in lines if ln]

    sections: dict[str, list[str]] = {"header": []}
    current = "header"
    for line in lines:
        heading = _heading_of(line)
        if heading:
            current = heading
            sections.setdefault(current, [])
        else:
            sections.setdefault(current, []).append(line)

    header = sections.get("header", [])
    email = EMAIL.search(text)
    phone = PHONE.search(text)
    full_name = next((ln for ln in header if 2 <= len(ln.split()) <= 5 and not re.search(r"[\d@]", ln) and ln[0].isupper()), "")
    headline = next((ln for ln in header if ln != full_name and not re.search(r"[\d@]", ln) and len(ln) < 60), "")

    experiences = []
    for item in _split_items(sections.get("experiences", [])):
        start, end, rest = _period(item)
        first = rest[0] if rest else ""
        position, _, company = first.partition(" - ") if " - " in first else (first, "", "")
        experiences.append(
            {
                "company": company.strip(),
                "position": position.strip(),
                "start": start,
                "end": end,
                "description": "\n".join(rest[1:]),
            }
        )

    educations = []
    for item in _split_items(sections.get("educations", [])):
        start, end, rest = _period(item)
        gpa = next((m.group(0) for ln in rest if (m := re.search(r"\d[.,]\d{1,2}\s*/\s*\d+", ln))), None)
        educations.append(
            {
                "school": rest[0] if rest else "",
                "major": rest[1] if len(rest) > 1 else "",
                "degree": "",
                "start": start,
                "end": end,
                "gpa": gpa,
            }
        )

    raw_skills = re.split(r"[,;|\n•]", "\n".join(sections.get("skills", [])))
    skills = [s.strip(" -:") for s in raw_skills if 1 < len(s.strip(" -:")) <= 40]
    for name in skill_names:  # kỹ năng nhận diện bằng từ điển ở bất kỳ đâu trong CV
        if name not in skills:
            skills.append(name)

    return {
        "personal": {
            "full_name": full_name,
            "email": email.group(0) if email else "",
            "phone": re.sub(r"[\s.-]", "", phone.group(0)) if phone else "",
            "address": "",
            "headline": headline,
        },
        "objective": " ".join(sections.get("objective", [])),
        "experiences": experiences,
        "educations": educations,
        "projects": [
            {"name": ln, "role": "", "start": None, "end": None, "description": "", "link": None}
            for ln in sections.get("projects", [])[:10]
        ],
        "certificates": [{"name": ln, "issuer": "", "year": None} for ln in sections.get("certificates", [])[:10]],
        "skills": skills[:40],
        "strengths": " ".join(sections.get("strengths", [])),
    }
