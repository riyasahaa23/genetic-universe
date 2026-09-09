"""Ordered event publication with replay through the repository."""

from __future__ import annotations

from datetime import datetime, timezone

from app.domain.identifiers import new_event_id
from app.domain.run import RunRecord
from app.repositories.interfaces import RunRepository
from app.schemas.common import RunStage, RunStatus
from app.schemas.events import RunEvent


class EventBus:
    def __init__(self, repository: RunRepository):
        self.repository = repository

    def publish(self, record: RunRecord, event_type: str, stage: RunStage, payload: dict[str, object] | None = None) -> RunEvent:
        progress_by_stage = {
            RunStage.SETUP: 0.0,
            RunStage.PARENT_LOADING: 0.1,
            RunStage.MEIOSIS: 0.3,
            RunStage.FERTILIZATION: 0.5,
            RunStage.PHENOTYPE: 0.65,
            RunStage.NOVELTY_DETECTION: 0.75,
            RunStage.CANDIDATE_MINING: 0.82,
            RunStage.COUNTERFACTUAL: 0.9,
            RunStage.EVIDENCE_GRAPH: 0.95,
            RunStage.COMPLETE: 1.0,
        }
        # A completed run can still receive post-run evidence events (for
        # example, a counterfactual requested after the snapshot is ready).
        # Those events retain their scientific stage in the event envelope but
        # must not regress the run's terminal status/stage in memory or SQL.
        if record.status not in {RunStatus.COMPLETED, RunStatus.FAILED, RunStatus.CANCELLED} or stage == RunStage.COMPLETE:
            record.stage = stage
            record.progress = max(record.progress, progress_by_stage[stage])
        sequence = len(record.events) + 1
        event = RunEvent(
            event_id=new_event_id(record.run_id, sequence),
            run_id=record.run_id,
            sequence=sequence,
            type=event_type,
            stage=stage,
            emitted_at=datetime.now(timezone.utc),
            payload=payload or {},
        )
        self.repository.append_event(record.run_id, event)
        # The memory repository mutates the in-memory record while durable
        # repositories persist independently. Keep the current process view in
        # sync without duplicating the event in memory mode.
        if not record.events or record.events[-1].sequence < event.sequence:
            record.events.append(event)
        return event

    def replay(self, run_id: str, after_sequence: int = 0) -> list[RunEvent]:
        return self.repository.events(run_id, after_sequence)
