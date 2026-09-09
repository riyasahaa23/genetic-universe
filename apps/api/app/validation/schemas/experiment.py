"""Schemas for experiment lifecycle."""
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field


class CreateExperimentRequest(BaseModel):
    seed: int = Field(default=42, ge=0, description="Deterministic pseudo-random generator seed")
    locus_count: int = Field(default=50, ge=10, le=1000, description="Number of genomic loci (20-100 recommended for MVP)")


class ExperimentResponse(BaseModel):
    experiment_id: str
    seed: int
    locus_count: int
    status: str
    created_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
