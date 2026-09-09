"""Locus domain model."""
from dataclasses import dataclass, field
from typing import List, Dict, Any


@dataclass
class Locus:
    id: str
    position: int
    chromosome: str = "chr1"
    alleles: List[int] = field(default_factory=lambda: [0, 1])

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "position": self.position,
            "chromosome": self.chromosome,
            "alleles": self.alleles,
        }
