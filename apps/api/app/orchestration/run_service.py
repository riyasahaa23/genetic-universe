"""Canonical application service for synthetic and future real-data runs."""

from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path

from app.domain.identifiers import intervention_id, new_run_id, validate_public_id
from app.domain.run import RunRecord
from app.repositories.interfaces import RunRepository
from app.schemas.common import InterventionKind, RunStage, RunStatus
from app.schemas.counterfactual import CounterfactualList, CounterfactualRequest, CounterfactualResult
from app.schemas.events import TimelineResponse
from app.schemas.meiotic_null import MeioticNullAnalysisResponse
from app.schemas.minimal_rescue import MinimalRescueResponse
from app.schemas.run import CreateRunRequest, RunCreateResponse, RunSnapshot
from app.schemas.trace import TraceResponse
from app.scientific.real_data.adapter import RealDataConfigurationError
from app.scientific.real_data.ingestion import RealDataUnavailableError
from app.scientific.synthetic.attribution import Candidate as RawCandidate
from app.scientific.synthetic.meiotic_null import run_meiotic_null_distribution
from app.scientific.synthetic.minimal_rescue import search_minimal_novelty_rescue
from app.scientific.synthetic.runner import SyntheticExecution, build_snapshot, counterfactual_response, trace_response

from .event_bus import EventBus
from .pipeline import ScientificPipeline


class ServiceError(Exception):
    def __init__(self, code: str, message: str, status_code: int = 400, *, retryable: bool = False, details: dict[str, object] | None = None):
        super().__init__(message)
        self.code = code
        self.message = message
        self.status_code = status_code
        self.retryable = retryable
        self.details = details or {}


@dataclass
class RunService:
    repository: RunRepository
    event_bus: EventBus
    real_data_root: Path | None = None
    pipeline: ScientificPipeline | None = field(default=None, repr=False)
    max_null_simulations: int = 5000
    max_rescue_combination_count: int = 5000

    def __post_init__(self) -> None:
        if self.pipeline is None:
            self.pipeline = ScientificPipeline(self.real_data_root)

    def create(self, request: CreateRunRequest) -> RunCreateResponse:
        run_id = new_run_id()
        self.create_record(request, run_id)
        return RunCreateResponse(run_id=run_id, status=RunStatus.CREATED, events_url=f"/v1/runs/{run_id}/events", snapshot_url=f"/v1/runs/{run_id}/snapshot")

    def create_record(self, request: CreateRunRequest, run_id: str) -> RunRecord:
        """Create a run record with a caller-provided validated identifier.

        The versioned API normally uses :meth:`create`, while the legacy
        compatibility surface needs to preserve its ``exp_`` identifiers.
        Both paths use the same repository and event contract; this method is
        deliberately kept below the transport layer so compatibility routes do
        not create a second persistence implementation.
        """
        try:
            validate_public_id(run_id)
        except ValueError as exc:
            raise ServiceError("INVALID_RUN_ID", "The run identifier is invalid.", 422) from exc
        record = RunRecord(run_id=run_id, request=request)
        self.repository.create(record)
        self.event_bus.publish(record, "run_created", RunStage.SETUP, {"mode": request.mode.value, "dataset_id": request.dataset_id, "seed": request.seed})
        return record

    def get(self, run_id: str) -> RunRecord:
        try:
            validate_public_id(run_id)
        except ValueError as exc:
            raise ServiceError("INVALID_RUN_ID", "The run identifier is invalid.", 422) from exc
        record = self.repository.get(run_id)
        if record is None:
            raise ServiceError("RUN_NOT_FOUND", "The requested run does not exist.", 404)
        return record

    def start(self, run_id: str) -> RunRecord:
        record = self.get(run_id)
        if record.status == RunStatus.COMPLETED:
            return record
        if record.status == RunStatus.RUNNING:
            raise ServiceError("RUN_ALREADY_RUNNING", "The run is already executing.", 409, retryable=True)
        record.status = RunStatus.RUNNING
        self.repository.save(record)
        try:
            self.event_bus.publish(record, "stage_started", RunStage.PARENT_LOADING, {})
            assert self.pipeline is not None
            execution = self.pipeline.execute(record.request)
            record.engine_state = execution
            self.event_bus.publish(record, "parent_loaded", RunStage.PARENT_LOADING, {"locus_count": len(execution.loci), "parents": ["parent_a", "parent_b"]})
            self.event_bus.publish(record, "stage_started", RunStage.MEIOSIS, {})
            for gamete in (execution.gamete_a, execution.gamete_b):
                for crossover in gamete.crossovers:
                    self.event_bus.publish(record, "crossover_detected", RunStage.MEIOSIS, {"parent": gamete.parent_id, "breakpoint": crossover})
                for segment in gamete.segments:
                    self.event_bus.publish(record, "gamete_segment_created", RunStage.MEIOSIS, {"parent": gamete.parent_id, "start": segment.start, "end": segment.end, "source_haplotype": segment.source_homolog})
            self.event_bus.publish(record, "stage_started", RunStage.FERTILIZATION, {})
            self.event_bus.publish(record, "fertilization_complete", RunStage.FERTILIZATION, {"offspring_id": execution.offspring.offspring_id})
            snapshot = build_snapshot(execution, run_id)
            record.snapshot = snapshot
            record.trace = trace_response(execution, run_id)
            phenotype = snapshot.phenotype
            self.event_bus.publish(record, "stage_started", RunStage.PHENOTYPE, {})
            self.event_bus.publish(record, "phenotype_computed", RunStage.PHENOTYPE, {"parent_a": phenotype.parent_a.value, "parent_b": phenotype.parent_b.value, "offspring": phenotype.offspring.value})
            self.event_bus.publish(record, "stage_started", RunStage.NOVELTY_DETECTION, {})
            self.event_bus.publish(record, "novelty_detected", RunStage.NOVELTY_DETECTION, phenotype.novelty.model_dump())
            self.event_bus.publish(record, "stage_started", RunStage.CANDIDATE_MINING, {})
            self.event_bus.publish(record, "candidate_set_ready", RunStage.CANDIDATE_MINING, {"count": len(snapshot.candidates)})
            for candidate in snapshot.candidates[:10]:
                self.event_bus.publish(record, "candidate_ranked", RunStage.CANDIDATE_MINING, {"candidate_id": candidate.candidate_id, "rank": candidate.rank, "delta": candidate.phenotype_delta})
            self.event_bus.publish(record, "stage_started", RunStage.EVIDENCE_GRAPH, {})
            self.event_bus.publish(record, "evidence_graph_ready", RunStage.EVIDENCE_GRAPH, {"nodes": len(snapshot.evidence_graph.nodes), "links": len(snapshot.evidence_graph.links)})
            record.status = RunStatus.COMPLETED
            record.stage = RunStage.COMPLETE
            record.progress = 1.0
            self.repository.save(record)
            self.event_bus.publish(record, "run_completed", RunStage.COMPLETE, {"snapshot_url": f"/v1/runs/{run_id}/snapshot"})
            return record
        except ServiceError as exc:
            if record.status == RunStatus.RUNNING:
                record.status = RunStatus.FAILED
                record.stage = RunStage.COMPLETE
                record.error_code = exc.code
                record.error_message = exc.message
                self.repository.save(record)
                self.event_bus.publish(record, "run_failed", RunStage.COMPLETE, {"code": exc.code})
            raise
        except RealDataUnavailableError as exc:
            record.status = RunStatus.FAILED
            record.stage = RunStage.COMPLETE
            record.error_code = "REAL_DATA_UNAVAILABLE"
            record.error_message = "Prepared real-data artifacts are unavailable."
            self.repository.save(record)
            self.event_bus.publish(record, "run_failed", RunStage.COMPLETE, {"code": record.error_code})
            raise ServiceError(record.error_code, record.error_message, 503, retryable=True) from exc
        except RealDataConfigurationError as exc:
            record.status = RunStatus.FAILED
            record.stage = RunStage.COMPLETE
            record.error_code = "INVALID_REAL_DATA_CONFIGURATION"
            record.error_message = "Scientific execution failed."
            self.repository.save(record)
            self.event_bus.publish(record, "run_failed", RunStage.COMPLETE, {"code": record.error_code})
            raise ServiceError(record.error_code, record.error_message, 422) from exc
        except Exception as exc:
            record.status = RunStatus.FAILED
            record.stage = RunStage.COMPLETE
            record.error_code = "RUN_EXECUTION_FAILED"
            record.error_message = "Scientific execution failed."
            self.repository.save(record)
            self.event_bus.publish(record, "run_failed", RunStage.COMPLETE, {"code": record.error_code})
            raise ServiceError(record.error_code, "The scientific run failed.", 500, retryable=False) from exc

    def snapshot(self, run_id: str) -> RunSnapshot:
        record = self.get(run_id)
        if record.snapshot is None:
            raise ServiceError("SNAPSHOT_NOT_READY", "The run has not completed.", 409, retryable=True)
        return record.snapshot

    def timeline(self, run_id: str, after_sequence: int = 0) -> TimelineResponse:
        self.get(run_id)
        events = self.event_bus.replay(run_id, after_sequence)
        next_sequence = events[-1].sequence + 1 if events else None
        return TimelineResponse(run_id=run_id, events=events, next_sequence=next_sequence)

    def trace(self, run_id: str) -> TraceResponse:
        record = self.get(run_id)
        if record.trace is not None:
            return record.trace
        execution = self._execution_for_completed_record(record)
        result = trace_response(execution, run_id)
        record.trace = result
        self.repository.save(record)
        return result

    def execution(self, run_id: str) -> SyntheticExecution:
        """Return the scientific execution for compatibility adapters.

        The public v1 API exposes typed snapshots instead of engine objects.
        A small compatibility layer still needs the legacy dataclass details
        (for example phenotype breakdowns), so it obtains them through this
        single audited rehydration path rather than importing a second engine.
        """

        return self._execution_for_completed_record(self.get(run_id))

    def _execution_for_completed_record(self, record: RunRecord) -> SyntheticExecution:
        """Rehydrate deterministic scientific state for durable completed runs."""

        if isinstance(record.engine_state, SyntheticExecution):
            return record.engine_state
        if record.status != RunStatus.COMPLETED or record.snapshot is None:
            raise ServiceError("TRACE_NOT_READY", "The scientific engine has not produced a completed run.", 409, retryable=True)
        try:
            assert self.pipeline is not None
            execution = self.pipeline.execute(record.request)
        except RealDataUnavailableError as exc:
            raise ServiceError("REAL_DATA_UNAVAILABLE", "Prepared real-data artifacts are unavailable.", 503, retryable=True) from exc
        except RealDataConfigurationError as exc:
            raise ServiceError("INVALID_REAL_DATA_CONFIGURATION", "The prepared real-data configuration is invalid.", 422) from exc
        except Exception as exc:
            raise ServiceError("ENGINE_REHYDRATION_FAILED", "The scientific run cannot be rehydrated safely.", 503, retryable=True) from exc
        record.engine_state = execution
        return execution

    def counterfactual(self, run_id: str, request: CounterfactualRequest) -> CounterfactualResult:
        record = self.get(run_id)
        requested_intervention_id = intervention_id(run_id, request.candidate_id, request.intervention.value)
        existing = record.counterfactuals.get(requested_intervention_id)
        if existing is not None:
            return existing
        execution = self._execution_for_completed_record(record)
        expected_kind = {
            InterventionKind.BREAK_INTERACTION: "INTERACTION",
            InterventionKind.SWAP_SEGMENT: "SEGMENT",
            InterventionKind.REVERT_VARIANT: "VARIANT",
        }[request.intervention]
        # Only candidates exposed in the bounded public trace may be
        # intervened on. This prevents a caller from guessing an internal
        # candidate ID and executing an unreviewed/unbounded intervention.
        public_candidate_ids = {candidate.candidate_id for candidate in execution.ranked_results}
        if request.candidate_id not in public_candidate_ids:
            raise ServiceError("CANDIDATE_NOT_FOUND", "The requested candidate does not exist.", 404)
        candidates = execution.tracer.generate_candidates()
        raw_candidate: RawCandidate | None = next((candidate for candidate in candidates if candidate.id == request.candidate_id), None)
        if raw_candidate is None:
            raise ServiceError("CANDIDATE_NOT_FOUND", "The requested candidate does not exist.", 404)
        if raw_candidate.candidate_type != expected_kind:
            raise ServiceError("INTERVENTION_KIND_MISMATCH", "The intervention does not match the candidate kind.", 422, details={"candidate_kind": raw_candidate.candidate_type})
        self.event_bus.publish(
            record,
            "counterfactual_started",
            RunStage.COUNTERFACTUAL,
            {"candidate_id": request.candidate_id, "intervention": request.intervention.value},
        )
        raw_result = execution.tracer.run_counterfactual(raw_candidate)
        result = counterfactual_response(execution, run_id, raw_result)
        result.intervention_id = requested_intervention_id
        result = self.persist_counterfactual(run_id, result)
        self.event_bus.publish(record, "counterfactual_completed", RunStage.COUNTERFACTUAL, {"candidate_id": result.candidate_id, "delta": result.delta, "novelty_resolved": result.novelty_resolved})
        return result

    def persist_counterfactual(self, run_id: str, result: CounterfactualResult) -> CounterfactualResult:
        """Persist a computed result and mirror it into the run snapshot.

        The canonical endpoint computes its result here, while compatibility
        adapters may need to preserve a legacy intervention string or output
        shape. Both callers still use the same repository transaction and
        durable snapshot update.
        """

        record = self.get(run_id)
        if result.run_id != run_id:
            raise ServiceError("INVALID_COUNTERFACTUAL", "The counterfactual does not belong to this run.", 422)
        existing = record.counterfactuals.get(result.intervention_id)
        if existing is not None:
            return existing
        self.repository.save_counterfactual(run_id, result)
        # Keep the process-local record in sync with durable repositories too.
        # The memory repository mutates it as an implementation detail, but
        # SQLAlchemy intentionally persists through its own method. Updating
        # the aggregate here makes the snapshot identical after either
        # backend and ensures the newly computed intervention is included in
        # the persisted snapshot JSON.
        record.counterfactuals[result.intervention_id] = result
        if record.snapshot is not None:
            record.snapshot = record.snapshot.model_copy(
                update={"counterfactuals": list(record.counterfactuals.values())}
            )
            self.repository.save(record)
        return result

    def counterfactual_list(self, run_id: str) -> CounterfactualList:
        self.get(run_id)
        return CounterfactualList(run_id=run_id, results=self.repository.counterfactuals(run_id))

    def meiotic_null(
        self,
        run_id: str,
        *,
        seed: int | None = None,
        simulation_count: int = 1000,
        histogram_bin_count: int = 20,
    ) -> MeioticNullAnalysisResponse:
        """Run a bounded same-parent alternative-meiosis analysis.

        The analysis is deliberately derived from the completed run state and
        is deterministic for the selected seed. It is not folded into the
        primary snapshot because it is a potentially large, optional
        post-run calculation; the event timeline still records its execution
        and summary metadata.
        """

        record = self.get(run_id)
        if simulation_count > self.max_null_simulations:
            raise ServiceError(
                "ANALYSIS_LIMIT_EXCEEDED",
                f"simulation_count cannot exceed {self.max_null_simulations}.",
                422,
            )
        if seed is not None and seed < 0:
            raise ServiceError("INVALID_ANALYSIS_REQUEST", "seed must be non-negative.", 422)
        execution = self._execution_for_completed_record(record)
        analysis_seed = record.request.seed if seed is None else seed
        self.event_bus.publish(
            record,
            "meiotic_null_started",
            RunStage.NOVELTY_DETECTION,
            {"simulation_count": simulation_count, "seed": analysis_seed},
        )
        try:
            result = run_meiotic_null_distribution(
                parent_a=execution.parent_a,
                parent_b=execution.parent_b,
                observed_offspring=execution.offspring,
                phenotype_engine=execution.phenotype_engine,
                seed=analysis_seed,
                simulation_count=simulation_count,
                histogram_bin_count=histogram_bin_count,
            )
        except ValueError as exc:
            raise ServiceError("INVALID_MEIOTIC_NULL_REQUEST", str(exc), 422) from exc
        response = MeioticNullAnalysisResponse(run_id=run_id, **result.to_dict())
        self.event_bus.publish(
            record,
            "meiotic_null_completed",
            RunStage.NOVELTY_DETECTION,
            {
                "simulation_count": response.simulation_count,
                "observed_percentile": response.observed_percentile,
                "transgression_direction": response.transgression_direction,
            },
        )
        return response

    def minimal_rescue(
        self,
        run_id: str,
        *,
        top_k: int = 8,
        max_set_size: int = 3,
        max_returned_sets: int = 10,
        max_combination_count: int = 500,
    ) -> MinimalRescueResponse:
        """Search bounded joint interventions for the smallest rescue set."""

        record = self.get(run_id)
        if max_combination_count > self.max_rescue_combination_count:
            raise ServiceError(
                "ANALYSIS_LIMIT_EXCEEDED",
                f"max_combination_count cannot exceed {self.max_rescue_combination_count}.",
                422,
            )
        execution = self._execution_for_completed_record(record)
        self.event_bus.publish(
            record,
            "minimal_rescue_started",
            RunStage.COUNTERFACTUAL,
            {
                "top_k": top_k,
                "max_set_size": max_set_size,
                "max_combination_count": max_combination_count,
            },
        )
        try:
            result = search_minimal_novelty_rescue(
                tracer=execution.tracer,
                ranked_results=execution.ranked_results,
                top_k=top_k,
                max_set_size=max_set_size,
                max_returned_sets=max_returned_sets,
                max_combination_count=max_combination_count,
            )
        except ValueError as exc:
            raise ServiceError("INVALID_MINIMAL_RESCUE_REQUEST", str(exc), 422) from exc
        response = MinimalRescueResponse(run_id=run_id, **result.to_dict())
        self.event_bus.publish(
            record,
            "minimal_rescue_completed",
            RunStage.COUNTERFACTUAL,
            {
                "search_status": response.search_status,
                "evaluated_combination_count": response.evaluated_combination_count,
                "minimal_cardinality": response.minimal_cardinality,
            },
        )
        return response
