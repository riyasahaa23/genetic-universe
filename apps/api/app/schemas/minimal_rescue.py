"""Contracts for bounded cardinality-first novelty rescue searches."""

from __future__ import annotations

from typing import Any

from pydantic import Field

from .common import ContractModel


class MinimalRescueRequest(ContractModel):
    top_k: int = Field(default=8, ge=1, le=12)
    max_set_size: int = Field(default=3, ge=1, le=4)
    max_returned_sets: int = Field(default=10, ge=1, le=100)
    max_combination_count: int = Field(default=500, ge=1, le=5000)


class MinimalRescueSetResponse(ContractModel):
    candidate_ids: list[str]
    candidate_types: list[str]
    candidate_names: list[str]
    counterfactual_phenotype: float
    joint_delta: float
    novelty_removed: bool
    inside_parental_envelope: bool
    envelope_position: str
    member_attribution_scores: dict[str, float]
    mean_attribution_score: float
    provenance_summary: list[str]
    member_provenance: list[dict[str, Any]]
    contains_variant: bool
    contains_segment: bool
    contains_interaction: bool


class MinimalRescueSummary(ContractModel):
    search_status: str
    baseline_phenotype: float
    parent_a_phenotype: float
    parent_b_phenotype: float
    parental_envelope: dict[str, float]
    candidate_pool_size: int = Field(ge=0)
    search_top_k: int = Field(ge=0)
    max_set_size: int = Field(ge=1)
    max_returned_sets: int = Field(ge=1)
    maximum_theoretical_combinations: int = Field(ge=0)
    evaluated_combination_count: int = Field(ge=0)
    invalid_combination_count: int = Field(ge=0)
    invalid_combination_reasons: dict[str, int]
    minimal_cardinality: int | None = Field(default=None, ge=1)
    minimal_rescue_sets: list[MinimalRescueSetResponse]
    search_is_globally_exhaustive: bool
    searched_candidate_ids: list[str]


class MinimalRescueResponse(MinimalRescueSummary):
    run_id: str
