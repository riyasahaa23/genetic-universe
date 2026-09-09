"""Schemas for phenotype calculations, novelty detection, and counterfactual interventions."""
from typing import Dict, List, Any, Optional
from pydantic import BaseModel, Field


class PhenotypeBreakdownSchema(BaseModel):
    total: float
    base_value: float
    additive_component: float
    dominance_component: float
    epistatic_component: float
    additive_details: Dict[str, float]
    dominance_details: Dict[str, float]
    epistatic_details: Dict[str, float]
    formula_expression: str


class PhenotypeCalculationResponse(BaseModel):
    experiment_id: str
    parent_a: PhenotypeBreakdownSchema
    parent_b: PhenotypeBreakdownSchema
    offspring: PhenotypeBreakdownSchema


class NoveltyDetectionResponse(BaseModel):
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


class CounterfactualInterventionRequest(BaseModel):
    candidate_id: str
    intervention: str = Field(
        default="break_interaction",
        description="Intervention type: break_interaction, swap_segment, or revert_variant"
    )


class CounterfactualInterventionResponse(BaseModel):
    label: str = "MODEL-RELATIVE COMPUTATIONAL COUNTERFACTUAL"
    counterfactual_type: str = ""
    target: Dict[str, Any] = {}
    original_state: Dict[str, Any] = {}
    altered_state: Dict[str, Any] = {}
    model_used: Dict[str, Any] = {}
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
    score_components: Dict[str, float]
    provenance_summary: str
