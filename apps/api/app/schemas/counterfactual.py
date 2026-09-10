"""Counterfactual intervention contracts."""

from __future__ import annotations

from typing import Any, Literal

from .common import ContractModel, InterventionKind
from .phenotype import PhenotypeResult


class CounterfactualRequest(ContractModel):
    candidate_id: str
    intervention: InterventionKind
    parent_role: Literal["parent_a", "parent_b"] = "parent_a"


class CounterfactualResult(ContractModel):
    intervention_id: str
    run_id: str
    candidate_id: str
    intervention: InterventionKind
    original: PhenotypeResult
    counterfactual: PhenotypeResult
    delta: float
    novelty_resolved: bool
    changed_loci: list[str]
    explanation: str
    computational_only: bool = True
    # Formal pairwise interaction fields are present only for interaction
    # candidates. They stay optional so existing variant/segment clients keep
    # their compact response shape.
    baseline_phenotype: float | None = None
    phenotype_after_a: float | None = None
    phenotype_after_b: float | None = None
    phenotype_after_ab: float | None = None
    delta_a: float | None = None
    delta_b: float | None = None
    delta_ab: float | None = None
    interaction_contrast: float | None = None
    epistatic_excess: float | None = None
    interaction_edge_delta: float | None = None
    novelty_removed_a: bool | None = None
    novelty_removed_b: bool | None = None
    novelty_removed_ab: bool | None = None
    parental_envelope: dict[str, float] | None = None
    synergy_direction: str | None = None
    provenance: dict[str, Any] | None = None


class CounterfactualList(ContractModel):
    run_id: str
    results: list[CounterfactualResult]
