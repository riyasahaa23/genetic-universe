"""Phenotype-domain calculations independent of the scientific engine."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class Contribution:
    term_id: str
    term_type: str
    loci: tuple[str, ...]
    value: float
    active: bool


@dataclass(frozen=True, slots=True)
class PhenotypeValue:
    subject_id: str
    value: float


def parental_envelope(parent_a: PhenotypeValue, parent_b: PhenotypeValue) -> tuple[float, float]:
    return min(parent_a.value, parent_b.value), max(parent_a.value, parent_b.value)
