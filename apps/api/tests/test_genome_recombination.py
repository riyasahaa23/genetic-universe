"""Genome completeness and scientific rules using only the real GIAB scan/markers."""
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.main import create_app
from app.trio.genome_catalog import load_catalog, paginate, summarize
from app.trio.genome_scan import Point
from app.trio.inheritance import infer_variant
from app.trio.models import Genotype, PhaseEvidence, Region
from app.trio.pipeline import FamilyStore
from app.trio.segments import build_segments
from app.trio.switch_rules import partition_runs, rejection_reasons

DATA = Path(__file__).resolve().parents[2] / "data"


@pytest.fixture(scope="module")
def catalog():
    return load_catalog(FamilyStore(DATA), "GIAB_AJ")


def test_real_candidates_not_capped_at_five(catalog):
    assert len(catalog["candidates"]) > 5
    assert sum(s["candidate_count"] for s in catalog["statistics"]) == len(catalog["candidates"])
    first = paginate(catalog, limit=3)
    collected = []
    page = first
    while True:
        collected.extend(e.id for e in page.recombination_events)
        if page.next_offset is None:
            break
        page = paginate(catalog, offset=page.next_offset, limit=3)
    assert collected == [e["id"] for e in catalog["candidates"]]


def test_all_record_bearing_chromosomes_are_scanned(catalog):
    observed = set().union(*(set(c) for c in catalog["source_coverage"].values()))
    audited = {s["chromosome"] for s in catalog["statistics"]}
    assert catalog["complete"] and observed == audited
    assert set(map(str, range(1, 23))) <= observed
    assert all({s["parent"] for s in catalog["statistics"] if s["chromosome"] == c} == {"HG003", "HG004"} for c in observed)
    assert all(c["records"] > 0 for coverage in catalog["source_coverage"].values() for c in coverage.values())


def test_no_duplicate_candidates(catalog):
    candidates = catalog["candidates"]
    assert len({e["id"] for e in candidates}) == len(candidates)
    assert len({(e["chromosome"], e["parent_sample"], e["phase_set"], e["start"], e["end"]) for e in candidates}) == len(candidates)
    assert all(e["status"] == "candidate_recombination_interval" and e["confidence"] is None for e in candidates)


def test_each_candidate_replays_from_observed_flanking_calls(catalog):
    for event in catalog["candidates"]:
        variants = []
        for marker in event["left_flanking_markers"] + event["right_flanking_markers"]:
            calls = {s: Genotype(**g) for s, g in marker["genotypes"].items()}
            record = calls["HG002"].source_record.split(":")
            variant = infer_variant(event["chromosome"], marker["position"], record[2], record[3].split(",")[0],
                                    calls["HG002"], calls["HG003"], calls["HG004"], "real-evidence-replay")
            role = "parent_A" if event["parent_sample"] == "HG003" else "parent_B"
            variant.phase_evidence[role] = PhaseEvidence(**marker["parental_phase"])
            variants.append(variant)
        region = Region(chromosome=event["chromosome"], start=min(v.position for v in variants), end=max(v.position for v in variants))
        result = build_segments(variants, "real-evidence-replay", region, {"parent_a": "HG003", "parent_b": "HG004", "child": "HG002"})
        assert len(result[2]) == 1
        assert (result[2][0].start, result[2][0].end, result[2][0].parent_sample) == (event["start"], event["end"], event["parent_sample"])


def test_real_rejected_boundaries_are_not_candidates(catalog):
    assert catalog["rejected_transitions"]
    for item in catalog["rejected_transitions"]:
        assert item["reasons"] and item["classification"] == "rejected_transition_not_a_crossover"
        if item["left_PS"] != item["right_PS"]:
            assert "phase_set_change_or_unavailable" in item["reasons"]
        if min(item["left_count"], item["right_count"]) < 2:
            assert "insufficient_flank_markers" in item["reasons"]
    assert sum(s["rejected_transition_count"] for s in catalog["statistics"]) == len(catalog["rejected_transitions"])


def test_missing_marker_and_ambiguous_phase_rejected(catalog):
    event = catalog["candidates"][0]
    points = [Point(m["chromosome"], m["position"], m["parental_phase"]["phase_set"], m["transmitted_homolog"],
                    (m["position"], ""), m["transmitted_allele"], m["variant_id"])
              for m in event["left_flanking_markers"] + event["right_flanking_markers"]]
    left, right = partition_runs(points)
    assert not rejection_reasons(left, right)
    assert "insufficient_flank_markers" in rejection_reasons(left[:1], right)
    # Fault injection is confined to in-memory copies of real markers.
    right[0].phase_set = "unlinked-phase"
    assert "phase_set_change_or_unavailable" in rejection_reasons(left, right)


def test_results_and_statistics_deterministic(catalog):
    again = load_catalog(FamilyStore(DATA), "GIAB_AJ")
    assert catalog == again
    assert paginate(catalog).model_dump() == paginate(again).model_dump()
    assert summarize(catalog) == summarize(again)
    assert all(len({m.split(":")[1] for m in e[side]}) >= 2 for e in catalog["candidates"] for side in ["left_marker_ids", "right_marker_ids"])


def test_genome_api_filters_and_summary(catalog):
    with TestClient(create_app(DATA)) as client:
        root = "/api/families/GIAB_AJ/recombination"
        all_events = client.get(root, params={"limit": 1000}).json()
        assert all_events["total"] == len(catalog["candidates"]) > 5
        chr2 = client.get(root, params={"chromosome": "2"}).json()
        assert chr2["total"] > 0 and all(e["chromosome"] == "2" for e in chr2["recombination_events"])
        maternal = client.get(root, params={"parent": "HG004", "limit": 1000}).json()
        assert maternal["total"] == sum(e["parent_sample"] == "HG004" for e in catalog["candidates"])
        assert all(e["parent_sample"] == "HG004" for e in maternal["recombination_events"])
        assert client.get(root, params={"parent": "unrelated"}).status_code == 422
        assert client.get(root, params={"chromosome": "1", "start": 100}).status_code == 422
        summary = client.get(root + "/summary").json()
        assert summary["total_candidates"] == all_events["total"]
        assert summary["proven_crossovers"] == 0 and summary["scan_complete"]
        assert sum(summary["candidates_per_chromosome"].values()) == summary["total_candidates"]
