"""Validated intervention semantics used by counterfactual use cases."""

from __future__ import annotations

from dataclasses import dataclass

from app.schemas.common import CandidateKind, InterventionKind


@dataclass(frozen=True, slots=True)
class InterventionSpec:
    kind: InterventionKind
    candidate_kind: CandidateKind
    description: str


INTERVENTIONS: dict[InterventionKind, InterventionSpec] = {
    InterventionKind.REVERT_VARIANT: InterventionSpec(
        kind=InterventionKind.REVERT_VARIANT,
        candidate_kind=CandidateKind.VARIANT,
        description="Replace a candidate offspring locus with the selected parental baseline.",
    ),
    InterventionKind.SWAP_SEGMENT: InterventionSpec(
        kind=InterventionKind.SWAP_SEGMENT,
        candidate_kind=CandidateKind.SEGMENT,
        description="Replace a transmitted segment with its selected parental source segment.",
    ),
    InterventionKind.BREAK_INTERACTION: InterventionSpec(
        kind=InterventionKind.BREAK_INTERACTION,
        candidate_kind=CandidateKind.INTERACTION,
        description="Disable one modeled interaction while keeping the genotype unchanged.",
    ),
}


def validate_intervention(kind: InterventionKind, candidate_kind: CandidateKind) -> None:
    expected = INTERVENTIONS[kind].candidate_kind
    if expected != candidate_kind:
        raise ValueError(f"{kind.value} requires a {expected.value} candidate")
