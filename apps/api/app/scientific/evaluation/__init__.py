"""Benchmark and planted-ground-truth interfaces."""

from .benchmark_suite import (
    execute_baseline_comparison,
    execute_benchmark,
    execute_multiseed_benchmark,
    get_benchmark_levels,
    get_benchmark_summary,
    get_final_scientific_evidence,
)
from .benchmarks import (
    classify_benchmark_candidate,
    compute_bootstrap_ci,
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
from .metrics import evaluate_tracer, score_order

__all__ = [
    "execute_baseline_comparison",
    "execute_benchmark",
    "execute_multiseed_benchmark",
    "classify_benchmark_candidate",
    "compute_bootstrap_ci",
    "evaluate_tracer",
    "get_benchmark_levels",
    "get_benchmark_summary",
    "get_final_scientific_evidence",
    "get_difficulty_levels",
    "run_ablation_study",
    "run_baseline_comparison",
    "run_benchmark",
    "run_expanded_negative_controls",
    "run_multiworld_benchmark",
    "run_multiseed_benchmark",
    "run_negative_control_benchmark",
    "run_scalability_benchmark",
    "run_variable_target_benchmark",
    "score_order",
]
