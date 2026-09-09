"""Genome invariants independent of the transport layer."""

from __future__ import annotations

from collections.abc import Iterable


def validate_haplotype_pair(haplotype_a: Iterable[int], haplotype_b: Iterable[int]) -> int:
    left = list(haplotype_a)
    right = list(haplotype_b)
    if not left or len(left) != len(right):
        raise ValueError("Homologous haplotypes must be non-empty and equal length")
    if any(allele not in (0, 1) for allele in [*left, *right]):
        raise ValueError("Synthetic alleles must be binary 0/1")
    return len(left)


def validate_segments(segments: list[tuple[int, int]]) -> None:
    previous_end = 0
    for start, end in segments:
        if start != previous_end or end <= start:
            raise ValueError("Segments must be contiguous, ordered and non-empty")
        previous_end = end


def validate_segment_coverage(segments: list[tuple[int, int]], locus_count: int) -> None:
    """Validate a complete half-open chromosome partition [0, locus_count)."""

    if locus_count <= 0:
        raise ValueError("locus_count must be positive")
    validate_segments(segments)
    if not segments or segments[-1][1] != locus_count:
        raise ValueError("Segments must cover the complete chromosome")
