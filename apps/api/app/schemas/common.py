"""Shared contract vocabulary.

These models are deliberately independent from FastAPI and the scientific
implementation. They are the boundary consumed by the frontend and by API
contract tests.
"""

from __future__ import annotations

from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, ConfigDict, Field


class ContractModel(BaseModel):
    """Strict base model for public request and response contracts."""

    model_config = ConfigDict(extra="forbid", allow_inf_nan=False)


class RunMode(StrEnum):
    SYNTHETIC = "synthetic"
    REAL_TRIO_SYNTHETIC_PHENOTYPE = "real_trio_synthetic_phenotype"


class RunStatus(StrEnum):
    CREATED = "created"
    QUEUED = "queued"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class RunStage(StrEnum):
    SETUP = "setup"
    PARENT_LOADING = "parent_loading"
    MEIOSIS = "meiosis"
    FERTILIZATION = "fertilization"
    PHENOTYPE = "phenotype"
    NOVELTY_DETECTION = "novelty_detection"
    CANDIDATE_MINING = "candidate_mining"
    COUNTERFACTUAL = "counterfactual"
    EVIDENCE_GRAPH = "evidence_graph"
    COMPLETE = "complete"


class CandidateKind(StrEnum):
    VARIANT = "variant"
    SEGMENT = "segment"
    INTERACTION = "interaction"


class InterventionKind(StrEnum):
    REVERT_VARIANT = "revert_variant"
    SWAP_SEGMENT = "swap_segment"
    BREAK_INTERACTION = "break_interaction"


class BreakpointConfidence(StrEnum):
    EXACT = "exact"
    INFERRED_INTERVAL = "inferred_interval"


class EvidenceStatus(StrEnum):
    OBSERVED = "observed"
    INFERRED = "inferred"
    HYPOTHESIS = "hypothesis"
    UNRESOLVED = "unresolved"


class ProvenanceMetadata(ContractModel):
    seed: int
    dataset_id: str = Field(min_length=1)
    model_id: str = Field(min_length=1)
    model_version: str = Field(min_length=1)
    code_revision: str = Field(min_length=1)
    generated_at: datetime
    disclosure: str = Field(min_length=1)


class SourceArtifactReference(ContractModel):
    """A logical, checksum-addressed input used by a scientific run.

    `path` is intentionally omitted from the public contract. Local absolute
    paths are an implementation detail and must never leak to the browser.
    """

    artifact_id: str = Field(min_length=1)
    sha256: str = Field(pattern=r"^[a-f0-9]{64}$")
    source_url: str = Field(min_length=1)
    role: str = Field(min_length=1)
    reference_build: str | None = None


class DataDisclosure(ContractModel):
    dataset_kind: str = Field(min_length=1)
    genotype_source: str = Field(min_length=1)
    phenotype_source: str = Field(min_length=1)
    causal_interpretation: str = Field(min_length=1)


class PageInfo(ContractModel):
    offset: int = Field(default=0, ge=0)
    limit: int = Field(default=100, ge=1, le=1000)
    total: int = Field(default=0, ge=0)
    next_offset: int | None = Field(default=None, ge=0)
