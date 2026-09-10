"""Optional, bounded post-run scientific analyses."""

from __future__ import annotations

from fastapi import APIRouter, Depends

from app.api.dependencies import get_run_service
from app.orchestration.run_service import RunService
from app.schemas.meiotic_null import MeioticNullAnalysisRequest, MeioticNullAnalysisResponse
from app.schemas.minimal_rescue import MinimalRescueRequest, MinimalRescueResponse

router = APIRouter(prefix="/v1/runs", tags=["analyses"])


@router.post("/{run_id}/meiotic-null", response_model=MeioticNullAnalysisResponse)
def meiotic_null(
    run_id: str,
    request: MeioticNullAnalysisRequest | None = None,
    service: RunService = Depends(get_run_service),
) -> MeioticNullAnalysisResponse:
    payload = request or MeioticNullAnalysisRequest()
    return service.meiotic_null(
        run_id,
        seed=payload.seed,
        simulation_count=payload.simulation_count,
        histogram_bin_count=payload.histogram_bin_count,
    )


@router.post("/{run_id}/minimal-rescue", response_model=MinimalRescueResponse)
def minimal_rescue(
    run_id: str,
    request: MinimalRescueRequest | None = None,
    service: RunService = Depends(get_run_service),
) -> MinimalRescueResponse:
    payload = request or MinimalRescueRequest()
    return service.minimal_rescue(
        run_id,
        top_k=payload.top_k,
        max_set_size=payload.max_set_size,
        max_returned_sets=payload.max_returned_sets,
        max_combination_count=payload.max_combination_count,
    )


__all__ = ["router"]
