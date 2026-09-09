"""Typed benchmark services for the canonical API.

The legacy backend had a benchmark HTTP layer coupled directly to
``app.validation``.  This module is the transport-free replacement.  It
normalizes the raw synthetic evaluation payloads into the public scientific
models and keeps ground-truth-only fields out of the attribution engine.
"""

from __future__ import annotations

import hashlib
import json
from functools import lru_cache
from typing import Any

from app.infrastructure.runtime import code_revision
from app.scientific.real_data.models import (
    BaselineComparisonResult,
    BaselineMetrics,
    BenchmarkDifficultyLevel,
    BenchmarkMetrics,
    BenchmarkParams,
    BenchmarkResult,
    MultiSeedAggregateMetrics,
    MultiSeedBenchmarkResult,
)
from app.scientific.synthetic.benchmark import (
    get_difficulty_levels,
    run_ablation_study,
    run_baseline_comparison,
    run_benchmark,
    run_expanded_negative_controls,
    run_multiseed_benchmark,
    run_multiworld_benchmark,
    run_negative_control_benchmark,
    run_scalability_benchmark,
    run_variable_target_benchmark,
)


def compute_benchmark_hash(parameters: dict[str, Any], metrics: dict[str, Any]) -> str:
    """Create a stable identity for one parameter/result pair."""

    payload = json.dumps(
        {"parameters": parameters, "metrics": metrics},
        sort_keys=True,
        separators=(",", ":"),
    )
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def execute_benchmark(params: BenchmarkParams) -> BenchmarkResult:
    """Run one controlled synthetic ground-truth benchmark."""

    raw = run_benchmark(
        level=params.level,
        locus_count=params.locus_count,
        causal_interactions=params.causal_interactions,
        recombination_rate=params.recombination_rate,
        effect_size=params.effect_size,
        noise=params.noise,
        seed=params.seed,
        top_k=params.top_k,
    )
    metrics = BenchmarkMetrics.model_validate(raw["metrics"])
    parameters = BenchmarkParams.model_validate(raw["parameters"])
    reproducibility_hash = compute_benchmark_hash(parameters.model_dump(), metrics.model_dump())
    return BenchmarkResult(
        benchmark_id=f"bench:{parameters.seed}:{parameters.locus_count}:{reproducibility_hash[:12]}",
        parameters=parameters,
        metrics=metrics,
        phenotypes=raw["phenotypes"],
        performance=raw["performance"],
        ranked_top_candidates=raw["ranked_candidates"],
        reproducibility_hash=reproducibility_hash,
        search_accounting=raw.get("search_accounting", {}),
        genetic_state=raw["genetic_state"],
        screened_candidates=raw["screened_candidates"],
    )


def execute_baseline_comparison(
    locus_count: int = 50,
    causal_interactions: int = 2,
    seed: int = 42,
    top_k: int = 3,
    level: int | None = None,
) -> BaselineComparisonResult:
    """Compare Novelty Trace with the seeded heuristic baselines."""

    raw = run_baseline_comparison(
        locus_count=locus_count,
        causal_interactions=causal_interactions,
        seed=seed,
        top_k=top_k,
        level=level,
    )
    return BaselineComparisonResult(
        benchmark_id=raw["benchmark_id"],
        locus_count=raw["locus_count"],
        top_k=raw["top_k"],
        seed=raw["seed"],
        baselines=[BaselineMetrics.model_validate(item) for item in raw["baselines"]],
        attribution_advantage=raw["attribution_advantage"],
    )


def execute_multiseed_benchmark(
    seeds: list[int] | None = None,
    locus_count: int = 50,
    causal_interactions: int = 2,
    top_k: int = 3,
    level: int | None = None,
) -> MultiSeedBenchmarkResult:
    """Run the same benchmark across independent seeds."""

    raw = run_multiseed_benchmark(
        seeds=seeds,
        locus_count=locus_count,
        causal_interactions=causal_interactions,
        top_k=top_k,
        level=level,
    )
    return MultiSeedBenchmarkResult(
        seeds_evaluated=raw["seeds_evaluated"],
        locus_count=raw["locus_count"],
        total_runs=raw["total_runs"],
        aggregate_metrics=[MultiSeedAggregateMetrics.model_validate(item) for item in raw["aggregate_metrics"]],
        faithfulness_bootstrap_ci=raw["faithfulness_bootstrap_ci"],
        individual_runs=[BenchmarkMetrics.model_validate(item) for item in raw["individual_runs"]],
    )


def get_benchmark_levels() -> list[BenchmarkDifficultyLevel]:
    """Return the eight documented benchmark difficulty levels."""

    return [BenchmarkDifficultyLevel.model_validate(level) for level in get_difficulty_levels()]


def get_benchmark_summary() -> dict[str, Any]:
    """Build the bounded legacy summary from canonical benchmark functions."""

    default_params = BenchmarkParams()
    baseline_result = execute_benchmark(default_params)
    baseline_comparison = execute_baseline_comparison(
        locus_count=default_params.locus_count,
        causal_interactions=default_params.causal_interactions,
        seed=default_params.seed,
        top_k=default_params.top_k,
        level=default_params.level,
    )
    multiseed = execute_multiseed_benchmark(
        seeds=[42, 43, 100, 999, 1337],
        locus_count=default_params.locus_count,
        causal_interactions=default_params.causal_interactions,
        top_k=default_params.top_k,
        level=default_params.level,
    )
    scalability = run_scalability_benchmark()
    return {
        "benchmark_mode": "controlled_ground_truth_simulation",
        "description": (
            "Measures model-relative target recovery and counterfactual separation "
            "in controlled synthetic worlds; this is not biological validation."
        ),
        "baseline_evaluation": baseline_result.model_dump(mode="json"),
        "baseline_comparison": baseline_comparison.model_dump(mode="json"),
        "multi_seed_evaluation": multiseed.model_dump(mode="json"),
        "difficulty_levels": [level.model_dump(mode="json") for level in get_benchmark_levels()],
        "scalability_results": scalability["scalability_results"],
        "mathematical_properties": {
            "crossover_assembly": "Meiotic breakpoints join homologs of one simulated parent in cis",
            "epistasis_formulation": "P = mu + sum beta_i x_i + sum gamma_ij x_i x_j",
            "faithfulness_metric": "|Delta_causal| / (|Delta_null| + epsilon)",
            "deterministic_reproducibility": True,
        },
    }


def _without_large_world_lists(value: Any) -> Any:
    """Keep report responses useful without serializing every world/candidate."""

    if not isinstance(value, dict):
        return value
    return {key: item for key, item in value.items() if key not in {"per_world", "individual_worlds", "candidate_counts"}}


@lru_cache(maxsize=1)
def get_final_scientific_evidence() -> dict[str, Any]:
    """Generate a reproducible, bounded final evaluation report on demand.

    The report is cached per process because these are intentionally expensive
    scientific evaluations. It is still recomputable after a process restart,
    and every component carries its own seeds and hashes.
    """

    params = BenchmarkParams()
    fixed = execute_benchmark(params)
    variable = run_variable_target_benchmark(num_worlds=5, base_seed=500, top_k=params.top_k)
    ood = run_multiworld_benchmark(num_worlds=5, level=params.level, top_k=params.top_k, base_seed=700)
    baselines = execute_baseline_comparison(
        locus_count=params.locus_count,
        causal_interactions=params.causal_interactions,
        seed=params.seed,
        top_k=params.top_k,
        level=params.level,
    )
    ablations = run_ablation_study(num_worlds=5, base_seed=800, level=params.level)
    negative_controls = run_negative_control_benchmark(seed=params.seed)
    expanded_negative_controls = run_expanded_negative_controls(seed=params.seed)
    stage_a = fixed.search_accounting
    return {
        "source_revision": code_revision(),
        "fixed_target": fixed.model_dump(mode="json"),
        "variable_target": _without_large_world_lists(variable),
        "OOD": {"per_family": {"synthetic_level_4": _without_large_world_lists(ood)}},
        "baselines": baselines.model_dump(mode="json"),
        "ablations": _without_large_world_lists(ablations),
        "negative_controls": negative_controls,
        "expanded_negative_controls": expanded_negative_controls,
        "stage_a": _without_large_world_lists(stage_a),
    }


__all__ = [
    "compute_benchmark_hash",
    "execute_benchmark",
    "execute_baseline_comparison",
    "execute_multiseed_benchmark",
    "get_benchmark_levels",
    "get_benchmark_summary",
    "get_final_scientific_evidence",
]
