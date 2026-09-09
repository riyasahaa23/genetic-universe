"""Canonical scientific benchmark exports.

The low-level generators remain available for research code, while the typed
``execute_*`` services are the preferred API-facing boundary.
"""

from app.scientific.evaluation.benchmark_suite import (
    execute_baseline_comparison,
    execute_benchmark,
    execute_multiseed_benchmark,
    get_benchmark_levels,
    get_benchmark_summary,
    get_final_scientific_evidence,
)
from app.scientific.synthetic.benchmark import (
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

__all__ = [
    "classify_benchmark_candidate",
    "compute_bootstrap_ci",
    "execute_benchmark",
    "execute_baseline_comparison",
    "execute_multiseed_benchmark",
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
]
