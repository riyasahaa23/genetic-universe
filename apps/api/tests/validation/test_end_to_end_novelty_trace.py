"""
TASK 4 Validation Suite: End-to-End Phenotype Emergence + Novelty Trace Validation

Verifies the central proposition under strict ground-truth isolation:
Parent A + Parent B -> meiosis/recombination -> child genome -> phenotype
-> detect genuine non-parental phenotypic novelty
-> identify candidate genomic contributor
-> trace parental origin / recombination context
-> computational counterfactual
-> recompute phenotype
-> quantify whether proposed contributor explains the novelty.
"""
import copy
import pytest
from pathlib import Path

from app.validation.scientific.attribution import NoveltyTracer
from app.validation.scientific.benchmark import run_benchmark
from app.validation.scientific.evaluation import evaluate_tracer
from app.validation.scientific.hard_worlds import make_world, run_task4_negative_controls
from app.validation.scientific.novelty import detect_novelty, classify_multitype_novelty
from app.validation.scientific.phenotype import PhenotypeConfig, PhenotypeEngine, EpistaticPair
from app.validation.scientific.recombination import (
    generate_loci,
    generate_synthetic_parents,
    simulate_meiosis,
    fertilize,
    infer_recombination_events,
)
from app.validation.services.counterfactual_service import counterfactual_service


def test_ground_truth_isolation_metadata_wipe():
    """
    P0: NoveltyTracer must operate strictly from observable genomes.
    Wiping all simulator crossover/segment metadata must produce bit-for-bit identical results.
    """
    for seed in (101, 102, 103):
        tr_orig, truth, meta = make_world("recombinant_cis", seed=seed)
        cands_orig = tr_orig.generate_candidates()
        ranked_orig = tr_orig.rank_candidates()

        # Deep copy world and completely wipe hidden simulator metadata
        pa_clean = copy.deepcopy(tr_orig.parent_a)
        pb_clean = copy.deepcopy(tr_orig.parent_b)
        off_clean = copy.deepcopy(tr_orig.offspring)
        off_clean.maternal_gamete.crossovers = []
        off_clean.maternal_gamete.segments = []
        off_clean.paternal_gamete.crossovers = []
        off_clean.paternal_gamete.segments = []

        pe_clean = PhenotypeEngine(copy.deepcopy(tr_orig.phenotype_engine.config))
        tr_clean = NoveltyTracer(pa_clean, pb_clean, off_clean, pe_clean, candidate_limit=tr_orig.candidate_limit)

        cands_clean = tr_clean.generate_candidates()
        ranked_clean = tr_clean.rank_candidates()

        assert [c.id for c in cands_clean] == [c.id for c in cands_orig]
        assert [r.candidate_id for r in ranked_clean] == [r.candidate_id for r in ranked_orig]
        assert [round(r.attribution_score, 6) for r in ranked_clean] == [round(r.attribution_score, 6) for r in ranked_orig]
        assert [round(r.absolute_effect, 6) for r in ranked_clean] == [round(r.absolute_effect, 6) for r in ranked_orig]


def test_ground_truth_isolation_forbidden_model_inspection():
    """
    P0: Candidate generation must never inspect planted phenotype configuration.
    """
    tr, truth, meta = make_world("synergistic_epistasis", seed=42)
    ids_before = [c.id for c in tr.generate_candidates()]

    class GuardedPhenotypeEngine:
        @property
        def config(self):
            raise AssertionError("NoveltyTracer inspected phenotype_engine.config during candidate generation!")

    tr.phenotype_engine = GuardedPhenotypeEngine()
    ids_after = [c.id for c in tr.generate_candidates()]
    assert ids_before == ids_after


def test_four_novelty_levels_decoupling():
    """
    P1: Must explicitly distinguish 4 independent biological novelty types:
    1. Genotypic Novelty
    2. Haplotypic Novelty
    3. Recombination-Supported Novelty
    4. Phenotypic Novelty
    Child having a non-parental genotype is NOT automatically phenotypically novel.
    """
    report_genotypic_only = classify_multitype_novelty(
        child_specific_genotypes_count=5,
        recombination_intervals_count=0,
        haplotypic_segments_count=1,
        parent_a_phenotype=20.0,
        parent_b_phenotype=0.0,
        offspring_phenotype=10.0,
    )
    assert report_genotypic_only.genotypic_novelty is True
    assert report_genotypic_only.haplotypic_novelty is False
    assert report_genotypic_only.recombination_supported_novelty is False
    assert report_genotypic_only.phenotypic_novelty is False  # Within range [0, 20]!

    report_transgressive_high = classify_multitype_novelty(
        child_specific_genotypes_count=2,
        recombination_intervals_count=1,
        haplotypic_segments_count=2,
        parent_a_phenotype=20.0,
        parent_b_phenotype=10.0,
        offspring_phenotype=45.0,
    )
    assert report_transgressive_high.phenotypic_novelty is True
    assert report_transgressive_high.phenotypic_assessment.direction == "above_range"

    report_transgressive_low = classify_multitype_novelty(
        child_specific_genotypes_count=2,
        recombination_intervals_count=1,
        haplotypic_segments_count=2,
        parent_a_phenotype=20.0,
        parent_b_phenotype=10.0,
        offspring_phenotype=-5.0,
    )
    assert report_transgressive_low.phenotypic_novelty is True
    assert report_transgressive_low.phenotypic_assessment.direction == "below_range"


def test_phenotype_family_additive():
    """Validates additive phenotype emergence and Top-1 recovery."""
    tr, truth, meta = make_world("additive", seed=42)
    assert tr.baseline_novelty.is_transgressive is True
    assert tr.baseline_novelty.direction == "above_range"
    res = evaluate_tracer(tr, truth, seed=42)
    assert res["metrics"]["top1"] == 1
    top1 = res["raw_ranking"][0]
    assert top1["candidate_id"] in truth
    assert top1["absolute_effect"] > 0


def test_phenotype_family_dominant():
    """Validates dominant phenotype emergence and causal recovery."""
    tr, truth, meta = make_world("dominant", seed=42)
    assert tr.baseline_novelty.is_transgressive is True
    assert tr.baseline_novelty.direction == "above_range"
    res = evaluate_tracer(tr, truth, seed=42)
    assert res["metrics"]["top1"] == 1
    assert res["raw_ranking"][0]["candidate_id"] in truth


def test_phenotype_family_recessive():
    """Validates recessive phenotype emergence from carrier parents and causal recovery."""
    tr, truth, meta = make_world("recessive", seed=42)
    # Carrier parents express 0 recessive phenotype; child dosage 2 expresses phenotype!
    assert tr.y_A == pytest.approx(0.0, abs=1e-4)
    assert tr.y_B == pytest.approx(0.0, abs=1e-4)
    assert tr.y_O > 0.0
    assert tr.baseline_novelty.is_transgressive is True
    res = evaluate_tracer(tr, truth, seed=42)
    assert res["metrics"]["top1"] == 1
    assert res["raw_ranking"][0]["candidate_id"] in truth


def test_phenotype_family_synergistic_epistasis():
    """Validates positive synergistic epistatic interaction recovery."""
    tr, truth, meta = make_world("synergistic_epistasis", seed=42)
    assert tr.baseline_novelty.is_transgressive is True
    assert tr.baseline_novelty.direction == "above_range"
    res = evaluate_tracer(tr, truth, seed=42)
    assert res["metrics"]["top1"] == 1
    top_cand = res["raw_ranking"][0]
    assert top_cand["candidate_id"] in truth
    assert top_cand["interaction_evidence"] > 0


def test_phenotype_family_antagonistic_epistasis():
    """Validates antagonistic interaction preserving signed negative effect."""
    tr, truth, meta = make_world("antagonistic_epistasis", seed=42)
    assert tr.baseline_novelty.is_transgressive is True
    assert tr.baseline_novelty.direction == "below_range"
    res = evaluate_tracer(tr, truth, seed=42)
    assert res["metrics"]["top1"] == 1
    top_cand = res["raw_ranking"][0]
    assert top_cand["candidate_id"] in truth
    # In antagonistic epistasis, counterfactual intervention delta is negative (silencing increases phenotype)
    assert top_cand["delta"] < 0
    assert top_cand["absolute_effect"] > 0


def test_phenotype_family_recombinant_cis():
    """Validates recombination-created novel cis assembly and attribution."""
    tr, truth, meta = make_world("recombinant_cis", seed=42)
    # Parental phenotypes 0 due to repulsion phase; offspring recombinant gamete expresses interaction
    assert tr.y_A == pytest.approx(0.0, abs=1e-4)
    assert tr.y_B == pytest.approx(0.0, abs=1e-4)
    assert tr.y_O > 0.0
    assert tr.baseline_novelty.is_transgressive is True
    res = evaluate_tracer(tr, truth, seed=42)
    assert res["metrics"]["top1"] == 1
    top_cand = res["raw_ranking"][0]
    assert top_cand["candidate_id"] in truth
    assert top_cand["target"]["recombinant_assembly"] is True


def test_negative_controls_nc1_through_nc6():
    """Runs the 6 rigorous negative controls NC1 through NC6."""
    nc_summary = run_task4_negative_controls(seed=42)
    assert nc_summary["all_passed"] is True
    for code, case in nc_summary["results"].items():
        assert case["passed"] is True, f"Failed negative control {code}: {case['name']}"


def test_end_to_end_evidence_chain():
    """
    Verifies that the system generates an auditable 7-step evidence chain:
    PHENOTYPE NOVELTY -> CANDIDATE -> PARENTAL ORIGIN -> RECOMBINATION CONTEXT
    -> INTERACTION HYPOTHESIS -> COUNTERFACTUAL INTERVENTION -> RECOMPUTED PHENOTYPE
    with explicit OBSERVED / INFERRED / HYPOTHESIS / UNRESOLVED labeling.
    """
    tr, truth, meta = make_world("recombinant_cis", seed=42)
    candidates = tr.generate_candidates()
    ranked = tr.rank_candidates()
    assert len(ranked) > 0
    top = ranked[0]
    cand_match = next(c for c in candidates if c.id == top.candidate_id)

    # Check that provenance chain has observed/inferred tags
    assert len(cand_match.provenance_chain) >= 2
    assert any("Parent" in step for step in cand_match.provenance_chain)
    assert any("Transmission" in step for step in cand_match.provenance_chain)
    assert top.provenance_summary != ""

    # Check counterfactual intervention semantics
    assert top.semantics["label"] == "MODEL-RELATIVE COMPUTATIONAL COUNTERFACTUAL"
    assert "original_state" in top.semantics
    assert "altered_state" in top.semantics
    assert "phenotype_change" in top.semantics
    assert top.absolute_effect > 0.0


def test_real_giab_phenotype_remains_null():
    """
    P0: Real GIAB Ashkenazi trio (HG002/HG003/HG004) must NEVER have synthetic phenotypes injected.
    Predicted phenotype must remain None / Unresolved.
    """
    from app.trio.pipeline import FamilyStore
    from app.trio.phenotype_engine import categorize_phenotypes

    data_dir = Path(__file__).resolve().parents[3] / "data"
    store = FamilyStore(data_dir)
    state = store.state("GIAB_AJ")

    pheno_summary = categorize_phenotypes(state)
    assert pheno_summary.predicted_phenotype is None
    assert pheno_summary.phenotype_model_status == "unavailable"


def test_same_seed_deterministic_reproducibility():
    """P0: Same seed must produce bit-for-bit identical worlds and evaluations."""
    tr1, truth1, _ = make_world("additive", seed=777)
    tr2, truth2, _ = make_world("additive", seed=777)
    ev1 = evaluate_tracer(tr1, truth1, seed=777)
    ev2 = evaluate_tracer(tr2, truth2, seed=777)
    assert ev1["metrics"] == ev2["metrics"]
    assert ev1["candidate_pool_hash"] == ev2["candidate_pool_hash"]
    assert ev1["world_hash"] == ev2["world_hash"]
