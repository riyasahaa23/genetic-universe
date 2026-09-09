"""Canonical FastAPI entrypoint for Genetic Universe.

The application owns one run lifecycle and exposes both REST snapshots and a
replayable event stream. Scientific computation remains in transport-free
modules under ``app.scientific``.
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.errors import register_error_handlers
from app.api.router import build_router
from app.infrastructure.database import create_database_engine, initialize_database
from app.infrastructure.logging import configure_logging
from app.orchestration.event_bus import EventBus
from app.orchestration.run_service import RunService
from app.repositories.memory import InMemoryRunRepository
from app.repositories.sqlalchemy import SqlAlchemyRunRepository
from app.settings import Settings, get_settings


def create_app(
    settings: Settings | Path | str | None = None,
    *,
    allow_validation: bool = False,
    data_root: Path | str | None = None,
) -> FastAPI:
    """Create an isolated application instance.

    Production callers should pass :class:`Settings` (or rely on the cached
    environment settings).  Accepting a data-root path is a deliberately
    narrow compatibility affordance for the extracted backend's fixture
    tests, which historically called ``create_app(path, allow_validation=...)``.
    Validation manifests are opt-in and are never enabled by environment
    configuration or the module-level production ``app`` instance.
    """

    if settings is not None and data_root is not None:
        raise TypeError("Pass either settings or data_root, not both")
    if data_root is not None:
        settings = data_root

    if settings is None:
        active_settings = get_settings()
    elif isinstance(settings, Settings):
        active_settings = settings
    else:
        active_settings = Settings(data_root=Path(settings))
    configure_logging(active_settings.log_level)
    logger = logging.getLogger("genetic_universe.api")

    @asynccontextmanager
    async def lifespan(application: FastAPI):
        if database_engine is not None:
            # Schema changes are applied during an explicit application
            # startup lifecycle, never as a module-import side effect. CI and
            # deployments can run scripts/migrate.py before this point.
            initialize_database(database_engine)
        logger.info("Starting Genetic Universe API version=%s environment=%s", active_settings.app_version, active_settings.environment)
        yield
        logger.info("Stopping Genetic Universe API")

    application = FastAPI(
        title=active_settings.app_name,
        version=active_settings.app_version,
        description=(
            "Explainable inheritance simulation with deterministic synthetic phenotype models. "
            "Results are computational evidence and are not clinical predictions."
        ),
        lifespan=lifespan,
    )
    application.add_middleware(
        CORSMiddleware,
        allow_origins=active_settings.cors_origins,
        allow_credentials=False,
        allow_methods=["GET", "POST"],
        allow_headers=["Accept", "Content-Type", "X-Request-ID"],
    )

    database_engine = None
    if active_settings.repository_backend == "sqlalchemy":
        database_engine = create_database_engine(active_settings.database_url)
        repository = SqlAlchemyRunRepository(database_engine, max_events_per_run=active_settings.max_events_per_run)
    else:
        repository = InMemoryRunRepository(max_events_per_run=active_settings.max_events_per_run)
    application.state.settings = active_settings
    application.state.allow_validation = allow_validation
    application.state.logger = logger
    application.state.repository = repository
    application.state.database_engine = database_engine
    application.state.event_bus = EventBus(repository)
    application.state.run_service = RunService(
        repository,
        application.state.event_bus,
        real_data_root=active_settings.data_root,
    )

    @application.middleware("http")
    async def request_id_middleware(request, call_next):
        from uuid import uuid4

        request_id = request.headers.get("x-request-id", f"req_{uuid4().hex[:16]}")
        request.state.request_id = request_id
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        return response

    register_error_handlers(application)
    application.include_router(build_router())
    return application


app = create_app()
