"""Phenotype service: evaluates quantitative models and formula breakdowns."""
from typing import Dict, Any, Tuple
from app.validation.scientific.phenotype import (
    PhenotypeEngine,
    PhenotypeConfig,
    PhenotypeBreakdown,
    get_default_demo_phenotype_config,
)
from app.validation.scientific.recombination import ParentGenome, OffspringGenome


class PhenotypeService:
    def __init__(self, config: PhenotypeConfig = None):
        self.config = config or get_default_demo_phenotype_config()
        self.engine = PhenotypeEngine(self.config)

    def calculate_parental_phenotypes(
        self, parent_a: ParentGenome, parent_b: ParentGenome
    ) -> Tuple[PhenotypeBreakdown, PhenotypeBreakdown]:
        bd_a = self.engine.evaluate_diploid(parent_a.homolog_1, parent_a.homolog_2)
        bd_b = self.engine.evaluate_diploid(parent_b.homolog_1, parent_b.homolog_2)
        return bd_a, bd_b

    def calculate_offspring_phenotype(
        self, offspring: OffspringGenome
    ) -> PhenotypeBreakdown:
        return self.engine.evaluate_diploid(
            offspring.maternal_gamete.alleles,
            offspring.paternal_gamete.alleles,
        )


phenotype_service = PhenotypeService()
