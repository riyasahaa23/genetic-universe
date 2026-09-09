"""Tests for transgressive novelty detection."""
import pytest
from app.validation.scientific.novelty import detect_novelty


def test_inside_parental_range():
    """Phenotype within parental bounds is not transgressive."""
    res = detect_novelty(parent_a_phenotype=12.0, parent_b_phenotype=18.0, offspring_phenotype=15.0)
    assert not res.is_transgressive
    assert res.novelty_margin == 0.0
    assert res.direction == "within_range"
    assert res.parental_min == 12.0
    assert res.parental_max == 18.0


def test_above_parental_range():
    """Phenotype exceeding parental max is detected with exact positive margin."""
    res = detect_novelty(parent_a_phenotype=12.0, parent_b_phenotype=18.0, offspring_phenotype=31.0)
    assert res.is_transgressive
    assert res.novelty_margin == 13.0
    assert res.direction == "above_range"
    assert res.parental_max == 18.0


def test_below_parental_range():
    """Phenotype below parental min is detected with exact negative margin."""
    res = detect_novelty(parent_a_phenotype=12.0, parent_b_phenotype=18.0, offspring_phenotype=5.0)
    assert res.is_transgressive
    assert res.novelty_margin == 7.0
    assert res.direction == "below_range"
    assert res.parental_min == 12.0
