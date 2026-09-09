"""Compatibility routes for the extracted real-trio API.

The old backend exposed family analysis below ``/api``. These adapters keep
that public surface available while delegating all work to the canonical
``FamilyStore`` and evidence-tiered scientific modules. The adapter does not
mount the old router or import the old singleton/database implementation.
"""

from __future__ import annotations

from typing import Any, Callable, TypeVar, cast

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, ConfigDict

from app.api.dependencies import get_family_store
from app.orchestration.run_service import ServiceError
from app.scientific.real_data.attribution import (
    counterfactual,
    evidence_graph,
    novelty_trace,
    scientific_audit,
)
from app.scientific.real_data.genome_catalog import GenomePage, load_catalog, paginate, summarize
from app.scientific.real_data.interaction import build_interaction_response
from app.scientific.real_data.models import (
    ChildState,
    CounterfactualRequest,
    CounterfactualResult,
    EvidenceGraph,
    Family,
    InteractionResponse,
    Marker,
    NoveltyAssessment,
    PhenotypeCategorization,
    Provenance,
    RecombinationEvent,
    Region,
    ScientificAudit,
    Segment,
    TraceRequest,
    TraceResult,
    UnresolvedRegion,
    Warning,
)
from app.scientific.real_data.novelty_engine import assess_novelty
from app.scientific.real_data.phenotype_engine import categorize_phenotypes
from app.scientific.real_data.pipeline import FamilyStore


class FamiliesResponse(BaseModel):
    """The response envelope used by the extracted ``GET /api/families`` route."""

    model_config = ConfigDict(extra="forbid")

    families: list[Family]


class SegmentsResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    family_id: str
    segments: list[Segment]
    markers: list[Marker]
    unresolved_regions: list[UnresolvedRegion]
    warnings: list[Warning]
    provenance: Provenance


class RecombinationResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    family_id: str
    recombination_events: list[RecombinationEvent]
    unresolved_regions: list[UnresolvedRegion]
    evidence_status: str
    warnings: list[Warning]
    provenance: Provenance


router = APIRouter(prefix="/api", tags=["legacy-real-trio"])
T = TypeVar("T")


def _checked(function: Callable[..., T], *args: Any) -> T:
    """Translate scientific/domain exceptions to the canonical error handler."""

    try:
        return function(*args)
    except KeyError as exc:
        raise ServiceError("NOT_FOUND", "The requested family or artifact was not found.", 404) from exc
    except NotImplementedError as exc:
        raise ServiceError(
            "UNSUPPORTED_INTERVENTION",
            "The requested intervention is unsupported for this data.",
            422,
        ) from exc
    except (ValueError, OSError) as exc:
        # Do not expose local paths, parser internals, or raw fixture details
        # through a compatibility endpoint. The cause remains available to
        # server-side logging/error middleware via exception chaining.
        raise ServiceError(
            "INVALID_INPUT",
            "The requested real-data analysis could not be completed.",
            422,
        ) from exc


def _state_query(
    store: FamilyStore,
    family_id: str,
    chromosome: str | None,
    start: int | None,
    end: int | None,
) -> ChildState:
    supplied = [value is not None for value in (chromosome, start, end)]
    if any(supplied) and not all(supplied):
        raise ServiceError("INVALID_REGION", "Supply chromosome, start, and end together.", 422)

    region: Region | None = None
    if all(supplied):
        assert chromosome is not None and start is not None and end is not None
        try:
            region = Region(chromosome=chromosome, start=start, end=end)
        except ValueError as exc:
            raise ServiceError("INVALID_REGION", str(exc), 422) from exc
    return _checked(store.state, family_id, region)


@router.get("/families", response_model=FamiliesResponse)
def families(store: FamilyStore = Depends(get_family_store)) -> FamiliesResponse:
    return FamiliesResponse(families=_checked(store.families))


@router.get("/families/{family_id}", response_model=Family)
def family(family_id: str, store: FamilyStore = Depends(get_family_store)) -> Family:
    return _checked(store.family, family_id)


@router.get("/families/{family_id}/genome", response_model=ChildState)
@router.get("/families/{family_id}/child-state", response_model=ChildState)
def child_state(
    family_id: str,
    chromosome: str | None = None,
    start: int | None = Query(default=None, ge=1),
    end: int | None = Query(default=None, ge=1),
    store: FamilyStore = Depends(get_family_store),
) -> ChildState:
    return _state_query(store, family_id, chromosome, start, end)


@router.get("/families/{family_id}/segments", response_model=SegmentsResponse)
def segments(
    family_id: str,
    chromosome: str | None = None,
    start: int | None = Query(default=None, ge=1),
    end: int | None = Query(default=None, ge=1),
    store: FamilyStore = Depends(get_family_store),
) -> SegmentsResponse:
    state = _state_query(store, family_id, chromosome, start, end)
    return SegmentsResponse(
        family_id=family_id,
        segments=state.segments,
        markers=state.markers,
        unresolved_regions=state.unresolved_regions,
        warnings=state.warnings,
        provenance=state.provenance,
    )


@router.get("/families/{family_id}/recombination/summary")
def recombination_summary(family_id: str, store: FamilyStore = Depends(get_family_store)) -> dict[str, Any]:
    catalog = _checked(load_catalog, store, family_id)
    return _checked(summarize, catalog)


@router.get("/families/{family_id}/recombination", response_model=GenomePage | RecombinationResponse)
def recombination(
    family_id: str,
    chromosome: str | None = None,
    start: int | None = Query(default=None, ge=1),
    end: int | None = Query(default=None, ge=1),
    parent: str | None = None,
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=1000),
    store: FamilyStore = Depends(get_family_store),
) -> GenomePage | RecombinationResponse:
    configured_family = _checked(store.family, family_id)
    if configured_family.recombination_catalog is not None:
        catalog = _checked(load_catalog, store, family_id)
        return cast(GenomePage, _checked(paginate, catalog, chromosome, parent, offset, limit, start, end))

    if parent is not None:
        raise ServiceError("INVALID_INPUT", "Parent filtering requires the complete genome scan.", 422)
    state = _state_query(store, family_id, chromosome, start, end)
    return RecombinationResponse(
        family_id=family_id,
        recombination_events=state.recombination_events,
        unresolved_regions=state.unresolved_regions,
        evidence_status="inferred" if state.recombination_events else "unresolved",
        warnings=state.warnings,
        provenance=state.provenance,
    )


@router.get("/families/{family_id}/scientific-audit", response_model=ScientificAudit)
@router.get("/scientific-audit/{family_id}", response_model=ScientificAudit)
def audit(
    family_id: str,
    chromosome: str | None = None,
    start: int | None = Query(default=None, ge=1),
    end: int | None = Query(default=None, ge=1),
    store: FamilyStore = Depends(get_family_store),
) -> ScientificAudit:
    return _checked(scientific_audit, _state_query(store, family_id, chromosome, start, end))


@router.post("/novelty-trace", response_model=TraceResult)
def trace(request: TraceRequest, store: FamilyStore = Depends(get_family_store)) -> TraceResult:
    state = _checked(store.state, request.family_id, request.region)
    return _checked(novelty_trace, state, request.limit)


@router.post("/counterfactual", response_model=CounterfactualResult)
def intervene(request: CounterfactualRequest, store: FamilyStore = Depends(get_family_store)) -> CounterfactualResult:
    state = _checked(store.state, request.family_id, request.region)
    return _checked(counterfactual, state, request)


@router.get("/evidence/{family_id}", response_model=EvidenceGraph)
@router.get("/families/{family_id}/evidence", response_model=EvidenceGraph)
def evidence(
    family_id: str,
    chromosome: str | None = None,
    start: int | None = Query(default=None, ge=1),
    end: int | None = Query(default=None, ge=1),
    store: FamilyStore = Depends(get_family_store),
) -> EvidenceGraph:
    return _checked(evidence_graph, _state_query(store, family_id, chromosome, start, end))


@router.get("/families/{family_id}/phenotype", response_model=PhenotypeCategorization)
def phenotype(
    family_id: str,
    chromosome: str | None = None,
    start: int | None = Query(default=None, ge=1),
    end: int | None = Query(default=None, ge=1),
    store: FamilyStore = Depends(get_family_store),
) -> PhenotypeCategorization:
    return _checked(categorize_phenotypes, _state_query(store, family_id, chromosome, start, end))


@router.get("/families/{family_id}/interactions", response_model=InteractionResponse)
def interactions(
    family_id: str,
    chromosome: str | None = None,
    start: int | None = Query(default=None, ge=1),
    end: int | None = Query(default=None, ge=1),
    max_distance_bp: int = Query(default=500_000, ge=1000),
    max_candidates: int = Query(default=50, ge=1, le=500),
    store: FamilyStore = Depends(get_family_store),
) -> InteractionResponse:
    state = _state_query(store, family_id, chromosome, start, end)
    return _checked(build_interaction_response, state, max_distance_bp, max_candidates)


@router.get("/families/{family_id}/novelty", response_model=NoveltyAssessment)
def novelty(
    family_id: str,
    chromosome: str | None = None,
    start: int | None = Query(default=None, ge=1),
    end: int | None = Query(default=None, ge=1),
    store: FamilyStore = Depends(get_family_store),
) -> NoveltyAssessment:
    return _checked(assess_novelty, _state_query(store, family_id, chromosome, start, end))
