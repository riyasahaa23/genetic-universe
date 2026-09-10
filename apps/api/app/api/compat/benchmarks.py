"""Legacy and versioned HTTP adapters for scientific benchmark services."""

from __future__ import annotations

from dataclasses import replace
from typing import Any, Callable, TypeVar

from fastapi import APIRouter, Query, Request
from pydantic import BaseModel, ConfigDict, Field

from app.orchestration.run_service import ServiceError
from app.schemas.research_benchmark import ResearchBenchmarkResponse
from app.scientific.evaluation.benchmark_suite import (
    execute_baseline_comparison,
    execute_benchmark,
    execute_multiseed_benchmark,
    get_benchmark_levels,
    get_benchmark_summary,
    get_final_scientific_evidence,
)
from app.scientific.evaluation.research_benchmark import run_research_benchmark
from app.scientific.real_data.models import (
    BaselineComparisonResult,
    BenchmarkDifficultyLevel,
    BenchmarkParams,
    BenchmarkResult,
    MultiSeedBenchmarkResult,
)
from app.scientific.synthetic.attribution import Candidate
from app.scientific.synthetic.benchmark import (
    run_benchmark,
    run_scalability_benchmark,
)


class BenchmarkCounterfactualRequest(BaseModel):
    """Request accepted by the old and new benchmark counterfactual routes."""

    model_config = ConfigDict(extra="forbid")

    parameters: BenchmarkParams = Field(default_factory=BenchmarkParams)
    candidate_id: str = Field(min_length=1)
    intervention: str = Field(default="break_interaction", min_length=1)


legacy_router = APIRouter(prefix="/api", tags=["legacy-benchmarks"])
v1_router = APIRouter(prefix="/v1/benchmarks", tags=["benchmarks"])
T = TypeVar("T")


def _checked(function: Callable[..., T], *args: Any, **kwargs: Any) -> T:
    try:
        return function(*args, **kwargs)
    except (KeyError, IndexError) as exc:
        raise ServiceError("BENCHMARK_NOT_FOUND", "The requested benchmark candidate does not exist.", 404) from exc
    except (ValueError, TypeError) as exc:
        raise ServiceError("INVALID_BENCHMARK", "The benchmark request is invalid.", 422) from exc


def _raw_counterfactual(payload: BenchmarkCounterfactualRequest) -> dict[str, Any]:
    params = payload.parameters
    raw = _checked(
        run_benchmark,
        level=params.level,
        locus_count=params.locus_count,
        causal_interactions=params.causal_interactions,
        recombination_rate=params.recombination_rate,
        effect_size=params.effect_size,
        noise=params.noise,
        seed=params.seed,
        top_k=params.top_k,
    )
    tracer = raw["raw_tracer"]
    candidates = tracer.generate_candidates()
    candidate: Candidate | None = next((item for item in candidates if item.id == payload.candidate_id), None)
    if candidate is None:
        raise ServiceError("CANDIDATE_NOT_FOUND", "The requested benchmark candidate does not exist.", 404)

    requested = payload.intervention
    normalized = requested.upper()
    supported = {
        "INTERACTION": {"BREAK_INTERACTION", "break_interaction"},
        "SEGMENT": {
            "SWAP_SEGMENT",
            "swap_segment",
            "REMOVE_SEGMENT",
            "remove_segment",
            "REPLACE_SEGMENT",
            "replace_segment",
            "REVERT_RECOMBINATION_CONFIGURATION",
        },
        "VARIANT": {
            "REVERT_VARIANT",
            "revert_variant",
            "REMOVE_VARIANT",
            "remove_variant",
            "REPLACE_WITH_PARENTAL_GENOTYPE",
        },
    }
    if requested not in supported[candidate.candidate_type] and normalized not in supported[candidate.candidate_type]:
        raise ServiceError("INTERVENTION_KIND_MISMATCH", "The intervention does not match the candidate kind.", 422)

    if candidate.candidate_type == "VARIANT" and normalized == "REPLACE_WITH_PARENTAL_GENOTYPE":
        details = dict(candidate.details)
        index = int(str(details["locus_id"]).replace("L", "")) - 1
        details["altered_dosage"] = tracer.parent_a.homolog_1[index] + tracer.parent_a.homolog_2[index]
        details["counterfactual_policy"] = "replace_with_parent_a_genotype"
        candidate = replace(candidate, details=details)
    elif candidate.candidate_type == "SEGMENT" and normalized in {"REMOVE_SEGMENT", "REPLACE_SEGMENT"}:
        candidate = replace(candidate, details={**candidate.details, "operation": normalized})

    result = _checked(tracer.run_counterfactual, candidate)
    response = dict(result.to_dict())
    response["requested_intervention"] = requested
    response["benchmark_id"] = f"bench:{params.seed}:{params.locus_count}"
    return response


def _params_from_query(
    locus_count: int,
    causal_interactions: int,
    seed: int,
    top_k: int,
    level: int,
) -> BenchmarkParams:
    return BenchmarkParams(
        locus_count=locus_count,
        causal_interactions=causal_interactions,
        seed=seed,
        top_k=top_k,
        level=level,
    )


def _benchmark_get(
    locus_count: int,
    causal_interactions: int,
    seed: int,
    top_k: int,
    level: int,
) -> BenchmarkResult:
    return _checked(
        execute_benchmark,
        _params_from_query(locus_count, causal_interactions, seed, top_k, level),
    )


def _research_benchmark(
    request: Request,
    *,
    difficulty: str,
    n_seeds: int,
    seed_start: int,
    bootstrap_seed: int,
    bootstrap_replicates: int,
    top_k: int,
    null_simulations: int,
    include_per_seed: bool,
) -> ResearchBenchmarkResponse:
    """Run the offline-style benchmark through a bounded HTTP adapter."""

    settings = request.app.state.settings
    limits = {
        "n_seeds": settings.max_research_seeds,
        "bootstrap_replicates": settings.max_research_bootstrap_replicates,
        "null_simulations": settings.max_research_null_simulations,
    }
    for name, value in (
        ("n_seeds", n_seeds),
        ("bootstrap_replicates", bootstrap_replicates),
        ("null_simulations", null_simulations),
    ):
        if value > limits[name]:
            raise ServiceError(
                "ANALYSIS_LIMIT_EXCEEDED",
                f"{name} cannot exceed {limits[name]}.",
                422,
            )
    raw = _checked(
        run_research_benchmark,
        difficulty=difficulty,
        n_seeds=n_seeds,
        seed_start=seed_start,
        bootstrap_seed=bootstrap_seed,
        bootstrap_replicates=bootstrap_replicates,
        top_k=top_k,
        null_simulations=(null_simulations if null_simulations > 0 else None),
        include_per_seed=include_per_seed,
    )
    return ResearchBenchmarkResponse.model_validate(raw)


@legacy_router.get("/benchmark", response_model=BenchmarkResult)
def legacy_benchmark_get(
    locus_count: int = Query(default=50, ge=10, le=500),
    causal_interactions: int = Query(default=2, ge=0, le=10),
    seed: int = Query(default=42),
    top_k: int = Query(default=3, ge=1, le=20),
    level: int = Query(default=4, ge=1, le=8),
) -> BenchmarkResult:
    return _benchmark_get(locus_count, causal_interactions, seed, top_k, level)


@legacy_router.post("/benchmark/run", response_model=BenchmarkResult)
def legacy_benchmark_run(params: BenchmarkParams) -> BenchmarkResult:
    return _checked(execute_benchmark, params)


@legacy_router.get("/benchmark/baselines", response_model=BaselineComparisonResult)
def legacy_benchmark_baselines(
    locus_count: int = Query(default=50, ge=10, le=200),
    causal_interactions: int = Query(default=2, ge=0, le=10),
    seed: int = Query(default=42),
    top_k: int = Query(default=3, ge=1, le=10),
    level: int | None = Query(default=None, ge=1, le=8),
) -> BaselineComparisonResult:
    return _checked(execute_baseline_comparison, locus_count, causal_interactions, seed, top_k, level)


@legacy_router.post("/benchmark/multi-seed", response_model=MultiSeedBenchmarkResult)
def legacy_benchmark_multiseed(params: BenchmarkParams) -> MultiSeedBenchmarkResult:
    return _checked(
        execute_multiseed_benchmark,
        [42, 43, 100, 999, 1337],
        params.locus_count,
        params.causal_interactions,
        params.top_k,
        params.level,
    )


@legacy_router.get("/benchmark/levels", response_model=list[BenchmarkDifficultyLevel])
def legacy_benchmark_levels() -> list[BenchmarkDifficultyLevel]:
    return _checked(get_benchmark_levels)


@legacy_router.get("/benchmark/scalability")
def legacy_benchmark_scalability() -> dict[str, Any]:
    return _checked(run_scalability_benchmark)


@legacy_router.get("/benchmark/summary")
def legacy_benchmark_summary() -> dict[str, Any]:
    return _checked(get_benchmark_summary)


@legacy_router.get("/benchmark/final-evidence")
def legacy_final_scientific_evidence() -> dict[str, Any]:
    return _checked(get_final_scientific_evidence)


@legacy_router.get("/research-benchmark", response_model=ResearchBenchmarkResponse)
def legacy_research_benchmark(
    request: Request,
    difficulty: str = Query(default="easy", min_length=4, max_length=6),
    n_seeds: int = Query(default=3, ge=1),
    seed_start: int = Query(default=0, ge=0),
    bootstrap_seed: int = Query(default=20250910, ge=0),
    bootstrap_replicates: int = Query(default=100, ge=1),
    top_k: int = Query(default=3, ge=1, le=12),
    null_simulations: int = Query(default=10, ge=0),
    include_per_seed: bool = Query(default=False),
) -> ResearchBenchmarkResponse:
    return _research_benchmark(
        request,
        difficulty=difficulty,
        n_seeds=n_seeds,
        seed_start=seed_start,
        bootstrap_seed=bootstrap_seed,
        bootstrap_replicates=bootstrap_replicates,
        top_k=top_k,
        null_simulations=null_simulations,
        include_per_seed=include_per_seed,
    )


@legacy_router.post("/benchmark/counterfactual")
def legacy_benchmark_counterfactual(payload: BenchmarkCounterfactualRequest) -> dict[str, Any]:
    return _raw_counterfactual(payload)


@v1_router.get("", response_model=BenchmarkResult)
@v1_router.get("/", response_model=BenchmarkResult)
def benchmark_get(
    locus_count: int = Query(default=50, ge=10, le=500),
    causal_interactions: int = Query(default=2, ge=0, le=10),
    seed: int = Query(default=42),
    top_k: int = Query(default=3, ge=1, le=20),
    level: int = Query(default=4, ge=1, le=8),
) -> BenchmarkResult:
    return _benchmark_get(locus_count, causal_interactions, seed, top_k, level)


@v1_router.post("/run", response_model=BenchmarkResult)
def benchmark_run(params: BenchmarkParams) -> BenchmarkResult:
    return _checked(execute_benchmark, params)


@v1_router.get("/baselines", response_model=BaselineComparisonResult)
def benchmark_baselines(
    locus_count: int = Query(default=50, ge=10, le=200),
    causal_interactions: int = Query(default=2, ge=0, le=10),
    seed: int = Query(default=42),
    top_k: int = Query(default=3, ge=1, le=10),
    level: int | None = Query(default=None, ge=1, le=8),
) -> BaselineComparisonResult:
    return _checked(execute_baseline_comparison, locus_count, causal_interactions, seed, top_k, level)


@v1_router.post("/multi-seed", response_model=MultiSeedBenchmarkResult)
def benchmark_multiseed(params: BenchmarkParams) -> MultiSeedBenchmarkResult:
    return _checked(
        execute_multiseed_benchmark,
        [42, 43, 100, 999, 1337],
        params.locus_count,
        params.causal_interactions,
        params.top_k,
        params.level,
    )


@v1_router.get("/levels", response_model=list[BenchmarkDifficultyLevel])
def benchmark_levels() -> list[BenchmarkDifficultyLevel]:
    return _checked(get_benchmark_levels)


@v1_router.get("/scalability")
def benchmark_scalability() -> dict[str, Any]:
    return _checked(run_scalability_benchmark)


@v1_router.get("/summary")
def benchmark_summary() -> dict[str, Any]:
    return _checked(get_benchmark_summary)


@v1_router.get("/final-evidence")
def final_scientific_evidence() -> dict[str, Any]:
    return _checked(get_final_scientific_evidence)


@v1_router.get("/research", response_model=ResearchBenchmarkResponse)
def research_benchmark(
    request: Request,
    difficulty: str = Query(default="easy", min_length=4, max_length=6),
    n_seeds: int = Query(default=3, ge=1),
    seed_start: int = Query(default=0, ge=0),
    bootstrap_seed: int = Query(default=20250910, ge=0),
    bootstrap_replicates: int = Query(default=100, ge=1),
    top_k: int = Query(default=3, ge=1, le=12),
    null_simulations: int = Query(default=10, ge=0),
    include_per_seed: bool = Query(default=False),
) -> ResearchBenchmarkResponse:
    return _research_benchmark(
        request,
        difficulty=difficulty,
        n_seeds=n_seeds,
        seed_start=seed_start,
        bootstrap_seed=bootstrap_seed,
        bootstrap_replicates=bootstrap_replicates,
        top_k=top_k,
        null_simulations=null_simulations,
        include_per_seed=include_per_seed,
    )


@v1_router.post("/counterfactual")
def benchmark_counterfactual(payload: BenchmarkCounterfactualRequest) -> dict[str, Any]:
    return _raw_counterfactual(payload)


router = legacy_router


__all__ = ["legacy_router", "router", "v1_router"]
