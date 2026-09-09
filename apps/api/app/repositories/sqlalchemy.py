"""Durable SQLAlchemy repository for run metadata and JSON artifacts."""

from __future__ import annotations

from threading import RLock

from sqlalchemy import text
from sqlalchemy.engine import Engine

from app.domain.run import RunRecord
from app.schemas.common import RunStage, RunStatus
from app.schemas.counterfactual import CounterfactualResult
from app.schemas.events import RunEvent
from app.schemas.run import CreateRunRequest, RunSnapshot
from app.schemas.trace import TraceResponse


class SqlAlchemyRunRepository:
    """Repository implementation shared by SQLite development and PostgreSQL.

    Large VCF/BCF/tree artifacts are intentionally not stored in these rows;
    only bounded JSON snapshots and auditable event metadata are persisted.
    """

    def __init__(self, engine: Engine, max_events_per_run: int = 2000):
        self.engine = engine
        self.max_events_per_run = max_events_per_run
        self._lock = RLock()

    @staticmethod
    def _record_values(record: RunRecord) -> dict[str, object]:
        return {
            "run_id": record.run_id,
            "request_json": record.request.model_dump_json(),
            "status": record.status.value,
            "stage": record.stage.value,
            "progress": record.progress,
            "snapshot_json": record.snapshot.model_dump_json() if record.snapshot else None,
            "trace_json": record.trace.model_dump_json() if record.trace else None,
            "error_code": record.error_code,
            "error_message": record.error_message,
        }

    def create(self, record: RunRecord) -> RunRecord:
        with self._lock, self.engine.begin() as connection:
            connection.execute(
                text(
                    "INSERT INTO genetic_runs "
                    "(run_id, request_json, status, stage, progress, snapshot_json, trace_json, error_code, error_message) "
                    "VALUES (:run_id, :request_json, :status, :stage, :progress, :snapshot_json, :trace_json, :error_code, :error_message)"
                ),
                self._record_values(record),
            )
        return record

    def _load_record(self, run_id: str) -> RunRecord | None:
        with self.engine.connect() as connection:
            row = connection.execute(
                text("SELECT * FROM genetic_runs WHERE run_id = :run_id"), {"run_id": run_id}
            ).mappings().first()
            if row is None:
                return None
            event_rows = connection.execute(
                text("SELECT event_json FROM genetic_events WHERE run_id = :run_id ORDER BY sequence"),
                {"run_id": run_id},
            ).scalars().all()
            counterfactual_rows = connection.execute(
                text("SELECT result_json FROM genetic_counterfactuals WHERE run_id = :run_id ORDER BY intervention_id"),
                {"run_id": run_id},
            ).scalars().all()

        record = RunRecord(
            run_id=str(row["run_id"]),
            request=CreateRunRequest.model_validate_json(row["request_json"]),
        )
        record.status = RunStatus(row["status"])
        record.stage = RunStage(row["stage"])
        record.progress = float(row["progress"])
        record.snapshot = RunSnapshot.model_validate_json(row["snapshot_json"]) if row["snapshot_json"] else None
        record.trace = TraceResponse.model_validate_json(row["trace_json"]) if row["trace_json"] else None
        record.error_code = row["error_code"]
        record.error_message = row["error_message"]
        record.events = [RunEvent.model_validate_json(value) for value in event_rows]
        values = [CounterfactualResult.model_validate_json(value) for value in counterfactual_rows]
        record.counterfactuals = {value.intervention_id: value for value in values}
        # Scientific engine objects are process-local. A restarted service can
        # still serve the durable snapshot/timeline, but cannot silently rerun
        # trace or interventions without a stored scientific artifact.
        record.engine_state = None
        return record

    def get(self, run_id: str) -> RunRecord | None:
        with self._lock:
            return self._load_record(run_id)

    def save(self, record: RunRecord) -> RunRecord:
        with self._lock, self.engine.begin() as connection:
            connection.execute(
                text(
                    "UPDATE genetic_runs SET request_json=:request_json, status=:status, stage=:stage, "
                    "progress=:progress, snapshot_json=:snapshot_json, trace_json=:trace_json, "
                    "error_code=:error_code, error_message=:error_message WHERE run_id=:run_id"
                ),
                self._record_values(record),
            )
        return record

    def append_event(self, run_id: str, event: RunEvent) -> None:
        with self._lock, self.engine.begin() as connection:
            if connection.execute(
                text("SELECT 1 FROM genetic_runs WHERE run_id=:run_id"), {"run_id": run_id}
            ).first() is None:
                raise KeyError("Run not found")
            count = connection.execute(
                text("SELECT COUNT(*) FROM genetic_events WHERE run_id=:run_id"), {"run_id": run_id}
            ).scalar_one()
            if count >= self.max_events_per_run:
                raise ValueError("Run event limit exceeded")
            previous = connection.execute(
                text("SELECT MAX(sequence) FROM genetic_events WHERE run_id=:run_id"), {"run_id": run_id}
            ).scalar_one()
            if previous is not None and event.sequence != int(previous) + 1:
                raise ValueError("Event sequence must increase by one")
            connection.execute(
                text("INSERT INTO genetic_events (run_id, sequence, event_json) VALUES (:run_id, :sequence, :event_json)"),
                {"run_id": run_id, "sequence": event.sequence, "event_json": event.model_dump_json()},
            )

    def events(self, run_id: str, after_sequence: int = 0) -> list[RunEvent]:
        with self._lock, self.engine.connect() as connection:
            values = connection.execute(
                text("SELECT event_json FROM genetic_events WHERE run_id=:run_id AND sequence>:after ORDER BY sequence"),
                {"run_id": run_id, "after": after_sequence},
            ).scalars().all()
        return [RunEvent.model_validate_json(value) for value in values]

    def save_counterfactual(self, run_id: str, result: CounterfactualResult) -> None:
        with self._lock, self.engine.begin() as connection:
            exists = connection.execute(
                text("SELECT 1 FROM genetic_runs WHERE run_id=:run_id"), {"run_id": run_id}
            ).first()
            if exists is None:
                raise KeyError("Run not found")
            connection.execute(
                text(
                    "INSERT INTO genetic_counterfactuals (intervention_id, run_id, result_json) "
                    "VALUES (:intervention_id, :run_id, :result_json) "
                    "ON CONFLICT(intervention_id) DO UPDATE SET result_json=:result_json"
                ),
                {
                    "intervention_id": result.intervention_id,
                    "run_id": run_id,
                    "result_json": result.model_dump_json(),
                },
            )

    def counterfactuals(self, run_id: str) -> list[CounterfactualResult]:
        with self._lock, self.engine.connect() as connection:
            values = connection.execute(
                text("SELECT result_json FROM genetic_counterfactuals WHERE run_id=:run_id ORDER BY intervention_id"),
                {"run_id": run_id},
            ).scalars().all()
        return [CounterfactualResult.model_validate_json(value) for value in values]
