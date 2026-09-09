"""Benchmark & Algorithmic Validation Suite for Trio Meiotic & Epistasis Pipelines.

Executes quantitative synthetic ground-truth evaluations to mathematically validate:
1. Causal epistatic interaction recovery (Precision, Recall, F1, Top-k)
2. Meiotic crossover interval localization across simulated recombination breakpoints
3. Counterfactual faithfulness: ratio of causal ablation effect size to null background perturbation
4. Comparative performance against 3 standard heuristic baselines
5. Multi-seed stability distributions and bootstrap confidence intervals
6. Computational scalability across increasing locus densities
"""
import hashlib
import json
import time

from app.validation.scientific.benchmark import (
    run_benchmark,
    run_scalability_benchmark,
    run_baseline_comparison,
    run_multiseed_benchmark,
    get_difficulty_levels as get_levels_raw,
)
from .models import (
    BenchmarkMetrics,
    BenchmarkParams,
    BenchmarkResult,
    ScalabilityPoint,
    BaselineMetrics,
    BaselineComparisonResult,
    BenchmarkDifficultyLevel,
    MultiSeedAggregateMetrics,
    MultiSeedBenchmarkResult,
)


def compute_benchmark_hash(params: dict, metrics: dict) -> str:
    payload = json.dumps({"parameters": params, "metrics": metrics}, sort_keys=True)
    return hashlib.sha256(payload.encode()).hexdigest()


def execute_benchmark(params: BenchmarkParams) -> BenchmarkResult:
    """Run a controlled synthetic ground-truth benchmark with the given parameters."""
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

    metrics = BenchmarkMetrics(
        precision=raw["metrics"]["precision"],
        recall=raw["metrics"]["recall"],
        top_1_causal=raw["metrics"]["top_1_causal"],
        f1_score=raw["metrics"]["f1_score"],
        top_k_recovery=raw["metrics"]["top_k_recovery"],
        mean_delta_causal=raw["metrics"]["mean_delta_causal"],
        mean_delta_null=raw["metrics"]["mean_delta_null"],
        faithfulness_ratio=raw["metrics"]["faithfulness_ratio"],
        recombination_interval_recovered=raw["metrics"]["recombination_interval_recovered"],
        total_candidates_evaluated=raw["metrics"]["total_candidates_evaluated"],
    )

    rep_hash = compute_benchmark_hash(raw["parameters"], raw["metrics"])
    benchmark_id = f"bench:{params.seed}:{params.locus_count}:{rep_hash[:12]}"

    return BenchmarkResult(
        benchmark_id=benchmark_id,
        parameters=params,
        metrics=metrics,
        phenotypes=raw["phenotypes"],
        performance=raw["performance"],
        ranked_top_candidates=raw["ranked_candidates"],
        reproducibility_hash=rep_hash,
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
    """Execute evaluation comparing Novelty Trace against Random, Distance, and Transmission baselines."""
    raw = run_baseline_comparison(
        locus_count=locus_count,
        causal_interactions=causal_interactions,
        seed=seed,
        top_k=top_k,
        level=level,
    )
    baselines = [BaselineMetrics(**b) for b in raw["baselines"]]
    return BaselineComparisonResult(
        benchmark_id=raw["benchmark_id"],
        locus_count=raw["locus_count"],
        top_k=raw["top_k"],
        seed=raw["seed"],
        baselines=baselines,
        attribution_advantage=raw["attribution_advantage"],
    )


def execute_multiseed_benchmark(
    seeds: list[int] | None = None,
    locus_count: int = 50,
    causal_interactions: int = 2,
    top_k: int = 3,
    level: int | None = None,
) -> MultiSeedBenchmarkResult:
    """Execute benchmark across multiple random seeds and return aggregate distributions."""
    raw = run_multiseed_benchmark(
        seeds=seeds,
        locus_count=locus_count,
        causal_interactions=causal_interactions,
        top_k=top_k,
        level=level,
    )
    aggregates = [MultiSeedAggregateMetrics(**a) for a in raw["aggregate_metrics"]]
    runs = [BenchmarkMetrics(**r) for r in raw["individual_runs"]]
    return MultiSeedBenchmarkResult(
        seeds_evaluated=raw["seeds_evaluated"],
        locus_count=raw["locus_count"],
        total_runs=raw["total_runs"],
        aggregate_metrics=aggregates,
        faithfulness_bootstrap_ci=raw["faithfulness_bootstrap_ci"],
        individual_runs=runs,
    )


def get_benchmark_levels() -> list[BenchmarkDifficultyLevel]:
    """Return the catalog of 8 benchmark challenge levels."""
    return [BenchmarkDifficultyLevel(**lvl) for lvl in get_levels_raw()]


def get_benchmark_summary() -> dict:
    """Return precomputed baseline benchmark summary, baselines comparison, and scalability metrics."""
    default_params = BenchmarkParams(
        locus_count=50,
        causal_interactions=2,
        recombination_rate=0.08,
        effect_size=24.0,
        noise=0.0,
        seed=42,
        top_k=3,
    )
    baseline_result = execute_benchmark(default_params)
    scalability_raw = run_scalability_benchmark()
    baseline_comparison = execute_baseline_comparison(locus_count=50, seed=42, top_k=3)
    multiseed = execute_multiseed_benchmark(seeds=[42, 43, 100, 999, 1337], locus_count=50)

    return {
        "benchmark_mode": "controlled_ground_truth_simulation",
        "description": (
            "Measures model-relative target recovery and counterfactual "
            "separation in controlled synthetic worlds; this is not biological validation."
        ),
        "baseline_evaluation": baseline_result.model_dump(),
        "baseline_comparison": baseline_comparison.model_dump(),
        "multi_seed_evaluation": multiseed.model_dump(),
        "difficulty_levels": [lvl.model_dump() for lvl in get_benchmark_levels()],
        "scalability_results": scalability_raw["scalability_results"],
        "mathematical_properties": {
            "crossover_assembly": "Meiotic breakpoint at position 20 joins the two homologs of one simulated parent in cis",
            "epistasis_formulation": "P = mu + sum beta_i x_i + sum gamma_ij x_i x_j",
            "faithfulness_metric": "|Delta_causal| / (|Delta_null| + epsilon)",
            "deterministic_reproducibility": True,
        },
    }
