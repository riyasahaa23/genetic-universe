"""Genome service: manages loci and synthetic parental genomes."""
from typing import Tuple, List, Dict, Any
from app.validation.scientific.recombination import (
    generate_loci,
    generate_synthetic_parents,
    ParentGenome,
    Locus,
)


class GenomeService:
    def create_loci(self, count: int = 50) -> List[Locus]:
        return generate_loci(count)

    def create_parent_genomes(self, loci: List[Locus], seed: int = 42) -> Tuple[ParentGenome, ParentGenome]:
        return generate_synthetic_parents(loci, seed=seed)


genome_service = GenomeService()
