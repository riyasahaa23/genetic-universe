"""Pydantic contracts for the legacy ``/api/experiments`` surface.

These schemas preserve the old response shape for existing clients while the
implementation underneath uses the canonical run service. They are kept
separate from the v1 contract so the new API remains stable and can eventually
deprecate this compatibility surface without changing scientific code.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class LegacyModel(BaseModel):
    model_config = ConfigDict(extra="forbid", allow_inf_nan=False)


class CreateExperimentRequest(LegacyModel):
    seed: int = Field(default=42, ge=0)
    locus_count: int = Field(default=50, ge=10, le=1000)


class ExperimentResponse(LegacyModel):
    experiment_id: str
    seed: int
    locus_count: int
    status: str
    created_at: datetime | None = None
    completed_at: datetime | None = None


class HomologPair(LegacyModel):
    parent_id: str
    haplotypes: dict[str, list[int]]
    dosage: list[int]
    locus_count: int


class ParentGenomesResponse(LegacyModel):
    experiment_id: str
    parent_a: HomologPair
    parent_b: HomologPair


class SegmentProvenance(LegacyModel):
    start: int
    end: int
    source_homolog: str
    parent_id: str


class Gamete(LegacyModel):
    parent_id: str
    alleles: list[int]
    crossovers: list[int]
    segments: list[SegmentProvenance]


class MeiosisSimulationResponse(LegacyModel):
    experiment_id: str
    gamete_a: Gamete
    gamete_b: Gamete


class LocusProvenance(LegacyModel):
    locus_id: str
    position: int
    allele_a: int
    source_parent_a: str
    source_homolog_a: str
    crossover_interval_a: str
    allele_b: int
    source_parent_b: str
    source_homolog_b: str
    crossover_interval_b: str
    genotype_dosage: int


class OffspringResponse(LegacyModel):
    experiment_id: str
    offspring_id: str
    maternal_or_parent_a: list[int]
    paternal_or_parent_b: list[int]
    dosage: list[int]
    provenance: list[LocusProvenance]


class PhenotypeBreakdown(LegacyModel):
    total: float
    base_value: float
    additive_component: float
    dominance_component: float
    epistatic_component: float
    additive_details: dict[str, float]
    dominance_details: dict[str, float]
    epistatic_details: dict[str, float]
    formula_expression: str


class PhenotypeCalculationResponse(LegacyModel):
    experiment_id: str
    parent_a: PhenotypeBreakdown
    parent_b: PhenotypeBreakdown
    offspring: PhenotypeBreakdown


class NoveltyDetectionResponse(LegacyModel):
    experiment_id: str
    parent_a: float
    parent_b: float
    offspring: float
    parental_min: float
    parental_max: float
    is_transgressive: bool
    novelty_margin: float
    direction: str
    percent_transgression: float


class CounterfactualInterventionRequest(LegacyModel):
    candidate_id: str = Field(min_length=1)
    intervention: str = Field(default="break_interaction", min_length=1)


class CounterfactualInterventionResponse(LegacyModel):
    label: str = "MODEL-RELATIVE COMPUTATIONAL COUNTERFACTUAL"
    counterfactual_type: str = ""
    target: dict[str, Any] = Field(default_factory=dict)
    original_state: dict[str, Any] = Field(default_factory=dict)
    altered_state: dict[str, Any] = Field(default_factory=dict)
    model_used: dict[str, Any] = Field(default_factory=dict)
    phenotype_change: float = 0.0
    interpretation: str = ""
    stability_interpretation: str = ""

    experiment_id: str
    candidate_id: str
    candidate_name: str
    candidate_type: str
    intervention: str
    original_phenotype: float
    counterfactual_phenotype: float
    delta: float
    absolute_effect: float
    novelty_removed: bool
    new_novelty_margin: float
    stability: float
    provenance_score: float
    attribution_score: float
    score_components: dict[str, float]
    provenance_summary: str
    # Formal single-vs-joint fields for pairwise interaction candidates.
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


class NoveltyTraceResponse(LegacyModel):
    experiment_id: str
    total_candidates: int
    primary_candidate: CounterfactualInterventionResponse | None = None
    ranked_candidates: list[CounterfactualInterventionResponse]


class EvidenceGraphResponse(LegacyModel):
    experiment_id: str
    directed: bool = True
    nodes: list[dict[str, Any]]
    links: list[dict[str, Any]]
    top_candidate: dict[str, Any] | None = None


class ExperimentDemoResponse(LegacyModel):
    experiment_id: str
    seed: int
    locus_count: int
    parent_a: dict[str, Any]
    parent_b: dict[str, Any]
    gamete_a: dict[str, Any]
    gamete_b: dict[str, Any]
    offspring: dict[str, Any]
    phenotypes: dict[str, Any]
    novelty: dict[str, Any]
    trace: NoveltyTraceResponse
    evidence_graph: EvidenceGraphResponse
