"""Genomes API endpoints."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.validation.db.database import get_db
from app.validation.db.repository import ExperimentRepository
from app.validation.schemas.genome import ParentGenomesResponse, HomologPairSchema
from app.validation.services.experiment_session import experiment_manager

router = APIRouter(prefix="/api/experiments", tags=["genomes"])


@router.post("/{experiment_id}/genomes", response_model=ParentGenomesResponse)
async def generate_parent_genomes(experiment_id: str, db: Session = Depends(get_db)):
    state = experiment_manager.get_experiment(experiment_id)
    if not state:
        raise HTTPException(status_code=404, detail={"code": "EXPERIMENT_NOT_FOUND", "message": f"Experiment {experiment_id} not found."})

    repo = ExperimentRepository(db)
    await experiment_manager.setup_genomes(experiment_id, repo=repo)

    return ParentGenomesResponse(
        experiment_id=experiment_id,
        parent_a=HomologPairSchema(**state.parent_a.to_dict()),
        parent_b=HomologPairSchema(**state.parent_b.to_dict()),
    )
