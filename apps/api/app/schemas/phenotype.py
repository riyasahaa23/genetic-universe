"""Synthetic phenotype model and contribution contracts."""

from __future__ import annotations

from typing import Literal

from pydantic import Field

from .common import ContractModel


class PhenotypeTerm(ContractModel):
    term_id: str
    term_type: Literal["additive", "dominance", "recessive", "epistasis", "noise"]
    loci: list[str] = Field(min_length=1)
    coefficient: float


class PhenotypeModel(ContractModel):
    model_id: str
    model_version: str
    trait_name: str
    terms: list[PhenotypeTerm]
    noise_distribution: Literal["none", "seeded_uniform_derived"] = "none"
    disclosure: str


class PhenotypeContribution(ContractModel):
    term_id: str
    term_type: str
    loci: list[str]
    value: float
    active: bool


class PhenotypeResult(ContractModel):
    subject_id: str
    value: float
    contributions: list[PhenotypeContribution]
    model_id: str
    model_version: str
    formula: str


class NoveltyResult(ContractModel):
    outside_parental_range: bool
    lower: float
    upper: float
    offspring_value: float
    margin: float
    direction: Literal["above_range", "below_range", "within_range"]


class PhenotypeBundle(ContractModel):
    parent_a: PhenotypeResult
    parent_b: PhenotypeResult
    offspring: PhenotypeResult
    novelty: NoveltyResult
