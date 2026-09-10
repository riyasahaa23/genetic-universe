"""Compatibility import for the canonical research benchmark.

The implementation lives under ``app.scientific.evaluation`` with the other
evaluation services.  This module preserves the archive's import path for
offline scripts and existing research notebooks without creating a second
implementation.
"""

from __future__ import annotations

from app.scientific.evaluation import research_benchmark as _implementation
from app.scientific.evaluation.research_benchmark import *  # noqa: F401,F403


def __getattr__(name: str):
    """Forward private evaluator helpers used by legacy offline tests."""

    return getattr(_implementation, name)
