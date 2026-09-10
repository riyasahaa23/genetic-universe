"""Reproducible blind-recovery benchmark and ablation study.

This module is deliberately separate from production attribution.  Synthetic
truth is created in an evaluator-side record, while the ``NoveltyTracer`` sees
only a phenotype model with neutral model-edge identifiers and observable
parental/transmitted genomes.  Truth is consulted only after the blind ranking
has been produced.
"""

import hashlib
import json
import time
from collections import defaultdict
from dataclasses import asdict, dataclass
from itertools import combinations
from statistics import median
from typing import Any, Dict, List, Optional, Sequence, Set, Tuple

import numpy as np

from app.scientific.synthetic.attribution import (
    INTERACTION_CONTRAST_TOLERANCE,
    Candidate,
    CounterfactualResult,
    NoveltyTracer,
)
from app.scientific.synthetic.meiotic_null import run_meiotic_null_distribution
from app.scientific.synthetic.minimal_rescue import (
    _combination_conflict,
    search_minimal_novelty_rescue,
)
from app.scientific.synthetic.novelty import detect_novelty
from app.scientific.synthetic.phenotype import EpistaticPair, PhenotypeConfig, PhenotypeEngine
from app.scientific.synthetic.recombination import (
    Gamete,
    OffspringGenome,
    ParentGenome,
    fertilize,
    generate_loci,
    simulate_meiosis,
)

SCIENTIFIC_VALIDATION_VERSION = "1.1.0"
BOOTSTRAP_CONFIDENCE_LEVEL = 0.95
DEFAULT_N_SEEDS = 50
DEFAULT_BOOTSTRAP_SEED = 20250910
DEFAULT_BOOTSTRAP_REPLICATES = 1000
DEFAULT_NULL_SIMULATIONS = 100
DEFAULT_TOP_K = 3
DEFAULT_RESCUE_TOP_K = 8
DEFAULT_RESCUE_MAX_SET_SIZE = 3
DEFAULT_RESCUE_MAX_RETURNED_SETS = 10
DEFAULT_RESCUE_MAX_COMBINATIONS = 500
NOVELTY_TOLERANCE = 1e-6


@dataclass(frozen=True)
class DifficultySpec:
    """Explicit deterministic synthetic difficulty definition."""

    name: str
    locus_count: int
    causal_pairs: Tuple[Tuple[int, int], ...]
    causal_effects: Tuple[float, ...]
    distractor_pairs: Tuple[Tuple[int, int], ...]
    additive_loci: Tuple[int, ...]
    additive_effect: float
    background_allele_probability: float
    maternal_extra_crossovers: int
    paternal_crossovers: int
    phenotype_noise: float
    null_simulations: int = DEFAULT_NULL_SIMULATIONS

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


DIFFICULTY_SPECS: Dict[str, DifficultySpec] = {
    "easy": DifficultySpec(
        name="easy",
        locus_count=24,
        causal_pairs=((4, 18),),
        causal_effects=(18.0,),
        distractor_pairs=((5, 6),),
        additive_loci=(2, 7, 21),
        additive_effect=0.20,
        background_allele_probability=0.02,
        maternal_extra_crossovers=0,
        paternal_crossovers=1,
        phenotype_noise=0.0,
    ),
    "medium": DifficultySpec(
        name="medium",
        locus_count=50,
        causal_pairs=((8, 31), (12, 36)),
        causal_effects=(10.0, 8.0),
        distractor_pairs=((4, 5), (6, 7), (22, 23)),
        additive_loci=(2, 3, 14, 27, 44),
        additive_effect=0.50,
        background_allele_probability=0.04,
        maternal_extra_crossovers=1,
        paternal_crossovers=2,
        phenotype_noise=0.0,
    ),
    "hard": DifficultySpec(
        name="hard",
        locus_count=100,
        causal_pairs=((10, 56), (14, 62), (18, 68)),
        causal_effects=(5.0, 4.0, 3.0),
        distractor_pairs=((2, 3), (4, 5), (6, 7), (22, 23), (30, 31)),
        additive_loci=(25, 29, 34, 40, 45, 72, 76, 81, 87, 93),
        additive_effect=0.35,
        background_allele_probability=0.05,
        maternal_extra_crossovers=3,
        paternal_crossovers=4,
        phenotype_noise=0.0,
    ),
}


@dataclass
class SyntheticWorld:
    """A simulated world plus evaluator-only truth metadata."""

    seed: int
    difficulty: str
    tracer: NoveltyTracer
    truth: Dict[str, Any]
    candidate_map: Dict[str, Candidate]
    world_fingerprint: str


def get_difficulty_spec(difficulty: str) -> DifficultySpec:
    try:
        return DIFFICULTY_SPECS[difficulty.lower()]
    except KeyError as exc:
        raise ValueError(
            f"Unknown difficulty {difficulty!r}; choose easy, medium, or hard."
        ) from exc


def _sample_crossovers(
    rng: np.random.Generator,
    locus_count: int,
    count: int,
    minimum: int = 1,
    maximum: Optional[int] = None,
) -> List[int]:
    maximum = locus_count - 1 if maximum is None else maximum
    available = list(range(minimum, maximum + 1))
    if count <= 0 or not available:
        return []
    count = min(count, len(available))
    return sorted(int(item) for item in rng.choice(available, size=count, replace=False))


def _world_fingerprint(
    parent_a: ParentGenome,
    parent_b: ParentGenome,
    gamete_a: Gamete,
    gamete_b: Gamete,
    offspring: OffspringGenome,
) -> str:
    payload = {
        "parent_a": [parent_a.homolog_1, parent_a.homolog_2],
        "parent_b": [parent_b.homolog_1, parent_b.homolog_2],
        "gamete_a": {"alleles": gamete_a.alleles, "crossovers": gamete_a.crossovers},
        "gamete_b": {"alleles": gamete_b.alleles, "crossovers": gamete_b.crossovers},
        "offspring": offspring.get_dosage(),
    }
    encoded = json.dumps(payload, sort_keys=True, separators=(",", ":")).encode()
    return hashlib.sha256(encoded).hexdigest()


def _transmitted_segment_record(gamete: Gamete, locus_index: int) -> Optional[Dict[str, Any]]:
    """Return evaluator-side segment truth for one transmitted locus."""
    for segment in gamete.segments:
        if segment.start <= locus_index < segment.end:
            return segment.to_dict()
    return None


def build_synthetic_world(difficulty: str, seed: int) -> SyntheticWorld:
    """Build one seed-specific world without exposing evaluator truth to tracing."""
    if seed < 0:
        raise ValueError("Benchmark seeds must be non-negative.")
    spec = get_difficulty_spec(difficulty)
    rng = np.random.default_rng(seed)
    loci = generate_loci(spec.locus_count)

    # Background variation makes seeds genuinely different.  Parent B is kept
    # phenotypically quiet so unrelated paternal crossovers are a clean
    # negative control rather than hidden causal signal.
    parent_a_h1 = [int(rng.random() < spec.background_allele_probability) for _ in loci]
    parent_a_h2 = [int(rng.random() < spec.background_allele_probability) for _ in loci]
    parent_b_h1 = [0] * spec.locus_count
    parent_b_h2 = [0] * spec.locus_count

    model_pairs: List[EpistaticPair] = []
    protected_positions = {
        position
        for pair in (*spec.causal_pairs, *spec.distractor_pairs)
        for position in pair
    }

    # Keep all model-edge loci free of random background alleles.
    for position in protected_positions:
        idx = position - 1
        parent_a_h1[idx] = 0
        parent_a_h2[idx] = 0

    # The causal recombinant haplotype carries the first locus on A1 and the
    # second locus on A2.  A crossover between the two assembles each pair in
    # cis without making either parental homolog carry the pair.
    breakpoint = (max(pair[0] for pair in spec.causal_pairs) + min(pair[1] for pair in spec.causal_pairs)) // 2
    for pair_index, ((locus_a, locus_b), coefficient) in enumerate(
        zip(spec.causal_pairs, spec.causal_effects), start=1
    ):
        idx_a = locus_a - 1
        idx_b = locus_b - 1
        parent_a_h1[idx_a] = 1
        parent_a_h2[idx_a] = 0
        parent_a_h1[idx_b] = 0
        parent_a_h2[idx_b] = 1
        model_pairs.append(
            EpistaticPair(
                id=f"MODEL_EDGE_{pair_index:02d}",
                locus_a=f"L{locus_a:02d}",
                locus_b=f"L{locus_b:02d}",
                locus_a_pos=locus_a,
                locus_b_pos=locus_b,
                coefficient=coefficient,
                description="Neutral model edge used by the blind phenotype evaluator",
            )
        )

    # Zero-effect active model edges create realistic distractor candidates
    # without becoming planted truth.  They remain ordinary phenotype-model
    # configuration, not benchmark labels.
    for distractor_index, (locus_a, locus_b) in enumerate(spec.distractor_pairs, start=1):
        parent_a_h1[locus_a - 1] = 1
        parent_a_h1[locus_b - 1] = 1
        parent_a_h2[locus_a - 1] = 0
        parent_a_h2[locus_b - 1] = 0
        model_pairs.append(
            EpistaticPair(
                id=f"MODEL_NULL_{distractor_index:02d}",
                locus_a=f"L{locus_a:02d}",
                locus_b=f"L{locus_b:02d}",
                locus_a_pos=locus_a,
                locus_b_pos=locus_b,
                coefficient=0.0,
                description="Neutral zero-effect model edge used as a distractor",
            )
        )

    additive = {
        f"L{position:02d}": spec.additive_effect
        for position in spec.additive_loci
        if position <= spec.locus_count
    }
    phenotype_config = PhenotypeConfig(
        base_value=0.0,
        additive=additive,
        epistasis=model_pairs,
        mode="cis_haplotype",
    )
    phenotype_engine = PhenotypeEngine(phenotype_config)

    parent_a = ParentGenome("A", parent_a_h1, parent_a_h2, loci)
    parent_b = ParentGenome("B", parent_b_h1, parent_b_h2, loci)

    maximum_causal_locus = max(position for pair in spec.causal_pairs for position in pair)
    maternal_extra = _sample_crossovers(
        rng,
        spec.locus_count,
        spec.maternal_extra_crossovers,
        minimum=maximum_causal_locus + 1,
    )
    maternal_crossovers = sorted({breakpoint, *maternal_extra})
    paternal_crossovers = _sample_crossovers(
        rng,
        spec.locus_count,
        spec.paternal_crossovers,
    )

    gamete_a = simulate_meiosis(
        parent_a.homolog_1,
        parent_a.homolog_2,
        "A",
        crossover_positions=maternal_crossovers,
        start_homolog=0,
    )
    gamete_b = simulate_meiosis(
        parent_b.homolog_1,
        parent_b.homolog_2,
        "B",
        crossover_positions=paternal_crossovers,
        start_homolog=int(rng.integers(0, 2)),
    )
    offspring = fertilize(gamete_a, gamete_b, loci, offspring_id=f"O_{seed:06d}")

    tracer = NoveltyTracer(parent_a, parent_b, offspring, phenotype_engine)
    candidate_map = {candidate.id: candidate for candidate in tracer.generate_candidates()}

    # The evaluator keeps model-edge identifiers separate from the observable
    # candidate IDs emitted by the blind canonical tracer.  Ground truth is
    # matched to candidates only after ranking, never injected into inference.
    causal_ids = [f"E_L{pair[0]:02d}_L{pair[1]:02d}" for pair in spec.causal_pairs]
    generative_mechanisms: List[Dict[str, Any]] = []
    for index, (candidate_id, pair, coefficient) in enumerate(
        zip(causal_ids, spec.causal_pairs, spec.causal_effects),
        start=1,
    ):
        locus_a, locus_b = pair
        transmitted_segments = []
        for locus_index in (locus_a - 1, locus_b - 1):
            segment = _transmitted_segment_record(gamete_a, locus_index)
            if segment is not None and segment not in transmitted_segments:
                transmitted_segments.append(segment)
        generative_mechanisms.append(
            {
                "mechanism_id": f"MECHANISM_{index:02d}",
                "interaction_candidate_id": candidate_id,
                "causal_locus_positions": [locus_a, locus_b],
                "causal_locus_ids": [f"L{locus_a:02d}", f"L{locus_b:02d}"],
                "phenotype_terms": [
                    {
                        "term_type": "epistasis",
                        "term_id": candidate_id,
                        "coefficient": coefficient,
                    }
                ],
                "transmitted_segments": transmitted_segments,
                "recombination_intervals": [
                    {
                        "parent": "A",
                        "breakpoint": breakpoint,
                        "associated_homologs": ["A1", "A2"],
                    }
                ],
                "generative_configuration": {
                    "parent": "A",
                    "homologs": ["A1", "A2"],
                    "recombinant_assembly": True,
                },
            }
        )
    truth = {
        "causal_candidate_ids": causal_ids,
        "causal_pair_records": [
            {
                "candidate_id": candidate_id,
                "truth_label": f"planted_pair_{index:02d}",
                "locus_a_pos": pair[0],
                "locus_b_pos": pair[1],
                "coefficient": coefficient,
                "expected_parent": "A",
                "expected_breakpoint": breakpoint,
                "expected_homologs": ["A1", "A2"],
                "mechanism_id": f"MECHANISM_{index:02d}",
            }
            for index, (candidate_id, pair, coefficient) in enumerate(
                zip(causal_ids, spec.causal_pairs, spec.causal_effects),
                start=1,
            )
        ],
        # Structured truth is evaluator-only.  It is intentionally not passed
        # to the tracer or any production attribution method.
        "generative_mechanisms": generative_mechanisms,
        "causal_locus_positions": sorted(
            {
                position
                for mechanism in generative_mechanisms
                for position in mechanism["causal_locus_positions"]
            }
        ),
        "causal_interaction_edges": causal_ids,
        "planted_minimal_intervention_sets": [list(causal_ids)],
        "maternal_crossovers": maternal_crossovers,
        "paternal_crossovers": paternal_crossovers,
    }

    return SyntheticWorld(
        seed=seed,
        difficulty=spec.name,
        tracer=tracer,
        truth=truth,
        candidate_map=candidate_map,
        world_fingerprint=_world_fingerprint(
            parent_a,
            parent_b,
            gamete_a,
            gamete_b,
            offspring,
        ),
    )


def run_blind_attribution(tracer: NoveltyTracer) -> List[CounterfactualResult]:
    """Run inference with no evaluator truth argument or truth lookup."""
    return tracer.rank_candidates()


def _safe_divide(numerator: float, denominator: float, empty: float = 0.0) -> float:
    return float(numerator / denominator) if denominator else float(empty)


def _ranking_metrics(
    ranked_results: Sequence[CounterfactualResult],
    truth: Dict[str, Any],
    top_k: int,
    candidate_map: Dict[str, Candidate],
) -> Dict[str, float]:
    causal_ids = set(truth["causal_candidate_ids"])
    predicted_top_k = list(ranked_results[:top_k])
    predicted_ids = {result.candidate_id for result in predicted_top_k}
    true_positives = len(predicted_ids & causal_ids)
    precision = _safe_divide(true_positives, len(predicted_ids))
    recall = _safe_divide(true_positives, len(causal_ids), empty=1.0)
    f1 = _safe_divide(2 * precision * recall, precision + recall)

    def recovery(k: int) -> float:
        return float(any(result.candidate_id in causal_ids for result in ranked_results[:k]))

    reciprocal_rank = 0.0
    for index, result in enumerate(ranked_results, start=1):
        if result.candidate_id in causal_ids:
            reciprocal_rank = 1.0 / index
            break

    predicted_interactions = {
        result.candidate_id
        for result in predicted_top_k
        if result.candidate_type == "INTERACTION"
    }
    causal_interactions = {
        record["candidate_id"] for record in truth["causal_pair_records"]
    }
    interaction_tp = len(predicted_interactions & causal_interactions)

    causal_deltas = [
        result.absolute_effect
        for result in ranked_results
        if result.candidate_id in causal_ids
    ]
    null_deltas = [
        result.absolute_effect
        for result in ranked_results
        if result.candidate_id not in causal_ids
    ]
    mean_causal = float(np.mean(causal_deltas)) if causal_deltas else 0.0
    mean_null = float(np.mean(null_deltas)) if null_deltas else 0.0
    ratio = _safe_divide(mean_causal, mean_null, empty=mean_causal if mean_causal else 1.0)
    causal_above_null = _safe_divide(
        sum(delta > mean_null for delta in causal_deltas),
        len(causal_deltas),
        empty=1.0,
    )
    causal_pair_results = [
        result
        for result in ranked_results
        if result.candidate_id in causal_ids
        and result.candidate_type == "INTERACTION"
        and result.epistatic_excess is not None
    ]
    null_pair_results = [
        result
        for result in ranked_results
        if result.candidate_id not in causal_ids
        and result.candidate_type == "INTERACTION"
        and result.epistatic_excess is not None
    ]
    causal_excesses = [
        float(result.epistatic_excess) for result in causal_pair_results
    ]
    null_excesses = [float(result.epistatic_excess) for result in null_pair_results]

    provenance_matches = 0
    breakpoint_matches = 0
    top_result_by_id = {
        result.candidate_id: result for result in predicted_top_k
    }
    for record in truth["causal_pair_records"]:
        result = top_result_by_id.get(record["candidate_id"])
        candidate = candidate_map.get(record["candidate_id"])
        if result is None or candidate is None:
            continue
        provenance = result.provenance or candidate.details.get("provenance", {})
        matched_provenance, matched_breakpoint = _match_recombination_provenance(
            provenance,
            record,
        )
        provenance_matches += int(matched_provenance)
        breakpoint_matches += int(matched_breakpoint)

    return {
        "precision": precision,
        "recall": recall,
        "f1": f1,
        "top1_recovery": recovery(1),
        "top3_recovery": recovery(3),
        "topk_recovery": recovery(top_k),
        "mean_reciprocal_rank": reciprocal_rank,
        "interaction_pair_precision": _safe_divide(
            interaction_tp,
            len(predicted_interactions),
        ),
        "interaction_pair_recall": _safe_divide(
            interaction_tp,
            len(causal_interactions),
            empty=1.0,
        ),
        "planted_pair_recovery_rate": _safe_divide(
            interaction_tp,
            len(causal_interactions),
            empty=1.0,
        ),
        "mean_causal_abs_delta": mean_causal,
        "mean_null_abs_delta": mean_null,
        "causal_vs_null_separation_ratio": ratio,
        "fraction_causal_delta_gt_null_mean": causal_above_null,
        # Formal pairwise non-additivity is reported as explanatory evidence.
        # It is intentionally not fed back into the production ranking by this
        # benchmark, so the no-pairwise-synergy ablation can be compared
        # without changing production attribution behavior.
        "mean_causal_epistatic_excess": (
            float(np.mean(causal_excesses)) if causal_excesses else 0.0
        ),
        "mean_null_epistatic_excess": (
            float(np.mean(null_excesses)) if null_excesses else 0.0
        ),
        "fraction_causal_pairs_positive_epistatic_excess": _safe_divide(
            sum(value > INTERACTION_CONTRAST_TOLERANCE for value in causal_excesses),
            len(causal_excesses),
            empty=1.0,
        ),
        "breakpoint_interval_recovery_rate": _safe_divide(
            breakpoint_matches,
            len(truth["causal_pair_records"]),
            empty=1.0,
        ),
        "ancestry_provenance_recovery_rate": _safe_divide(
            provenance_matches,
            len(truth["causal_pair_records"]),
            empty=1.0,
        ),
    }


def _match_recombination_provenance(
    provenance: Dict[str, Any],
    record: Dict[str, Any],
) -> Tuple[bool, bool]:
    if not provenance:
        return False, False
    provenance_match = False
    breakpoint_match = False
    for active in provenance.get("active_haplotypes", []):
        if active.get("parent") != record["expected_parent"]:
            continue
        locus_a = active.get("locus_a", {})
        locus_b = active.get("locus_b", {})
        segment_a = locus_a.get("inherited_segment") or {}
        segment_b = locus_b.get("inherited_segment") or {}
        if not active.get("recombinant_assembly"):
            continue
        provenance_match = (
            locus_a.get("homolog") == record["expected_homologs"][0]
            and locus_b.get("homolog") == record["expected_homologs"][1]
        )
        expected_breakpoint = record["expected_breakpoint"]
        breakpoint_match = (
            segment_a.get("end") == expected_breakpoint
            and segment_b.get("start") == expected_breakpoint
        )
        if provenance_match and breakpoint_match:
            break
    return provenance_match, breakpoint_match


def _rank_effect_only(results: Sequence[CounterfactualResult]) -> List[CounterfactualResult]:
    return sorted(
        results,
        key=lambda result: (-result.absolute_effect, result.candidate_id),
    )


def _rank_without_provenance(results: Sequence[CounterfactualResult]) -> List[CounterfactualResult]:
    type_priority = {"INTERACTION": 0, "SEGMENT": 1, "VARIANT": 2}

    def score_without_provenance(result: CounterfactualResult) -> float:
        return result.score_components.get("normalized_effect", 0.0) + result.score_components.get(
            "stability", 0.0
        )

    return sorted(
        results,
        key=lambda result: (
            type_priority.get(result.candidate_type, 9),
            -score_without_provenance(result),
            -result.absolute_effect,
            result.candidate_id,
        ),
    )


def _rank_random(
    results: Sequence[CounterfactualResult],
    seed: int,
) -> List[CounterfactualResult]:
    rng = np.random.default_rng(seed)
    order = rng.permutation(len(results))
    return [results[int(index)] for index in order]


@dataclass
class EvaluatorRescueEnumeration:
    """Exhaustive evaluator-side outcomes under existing intervention operators."""

    minimum_cardinality: Optional[int]
    minimal_sets: List[Tuple[str, ...]]
    outcomes: Dict[Tuple[str, ...], Dict[str, Any]]
    evaluated_combination_count: int
    invalid_combination_count: int


def _enumerate_operator_rescue_truth(
    world: SyntheticWorld,
    candidate_map: Dict[str, Candidate],
    max_set_size: int = DEFAULT_RESCUE_MAX_SET_SIZE,
) -> EvaluatorRescueEnumeration:
    """Enumerate operator-relative rescue truth without using predictions.

    This is evaluator code.  It uses the same candidate interventions and
    conflict policy as production minimal-rescue search, but exhaustively
    evaluates the full available candidate pool.  It is never called by
    ``run_blind_attribution`` and its result is not passed to the tracer.
    """
    candidates = sorted(candidate_map.values(), key=lambda candidate: candidate.id)
    outcomes: Dict[Tuple[str, ...], Dict[str, Any]] = {}
    evaluated_count = 0
    invalid_count = 0
    rescues_by_size: Dict[int, List[Tuple[str, ...]]] = defaultdict(list)

    if not world.tracer.baseline_novelty.is_transgressive:
        return EvaluatorRescueEnumeration(
            minimum_cardinality=None,
            minimal_sets=[],
            outcomes=outcomes,
            evaluated_combination_count=0,
            invalid_combination_count=0,
        )

    for set_size in range(1, min(max_set_size, len(candidates)) + 1):
        for combo in combinations(candidates, set_size):
            conflict = _combination_conflict(world.tracer, combo)
            if conflict is not None:
                invalid_count += 1
                continue
            evaluated_count += 1
            candidate_ids = tuple(sorted(candidate.id for candidate in combo))
            counterfactual_phenotype = world.tracer.run_joint_counterfactual(list(combo)).total
            is_rescue = not detect_novelty(
                world.tracer.y_A,
                world.tracer.y_B,
                counterfactual_phenotype,
                tolerance=NOVELTY_TOLERANCE,
            ).is_transgressive
            outcomes[candidate_ids] = {
                "counterfactual_phenotype": float(counterfactual_phenotype),
                "novelty_removed": bool(is_rescue),
                "candidate_types": tuple(sorted(candidate.candidate_type for candidate in combo)),
                "scope_size": sum(_candidate_scope_size(world.tracer, candidate) for candidate in combo),
            }
            if is_rescue:
                rescues_by_size[set_size].append(candidate_ids)

    minimum_cardinality = min(rescues_by_size) if rescues_by_size else None
    minimal_sets = sorted(rescues_by_size.get(minimum_cardinality, [])) if minimum_cardinality else []
    return EvaluatorRescueEnumeration(
        minimum_cardinality=minimum_cardinality,
        minimal_sets=minimal_sets,
        outcomes=outcomes,
        evaluated_combination_count=evaluated_count,
        invalid_combination_count=invalid_count,
    )


def _parse_benchmark_position(value: Any) -> Optional[int]:
    if value is None:
        return None
    try:
        return int(str(value).upper().replace("L", "")) - 1
    except (TypeError, ValueError):
        return None


def _candidate_scope_indices(tracer: NoveltyTracer, candidate: Candidate) -> Set[int]:
    details = candidate.details or {}
    if candidate.candidate_type == "VARIANT":
        position = _parse_benchmark_position(details.get("locus_id", details.get("position")))
        return {position} if position is not None else set()
    if candidate.candidate_type == "SEGMENT":
        try:
            start = int(details.get("start", 0))
            end = int(details.get("end", 0))
        except (TypeError, ValueError):
            return set()
        return set(range(max(0, start), max(0, end)))
    if candidate.candidate_type == "INTERACTION":
        pair = tracer._resolve_interaction_pair(candidate)
        if pair is None:
            return set()
        return {pair.locus_a_pos - 1, pair.locus_b_pos - 1}
    return set()


def _candidate_scope_size(tracer: NoveltyTracer, candidate: Candidate) -> int:
    return len(_candidate_scope_indices(tracer, candidate))


def _segment_alters_indices(
    tracer: NoveltyTracer,
    candidate: Candidate,
    indices: Set[int],
) -> Set[int]:
    if candidate.candidate_type != "SEGMENT":
        return set()
    details = candidate.details or {}
    parent = str(details.get("parent", "A")).upper()
    try:
        start = int(details.get("start", 0))
        end = int(details.get("end", 0))
    except (TypeError, ValueError):
        return set()
    if parent == "A":
        gamete = tracer.offspring.maternal_gamete
        parent_genome = tracer.parent_a
    elif parent == "B":
        gamete = tracer.offspring.paternal_gamete
        parent_genome = tracer.parent_b
    else:
        return set()
    source_homolog = str(details.get("source_homolog", ""))
    if source_homolog == f"{parent_genome.parent_id}1":
        alternative = parent_genome.homolog_2
    elif source_homolog == f"{parent_genome.parent_id}2":
        alternative = parent_genome.homolog_1
    else:
        return set()
    return {
        index
        for index in indices
        if start <= index < end
        and 0 <= index < len(gamete.alleles)
        and gamete.alleles[index] != alternative[index]
    }


def _candidate_mechanism_profile(
    world: SyntheticWorld,
    candidate: Candidate,
) -> Dict[str, Any]:
    """Classify one prediction against structured evaluator truth.

    Genomic overlap alone is insufficient: a segment must actually alter a
    transmitted causal allele, and an interaction must actually identify the
    corresponding model pair.  This keeps nearby or inactive segments from
    receiving mechanism credit merely because they share a chromosome.
    """
    tracer = world.tracer
    scope_indices = _candidate_scope_indices(tracer, candidate)
    matched_mechanisms: List[str] = []
    altered_causal_indices: Set[int] = set()
    covered_causal_indices: Set[int] = set()
    exact_representation = False

    pair = tracer._resolve_interaction_pair(candidate) if candidate.candidate_type == "INTERACTION" else None
    for mechanism in world.truth.get("generative_mechanisms", []):
        causal_indices = {position - 1 for position in mechanism["causal_locus_positions"]}
        covered = scope_indices & causal_indices
        covered_causal_indices.update(covered)
        altered: Set[int] = set()
        if candidate.candidate_type == "INTERACTION" and pair is not None:
            pair_indices = {pair.locus_a_pos - 1, pair.locus_b_pos - 1}
            if pair_indices == causal_indices:
                altered = set(causal_indices)
                exact_representation = candidate.id == mechanism["interaction_candidate_id"]
        elif candidate.candidate_type == "VARIANT":
            position = next(iter(scope_indices), None)
            if position in causal_indices:
                dosage = tracer.offspring.get_dosage()[position]
                if dosage > 0:
                    altered = {position}
        elif candidate.candidate_type == "SEGMENT":
            altered = _segment_alters_indices(tracer, candidate, causal_indices)

        if altered:
            matched_mechanisms.append(mechanism["mechanism_id"])
            altered_causal_indices.update(altered)

    causal_union = {
        position - 1
        for mechanism in world.truth.get("generative_mechanisms", [])
        for position in mechanism["causal_locus_positions"]
    }
    matched_causal_union = {
        position - 1
        for mechanism in world.truth.get("generative_mechanisms", [])
        if mechanism["mechanism_id"] in matched_mechanisms
        for position in mechanism["causal_locus_positions"]
    }
    denominator = len(matched_causal_union) or len(causal_union) or 1
    return {
        "mechanism_ids": sorted(set(matched_mechanisms)),
        "scope_indices": scope_indices,
        "covered_causal_indices": covered_causal_indices,
        "altered_causal_indices": altered_causal_indices,
        "causal_locus_coverage": (
            len(altered_causal_indices) / len(causal_union) if causal_union else 0.0
        ),
        "mechanism_overlap_fraction": len(altered_causal_indices) / denominator,
        "extra_locus_count": len(scope_indices - causal_union),
        "segment_precision": (
            len(altered_causal_indices) / len(scope_indices)
            if scope_indices
            else 0.0
        ),
        "exact_representation": exact_representation,
    }


def _combination_mechanism_profile(
    world: SyntheticWorld,
    candidates: Sequence[Candidate],
) -> Dict[str, Any]:
    profiles = [_candidate_mechanism_profile(world, candidate) for candidate in candidates]
    scope_indices = set().union(*(profile["scope_indices"] for profile in profiles)) if profiles else set()
    covered = set().union(*(profile["covered_causal_indices"] for profile in profiles)) if profiles else set()
    altered = set().union(*(profile["altered_causal_indices"] for profile in profiles)) if profiles else set()
    mechanism_ids = sorted(
        {
            mechanism_id
            for profile in profiles
            for mechanism_id in profile["mechanism_ids"]
        }
    )
    causal_union = {
        position - 1
        for mechanism in world.truth.get("generative_mechanisms", [])
        for position in mechanism["causal_locus_positions"]
    }
    matched_causal_union = {
        position - 1
        for mechanism in world.truth.get("generative_mechanisms", [])
        if mechanism["mechanism_id"] in mechanism_ids
        for position in mechanism["causal_locus_positions"]
    }
    return {
        "mechanism_ids": mechanism_ids,
        "scope_indices": scope_indices,
        "covered_causal_indices": covered,
        "altered_causal_indices": altered,
        "causal_locus_coverage": len(altered) / len(causal_union) if causal_union else 0.0,
        "mechanism_overlap_fraction": len(altered)
        / len(matched_causal_union or causal_union or {0}),
        "extra_locus_count": len(scope_indices - causal_union),
        "segment_precision": len(altered) / len(scope_indices) if scope_indices else 0.0,
        "exact_representation": all(profile["exact_representation"] for profile in profiles)
        and bool(profiles),
    }


def _canonical_candidate_key(candidate_ids: Sequence[str]) -> Tuple[str, ...]:
    return tuple(sorted(candidate_ids))


def _similar_scope(left_size: int, right_size: int) -> bool:
    return abs(left_size - right_size) <= max(1, int(round(max(left_size, right_size) * 0.5)))


def _matched_null_rescue_rate(
    world: SyntheticWorld,
    candidate_ids: Sequence[str],
    candidate_map: Dict[str, Candidate],
    enumeration: EvaluatorRescueEnumeration,
) -> Optional[float]:
    selected = [candidate_map[candidate_id] for candidate_id in candidate_ids]
    target_types = tuple(sorted(candidate.candidate_type for candidate in selected))
    target_scope_size = sum(_candidate_scope_size(world.tracer, candidate) for candidate in selected)
    null_outcomes: List[bool] = []
    for key, outcome in enumeration.outcomes.items():
        if key == _canonical_candidate_key(candidate_ids):
            continue
        candidates = [candidate_map[candidate_id] for candidate_id in key]
        if tuple(sorted(candidate.candidate_type for candidate in candidates)) != target_types:
            continue
        if not _similar_scope(
            target_scope_size,
            sum(_candidate_scope_size(world.tracer, candidate) for candidate in candidates),
        ):
            continue
        profile = _combination_mechanism_profile(world, candidates)
        if profile["mechanism_ids"]:
            continue
        null_outcomes.append(bool(outcome["novelty_removed"]))
    if not null_outcomes:
        return None
    return float(sum(null_outcomes) / len(null_outcomes))


def _is_rescue_equivalent(
    world: SyntheticWorld,
    candidate_ids: Sequence[str],
    candidate_map: Dict[str, Candidate],
    enumeration: EvaluatorRescueEnumeration,
) -> bool:
    key = _canonical_candidate_key(candidate_ids)
    outcome = enumeration.outcomes.get(key)
    if outcome is None or not outcome["novelty_removed"]:
        return False
    candidates = [candidate_map[candidate_id] for candidate_id in candidate_ids]
    profile = _combination_mechanism_profile(world, candidates)
    if not profile["mechanism_ids"] or profile["mechanism_overlap_fraction"] <= 0:
        return False
    null_rate = _matched_null_rescue_rate(world, candidate_ids, candidate_map, enumeration)
    # Require a matched null class and a strict majority of non-rescuing nulls.
    return null_rate is not None and null_rate < 0.5


def _hierarchical_candidate_metrics(
    world: SyntheticWorld,
    ranked_results: Sequence[CounterfactualResult],
    truth: Dict[str, Any],
    top_k: int,
    candidate_map: Dict[str, Candidate],
    enumeration: EvaluatorRescueEnumeration,
) -> Dict[str, float]:
    """Evaluate exact, locus, mechanism, and rescue-equivalent predictions."""
    top_results = list(ranked_results[:top_k])
    top_candidates = [candidate_map[result.candidate_id] for result in top_results]
    profiles = [
        _candidate_mechanism_profile(world, candidate) for candidate in top_candidates
    ]
    causal_loci = {position - 1 for position in truth.get("causal_locus_positions", [])}
    predicted_loci = set().union(*(profile["scope_indices"] for profile in profiles)) if profiles else set()
    locus_tp = len(predicted_loci & causal_loci)
    mechanism_ids = {
        mechanism["mechanism_id"]
        for mechanism in truth.get("generative_mechanisms", [])
    }
    recovered_mechanisms = {
        mechanism_id
        for profile in profiles
        for mechanism_id in profile["mechanism_ids"]
    }
    mechanism_predictions = sum(bool(profile["mechanism_ids"]) for profile in profiles)
    rescue_equivalent_predictions = sum(
        _is_rescue_equivalent(
            world,
            [candidate.id],
            candidate_map,
            enumeration,
        )
        for candidate in top_candidates
    )
    rescue_equivalent_mechanisms = {
        mechanism_id
        for candidate in top_candidates
        if _is_rescue_equivalent(world, [candidate.id], candidate_map, enumeration)
        for mechanism_id in _candidate_mechanism_profile(world, candidate)["mechanism_ids"]
    }
    matched_profiles = [profile for profile in profiles if profile["mechanism_ids"]]
    segment_profiles = [
        profile
        for candidate, profile in zip(top_candidates, profiles)
        if candidate.candidate_type == "SEGMENT" and profile["mechanism_ids"]
    ]
    exact_ids = set(truth.get("causal_candidate_ids", []))
    exact_predictions = sum(result.candidate_id in exact_ids for result in top_results)
    return {
        "exact_candidate_precision": _safe_divide(exact_predictions, len(top_results)),
        "exact_candidate_recall": _safe_divide(exact_predictions, len(exact_ids), empty=1.0),
        "exact_interaction_recovery_rate": _safe_divide(
            len(set(result.candidate_id for result in top_results) & exact_ids),
            len(exact_ids),
            empty=1.0,
        ),
        "locus_level_precision": _safe_divide(locus_tp, len(predicted_loci)),
        "locus_level_recall": _safe_divide(locus_tp, len(causal_loci), empty=1.0),
        # Mechanism precision is candidate-level: a redundant variant and its
        # segment can both be valid mechanism matches, but each consumes one
        # prediction slot. Recall is unique-mechanism recall.
        "mechanism_level_precision": _safe_divide(mechanism_predictions, len(top_results)),
        "mechanism_level_recall": _safe_divide(
            len(recovered_mechanisms), len(mechanism_ids), empty=1.0
        ),
        "rescue_equivalence_precision": _safe_divide(
            rescue_equivalent_predictions, len(top_results)
        ),
        "rescue_equivalence_recall": _safe_divide(
            len(rescue_equivalent_mechanisms), len(mechanism_ids), empty=1.0
        ),
        "mean_causal_locus_coverage": (
            float(np.mean([profile["causal_locus_coverage"] for profile in matched_profiles]))
            if matched_profiles
            else 0.0
        ),
        "mean_mechanism_overlap_fraction": (
            float(np.mean([profile["mechanism_overlap_fraction"] for profile in matched_profiles]))
            if matched_profiles
            else 0.0
        ),
        "mean_extra_locus_count": (
            float(np.mean([profile["extra_locus_count"] for profile in matched_profiles]))
            if matched_profiles
            else 0.0
        ),
        "mean_matched_segment_precision": (
            float(np.mean([profile["segment_precision"] for profile in segment_profiles]))
            if segment_profiles
            else 0.0
        ),
        "unrelated_false_positive_count": float(
            sum(not profile["mechanism_ids"] for profile in profiles)
        ),
    }


def _candidate_redundancy_diagnostics(
    world: SyntheticWorld,
    ranked_results: Sequence[CounterfactualResult],
    candidate_map: Dict[str, Candidate],
    top_k: int,
) -> Dict[str, Any]:
    """Measure multiple candidate representations of the same mechanism."""
    groups: Dict[str, List[str]] = defaultdict(list)
    for candidate in candidate_map.values():
        profile = _candidate_mechanism_profile(world, candidate)
        for mechanism_id in profile["mechanism_ids"]:
            groups[mechanism_id].append(candidate.id)
    top_candidates = [candidate_map[result.candidate_id] for result in ranked_results[:top_k]]
    top_groups: Dict[str, List[str]] = defaultdict(list)
    for candidate in top_candidates:
        profile = _candidate_mechanism_profile(world, candidate)
        for mechanism_id in profile["mechanism_ids"]:
            top_groups[mechanism_id].append(candidate.id)
    all_redundancy = sum(max(0, len(ids) - 1) for ids in groups.values())
    top_redundancy = sum(max(0, len(ids) - 1) for ids in top_groups.values())
    return {
        "candidate_redundancy_count": float(top_redundancy),
        "candidate_redundancy_count_all_candidates": float(all_redundancy),
        "unique_mechanism_groups": float(len(top_groups)),
        "unique_mechanism_groups_all_candidates": float(len(groups)),
        "predictions_per_mechanism_group": {
            mechanism_id: len(ids) for mechanism_id, ids in sorted(top_groups.items())
        },
        "candidate_pool_mechanism_groups": {
            mechanism_id: len(ids) for mechanism_id, ids in sorted(groups.items())
        },
        "unrelated_top_k_candidate_count": float(
            sum(
                not _candidate_mechanism_profile(world, candidate)["mechanism_ids"]
                for candidate in top_candidates
            )
        ),
    }


def _provenance_contribution_diagnostics(
    world: SyntheticWorld,
    ranked_results: Sequence[CounterfactualResult],
    truth: Dict[str, Any],
    candidate_map: Dict[str, Candidate],
    top_k: int,
) -> Dict[str, Any]:
    """Compare production ordering with the benchmark-only no-provenance order."""
    no_provenance = _rank_without_provenance(ranked_results)
    full_ids = [result.candidate_id for result in ranked_results]
    no_provenance_ids = [result.candidate_id for result in no_provenance]
    full_positions = {candidate_id: index for index, candidate_id in enumerate(full_ids)}
    no_provenance_positions = {
        candidate_id: index for index, candidate_id in enumerate(no_provenance_ids)
    }
    pairwise_order_changes = 0
    for index, left_id in enumerate(full_ids):
        for right_id in full_ids[index + 1 :]:
            full_order = full_positions[left_id] < full_positions[right_id]
            no_prov_order = no_provenance_positions[left_id] < no_provenance_positions[right_id]
            pairwise_order_changes += int(full_order != no_prov_order)
    provenance_scores = [result.provenance_score for result in ranked_results]
    provenance_components = [result.score_components.get("provenance", 0.0) for result in ranked_results]
    effect_components = [result.score_components.get("normalized_effect", 0.0) for result in ranked_results]
    rounded_scores = [round(value, 12) for value in provenance_scores]
    score_counts = {score: rounded_scores.count(score) for score in set(rounded_scores)}
    modal_score_count = max(score_counts.values()) if score_counts else 0
    full_metrics = _ranking_metrics(ranked_results, truth, top_k, candidate_map)
    no_prov_metrics = _ranking_metrics(no_provenance, truth, top_k, candidate_map)
    top_k_changed = set(full_ids[:top_k]) != set(no_provenance_ids[:top_k])
    same_type_scores: Dict[str, Set[float]] = defaultdict(set)
    for result in ranked_results:
        same_type_scores[result.candidate_type].add(round(result.provenance_score, 12))
    return {
        "candidate_count": float(len(ranked_results)),
        "candidate_count_with_nonzero_provenance_component": float(
            sum(abs(value) > NOVELTY_TOLERANCE for value in provenance_components)
        ),
        "provenance_score_unique_count": float(len(set(round(value, 12) for value in provenance_scores))),
        "candidate_count_with_nonmodal_provenance_score": float(
            len(rounded_scores) - modal_score_count
        ),
        "provenance_score_range": float(max(provenance_scores) - min(provenance_scores)) if provenance_scores else 0.0,
        "provenance_component_range": float(max(provenance_components) - min(provenance_components)) if provenance_components else 0.0,
        "effect_component_range": float(max(effect_components) - min(effect_components)) if effect_components else 0.0,
        "candidate_pool_has_same_type_provenance_ambiguity": float(
            any(len(scores) > 1 for scores in same_type_scores.values())
        ),
        "provenance_order_changed": float(full_ids != no_provenance_ids),
        "provenance_pairwise_order_changes": float(pairwise_order_changes),
        "provenance_top1_changed": float(bool(full_ids) and full_ids[0] != no_provenance_ids[0]),
        "provenance_top_k_set_changed": float(top_k_changed),
        "provenance_top3_set_changed": float(top_k == 3 and top_k_changed),
        "provenance_effect_term_dominance_diagnostic": float(
            (max(effect_components) - min(effect_components))
            > (max(provenance_components) - min(provenance_components))
            if effect_components and provenance_components
            else False
        ),
        "full_minus_no_provenance_precision": full_metrics["precision"] - no_prov_metrics["precision"],
        "full_minus_no_provenance_recall": full_metrics["recall"] - no_prov_metrics["recall"],
        "full_minus_no_provenance_top1": full_metrics["top1_recovery"] - no_prov_metrics["top1_recovery"],
        "full_minus_no_provenance_top3": full_metrics["top3_recovery"] - no_prov_metrics["top3_recovery"],
        "full_minus_no_provenance_mrr": full_metrics["mean_reciprocal_rank"] - no_prov_metrics["mean_reciprocal_rank"],
    }


def _difficulty_world_diagnostics(
    world: SyntheticWorld,
    ranked_results: Sequence[CounterfactualResult],
    operator_truth: EvaluatorRescueEnumeration,
) -> Dict[str, Optional[float]]:
    """Summarize measurable difficulty dimensions for one synthetic world."""
    spec = get_difficulty_spec(world.difficulty)
    causal_ids = set(world.truth.get("causal_candidate_ids", []))
    causal_effects = [
        result.absolute_effect
        for result in ranked_results
        if result.candidate_id in causal_ids
    ]
    null_effects = [
        result.absolute_effect
        for result in ranked_results
        if result.candidate_id not in causal_ids
    ]
    candidate_count = len(ranked_results)
    null_count = len(null_effects)
    return {
        "locus_count": float(spec.locus_count),
        "candidate_pool_size": float(candidate_count),
        "interaction_candidate_count": float(
            sum(result.candidate_type == "INTERACTION" for result in ranked_results)
        ),
        "segment_candidate_count": float(
            sum(result.candidate_type == "SEGMENT" for result in ranked_results)
        ),
        "variant_candidate_count": float(
            sum(result.candidate_type == "VARIANT" for result in ranked_results)
        ),
        "causal_candidate_count": float(len(causal_ids)),
        "null_candidate_count": float(null_count),
        "causal_to_null_candidate_ratio": _safe_divide(len(causal_ids), null_count),
        "mean_causal_effect": float(np.mean(causal_effects)) if causal_effects else 0.0,
        "mean_null_effect": float(np.mean(null_effects)) if null_effects else 0.0,
        "causal_to_null_effect_ratio": _safe_divide(
            float(np.mean(causal_effects)) if causal_effects else 0.0,
            float(np.mean(null_effects)) if null_effects else 0.0,
            empty=1.0,
        ),
        "causal_interaction_count": float(len(spec.causal_pairs)),
        "distractor_interaction_count": float(len(spec.distractor_pairs)),
        "maternal_crossover_count": float(len(world.truth.get("maternal_crossovers", []))),
        "paternal_crossover_count": float(len(world.truth.get("paternal_crossovers", []))),
        "total_crossover_count": float(
            len(world.truth.get("maternal_crossovers", []))
            + len(world.truth.get("paternal_crossovers", []))
        ),
        "background_allele_probability": float(spec.background_allele_probability),
        "phenotype_noise": float(spec.phenotype_noise),
        "true_minimal_rescue_set_count": float(len(operator_truth.minimal_sets)),
        "true_minimal_rescue_cardinality": (
            float(operator_truth.minimum_cardinality)
            if operator_truth.minimum_cardinality is not None
            else None
        ),
        "operator_truth_evaluated_combination_count": float(
            operator_truth.evaluated_combination_count
        ),
    }


def _truth_minimal_rescue_sets(
    world: SyntheticWorld,
    candidate_map: Dict[str, Candidate],
    max_set_size: int,
) -> List[Tuple[str, ...]]:
    tracer = world.tracer
    if not tracer.baseline_novelty.is_transgressive:
        return []
    causal_candidates = [
        candidate_map[candidate_id]
        for candidate_id in world.truth["causal_candidate_ids"]
        if candidate_id in candidate_map
    ]
    for set_size in range(1, min(max_set_size, len(causal_candidates)) + 1):
        rescues: List[Tuple[str, ...]] = []
        for combo in combinations(causal_candidates, set_size):
            counterfactual = tracer.run_joint_counterfactual(list(combo)).total
            if not detect_novelty(
                tracer.y_A,
                tracer.y_B,
                counterfactual,
                tolerance=NOVELTY_TOLERANCE,
            ).is_transgressive:
                rescues.append(tuple(candidate.id for candidate in combo))
        if rescues:
            return rescues
    return []


def _rescue_metrics(
    world: SyntheticWorld,
    ranked_results: Sequence[CounterfactualResult],
    candidate_map: Dict[str, Candidate],
    operator_truth: EvaluatorRescueEnumeration,
) -> Tuple[Dict[str, Optional[float]], Dict[str, Any]]:
    rescue_result = search_minimal_novelty_rescue(
        world.tracer,
        ranked_results=ranked_results,
        top_k=DEFAULT_RESCUE_TOP_K,
        max_set_size=DEFAULT_RESCUE_MAX_SET_SIZE,
        max_returned_sets=DEFAULT_RESCUE_MAX_RETURNED_SETS,
        max_combination_count=DEFAULT_RESCUE_MAX_COMBINATIONS,
    )
    truth_sets = _truth_minimal_rescue_sets(
        world,
        candidate_map,
        DEFAULT_RESCUE_MAX_SET_SIZE,
    )
    predicted_sets = [
        tuple(item.candidate_ids) for item in rescue_result.minimal_rescue_sets
    ]
    applicable = float(bool(truth_sets))
    exact = float(
        any(
            set(item) == set(expected)
            for item in predicted_sets
            for expected in truth_sets
        )
    )
    cardinality = float(
        bool(
            truth_sets
            and rescue_result.minimal_cardinality == len(truth_sets[0])
        )
    )
    jaccard = 0.0
    if truth_sets and predicted_sets:
        jaccard = max(
            _safe_divide(
                len(set(predicted) & set(expected)),
                len(set(predicted) | set(expected)),
            )
            for predicted in predicted_sets
            for expected in truth_sets
        )
    operator_truth_sets = operator_truth.minimal_sets
    exact_operator = float(
        bool(operator_truth_sets)
        and any(
            set(predicted) == set(expected)
            for predicted in predicted_sets
            for expected in operator_truth_sets
        )
    )
    equivalent_operator = float(
        bool(operator_truth_sets)
        and any(
            len(predicted) == operator_truth.minimum_cardinality
            and _is_rescue_equivalent(
                world,
                predicted,
                candidate_map,
                operator_truth,
            )
            for predicted in predicted_sets
        )
    )
    planted_mechanism_sets = [
        tuple(sorted(candidate_ids))
        for candidate_ids in world.truth.get("planted_minimal_intervention_sets", [])
    ]
    planted_mechanism_exact = float(
        any(
            set(predicted) == set(expected)
            for predicted in predicted_sets
            for expected in planted_mechanism_sets
        )
    )
    rescue_sufficiency = float(any(
        bool(item.novelty_removed) for item in rescue_result.minimal_rescue_sets
    ))
    metrics = {
        "minimal_rescue_applicable": applicable,
        # A causal rescue-set recovery metric is undefined when no
        # evaluator-supported causal rescue set exists within the configured
        # bounds (for example, because a valid segment singleton rescues
        # first).  Keep that case out of the aggregate denominator rather
        # than reporting it as a failed causal recovery.
        "minimal_rescue_exact_set_recovery": exact if applicable else None,
        "minimal_rescue_cardinality_accuracy": cardinality if applicable else None,
        "minimal_rescue_max_jaccard": jaccard if applicable else None,
        "exact_minimal_rescue_recovery": exact_operator if operator_truth_sets else None,
        "equivalent_minimal_rescue_recovery": equivalent_operator if operator_truth_sets else None,
        "predicted_set_exact_match": exact_operator if operator_truth_sets else None,
        "predicted_set_equivalent_match": equivalent_operator if operator_truth_sets else None,
        "exact_planted_mechanism_rescue_set_recovery": planted_mechanism_exact,
        "rescue_sufficiency_recovery": rescue_sufficiency,
        "true_minimal_rescue_set_count": float(len(operator_truth_sets)),
        "true_minimal_rescue_cardinality": (
            float(operator_truth.minimum_cardinality)
            if operator_truth.minimum_cardinality is not None
            else None
        ),
        "minimal_rescue_baseline_not_transgressive": float(
            rescue_result.search_status == "baseline_not_transgressive"
        ),
    }
    summary = {
        "search_status": rescue_result.search_status,
        "minimal_cardinality": rescue_result.minimal_cardinality,
        "ground_truth_cardinality": len(truth_sets[0]) if truth_sets else None,
        "minimal_rescue_applicable": bool(truth_sets),
        "operator_minimal_cardinality": operator_truth.minimum_cardinality,
        "number_of_true_minimal_rescue_sets": len(operator_truth_sets),
        "predicted_set_exact_match": bool(exact_operator),
        "predicted_set_equivalent_match": bool(equivalent_operator),
        "predicted_set_rescue_sufficient": bool(rescue_sufficiency),
        "operator_truth_evaluated_combination_count": operator_truth.evaluated_combination_count,
        "operator_truth_invalid_combination_count": operator_truth.invalid_combination_count,
    }
    return metrics, summary


def _build_additive_control(seed: int, non_transgressive: bool = False) -> NoveltyTracer:
    loci = generate_loci(4)
    zero = [0, 0, 0, 0]
    if non_transgressive:
        parent_a = ParentGenome("A", [1, 1, 0, 0], zero.copy(), loci)
        observed_a = [1, 0, 0, 0]
    else:
        parent_a = ParentGenome("A", zero.copy(), zero.copy(), loci)
        observed_a = [1, 1, 0, 0]
    parent_b = ParentGenome("B", zero.copy(), zero.copy(), loci)
    gamete_a = simulate_meiosis(observed_a, observed_a, "A", crossover_positions=[])
    gamete_b = simulate_meiosis(zero, zero, "B", crossover_positions=[])
    offspring = fertilize(gamete_a, gamete_b, loci, offspring_id=f"CONTROL_{seed}")
    config = PhenotypeConfig(
        additive={"L01": 2.0, "L02": 3.0},
        epistasis=[
            EpistaticPair(
                id="MODEL_CONTROL_EDGE",
                locus_a="L01",
                locus_b="L02",
                locus_a_pos=1,
                locus_b_pos=2,
                coefficient=0.0,
            )
        ],
        mode="cis_haplotype",
    )
    return NoveltyTracer(parent_a, parent_b, offspring, PhenotypeEngine(config))


def _build_provenance_sensitive_control() -> NoveltyTracer:
    """Build two equal-effect interaction candidates with different ancestry."""
    loci = generate_loci(8)
    parent_a = ParentGenome(
        "A",
        [1, 1, 1, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 1],
        loci,
    )
    parent_b = ParentGenome("B", [0] * 8, [0] * 8, loci)
    # The second model edge is assembled across the crossover; the first is
    # already present in parental A1.  Candidate IDs intentionally sort in the
    # opposite order from provenance support so the existing score can be
    # observed without changing its weights.
    gamete_a = simulate_meiosis(
        parent_a.homolog_1,
        parent_a.homolog_2,
        "A",
        crossover_positions=[4],
        start_homolog=0,
    )
    gamete_b = simulate_meiosis(
        parent_b.homolog_1,
        parent_b.homolog_2,
        "B",
        crossover_positions=[],
        start_homolog=0,
    )
    offspring = fertilize(gamete_a, gamete_b, loci, offspring_id="PROVENANCE_CONTROL")
    config = PhenotypeConfig(
        epistasis=[
            EpistaticPair(
                id="MODEL_CONTROL_01_PARENTAL",
                locus_a="L01",
                locus_b="L02",
                locus_a_pos=1,
                locus_b_pos=2,
                coefficient=10.0,
            ),
            EpistaticPair(
                id="MODEL_CONTROL_02_RECOMBINANT",
                locus_a="L03",
                locus_b="L08",
                locus_a_pos=3,
                locus_b_pos=8,
                coefficient=10.0,
            ),
        ],
        mode="cis_haplotype",
    )
    return NoveltyTracer(parent_a, parent_b, offspring, PhenotypeEngine(config))


def _provenance_sensitive_control_result() -> Dict[str, Any]:
    tracer = _build_provenance_sensitive_control()
    ranked = tracer.rank_candidates()
    no_provenance = _rank_without_provenance(ranked)
    interaction_results = [
        result for result in ranked if result.candidate_type == "INTERACTION"
    ]
    effect_difference = (
        abs(interaction_results[0].absolute_effect - interaction_results[1].absolute_effect)
        if len(interaction_results) >= 2
        else None
    )
    return {
        "control_name": "equal_effect_provenance_competition",
        "offspring_phenotype": tracer.y_O,
        "candidate_effect_difference": effect_difference,
        "full_top_interaction": interaction_results[0].candidate_id if interaction_results else None,
        "no_provenance_top_interaction": (
            next(
                (result.candidate_id for result in no_provenance if result.candidate_type == "INTERACTION"),
                None,
            )
        ),
        "full_top_has_recombinant_provenance": bool(
            interaction_results
            and interaction_results[0].provenance
            and interaction_results[0].provenance.get("recombinant_assembly")
        ),
        "provenance_changed_top1": float(
            bool(interaction_results)
            and interaction_results[0].candidate_id
            != next(
                (result.candidate_id for result in no_provenance if result.candidate_type == "INTERACTION"),
                None,
            )
        ),
        "existing_production_score_used": True,
    }


def _negative_control_metrics(
    seed: int,
    world: SyntheticWorld,
    ranked_results: Sequence[CounterfactualResult],
    operator_truth: EvaluatorRescueEnumeration,
) -> Dict[str, Optional[float]]:
    additive_tracer = _build_additive_control(seed)
    additive_candidate = next(
        candidate
        for candidate in additive_tracer.generate_candidates()
        if candidate.candidate_type == "INTERACTION"
    )
    additive_result = additive_tracer.run_counterfactual(additive_candidate)

    non_transgressive_tracer = _build_additive_control(seed, non_transgressive=True)
    non_transgressive_ranked = non_transgressive_tracer.rank_candidates()
    non_transgressive_rescue = search_minimal_novelty_rescue(
        non_transgressive_tracer,
        ranked_results=non_transgressive_ranked,
    )

    paternal_segment_effects = [
        result.absolute_effect
        for result in ranked_results
        if result.candidate_type == "SEGMENT" and result.candidate_id.startswith("SEG_B_")
    ]
    causal_ids = set(world.truth["causal_candidate_ids"])
    null_results = [
        result for result in ranked_results if result.candidate_id not in causal_ids
    ]
    causal_effects = [
        result.absolute_effect
        for result in ranked_results
        if result.candidate_id in causal_ids
    ]
    random_null_effect: Optional[float] = None
    random_null_below_causal_mean: Optional[float] = None
    if null_results and causal_effects:
        null_rng = np.random.default_rng(seed + 300_000)
        random_null = null_results[int(null_rng.integers(0, len(null_results)))]
        random_null_effect = float(random_null.absolute_effect)
        random_null_below_causal_mean = float(
            random_null_effect < float(np.mean(causal_effects))
        )
    segment_controls = []
    causal_positions = [position - 1 for position in world.truth.get("causal_locus_positions", [])]
    for candidate in world.candidate_map.values():
        if candidate.candidate_type != "SEGMENT":
            continue
        profile = _candidate_mechanism_profile(world, candidate)
        key = (candidate.id,)
        outcome = operator_truth.outcomes.get(key)
        if outcome is None:
            continue
        segment_controls.append((candidate, profile, outcome))
    large_rescuing_segments = [
        (candidate, profile)
        for candidate, profile, outcome in segment_controls
        if outcome["novelty_removed"]
        and profile["extra_locus_count"] >= 3
    ]
    nearby_noncausal_segments = []
    for candidate, profile, outcome in segment_controls:
        if profile["mechanism_ids"] or profile["covered_causal_indices"]:
            continue
        scope = profile["scope_indices"]
        if scope and causal_positions:
            distance = min(
                min(abs(index - causal_position) for causal_position in causal_positions)
                for index in scope
            )
            if distance <= 2:
                nearby_noncausal_segments.append((candidate, outcome))
    large_segment_precision = (
        float(np.mean([profile["segment_precision"] for _, profile in large_rescuing_segments]))
        if large_rescuing_segments
        else None
    )
    return {
        "additive_abs_epistatic_excess": abs(additive_result.epistatic_excess or 0.0),
        "additive_epistatic_excess_near_zero": float(
            abs(additive_result.epistatic_excess or 0.0) <= NOVELTY_TOLERANCE
        ),
        "non_transgressive_rescue_claim_absent": float(
            non_transgressive_rescue.search_status == "baseline_not_transgressive"
        ),
        "unrelated_paternal_crossover_zero_effect": float(
            bool(paternal_segment_effects)
            and max(paternal_segment_effects) <= NOVELTY_TOLERANCE
        ),
        "random_null_candidate_abs_delta": random_null_effect,
        "random_null_candidate_below_causal_mean": random_null_below_causal_mean,
        "large_segment_rescue_sufficient": float(bool(large_rescuing_segments)),
        "large_segment_specificity_penalized": float(
            bool(large_rescuing_segments)
            and bool(large_segment_precision is not None)
            and large_segment_precision < 0.5
        ),
        "large_segment_mean_specificity": large_segment_precision,
        "nearby_noncausal_segment_not_equivalent": float(
            bool(nearby_noncausal_segments)
            and all(
                not _is_rescue_equivalent(
                    world,
                    [candidate.id],
                    world.candidate_map,
                    operator_truth,
                )
                for candidate, _ in nearby_noncausal_segments
            )
        ),
    }


def _metric_summary(
    values: Sequence[Optional[float]],
    bootstrap_seed: int,
    bootstrap_replicates: int,
) -> Dict[str, Optional[float]]:
    numeric = np.asarray([value for value in values if value is not None], dtype=float)
    if numeric.size == 0:
        return {"mean": None, "lower_ci": None, "upper_ci": None, "n": 0}
    mean = float(np.mean(numeric))
    if numeric.size == 1:
        lower = upper = mean
    else:
        rng = np.random.default_rng(bootstrap_seed)
        indices = rng.integers(0, numeric.size, size=(bootstrap_replicates, numeric.size))
        bootstrap_means = np.mean(numeric[indices], axis=1)
        lower, upper = np.percentile(
            bootstrap_means,
            [2.5, 97.5],
            method="linear",
        )
        lower = float(lower)
        upper = float(upper)
    return {
        "mean": round(mean, 4),
        "lower_ci": round(lower, 4),
        "upper_ci": round(upper, 4),
        "n": int(numeric.size),
    }


def _aggregate_metric_dicts(
    metric_dicts: Sequence[Dict[str, Optional[float]]],
    bootstrap_seed: int,
    bootstrap_replicates: int,
) -> Tuple[Dict[str, Optional[float]], Dict[str, Dict[str, Optional[float]]]]:
    keys = sorted({key for item in metric_dicts for key in item})
    aggregate: Dict[str, Optional[float]] = {}
    confidence_intervals: Dict[str, Dict[str, Optional[float]]] = {}
    for index, key in enumerate(keys):
        summary = _metric_summary(
            [item.get(key) for item in metric_dicts],
            bootstrap_seed=bootstrap_seed + index * 1009,
            bootstrap_replicates=bootstrap_replicates,
        )
        aggregate[key] = summary["mean"]
        confidence_intervals[key] = summary
    return aggregate, confidence_intervals


def _numeric_diagnostic_dict(values: Dict[str, Any]) -> Dict[str, Optional[float]]:
    """Keep scalar diagnostic values suitable for seed aggregation."""
    return {
        key: value
        for key, value in values.items()
        if value is None or isinstance(value, (int, float, np.integer, np.floating))
    }


def _aggregate_run_sections(
    runs: Sequence[Dict[str, Any]],
    section: str,
    bootstrap_seed: int,
    bootstrap_replicates: int,
) -> Tuple[Dict[str, Optional[float]], Dict[str, Dict[str, Optional[float]]]]:
    return _aggregate_metric_dicts(
        [_numeric_diagnostic_dict(run[section]) for run in runs],
        bootstrap_seed=bootstrap_seed,
        bootstrap_replicates=bootstrap_replicates,
    )


def _baseline_delta_dict(
    full_metrics: Dict[str, Optional[float]],
    baseline_metrics: Dict[str, Optional[float]],
) -> Dict[str, Optional[float]]:
    keys = (
        "precision",
        "recall",
        "top1_recovery",
        "top3_recovery",
        "mean_reciprocal_rank",
    )
    return {
        f"full_minus_{key}": (
            full_metrics.get(key) - baseline_metrics.get(key)
            if full_metrics.get(key) is not None and baseline_metrics.get(key) is not None
            else None
        )
        for key in keys
    }


def _runtime_summary(timings: Sequence[Dict[str, Optional[float]]]) -> Dict[str, Any]:
    summary: Dict[str, Any] = {}
    for key in (
        "total_ms",
        "attribution_ms",
        "minimal_rescue_ms",
        "evaluation_calibration_ms",
        "null_ms",
    ):
        values = [item[key] for item in timings if item.get(key) is not None]
        if not values:
            summary[key] = {"mean": None, "median": None, "p95": None, "n": 0}
            continue
        summary[key] = {
            "mean": round(float(np.mean(values)), 4),
            "median": round(float(median(values)), 4),
            "p95": round(float(np.percentile(values, 95)), 4),
            "n": len(values),
        }
    return summary


def _run_one_seed(
    difficulty: str,
    seed: int,
    top_k: int,
    include_null: bool,
    null_simulations: int,
) -> Dict[str, Any]:
    world_start = time.perf_counter()
    world = build_synthetic_world(difficulty, seed)

    attribution_start = time.perf_counter()
    ranked_results = run_blind_attribution(world.tracer)
    attribution_ms = (time.perf_counter() - attribution_start) * 1000.0

    candidate_map = world.candidate_map
    full_metrics = _ranking_metrics(ranked_results, world.truth, top_k, candidate_map)

    calibration_start = time.perf_counter()
    operator_truth = _enumerate_operator_rescue_truth(
        world,
        candidate_map,
        max_set_size=DEFAULT_RESCUE_MAX_SET_SIZE,
    )
    calibration_ms = (time.perf_counter() - calibration_start) * 1000.0

    rescue_start = time.perf_counter()
    rescue_metrics, rescue_summary = _rescue_metrics(
        world,
        ranked_results,
        candidate_map,
        operator_truth,
    )
    rescue_ms = (time.perf_counter() - rescue_start) * 1000.0
    full_metrics.update(rescue_metrics)
    hierarchical_metrics = _hierarchical_candidate_metrics(
        world,
        ranked_results,
        world.truth,
        top_k,
        candidate_map,
        operator_truth,
    )
    full_metrics.update(hierarchical_metrics)
    redundancy_diagnostics = _candidate_redundancy_diagnostics(
        world,
        ranked_results,
        candidate_map,
        top_k,
    )

    null_metrics: Dict[str, Optional[float]] = {}
    null_summary: Dict[str, Any] = {"enabled": include_null}
    null_ms: Optional[float] = None
    if include_null:
        null_start = time.perf_counter()
        null_result = run_meiotic_null_distribution(
            world.tracer.parent_a,
            world.tracer.parent_b,
            world.tracer.offspring,
            world.tracer.phenotype_engine,
            seed=seed + 100_000,
            simulation_count=null_simulations,
        )
        null_ms = (time.perf_counter() - null_start) * 1000.0
        directional = null_result.empirical_tail_probability is not None
        null_metrics = {
            "null_transgressive_observation": float(directional),
            "null_tail_at_0_05": float(
                directional and null_result.empirical_tail_probability <= 0.05
            ),
            "null_observed_percentile": null_result.observed_percentile,
            "null_empirical_tail_probability": (
                null_result.empirical_tail_probability if directional else None
            ),
            "null_fraction_transgressive": null_result.fraction_null_transgressive,
        }
        null_summary.update(
            {
                "transgression_direction": null_result.transgression_direction,
                "observed_percentile": null_result.observed_percentile,
                "empirical_tail_probability": null_result.empirical_tail_probability,
                "fraction_null_transgressive": null_result.fraction_null_transgressive,
            }
        )
        full_metrics.update(null_metrics)

    negative_metrics = _negative_control_metrics(
        seed,
        world,
        ranked_results,
        operator_truth,
    )
    provenance_diagnostics = _provenance_contribution_diagnostics(
        world,
        ranked_results,
        world.truth,
        candidate_map,
        top_k,
    )
    difficulty_diagnostics = _difficulty_world_diagnostics(
        world,
        ranked_results,
        operator_truth,
    )
    total_ms = (time.perf_counter() - world_start) * 1000.0

    no_provenance_metrics = _ranking_metrics(
        _rank_without_provenance(ranked_results),
        world.truth,
        top_k,
        candidate_map,
    )
    effect_only_metrics = _ranking_metrics(
        _rank_effect_only(ranked_results),
        world.truth,
        top_k,
        candidate_map,
    )
    random_metrics = _ranking_metrics(
        _rank_random(ranked_results, seed + 200_000),
        world.truth,
        top_k,
        candidate_map,
    )
    no_synergy_metrics = dict(_ranking_metrics(ranked_results, world.truth, top_k, candidate_map))
    no_minimal_metrics = dict(no_synergy_metrics)

    return {
        "seed": seed,
        "world_fingerprint": world.world_fingerprint,
        "metrics": full_metrics,
        "negative_control_metrics": negative_metrics,
        "rescue_summary": rescue_summary,
        "null_summary": null_summary,
        "baseline_metrics": {
            "random_candidate": random_metrics,
            "effect_only": effect_only_metrics,
            "no_provenance": no_provenance_metrics,
            "no_pairwise_synergy": no_synergy_metrics,
            "no_minimal_rescue_information": no_minimal_metrics,
        },
        "timings": {
            "total_ms": total_ms,
            "attribution_ms": attribution_ms,
            "minimal_rescue_ms": rescue_ms,
            "evaluation_calibration_ms": calibration_ms,
            "null_ms": null_ms,
        },
        "hierarchical_metrics": hierarchical_metrics,
        "redundancy_diagnostics": redundancy_diagnostics,
        "provenance_diagnostics": provenance_diagnostics,
        "difficulty_diagnostics": difficulty_diagnostics,
    }


def run_research_benchmark(
    difficulty: str = "easy",
    n_seeds: int = DEFAULT_N_SEEDS,
    seed_start: int = 0,
    bootstrap_seed: int = DEFAULT_BOOTSTRAP_SEED,
    bootstrap_replicates: int = DEFAULT_BOOTSTRAP_REPLICATES,
    top_k: int = DEFAULT_TOP_K,
    null_simulations: Optional[int] = DEFAULT_NULL_SIMULATIONS,
    include_per_seed: bool = False,
) -> Dict[str, Any]:
    """Run a multi-seed blind-recovery validation benchmark."""
    spec = get_difficulty_spec(difficulty)
    if n_seeds <= 0:
        raise ValueError("n_seeds must be greater than zero.")
    if seed_start < 0:
        raise ValueError("seed_start must be non-negative.")
    if bootstrap_seed < 0:
        raise ValueError("bootstrap_seed must be non-negative.")
    if bootstrap_replicates <= 0:
        raise ValueError("bootstrap_replicates must be greater than zero.")
    if top_k <= 0:
        raise ValueError("top_k must be greater than zero.")
    include_null = null_simulations is not None
    if include_null and null_simulations <= 0:
        raise ValueError("null_simulations must be greater than zero when enabled.")

    seeds = list(range(seed_start, seed_start + n_seeds))
    runs = [
        _run_one_seed(
            difficulty=spec.name,
            seed=seed,
            top_k=top_k,
            include_null=include_null,
            null_simulations=int(null_simulations or 0),
        )
        for seed in seeds
    ]
    metric_dicts = [run["metrics"] for run in runs]
    aggregate_metrics, confidence_intervals = _aggregate_metric_dicts(
        metric_dicts,
        bootstrap_seed=bootstrap_seed,
        bootstrap_replicates=bootstrap_replicates,
    )

    baseline_results: Dict[str, Any] = {}
    baseline_names = list(runs[0]["baseline_metrics"].keys()) if runs else []
    for index, baseline_name in enumerate(baseline_names):
        baseline_metric_dicts = [run["baseline_metrics"][baseline_name] for run in runs]
        baseline_aggregate, baseline_ci = _aggregate_metric_dicts(
            baseline_metric_dicts,
            bootstrap_seed=bootstrap_seed + 20_000 + index * 1000,
            bootstrap_replicates=bootstrap_replicates,
        )
        baseline_results[baseline_name] = {
            "aggregate_metrics": baseline_aggregate,
            "confidence_intervals": baseline_ci,
            "benchmark_only": True,
        }

    negative_control_dicts = [run["negative_control_metrics"] for run in runs]
    negative_aggregate, negative_ci = _aggregate_metric_dicts(
        negative_control_dicts,
        bootstrap_seed=bootstrap_seed + 40_000,
        bootstrap_replicates=bootstrap_replicates,
    )

    hierarchical_aggregate, hierarchical_ci = _aggregate_run_sections(
        runs,
        "hierarchical_metrics",
        bootstrap_seed=bootstrap_seed + 80_000,
        bootstrap_replicates=bootstrap_replicates,
    )
    redundancy_aggregate, redundancy_ci = _aggregate_run_sections(
        runs,
        "redundancy_diagnostics",
        bootstrap_seed=bootstrap_seed + 90_000,
        bootstrap_replicates=bootstrap_replicates,
    )
    provenance_aggregate, provenance_ci = _aggregate_run_sections(
        runs,
        "provenance_diagnostics",
        bootstrap_seed=bootstrap_seed + 100_000,
        bootstrap_replicates=bootstrap_replicates,
    )
    difficulty_aggregate, difficulty_ci = _aggregate_run_sections(
        runs,
        "difficulty_diagnostics",
        bootstrap_seed=bootstrap_seed + 120_000,
        bootstrap_replicates=bootstrap_replicates,
    )

    exact_metric_names = (
        "exact_candidate_precision",
        "exact_candidate_recall",
        "exact_interaction_recovery_rate",
        "breakpoint_interval_recovery_rate",
        "ancestry_provenance_recovery_rate",
    )
    functional_metric_names = (
        "rescue_sufficiency_recovery",
        "exact_minimal_rescue_recovery",
        "equivalent_minimal_rescue_recovery",
        "predicted_set_exact_match",
        "predicted_set_equivalent_match",
        "exact_planted_mechanism_rescue_set_recovery",
        "rescue_equivalence_precision",
        "rescue_equivalence_recall",
        "true_minimal_rescue_set_count",
        "true_minimal_rescue_cardinality",
        "minimal_rescue_cardinality_accuracy",
        "minimal_rescue_max_jaccard",
    )

    def section_from_metrics(names: Sequence[str], seed_offset: int) -> Dict[str, Any]:
        selected = [
            {name: run["metrics"].get(name) for name in names}
            for run in runs
        ]
        aggregate, intervals = _aggregate_metric_dicts(
            selected,
            bootstrap_seed=bootstrap_seed + seed_offset,
            bootstrap_replicates=bootstrap_replicates,
        )
        return {"aggregate_metrics": aggregate, "confidence_intervals": intervals}

    baseline_deltas: Dict[str, Any] = {}
    for index, baseline_name in enumerate(("effect_only", "no_provenance")):
        delta_runs = [
            _baseline_delta_dict(run["metrics"], run["baseline_metrics"][baseline_name])
            for run in runs
        ]
        delta_aggregate, delta_ci = _aggregate_metric_dicts(
            delta_runs,
            bootstrap_seed=bootstrap_seed + 110_000 + index * 1000,
            bootstrap_replicates=bootstrap_replicates,
        )
        baseline_deltas[baseline_name] = {
            "aggregate_metrics": delta_aggregate,
            "confidence_intervals": delta_ci,
            "benchmark_only": True,
        }

    ablation_results: Dict[str, Any] = {}
    for name in (
        "no_provenance",
        "no_pairwise_synergy",
        "no_minimal_rescue_information",
        "effect_only",
    ):
        source_name = name
        metric_dicts_for_ablation = [run["baseline_metrics"][source_name] for run in runs]
        ablation_aggregate, ablation_ci = _aggregate_metric_dicts(
            metric_dicts_for_ablation,
            bootstrap_seed=bootstrap_seed + 60_000 + len(ablation_results) * 1000,
            bootstrap_replicates=bootstrap_replicates,
        )
        ablation_results[name] = {
            "aggregate_metrics": ablation_aggregate,
            "confidence_intervals": ablation_ci,
            "benchmark_only": True,
            "participates_in_production_ranking": name
            not in {"no_pairwise_synergy", "no_minimal_rescue_information"},
        }

    control_result = _provenance_sensitive_control_result()

    per_seed_metrics = [
        {
            "seed": run["seed"],
            "world_fingerprint": run["world_fingerprint"],
            "metrics": run["metrics"],
            "rescue": run["rescue_summary"],
            "meiotic_null": run["null_summary"],
            "hierarchical": run["hierarchical_metrics"],
            "redundancy": run["redundancy_diagnostics"],
            "provenance": run["provenance_diagnostics"],
            "difficulty": run["difficulty_diagnostics"],
            "timings": run["timings"],
        }
        for run in runs
    ]
    return {
        "benchmark_name": "blind_recovery_validation",
        "difficulty": spec.name,
        "n_seeds": n_seeds,
        "aggregate_metrics": aggregate_metrics,
        "confidence_intervals": confidence_intervals,
        "confidence_interval_method": {
            "level": BOOTSTRAP_CONFIDENCE_LEVEL,
            "method": "deterministic percentile bootstrap over independent seeds",
            "bootstrap_seed": bootstrap_seed,
            "replicates": bootstrap_replicates,
        },
        "baseline_results": baseline_results,
        "ablation_results": ablation_results,
        "negative_controls": {
            "aggregate_metrics": negative_aggregate,
            "confidence_intervals": negative_ci,
        },
        "exact_generative_recovery": section_from_metrics(exact_metric_names, 130_000),
        "functional_rescue_recovery": section_from_metrics(functional_metric_names, 140_000),
        "hierarchical_metrics": {
            "aggregate_metrics": hierarchical_aggregate,
            "confidence_intervals": hierarchical_ci,
        },
        "candidate_redundancy": {
            "aggregate_metrics": redundancy_aggregate,
            "confidence_intervals": redundancy_ci,
            "representative_mechanism_group_counts": (
                runs[0]["redundancy_diagnostics"].get("predictions_per_mechanism_group", {})
                if runs
                else {}
            ),
        },
        "provenance_contribution": {
            "aggregate_metrics": provenance_aggregate,
            "confidence_intervals": provenance_ci,
            "sensitivity_control": control_result,
        },
        "baseline_deltas": baseline_deltas,
        "difficulty_diagnostics": {
            "regime_definition": spec.to_dict(),
            "aggregate_metrics": difficulty_aggregate,
            "confidence_intervals": difficulty_ci,
            "expected_dimension_order": {
                "candidate_pool_size": "nondecreasing_easy_to_hard",
                "distractor_interaction_count": "nondecreasing_easy_to_hard",
                "total_crossover_count": "nondecreasing_easy_to_hard",
                "mean_causal_effect": "nonincreasing_easy_to_hard",
            },
        },
        "runtime_summary": _runtime_summary([run["timings"] for run in runs]),
        "config": {
            "difficulty_spec": spec.to_dict(),
            "top_k": top_k,
            "null_simulations": null_simulations,
            "rescue_top_k": DEFAULT_RESCUE_TOP_K,
            "rescue_max_set_size": DEFAULT_RESCUE_MAX_SET_SIZE,
            "rescue_max_returned_sets": DEFAULT_RESCUE_MAX_RETURNED_SETS,
            "rescue_max_combination_count": DEFAULT_RESCUE_MAX_COMBINATIONS,
            "phenotype_noise_supported": False,
            "evaluator_operator_truth_max_set_size": DEFAULT_RESCUE_MAX_SET_SIZE,
            "rescue_equivalence_null_policy": "matched type/scope null rescue rate < 0.5",
        },
        "software_version": SCIENTIFIC_VALIDATION_VERSION,
        "seed_information": {
            "seed_start": seed_start,
            "seeds": seeds,
            "world_seed_strategy": "one independent NumPy Generator per seed",
            "ground_truth_used_during_inference": False,
            "ground_truth_used_after_inference_for_evaluation": True,
            "operator_truth_derived_after_inference": True,
        },
        "per_seed_metrics": per_seed_metrics if include_per_seed else None,
    }


def run_research_benchmark_suite(
    difficulties: Sequence[str] = ("easy", "medium", "hard"),
    **kwargs: Any,
) -> Dict[str, Any]:
    """Run a reproducible validation report for several difficulty levels."""
    reports = [
        run_research_benchmark(difficulty=difficulty, **kwargs)
        for difficulty in difficulties
    ]
    by_name = {report["difficulty"]: report for report in reports}

    def means(metric: str) -> List[Optional[float]]:
        return [
            by_name[difficulty]["difficulty_diagnostics"]["aggregate_metrics"].get(metric)
            for difficulty in ("easy", "medium", "hard")
            if difficulty in by_name
        ]

    def nondecreasing(values: Sequence[Optional[float]]) -> Optional[bool]:
        numeric = [value for value in values if value is not None]
        return all(left <= right for left, right in zip(numeric, numeric[1:])) if numeric else None

    def nonincreasing(values: Sequence[Optional[float]]) -> Optional[bool]:
        numeric = [value for value in values if value is not None]
        return all(left >= right for left, right in zip(numeric, numeric[1:])) if numeric else None

    return {
        "benchmark_name": "blind_recovery_validation_suite",
        "difficulties": list(difficulties),
        "reports": reports,
        "software_version": SCIENTIFIC_VALIDATION_VERSION,
        "difficulty_calibration": {
            "ordered_difficulties": [difficulty for difficulty in ("easy", "medium", "hard") if difficulty in by_name],
            "mean_dimensions": {
                "candidate_pool_size": means("candidate_pool_size"),
                "distractor_interaction_count": means("distractor_interaction_count"),
                "total_crossover_count": means("total_crossover_count"),
                "mean_causal_effect": means("mean_causal_effect"),
            },
            "ordering_checks": {
                "candidate_pool_size_nondecreasing": nondecreasing(means("candidate_pool_size")),
                "distractor_interaction_count_nondecreasing": nondecreasing(
                    means("distractor_interaction_count")
                ),
                "total_crossover_count_nondecreasing": nondecreasing(means("total_crossover_count")),
                "mean_causal_effect_nonincreasing": nonincreasing(means("mean_causal_effect")),
            },
        },
    }
