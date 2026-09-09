"""Run lifecycle and render snapshot contracts."""

from __future__ import annotations

from pydantic import Field, model_validator

from .common import (
    ContractModel,
    DataDisclosure,
    PageInfo,
    ProvenanceMetadata,
    RunMode,
    RunStage,
    RunStatus,
    SourceArtifactReference,
)
from .counterfactual import CounterfactualResult
from .genome import GenomeSnapshot
from .phenotype import PhenotypeBundle
from .trace import EvidenceGraph, TraceCandidate


class RunOptions(ContractModel):
    # Ten loci is the lower bound supported by the migrated legacy experiment
    # API. The scientific demo still defaults to fifty and the frontend should
    # prefer twenty or more for readable crossover visualizations.
    locus_count: int = Field(default=50, ge=10, le=1000)
    max_candidates: int = Field(default=50, ge=1, le=500)
    include_noise: bool = False
    candidate_interactions: int = Field(default=2, ge=1, le=10)
    family_id: str | None = Field(default=None, min_length=1)
    region_chromosome: str | None = Field(default=None, min_length=1)
    region_start: int | None = Field(default=None, ge=1)
    region_end: int | None = Field(default=None, ge=1)

    @model_validator(mode="after")
    def validate_region(self) -> "RunOptions":
        provided = (self.region_chromosome, self.region_start, self.region_end)
        if any(value is not None for value in provided) and not all(value is not None for value in provided):
            raise ValueError("region_chromosome, region_start and region_end must be provided together")
        if self.region_start is not None and self.region_end is not None and self.region_end < self.region_start:
            raise ValueError("region_end must be greater than or equal to region_start")
        return self


class CreateRunRequest(ContractModel):
    mode: RunMode = RunMode.SYNTHETIC
    dataset_id: str = "fixture_epistasis_ab_cd_v1"
    seed: int = Field(default=42, ge=0)
    phenotype_model_id: str = "synthetic_height_like"
    options: RunOptions = Field(default_factory=RunOptions)

    @model_validator(mode="after")
    def validate_mode(self) -> "CreateRunRequest":
        if self.mode == RunMode.REAL_TRIO_SYNTHETIC_PHENOTYPE and self.dataset_id.startswith("fixture_"):
            raise ValueError("real_trio_synthetic_phenotype requires a real-trio dataset ID")
        return self


class RunStatusResponse(ContractModel):
    run_id: str
    status: RunStatus
    mode: RunMode
    stage: RunStage
    progress: float = Field(ge=0.0, le=1.0)
    seed: int
    dataset_id: str
    model_version: str
    error_code: str | None = None


class RunCreateResponse(ContractModel):
    run_id: str
    status: RunStatus
    events_url: str
    snapshot_url: str


class DatasetSummary(ContractModel):
    dataset_id: str
    label: str
    mode: RunMode
    assembly: str
    disclosure: str
    available: bool


class DatasetListResponse(ContractModel):
    datasets: list[DatasetSummary]


class RunSnapshot(ContractModel):
    schema_version: str = "1.0"
    run_id: str
    status: RunStatus
    mode: RunMode
    seed: int
    stage: RunStage
    dataset_id: str
    genome: GenomeSnapshot
    phenotype: PhenotypeBundle
    candidates: list[TraceCandidate]
    evidence_graph: EvidenceGraph
    counterfactuals: list[CounterfactualResult] = Field(default_factory=list)
    reproducibility: ProvenanceMetadata
    limitations: list[str] = Field(default_factory=list)
    disclosure: DataDisclosure
    source_artifacts: list[SourceArtifactReference] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)


class CandidatePage(ContractModel):
    run_id: str
    candidates: list[TraceCandidate]
    page: PageInfo
