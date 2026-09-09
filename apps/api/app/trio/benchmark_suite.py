"""Compatibility re-exports for callers of the extracted trio package.

Benchmark execution now lives under ``app.scientific.evaluation``.  Keeping
these names importable avoids breaking notebooks and tests that imported the
old package while ensuring the old validation benchmark is no longer on the
production execution path.
"""

from app.scientific.evaluation.benchmark_suite import (
    compute_benchmark_hash,
    execute_baseline_comparison,
    execute_benchmark,
    execute_multiseed_benchmark,
    get_benchmark_levels,
    get_benchmark_summary,
    get_final_scientific_evidence,
)
from app.scientific.evaluation.benchmarks import (
    classify_benchmark_candidate,
    compute_bootstrap_ci,
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
from app.scientific.real_data.models import (
    BaselineComparisonResult,
    BaselineMetrics,
    BenchmarkDifficultyLevel,
    BenchmarkMetrics,
    BenchmarkParams,
    BenchmarkResult,
    MultiSeedAggregateMetrics,
    MultiSeedBenchmarkResult,
    ScalabilityPoint,
)
from app.scientific.synthetic.benchmark import get_difficulty_levels as get_levels_raw

__all__ = [
    "compute_benchmark_hash",
    "compute_bootstrap_ci",
    "classify_benchmark_candidate",
    "execute_baseline_comparison",
    "execute_benchmark",
    "execute_multiseed_benchmark",
    "get_benchmark_levels",
    "get_benchmark_summary",
    "get_final_scientific_evidence",
    "get_levels_raw",
    "run_ablation_study",
    "run_baseline_comparison",
    "run_benchmark",
    "run_expanded_negative_controls",
    "run_multiseed_benchmark",
    "run_multiworld_benchmark",
    "run_negative_control_benchmark",
    "run_scalability_benchmark",
    "run_variable_target_benchmark",
    "BaselineComparisonResult",
    "BaselineMetrics",
    "BenchmarkDifficultyLevel",
    "BenchmarkMetrics",
    "BenchmarkParams",
    "BenchmarkResult",
    "MultiSeedAggregateMetrics",
    "MultiSeedBenchmarkResult",
    "ScalabilityPoint",
]
