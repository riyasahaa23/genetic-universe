"""Crossover and Segment provenance domain models."""
from dataclasses import dataclass
from typing import List, Dict, Any


@dataclass
class SegmentProvenance:
    start: int
    end: int
    source_homolog: str
    parent_id: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "start": self.start,
            "end": self.end,
            "source_homolog": self.source_homolog,
            "parent_id": self.parent_id,
        }


@dataclass
class CrossoverEvent:
    experiment_id: str
    parent_id: str
    breakpoint: int
    source_homolog_before: str
    source_homolog_after: str
