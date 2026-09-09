"""Replayable live event contract."""

from __future__ import annotations

from datetime import datetime

from pydantic import Field

from .common import ContractModel, RunStage


class RunEvent(ContractModel):
    schema_version: str = "1.0"
    event_id: str
    run_id: str
    sequence: int = Field(ge=1)
    type: str
    stage: RunStage
    emitted_at: datetime
    payload: dict[str, object] = Field(default_factory=dict)


class TimelineResponse(ContractModel):
    run_id: str
    events: list[RunEvent]
    next_sequence: int | None = Field(default=None, ge=1)
