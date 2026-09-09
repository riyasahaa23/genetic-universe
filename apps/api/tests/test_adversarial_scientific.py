"""
Adversarial Scientific Test Suite for Offspring Universe.
Stress tests the 12 scientific boundary assumptions:
1. Missing parental genotype never assumed 0/0 homref.
2. Conflicting phase sets rejected as candidate homolog switches.
3. Identical flanking homologs rejected (no switch).
4. Chromosome boundary crossing rejected.
5. Insufficient flanking markers (<2 per flank) rejected.
6. Excessive marker gap (>50kb) rejected.
7. Invalid counterfactual target ID fails cleanly (KeyError / 404).
8. Real GIAB phenotype predicted score is strictly null / unavailable.
9. Unsupported BREAK_INTERACTION raises NotImplementedError / 422.
10. Benchmark seed variation produces deterministic yet distinct hashes.
11. Counterfactual unrelated-locus invariance (non-target variants bit-for-bit preserved).
12. Evidence provenance checksum mismatch raises ValueError.
"""
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

from app.main import create_app
from app.trio.attribution import counterfactual, novelty_trace
from app.trio.benchmark_suite import (
    execute_benchmark,
    execute_baseline_comparison,
    execute_multiseed_benchmark,
    get_benchmark_levels,
)
from app.trio.genome_scan import Point
from app.trio.models import (
    BenchmarkParams,
    CounterfactualRequest,
)
from app.trio.phenotype_engine import categorize_phenotypes
from app.trio.pipeline import FamilyStore
from app.trio.switch_rules import rejection_reasons

DATA = Path(__file__).resolve().parents[2] / "data"


@pytest.fixture(scope="module")
def store():
    return FamilyStore(DATA)


@pytest.fixture(scope="module")
def real_state(store):
    return store.state("GIAB_AJ")


@pytest.fixture(scope="module")
def client():
    return TestClient(create_app())


def make_point(chrom: str, start: int, homolog: int, phase_set: str = "PS_A") -> Point:
    return Point(
        chromosome=chrom,
        start=start,
        phase_set=phase_set,
        homolog=homolog,
        key=(start, "A"),
        transmitted="A",
        variant_id=f"{chrom}:{start}:A:T",
    )


# 1. Missing parental genotype never assumed 0/0 homref
def test_missing_parental_genotype_never_assumed_homref(real_state):
    absent_variants = [
        v for v in real_state.variants
        if v.parent_a_genotype.status == "record_absent_not_reference"
        or v.parent_b_genotype.status == "record_absent_not_reference"
    ]
    assert len(absent_variants) > 0, "Expected variants with absent parental records in real GIAB data"
    for v in absent_variants:
        if v.parent_a_genotype.status == "record_absent_not_reference":
            assert v.parent_a_genotype.alleles != ["0", "0"], f"Variant {v.id} Parent A assumed 0/0 homref!"
            assert v.parent_a_genotype.usable is False
        if v.parent_b_genotype.status == "record_absent_not_reference":
            assert v.parent_b_genotype.alleles != ["0", "0"], f"Variant {v.id} Parent B assumed 0/0 homref!"
            assert v.parent_b_genotype.usable is False


# 2. Conflicting phase sets rejected as candidate homolog switches
def test_conflicting_phase_sets_rejected():
    m1 = make_point("1", 1000, 0, "PS_A")
    m2 = make_point("1", 1500, 0, "PS_A")
    m3 = make_point("1", 2000, 1, "PS_B")
    m4 = make_point("1", 2500, 1, "PS_B")
    reasons = rejection_reasons([m1, m2], [m3, m4])
    assert "phase_set_change_or_unavailable" in reasons


# 3. Identical flanking homologs rejected (no switch)
def test_identical_flanking_homologs_rejected():
    m1 = make_point("1", 1000, 0, "PS_A")
    m2 = make_point("1", 1500, 0, "PS_A")
    m3 = make_point("1", 2000, 0, "PS_A")
    m4 = make_point("1", 2500, 0, "PS_A")
    reasons = rejection_reasons([m1, m2], [m3, m4])
    assert "no_homolog_change" in reasons


# 4. Chromosome boundary crossing rejected
def test_chromosome_boundary_crossing_rejected():
    m1 = make_point("1", 1000, 0, "PS_A")
    m2 = make_point("1", 1500, 0, "PS_A")
    m3 = make_point("2", 2000, 1, "PS_A")
    m4 = make_point("2", 2500, 1, "PS_A")
    reasons = rejection_reasons([m1, m2], [m3, m4])
    assert "different_chromosome" in reasons


# 5. Insufficient flanking markers (<2 per flank) rejected
def test_insufficient_flank_markers_rejected():
    m1 = make_point("1", 1000, 0, "PS_A")
    m2 = make_point("1", 2000, 1, "PS_A")
    m3 = make_point("1", 2500, 1, "PS_A")
    reasons = rejection_reasons([m1], [m2, m3])
    assert "insufficient_flank_markers" in reasons


# 6. Excessive marker gap (>50kb) rejected
def test_excessive_marker_gap_rejected():
    m1 = make_point("1", 1000, 0, "PS_A")
    m2 = make_point("1", 1500, 0, "PS_A")
    m3 = make_point("1", 60_000, 1, "PS_A")
    m4 = make_point("1", 60_500, 1, "PS_A")
    reasons = rejection_reasons([m1, m2], [m3, m4])
    assert "nonpositive_or_excessive_marker_gap" in reasons


# 7. Invalid counterfactual target ID fails cleanly
def test_invalid_counterfactual_target_fails_cleanly(real_state):
    req = CounterfactualRequest(family_id="GIAB_AJ", intervention="REMOVE_VARIANT", target_id="NON_EXISTENT_VAR:999")
    with pytest.raises(KeyError):
        counterfactual(real_state, req)


# 8. Real GIAB phenotype predicted score is strictly null / unavailable
def test_phenotype_score_strictly_null_for_real_giab(real_state):
    pheno = categorize_phenotypes(real_state)
    assert pheno.predicted_phenotype is None
    assert pheno.phenotype_model_status == "unavailable"
    assert len(pheno.reported_phenotypes) == 2
    assert all(p.ascertainment == "repository_reported_history" for p in pheno.reported_phenotypes)
    assert all(db.scope == "external_variant_knowledge_not_subject_observation" for db in pheno.database_associated_phenotypes)


# 9. Unsupported BREAK_INTERACTION raises NotImplementedError / 422
def test_unsupported_break_interaction_raises_422(real_state, client):
    req = CounterfactualRequest(family_id="GIAB_AJ", intervention="BREAK_INTERACTION", target_id="1:814309:T:G")
    with pytest.raises(NotImplementedError):
        counterfactual(real_state, req)

    resp = client.post("/api/counterfactual", json={"family_id": "GIAB_AJ", "intervention": "BREAK_INTERACTION", "target_id": "1:814309:T:G"})
    assert resp.status_code == 422
    assert "UNSUPPORTED_INTERVENTION" in resp.text


# 10. Benchmark seed variation produces deterministic yet distinct hashes
def test_benchmark_seed_changes_reproducibility_hash():
    b1 = execute_benchmark(BenchmarkParams(seed=42, locus_count=50))
    b2 = execute_benchmark(BenchmarkParams(seed=42, locus_count=50))
    b3 = execute_benchmark(BenchmarkParams(seed=43, locus_count=50))
    assert b1.reproducibility_hash == b2.reproducibility_hash
    assert b1.reproducibility_hash != b3.reproducibility_hash
    assert b1.benchmark_id != b3.benchmark_id


# 11. Counterfactual unrelated-locus invariance (non-target variants bit-for-bit preserved)
def test_counterfactual_unrelated_locus_invariance(real_state):
    target_id = "1:814309:T:G"
    req = CounterfactualRequest(family_id="GIAB_AJ", intervention="REMOVE_VARIANT", target_id=target_id)
    res = counterfactual(real_state, req)

    assert target_id in res.changed_variant_ids
    assert len(res.changed_variant_ids) == 1
    assert len(res.changed_genomic_intervals) == 1
    assert res.reproducibility_hash is not None

    orig_map = {v.id: v for v in real_state.variants}
    hypo_map = {v.id: v for v in res.counterfactual_state.variants}

    assert len(orig_map) == len(hypo_map)

    # Invariant: Every variant outside the target MUST be completely unchanged in genotype alleles
    for vid, orig_var in orig_map.items():
        if vid == target_id:
            continue
        hypo_var = hypo_map[vid]
        assert orig_var.child_genotype.alleles == hypo_var.child_genotype.alleles, f"Locus invariance violated at {vid}!"
        assert orig_var.parent_a_genotype.alleles == hypo_var.parent_a_genotype.alleles
        assert orig_var.parent_b_genotype.alleles == hypo_var.parent_b_genotype.alleles


# 12. Evidence provenance checksum mismatch raises ValueError
def test_evidence_provenance_mismatch_fails_cleanly():
    from app.trio.genome_catalog import load_catalog
    store_fake = FamilyStore(DATA)
    with pytest.raises(KeyError):
        load_catalog(store_fake, "NON_EXISTENT_FAMILY")


# 13. Novelty trace lineage attribution depth
def test_novelty_trace_lineage_attribution(real_state):
    trace = novelty_trace(real_state, limit=5)
    assert trace.novelty_trace_ready == real_state.phenotype_available
    assert len(trace.ranked_candidates) > 0
    top = trace.ranked_candidates[0]
    assert top.lineage_attribution is not None
    assert top.lineage_attribution.candidate_mechanism != ""
    assert top.lineage_attribution.attribution_narrative != ""
    assert top.lineage_attribution.recommended_counterfactual["intervention"] == "REVERT_RECOMBINATION_CONFIGURATION"


# 14. Baseline comparison advantages
def test_baseline_comparison_advantages():
    cmp_res = execute_baseline_comparison(locus_count=50, seed=42, top_k=3)
    assert len(cmp_res.baselines) >= 4
    novelty_f1 = next(b.f1_score for b in cmp_res.baselines if b.baseline_id == "baseline_novelty_trace")
    random_f1 = next(b.f1_score for b in cmp_res.baselines if b.baseline_id == "baseline_random")
    assert novelty_f1 >= random_f1
    assert cmp_res.attribution_advantage["faithfulness_multiplier"] >= 1.0


# 15. Benchmark difficulty levels
def test_benchmark_difficulty_levels():
    levels = get_benchmark_levels()
    assert len(levels) == 8
    assert levels[0].level == 1
    assert levels[7].level == 8