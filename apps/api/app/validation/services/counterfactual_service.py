"""Counterfactual service: candidate discovery and controlled genetic ablations."""
from typing import List, Optional
from app.validation.scientific.attribution import (
    NoveltyTracer,
    Candidate,
    CounterfactualResult,
)
from app.validation.scientific.recombination import ParentGenome, OffspringGenome
from app.validation.scientific.phenotype import PhenotypeEngine


class CounterfactualService:
    def create_tracer(
        self,
        parent_a: ParentGenome,
        parent_b: ParentGenome,
        offspring: OffspringGenome,
        phenotype_engine: PhenotypeEngine,
    ) -> NoveltyTracer:
        return NoveltyTracer(parent_a, parent_b, offspring, phenotype_engine)

    def rank_candidates(self, tracer: NoveltyTracer) -> List[CounterfactualResult]:
        return tracer.rank_candidates()

    def run_intervention(
        self, tracer: NoveltyTracer, candidate_id: str, intervention: str
    ) -> CounterfactualResult:
        candidates = tracer.generate_candidates()
        target_cand = next((c for c in candidates if c.id == candidate_id), None)
        if not target_cand:
            raise KeyError(f"Candidate not in screened pool: {candidate_id}")
        supported = {
            "INTERACTION": {"break_interaction", "BREAK_INTERACTION"},
            "SEGMENT": {"swap_segment", "REVERT_RECOMBINATION_CONFIGURATION", "REPLACE_SEGMENT", "REMOVE_SEGMENT"},
            "VARIANT": {"revert_variant", "remove_variant", "REMOVE_VARIANT", "REPLACE_WITH_PARENTAL_GENOTYPE"},
        }
        if intervention not in supported[target_cand.candidate_type]:
            raise ValueError(f"Unsupported intervention {intervention} for {target_cand.candidate_type}")
        from dataclasses import replace
        if target_cand.candidate_type == "VARIANT":
            details = dict(target_cand.details)
            idx = int(details["locus_id"].replace("L", "")) - 1
            parental = intervention == "REPLACE_WITH_PARENTAL_GENOTYPE"
            details["altered_dosage"] = tracer.parent_a.homolog_1[idx] + tracer.parent_a.homolog_2[idx] if parental else 0
            details["counterfactual_policy"] = "replace_with_parent_a_genotype" if parental else "remove_variant"
            target_cand = replace(target_cand, details=details)
        if target_cand.candidate_type == "SEGMENT":
            target_cand = replace(target_cand, details={**target_cand.details, "operation": intervention})
        return tracer.run_counterfactual(target_cand)


counterfactual_service = CounterfactualService()
