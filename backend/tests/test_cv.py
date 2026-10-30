from app.matching.skills import SkillDictionary
from app.services.cv_evaluator import JobRequirement, evaluate_cv
from app.services.cv_parser import parse_cv_text

DICT = SkillDictionary.build([(1, "React"), (2, "TypeScript"), (3, "Jest"), (4, "Git")], [(1, "reactjs")])
RULES = {"min_experience_words": 20, "cliches": ["chăm chỉ", "ham học hỏi"]}

GOOD_CV = {
    "personal": {"full_name": "Nguyễn Văn An", "email": "an@example.com", "phone": "0981234567"},
    "objective": "Trở thành frontend chính của sản phẩm trong 2 năm tới, tập trung React, TypeScript và hiệu năng trang web.",
    "experiences": [
        {
            "company": "Công ty A",
            "position": "Frontend Developer",
            "description": "Phát triển trang quản lý bán hàng bằng React và TypeScript cho chuỗi 30 cửa hàng, "
            "giảm thời gian tải trang từ 4 giây xuống 1,3 giây, viết 40 component dùng chung, quản lý code bằng Git.",
        }
    ],
    "educations": [{"school": "Đại học Công nghệ", "major": "CNTT"}],
    "skills": ["React", "TypeScript", "Git"],
}


def codes(issues):
    return {i["code"] for i in issues}


def test_good_cv_scores_high():
    score, issues, sections = evaluate_cv(GOOD_CV, RULES, DICT)
    assert score >= 95, issues
    assert set(sections.values()) == {"ok"}


def test_generic_cv_is_flagged():
    cv = {
        "personal": {"full_name": "Lê Minh Châu"},
        "objective": "Mong muốn làm việc trong môi trường năng động để phát triển bản thân.",
        "experiences": [{"company": "Khách sạn B", "position": "Marketing", "description": "Chạy quảng cáo Facebook."}],
        "skills": [],
        "strengths": "Chăm chỉ, ham học hỏi.",
    }
    score, issues, sections = evaluate_cv(cv, RULES, DICT)
    assert {
        "missing_email",
        "missing_phone",
        "generic_objective",
        "short_experience",
        "no_metrics",
        "missing_education",
        "missing_skills",
        "cliches",
    } <= codes(issues)
    assert sections["skills"] == "missing"
    assert score < 40


def test_job_specific_missing_skills():
    job = JobRequirement(title="Frontend Developer (ReactJS)", required=["React", "Jest"], preferred=["TypeScript"])
    _, issues, _ = evaluate_cv(GOOD_CV, RULES, DICT, job)
    missing = next(i for i in issues if i["code"] == "missing_required_skills")
    assert "Jest" in missing["message"] and "React" not in missing["message"]
    assert "missing_preferred_skills" not in codes(issues)


def test_parse_cv_text_sections():
    text = """Nguyễn Văn An
Frontend Developer
an.nguyen@example.com | 0981 234 567

MỤC TIÊU NGHỀ NGHIỆP
Trở thành frontend developer chính trong 2 năm.

KINH NGHIỆM LÀM VIỆC
03/2025 - nay
Frontend Developer - Công ty Bắc Hà
Phát triển trang quản lý bằng ReactJS.

HỌC VẤN
2020 - 2024
Đại học Công nghệ
Công nghệ thông tin

KỸ NĂNG
ReactJS, TypeScript, Git
"""
    content = parse_cv_text(text, ["React"])
    assert content["personal"]["full_name"] == "Nguyễn Văn An"
    assert content["personal"]["email"] == "an.nguyen@example.com"
    assert content["personal"]["phone"] == "0981234567"
    assert content["objective"].startswith("Trở thành")
    exp = content["experiences"][0]
    assert (exp["position"], exp["company"], exp["start"], exp["end"]) == (
        "Frontend Developer",
        "Công ty Bắc Hà",
        "2025-03",
        None,
    )
    assert content["educations"][0]["school"] == "Đại học Công nghệ"
    assert {"ReactJS", "TypeScript", "Git", "React"} <= set(content["skills"])
