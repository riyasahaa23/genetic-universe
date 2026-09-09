"""Meiosis and Fertilization simulation endpoints."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.validation.db.database import get_db
from app.validation.db.repository import ExperimentRepository
from app.validation.schemas.genome import MeiosisSimulationResponse, OffspringResponse, GameteSchema, SegmentProvenanceSchema, LocusProvenanceSchema
from app.validation.services.experiment_session import experiment_manager

router = APIRouter(prefix="/api/experiments", tags=["simulations"])


@router.post("/{experiment_id}/meiosis", response_model=MeiosisSimulationResponse)
async def run_meiosis(experiment_id: str, db: Session = Depends(get_db)):
    state = experiment_manager.get_experiment(experiment_id)
    if not state:
        raise HTTPException(status_code=404, detail={"code": "EXPERIMENT_NOT_FOUND", "message": f"Experiment {experiment_id} not found."})

    repo = ExperimentRepository(db)
    await experiment_manager.run_meiosis(experiment_id, repo=repo)

    return MeiosisSimulationResponse(
        experiment_id=experiment_id,
        gamete_a=GameteSchema(
            parent_id="A",
            alleles=state.gamete_a.alleles,
            crossovers=state.gamete_a.crossovers,
            segments=[SegmentProvenanceSchema(**s.to_dict()) for s in state.gamete_a.segments],
        ),
        gamete_b=GameteSchema(
            parent_id="B",
            alleles=state.gamete_b.alleles,
            crossovers=state.gamete_b.crossovers,
            segments=[SegmentProvenanceSchema(**s.to_dict()) for s in state.gamete_b.segments],
        ),
    )


@router.post("/{experiment_id}/offspring", response_model=OffspringResponse)
async def generate_offspring(experiment_id: str, db: Session = Depends(get_db)):
    state = experiment_manager.get_experiment(experiment_id)
    if not state:
        raise HTTPException(status_code=404, detail={"code": "EXPERIMENT_NOT_FOUND", "message": f"Experiment {experiment_id} not found."})

    repo = ExperimentRepository(db)
    await experiment_manager.generate_offspring(experiment_id, repo=repo)

    return OffspringResponse(
        experiment_id=experiment_id,
        offspring_id=state.offspring.offspring_id,
        maternal_or_parent_a=state.offspring.maternal_gamete.alleles,
        paternal_or_parent_b=state.offspring.paternal_gamete.alleles,
        dosage=state.offspring.get_dosage(),
        provenance=[LocusProvenanceSchema(**p.to_dict()) for p in state.offspring.loci_provenance],
    )
