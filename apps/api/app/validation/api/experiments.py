"""Experiments API endpoints."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.validation.db.database import get_db
from app.validation.db.repository import ExperimentRepository
from app.validation.schemas.experiment import CreateExperimentRequest, ExperimentResponse
from app.validation.services.experiment_session import experiment_manager

router = APIRouter(prefix="/api/experiments", tags=["experiments"])


@router.post("", response_model=ExperimentResponse)
def create_experiment(req: CreateExperimentRequest, db: Session = Depends(get_db)):
    repo = ExperimentRepository(db)
    state = experiment_manager.create_experiment(seed=req.seed, locus_count=req.locus_count, repo=repo)
    return ExperimentResponse(
        experiment_id=state.experiment_id,
        seed=state.seed,
        locus_count=state.locus_count,
        status=state.status,
    )


@router.get("/{experiment_id}", response_model=ExperimentResponse)
def get_experiment(experiment_id: str, db: Session = Depends(get_db)):
    state = experiment_manager.get_experiment(experiment_id)
    if not state:
        repo = ExperimentRepository(db)
        exp_db = repo.get_experiment(experiment_id)
        if not exp_db:
            raise HTTPException(status_code=404, detail={"code": "EXPERIMENT_NOT_FOUND", "message": f"Experiment {experiment_id} not found."})
        return ExperimentResponse(
            experiment_id=exp_db.id,
            seed=exp_db.seed,
            locus_count=exp_db.locus_count,
            status=exp_db.status,
            created_at=exp_db.created_at,
            completed_at=exp_db.completed_at,
        )
    return ExperimentResponse(
        experiment_id=state.experiment_id,
        seed=state.seed,
        locus_count=state.locus_count,
        status=state.status,
    )


@router.post("/demo/run")
async def run_full_demo(db: Session = Depends(get_db)):
    """
    Executes the complete deterministic Hack Summit MVP pipeline in a single call.
    Produces:
    Parent A + Parent B -> Meiosis -> Gametes -> Offspring -> Phenotype -> Novelty -> Trace -> Evidence Graph.
    """
    repo = ExperimentRepository(db)
    state = experiment_manager.create_experiment(seed=42, locus_count=50, repo=repo)
    exp_id = state.experiment_id

    await experiment_manager.setup_genomes(exp_id, repo=repo)
    await experiment_manager.run_meiosis(exp_id, repo=repo)
    await experiment_manager.generate_offspring(exp_id, repo=repo)
    await experiment_manager.calculate_phenotypes(exp_id, repo=repo)
    await experiment_manager.detect_novelty(exp_id, repo=repo)
    ranked = await experiment_manager.run_trace(exp_id, repo=repo)
    graph = await experiment_manager.get_evidence_graph(exp_id, repo=repo)

    return {
        "experiment_id": exp_id,
        "seed": state.seed,
        "locus_count": state.locus_count,
        "parent_a": state.parent_a.to_dict(),
        "parent_b": state.parent_b.to_dict(),
        "gamete_a": state.gamete_a.to_dict(),
        "gamete_b": state.gamete_b.to_dict(),
        "offspring": state.offspring.to_dict(),
        "phenotypes": {
            "parent_a": state.parent_a_phenotype.to_dict(),
            "parent_b": state.parent_b_phenotype.to_dict(),
            "offspring": state.offspring_phenotype.to_dict(),
        },
        "novelty": state.novelty_assessment.to_dict(),
        "trace": {
            "total_candidates": len(ranked),
            "primary_candidate": ranked[0].to_dict() if ranked else None,
            "ranked_candidates": [r.to_dict() for r in ranked],
        },
        "evidence_graph": graph,
    }
