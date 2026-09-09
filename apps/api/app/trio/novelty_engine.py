"""Transgressive Phenotypic Novelty Engine.

Formalizes transgressive segregation for quantitative traits:
  An offspring phenotype y_O is transgressive if it falls strictly outside
  the parental range [min(y_A, y_B), max(y_A, y_B)].

Truth guard for real data:
  For the real GIAB Ashkenazim trio, parental phenotypes are not quantitatively
  measured in repository records. The engine reports genotype-level novelty
  (child-specific configurations, candidate interactions, recombination intervals)
  while explicitly setting phenotypic transgressive metrics to null with status
  "unresolved_no_quantitative_phenotype_model".
"""
from typing import Optional

from .interaction import find_candidate_interactions
from .models import (
    ChildState,
    NoveltyAssessment,
    QuantitativeNoveltyScore,
)

NOVELTY_LIMITATIONS = [
    "Phenotypic transgressive novelty cannot be computed without verified quantitative measurements for all three family members",
    "Child-specific genotype configurations demonstrate genomic inheritance diversity, not phenotypic disease or superiority",
    "Candidate genetic interactions are structural hypotheses; their contribution to phenotypic novelty requires functional assays",
    "Zero-fabrication principle: phenotypic metrics are strictly null when unmeasured",
]


def evaluate_quantitative_novelty(
    parent_a_phenotype: float,
    parent_b_phenotype: float,
    child_phenotype: float,
    tolerance: float = 1e-6,
) -> QuantitativeNoveltyScore:
    """Evaluate transgressive segregation given scalar quantitative trait values."""
    p_min = min(parent_a_phenotype, parent_b_phenotype)
    p_max = max(parent_a_phenotype, parent_b_phenotype)
    p_range = (p_max - p_min) if (p_max - p_min) > tolerance else 1.0

    if child_phenotype > (p_max + tolerance):
        is_trans = True
        margin = child_phenotype - p_max
        direction = "above_range"
        pct = (margin / p_range) * 100.0
    elif child_phenotype < (p_min - tolerance):
        is_trans = True
        margin = p_min - child_phenotype
        direction = "below_range"
        pct = (margin / p_range) * 100.0
    else:
        is_trans = False
        margin = 0.0
        direction = "within_range"
        pct = 0.0

    return QuantitativeNoveltyScore(
        parent_a_phenotype=round(parent_a_phenotype, 4),
        parent_b_phenotype=round(parent_b_phenotype, 4),
        child_phenotype=round(child_phenotype, 4),
        parental_min=round(p_min, 4),
        parental_max=round(p_max, 4),
        is_transgressive=is_trans,
        novelty_margin=round(margin, 4),
        direction=direction,
        percent_transgression=round(pct, 2),
    )


def assess_novelty(
    state: ChildState,
    parent_a_val: Optional[float] = None,
    parent_b_val: Optional[float] = None,
    child_val: Optional[float] = None,
) -> NoveltyAssessment:
    """Assess phenotypic novelty for a child state with strict real-data guards."""
    candidate_interactions = find_candidate_interactions(state, max_candidates=100)

    # If all three quantitative values are provided (e.g. during benchmark evaluation)
    if parent_a_val is not None and parent_b_val is not None and child_val is not None:
        q_score = evaluate_quantitative_novelty(parent_a_val, parent_b_val, child_val)
        return NoveltyAssessment(
            family_id=state.family_id,
            phenotype_novelty_status="evaluated_quantitative_model",
            is_transgressive=q_score.is_transgressive,
            novelty_margin=q_score.novelty_margin,
            direction=q_score.direction,
            percent_transgression=q_score.percent_transgression,
            quantitative_scores=q_score,
            genotype_configurations_count=len(state.configurations),
            child_specific_configurations_count=len(state.configurations),
            candidate_interactions_count=len(candidate_interactions),
            recombination_intervals_count=len(state.recombination_events),
            explanation=(
                f"Quantitative trait evaluation: offspring ({child_val:.2f}) is "
                f"{q_score.direction} relative to parental range [{q_score.parental_min:.2f}, {q_score.parental_max:.2f}]."
            ),
            limitations=NOVELTY_LIMITATIONS,
            provenance=state.provenance,
        )

    # Real GIAB data mode: Honest null reporting
    return NoveltyAssessment(
        family_id=state.family_id,
        phenotype_novelty_status="unresolved_no_quantitative_phenotype_model",
        is_transgressive=None,
        novelty_margin=None,
        direction="unresolved",
        percent_transgression=None,
        quantitative_scores=None,
        genotype_configurations_count=len(state.configurations),
        child_specific_configurations_count=len(state.configurations),
        candidate_interactions_count=len(candidate_interactions),
        recombination_intervals_count=len(state.recombination_events),
        explanation=(
            f"Offspring exhibits {len(state.configurations)} child-specific genotype configurations "
            f"and {len(state.recombination_events)} candidate recombination intervals, but phenotypic novelty "
            "is unresolved because no quantitative phenotype measurement exists for this trio in repository records."
        ),
        limitations=NOVELTY_LIMITATIONS,
        provenance=state.provenance,
    )
