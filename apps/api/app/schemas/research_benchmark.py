"""Contract for the bounded multi-seed scientific validation report."""

from __future__ import annotations

from typing import Any

from pydantic import Field

from .common import ContractModel


class ResearchBenchmarkResponse(ContractModel):
    benchmark_name: str
    difficulty: str
    n_seeds: int
    aggregate_metrics: dict[str, float | None]
    confidence_intervals: dict[str, dict[str, Any]]
    confidence_interval_method: dict[str, Any]
    baseline_results: dict[str, Any]
    ablation_results: dict[str, Any]
    negative_controls: dict[str, Any]
    exact_generative_recovery: dict[str, Any] = Field(default_factory=dict)
    functional_rescue_recovery: dict[str, Any] = Field(default_factory=dict)
    hierarchical_metrics: dict[str, Any] = Field(default_factory=dict)
    candidate_redundancy: dict[str, Any] = Field(default_factory=dict)
    provenance_contribution: dict[str, Any] = Field(default_factory=dict)
    baseline_deltas: dict[str, Any] = Field(default_factory=dict)
    difficulty_diagnostics: dict[str, Any] = Field(default_factory=dict)
    runtime_summary: dict[str, Any]
    config: dict[str, Any]
    software_version: str
    seed_information: dict[str, Any]
    per_seed_metrics: list[dict[str, Any]] | None = None
