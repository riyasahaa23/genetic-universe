"""Comprehensive backend verification test suite for Offspring Universe.

Verifies all P0 required features against real GIAB data:
1. Real trio ingestion (HG003, HG004, HG002)
2. Parental-origin inference (observed vs inferred)
3. All 5 supported switch candidates on chr1
4. Negative cases: ambiguous phase, missing markers, conflicting genotypes
5. Bounded region with zero candidates (no forced crossovers)
6. Counterfactual isolation and immutability
7. Provenance and evidence graph
8. Observed vs inferred vs hypothetical statuses
9. API safety against fabricated phenotype claims
10. Stable endpoints and aliases
"""
from pathlib import Path
import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.main import create_app
from app.trio.attribution import counterfactual, evidence_graph, novelty_trace, scientific_audit
from app.trio.inheritance import infer_variant
from app.trio.models import (
    CounterfactualRequest,
    Genotype,
    PhaseEvidence,
    RecombinationEvent,
    Region,
)
from app.trio.pipeline import FamilyStore
from app.trio.segments import build_segments

DATA = Path(__file__).resolve().parents[2] / "data"

EXPECTED_SWITCH_CANDIDATES = [
    ("HG004", 91718531, 91749532, 1, 0, 56, 2),
    ("HG003", 120297885, 120333552, 0, 1, 42, 60),
    ("HG004", 154728742, 154750132, 0, 1, 7, 9),
    ("HG003", 161971920, 162005539, 0, 1, 418, 5),
    ("HG004", 216064412, 216075050, 1, 0, 104, 129),
]


@pytest.fixture(scope="module")
def store():
    return FamilyStore(DATA)


@pytest.fixture(scope="module")
def default_state(store):
    return store.state("GIAB_AJ")


@pytest.fixture(scope="module")
def client():
    with TestClient(create_app(DATA)) as test_client:
        yield test_client


# ------------------------------------------------------------------------------
# 1. Real Trio Ingestion
# ------------------------------------------------------------------------------
def test_real_trio_ingestion(store, default_state):
    family = store.family("GIAB_AJ")
    assert family.family_id == "GIAB_AJ"
    assert family.dataset_kind == "real"
    assert family.reference_build == "GRCh38"
    assert family.parent_a.sample_id == "HG003"
    assert family.parent_b.sample_id == "HG004"
    assert family.child.sample_id == "HG002"

    # Preserves trio sample roles
    assert default_state.samples == {
        "parent_a": "HG003",
        "parent_b": "HG004",
        "child": "HG002",
    }
    # 347 variants in default region (chr1:1-1000000)
    assert len(default_state.variants) == 347
    for v in default_state.variants:
        assert v.child_genotype.evidence_status == "observed"
        assert v.parent_a_genotype.evidence_status in ("observed", "unresolved")
        assert v.parent_b_genotype.evidence_status in ("observed", "unresolved")
        if v.parent_a_genotype.status == "record_absent_not_reference":
            assert v.parent_a_genotype.evidence_status == "unresolved"
        else:
            assert v.parent_a_genotype.evidence_status == "observed"
        assert v.child_genotype.sample_id == "HG002"
        assert v.parent_a_genotype.sample_id == "HG003"
        assert v.parent_b_genotype.sample_id == "HG004"


# ------------------------------------------------------------------------------
# 2. Parental-Origin Inference (Observed vs Inferred)
# ------------------------------------------------------------------------------
def test_parental_origin_inference_categories():
    def make_gt(sample, alleles, raw="0/1"):
        return Genotype(
            sample_id=sample,
            raw_gt=raw,
            alleles=alleles,
            phased=False,
            usable=True,
            status="observed",
            evidence_status="observed",
        )

    # Father-only origin
    v_a = infer_variant("1", 100, "A", "G",
                        make_gt("C", ["A", "G"]),
                        make_gt("A", ["A", "G"]),
                        make_gt("B", ["A", "A"], "0/0"),
                        "comp-1")
    assert v_a.origin == "parent_A"
    assert v_a.origin_evidence_status == "inferred"
    assert v_a.child_genotype.evidence_status == "observed"

    # Mother-only origin
    v_b = infer_variant("1", 101, "A", "G",
                        make_gt("C", ["A", "G"]),
                        make_gt("A", ["A", "A"], "0/0"),
                        make_gt("B", ["A", "G"]),
                        "comp-2")
    assert v_b.origin == "parent_B"
    assert v_b.origin_evidence_status == "inferred"

    # Both parents (inherited from both)
    v_both = infer_variant("1", 102, "A", "G",
                           make_gt("C", ["G", "G"], "1/1"),
                           make_gt("A", ["A", "G"]),
                           make_gt("B", ["A", "G"]),
                           "comp-3")
    assert v_both.origin == "both"

    # De novo candidate (both parents hom-ref, child het)
    v_denovo = infer_variant("1", 103, "A", "G",
                             make_gt("C", ["A", "G"]),
                             make_gt("A", ["A", "A"], "0/0"),
                             make_gt("B", ["A", "A"], "0/0"),
                             "comp-4")
    assert v_denovo.origin == "de_novo_candidate"
    assert v_denovo.status == "mendelian_inconsistent_requires_validation"


# ------------------------------------------------------------------------------
# 3. All 5 Supported Candidate Homolog Switches on chr1
# ------------------------------------------------------------------------------
def test_all_five_supported_switch_candidates(store):
    family = store.family("GIAB_AJ")
    assert len(family.regions) == 6  # 1 default + 5 candidate regions

    found_candidates = []
    for region in family.regions[1:]:  # Candidate regions
        st = store.state("GIAB_AJ", region)
        for ev in st.recombination_events:
            found_candidates.append((
                ev.parent_sample,
                ev.start,
                ev.end,
                ev.left_homolog,
                ev.right_homolog,
                len(ev.left_marker_ids),
                len(ev.right_marker_ids),
            ))
            # Must NOT claim proven crossover
            assert ev.status == "candidate_recombination_interval"
            assert ev.confidence is None
            assert ev.evidence_status == "inferred"
            assert len(ev.left_flanking_markers) >= 2
            assert len(ev.right_flanking_markers) >= 2
            # Flanking markers preserve phase and transmitted homolog
            for m in ev.left_flanking_markers + ev.right_flanking_markers:
                assert m.coordinate_evidence_status == "observed"
                assert m.evidence_status == "inferred"
                assert m.parental_phase is not None
                assert m.parental_phase.evidence_status == "observed"
                assert m.transmitted_allele is not None
                assert m.transmitted_homolog in (0, 1)

    assert found_candidates == EXPECTED_SWITCH_CANDIDATES


# ------------------------------------------------------------------------------
# 4. Negative Cases: Ambiguous Phase, Missing Markers, Conflicting Genotypes
# ------------------------------------------------------------------------------
def test_ambiguous_phase_cannot_support_crossover(store):
    window = Region(chromosome="1", start=215852825, end=216290383)
    st = store.state("GIAB_AJ", window)
    event = st.recombination_events[0]
    ids = {m.variant_id for m in event.left_flanking_markers + event.right_flanking_markers}
    variants = [v.model_copy(deep=True) for v in st.variants if v.id in ids]

    # Fault: Make right flank unphased
    for v in variants[2:]:
        v.phase_evidence["parent_B"].raw_gt = "0/1"

    _, _, events, _ = build_segments(variants, "test", window, st.samples)
    assert not events


def test_missing_flank_markers_rejects_candidate(store):
    window = Region(chromosome="1", start=215852825, end=216290383)
    st = store.state("GIAB_AJ", window)
    event = st.recombination_events[0]
    ids = {m.variant_id for m in event.left_flanking_markers + event.right_flanking_markers}
    variants = [v.model_copy(deep=True) for v in st.variants if v.id in ids]

    # Remove left flank marker so left count < 2
    variants.pop(0)

    _, _, events, _ = build_segments(variants, "test", window, st.samples)
    assert not events


def test_conflicting_phase_genotypes_rejects_candidate(store):
    window = Region(chromosome="1", start=215852825, end=216290383)
    st = store.state("GIAB_AJ", window)
    event = st.recombination_events[0]
    ids = {m.variant_id for m in event.left_flanking_markers + event.right_flanking_markers}
    variants = [v.model_copy(deep=True) for v in st.variants if v.id in ids]

    # Change phase alleles to conflict with benchmark alleles
    variants[0].phase_evidence["parent_B"].alleles = ["C", "C"]

    _, _, events, _ = build_segments(variants, "test", window, st.samples)
    assert not events


# ------------------------------------------------------------------------------
# 5. Default Region has Zero Recombination Evidence (Not an Error)
# ------------------------------------------------------------------------------
def test_no_recombination_in_default_region(default_state):
    assert len(default_state.recombination_events) == 0
    audit = scientific_audit(default_state)
    assert audit.candidate_recombination_intervals == 0
    assert audit.resolved_crossover_events == 0
    assert audit.inferred_crossover_events == 0
    assert audit.candidate_interval_ids == []
    assert audit.point_markers == 610
    assert audit.inferred_haplotype_blocks == 2


# ------------------------------------------------------------------------------
# 6. Counterfactual Isolation and Immutability
# ------------------------------------------------------------------------------
def test_counterfactual_state_isolation(default_state):
    original_dump = default_state.model_dump_json()

    target_id = "1:814309:T:G"
    req = CounterfactualRequest(
        family_id="GIAB_AJ",
        intervention="REPLACE_WITH_PARENTAL_GENOTYPE",
        target_id=target_id,
        parent_role="parent_A",
    )
    result = counterfactual(default_state, req)

    # 1. Original state is strictly untouched
    assert default_state.model_dump_json() == original_dump
    assert result.original_state.model_dump_json() == original_dump

    # 2. Counterfactual state is hypothetical
    cf_state = result.counterfactual_state
    assert cf_state.state_status == "hypothetical"
    assert cf_state.provenance.transformation is not None
    assert cf_state.provenance.parent_computation_id == default_state.provenance.computation_id

    # 3. Modified variant is marked hypothesis
    mod_v = next(v for v in cf_state.variants if v.id == target_id)
    assert mod_v.evidence_status == "hypothesis"
    assert mod_v.child_genotype.evidence_status == "hypothesis"
    assert mod_v.child_genotype.status == "computational_intervention"
    assert mod_v.child_genotype.alleles == ["T", "G"]

    # 4. Phenotype effect is null (no validated model exists)
    assert result.original_score is None
    assert result.counterfactual_score is None
    assert result.delta is None


def test_counterfactual_remove_variant_isolation(default_state):
    target_id = "1:814309:T:G"
    req = CounterfactualRequest(
        family_id="GIAB_AJ",
        intervention="REMOVE_VARIANT",
        target_id=target_id,
    )
    result = counterfactual(default_state, req)
    cf_state = result.counterfactual_state
    mod_v = next(v for v in cf_state.variants if v.id == target_id)
    assert mod_v.child_genotype.alleles == ["T", "T"]  # ALT replaced with REF
    assert result.delta is None


# ------------------------------------------------------------------------------
# 7. Provenance & Navigable Evidence Graph
# ------------------------------------------------------------------------------
def test_provenance_and_navigable_graph(default_state):
    graph = evidence_graph(default_state)
    assert len(graph.nodes) > 0
    assert len(graph.links) > 0

    node_ids = {n.id for n in graph.nodes}
    assert f"child:{default_state.child_id}" in node_ids
    assert f"parent:{default_state.samples['parent_a']}" in node_ids
    assert f"parent:{default_state.samples['parent_b']}" in node_ids

    # All edges reference valid existing nodes
    for link in graph.links:
        assert link.source in node_ids
        assert link.target in node_ids
        assert link.provenance
        assert link.evidence_status in ("observed", "inferred", "hypothesis")

    for node in graph.nodes:
        assert node.provenance
        assert node.evidence_status in ("observed", "inferred", "hypothesis")


# ------------------------------------------------------------------------------
# 8. API Safety Against Fabricated Phenotype Claims
# ------------------------------------------------------------------------------
def test_api_safety_and_stable_endpoints(client):
    # GET /api/families
    res = client.get("/api/families")
    assert res.status_code == 200
    assert any(f["family_id"] == "GIAB_AJ" for f in res.json()["families"])

    # GET /api/families/{family_id}/child-state
    res = client.get("/api/families/GIAB_AJ/child-state")
    assert res.status_code == 200
    state_json = res.json()
    assert state_json["child_id"] == "HG002"
    assert len(state_json["variants"]) == 347

    # GET /api/families/{family_id}/genome
    res = client.get("/api/families/GIAB_AJ/genome")
    assert res.status_code == 200
    assert res.json()["child_id"] == "HG002"

    # GET /api/families/{family_id}/segments
    res = client.get("/api/families/GIAB_AJ/segments")
    assert res.status_code == 200
    assert len(res.json()["markers"]) == 610
    assert len(res.json()["segments"]) == 2

    # GET /api/families/{family_id}/recombination
    res = client.get("/api/families/GIAB_AJ/recombination")
    assert res.status_code == 200

    # GET /api/evidence/{family_id} and /api/families/{family_id}/evidence
    res1 = client.get("/api/evidence/GIAB_AJ")
    assert res1.status_code == 200
    res2 = client.get("/api/families/GIAB_AJ/evidence")
    assert res2.status_code == 200
    assert len(res1.json()["nodes"]) == len(res2.json()["nodes"])

    # GET /api/scientific-audit/{family_id} and /api/families/{family_id}/scientific-audit
    res_audit1 = client.get("/api/scientific-audit/GIAB_AJ")
    assert res_audit1.status_code == 200
    res_audit2 = client.get("/api/families/GIAB_AJ/scientific-audit")
    assert res_audit2.status_code == 200
    audit = res_audit1.json()
    assert audit == res_audit2.json()

    # CRITICAL: Phenotype causality must NOT be claimed
    assert audit["real_data"] is True
    assert audit["phenotype_available"] is True
    assert audit["novelty_trace_ready"] is False
    assert audit["counterfactual_ready"] is False
    assert audit["causal_claim_supported"] is False

    # POST /api/novelty-trace
    trace_res = client.post("/api/novelty-trace", json={"family_id": "GIAB_AJ"})
    assert trace_res.status_code == 200
    trace = trace_res.json()
    assert trace["score"] is None
    assert trace["score_model"] is None
    assert trace["total_candidates"] == 22
    for cand in trace["ranked_candidates"]:
        assert cand["phenotype_score"] is None
        assert "phenotype_signal_to_variant_configuration" in cand["missing_links"]
        assert "validated_phenotype_model" in cand["missing_links"]

    # POST /api/counterfactual
    cf_res = client.post("/api/counterfactual", json={
        "family_id": "GIAB_AJ",
        "intervention": "REPLACE_WITH_PARENTAL_GENOTYPE",
        "target_id": "1:814309:T:G",
        "parent_role": "parent_A",
    })
    assert cf_res.status_code == 200
    cf_data = cf_res.json()
    assert cf_data["original_score"] is None
    assert cf_data["counterfactual_score"] is None
    assert cf_data["delta"] is None
    assert cf_data["counterfactual_ready"] is False
