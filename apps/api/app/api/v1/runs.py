"""Run lifecycle and snapshot endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Query, status

from app.api.dependencies import get_run_service
from app.orchestration.run_service import RunService
from app.schemas.events import TimelineResponse
from app.schemas.run import CreateRunRequest, RunCreateResponse, RunSnapshot, RunStatusResponse

router = APIRouter(prefix="/v1/runs", tags=["runs"])


@router.post("", response_model=RunCreateResponse, status_code=status.HTTP_201_CREATED)
def create_run(request: CreateRunRequest, service: RunService = Depends(get_run_service)) -> RunCreateResponse:
    return service.create(request)


@router.get("/{run_id}", response_model=RunStatusResponse)
def get_run(run_id: str, service: RunService = Depends(get_run_service)) -> RunStatusResponse:
    return service.get(run_id).status_response()


@router.post("/{run_id}/start", response_model=RunStatusResponse)
def start_run(run_id: str, service: RunService = Depends(get_run_service)) -> RunStatusResponse:
    return service.start(run_id).status_response()


@router.get("/{run_id}/snapshot", response_model=RunSnapshot)
def snapshot(run_id: str, service: RunService = Depends(get_run_service)) -> RunSnapshot:
    return service.snapshot(run_id)


@router.get("/{run_id}/timeline", response_model=TimelineResponse)
def timeline(run_id: str, after_sequence: int = Query(default=0, ge=0), service: RunService = Depends(get_run_service)) -> TimelineResponse:
    return service.timeline(run_id, after_sequence)
