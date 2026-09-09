"""Scientific execution boundary used by the run application service."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from app.schemas.common import RunMode
from app.schemas.run import CreateRunRequest
from app.scientific.real_data.adapter import execute_real
from app.scientific.real_data.ingestion import RealDataUnavailableError
from app.scientific.synthetic.runner import SyntheticExecution, execute_synthetic


@dataclass(frozen=True, slots=True)
class ScientificPipeline:
    """Select a scientific adapter without exposing transport concerns to it."""

    real_data_root: Path | None = None

    def execute(self, request: CreateRunRequest) -> SyntheticExecution:
        if request.mode == RunMode.SYNTHETIC:
            return execute_synthetic(request)
        if self.real_data_root is None:
            raise RealDataUnavailableError("Prepared real-data inputs are not configured")
        return execute_real(request, self.real_data_root)
