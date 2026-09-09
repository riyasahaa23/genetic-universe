"""Compatibility implementation for the extracted experiment API.

The original backend exposed one endpoint per scientific stage. The canonical
service now executes the same stages as one auditable run, so this adapter
keeps the old URLs useful while translating every response from canonical
engine state. No legacy database, singleton manager or legacy scientific
module is used here.
"""

from __future__ import annotations

from dataclasses import replace
from typing import Any
from uuid import uuid4

from fastapi import APIRouter, Depends

from app.api.dependencies import get_run_service
from app.domain.identifiers import intervention_id
from app.domain.run import RunRecord
from app.orchestration.run_service import RunService, ServiceError
from app.schemas.common import InterventionKind, RunMode, RunStage
from app.schemas.run import CreateRunRequest, RunOptions
from app.scientific.synthetic.attribution import CounterfactualResult as RawCounterfactualResult
from app.scientific.synthetic.runner import SyntheticExecution, counterfactual_response

from .experiment_schemas import (
    CounterfactualInterventionRequest,
    CounterfactualInterventionResponse,
    CreateExperimentRequest,
    EvidenceGraphResponse,
    ExperimentDemoResponse,
    ExperimentResponse,
    Gamete,
    HomologPair,
    LocusProvenance,
    MeiosisSimulationResponse,
    NoveltyDetectionResponse,
    NoveltyTraceResponse,
    OffspringResponse,
    ParentGenomesResponse,
    PhenotypeBreakdown,
    PhenotypeCalculationResponse,
    SegmentProvenance,
)

router = APIRouter(prefix="/api/experiments", tags=["legacy-experiments"])


class LegacyExperimentService:
    """Translate old stage-oriented experiment calls to canonical runs."""

    def __init__(self, run_service: RunService):
        self.run_service = run_service

    def create(self, request: CreateExperimentRequest) -> ExperimentResponse:
        experiment_id = f"exp_{uuid4().hex[:16]}"
        canonical_request = CreateRunRequest(
            mode=RunMode.SYNTHETIC,
            dataset_id="fixture_epistasis_ab_cd_v1",
            seed=request.seed,
            options=RunOptions(
                locus_count=request.locus_count,
                max_candidates=150,
                candidate_interactions=2,
            ),
        )
        record = self.run_service.create_record(canonical_request, experiment_id)
        return self._experiment_response(record)

    def get(self, experiment_id: str) -> ExperimentResponse:
        return self._experiment_response(self.run_service.get(experiment_id))

    def completed(self, experiment_id: str) -> RunRecord:
        record = self.run_service.get(experiment_id)
        if record.status.value != "completed":
            record = self.run_service.start(experiment_id)
        return record

    def execution(self, experiment_id: str) -> SyntheticExecution:
        self.completed(experiment_id)
        return self.run_service.execution(experiment_id)

    @staticmethod
    def _experiment_response(record: RunRecord) -> ExperimentResponse:
        return ExperimentResponse(
            experiment_id=record.run_id,
            seed=record.request.seed,
            locus_count=record.request.options.locus_count,
            status=record.status.value.upper(),
        )

    @staticmethod
    def _breakdown(execution: SyntheticExecution, subject: str) -> PhenotypeBreakdown:
        engine = execution.phenotype_engine
        if subject == "parent_a":
            breakdown = engine.evaluate_diploid(execution.parent_a.homolog_1, execution.parent_a.homolog_2)
        elif subject == "parent_b":
            breakdown = engine.evaluate_diploid(execution.parent_b.homolog_1, execution.parent_b.homolog_2)
        else:
            breakdown = engine.evaluate_diploid(execution.gamete_a.alleles, execution.gamete_b.alleles)
        return PhenotypeBreakdown(
            total=float(breakdown.total),
            base_value=float(breakdown.base_value),
            additive_component=float(breakdown.additive_component),
            dominance_component=float(breakdown.dominance_component),
            epistatic_component=float(breakdown.epistatic_component),
            additive_details=dict(breakdown.additive_details),
            dominance_details=dict(breakdown.dominance_details),
            epistatic_details=dict(breakdown.epistatic_details),
            formula_expression=breakdown.formula_expression,
        )

    @staticmethod
    def _gamete(gamete: Any) -> Gamete:
        return Gamete(
            parent_id=gamete.parent_id,
            alleles=list(gamete.alleles),
            crossovers=list(gamete.crossovers),
            segments=[SegmentProvenance(**segment.to_dict()) for segment in gamete.segments],
        )

    @staticmethod
    def _offspring(execution: SyntheticExecution) -> OffspringResponse:
        offspring = execution.offspring
        return OffspringResponse(
            experiment_id="",
            offspring_id=offspring.offspring_id,
            maternal_or_parent_a=list(offspring.maternal_gamete.alleles),
            paternal_or_parent_b=list(offspring.paternal_gamete.alleles),
            dosage=offspring.get_dosage(),
            provenance=[LocusProvenance(**item.to_dict()) for item in offspring.loci_provenance],
        )

    @staticmethod
    def _novelty(execution: SyntheticExecution) -> dict[str, Any]:
        return dict(execution.tracer.baseline_novelty.to_dict())

    @staticmethod
    def _raw_response(experiment_id: str, raw: RawCounterfactualResult) -> CounterfactualInterventionResponse:
        payload = raw.to_dict()
        return CounterfactualInterventionResponse(
            label=str(payload.get("label", "MODEL-RELATIVE COMPUTATIONAL COUNTERFACTUAL")),
            counterfactual_type=str(payload.get("counterfactual_type", raw.intervention)),
            target=dict(payload.get("target", {})),
            original_state=dict(payload.get("original_state", {})),
            altered_state=dict(payload.get("altered_state", {})),
            model_used=dict(payload.get("model_used", {})),
            phenotype_change=float(payload.get("phenotype_change", raw.counterfactual_phenotype - raw.original_phenotype)),
            interpretation=str(payload.get("interpretation", "")),
            stability_interpretation=str(payload.get("stability_interpretation", "")),
            experiment_id=experiment_id,
            candidate_id=raw.candidate_id,
            candidate_name=raw.candidate_name,
            candidate_type=raw.candidate_type,
            intervention=raw.intervention,
            original_phenotype=float(raw.original_phenotype),
            counterfactual_phenotype=float(raw.counterfactual_phenotype),
            delta=float(raw.delta),
            absolute_effect=float(raw.absolute_effect),
            novelty_removed=bool(raw.novelty_removed),
            new_novelty_margin=float(raw.new_novelty_margin),
            stability=float(raw.stability),
            provenance_score=float(raw.provenance_score),
            attribution_score=float(raw.attribution_score),
            score_components={key: float(value) for key, value in raw.score_components.items()},
            provenance_summary=raw.provenance_summary,
        )

    def trace(self, experiment_id: str) -> NoveltyTraceResponse:
        execution = self.execution(experiment_id)
        ranked = execution.ranked_results
        candidates = [self._raw_response(experiment_id, result) for result in ranked]
        return NoveltyTraceResponse(
            experiment_id=experiment_id,
            total_candidates=len(candidates),
            primary_candidate=candidates[0] if candidates else None,
            ranked_candidates=candidates,
        )

    def counterfactual(
        self,
        experiment_id: str,
        request: CounterfactualInterventionRequest,
    ) -> CounterfactualInterventionResponse:
        execution = self.execution(experiment_id)
        candidates = execution.tracer.generate_candidates()
        candidate = next((item for item in candidates if item.id == request.candidate_id), None)
        if candidate is None:
            raise ServiceError("CANDIDATE_NOT_FOUND", "The requested candidate does not exist.", 404)

        requested = request.intervention
        normalized = requested.upper()
        supported = {
            "INTERACTION": {"BREAK_INTERACTION", "break_interaction"},
            "SEGMENT": {
                "SWAP_SEGMENT", "swap_segment", "REMOVE_SEGMENT", "remove_segment",
                "REPLACE_SEGMENT", "replace_segment", "REVERT_RECOMBINATION_CONFIGURATION",
            },
            "VARIANT": {
                "REVERT_VARIANT", "revert_variant", "REMOVE_VARIANT", "remove_variant",
                "REPLACE_WITH_PARENTAL_GENOTYPE",
            },
        }
        if requested not in supported[candidate.candidate_type] and normalized not in supported[candidate.candidate_type]:
            raise ServiceError("INTERVENTION_KIND_MISMATCH", "The intervention does not match the candidate kind.", 422)

        if candidate.candidate_type == "VARIANT" and normalized == "REPLACE_WITH_PARENTAL_GENOTYPE":
            details = dict(candidate.details)
            index = int(str(details["locus_id"]).replace("L", "")) - 1
            details["altered_dosage"] = execution.parent_a.homolog_1[index] + execution.parent_a.homolog_2[index]
            details["counterfactual_policy"] = "replace_with_parent_a_genotype"
            candidate = replace(candidate, details=details)
        elif candidate.candidate_type == "SEGMENT":
            details = dict(candidate.details)
            if normalized in {"REMOVE_SEGMENT", "REPLACE_SEGMENT"}:
                details["operation"] = normalized
            candidate = replace(candidate, details=details)

        self.run_service.event_bus.publish(
            self.run_service.get(experiment_id),
            "counterfactual_started",
            RunStage.COUNTERFACTUAL,
            {"candidate_id": request.candidate_id, "intervention": requested},
        )
        raw = execution.tracer.run_counterfactual(candidate)
        result = self._raw_response(experiment_id, raw)
        result.intervention = requested
        result.counterfactual_type = requested
        canonical_intervention = {
            "break_interaction": InterventionKind.BREAK_INTERACTION,
            "BREAK_INTERACTION": InterventionKind.BREAK_INTERACTION,
            "swap_segment": InterventionKind.SWAP_SEGMENT,
            "SWAP_SEGMENT": InterventionKind.SWAP_SEGMENT,
            "remove_segment": InterventionKind.SWAP_SEGMENT,
            "REMOVE_SEGMENT": InterventionKind.SWAP_SEGMENT,
            "replace_segment": InterventionKind.SWAP_SEGMENT,
            "REPLACE_SEGMENT": InterventionKind.SWAP_SEGMENT,
            "revert_recombination_configuration": InterventionKind.SWAP_SEGMENT,
            "REVERT_RECOMBINATION_CONFIGURATION": InterventionKind.SWAP_SEGMENT,
            "revert_variant": InterventionKind.REVERT_VARIANT,
            "REVERT_VARIANT": InterventionKind.REVERT_VARIANT,
            "remove_variant": InterventionKind.REVERT_VARIANT,
            "REMOVE_VARIANT": InterventionKind.REVERT_VARIANT,
            "replace_with_parental_genotype": InterventionKind.REVERT_VARIANT,
            "REPLACE_WITH_PARENTAL_GENOTYPE": InterventionKind.REVERT_VARIANT,
        }[requested]
        canonical_result = counterfactual_response(execution, experiment_id, raw)
        canonical_result.intervention = canonical_intervention
        canonical_result.intervention_id = intervention_id(
            experiment_id,
            request.candidate_id,
            canonical_intervention.value,
        )
        self.run_service.persist_counterfactual(experiment_id, canonical_result)
        self.run_service.event_bus.publish(
            self.run_service.get(experiment_id),
            "counterfactual_completed",
            RunStage.COUNTERFACTUAL,
            {
                "candidate_id": result.candidate_id,
                "delta": result.delta,
                "novelty_resolved": result.novelty_removed,
            },
        )
        return result

    def evidence_graph(self, experiment_id: str) -> EvidenceGraphResponse:
        execution = self.execution(experiment_id)
        graph = execution.tracer.build_evidence_graph(execution.ranked_results)
        return EvidenceGraphResponse(
            experiment_id=experiment_id,
            directed=bool(graph.get("directed", True)),
            nodes=list(graph.get("nodes", [])),
            links=list(graph.get("links", [])),
            top_candidate=graph.get("top_candidate"),
        )

    def demo(self) -> ExperimentDemoResponse:
        created = self.create(CreateExperimentRequest(seed=42, locus_count=50))
        execution = self.execution(created.experiment_id)
        phenotype_values = {
            key: self._breakdown(execution, key).model_dump()
            for key in ("parent_a", "parent_b", "offspring")
        }
        return ExperimentDemoResponse(
            experiment_id=created.experiment_id,
            seed=created.seed,
            locus_count=created.locus_count,
            parent_a=execution.parent_a.to_dict(),
            parent_b=execution.parent_b.to_dict(),
            gamete_a=execution.gamete_a.to_dict(),
            gamete_b=execution.gamete_b.to_dict(),
            offspring=execution.offspring.to_dict(),
            phenotypes=phenotype_values,
            novelty=self._novelty(execution),
            trace=self.trace(created.experiment_id),
            evidence_graph=self.evidence_graph(created.experiment_id),
        )


def get_legacy_service(run_service: RunService = Depends(get_run_service)) -> LegacyExperimentService:
    return LegacyExperimentService(run_service)


@router.post("", response_model=ExperimentResponse)
def create_experiment(
    request: CreateExperimentRequest,
    service: LegacyExperimentService = Depends(get_legacy_service),
) -> ExperimentResponse:
    return service.create(request)


@router.post("/demo/run", response_model=ExperimentDemoResponse)
def run_demo(service: LegacyExperimentService = Depends(get_legacy_service)) -> ExperimentDemoResponse:
    return service.demo()


@router.get("/{experiment_id}", response_model=ExperimentResponse)
def get_experiment(
    experiment_id: str,
    service: LegacyExperimentService = Depends(get_legacy_service),
) -> ExperimentResponse:
    return service.get(experiment_id)


@router.post("/{experiment_id}/genomes", response_model=ParentGenomesResponse)
def generate_parent_genomes(
    experiment_id: str,
    service: LegacyExperimentService = Depends(get_legacy_service),
) -> ParentGenomesResponse:
    execution = service.execution(experiment_id)
    return ParentGenomesResponse(
        experiment_id=experiment_id,
        parent_a=HomologPair(**execution.parent_a.to_dict()),
        parent_b=HomologPair(**execution.parent_b.to_dict()),
    )


@router.post("/{experiment_id}/meiosis", response_model=MeiosisSimulationResponse)
def run_meiosis(
    experiment_id: str,
    service: LegacyExperimentService = Depends(get_legacy_service),
) -> MeiosisSimulationResponse:
    execution = service.execution(experiment_id)
    return MeiosisSimulationResponse(
        experiment_id=experiment_id,
        gamete_a=service._gamete(execution.gamete_a),
        gamete_b=service._gamete(execution.gamete_b),
    )


@router.post("/{experiment_id}/offspring", response_model=OffspringResponse)
def generate_offspring(
    experiment_id: str,
    service: LegacyExperimentService = Depends(get_legacy_service),
) -> OffspringResponse:
    response = service._offspring(service.execution(experiment_id))
    return response.model_copy(update={"experiment_id": experiment_id})


@router.post("/{experiment_id}/phenotype", response_model=PhenotypeCalculationResponse)
def calculate_phenotype(
    experiment_id: str,
    service: LegacyExperimentService = Depends(get_legacy_service),
) -> PhenotypeCalculationResponse:
    execution = service.execution(experiment_id)
    return PhenotypeCalculationResponse(
        experiment_id=experiment_id,
        parent_a=service._breakdown(execution, "parent_a"),
        parent_b=service._breakdown(execution, "parent_b"),
        offspring=service._breakdown(execution, "offspring"),
    )


@router.post("/{experiment_id}/novelty", response_model=NoveltyDetectionResponse)
def detect_novelty(
    experiment_id: str,
    service: LegacyExperimentService = Depends(get_legacy_service),
) -> NoveltyDetectionResponse:
    return NoveltyDetectionResponse(experiment_id=experiment_id, **service._novelty(service.execution(experiment_id)))


@router.post("/{experiment_id}/trace", response_model=NoveltyTraceResponse)
def run_trace(
    experiment_id: str,
    service: LegacyExperimentService = Depends(get_legacy_service),
) -> NoveltyTraceResponse:
    return service.trace(experiment_id)


@router.post("/{experiment_id}/counterfactual", response_model=CounterfactualInterventionResponse)
def run_counterfactual(
    experiment_id: str,
    request: CounterfactualInterventionRequest,
    service: LegacyExperimentService = Depends(get_legacy_service),
) -> CounterfactualInterventionResponse:
    return service.counterfactual(experiment_id, request)


@router.get("/{experiment_id}/evidence-graph", response_model=EvidenceGraphResponse)
def get_evidence_graph(
    experiment_id: str,
    service: LegacyExperimentService = Depends(get_legacy_service),
) -> EvidenceGraphResponse:
    return service.evidence_graph(experiment_id)
