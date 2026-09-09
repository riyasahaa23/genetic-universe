"""In-memory application state for one auditable experiment run."""

from __future__ import annotations

from dataclasses import dataclass, field

from app.schemas.common import RunMode, RunStage, RunStatus
from app.schemas.counterfactual import CounterfactualResult
from app.schemas.events import RunEvent
from app.schemas.run import CreateRunRequest, RunSnapshot, RunStatusResponse
from app.schemas.trace import TraceResponse


@dataclass
class RunRecord:
    run_id: str
    request: CreateRunRequest
    status: RunStatus = RunStatus.CREATED
    stage: RunStage = RunStage.SETUP
    progress: float = 0.0
    snapshot: RunSnapshot | None = None
    trace: TraceResponse | None = None
    counterfactuals: dict[str, CounterfactualResult] = field(default_factory=dict)
    events: list[RunEvent] = field(default_factory=list)
    engine_state: object | None = None
    error_code: str | None = None
    error_message: str | None = None

    @property
    def mode(self) -> RunMode:
        return self.request.mode

    def status_response(self) -> RunStatusResponse:
        return RunStatusResponse(
            run_id=self.run_id,
            status=self.status,
            mode=self.mode,
            stage=self.stage,
            progress=self.progress,
            seed=self.request.seed,
            dataset_id=self.request.dataset_id,
            model_version=(
                "real-trio-synthetic-phenotype@1.0.0"
                if self.request.mode == RunMode.REAL_TRIO_SYNTHETIC_PHENOTYPE
                else f"{self.request.phenotype_model_id}@1.0.0"
            ),
            error_code=self.error_code,
        )
