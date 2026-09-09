"""Checksummed complete-scan catalog; filtering never changes the evidence set."""
import json
from collections import Counter
from statistics import mean, median
from typing import Any, Literal

from .ingestion import resolve_input, sha256
from .models import Model, RecombinationEvent, chromosome_name
from .genome_scan import chrom_order


class GenomeCandidate(RecombinationEvent):
    classification: Literal["candidate_homolog_switch"] = "candidate_homolog_switch"
    proven_crossover: Literal[False] = False
    left_marker_count: int
    right_marker_count: int
    interval_width_bp: int


class GenomePage(Model):
    family_id: str
    scope: str = "complete_configured_source_scan"
    total: int
    offset: int
    limit: int
    next_offset: int | None
    recombination_events: list[GenomeCandidate]
    evidence_status: Literal["inferred"] = "inferred"
    provenance: dict[str, Any]
    limitations: list[str]


def load_catalog(store, family_id):
    family = store.family(family_id)
    artifact = family.recombination_catalog
    if artifact is None:
        raise ValueError("Complete genome scan is unavailable for this family")
    path = resolve_input(store.root, artifact.path)
    if sha256(path) != artifact.sha256:
        raise ValueError("Genome recombination catalog checksum mismatch")
    data = json.loads(path.read_text())
    if data.get("family_id") != family_id or not data.get("complete"):
        raise ValueError("Genome recombination catalog is incomplete or belongs to another family")
    expected_urls = {s.sample_id + ".benchmark": s.source_url for s in (family.parent_a, family.parent_b, family.child)}
    expected_urls.update({p.sample_id + ".phase": p.artifact.source_url for p in family.phase_inputs})
    actual_urls = {s["id"]: s["source_url"] for s in data["provenance"]["sources"]}
    if actual_urls != expected_urls:
        raise ValueError("Genome catalog does not describe the configured trio source resources")
    if len({e["id"] for e in data["candidates"]}) != len(data["candidates"]):
        raise ValueError("Duplicate genome recombination candidates")
    return data


def paginate(data, chromosome=None, parent=None, offset=0, limit=100, start=None, end=None):
    if chromosome is not None:
        chromosome = chromosome_name(chromosome)
    if parent is not None and parent not in {s["parent"] for s in data["statistics"]}:
        raise ValueError("Parent must identify a parent in this trio")
    if (start is None) != (end is None) or (start is not None and (chromosome is None or start > end)):
        raise ValueError("Interval filtering requires chromosome and ordered start/end")
    candidates = [e for e in data["candidates"] if (chromosome is None or e["chromosome"] == chromosome)
        and (parent is None or e["parent_sample"] == parent)
        and (start is None or e["start"] <= end and e["end"] >= start)]
    page = [GenomeCandidate(**e, left_marker_count=len(e["left_marker_ids"]), right_marker_count=len(e["right_marker_ids"]),
        interval_width_bp=e["end"]-e["start"]) for e in candidates[offset:offset+limit]]
    return GenomePage(family_id=data["family_id"], total=len(candidates), offset=offset, limit=limit,
        next_offset=offset+limit if offset+limit < len(candidates) else None, recombination_events=page,
        provenance=data["provenance"], limitations=data["limitations"])


def summarize(data):
    stats, events = data["statistics"], data["candidates"]
    chromosomes = sorted({s["chromosome"] for s in stats}, key=chrom_order)
    parents = sorted({s["parent"] for s in stats})
    widths = [e["end"]-e["start"] for e in events]
    reasons = Counter()
    for s in stats:
        reasons.update(s["rejected_primary_reasons"])
    eligible = sorted({s["chromosome"] for s in stats if s["informative_markers"]}, key=chrom_order)
    return {"family_id": data["family_id"], "scan_complete": data["complete"], "scope": data["scope"],
        "total_candidates": len(events), "proven_crossovers": 0,
        "candidates_per_chromosome": {c: sum(e["chromosome"] == c for e in events) for c in chromosomes},
        "candidates_per_parent": {p: sum(e["parent_sample"] == p for e in events) for p in parents},
        "interval_widths_bp": {"definition": "right flanking coordinate minus left flanking coordinate",
            "minimum": min(widths) if widths else None, "median": median(widths) if widths else None,
            "maximum": max(widths) if widths else None, "mean": mean(widths) if widths else None},
        "informative_markers": {"total": sum(s["informative_markers"] for s in stats),
            "per_parent": {p: sum(s["informative_markers"] for s in stats if s["parent"] == p) for p in parents}},
        "ambiguous_rejected_transition_count": len(data["rejected_transitions"]),
        "rejected_primary_reasons": dict(reasons),
        "rejection_definition": "Disjoint primary reason counts for adjacent informative-run boundaries; not counts of biological crossovers",
        "insufficient_evidence_regions": {"count": len(data["insufficient_evidence_regions"]),
            "parent_specific_bp": sum(s["insufficient_bp"] for s in stats),
            "definition": "Per-parent complement of supported multi-marker spans; not crossover events"},
        "record_bearing_chromosomes": chromosomes, "chromosomes_with_usable_transmission_evidence": eligible,
        "header_only_chromosomes": sorted(set().union(*(set(c) for c in data["header_chromosomes"].values())) - set(chromosomes), key=chrom_order),
        "chromosome_parent_statistics": stats, "source_coverage": data["source_coverage"],
        "provenance": data["provenance"], "limitations": data["limitations"]}
