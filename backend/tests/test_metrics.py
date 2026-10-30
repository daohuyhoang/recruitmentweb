import pytest

from scripts.evaluate import ndcg_at_k, precision_at_k

LABELS = {1: 2, 2: 0, 3: 1, 4: 2}


def test_precision_counts_relevance_at_least_one():
    assert precision_at_k([1, 2, 3, 4], LABELS, 4) == pytest.approx(0.75)
    assert precision_at_k([2, 5], LABELS, 2) == 0


def test_ndcg_is_one_for_ideal_order():
    assert ndcg_at_k([1, 4, 3, 2], LABELS, 4) == pytest.approx(1)


def test_ndcg_penalises_bad_order():
    assert ndcg_at_k([2, 3, 4, 1], LABELS, 4) < ndcg_at_k([1, 4, 3, 2], LABELS, 4)
