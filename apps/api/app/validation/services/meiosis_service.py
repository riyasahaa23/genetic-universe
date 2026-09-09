"""Meiosis service: simulates meiotic crossover and fertilization."""
from typing import Tuple, Optional, List
import numpy as np
from app.validation.scientific.recombination import (
    simulate_meiosis,
    fertilize,
    ParentGenome,
    Gamete,
    OffspringGenome,
    Locus,
)


class MeiosisService:
    def simulate_parent_meiosis(
        self,
        parent: ParentGenome,
        crossover_positions: Optional[List[int]] = None,
        start_homolog: int = 0,
        rng: Optional[np.random.Generator] = None,
    ) -> Gamete:
        return simulate_meiosis(
            parent.homolog_1,
            parent.homolog_2,
            parent.parent_id,
            crossover_positions=crossover_positions,
            start_homolog=start_homolog,
            rng=rng,
        )

    def fertilize_gametes(
        self,
        gamete_a: Gamete,
        gamete_b: Gamete,
        loci: List[Locus],
        offspring_id: str = "O1",
    ) -> OffspringGenome:
        return fertilize(gamete_a, gamete_b, loci, offspring_id=offspring_id)


meiosis_service = MeiosisService()
