"""Phenotype calculation and novelty detection endpoints."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.validation.db.database import get_db
from app.validation.db.repository import ExperimentRepository
from app.validation.schemas.phenotype import (
    PhenotypeCalculationResponse,
    PhenotypeBreakdownSchema,
    NoveltyDetectionResponse,
)
from app.validation.services.experiment_session import experiment_manager

router = APIRouter(prefix="/api/experiments", tags=["phenotype"])


@router.post("/{experiment_id}/phenotype", response_model=PhenotypeCalculationResponse)
async def calculate_phenotype(experiment_id: str, db: Session = Depends(get_db)):
    state = experiment_manager.get_experiment(experiment_id)
    if not state:
        raise HTTPException(status_code=404, detail={"code": "EXPERIMENT_NOT_FOUND", "message": f"Experiment {experiment_id} not found."})

    repo = ExperimentRepository(db)
    await experiment_manager.calculate_phenotypes(experiment_id, repo=repo)

    return PhenotypeCalculationResponse(
        experiment_id=experiment_id,
        parent_a=PhenotypeBreakdownSchema(**state.parent_a_phenotype.to_dict()),
        parent_b=PhenotypeBreakdownSchema(**state.parent_b_phenotype.to_dict()),
        offspring=PhenotypeBreakdownSchema(**state.offspring_phenotype.to_dict()),
    )


@router.post("/{experiment_id}/novelty", response_model=NoveltyDetectionResponse)
async def detect_novelty_endpoint(experiment_id: str, db: Session = Depends(get_db)):
    state = experiment_manager.get_experiment(experiment_id)
    if not state:
        raise HTTPException(status_code=404, detail={"code": "EXPERIMENT_NOT_FOUND", "message": f"Experiment {experiment_id} not found."})

    repo = ExperimentRepository(db)
    assessment = await experiment_manager.detect_novelty(experiment_id, repo=repo)

    return NoveltyDetectionResponse(
        experiment_id=experiment_id,
        **assessment.to_dict(),
    )
