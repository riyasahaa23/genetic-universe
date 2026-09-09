"""Novelty Trace endpoints."""

from fastapi import APIRouter, Depends

from app.api.dependencies import get_run_service
from app.orchestration.run_service import RunService
from app.schemas.trace import TraceResponse

router = APIRouter(prefix="/v1/runs", tags=["trace"])


@router.post("/{run_id}/trace", response_model=TraceResponse)
def run_trace(run_id: str, service: RunService = Depends(get_run_service)) -> TraceResponse:
    return service.trace(run_id)


@router.get("/{run_id}/trace", response_model=TraceResponse)
def get_trace(run_id: str, service: RunService = Depends(get_run_service)) -> TraceResponse:
    return service.trace(run_id)
