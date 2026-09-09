"""Thread-safe in-memory repository for the hackathon and tests."""

from __future__ import annotations

from threading import RLock

from app.domain.run import RunRecord
from app.schemas.counterfactual import CounterfactualResult
from app.schemas.events import RunEvent


class InMemoryRunRepository:
    def __init__(self, max_events_per_run: int = 2000):
        self._records: dict[str, RunRecord] = {}
        self._counterfactuals: dict[str, dict[str, CounterfactualResult]] = {}
        self._max_events_per_run = max_events_per_run
        self._lock = RLock()

    def create(self, record: RunRecord) -> RunRecord:
        with self._lock:
            if record.run_id in self._records:
                raise ValueError("Run already exists")
            self._records[record.run_id] = record
            self._counterfactuals[record.run_id] = {}
            return record

    def get(self, run_id: str) -> RunRecord | None:
        with self._lock:
            return self._records.get(run_id)

    def save(self, record: RunRecord) -> RunRecord:
        with self._lock:
            if record.run_id not in self._records:
                raise KeyError("Run not found")
            self._records[record.run_id] = record
            return record

    def append_event(self, run_id: str, event: RunEvent) -> None:
        with self._lock:
            record = self._records.get(run_id)
            if record is None:
                raise KeyError("Run not found")
            if record.events and event.sequence != record.events[-1].sequence + 1:
                raise ValueError("Event sequence must increase by one")
            if len(record.events) >= self._max_events_per_run:
                raise ValueError("Run event limit exceeded")
            record.events.append(event)

    def events(self, run_id: str, after_sequence: int = 0) -> list[RunEvent]:
        with self._lock:
            record = self._records.get(run_id)
            if record is None:
                raise KeyError("Run not found")
            return [event for event in record.events if event.sequence > after_sequence]

    def save_counterfactual(self, run_id: str, result: CounterfactualResult) -> None:
        with self._lock:
            if run_id not in self._records:
                raise KeyError("Run not found")
            self._counterfactuals.setdefault(run_id, {})[result.intervention_id] = result
            self._records[run_id].counterfactuals[result.intervention_id] = result

    def counterfactuals(self, run_id: str) -> list[CounterfactualResult]:
        with self._lock:
            if run_id not in self._records:
                raise KeyError("Run not found")
            return list(self._counterfactuals.get(run_id, {}).values())

    def clear(self) -> None:
        with self._lock:
            self._records.clear()
            self._counterfactuals.clear()
