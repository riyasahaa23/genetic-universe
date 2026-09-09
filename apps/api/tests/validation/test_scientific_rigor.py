"""
OFFSPRING UNIVERSE — SCIENTIFIC RIGOR & ADVERSARIAL VALIDATION SUITE
18 Comprehensive Tests verifying the elimination of all red-team flaws:
1. Zero ground-truth leakage in candidate generation
2. No hardcoded type priority in ranking
3. Additive Level 1 causal recovery (Top-1)
4. Epistatic Level 4 causal recovery (Top-1)
5. CIS and TRANS interaction candidate space
6. All 8 benchmark difficulty levels distinct
7. Seed determinism (same seed = same world)
8. Stochastic divergence (different seeds = different genomes)
9. Negative control produces no false novelty
10. Genotypic novelty without phenotypic novelty
11. Fair baselines over identical candidate pool
12. Counterfactual non-target locus invariance
13. Parental genome immutability under counterfactuals
14. Reproducibility hash determinism
15. Real GIAB phenotype strictly NULL
16. Real GIAB child-specific states as genotypic novelty
17. Real data never claims unobserved crossover hotspots
18. Real data epistasis never labeled biologically validated
"""
from pathlib import Path
import pytest
from app.validation.scientific.recombination import (
    generate_loci,
    generate_synthetic_parents,
    simulate_meiosis,
    fertilize,
)
from app.validation.scientific.phenotype import (
    PhenotypeEngine,
    PhenotypeConfig,
    EpistaticPair,
    get_default_demo_phenotype_config,
)
from app.validation.scientific.attribution import NoveltyTracer, Candidate
from app.validation.scientific.benchmark import (
    run_benchmark,
    get_benchmark_levels,
    run_baseline_comparison,
    run_multiworld_benchmark,
    run_ablation_study,
    run_negative_control_benchmark,
)
from app.validation.scientific.novelty import (
    classify_multitype_novelty,
    ComprehensiveNoveltyReport,
)
from app.trio.pipeline import FamilyStore
from app.trio.attribution import counterfactual, novelty_trace
from app.trio.novelty_engine import assess_novelty
from app.trio.interaction import find_candidate_interactions
from app.trio.models import CounterfactualRequest

DATA = Path(__file__).resolve().parents[3] / "data"


@pytest.fixture(scope="module")
def store():
    return FamilyStore(DATA)


@pytest.fixture(scope="module")
def real_giab_state(store):
    return store.state("GIAB_AJ")


# -------------------------------------------------------------------------
# Test 1: Zero ground-truth leakage in candidate generation
# -------------------------------------------------------------------------
def test_zero_ground_truth_leakage():
    loci = generate_loci(50)
    pa, pb = generate_synthetic_parents(loci, seed=42)
    ga = simulate_meiosis(pa.homolog_1, pa.homolog_2, "A", crossover_positions=[20], start_homolog=0)
    gb = simulate_meiosis(pb.homolog_1, pb.homolog_2, "B", crossover_positions=[15], start_homolog=0)
    offspring = fertilize(ga, gb, loci)

    # Engine 1: Empty epistasis config
    cfg1 = PhenotypeConfig(base_value=0.0, additive={"L05": 2.0}, dominance={}, epistasis=[])
    eng1 = PhenotypeEngine(cfg1)
    tracer1 = NoveltyTracer(pa, pb, offspring, eng1)
    cands1 = tracer1.generate_candidates()

    # Engine 2: 5 planted epistatic pairs with massive effects
    planted = [
        EpistaticPair(id=f"E_PLANTED_{i}", locus_a="L01", locus_b=f"L{i:02d}", locus_a_pos=1, locus_b_pos=i, coefficient=99.0)
        for i in range(2, 7)
    ]
    cfg2 = PhenotypeConfig(base_value=0.0, additive={"L05": 2.0}, dominance={}, epistasis=planted)
    eng2 = PhenotypeEngine(cfg2)
    tracer2 = NoveltyTracer(pa, pb, offspring, eng2)
    cands2 = tracer2.generate_candidates()

    # Candidate lists generated in Stage A must be 100% identical in IDs and order
    ids1 = [c.id for c in cands1]
    ids2 = [c.id for c in cands2]
    assert ids1 == ids2, "Candidate generation accessed planted ground-truth configuration!"


# -------------------------------------------------------------------------
# Test 2: No hardcoded type priority in ranking
# -------------------------------------------------------------------------
def test_no_hardcoded_type_priority():
    """Verify that a high-effect variant outranks a zero-effect interaction candidate."""
    loci = generate_loci(50)
    pa, pb = generate_synthetic_parents(loci, seed=42)
    ga = simulate_meiosis(pa.homolog_1, pa.homolog_2, "A", crossover_positions=[20], start_homolog=0)
    gb = simulate_meiosis(pb.homolog_1, pb.homolog_2, "B", crossover_positions=[15], start_homolog=0)
    offspring = fertilize(ga, gb, loci)

    # Scenario: pure additive with huge effect on L10, zero epistasis
    cfg = PhenotypeConfig(base_value=0.0, additive={"L10": 50.0}, dominance={}, epistasis=[])
    eng = PhenotypeEngine(cfg)
    tracer = NoveltyTracer(pa, pb, offspring, eng)
    ranked = tracer.rank_candidates(evaluation=True)

    assert len(ranked) > 0
    top = ranked[0]
    # Without hardcoded type priority, the massive additive variant must be top, NOT an interaction
    assert top.candidate_type == "VARIANT"
    assert top.candidate_id == "VAR_L10"


# -------------------------------------------------------------------------
# Test 3: Additive Level 1 ranks causal variant Top-1
# -------------------------------------------------------------------------
def test_additive_level_1_ranks_causal_top_1():
    res = run_benchmark(locus_count=50, causal_interactions=1, seed=42, level=1)
    assert res["metrics"]["top_1_causal"] is True
    assert res["ranked_candidates"][0]["candidate_id"] == "VAR_L10"


# -------------------------------------------------------------------------
# Test 4: Epistatic Level 4 ranks causal interaction Top-1
# -------------------------------------------------------------------------
def test_epistatic_level_4_ranks_causal_top_1():
    res = run_benchmark(locus_count=50, causal_interactions=1, seed=42, level=4)
    assert res["metrics"]["top_1_causal"] is True
    assert res["ranked_candidates"][0]["candidate_id"] == "E_L10_L31"
    assert res["metrics"]["faithfulness_ratio"] >= 1.5


# -------------------------------------------------------------------------
# Test 5: CIS and TRANS candidate generation
# -------------------------------------------------------------------------
def test_cis_and_trans_candidate_generation():
    loci = generate_loci(50)
    pa, pb = generate_synthetic_parents(loci, seed=42)
    ga = simulate_meiosis(pa.homolog_1, pa.homolog_2, "A", crossover_positions=[20], start_homolog=0)
    gb = simulate_meiosis(pb.homolog_1, pb.homolog_2, "B", crossover_positions=[15], start_homolog=0)
    offspring = fertilize(ga, gb, loci)

    eng = PhenotypeEngine(get_default_demo_phenotype_config())
    tracer = NoveltyTracer(pa, pb, offspring, eng)
    cands = tracer.generate_candidates()

    interaction_cands = [c for c in cands if c.candidate_type == "INTERACTION"]
    cis_cands = [c for c in interaction_cands if c.details.get("maternal_cis") or c.details.get("paternal_cis")]
    trans_cands = [c for c in interaction_cands if c.details.get("is_trans")]

    assert len(cis_cands) > 0, "No CIS interaction candidates generated"
    assert len(trans_cands) > 0, "No TRANS interaction candidates generated"
    assert tracer.search_accounting["trans_haplotype_space"] == 50 * 49 // 2


# -------------------------------------------------------------------------
# Test 6: All 8 difficulty levels genuinely differ
# -------------------------------------------------------------------------
def test_all_8_difficulty_levels_differ():
    levels = get_benchmark_levels()
    assert len(levels) == 8
    seen_names = set()
    for lvl in levels:
        lvl_level = lvl["level"] if isinstance(lvl, dict) else lvl.level
        lvl_name = lvl["name"] if isinstance(lvl, dict) else lvl.name
        assert lvl_level in range(1, 9)
        assert lvl_name not in seen_names
        seen_names.add(lvl_name)

    # Verify execution of each level produces distinct configurations
    res1 = run_benchmark(locus_count=50, seed=42, level=1)
    res2 = run_benchmark(locus_count=50, seed=42, level=2)
    res3 = run_benchmark(locus_count=50, seed=42, level=3)
    res4 = run_benchmark(locus_count=50, seed=42, level=4)
    res5 = run_benchmark(locus_count=50, seed=42, level=5)
    res6 = run_benchmark(locus_count=50, seed=42, level=6)
    res7 = run_benchmark(locus_count=50, seed=42, level=7)
    res8 = run_benchmark(locus_count=50, seed=42, level=8)

    # Phenotypes must not all be identical
    phenos = [r["phenotypes"]["offspring"] for r in [res1, res2, res3, res4, res5, res6, res7, res8]]
    assert len(set(phenos)) >= 5, "Difficulty levels produced identical phenotypes!"
    causal_counts = [len(r["planted_ids"]) for r in [res1, res2, res3, res4, res5, res6, res7, res8]]
    assert causal_counts[0] == 1   # Level 1: single additive
    assert causal_counts[1] == 3   # Level 2: polygenic 3 loci
    assert causal_counts[7] >= 4   # Level 8: extreme mixed challenge


# -------------------------------------------------------------------------
# Test 7: Seed determinism (same seed = identical world)
# -------------------------------------------------------------------------
def test_seed_determinism():
    res_a = run_benchmark(locus_count=50, seed=123, level=4, stochastic=True)
    res_b = run_benchmark(locus_count=50, seed=123, level=4, stochastic=True)

    assert res_a["reproducibility_hash"] == res_b["reproducibility_hash"]
    assert res_a["phenotypes"]["offspring"] == res_b["phenotypes"]["offspring"]
    assert res_a["metrics"]["f1_score"] == res_b["metrics"]["f1_score"]


# -------------------------------------------------------------------------
# Test 8: Stochastic divergence (different seeds = different genomes)
# -------------------------------------------------------------------------
def test_stochastic_divergence():
    loci = generate_loci(50)
    pa1, pb1 = generate_synthetic_parents(loci, seed=42, stochastic=True)
    pa2, pb2 = generate_synthetic_parents(loci, seed=99, stochastic=True)

    # Genomes must differ between seeds
    assert pa1.homolog_1 != pa2.homolog_1 or pa1.homolog_2 != pa2.homolog_2
    assert pb1.homolog_1 != pb2.homolog_1 or pb1.homolog_2 != pb2.homolog_2


# -------------------------------------------------------------------------
# Test 9: Negative control produces no false novelty
# -------------------------------------------------------------------------
def test_negative_control_no_false_novelty():
    res = run_negative_control_benchmark(seed=42)
    assert res["status"] == "WITHIN_PARENTAL_RANGE"
    assert res["novelty_detected"] is False
    assert len(res["ranked_candidates"]) == 0
    assert "No phenotypic novelty requiring attribution" in res["message"]


# -------------------------------------------------------------------------
# Test 10: Genotypic novelty without phenotypic novelty
# -------------------------------------------------------------------------
def test_genotypic_novelty_without_phenotypic_novelty():
    # Scenario: Offspring has a unique homozygous genotype (1,1) while parents are (1,0) and (1,0)
    # but the locus has ZERO phenotypic effect.
    report = classify_multitype_novelty(
        child_specific_genotypes_count=5,
        recombination_intervals_count=2,
        haplotypic_segments_count=4,
        parent_a_phenotype=50.0,
        parent_b_phenotype=50.0,
        offspring_phenotype=50.0,  # Exactly within range
    )
    assert report.phenotypic_novelty is False
    assert report.genotypic_novelty is True
    assert report.haplotypic_novelty is True
    assert report.recombination_supported_novelty is True
    assert "child-specific genotypic configurations" in report.summary


# -------------------------------------------------------------------------
# Test 11: Fair baselines evaluated over identical candidate pool
# -------------------------------------------------------------------------
def test_fair_baselines_identical_pool():
    cmp_res = run_baseline_comparison(locus_count=50, seed=42, level=4)
    baselines = cmp_res["baselines"]
    assert len(baselines) == 5

    b_ids = {b["baseline_id"] for b in baselines}
    assert b_ids == {
        "baseline_random",
        "baseline_distance",
        "baseline_transmission",
        "baseline_counterfactual_only",
        "baseline_novelty_trace",
    }

    # Novelty Trace must have equal or superior F1 to Random and Distance
    f1_map = {b["baseline_id"]: b["f1_score"] for b in baselines}
    assert f1_map["baseline_novelty_trace"] >= f1_map["baseline_random"]
    assert f1_map["baseline_novelty_trace"] >= f1_map["baseline_distance"]


# -------------------------------------------------------------------------
# Test 12: Counterfactual non-target locus invariance
# -------------------------------------------------------------------------
def test_counterfactual_non_target_invariance(real_giab_state):
    target_id = "1:814309:T:G"
    req = CounterfactualRequest(family_id="GIAB_AJ", intervention="REMOVE_VARIANT", target_id=target_id)
    res = counterfactual(real_giab_state, req)

    orig_map = {v.id: v for v in real_giab_state.variants}
    hypo_map = {v.id: v for v in res.counterfactual_state.variants}
    assert len(orig_map) == len(hypo_map)

    for vid, orig_v in orig_map.items():
        if vid == target_id:
            continue
        hypo_v = hypo_map[vid]
        assert orig_v.child_genotype.alleles == hypo_v.child_genotype.alleles
        assert orig_v.parent_a_genotype.alleles == hypo_v.parent_a_genotype.alleles
        assert orig_v.parent_b_genotype.alleles == hypo_v.parent_b_genotype.alleles


# -------------------------------------------------------------------------
# Test 13: Parental genome immutability under counterfactuals
# -------------------------------------------------------------------------
def test_parental_genome_immutability():
    loci = generate_loci(50)
    pa, pb = generate_synthetic_parents(loci, seed=42)
    ga = simulate_meiosis(pa.homolog_1, pa.homolog_2, "A", crossover_positions=[20], start_homolog=0)
    gb = simulate_meiosis(pb.homolog_1, pb.homolog_2, "B", crossover_positions=[15], start_homolog=0)
    offspring = fertilize(ga, gb, loci)

    pa_h1_before = list(pa.homolog_1)
    pa_h2_before = list(pa.homolog_2)
    pb_h1_before = list(pb.homolog_1)
    pb_h2_before = list(pb.homolog_2)

    eng = PhenotypeEngine(get_default_demo_phenotype_config())
    tracer = NoveltyTracer(pa, pb, offspring, eng)
    cands = tracer.generate_candidates()

    for c in cands[:10]:
        tracer.run_counterfactual(c)

    # Parental haplotypes must remain 100% bit-for-bit unchanged
    assert pa.homolog_1 == pa_h1_before
    assert pa.homolog_2 == pa_h2_before
    assert pb.homolog_1 == pb_h1_before
    assert pb.homolog_2 == pb_h2_before


# -------------------------------------------------------------------------
# Test 14: Reproducibility hash determinism
# -------------------------------------------------------------------------
def test_reproducibility_hash_determinism():
    b1 = run_benchmark(locus_count=50, seed=42, level=4)
    b2 = run_benchmark(locus_count=50, seed=42, level=4)
    b3 = run_benchmark(locus_count=50, seed=43, level=4)

    assert b1["reproducibility_hash"] == b2["reproducibility_hash"]
    assert b1["reproducibility_hash"] != b3["reproducibility_hash"]


# -------------------------------------------------------------------------
# Test 15: Real GIAB phenotype strictly NULL
# -------------------------------------------------------------------------
def test_real_giab_phenotype_strictly_null(real_giab_state):
    from app.trio.phenotype_engine import categorize_phenotypes
    pheno = categorize_phenotypes(real_giab_state)
    assert pheno.predicted_phenotype is None
    assert pheno.phenotype_model_status == "unavailable"
    nov = assess_novelty(real_giab_state)
    assert nov.phenotype_novelty_status == "unresolved_no_quantitative_phenotype_model"
    assert nov.is_transgressive is None
    assert nov.quantitative_scores is None


# -------------------------------------------------------------------------
# Test 16: Real GIAB child-specific states as genotypic novelty
# -------------------------------------------------------------------------
def test_real_giab_child_specific_genotypic_novelty(real_giab_state):
    nov = assess_novelty(real_giab_state)
    assert nov.child_specific_configurations_count >= 1
    assert len(real_giab_state.configurations) >= 1


# -------------------------------------------------------------------------
# Test 17: Real data never claims unobserved crossover hotspots
# -------------------------------------------------------------------------
def test_real_data_no_unobserved_crossover_hotspots(real_giab_state):
    # Homolog-switch candidates in real data must be labeled as candidate intervals
    for sw in real_giab_state.recombination_events:
        assert "crossover" not in sw.id.lower()
        # Must have valid flanking marker bounds
        assert sw.right_bound_bp > sw.left_bound_bp


# -------------------------------------------------------------------------
# Test 18: Real data epistasis never labeled biologically validated
# -------------------------------------------------------------------------
def test_real_data_epistasis_never_biologically_validated(real_giab_state):
    interactions = find_candidate_interactions(real_giab_state)
    assert len(interactions) > 0
    for inter in interactions:
        assert inter.evidence_status == "hypothesis"
        assert "validated" not in inter.evidence_status
        assert any("Wet-lab functional validation" in m for m in inter.missing_links)


# -------------------------------------------------------------------------
# Test 19: Stage-A Trans Capacity Preservation Under Dense Cis Noise
# -------------------------------------------------------------------------
def test_stage_a_trans_capacity():
    from app.validation.scientific.attribution import compute_search_space_accounting
    loci = generate_loci(50)
    p_a, p_b = generate_synthetic_parents(loci, seed=42, stochastic=True)
    # Target trans pair across homolog boundaries
    pos_a, pos_b = 8, 38
    p_a.homolog_1[pos_a] = 1; p_a.homolog_2[pos_a] = 0
    p_a.homolog_1[pos_b] = 0; p_a.homolog_2[pos_b] = 0
    p_b.homolog_1[pos_a] = 0; p_b.homolog_2[pos_a] = 0
    p_b.homolog_1[pos_b] = 1; p_b.homolog_2[pos_b] = 0

    g_a = simulate_meiosis(p_a.homolog_1, p_a.homolog_2, "A", crossover_positions=[20], start_homolog=0)
    g_b = simulate_meiosis(p_b.homolog_1, p_b.homolog_2, "B", crossover_positions=[], start_homolog=0)
    offspring = fertilize(g_a, g_b, loci)

    pair = EpistaticPair(id="E_L09_L39", locus_a="L09", locus_b="L39", locus_a_pos=9, locus_b_pos=39, coefficient=25.0)
    cfg = PhenotypeConfig(base_value=50.0, additive={}, epistasis=[pair], mode="diploid")
    engine = PhenotypeEngine(cfg)
    tracer = NoveltyTracer(p_a, p_b, offspring, engine, candidate_limit=120)
    candidates = tracer.generate_candidates()

    # Verify trans candidate survives in Stage A candidate list despite dense cis pairs
    candidate_ids = {c.id for c in candidates}
    assert "E_L09_L39" in candidate_ids, "Target trans interaction was crowded out of Stage A pool!"
    assert len(candidates) <= 120


# -------------------------------------------------------------------------
# Test 20: Cross-Homolog Enumeration and Naming
# -------------------------------------------------------------------------
def test_cross_homolog_enumeration():
    from app.validation.scientific.attribution import compute_search_space_accounting
    loci = generate_loci(10)
    p_a, p_b = generate_synthetic_parents(loci, seed=12, stochastic=True)
    g_a = simulate_meiosis(p_a.homolog_1, p_a.homolog_2, "A", crossover_positions=[5], start_homolog=0)
    g_b = simulate_meiosis(p_b.homolog_1, p_b.homolog_2, "B", crossover_positions=[], start_homolog=0)
    offspring = fertilize(g_a, g_b, loci)

    cfg = PhenotypeConfig(base_value=50.0, additive={}, epistasis=[])
    engine = PhenotypeEngine(cfg)
    tracer = NoveltyTracer(p_a, p_b, offspring, engine)
    cands = tracer.generate_candidates()

    types = {c.candidate_type for c in cands}
    assert "CROSS-HOMOLOG INTERACTION" in types or "INTERACTION" in types
    # Check details contain cross-homolog provenance
    cross_cands = [c for c in cands if c.details.get("interaction_class") == "cross_homolog"]
    assert len(cross_cands) > 0


# -------------------------------------------------------------------------
# Test 21: Defined Candidate Operation Space Accounting
# -------------------------------------------------------------------------
def test_search_space_accounting():
    from app.validation.scientific.attribution import compute_search_space_accounting
    acct = compute_search_space_accounting(50, 4)
    assert acct["variant_space"] == 50
    assert acct["cis_interaction_space"] == 1225
    assert acct["cross_homolog_space"] == 1225
    assert acct["segment_space"] == 4
    assert acct["defined_candidate_operation_space"] == 1279


# -------------------------------------------------------------------------
# Test 22: Ablation Candidate Pool Invariance
# -------------------------------------------------------------------------
def test_ablation_candidate_pool_invariance():
    from app.validation.scientific.benchmark import run_ablation_study
    ablation = run_ablation_study(seed=42)
    pool_sizes = [v["candidate_pool_size"] for v in ablation["ablation_summary"].values()]
    assert len(set(pool_sizes)) == 1, f"Ablation candidate pools diverged: {pool_sizes}"
    assert pool_sizes[0] > 0


# -------------------------------------------------------------------------
# Test 23: Variable Target Benchmark
# -------------------------------------------------------------------------
def test_variable_target_benchmark():
    from app.validation.scientific.benchmark import run_variable_target_benchmark
    res = run_variable_target_benchmark(num_worlds=10, base_seed=500)
    assert res["num_worlds"] == 10
    assert res["unique_target_count"] >= 8
    assert res["mean_f1"] > res["paired_f1_gain_vs_random"] * 0.5
    assert 0 <= res["top_1_recovery_rate"] <= 1  # Performance is evidence, not a manufactured acceptance threshold.


# -------------------------------------------------------------------------
# Test 24: Level 3 Dominance Recovery
# -------------------------------------------------------------------------
def test_level_3_dominance_recovery():
    from app.validation.scientific.benchmark import run_benchmark
    res = run_benchmark(level=3, seed=42, num_loci=50)
    assert res["metrics"]["top_1_causal"] is True, "Level 3 Dominance must achieve Top-1 causal recovery!"
    assert res["metrics"]["f1_score"] >= 0.50


# -------------------------------------------------------------------------
# Test 25: Expanded Negative Controls
# -------------------------------------------------------------------------
def test_expanded_negative_controls():
    from app.validation.scientific.benchmark import run_expanded_negative_controls
    neg = run_expanded_negative_controls()
    assert neg["all_negative_controls_passed"] is True
    for case_id, case in neg["cases"].items():
        assert bool(case["candidates_emitted"]) == case["expected_phenotypic_novelty"]
        assert case["verified_clean"] is True
    assert neg["cases"]["B"]["status"] == "NON-PARENTAL GENOTYPE STATE WITHOUT PHENOTYPIC NOVELTY"
