"""
Repository Layer for Experiment Audit Storage and Retrieval.
"""
import json
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session

from app.validation.db.models import (
    ExperimentDB,
    ParentalGenomeDB,
    CrossoverDB,
    GameteDB,
    OffspringGenomeDB,
    PhenotypeResultDB,
    CandidateDB,
    CounterfactualResultDB,
    EvidenceEdgeDB,
)


class ExperimentRepository:
    def __init__(self, db: Session):
        self.db = db

    def create_experiment(self, experiment_id: str, seed: int, locus_count: int) -> ExperimentDB:
        exp = ExperimentDB(
            id=experiment_id,
            seed=seed,
            locus_count=locus_count,
            status="CREATED",
            created_at=datetime.now(timezone.utc),
        )
        self.db.add(exp)
        self.db.commit()
        self.db.refresh(exp)
        return exp

    def get_experiment(self, experiment_id: str) -> Optional[ExperimentDB]:
        return self.db.query(ExperimentDB).filter(ExperimentDB.id == experiment_id).first()

    def update_status(self, experiment_id: str, status: str):
        exp = self.get_experiment(experiment_id)
        if exp:
            exp.status = status
            if status == "COMPLETED":
                exp.completed_at = datetime.now(timezone.utc)
            self.db.commit()

    def save_parent_genomes(self, experiment_id: str, parent_id: str, h1: List[int], h2: List[int]):
        record = ParentalGenomeDB(
            id=f"{experiment_id}_{parent_id}",
            experiment_id=experiment_id,
            parent_id=parent_id,
            homolog_1=json.dumps(h1),
            homolog_2=json.dumps(h2),
        )
        self.db.merge(record)
        self.db.commit()

    def save_crossover(self, experiment_id: str, parent_id: str, breakpoint: int, before: str, after: str):
        record = CrossoverDB(
            id=f"{experiment_id}_{parent_id}_{breakpoint}",
            experiment_id=experiment_id,
            parent_id=parent_id,
            breakpoint=breakpoint,
            source_homolog_before=before,
            source_homolog_after=after,
        )
        self.db.merge(record)
        self.db.commit()

    def save_gamete(self, experiment_id: str, parent_id: str, alleles: List[int], segments: List[Dict[str, Any]]):
        record = GameteDB(
            id=f"{experiment_id}_gamete_{parent_id}",
            experiment_id=experiment_id,
            parent_id=parent_id,
            genotype=json.dumps(alleles),
            ancestry_json=json.dumps(segments),
        )
        self.db.merge(record)
        self.db.commit()

    def save_offspring(self, experiment_id: str, genotype: List[int], provenance: List[Dict[str, Any]]):
        record = OffspringGenomeDB(
            id=f"{experiment_id}_offspring",
            experiment_id=experiment_id,
            genotype=json.dumps(genotype),
            provenance_json=json.dumps(provenance),
        )
        self.db.merge(record)
        self.db.commit()

    def save_phenotype_result(self, experiment_id: str, entity: str, value: float):
        record = PhenotypeResultDB(
            id=f"{experiment_id}_phenotype_{entity.lower().replace(' ', '_')}",
            experiment_id=experiment_id,
            entity=entity,
            value=value,
        )
        self.db.merge(record)
        self.db.commit()

    def save_candidates(self, experiment_id: str, candidates: List[Dict[str, Any]]):
        for rank, cand in enumerate(candidates, 1):
            record = CandidateDB(
                id=f"{experiment_id}_cand_{cand['candidate_id']}",
                experiment_id=experiment_id,
                candidate_type=cand.get("candidate_type", "UNKNOWN"),
                candidate_json=json.dumps(cand),
                rank=rank,
                score=cand.get("attribution_score", 0.0),
            )
            self.db.merge(record)
        self.db.commit()

    def save_counterfactual_result(
        self,
        experiment_id: str,
        candidate_id: str,
        intervention: str,
        orig_val: float,
        cf_val: float,
        delta: float,
    ):
        record = CounterfactualResultDB(
            id=f"{experiment_id}_cf_{candidate_id}_{intervention}",
            experiment_id=experiment_id,
            candidate_id=candidate_id,
            intervention=intervention,
            original_value=orig_val,
            counterfactual_value=cf_val,
            delta=delta,
        )
        self.db.merge(record)
        self.db.commit()

    def save_evidence_edges(self, experiment_id: str, edges: List[Dict[str, Any]]):
        for idx, edge in enumerate(edges):
            record = EvidenceEdgeDB(
                id=f"{experiment_id}_edge_{idx}",
                experiment_id=experiment_id,
                source_node=edge["source"],
                target_node=edge["target"],
                relationship_type=edge.get("relationship", "related_to"),
            )
            self.db.merge(record)
        self.db.commit()
