"""FastAPI dependency adapters."""

from typing import cast

from fastapi import Request

from app.orchestration.run_service import RunService
from app.scientific.real_data.pipeline import FamilyStore


def get_run_service(request: Request) -> RunService:
    return cast(RunService, request.app.state.run_service)


def get_family_store(request: Request) -> FamilyStore:
    """Build the real-data store from the application-owned data root."""

    store = getattr(request.app.state, "family_store", None)
    if store is None:
        store = FamilyStore(
            request.app.state.settings.data_root,
            allow_validation=bool(getattr(request.app.state, "allow_validation", False)),
        )
        request.app.state.family_store = store
    return cast(FamilyStore, store)
