"""Stable identifier helpers used by the run and event contracts."""

from __future__ import annotations

import hashlib
import re
import uuid

_SAFE_ID = re.compile(r"^[a-z][a-z0-9_.:-]{2,127}$")


def new_run_id() -> str:
    return f"run_{uuid.uuid4().hex[:16]}"


def new_event_id(run_id: str, sequence: int) -> str:
    digest = hashlib.sha256(f"{run_id}:{sequence}".encode("utf-8")).hexdigest()[:16]
    return f"evt_{digest}"


def intervention_id(run_id: str, candidate_id: str, intervention: str) -> str:
    digest = hashlib.sha256(f"{run_id}:{candidate_id}:{intervention}".encode("utf-8")).hexdigest()[:24]
    return f"int_{digest}"


def validate_public_id(value: str) -> str:
    if not _SAFE_ID.fullmatch(value):
        raise ValueError("ID contains unsupported characters")
    return value
