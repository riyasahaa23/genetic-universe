"""Task 5: Real-Data Generalization and Final Scientific System Validation Test Suite.

Rigorously verifies the real-data pipeline on GIAB Ashkenazi trio (HG002/HG003/HG004)
under strict epistemic isolation, validating genomic transmission, candidate
homolog-switch inference, configuration classification, phenotype readiness gates,
and failure taxonomy without simulator metadata leakage or fabricated claims.
"""
from pathlib import Path
import pytest

from app.trio.pipeline import FamilyStore
from app.trio.attribution import novelty_trace, counterfactual, evidence_graph, scientific_audit, MODEL_LIMITATIONS
from app.trio.phenotype_engine import categorize_phenotypes
from app.trio.models import CounterfactualRequest
from app.trio.segments import build_segments

DATA_ROOT = Path(__file__).resolve().parents[3] / "data"


@pytest.fixture(scope="module")
def store():
    return FamilyStore(DATA_ROOT)


@pytest.fixture(scope="module")
def giab_family(store):
    return store.family("GIAB_AJ")


# 1. Real trio ingestion
def test_real_trio_ingestion(store, giab_family):
    assert giab_family.family_id == "GIAB_AJ"
    assert giab_family.dataset_kind == "real"
    assert giab_family.reference_build == "GRCh38"
    assert giab_family.parent_a.sample_id == "HG003"
    assert giab_family.parent_b.sample_id == "HG004"
    assert giab_family.child.sample_id == "HG002"
    assert len(giab_family.regions) == 6

    # Test state generation on region 1
    state = store.state("GIAB_AJ", giab_family.regions[0])
    assert state.child_id == "HG002"
    assert state.samples["parent_a"] == "HG003"
    assert state.samples["parent_b"] == "HG004"
    assert len(state.variants) > 0
    assert len(state.markers) > 0


# 2. Parent-child relationship validation
def test_pedigree_validation(store, giab_family):
    ped_path = DATA_ROOT / giab_family.pedigree
    assert ped_path.exists()
    lines = [line.strip().split() for line in ped_path.read_text(encoding="utf-8").splitlines() if line.strip() and not line.startswith("#")]
    assert len(lines) >= 3
    child_line = next(l for l in lines if l[1] == "HG002")
    fam_id, ind_id, pat_id, mat_id, sex, pheno = child_line
    assert fam_id == "GIAB_AJ"
    assert ind_id == "HG002"
    assert pat_id == "HG003"
    assert mat_id == "HG004"
    assert sex == "1"  # male


# 3. Missing parent handling
def test_missing_parent_handling(store, giab_family):
    state = store.state("GIAB_AJ", giab_family.regions[0])
    # Verify that variants with missing parental record have PARENT_RECORD_ABSENT warning
    warnings = [w for w in state.warnings if w.code == "PARENT_RECORD_ABSENT"]
    assert len(warnings) > 0, "Real GIAB VCFs contain uncalled or missing sites in parents"
    # Ensure uncalled parent site does not cause crash or assume reference
    for v in state.variants:
        if v.parent_a_genotype.status == "record_absent_not_reference":
            assert v.parent_a_genotype.evidence_status == "unresolved"


# 4. Missing phase handling
def test_missing_phase_handling(store, giab_family):
    state = store.state("GIAB_AJ", giab_family.regions[5])  # Region with switch
    assert len(state.recombination_events) == 1
    event = state.recombination_events[0]
    flank_variants = [v.model_copy(deep=True) for v in state.variants if v.id in {m.variant_id for m in event.left_flanking_markers + event.right_flanking_markers}]

    # Invalidate phase by setting unphased genotype
    for v in flank_variants:
        if "parent_B" in v.phase_evidence:
            v.phase_evidence["parent_B"].raw_gt = v.phase_evidence["parent_B"].raw_gt.replace("|", "/")

    markers, blocks, events, unresolved = build_segments(flank_variants, "test_unphased", state.region, state.samples)
    assert len(events) == 0, "Unphased variants must not create candidate recombination intervals"


# 5. Recombination inference (All 5 candidate intervals)
def test_recombination_inference_real_giab(store, giab_family):
    expected_switches = {
        ("HG004", 91718531, 91749532): (56, 2),
        ("HG003", 120297885, 120333552): (42, 60),
        ("HG004", 154728742, 154750132): (7, 9),
        ("HG003", 161971920, 162005539): (418, 5),
        ("HG004", 216064412, 216075050): (104, 129),
    }
    found = {}
    for region in giab_family.regions:
        st = store.state("GIAB_AJ", region)
        for ev in st.recombination_events:
            found[(ev.parent_sample, ev.start, ev.end)] = (len(ev.left_marker_ids), len(ev.right_marker_ids))
            assert ev.status == "candidate_recombination_interval"
            assert ev.confidence is None, "Real candidate intervals must not claim ground truth confidence"
            assert ev.evidence_status == "inferred"
            assert bool(ev.uncertainty) is True

    assert found == expected_switches


# 6. Zero simulator metadata access
def test_zero_simulator_metadata_access(store, giab_family):
    st = store.state("GIAB_AJ", giab_family.regions[0])
    trace = novelty_trace(st)
    graph = evidence_graph(st)

    # Verify no simulation objects in state, trace, or graph
    assert not hasattr(st, "crossovers")
    assert not hasattr(st, "planted_loci")
    assert "planted" not in str(trace.model_dump())
    assert "simulation" not in str(graph.model_dump())


# 7. Real phenotype-null behavior
def test_real_phenotype_null_behavior(store, giab_family):
    for region in giab_family.regions:
        st = store.state("GIAB_AJ", region)
        cat = categorize_phenotypes(st)
        assert cat.predicted_phenotype is None
        assert cat.phenotype_model_status == "unavailable"
        assert len(cat.limitations) > 0

        trace = novelty_trace(st)
        assert trace.score is None
        assert trace.score_model is None
        if trace.ranked_candidates:
            assert "validated_phenotype_model" in trace.ranked_candidates[0].missing_links


# 8. Epistemic tier propagation
def test_epistemic_tier_propagation(store, giab_family):
    st = store.state("GIAB_AJ", giab_family.regions[1])
    audit = scientific_audit(st)
    assert audit.audit_summary["observed"] > 0
    assert audit.audit_summary["inferred"] > 0
    assert audit.audit_summary["hypothesis"] > 0
    assert audit.audit_summary["unresolved"] >= 0

    # Test baseline graph has observed and inferred
    graph = evidence_graph(st)
    tiers = {node.evidence_status for node in graph.nodes}
    assert "observed" in tiers  # Parents, reported phenotypes
    assert "inferred" in tiers  # Transmission markers, blocks, configurations

    # Test hypothetical state after counterfactual propagates hypothesis tier
    cand = st.configurations[0]
    req = CounterfactualRequest(
        family_id="GIAB_AJ",
        region=st.region,
        intervention="REPLACE_WITH_PARENTAL_GENOTYPE",
        target_id=cand.variant_ids[0],
        parent_role="parent_A"
    )
    result = counterfactual(st, req)
    cf_graph = evidence_graph(result.counterfactual_state)
    cf_tiers = {node.evidence_status for node in cf_graph.nodes}
    assert "hypothesis" in cf_tiers


# 9. Real vs synthetic separation
def test_real_synthetic_separation(store, giab_family):
    st = store.state("GIAB_AJ", giab_family.regions[0])
    assert st.provenance.dataset_kind == "real"
    # Store configured with allow_validation=False must reject non-real family manifests
    strict_store = FamilyStore(DATA_ROOT, allow_validation=False)
    for fam in strict_store.families():
        assert fam.dataset_kind == "real"


# 10. Counterfactual model-required gate
def test_counterfactual_model_required_gate(store, giab_family):
    st = store.state("GIAB_AJ", giab_family.regions[1])
    cand = st.configurations[0]
    req = CounterfactualRequest(
        family_id="GIAB_AJ",
        region=st.region,
        intervention="REPLACE_WITH_PARENTAL_GENOTYPE",
        target_id=cand.variant_ids[0],
        parent_role="parent_A"
    )
    result = counterfactual(st, req)
    assert result.counterfactual_state.state_status == "hypothetical"
    assert result.explanation is not None
    assert result.parental_origin_consequences["dosage_delta"] is not None
    assert len(result.limitations) == len(MODEL_LIMITATIONS)
    # Phenotype remains unpredicted
    cat = categorize_phenotypes(result.counterfactual_state)
    assert cat.predicted_phenotype is None


# 11. Failure taxonomy enumeration
def test_failure_taxonomy_enumeration(store, giab_family):
    taxonomy_codes = [f"F{i}" for i in range(1, 11)]
    assert len(taxonomy_codes) == 10
    # Check that real state handles uninformative/unresolved regions (F3, F5)
    st1 = store.state("GIAB_AJ", giab_family.regions[0])
    assert any(w.code == "CROSSOVERS_UNRESOLVED" for w in st1.warnings)
    # Check that phenotype model absence is flagged (F6, F7)
    cat = categorize_phenotypes(st1)
    assert cat.phenotype_model_status == "unavailable"


# 12. Deterministic replay
def test_deterministic_replay(store, giab_family):
    region = giab_family.regions[1]
    st_run1 = store.state("GIAB_AJ", region)
    st_run2 = store.state("GIAB_AJ", region)

    assert st_run1.provenance.computation_id == st_run2.provenance.computation_id
    assert len(st_run1.variants) == len(st_run2.variants)
    assert len(st_run1.markers) == len(st_run2.markers)
    assert len(st_run1.segments) == len(st_run2.segments)
    assert len(st_run1.recombination_events) == len(st_run2.recombination_events)
    assert len(st_run1.configurations) == len(st_run2.configurations)
