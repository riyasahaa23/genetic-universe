"""Persistence contracts used by the run service."""

from __future__ import annotations

from typing import Protocol

from app.domain.run import RunRecord
from app.schemas.counterfactual import CounterfactualResult
from app.schemas.events import RunEvent


class RunRepository(Protocol):
    def create(self, record: RunRecord) -> RunRecord: ...

    def get(self, run_id: str) -> RunRecord | None: ...

    def save(self, record: RunRecord) -> RunRecord: ...

    def append_event(self, run_id: str, event: RunEvent) -> None: ...

    def events(self, run_id: str, after_sequence: int = 0) -> list[RunEvent]: ...

    def save_counterfactual(self, run_id: str, result: CounterfactualResult) -> None: ...

    def counterfactuals(self, run_id: str) -> list[CounterfactualResult]: ...
