"""Prepared real-data ingestion preview contracts."""

from __future__ import annotations

from pydantic import Field, model_validator

from .common import ContractModel


class IngestionPreviewRequest(ContractModel):
    dataset_id: str = Field(min_length=1)
    family_id: str | None = Field(default=None, min_length=1)
    chromosome: str | None = Field(default=None, min_length=1)
    start: int | None = Field(default=None, ge=1)
    end: int | None = Field(default=None, ge=1)

    @model_validator(mode="after")
    def complete_region(self) -> "IngestionPreviewRequest":
        values = (self.chromosome, self.start, self.end)
        if any(value is not None for value in values) and not all(value is not None for value in values):
            raise ValueError("chromosome, start and end must be supplied together")
        if self.start is not None and self.end is not None and self.end < self.start:
            raise ValueError("end must be greater than or equal to start")
        return self


class IngestionPreviewResponse(ContractModel):
    dataset_id: str
    available: bool
    status: str
    family_id: str | None = None
    reference_build: str | None = None
    region: dict[str, object] | None = None
    sample_ids: dict[str, str] = Field(default_factory=dict)
    artifact_count: int = Field(default=0, ge=0)
    issues: list[str] = Field(default_factory=list)
    disclosure: str
