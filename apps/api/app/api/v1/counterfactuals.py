"""Counterfactual intervention endpoints."""

from fastapi import APIRouter, Depends

from app.api.dependencies import get_run_service
from app.orchestration.run_service import RunService
from app.schemas.counterfactual import CounterfactualList, CounterfactualRequest, CounterfactualResult

router = APIRouter(prefix="/v1/runs", tags=["counterfactuals"])


@router.post("/{run_id}/counterfactuals", response_model=CounterfactualResult)
def execute_counterfactual(run_id: str, request: CounterfactualRequest, service: RunService = Depends(get_run_service)) -> CounterfactualResult:
    return service.counterfactual(run_id, request)


@router.get("/{run_id}/counterfactuals", response_model=CounterfactualList)
def list_counterfactuals(run_id: str, service: RunService = Depends(get_run_service)) -> CounterfactualList:
    return service.counterfactual_list(run_id)
