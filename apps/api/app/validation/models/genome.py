"""Parent and Offspring genome domain models."""
from dataclasses import dataclass
from typing import List, Dict, Any
from app.validation.models.locus import Locus


@dataclass
class ParentGenome:
    parent_id: str
    homolog_1: List[int]
    homolog_2: List[int]
    loci: List[Locus]

    def get_dosage(self) -> List[int]:
        return [h1 + h2 for h1, h2 in zip(self.homolog_1, self.homolog_2)]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "parent_id": self.parent_id,
            "haplotypes": {
                f"{self.parent_id}1": self.homolog_1,
                f"{self.parent_id}2": self.homolog_2,
            },
            "dosage": self.get_dosage(),
            "locus_count": len(self.loci),
        }
