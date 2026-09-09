"""Protocols separating application orchestration from scientific engines."""

from __future__ import annotations

from collections.abc import Sequence
from typing import Protocol


class MeiosisEngine(Protocol):
    def simulate(self, haplotype_a: Sequence[int], haplotype_b: Sequence[int], seed: int): ...


class PhenotypeEvaluator(Protocol):
    def evaluate(self, haplotype_a: Sequence[int], haplotype_b: Sequence[int]): ...


class RealDataAdapter(Protocol):
    def load(self, dataset_id: str, region: str): ...
