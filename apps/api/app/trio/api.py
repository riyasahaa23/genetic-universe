"""Real trio endpoints with explicit schemas and bounded region queries."""
from fastapi import APIRouter, HTTPException, Query

from .attribution import counterfactual, evidence_graph, novelty_trace, scientific_audit
from .phenotype_engine import categorize_phenotypes
from .interaction import build_interaction_response
from .novelty_engine import assess_novelty
from .benchmark_suite import (execute_benchmark, get_benchmark_summary, execute_baseline_comparison,
                              execute_multiseed_benchmark, get_benchmark_levels)
from .models import (ChildState, CounterfactualRequest, CounterfactualResult, EvidenceGraph,
                     Family, Model, Provenance, RecombinationEvent, Region, Segment,
                     TraceRequest, TraceResult, Warning, Marker, UnresolvedRegion, ScientificAudit,
                     InteractionResponse, PhenotypeCategorization, NoveltyAssessment,
                     BenchmarkParams, BenchmarkResult, BaselineComparisonResult,
                     BenchmarkDifficultyLevel, MultiSeedBenchmarkResult)
from .pipeline import FamilyStore
from .genome_catalog import GenomePage, load_catalog, paginate, summarize


class FamiliesResponse(Model):
    families: list[Family]


class SegmentsResponse(Model):
    family_id: str
    segments: list[Segment]
    markers: list[Marker]
    unresolved_regions: list[UnresolvedRegion]
    warnings: list[Warning]
    provenance: Provenance


class RecombinationResponse(Model):
    family_id: str
    recombination_events: list[RecombinationEvent]
    unresolved_regions: list[UnresolvedRegion]
    evidence_status: str
    warnings: list[Warning]
    provenance: Provenance


def create_router(store: FamilyStore) -> APIRouter:
    router = APIRouter(prefix="/api", tags=["real trio"])

    def checked(function, *args):
        try:
            return function(*args)
        except KeyError as exc:
            raise HTTPException(404, detail={"code": "NOT_FOUND", "message": str(exc)}) from exc
        except NotImplementedError as exc:
            raise HTTPException(422, detail={"code": "UNSUPPORTED_INTERVENTION", "message": str(exc)}) from exc
        except (ValueError, OSError) as exc:
            raise HTTPException(422, detail={"code": "INVALID_INPUT", "message": str(exc)}) from exc

    def state_query(family_id: str, chromosome=None, start=None, end=None):
        supplied = [value is not None for value in (chromosome, start, end)]
        if any(supplied) and not all(supplied):
            raise HTTPException(422, detail="Supply chromosome, start, and end together")
        region = checked(Region.model_validate, {"chromosome": chromosome, "start": start, "end": end}) if all(supplied) else None
        return checked(store.state, family_id, region)

    @router.get("/families", response_model=FamiliesResponse)
    def families():
        return FamiliesResponse(families=checked(store.families))

    @router.get("/families/{family_id}", response_model=Family)
    def family(family_id: str):
        return checked(store.family, family_id)

    @router.get("/families/{family_id}/genome", response_model=ChildState)
    @router.get("/families/{family_id}/child-state", response_model=ChildState)
    def child_state(family_id: str, chromosome: str | None = None,
                    start: int | None = Query(None, ge=1), end: int | None = Query(None, ge=1)):
        return state_query(family_id, chromosome, start, end)

    @router.get("/families/{family_id}/segments", response_model=SegmentsResponse)
    def segments(family_id: str, chromosome: str | None = None,
                 start: int | None = Query(None, ge=1), end: int | None = Query(None, ge=1)):
        state = state_query(family_id, chromosome, start, end)
        return SegmentsResponse(family_id=family_id, segments=state.segments, markers=state.markers,
                                unresolved_regions=state.unresolved_regions, warnings=state.warnings, provenance=state.provenance)

    @router.get("/families/{family_id}/recombination/summary")
    def recombination_summary(family_id: str):
        return summarize(checked(load_catalog, store, family_id))

    @router.get("/families/{family_id}/recombination", response_model=GenomePage | RecombinationResponse)
    def recombination(family_id: str, chromosome: str | None = None,
                      start: int | None = Query(None, ge=1), end: int | None = Query(None, ge=1),
                      parent: str | None = None, offset: int = Query(0, ge=0), limit: int = Query(100, ge=1, le=1000)):
        if checked(store.family, family_id).recombination_catalog is not None:
            return checked(paginate, checked(load_catalog, store, family_id), chromosome, parent, offset, limit, start, end)
        if parent is not None:
            raise HTTPException(422, detail="Parent filtering requires the complete genome scan")
        state = state_query(family_id, chromosome, start, end)
        return RecombinationResponse(family_id=family_id, recombination_events=state.recombination_events,
                                     unresolved_regions=state.unresolved_regions,
                                     evidence_status="inferred" if state.recombination_events else "unresolved",
                                     warnings=state.warnings, provenance=state.provenance)

    @router.get("/families/{family_id}/scientific-audit", response_model=ScientificAudit)
    @router.get("/scientific-audit/{family_id}", response_model=ScientificAudit)
    def audit(family_id: str, chromosome: str | None = None,
              start: int | None = Query(None, ge=1), end: int | None = Query(None, ge=1)):
        return scientific_audit(state_query(family_id, chromosome, start, end))

    @router.post("/novelty-trace", response_model=TraceResult)
    def trace(request: TraceRequest):
        return novelty_trace(checked(store.state, request.family_id, request.region), request.limit)

    @router.post("/counterfactual", response_model=CounterfactualResult)
    def intervene(request: CounterfactualRequest):
        return checked(counterfactual, checked(store.state, request.family_id, request.region), request)

    @router.get("/evidence/{family_id}", response_model=EvidenceGraph)
    @router.get("/families/{family_id}/evidence", response_model=EvidenceGraph)
    def evidence(family_id: str, chromosome: str | None = None,
                 start: int | None = Query(None, ge=1), end: int | None = Query(None, ge=1)):
        return evidence_graph(state_query(family_id, chromosome, start, end))

    @router.get("/families/{family_id}/phenotype", response_model=PhenotypeCategorization)
    def phenotype(family_id: str, chromosome: str | None = None,
                  start: int | None = Query(None, ge=1), end: int | None = Query(None, ge=1)):
        state = state_query(family_id, chromosome, start, end)
        return checked(categorize_phenotypes, state)

    @router.get("/families/{family_id}/interactions", response_model=InteractionResponse)
    def interactions(family_id: str, chromosome: str | None = None,
                     start: int | None = Query(None, ge=1), end: int | None = Query(None, ge=1),
                     max_distance_bp: int = Query(500_000, ge=1000), max_candidates: int = Query(50, ge=1, le=500)):
        state = state_query(family_id, chromosome, start, end)
        return checked(build_interaction_response, state, max_distance_bp, max_candidates)

    @router.get("/families/{family_id}/novelty", response_model=NoveltyAssessment)
    def novelty(family_id: str, chromosome: str | None = None,
                start: int | None = Query(None, ge=1), end: int | None = Query(None, ge=1)):
        state = state_query(family_id, chromosome, start, end)
        return checked(assess_novelty, state)

    @router.get("/benchmark/final-evidence")
    def final_scientific_evidence():
        import json
        from pathlib import Path
        path = Path(__file__).resolve().parents[3] / "data/validation/final_scientific_evidence.json"
        if not path.exists():
            raise HTTPException(status_code=404, detail="Run scripts/final_scientific_evaluation.py first")
        data = json.loads(path.read_text(encoding="utf-8"))
        # UI receives bounded summaries; complete per-world evidence remains the saved artifact.
        def summary(value):
            return {k: v for k, v in value.items() if k not in ("per_world", "individual_worlds")}
        return {"source_revision": data["source_revision"], "fixed_target": summary(data["fixed_target"]),
                "variable_target": summary(data["variable_target"]),
                "OOD": {"per_family": {name: summary(value) for name, value in data["OOD"]["per_family"].items()}},
                "baselines": data["baselines"], "ablations": data["ablations"],
                "negative_controls": data["negative_controls"],
                "stage_a": {k:v for k,v in data["stage_a"].items() if k not in ("category_breakdown", "candidate_counts")}}

    @router.post("/benchmark/counterfactual")
    def benchmark_counterfactual(payload: dict):
        from app.validation.scientific.benchmark import run_benchmark
        from app.validation.services.counterfactual_service import counterfactual_service
        params = BenchmarkParams(**payload.get("parameters", {}))
        bench = run_benchmark(level=params.level, seed=params.seed, locus_count=params.locus_count,
                              effect_size=params.effect_size, noise=params.noise, top_k=params.top_k)
        try:
            result = counterfactual_service.run_intervention(bench["raw_tracer"], payload["candidate_id"], payload["intervention"])
        except KeyError as exc:
            raise HTTPException(status_code=404, detail=str(exc))
        except ValueError as exc:
            raise HTTPException(status_code=422, detail=str(exc))
        return result.to_dict()

    @router.get("/benchmark/summary")
    def benchmark_summary():
        return checked(get_benchmark_summary)

    @router.get("/benchmark", response_model=BenchmarkResult)
    def benchmark_get(locus_count: int = Query(50, ge=10, le=500),
                      causal_interactions: int = Query(2, ge=1, le=10),
                      seed: int = Query(42),
                      top_k: int = Query(3, ge=1, le=20),
                      level: int = Query(4, ge=1, le=8)):
        params = BenchmarkParams(locus_count=locus_count, causal_interactions=causal_interactions,
                                 seed=seed, top_k=top_k, level=level)
        return checked(execute_benchmark, params)

    @router.post("/benchmark/run", response_model=BenchmarkResult)
    def benchmark_run(params: BenchmarkParams):
        return checked(execute_benchmark, params)

    @router.get("/benchmark/baselines", response_model=BaselineComparisonResult)
    def benchmark_baselines(locus_count: int = Query(50, ge=10, le=200),
                            causal_interactions: int = Query(2, ge=1, le=10),
                            seed: int = Query(42), top_k: int = Query(3, ge=1, le=10),
                            level: int | None = Query(None, ge=1, le=8)):
        return checked(execute_baseline_comparison, locus_count, causal_interactions, seed, top_k, level)

    @router.post("/benchmark/multi-seed", response_model=MultiSeedBenchmarkResult)
    def benchmark_multiseed(params: BenchmarkParams):
        return checked(execute_multiseed_benchmark, [42, 43, 100, 999, 1337], params.locus_count,
                       params.causal_interactions, params.top_k, params.level)

    @router.get("/benchmark/levels", response_model=list[BenchmarkDifficultyLevel])
    def benchmark_levels():
        return checked(get_benchmark_levels)

    return router
