"""Domain-level novelty calculations."""

from __future__ import annotations


def parental_envelope(parent_a: float, parent_b: float) -> tuple[float, float]:
    return min(parent_a, parent_b), max(parent_a, parent_b)


def novelty_margin(parent_a: float, parent_b: float, offspring: float) -> tuple[bool, float, str]:
    lower, upper = parental_envelope(parent_a, parent_b)
    if offspring > upper:
        return True, offspring - upper, "above_range"
    if offspring < lower:
        return True, lower - offspring, "below_range"
    return False, 0.0, "within_range"
