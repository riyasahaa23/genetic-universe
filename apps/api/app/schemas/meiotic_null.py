"""Contracts for same-parent alternative-meiosis null analysis."""

from __future__ import annotations

from pydantic import Field

from .common import ContractModel


class MeioticNullAnalysisRequest(ContractModel):
    seed: int | None = Field(default=None, ge=0)
    simulation_count: int = Field(default=1000, ge=1, le=5000)
    histogram_bin_count: int = Field(default=20, ge=1, le=100)


class MeioticNullSummary(ContractModel):
    observed_phenotype: float
    parent_a_phenotype: float
    parent_b_phenotype: float
    parental_envelope: dict[str, float]
    null_count: int = Field(ge=1)
    null_mean: float
    null_std: float
    null_median: float
    null_min: float
    null_max: float
    quantiles: dict[str, float]
    observed_percentile: float = Field(ge=0.0, le=100.0)
    transgression_direction: str
    empirical_tail_probability: float | None = Field(default=None, ge=0.0, le=1.0)
    extreme_count: int | None = Field(default=None, ge=0)
    fraction_null_transgressive: float = Field(ge=0.0, le=1.0)
    fraction_null_above_envelope: float = Field(ge=0.0, le=1.0)
    fraction_null_below_envelope: float = Field(ge=0.0, le=1.0)
    seed: int = Field(ge=0)
    simulation_count: int = Field(ge=1)
    histogram_bins: list[float] = Field(default_factory=list)
    histogram_counts: list[int] = Field(default_factory=list)


class MeioticNullAnalysisResponse(MeioticNullSummary):
    run_id: str
