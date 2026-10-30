import pytest

from app.matching.algorithms import (
    CandidateFacts,
    JobFacts,
    RequiredSkill,
    cosine,
    criteria_breakdown,
    hybrid_score,
    jaccard,
    skill_coverage,
    tfidf_similarity,
)
from app.matching.skills import SkillDictionary
from app.matching.text import cv_content_to_text

DICT = SkillDictionary.build(
    [
        (1, "JavaScript"),
        (2, "React"),
        (3, "React Native"),
        (4, "C#"),
        (5, ".NET"),
        (6, "Go"),
        (7, "Node.js"),
        (8, "Kế toán tổng hợp"),
    ],
    [(1, "js"), (2, "reactjs"), (2, "react.js"), (5, "asp.net"), (6, "golang"), (7, "nodejs"), (7, "node")],
)


class TestSkillDictionary:
    def test_aliases_map_to_canonical_skill(self):
        assert DICT.extract("Thành thạo ReactJS, NodeJS") == {2, 7}

    def test_longer_phrase_wins(self):
        assert DICT.extract("Phát triển app bằng React Native") == {3}

    def test_word_boundaries(self):
        assert DICT.extract("reactive programming, nodes") == set()

    def test_symbols_in_skill_names(self):
        assert DICT.extract("Lập trình C# và ASP.NET Core") == {4, 5}

    def test_short_terms_need_exact_case(self):
        # "go" viết thường trong câu tiếng Anh không được tính là ngôn ngữ Go
        assert DICT.extract("ready to go") == set()
        assert DICT.extract("Backend bằng Go và JS") == {6, 1}

    def test_vietnamese_skill(self):
        assert DICT.extract("3 năm làm kế toán tổng hợp") == {8}

    def test_resolve(self):
        assert DICT.resolve("React.js") == 2
        assert DICT.resolve("không có") is None


class TestCoverage:
    def test_weighted_by_required(self):
        skills = [RequiredSkill(1, True), RequiredSkill(2, True), RequiredSkill(3, False)]
        result = skill_coverage(skills, {1, 3})
        # (2 + 1) / (2 + 2 + 1)
        assert result.score == pytest.approx(0.6)
        assert result.matched == [1, 3]
        assert result.missing == [2]

    def test_no_requirements_is_full_match(self):
        assert skill_coverage([], {1}).score == 1.0

    def test_jaccard_penalises_extra_skills_coverage_does_not(self):
        job = {1, 2}
        cv = {1, 2, 3, 4, 5, 6}
        assert jaccard(job, cv) == pytest.approx(2 / 6)
        assert skill_coverage([RequiredSkill(1, True), RequiredSkill(2, True)], cv).score == 1.0


class TestTfidf:
    def test_more_similar_document_scores_higher(self):
        docs = ["lập trình react typescript giao diện web", "kế toán tổng hợp báo cáo thuế", "giáo viên tiếng anh"]
        scores = tfidf_similarity("frontend react typescript", docs)
        assert scores[0] == max(scores)
        assert scores[1] == 0

    def test_empty(self):
        assert tfidf_similarity("abc", []) == []


class TestCosine:
    def test_bounds(self):
        assert cosine([1, 0], [1, 0]) == pytest.approx(1)
        assert cosine([1, 0], [-1, 0]) == 0
        assert cosine(None, [1, 0]) is None


class TestCriteria:
    def test_perfect_fit(self):
        c = CandidateFacts(years_of_experience=2, education_level="university", city_id=1, desired_salary_min=15)
        j = JobFacts(experience_min_years=1, experience_max_years=3, education_level="university", city_id=1, salary_max=20)
        assert criteria_breakdown(c, j) == {"experience": 1, "education": 1, "location": 1, "salary": 1}

    def test_missing_experience_reduces_score(self):
        c = CandidateFacts(years_of_experience=1)
        j = JobFacts(experience_min_years=2)
        assert criteria_breakdown(c, j)["experience"] == pytest.approx(0.5)

    def test_remote_ignores_city(self):
        assert criteria_breakdown(CandidateFacts(city_id=2), JobFacts(city_id=1, work_mode="remote"))["location"] == 1

    def test_unknown_candidate_info_is_neutral(self):
        detail = criteria_breakdown(CandidateFacts(), JobFacts())
        assert detail["experience"] == detail["education"] == detail["location"] == 0.5
        assert "salary" not in detail


class TestHybrid:
    WEIGHTS = {"coverage": 0.4, "tfidf": 0.2, "semantic": 0.3, "criteria": 0.1}

    def test_weighted_sum(self):
        score = hybrid_score({"coverage": 1, "tfidf": 0.5, "semantic": 0.8, "criteria": 1}, self.WEIGHTS)
        assert score == pytest.approx(100 * (0.4 + 0.1 + 0.24 + 0.1))

    def test_missing_semantic_renormalises(self):
        score = hybrid_score({"coverage": 1, "tfidf": 1, "semantic": None, "criteria": 1}, self.WEIGHTS)
        assert score == pytest.approx(100)


def test_cv_content_to_text_includes_main_sections():
    text = cv_content_to_text(
        {"objective": "Mục tiêu", "experiences": [{"position": "Dev", "description": "Làm React"}], "skills": ["React", "Git"]}
    )
    assert "Mục tiêu" in text and "Làm React" in text and "React, Git" in text
