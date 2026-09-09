"""Top-level API router."""

from typing import Any

from fastapi import APIRouter

from app.schemas.errors import ErrorResponse

from .v1 import counterfactuals, datasets, events, health, ingestion, runs, trace


def build_router() -> APIRouter:
    router = APIRouter()
    public_errors: dict[int | str, dict[str, Any]] = {
        code: {"model": ErrorResponse}
        for code in (400, 404, 409, 422, 500, 503)
    }
    router.include_router(health.router, responses=public_errors)
    router.include_router(datasets.router, responses=public_errors)
    router.include_router(runs.router, responses=public_errors)
    router.include_router(counterfactuals.router, responses=public_errors)
    router.include_router(ingestion.router, responses=public_errors)
    router.include_router(trace.router, responses=public_errors)
    router.include_router(events.router)
    return router
