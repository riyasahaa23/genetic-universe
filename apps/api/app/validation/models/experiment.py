"""Experiment entity domain model."""
from dataclasses import dataclass
from datetime import datetime
from typing import Optional


@dataclass
class Experiment:
    id: str
    seed: int
    locus_count: int
    status: str
    created_at: datetime
    completed_at: Optional[datetime] = None
