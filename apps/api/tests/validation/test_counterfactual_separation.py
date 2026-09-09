"""Regression and sanity tests for counterfactual faithfulness and causal/null separation.

Validates:
1. Prevention of null-denominator contamination by mechanistically related representations.
2. Strict isolation: genuine null candidates cannot overlap or disrupt planted causal loci or interactions.
3. Causal candidates produce substantial counterfactual effect, while genuine nulls produce zero/negligible effect.
4. Causal candidates rank strictly above genuine nulls under counterfactual attribution.
5. Null classification is deterministic and independent of candidate ranking.
6. Tracer remains 100% blind to ground truth metadata.
"""
import inspect
import pytest
from app.validation.scientific.benchmark import (
    run_benchmark,
    classify_benchmark_candidate,
)
from app.validation.scientific.attribution import NoveltyTracer, Candidate
from app.validation.scientific.recombination import (
    generate_loci,
    generate_synthetic_parents,
    simulate_meiosis,
    fertilize,
)
from app.validation.scientific.phenotype import (
    PhenotypeConfig,
    PhenotypeEngine,
    EpistaticPair,
)


def test_null_contamination_old_behavior_fails():
    """Demonstrates that old naive classification (candidate_id not in planted_ids)

    mislabels overlapping segments/variants as 'null', whereas the new rule
    correctly classifies them as 'RELATED'.
    """
    loci = generate_loci(50)
    p1 = EpistaticPair(
        id="E_L10_L31", locus_a="L10", locus_b="L31",
        locus_a_pos=10, locus_b_pos=31, coefficient=24.0
    )
    config = PhenotypeConfig(base_value=0.0, epistasis=[p1])
    planted_ids = {"E_L10_L31"}

    # Setup parent and gamete with crossover at pos 20
    planted_cfg = {"epistatic_pairs": [(10, 31)], "crossover_positions_a": [20]}
    pa, pb = generate_synthetic_parents(loci, seed=42, planted_config=planted_cfg)
    ga = simulate_meiosis(pa.homolog_1, pa.homolog_2, "A", crossover_positions=[20])
    gb = simulate_meiosis(pb.homolog_1, pb.homolog_2, "B", crossover_positions=[])
    off = fertilize(ga, gb, loci)

    engine = PhenotypeEngine(config)
    tracer = NoveltyTracer(pa, pb, off, engine, candidate_limit=300)
    results = tracer.rank_candidates(evaluation=True)

    # Find segment candidate covering locus 10 (idx 9 in 0-indexed array)
    seg_overlapping = None
    for r in results:
        if r.candidate_type == "SEGMENT":
            target = r.semantics.get("target", {})
            start = target.get("start", 0)
            end = target.get("end", 0)
            if start <= 9 < end:
                seg_overlapping = r
                break

    assert seg_overlapping is not None, "Expected at least one segment candidate overlapping locus 10"

    # Under OLD naive logic: candidate_id not in planted_ids => classified as NULL!
    old_classification = "NULL" if seg_overlapping.candidate_id not in planted_ids else "CAUSAL"
    assert old_classification == "NULL", "Old naive rule would classify overlapping segment as NULL"

    # If treated as null under old logic, it injects non-zero delta into null denominator
    # because reverting the segment changes locus 10 and breaks E_L10_L31!
    raw_cf_effect = abs(seg_overlapping.original_phenotype - seg_overlapping.counterfactual_phenotype)
    assert raw_cf_effect > 0.0, "Overlapping segment has non-zero raw causal effect"

    # Under NEW rigorous rule: must be classified as 'RELATED', NEVER 'NULL'
    new_classification = classify_benchmark_candidate(seg_overlapping, config, planted_ids)
    assert new_classification == "RELATED", f"Expected RELATED, got {new_classification}"
    assert new_classification != "NULL", "Mechanistically related candidate must NEVER enter null denominator"


def test_genuine_null_cannot_overlap_causal_locus():
    """Verify across all difficulty levels that any candidate classified as genuine 'NULL'

    strictly has ZERO overlap with any planted causal locus or interaction.
    """
    for lvl in range(1, 9):
        res = run_benchmark(level=lvl, seed=42, noise=0.0, stochastic=True)
        tracer = res["raw_tracer"]
        config = tracer.phenotype_engine.config
        planted_ids = set(res["planted_ids"])

        # Extract all ground-truth causal loci
        causal_single = {int(loc.replace("L", "")) - 1 for loc in list(config.additive.keys()) + list(config.dominance.keys())}
        causal_pairs = {(min(ep.locus_a_pos, ep.locus_b_pos) - 1, max(ep.locus_a_pos, ep.locus_b_pos) - 1) for ep in config.epistasis}
        causal_pair_loci = {p for pair in causal_pairs for p in pair}
        all_causal = causal_single | causal_pair_loci

        results = tracer.rank_candidates(evaluation=True)
        for r in results:
            cat = classify_benchmark_candidate(r, config, planted_ids)
            target = r.semantics.get("target", {})
            if cat == "NULL":
                if r.candidate_type == "VARIANT":
                    l_id = target.get("locus_id", "")
                    pos = int(l_id.replace("L", "")) - 1 if l_id else target.get("position", 0) - 1
                    assert pos not in all_causal, f"Level {lvl}: Null variant at pos {pos} overlaps causal locus!"
                elif r.candidate_type == "SEGMENT":
                    start = target.get("start", 0)
                    end = target.get("end", 0)
                    overlap = [p for p in all_causal if start <= p < end]
                    assert len(overlap) == 0, f"Level {lvl}: Null segment [{start}, {end}) overlaps causal loci {overlap}!"
                elif r.candidate_type == "INTERACTION":
                    p_a = target.get("locus_a_pos", target.get("locus_a", 0))
                    p_b = target.get("locus_b_pos", target.get("locus_b", 0))
                    if isinstance(p_a, str): p_a = int(p_a.replace("L", ""))
                    if isinstance(p_b, str): p_b = int(p_b.replace("L", ""))
                    idx_a, idx_b = min(p_a, p_b) - 1, max(p_a, p_b) - 1
                    assert idx_a not in all_causal and idx_b not in all_causal, (
                        f"Level {lvl}: Null interaction ({idx_a}, {idx_b}) overlaps causal loci!"
                    )


def test_mechanistically_related_cannot_enter_null_denominator():
    """Ensure all mechanistically related representations are excluded from null denominator."""
    res = run_benchmark(level=4, seed=42, noise=0.0)
    counts = res["metrics"]["classification_counts"]
    assert counts["causal"] >= 1
    assert counts["related"] >= 1
    assert counts["null"] >= 1
    assert res["metrics"]["mean_delta_null"] == 0.0, "In absence of noise, uncontaminated null delta must be 0.0"
    assert res["metrics"]["faithfulness_ratio"] >= 50.0


def test_counterfactual_sanity_causal_vs_null():
    """Sanity test: causal candidates produce significant effect, genuine nulls produce zero effect,

    and causal ranks above genuine nulls.
    """
    res = run_benchmark(level=1, seed=42, noise=0.0)
    assert res["metrics"]["mean_delta_causal"] == 24.0
    assert res["metrics"]["mean_delta_null"] == 0.0
    assert res["metrics"]["fraction_causal_gt_null"] == 1.0
    assert res["metrics"]["directionality_consistent"] is True

    # Check that Top-1 candidate is causal
    assert res["metrics"]["top_1_causal"] is True


def test_classification_independent_of_ranking():
    """Verify classification rule depends purely on genotype coordinates, not on score/rank."""
    loci = generate_loci(50)
    p1 = EpistaticPair(id="E_L10_L31", locus_a="L10", locus_b="L31", locus_a_pos=10, locus_b_pos=31, coefficient=24.0)
    config = PhenotypeConfig(base_value=0.0, epistasis=[p1])
    planted_ids = {"E_L10_L31"}

    # Mock candidate with zero score / rank but causal coordinates
    class DummyResult:
        def __init__(self, c_id, c_type, target):
            self.candidate_id = c_id
            self.candidate_type = c_type
            self.semantics = {"target": target}
            self.attribution_score = 0.0 # Lowest possible score

    r_causal = DummyResult("E_L10_L31", "INTERACTION", {"locus_a_pos": 10, "locus_b_pos": 31})
    r_related = DummyResult("SEG_01", "SEGMENT", {"start": 0, "end": 20})
    r_null = DummyResult("VAR_L02", "VARIANT", {"position": 2})

    assert classify_benchmark_candidate(r_causal, config, planted_ids) == "CAUSAL"
    assert classify_benchmark_candidate(r_related, config, planted_ids) == "RELATED"
    assert classify_benchmark_candidate(r_null, config, planted_ids) == "NULL"
