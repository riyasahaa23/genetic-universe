"""Counterfactual intervention contracts."""

from __future__ import annotations

from typing import Literal

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


class CounterfactualList(ContractModel):
    run_id: str
    results: list[CounterfactualResult]
