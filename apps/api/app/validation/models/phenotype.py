"""Phenotype and epistasis configuration domain models."""
from dataclasses import dataclass, field
from typing import List, Dict, Any


@dataclass
class EpistaticInteraction:
    id: str
    locus_a: str
    locus_b: str
    locus_a_pos: int
    locus_b_pos: int
    coefficient: float
    description: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "locus_a": self.locus_a,
            "locus_b": self.locus_b,
            "locus_a_pos": self.locus_a_pos,
            "locus_b_pos": self.locus_b_pos,
            "coefficient": self.coefficient,
            "description": self.description,
        }
