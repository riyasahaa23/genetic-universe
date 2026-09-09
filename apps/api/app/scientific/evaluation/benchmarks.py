"""Benchmark entrypoints with no API or database dependency."""

from app.scientific.synthetic.benchmark import (
    run_benchmark,
    run_negative_control_benchmark,
    run_scalability_benchmark,
)

__all__ = ["run_benchmark", "run_negative_control_benchmark", "run_scalability_benchmark"]
