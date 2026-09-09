"""Benchmark and planted-ground-truth interfaces."""

from .benchmarks import run_benchmark, run_negative_control_benchmark, run_scalability_benchmark
from .metrics import evaluate_tracer, score_order

__all__ = [
    "evaluate_tracer",
    "run_benchmark",
    "run_negative_control_benchmark",
    "run_scalability_benchmark",
    "score_order",
]
