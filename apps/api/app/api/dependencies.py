"""FastAPI dependency adapters."""

from typing import cast

from fastapi import Request

from app.orchestration.run_service import RunService


def get_run_service(request: Request) -> RunService:
    return cast(RunService, request.app.state.run_service)
