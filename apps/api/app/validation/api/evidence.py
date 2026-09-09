"""Evidence graph and research benchmark API endpoints."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.validation.db.database import get_db
from app.validation.db.repository import ExperimentRepository
from app.validation.schemas.evidence import EvidenceGraphResponse
from app.validation.services.experiment_session import experiment_manager
from app.validation.scientific.benchmark import run_benchmark, run_scalability_benchmark

router = APIRouter(tags=["evidence"])


@router.get("/api/experiments/{experiment_id}/evidence-graph", response_model=EvidenceGraphResponse)
async def get_evidence_graph_endpoint(experiment_id: str, db: Session = Depends(get_db)):
    state = experiment_manager.get_experiment(experiment_id)
    if not state:
        raise HTTPException(status_code=404, detail={"code": "EXPERIMENT_NOT_FOUND", "message": f"Experiment {experiment_id} not found."})

    repo = ExperimentRepository(db)
    graph_data = await experiment_manager.get_evidence_graph(experiment_id, repo=repo)

    return EvidenceGraphResponse(
        experiment_id=experiment_id,
        directed=graph_data.get("directed", True),
        nodes=graph_data.get("nodes", []),
        links=graph_data.get("links", []),
        top_candidate=graph_data.get("top_candidate"),
    )


@router.get("/api/benchmark")
def get_benchmark_results(
    locus_count: int = Query(50, ge=20, le=500),
    causal_interactions: int = Query(2, ge=1, le=5),
    seed: int = Query(42),
):
    """Executes synthetic ground-truth benchmark and returns quantitative performance metrics."""
    return run_benchmark(
        locus_count=locus_count,
        causal_interactions=causal_interactions,
        seed=seed,
    )


@router.get("/api/benchmark/scalability")
def get_scalability_benchmark():
    """Runs scalability evaluation across varying loci sizes (20, 50, 100, 200)."""
    return run_scalability_benchmark()
