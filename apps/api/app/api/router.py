"""Top-level API router."""

from typing import Any

from fastapi import APIRouter

from app.schemas.errors import ErrorResponse

from .compat import benchmarks as benchmark_compat
from .compat import events as legacy_events
from .compat import experiments as experiment_compat
from .compat import real_trio as real_trio_compat
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
    # The extracted backend is still used by the submitted frontend. These
    # adapters preserve its URLs while delegating to the canonical services;
    # no legacy router or database singleton is mounted here.
    router.include_router(experiment_compat.router, responses=public_errors)
    router.include_router(real_trio_compat.router, responses=public_errors)
    router.include_router(benchmark_compat.legacy_router, responses=public_errors)
    router.include_router(benchmark_compat.v1_router, responses=public_errors)
    router.include_router(legacy_events.router)
    return router
