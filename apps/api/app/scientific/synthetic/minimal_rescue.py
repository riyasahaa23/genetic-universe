"""Bounded minimal novelty-rescue search.

The search operates only on candidates produced by ``NoveltyTracer`` and
evaluates candidate combinations as joint counterfactual interventions.  It
is a model-relative explanatory sufficiency analysis, not proof of biological
causality and not a global search when the candidate pool is pruned.
"""

from dataclasses import dataclass, field
from itertools import combinations
from math import comb
from typing import Any, Dict, List, Optional, Sequence, Tuple

from app.scientific.synthetic.attribution import Candidate, CounterfactualResult, NoveltyTracer
from app.scientific.synthetic.novelty import detect_novelty

DEFAULT_TOP_K = 8
DEFAULT_MAX_SET_SIZE = 3
DEFAULT_MAX_RETURNED_SETS = 10
DEFAULT_MAX_COMBINATION_COUNT = 500
MAX_TOP_K = 12
MAX_SET_SIZE = 4
MAX_RETURNED_SETS = 100
NOVELTY_TOLERANCE = 1e-6


@dataclass
class MinimalRescueSet:
    """One minimal-cardinality joint counterfactual rescue set."""

    candidate_ids: List[str]
    candidate_types: List[str]
    candidate_names: List[str]
    counterfactual_phenotype: float
    joint_delta: float
    novelty_removed: bool
    inside_parental_envelope: bool
    envelope_position: str
    member_attribution_scores: Dict[str, float]
    mean_attribution_score: float
    provenance_summary: List[str]
    member_provenance: List[Dict[str, Any]]
    contains_variant: bool
    contains_segment: bool
    contains_interaction: bool

    def to_dict(self) -> Dict[str, Any]:
        return {
            "candidate_ids": self.candidate_ids,
            "candidate_types": self.candidate_types,
            "candidate_names": self.candidate_names,
            "counterfactual_phenotype": round(self.counterfactual_phenotype, 4),
            "joint_delta": round(self.joint_delta, 4),
            "novelty_removed": self.novelty_removed,
            "inside_parental_envelope": self.inside_parental_envelope,
            "envelope_position": self.envelope_position,
            "member_attribution_scores": {
                key: round(value, 4)
                for key, value in self.member_attribution_scores.items()
            },
            "mean_attribution_score": round(self.mean_attribution_score, 4),
            "provenance_summary": self.provenance_summary,
            "member_provenance": self.member_provenance,
            "contains_variant": self.contains_variant,
            "contains_segment": self.contains_segment,
            "contains_interaction": self.contains_interaction,
        }


@dataclass
class MinimalRescueResult:
    """Summary of a bounded cardinality-first rescue-set search."""

    search_status: str
    baseline_phenotype: float
    parent_a_phenotype: float
    parent_b_phenotype: float
    parental_envelope: Dict[str, float]
    candidate_pool_size: int
    search_top_k: int
    max_set_size: int
    max_returned_sets: int
    maximum_theoretical_combinations: int
    evaluated_combination_count: int
    invalid_combination_count: int
    invalid_combination_reasons: Dict[str, int]
    minimal_cardinality: Optional[int]
    minimal_rescue_sets: List[MinimalRescueSet]
    search_is_globally_exhaustive: bool
    searched_candidate_ids: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "search_status": self.search_status,
            "baseline_phenotype": round(self.baseline_phenotype, 4),
            "parent_a_phenotype": round(self.parent_a_phenotype, 4),
            "parent_b_phenotype": round(self.parent_b_phenotype, 4),
            "parental_envelope": {
                key: round(value, 4)
                for key, value in self.parental_envelope.items()
            },
            "candidate_pool_size": self.candidate_pool_size,
            "search_top_k": self.search_top_k,
            "max_set_size": self.max_set_size,
            "max_returned_sets": self.max_returned_sets,
            "maximum_theoretical_combinations": self.maximum_theoretical_combinations,
            "evaluated_combination_count": self.evaluated_combination_count,
            "invalid_combination_count": self.invalid_combination_count,
            "invalid_combination_reasons": self.invalid_combination_reasons,
            "minimal_cardinality": self.minimal_cardinality,
            "minimal_rescue_sets": [item.to_dict() for item in self.minimal_rescue_sets],
            "search_is_globally_exhaustive": self.search_is_globally_exhaustive,
            "searched_candidate_ids": self.searched_candidate_ids,
        }


def _parse_locus_index(value: Any) -> Optional[int]:
    if value is None:
        return None
    try:
        if isinstance(value, str):
            return int(value.upper().replace("L", "")) - 1
        return int(value) - 1
    except (TypeError, ValueError):
        return None


def _candidate_scope(tracer: NoveltyTracer, candidate: Candidate) -> Dict[str, Any]:
    """Normalize the observable intervention footprint for conflict checks."""
    details = candidate.details or {}
    candidate_type = candidate.candidate_type

    if candidate_type == "VARIANT":
        idx = _parse_locus_index(details.get("locus_id", details.get("position")))
        if idx is None:
            return {"kind": "invalid", "reason": "invalid_variant_locus"}
        return {"kind": "variant", "loci": {idx}}

    if candidate_type == "SEGMENT":
        try:
            parent = str(details.get("parent", "A")).upper()
            start = int(details.get("start", 0))
            end = int(details.get("end", len(tracer.offspring.loci_provenance)))
        except (TypeError, ValueError):
            return {"kind": "invalid", "reason": "invalid_segment_bounds"}
        locus_count = len(tracer.offspring.loci_provenance)
        if parent not in {"A", "B"} or start < 0 or end <= start or end > locus_count:
            return {"kind": "invalid", "reason": "invalid_segment_bounds"}
        return {
            "kind": "segment",
            "parent": parent,
            "start": start,
            "end": end,
        }

    if candidate_type == "INTERACTION":
        pair = tracer._resolve_interaction_pair(candidate)
        if pair is None:
            return {"kind": "invalid", "reason": "invalid_interaction_loci"}
        locus_count = len(tracer.offspring.loci_provenance)
        loci = {pair.locus_a_pos - 1, pair.locus_b_pos - 1}
        if len(loci) != 2 or not all(0 <= idx < locus_count for idx in loci):
            return {"kind": "invalid", "reason": "invalid_interaction_loci"}
        return {"kind": "interaction", "loci": loci}

    return {"kind": "invalid", "reason": "unsupported_candidate_type"}


def _pairwise_scope_conflict(left: Dict[str, Any], right: Dict[str, Any]) -> Optional[str]:
    left_kind = left["kind"]
    right_kind = right["kind"]

    if left_kind == "variant" and right_kind == "variant":
        if left["loci"] & right["loci"]:
            return "duplicate_variant_locus"

    if left_kind == "segment" and right_kind == "segment":
        if left["parent"] == right["parent"]:
            overlaps = max(left["start"], right["start"]) < min(
                left["end"], right["end"]
            )
            if overlaps:
                return "overlapping_segments"

    if left_kind == "variant" and right_kind == "segment":
        if any(right["start"] <= idx < right["end"] for idx in left["loci"]):
            return "variant_segment_overlap"
    if left_kind == "segment" and right_kind == "variant":
        if any(left["start"] <= idx < left["end"] for idx in right["loci"]):
            return "variant_segment_overlap"

    if left_kind == "interaction" and right_kind == "variant":
        if left["loci"] & right["loci"]:
            return "interaction_variant_overlap"
    if left_kind == "variant" and right_kind == "interaction":
        if left["loci"] & right["loci"]:
            return "interaction_variant_overlap"

    if left_kind == "interaction" and right_kind == "segment":
        if any(right["start"] <= idx < right["end"] for idx in left["loci"]):
            return "interaction_segment_overlap"
    if left_kind == "segment" and right_kind == "interaction":
        if any(left["start"] <= idx < left["end"] for idx in right["loci"]):
            return "interaction_segment_overlap"

    return None


def _combination_conflict(
    tracer: NoveltyTracer,
    candidates: Sequence[Candidate],
) -> Optional[str]:
    seen_ids = set()
    scopes: List[Dict[str, Any]] = []
    for candidate in candidates:
        if candidate.id in seen_ids:
            return "duplicate_candidate"
        seen_ids.add(candidate.id)
        scope = _candidate_scope(tracer, candidate)
        if scope["kind"] == "invalid":
            return scope["reason"]
        scopes.append(scope)

    for index, left in enumerate(scopes):
        for right in scopes[index + 1 :]:
            conflict = _pairwise_scope_conflict(left, right)
            if conflict is not None:
                return conflict
    return None


def _envelope_position(phenotype: float, parental_min: float, parental_max: float) -> str:
    if abs(phenotype - parental_min) <= NOVELTY_TOLERANCE:
        return "at_lower_bound"
    if abs(phenotype - parental_max) <= NOVELTY_TOLERANCE:
        return "at_upper_bound"
    return "inside_envelope"


def _theoretical_combination_count(candidate_count: int, max_set_size: int) -> int:
    return sum(comb(candidate_count, size) for size in range(1, min(candidate_count, max_set_size) + 1))


def _ranked_candidates(
    tracer: NoveltyTracer,
    ranked_results: Optional[Sequence[CounterfactualResult]],
) -> Tuple[List[CounterfactualResult], Dict[str, Candidate]]:
    results = list(ranked_results) if ranked_results is not None else tracer.rank_candidates()
    candidates = tracer.generate_candidates()
    candidates_by_id = {candidate.id: candidate for candidate in candidates}
    missing = [result.candidate_id for result in results if result.candidate_id not in candidates_by_id]
    if missing:
        raise ValueError(
            "Attribution results contain candidates unavailable from the existing candidate pipeline: "
            + ", ".join(missing)
        )
    return results, candidates_by_id


def _observable_candidate_provenance(
    tracer: NoveltyTracer,
    candidate: Candidate,
) -> Dict[str, Any]:
    """Retain the existing ancestry fields alongside each rescue member."""
    details = candidate.details or {}
    candidate_type = candidate.candidate_type

    if candidate_type == "INTERACTION":
        provenance = details.get("provenance")
        return provenance if isinstance(provenance, dict) else {}

    if candidate_type == "SEGMENT":
        parent = str(details.get("parent", "A")).upper()
        gamete = (
            tracer.offspring.maternal_gamete
            if parent == "A"
            else tracer.offspring.paternal_gamete
        )
        segment = next(
            (
                item
                for item in gamete.segments
                if item.start == int(details.get("start", -1))
                and item.end == int(details.get("end", -1))
            ),
            None,
        )
        return {
            "parent": parent,
            "segment": segment.to_dict() if segment is not None else None,
            "candidate_details": details,
        }

    if candidate_type == "VARIANT":
        idx = _parse_locus_index(details.get("locus_id", details.get("position")))
        if idx is None or not (0 <= idx < len(tracer.offspring.loci_provenance)):
            return {"candidate_details": details}
        locus_provenance = tracer.offspring.loci_provenance[idx]
        result: Dict[str, Any] = {
            "candidate_details": details,
            "locus_provenance": (
                locus_provenance.to_dict()
                if hasattr(locus_provenance, "to_dict")
                else None
            ),
        }
        if hasattr(tracer, "_transmission_provenance"):
            result["transmissions"] = {
                "A": tracer._transmission_provenance(idx, "A"),
                "B": tracer._transmission_provenance(idx, "B"),
            }
        return result

    return {"candidate_details": details}


def _make_rescue_set(
    tracer: NoveltyTracer,
    combo: Sequence[Candidate],
    ranked_by_id: Dict[str, CounterfactualResult],
    counterfactual_phenotype: float,
) -> MinimalRescueSet:
    parental_min = min(tracer.y_A, tracer.y_B)
    parental_max = max(tracer.y_A, tracer.y_B)
    assessment = detect_novelty(
        tracer.y_A,
        tracer.y_B,
        counterfactual_phenotype,
        tolerance=NOVELTY_TOLERANCE,
    )
    candidate_ids = [candidate.id for candidate in combo]
    member_results = [ranked_by_id[candidate.id] for candidate in combo]
    member_scores = {
        candidate.id: float(result.attribution_score)
        for candidate, result in zip(combo, member_results)
    }
    member_provenance = [
        {
            "candidate_id": candidate.id,
            "candidate_name": candidate.name,
            "candidate_type": candidate.candidate_type,
            "intervention": result.intervention,
            "attribution_score": float(result.attribution_score),
            "candidate_details": candidate.details,
            "provenance_chain": list(candidate.provenance_chain),
            "provenance_summary": result.provenance_summary,
            "observable_provenance": _observable_candidate_provenance(tracer, candidate),
        }
        for candidate, result in zip(combo, member_results)
    ]
    return MinimalRescueSet(
        candidate_ids=candidate_ids,
        candidate_types=[candidate.candidate_type for candidate in combo],
        candidate_names=[candidate.name for candidate in combo],
        counterfactual_phenotype=float(counterfactual_phenotype),
        joint_delta=float(tracer.y_O - counterfactual_phenotype),
        novelty_removed=not assessment.is_transgressive,
        inside_parental_envelope=not assessment.is_transgressive,
        envelope_position=_envelope_position(counterfactual_phenotype, parental_min, parental_max),
        member_attribution_scores=member_scores,
        mean_attribution_score=float(sum(member_scores.values()) / len(member_scores)),
        provenance_summary=[result.provenance_summary for result in member_results],
        member_provenance=member_provenance,
        contains_variant=any(candidate.candidate_type == "VARIANT" for candidate in combo),
        contains_segment=any(candidate.candidate_type == "SEGMENT" for candidate in combo),
        contains_interaction=any(candidate.candidate_type == "INTERACTION" for candidate in combo),
    )


def _rescue_sort_key(rescue: MinimalRescueSet):
    """Secondary ordering after cardinality: effect, score, lexical IDs."""
    return (
        -abs(rescue.joint_delta),
        -rescue.mean_attribution_score,
        tuple(sorted(rescue.candidate_ids)),
    )


def search_minimal_novelty_rescue(
    tracer: NoveltyTracer,
    ranked_results: Optional[Sequence[CounterfactualResult]] = None,
    top_k: int = DEFAULT_TOP_K,
    max_set_size: int = DEFAULT_MAX_SET_SIZE,
    max_returned_sets: int = DEFAULT_MAX_RETURNED_SETS,
    max_combination_count: int = DEFAULT_MAX_COMBINATION_COUNT,
) -> MinimalRescueResult:
    """Search cardinality-first for bounded joint counterfactual rescues.

    ``ranked_results`` must be the existing attribution ranking when supplied;
    otherwise it is generated by ``NoveltyTracer.rank_candidates``.  Candidate
    pruning affects only the search pool and never changes attribution scores
    or their ranking.
    """
    if not 1 <= top_k <= MAX_TOP_K:
        raise ValueError(f"top_k must be between 1 and {MAX_TOP_K}.")
    if not 1 <= max_set_size <= MAX_SET_SIZE:
        raise ValueError(f"max_set_size must be between 1 and {MAX_SET_SIZE}.")
    if not 1 <= max_returned_sets <= MAX_RETURNED_SETS:
        raise ValueError(f"max_returned_sets must be between 1 and {MAX_RETURNED_SETS}.")
    if max_combination_count <= 0:
        raise ValueError("max_combination_count must be greater than zero.")

    results, candidates_by_id = _ranked_candidates(tracer, ranked_results)
    candidate_pool_size = len(results)
    search_top_k = min(top_k, candidate_pool_size)
    top_results = results[:search_top_k]
    top_candidates = [candidates_by_id[result.candidate_id] for result in top_results]
    ranked_by_id = {result.candidate_id: result for result in results}
    theoretical_count = _theoretical_combination_count(search_top_k, max_set_size)
    if theoretical_count > max_combination_count:
        raise ValueError(
            "Requested rescue search exceeds the combination ceiling: "
            f"{theoretical_count} combinations > {max_combination_count}. "
            "Reduce top_k/max_set_size or raise max_combination_count explicitly."
        )

    parental_min = min(tracer.y_A, tracer.y_B)
    parental_max = max(tracer.y_A, tracer.y_B)
    baseline_assessment = detect_novelty(
        tracer.y_A,
        tracer.y_B,
        tracer.y_O,
        tolerance=NOVELTY_TOLERANCE,
    )

    if not baseline_assessment.is_transgressive:
        return MinimalRescueResult(
            search_status="baseline_not_transgressive",
            baseline_phenotype=float(tracer.y_O),
            parent_a_phenotype=float(tracer.y_A),
            parent_b_phenotype=float(tracer.y_B),
            parental_envelope={"min": float(parental_min), "max": float(parental_max)},
            candidate_pool_size=candidate_pool_size,
            search_top_k=search_top_k,
            max_set_size=max_set_size,
            max_returned_sets=max_returned_sets,
            maximum_theoretical_combinations=theoretical_count,
            evaluated_combination_count=0,
            invalid_combination_count=0,
            invalid_combination_reasons={},
            minimal_cardinality=None,
            minimal_rescue_sets=[],
            search_is_globally_exhaustive=False,
            searched_candidate_ids=[candidate.id for candidate in top_candidates],
        )

    evaluated_count = 0
    invalid_count = 0
    invalid_reasons: Dict[str, int] = {}
    rescues: List[MinimalRescueSet] = []
    minimal_cardinality: Optional[int] = None

    for set_size in range(1, min(max_set_size, search_top_k) + 1):
        size_rescues: List[MinimalRescueSet] = []
        for combo in combinations(top_candidates, set_size):
            conflict = _combination_conflict(tracer, combo)
            if conflict is not None:
                invalid_count += 1
                invalid_reasons[conflict] = invalid_reasons.get(conflict, 0) + 1
                continue

            evaluated_count += 1
            counterfactual_phenotype = tracer.run_joint_counterfactual(list(combo)).total
            assessment = detect_novelty(
                tracer.y_A,
                tracer.y_B,
                counterfactual_phenotype,
                tolerance=NOVELTY_TOLERANCE,
            )
            if assessment.is_transgressive:
                continue
            size_rescues.append(
                _make_rescue_set(
                    tracer,
                    combo,
                    ranked_by_id,
                    counterfactual_phenotype,
                )
            )

        if size_rescues:
            size_rescues.sort(key=_rescue_sort_key)
            rescues = size_rescues[:max_returned_sets]
            minimal_cardinality = set_size
            break

    globally_exhaustive = (
        baseline_assessment.is_transgressive
        and search_top_k == candidate_pool_size
        and (
            minimal_cardinality is not None
            or max_set_size >= candidate_pool_size
        )
    )
    return MinimalRescueResult(
        search_status="rescue_found" if rescues else "no_rescue_within_search_bounds",
        baseline_phenotype=float(tracer.y_O),
        parent_a_phenotype=float(tracer.y_A),
        parent_b_phenotype=float(tracer.y_B),
        parental_envelope={"min": float(parental_min), "max": float(parental_max)},
        candidate_pool_size=candidate_pool_size,
        search_top_k=search_top_k,
        max_set_size=max_set_size,
        max_returned_sets=max_returned_sets,
        maximum_theoretical_combinations=theoretical_count,
        evaluated_combination_count=evaluated_count,
        invalid_combination_count=invalid_count,
        invalid_combination_reasons=invalid_reasons,
        minimal_cardinality=minimal_cardinality,
        minimal_rescue_sets=rescues,
        search_is_globally_exhaustive=globally_exhaustive,
        searched_candidate_ids=[candidate.id for candidate in top_candidates],
    )
