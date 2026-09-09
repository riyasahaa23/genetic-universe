"""Real GIAB switch evidence; negative cases are explicit in-memory fault injections."""
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.main import create_app
from app.trio.ingestion import sha256
from app.trio.models import RecombinationEvent, Region
from app.trio.pipeline import FamilyStore
from app.trio.segments import build_segments

DATA = Path(__file__).resolve().parents[2] / "data"
WINDOW = Region(chromosome="1", start=215852825, end=216290383)
EXPECTED = {
    ("HG004", 91718531, 91749532): (56, 2),
    ("HG003", 120297885, 120333552): (42, 60),
    ("HG004", 154728742, 154750132): (7, 9),
    ("HG003", 161971920, 162005539): (418, 5),
    ("HG004", 216064412, 216075050): (104, 129)}


@pytest.fixture(scope="module")
def state():
    return FamilyStore(DATA).state("GIAB_AJ", WINDOW)


def minimal_flanks(state):
    event = state.recombination_events[0]
    ids = {m.variant_id for m in event.left_flanking_markers + event.right_flanking_markers}
    return [v.model_copy(deep=True) for v in state.variants if v.id in ids]


def test_all_five_real_candidates_reproduce_from_source():
    store = FamilyStore(DATA)
    found = {}
    for region in store.family("GIAB_AJ").regions:
        state = store.state("GIAB_AJ", region)
        for event in state.recombination_events:
            found[(event.parent_sample, event.start, event.end)] = (len(event.left_marker_ids), len(event.right_marker_ids))
            assert event.status == "candidate_recombination_interval" and event.confidence is None
            assert event.evidence_status == "inferred" and event.uncertainty
            assert event.sources and all(sha256(DATA / s.path) == s.sha256 for s in event.sources)
    assert found == EXPECTED


def test_supported_phased_switch_observed_calls_and_inferences(state):
    event = state.recombination_events[0]
    assert (event.parent_sample, event.phase_set, event.left_homolog, event.right_homolog) == ("HG004", "212148403", 1, 0)
    markers = event.left_flanking_markers + event.right_flanking_markers
    assert [m.position for m in markers] == [216064386, 216064412, 216075050, 216076228]
    assert [m.transmitted_allele for m in markers] == ["T", "A", "T", "G"]
    assert [m.parental_phase.raw_gt for m in markers] == ["1|0", "1|0", "0|1", "0|1"]
    for marker in markers:
        assert marker.evidence_status == "inferred" and marker.coordinate_evidence_status == "observed"
        assert all(gt.evidence_status == "observed" for gt in marker.genotypes.values())
        assert marker.parental_phase.evidence_status == "observed"
        assert marker.parental_phase.source_genotype.gq == 99
        assert marker.parental_phase.source_genotype.phase_quality is not None
        assert marker.child_phase.phase_set == "1" and marker.child_phase.raw_gt == "1|0"
    assert build_segments(minimal_flanks(state), "test", WINDOW, state.samples)[2]


@pytest.mark.parametrize("fault", ["unphased", "different_PS", "missing_marker", "conflicting_genotype", "ambiguous_transmission"])
def test_insufficient_or_conflicting_real_flanks_cannot_create_event(state, fault):
    variants = minimal_flanks(state)
    if fault == "unphased":
        for v in variants:
            v.phase_evidence["parent_B"].raw_gt = v.phase_evidence["parent_B"].raw_gt.replace("|", "/")
    elif fault == "different_PS":
        for v in variants[2:]:
            v.phase_evidence["parent_B"].phase_set = "not-linked-to-left"
    elif fault == "missing_marker":
        variants.pop(0)
    elif fault == "conflicting_genotype":
        variants[0].phase_evidence["parent_B"].alleles = [variants[0].reference] * 2
    else:
        # An unresolved transmitted parental allele cannot support a homolog.
        variants[0].transmission_pairs = [["T", "C"], ["C", "T"]]
    markers, blocks, events, _ = build_segments(variants, "negative-validation", WINDOW, state.samples)
    assert not events
    assert all(m.start == m.end for m in markers)
    assert all(b.start < b.end and len(b.marker_variant_ids) >= 2 for b in blocks)


def test_no_evidence_remains_explicit():
    state = FamilyStore(DATA).state("GIAB_AJ")
    assert not state.recombination_events and len(state.markers) == 610


def test_event_interval_cannot_disagree_with_source_flanks(state):
    data = state.recombination_events[0].model_dump()
    data["start"] += 1
    with pytest.raises(ValidationError, match="nearest flanking"):
        RecombinationEvent(**data)


def test_real_recombination_api_and_regional_audit(state):
    query = {"chromosome": "1", "start": WINDOW.start, "end": WINDOW.end}
    with TestClient(create_app(DATA)) as client:
        response = client.get("/api/families/GIAB_AJ/recombination", params=query)
        assert response.status_code == 200
        event = response.json()["recombination_events"][0]
        assert event["start"] == 216064412 and event["end"] == 216075050
        assert len(event["sources"]) == 6 and event["confidence"] is None
        audit = client.get("/api/families/GIAB_AJ/scientific-audit", params=query).json()
        assert audit["candidate_recombination_intervals"] == 1 and audit["resolved_crossover_events"] == 0
        assert audit["candidate_interval_ids"] == [event["id"]]
        assert not audit["causal_claim_supported"] and not audit["novelty_trace_ready"] and not audit["counterfactual_ready"]
