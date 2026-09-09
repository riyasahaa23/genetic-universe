"""Service health endpoint."""

from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Request
from sqlalchemy import text

from app.schemas.common import ContractModel


class HealthResponse(ContractModel):
    status: str
    service: str
    version: str
    environment: str
    mode: str
    database: str
    scientific_core: str
    timestamp: datetime


router = APIRouter(tags=["system"])


@router.get("/health", response_model=HealthResponse)
def health(request: Request) -> HealthResponse:
    settings = request.app.state.settings
    database_status = "memory"
    engine = getattr(request.app.state, "database_engine", None)
    if engine is not None:
        try:
            with engine.connect() as connection:
                connection.execute(text("SELECT 1"))
            database_status = "ok"
        except Exception:
            database_status = "unavailable"
    return HealthResponse(
        status="ok" if database_status != "unavailable" else "degraded",
        service=settings.app_name,
        version=settings.app_version,
        environment=settings.environment,
        mode="synthetic_and_real_trio_synthetic_phenotype",
        database=database_status,
        scientific_core="synthetic-attribution-v1",
        timestamp=datetime.now(timezone.utc),
    )
