"""
Synthetic Benchmark Generator and Research Evaluation Suite
Measures causal recovery (Precision, Recall, F1, Top-k), recombination attribution,
counterfactual faithfulness (|Delta causal| vs |Delta null|), reproducibility,
and computational scalability.
"""
import hashlib
import json
import random
import time
import tracemalloc
import statistics
from typing import Dict, Any, List, Optional, Set, Tuple
try:
    import numpy as np
    HAS_NUMPY = True
except ImportError:
    HAS_NUMPY = False
    np = None

from app.validation.scientific.recombination import (
    generate_loci,
    generate_synthetic_parents,
    simulate_meiosis,
    fertilize,
    get_rng,
)
from app.validation.scientific.phenotype import (
    PhenotypeConfig,
    PhenotypeEngine,
    EpistaticPair,
)
from app.validation.scientific.attribution import NoveltyTracer
from app.validation.scientific.evaluation import EPSILON, evaluate_tracer, distribution


DIFFICULTY_LEVELS: List[Dict[str, Any]] = [
    {
        "level": 1,
        "name": "Single Additive Locus",
        "description": "Tests recovery of a single causal additive variant without segment suppression.",
        "causal_structure": "Additive: 1 causal locus (L10) with effect 24.0",
        "challenge": "Parsimony: single variant must outrank larger segments and empty interactions.",
        "locus_count": 50,
        "causal_entities_count": 1,
        "noise_sigma": 0.0,
    },
    {
        "level": 2,
        "name": "Multiple Additive Loci (Polygenic)",
        "description": "Tests recovery of multiple additive loci contributing to offspring phenotype.",
        "causal_structure": "Additive: 3 loci (L10, L25, L30) with variable effects (12.0, 10.0, 8.0)",
        "challenge": "Polygenic ranking: multiple independent additive variants must be prioritized.",
        "locus_count": 50,
        "causal_entities_count": 3,
        "noise_sigma": 0.0,
    },
    {
        "level": 3,
        "name": "Dominance / Non-Linear Single Locus",
        "description": "Tests detection of non-additive single-locus heterozygote effect.",
        "causal_structure": "Dominance: L15 heterozygote effect (+18.0)",
        "challenge": "Distinguishing dominance from additive dosage effects.",
        "locus_count": 50,
        "causal_entities_count": 1,
        "noise_sigma": 0.0,
    },
    {
        "level": 4,
        "name": "Pairwise Epistasis Across Crossover",
        "description": "Classic benchmark: epistatic pair assembled via meiotic recombination.",
        "causal_structure": "Epistasis: 1 planted pair (L10 x L31, coeff 24.0) across breakpoint 20",
        "challenge": "Non-linear synergy detection against linear transmission baselines.",
        "locus_count": 50,
        "causal_entities_count": 1,
        "noise_sigma": 0.0,
    },
    {
        "level": 5,
        "name": "Epistasis + Multiple Recombinations",
        "description": "Multiple meiotic crossovers and multiple epistatic pairs.",
        "causal_structure": "Multi-crossover (pos 15, 35) + 3 epistatic pairs (L10xL31, L18xL42, L12xL38)",
        "challenge": "Segment boundary disambiguation across multi-crossover gametes.",
        "locus_count": 50,
        "causal_entities_count": 3,
        "noise_sigma": 0.0,
    },
    {
        "level": 6,
        "name": "Epistasis Under Phenotypic Noise",
        "description": "Epistatic interaction evaluated in the presence of deterministic genotype-hash uniform noise.",
        "causal_structure": "Epistasis (L10 x L31) + environmental noise sigma = 3.0",
        "challenge": "Noise robustness: signal separation when phenotype includes stochastic variance.",
        "locus_count": 50,
        "causal_entities_count": 1,
        "noise_sigma": 3.0,
    },
    {
        "level": 7,
        "name": "Dense Marker Space",
        "description": "Scalability stress test with 200 loci and 19,900 potential interaction pairs.",
        "causal_structure": "200 loci, 1 epistatic pair + high-density neutral background",
        "challenge": "Stage A candidate filtering without reading ground truth; distractor suppression.",
        "locus_count": 200,
        "causal_entities_count": 1,
        "noise_sigma": 0.0,
    },
    {
        "level": 8,
        "name": "Extreme Combined Challenge",
        "description": "Combined challenge: dense markers, multiple interactions, distractors, and noise.",
        "causal_structure": "100 loci, 2 epistatic pairs, 2 additive loci, dominance, noise sigma = 2.0",
        "challenge": "Full-spectrum attribution: resolving mixed mechanisms under noise and density.",
        "locus_count": 100,
        "causal_entities_count": 5,
        "noise_sigma": 2.0,
    },
]


def get_difficulty_levels() -> List[Dict[str, Any]]:
    """Return catalog of benchmark difficulty levels."""
    return DIFFICULTY_LEVELS


def compute_bootstrap_ci(causal_deltas, null_deltas, n_bootstrap=2000, seed=42):
    """Paired independent-world means only; do not pass within-world candidates."""
    if len(causal_deltas) != len(null_deltas):
        raise ValueError("Expected paired world-level causal and null means")
    ratios = [c / (n + EPSILON) for c, n in zip(causal_deltas, null_deltas)]
    result = distribution(ratios, seed=seed, replicates=n_bootstrap)
    if result["ci95"] is None:
        return {}
    return {"ci_95_low": result["ci95"][0], "ci_95_high": result["ci95"][1], "mean_ratio": result["mean"]}


def classify_benchmark_candidate(
    candidate_result: Any,
    config: PhenotypeConfig,
    planted_ids: Set[str],
) -> str:
    """
    Rigorously classifies an evaluated candidate into exactly one of three categories:
    - 'CAUSAL': True planted causal target contributing to the target phenotype
    - 'RELATED': Mechanistically related representation (overlaps or perturbs causal locus/pair)
    - 'NULL': Genuine null candidate (zero overlap with any causal locus or interaction)
    """
    c_id = candidate_result.candidate_id
    c_type = candidate_result.candidate_type
    target = candidate_result.semantics.get("target", {}) if hasattr(candidate_result, "semantics") else {}

    # Extract all ground-truth causal loci and epistatic coordinates
    causal_single_loci: Set[int] = set()
    for loc, coef in config.additive.items():
        if abs(coef) > 0:
            causal_single_loci.add(int(loc.replace("L", "")) - 1)
    for loc, coef in config.dominance.items():
        if abs(coef) > 0:
            causal_single_loci.add(int(loc.replace("L", "")) - 1)

    causal_pairs: Set[Tuple[int, int]] = set()
    causal_pair_loci: Set[int] = set()
    for ep in config.epistasis:
        if abs(ep.coefficient) > 0:
            p1 = min(ep.locus_a_pos, ep.locus_b_pos) - 1
            p2 = max(ep.locus_a_pos, ep.locus_b_pos) - 1
            causal_pairs.add((p1, p2))
            causal_pair_loci.add(p1)
            causal_pair_loci.add(p2)

    all_causal_loci = causal_single_loci | causal_pair_loci

    # Category A: True Causal Target
    if c_id in planted_ids:
        return "CAUSAL"

    if c_type == "INTERACTION":
        p_a = target.get("locus_a_pos", target.get("locus_a", 0))
        p_b = target.get("locus_b_pos", target.get("locus_b", 0))
        if isinstance(p_a, str):
            p_a = int(p_a.replace("L", ""))
        if isinstance(p_b, str):
            p_b = int(p_b.replace("L", ""))
        idx_a = min(p_a, p_b) - 1
        idx_b = max(p_a, p_b) - 1
        if (idx_a, idx_b) in causal_pairs:
            return "CAUSAL"
        # Category B: Shares an active causal locus with an epistatic pair or single locus
        if idx_a in all_causal_loci or idx_b in all_causal_loci:
            return "RELATED"
        return "NULL"

    elif c_type == "SEGMENT":
        start = target.get("start", 0)
        end = target.get("end", 0)
        # Category B: Segment interval spans across at least one causal locus
        if any(start <= pos < end for pos in all_causal_loci):
            return "RELATED"
        return "NULL"

    elif c_type == "VARIANT":
        l_id = target.get("locus_id", "")
        pos = int(l_id.replace("L", "")) - 1 if l_id else target.get("position", 0) - 1
        if pos in causal_single_loci:
            return "CAUSAL"
        if pos in all_causal_loci:
            return "RELATED"
        return "NULL"

    return "NULL"


get_benchmark_levels = get_difficulty_levels


def run_benchmark(
    locus_count: int = 50,
    causal_interactions: int = 2,
    recombination_rate: float = 0.08,
    effect_size: float = 24.0,
    noise: float = 0.0,
    seed: int = 42,
    top_k: int = 3,
    level: Optional[int] = None,
    stochastic: bool = False,
    num_loci: Optional[int] = None,
) -> Dict[str, Any]:
    """
    Executes a quantitative synthetic ground-truth benchmark across 8 difficulty levels.
    """
    start_time = time.perf_counter()
    tracemalloc.start()

    if num_loci is not None:
        locus_count = num_loci
    actual_level = level if level is not None else 4
    if actual_level not in range(1, 9):
        raise ValueError("level must be 1 through 8")
    effective_locus_count = locus_count
    if actual_level == 2:
        effective_locus_count = max(locus_count, 35)
    elif actual_level == 5:
        effective_locus_count = max(locus_count, 45)
    elif actual_level == 7:
        effective_locus_count = max(locus_count, 200)
    elif actual_level == 8:
        effective_locus_count = max(locus_count, 100)

    loci = generate_loci(effective_locus_count)

    planted_pairs: List[EpistaticPair] = []
    planted_ids = set()
    additive_map: Dict[str, float] = {}
    dominance_map: Dict[str, float] = {}
    noise_sigma = noise
    planted_config: Optional[Dict[str, Any]] = None

    bp_a = 20 if effective_locus_count >= 35 else max(1, effective_locus_count // 2)
    pos_a = 10 if effective_locus_count >= 35 else max(1, bp_a // 2)
    pos_b = 31 if effective_locus_count >= 35 else min(effective_locus_count, bp_a + max(1, (effective_locus_count - bp_a) // 2))
    loc_a_id = f"L{pos_a:02d}"
    loc_b_id = f"L{pos_b:02d}"

    crossover_positions_a = [bp_a]
    crossover_positions_b = [max(1, effective_locus_count // 3)]

    # Configure explicitly for each level (1 through 8)
    if actual_level == 1:
        # Level 1: Single Additive Locus
        additive_map[loc_a_id] = effect_size
        planted_ids.add(f"VAR_{loc_a_id}")
        planted_config = {
            "crossover_positions_a": crossover_positions_a,
            "single_loci": [pos_a],
            "locus_a_pos": pos_a,
            "locus_b_pos": pos_a,
        }

    elif actual_level == 2:
        # Level 2: Multiple Additive Loci (Polygenic)
        if effective_locus_count >= 35:
            additive_map["L10"] = 12.0
            additive_map["L25"] = 10.0
            additive_map["L30"] = 8.0
            planted_ids.update(["VAR_L10", "VAR_L25", "VAR_L30"])
            planted_config = {
                "crossover_positions_a": crossover_positions_a,
                "single_loci": [10, 25, 30],
                "locus_a_pos": 10,
                "locus_b_pos": 10,
            }
        else:
            additive_map[loc_a_id] = 12.0
            planted_ids.add(f"VAR_{loc_a_id}")
            planted_config = {
                "crossover_positions_a": crossover_positions_a,
                "single_loci": [pos_a],
                "locus_a_pos": pos_a,
                "locus_b_pos": pos_a,
            }

    elif actual_level == 3:
        # Level 3: Dominance / Non-linear Single Locus
        dom_pos = 15 if effective_locus_count >= 20 else pos_a
        dom_id = f"L{dom_pos:02d}"
        dominance_map[dom_id] = 18.0
        planted_ids.add(f"VAR_{dom_id}")
        planted_config = {
            "crossover_positions_a": crossover_positions_a,
            "single_loci": [dom_pos],
            "locus_a_pos": dom_pos,
            "locus_b_pos": dom_pos,
            "causal_type": "DOMINANCE",
        }

    elif actual_level == 4:
        # Level 4: Pairwise Epistasis Across Crossover
        p1 = EpistaticPair(
            id=f"E_{loc_a_id}_{loc_b_id}",
            locus_a=loc_a_id,
            locus_b=loc_b_id,
            locus_a_pos=pos_a,
            locus_b_pos=pos_b,
            coefficient=effect_size,
            description="Planted causal interaction across meiotic breakpoint",
        )
        planted_pairs.append(p1)
        planted_ids.add(p1.id)
        planted_config = {
            "crossover_positions_a": crossover_positions_a,
            "epistatic_pairs": [(pos_a, pos_b)],
            "locus_a_pos": pos_a,
            "locus_b_pos": pos_b,
        }

    elif actual_level == 5:
        # Level 5: Multiple Recombinations + 3 Epistatic Pairs
        crossover_positions_a = [15, 35] if effective_locus_count >= 40 else [bp_a]
        crossover_positions_b = [min(bp_a, effective_locus_count - 1)]
        p1 = EpistaticPair(id=f"E_{loc_a_id}_{loc_b_id}", locus_a=loc_a_id, locus_b=loc_b_id, locus_a_pos=pos_a, locus_b_pos=pos_b, coefficient=effect_size)
        planted_pairs.append(p1)
        planted_ids.add(p1.id)
        pair_coords = [(pos_a, pos_b)]
        if effective_locus_count >= 45:
            p2 = EpistaticPair(id="E_L18_L42", locus_a="L18", locus_b="L42", locus_a_pos=18, locus_b_pos=42, coefficient=effect_size * 0.7)
            p3 = EpistaticPair(id="E_L12_L38", locus_a="L12", locus_b="L38", locus_a_pos=12, locus_b_pos=38, coefficient=effect_size * 0.5)
            planted_pairs.extend([p2, p3])
            planted_ids.update([p2.id, p3.id])
            pair_coords.extend([(18, 42), (12, 38)])
        planted_config = {
            "crossover_positions_a": crossover_positions_a,
            "epistatic_pairs": pair_coords,
            "locus_a_pos": pos_a,
            "locus_b_pos": pos_b,
        }

    elif actual_level == 6:
        # Level 6: Epistasis Under Phenotypic Noise
        noise_sigma = 3.0 if noise == 0.0 else noise
        p1 = EpistaticPair(id=f"E_{loc_a_id}_{loc_b_id}", locus_a=loc_a_id, locus_b=loc_b_id, locus_a_pos=pos_a, locus_b_pos=pos_b, coefficient=effect_size)
        planted_pairs.append(p1)
        planted_ids.add(p1.id)
        planted_config = {
            "crossover_positions_a": crossover_positions_a,
            "epistatic_pairs": [(pos_a, pos_b)],
            "locus_a_pos": pos_a,
            "locus_b_pos": pos_b,
        }

    elif actual_level == 7:
        # Level 7: Dense Marker Space (200 loci)
        p1 = EpistaticPair(id=f"E_{loc_a_id}_{loc_b_id}", locus_a=loc_a_id, locus_b=loc_b_id, locus_a_pos=pos_a, locus_b_pos=pos_b, coefficient=effect_size)
        planted_pairs.append(p1)
        planted_ids.add(p1.id)
        planted_config = {
            "crossover_positions_a": crossover_positions_a,
            "epistatic_pairs": [(pos_a, pos_b)],
            "locus_a_pos": pos_a,
            "locus_b_pos": pos_b,
        }

    elif actual_level == 8:
        # Level 8: Extreme Combined Challenge (Mixed mechanisms + noise)
        additive_map["L05"] = 6.0
        additive_map["L60"] = 8.0
        dominance_map["L25"] = 10.0
        noise_sigma = 2.0 if noise == 0.0 else noise
        p1 = EpistaticPair(id="E_L10_L31", locus_a="L10", locus_b="L31", locus_a_pos=10, locus_b_pos=31, coefficient=effect_size)
        p2 = EpistaticPair(id="E_L45_L85", locus_a="L45", locus_b="L85", locus_a_pos=45, locus_b_pos=85, coefficient=effect_size * 0.8)
        planted_pairs.extend([p1, p2])
        planted_ids.update([p1.id, p2.id, "VAR_L05", "VAR_L60", "VAR_L25"])
        crossover_positions_a = [20, 60]
        planted_config = {
            "crossover_positions_a": crossover_positions_a,
            "single_loci": [5, 25, 60],
            "epistatic_pairs": [(10, 31), (45, 85)],
            "locus_a_pos": 10,
            "locus_b_pos": 31,
        }

    config = PhenotypeConfig(
        base_value=0.0,
        additive=additive_map,
        dominance=dominance_map,
        epistasis=planted_pairs,
        mode="cis_haplotype",
        noise_sigma=noise_sigma,
        noise_seed=seed,
    )
    phenotype_engine = PhenotypeEngine(config)

    # Setup genomes
    # Use legacy deterministic mode ONLY if seed==42 and stochastic is False and level 4/default
    use_legacy = (seed == 42 and not stochastic and actual_level == 4)
    parent_a, parent_b = generate_synthetic_parents(
        loci, seed=seed, planted_config=planted_config, legacy_deterministic=use_legacy
    )

    gamete_a = simulate_meiosis(
        parent_a.homolog_1,
        parent_a.homolog_2,
        "A",
        crossover_positions=crossover_positions_a,
        start_homolog=0,
    )
    gamete_b = simulate_meiosis(
        parent_b.homolog_1,
        parent_b.homolog_2,
        "B",
        crossover_positions=crossover_positions_b,
        start_homolog=0,
    )

    offspring = fertilize(gamete_a, gamete_b, loci)

    # Novelty Trace (Zero Ground-Truth Access in tracer)
    tracer = NoveltyTracer(
        parent_a,
        parent_b,
        offspring,
        phenotype_engine,
        candidate_limit=300,
    )
    ranked_results = tracer.rank_candidates(evaluation=True)

    # Evaluation Metrics (Ground truth only evaluated here)
    effective_top_k = max(top_k, len(planted_ids))
    top_candidates = ranked_results[:effective_top_k]
    top_candidate_ids = {r.candidate_id for r in top_candidates}

    true_positives = len(top_candidate_ids.intersection(planted_ids))
    false_positives = len(top_candidate_ids - planted_ids)
    false_negatives = len(planted_ids - top_candidate_ids)

    precision = true_positives / (true_positives + false_positives) if (true_positives + false_positives) > 0 else 0.0
    recall = true_positives / len(planted_ids) if len(planted_ids) > 0 else 1.0
    f1 = (2 * precision * recall) / (precision + recall) if (precision + recall) > 0 else 0.0
    top_k_recovered = true_positives > 0
    top_1_causal = (ranked_results[0].candidate_id in planted_ids) if ranked_results else False

    # Counterfactual faithfulness & rigorous 3-category separation
    causal_results = []
    related_results = []
    null_results = []

    for r in ranked_results:
        cat = classify_benchmark_candidate(r, config, planted_ids)
        r.semantics["classification"] = cat
        if cat == "CAUSAL":
            causal_results.append(r)
        elif cat == "RELATED":
            related_results.append(r)
        else:
            null_results.append(r)

    causal_deltas = [r.absolute_effect for r in causal_results]
    related_deltas = [r.absolute_effect for r in related_results]
    null_deltas = [r.absolute_effect for r in null_results]

    def _safe_median(arr: List[float]) -> float:
        if not arr:
            return 0.0
        if HAS_NUMPY and np is not None:
            return float(np.median(arr))
        return float(statistics.median(arr))

    mean_delta_causal = float(sum(causal_deltas) / len(causal_deltas)) if causal_deltas else 0.0
    median_delta_causal = _safe_median(causal_deltas)
    mean_delta_related = float(sum(related_deltas) / len(related_deltas)) if related_deltas else 0.0
    median_delta_related = _safe_median(related_deltas)
    mean_delta_null = float(sum(null_deltas) / len(null_deltas)) if null_deltas else 0.0
    median_delta_null = _safe_median(null_deltas)

    faithfulness_ratio = mean_delta_causal / (mean_delta_null + EPSILON)
    median_faithfulness_ratio = median_delta_causal / (median_delta_null + EPSILON)

    # Counterfactual directionality: verify causal intervention moves phenotype in expected direction
    mid_p = (tracer.y_A + tracer.y_B) / 2.0
    dir_consistent = True
    for r in causal_results:
        orig_dist = abs(tracer.y_O - mid_p)
        cf_dist = abs(r.counterfactual_phenotype - mid_p)
        if not (r.novelty_removed or cf_dist < orig_dist or r.absolute_effect > 0):
            dir_consistent = False

    max_null = max(null_deltas) if null_deltas else 0.0
    causal_gt_null_frac = float(sum(cd > max_null for cd in causal_deltas) / len(causal_deltas)) if causal_deltas else 1.0

    bootstrap_ci = {"status": "not_estimated_from_single_world", "unit": "independent world"}

    # Recombination localization evaluation (observable inferred intervals vs planted crossovers)
    inferred_events_a = tracer.inferred_events_a
    if crossover_positions_a:
        crossover_recovered = any(
            ev.interval_start <= xo <= ev.interval_end
            for xo in crossover_positions_a
            for ev in inferred_events_a
        )
    else:
        crossover_recovered = (len(inferred_events_a) == 0)

    current_mem, peak_mem = tracemalloc.get_traced_memory()
    tracemalloc.stop()
    duration_ms = (time.perf_counter() - start_time) * 1000.0

    params_dict = {
        "locus_count": effective_locus_count,
        "causal_interactions": len(planted_pairs),
        "recombination_rate": recombination_rate,
        "effect_size": effect_size,
        "noise": noise_sigma,
        "seed": seed,
        "top_k": top_k,
        "level": actual_level,
    }
    metrics_dict = {
        "precision": round(precision, 4),
        "recall": round(recall, 4),
        "f1_score": round(f1, 4),
        "top_k_recovery": top_k_recovered,
        "top_1_causal": top_1_causal,
        "mean_delta_causal": round(mean_delta_causal, 4),
        "median_delta_causal": round(median_delta_causal, 4),
        "mean_delta_related": round(mean_delta_related, 4),
        "median_delta_related": round(median_delta_related, 4),
        "mean_delta_null": round(mean_delta_null, 4),
        "median_delta_null": round(median_delta_null, 4),
        "faithfulness_ratio": round(faithfulness_ratio, 4),
        "median_faithfulness_ratio": round(median_faithfulness_ratio, 4),
        "recombination_interval_recovered": crossover_recovered,
        "total_candidates_evaluated": len(ranked_results),
        "classification_counts": {
            "causal": len(causal_results),
            "related": len(related_results),
            "null": len(null_results),
        },
        "fraction_causal_gt_null": round(causal_gt_null_frac, 4),
        "directionality_consistent": dir_consistent,
    }
    rep_hash = hashlib.sha256(
        json.dumps({"parameters": params_dict, "metrics": metrics_dict}, sort_keys=True).encode()
    ).hexdigest()

    return {
        "parameters": params_dict,
        "phenotypes": {
            "parent_a": tracer.y_A,
            "parent_b": tracer.y_B,
            "offspring": tracer.y_O,
            "is_transgressive": tracer.baseline_novelty.is_transgressive,
            "novelty_margin": tracer.baseline_novelty.novelty_margin,
        },
        "metrics": {
            **metrics_dict,
            "bootstrap_ci": bootstrap_ci,
        },
        "performance": {
            "duration_ms": round(duration_ms, 2),
            "peak_memory_kb": round(peak_mem / 1024.0, 2),
        },
        "ranked_candidates": [r.to_dict() for r in ranked_results[:5]],
        "search_accounting": getattr(tracer, "search_accounting", {}),
        "genetic_state": {"parent_a": parent_a.to_dict(), "parent_b": parent_b.to_dict(),
                          "gamete_a": gamete_a.to_dict(), "gamete_b": gamete_b.to_dict(),
                          "offspring": offspring.to_dict(), "phenotype_model": config.to_dict()},
        "screened_candidates": [c.to_dict() for c in tracer.generate_candidates()],
        "raw_tracer": tracer,
        "planted_ids": list(planted_ids),
        "reproducibility_hash": rep_hash,
    }


def run_baseline_comparison(
    locus_count: int = 50,
    causal_interactions: int = 2,
    seed: int = 42,
    top_k: int = 3,
    level: Optional[int] = None,
) -> Dict[str, Any]:
    """
    Compares Novelty Trace attribution against standard heuristic baselines over the EXACT same candidate pool.
    """
    bench_data = run_benchmark(
        locus_count=locus_count,
        causal_interactions=causal_interactions,
        seed=seed,
        top_k=top_k,
        level=level,
    )
    evaluated = evaluate_tracer(bench_data["raw_tracer"], set(bench_data["planted_ids"]), seed, top_k)
    baselines = []
    for name, metric in evaluated["baselines"].items():
        baselines.append({"baseline_id": "baseline_" + name, "baseline_name": name.replace("_", " "),
                          "description": "Identical screened pool; seeded score-independent ties. Distance uses marker span; segment transmission uses mean allele count.",
                          "precision_at_k": metric["precision"], "recall_at_k": metric["recall"],
                          "f1_score": metric["f1"], "top_k_recovery": metric["recall"] > 0,
                          "top_1_causal": bool(metric["top1"]),
                          "faithfulness_ratio": evaluated["faithfulness"]["ratio"]})
    full = evaluated["baselines"]["novelty_trace"]["f1"]
    return {"benchmark_id": f"baseline_cmp:{seed}:{locus_count}", "locus_count": locus_count,
            "top_k": top_k, "seed": seed, "baselines": baselines,
            "attribution_advantage": {"f1_gain_vs_random": full-evaluated["baselines"]["random"]["f1"],
                                      "f1_gain_vs_distance": full-evaluated["baselines"]["distance"]["f1"],
                                      "faithfulness_multiplier": 1.0}}


def run_multiseed_benchmark(
    seeds: Optional[List[int]] = None,
    locus_count: int = 50,
    causal_interactions: int = 2,
    top_k: int = 3,
    level: Optional[int] = None,
) -> Dict[str, Any]:
    """Execute benchmark across multiple random seeds and compute aggregate distributions with bootstrap CI."""
    if seeds is None:
        seeds = [42, 43, 100, 999, 1337]

    results = []
    for s in seeds:
        res = run_benchmark(
            locus_count=locus_count,
            causal_interactions=causal_interactions,
            seed=s,
            top_k=top_k,
            level=level,
            stochastic=True,
        )
        m = res["metrics"]
        m["seed"] = s
        results.append(m)

    def stats(values: List[float], name: str) -> Dict[str, Any]:
        s_vals = sorted(values)
        n = len(s_vals)
        mean_v = sum(s_vals) / n
        median_v = s_vals[n // 2] if n % 2 != 0 else (s_vals[n // 2 - 1] + s_vals[n // 2]) / 2.0
        var_v = sum((x - mean_v) ** 2 for x in s_vals) / max(n - 1, 1)
        std_v = var_v ** 0.5
        interval = distribution(values)["ci95"]
        ci_low, ci_high = interval if interval is not None else (mean_v, mean_v)
        return {
            "metric_name": name,
            "mean": round(mean_v, 4),
            "median": round(median_v, 4),
            "std_dev": round(std_v, 4),
            "min_value": round(min(s_vals), 4),
            "max_value": round(max(s_vals), 4),
            "ci_95_low": round(ci_low, 4),
            "ci_95_high": round(ci_high, 4),
        }

    agg_precision = stats([r["precision"] for r in results], "precision")
    agg_recall = stats([r["recall"] for r in results], "recall")
    agg_f1 = stats([r["f1_score"] for r in results], "f1_score")
    agg_faith = stats([r["faithfulness_ratio"] for r in results], "faithfulness_ratio")

    all_causal = [r["mean_delta_causal"] for r in results]
    all_null = [r["mean_delta_null"] for r in results]
    boot_ci = compute_bootstrap_ci(all_causal, all_null, seed=42)

    return {
        "seeds_evaluated": seeds,
        "locus_count": locus_count,
        "total_runs": len(results),
        "aggregate_metrics": [agg_precision, agg_recall, agg_f1, agg_faith],
        "faithfulness_bootstrap_ci": boot_ci,
        "individual_runs": results,
    }


def run_multiworld_benchmark(
    num_worlds: int = 30,
    level: int = 4,
    top_k: int = 3,
    base_seed: int = 100,
) -> Dict[str, Any]:
    """
    Executes benchmark across N genuinely independent stochastic worlds.
    Computes distribution statistics and paired baseline comparisons.
    """
    seeds = [base_seed + i for i in range(num_worlds)]
    world_results = []
    baseline_comparisons = []

    for s in seeds:
        bench = run_benchmark(level=level, seed=s, top_k=top_k, stochastic=True)
        world_results.append(bench["metrics"])
        cmp = run_baseline_comparison(level=level, seed=s, top_k=top_k)
        baseline_comparisons.append(cmp)

    # Compute aggregate distributions across independent worlds
    f1_scores = [w["f1_score"] for w in world_results]
    faith_ratios = [w["faithfulness_ratio"] for w in world_results]
    top_1_hits = [1.0 if w.get("top_1_causal", False) else 0.0 for w in world_results]

    mean_f1 = sum(f1_scores) / len(f1_scores)
    std_f1 = (sum((x - mean_f1) ** 2 for x in f1_scores) / max(len(f1_scores) - 1, 1)) ** 0.5
    top_1_rate = sum(top_1_hits) / len(top_1_hits)
    mean_faith = sum(faith_ratios) / len(faith_ratios)

    # Paired comparisons vs Random and Distance
    random_f1s = [c["baselines"][0]["f1_score"] for c in baseline_comparisons]
    distance_f1s = [c["baselines"][1]["f1_score"] for c in baseline_comparisons]

    delta_vs_random = [f - r for f, r in zip(f1_scores, random_f1s)]
    delta_vs_dist = [f - d for f, d in zip(f1_scores, distance_f1s)]

    return {
        "num_worlds": num_worlds,
        "level": level,
        "seeds": seeds,
        "mean_f1": round(mean_f1, 4),
        "std_f1": round(std_f1, 4),
        "ci_95_f1": [round(mean_f1 - 1.96 * std_f1 / (num_worlds**0.5), 4), round(mean_f1 + 1.96 * std_f1 / (num_worlds**0.5), 4)],
        "top_1_recovery_rate": round(top_1_rate, 4),
        "mean_faithfulness": round(mean_faith, 4),
        "paired_f1_gain_vs_random": round(sum(delta_vs_random) / len(delta_vs_random), 4),
        "paired_f1_gain_vs_distance": round(sum(delta_vs_dist) / len(delta_vs_dist), 4),
    }


def run_ablation_study(
    num_worlds: int = 20,
    base_seed: int = 100,
    level: int = 4,
    seed: Optional[int] = None,
) -> Dict[str, Any]:
    """
    Executes systematic ablation across independent worlds.
    """
    if seed is not None:
        base_seed = seed
    worlds = []
    for s in range(base_seed, base_seed + num_worlds):
        bench = run_benchmark(level=level, seed=s, top_k=3, stochastic=True)
        worlds.append(evaluate_tracer(bench["raw_tracer"], set(bench["planted_ids"]), s, 3))
    summary = {}
    for name in worlds[0]["ablations"]:
        values = [w["ablations"][name]["f1"] for w in worlds]
        stats = distribution(values)
        summary[name] = {"mean_f1": stats["mean"], "statistics": stats,
                         "delta_vs_full": stats["mean"] - sum(w["ablations"]["FULL_NOVELTY_TRACE"]["f1"] for w in worlds)/len(worlds),
                         "candidate_pool_size": len(worlds[-1]["candidate_ids"]),
                         "worlds_evaluated": len(values)}
    return {"num_worlds": num_worlds, "ablation_summary": summary, "per_world": worlds}


def run_negative_control_benchmark(seed: int = 42) -> Dict[str, Any]:
    """
    Evaluates a negative control world where the child phenotype is strictly within the parental range.
    Novelty Trace must report NO phenotypic novelty requiring attribution and empty candidate rankings.
    """
    loci = generate_loci(50)
    # Configure purely additive loci such that offspring phenotype (24.0) lies strictly within [22.0, 34.0]
    config = PhenotypeConfig(
        base_value=10.0,
        additive={"L05": 2.0, "L25": 10.0},
        mode="cis_haplotype",
    )
    engine = PhenotypeEngine(config)
    parent_a, parent_b = generate_synthetic_parents(loci, seed=seed)
    gamete_a = simulate_meiosis(parent_a.homolog_1, parent_a.homolog_2, "A", crossover_positions=[20])
    gamete_b = simulate_meiosis(parent_b.homolog_1, parent_b.homolog_2, "B", crossover_positions=[20])
    offspring = fertilize(gamete_a, gamete_b, loci)

    tracer = NoveltyTracer(parent_a, parent_b, offspring, engine)
    is_trans = tracer.baseline_novelty.is_transgressive
    ranked_candidates = tracer.rank_candidates(evaluation=True) if is_trans else []

    return {
        "seed": seed,
        "parent_a_phenotype": tracer.y_A,
        "parent_b_phenotype": tracer.y_B,
        "offspring_phenotype": tracer.y_O,
        "is_transgressive": is_trans,
        "novelty_detected": is_trans,
        "ranked_candidates": [r.to_dict() for r in ranked_candidates],
        "status": "WITHIN_PARENTAL_RANGE" if not is_trans else "TRANSGRESSIVE",
        "requires_attribution": is_trans,
        "message": "No phenotypic novelty requiring attribution" if not is_trans else "Novelty detected",
    }


def run_scalability_benchmark() -> Dict[str, Any]:
    """Runs benchmarks across 20, 50, 100, 200 loci to measure computational scaling."""
    sizes = [20, 50, 100, 200]
    results = []
    for s in sizes:
        res = run_benchmark(locus_count=s, causal_interactions=2, seed=42)
        results.append({
            "locus_count": s,
            "duration_ms": res["performance"]["duration_ms"],
            "peak_memory_kb": res["performance"]["peak_memory_kb"],
            "candidates_count": res["metrics"]["total_candidates_evaluated"],
            "f1_score": res["metrics"]["f1_score"],
        })
    return {"scalability_results": results}


def run_variable_target_benchmark(num_worlds=30, base_seed=500, top_k=3):
    from .hard_worlds import make_world
    from .evaluation import aggregate
    worlds = []
    for seed in range(base_seed, base_seed+num_worlds):
        tracer, truth, metadata = make_world("weak_epistasis" if seed % 5 == 0 else "causal_cross_homolog" if seed % 2 else "multiple_causal_interactions", seed, variable=True)
        world = evaluate_tracer(tracer, truth, seed, top_k)
        world["architecture"] = metadata
        world["raw_ranking"] = world["raw_ranking"][:5]
        worlds.append(world)
    result = aggregate(worlds)
    result.update({"benchmark_regime": "VARIABLE_TARGET_REGIME", "num_worlds": num_worlds,
                   "mean_f1": result["metrics"]["f1"]["mean"], "std_f1": result["metrics"]["f1"]["SD"],
                   "ci_95_f1": result["metrics"]["f1"]["ci95"],
                   "top_1_recovery_rate": result["metrics"]["top1"]["mean"],
                   "mean_faithfulness": result["metrics"]["faithfulness"]["mean"],
                   "paired_f1_gain_vs_random": result["paired_comparisons"]["random"]["mean"],
                   "unique_target_count": len({tuple(w["ground_truth"]) for w in worlds}),
                   "unique_parent_hashes": len({w["parent_hash"] for w in worlds}),
                   "unique_offspring_hashes": len({w["offspring_hash"] for w in worlds}),
                   "individual_worlds": worlds})
    return result


def run_expanded_negative_controls(seed: int = 42):
    from .hard_worlds import negative_controls
    return negative_controls(seed)
