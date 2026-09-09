"""Novelty Trace and Counterfactual Intervention endpoints."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.validation.db.database import get_db
from app.validation.db.repository import ExperimentRepository
from app.validation.schemas.evidence import NoveltyTraceResponse
from app.validation.schemas.phenotype import (
    CounterfactualInterventionRequest,
    CounterfactualInterventionResponse,
)
from app.validation.services.experiment_session import experiment_manager

router = APIRouter(prefix="/api/experiments", tags=["counterfactual"])


@router.post("/{experiment_id}/trace", response_model=NoveltyTraceResponse)
async def run_novelty_trace(experiment_id: str, db: Session = Depends(get_db)):
    state = experiment_manager.get_experiment(experiment_id)
    if not state:
        raise HTTPException(status_code=404, detail={"code": "EXPERIMENT_NOT_FOUND", "message": f"Experiment {experiment_id} not found."})

    repo = ExperimentRepository(db)
    ranked = await experiment_manager.run_trace(experiment_id, repo=repo)

    schema_results = [
        CounterfactualInterventionResponse(experiment_id=experiment_id, **r.to_dict())
        for r in ranked
    ]

    return NoveltyTraceResponse(
        experiment_id=experiment_id,
        total_candidates=len(ranked),
        primary_candidate=schema_results[0] if schema_results else None,
        ranked_candidates=schema_results,
    )


@router.post("/{experiment_id}/counterfactual", response_model=CounterfactualInterventionResponse)
async def run_counterfactual_intervention(
    experiment_id: str,
    req: CounterfactualInterventionRequest,
    db: Session = Depends(get_db),
):
    state = experiment_manager.get_experiment(experiment_id)
    if not state:
        raise HTTPException(status_code=404, detail={"code": "EXPERIMENT_NOT_FOUND", "message": f"Experiment {experiment_id} not found."})

    repo = ExperimentRepository(db)
    result = await experiment_manager.run_counterfactual(
        experiment_id=experiment_id,
        candidate_id=req.candidate_id,
        intervention=req.intervention,
        repo=repo,
    )

    return CounterfactualInterventionResponse(
        experiment_id=experiment_id,
        **result.to_dict(),
    )
