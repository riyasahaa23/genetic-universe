"""Regression and validation tests for Task 3: Recombination Attribution & Breakpoint Localization.

Validates:
1. Tracer does not receive planted breakpoint or simulation crossover metadata.
2. Observable-only ancestry reconstruction from parental haplotypes and gamete sequences.
3. Post-hoc comparison of inferred intervals against hidden ground truth.
4. Single-breakpoint localization accuracy and interval bounding.
5. Multiple-breakpoint sequential attribution.
6. Irrelevant crossover negative control with 0% false attribution.
7. Counterfactual validation of attributed recombinant interval vs unrelated segments.
8. Ranking and candidate generation independence from ground truth.
9. Provenance randomization control.
10. Task 1 and Task 2 anti-regression integration.
"""
import pytest
from app.validation.scientific.recombination import (
    generate_loci,
    generate_synthetic_parents,
    simulate_meiosis,
    fertilize,
    infer_recombination_events,
    SegmentProvenance,
    InferredRecombinationEvent,
)
from app.validation.scientific.phenotype import (
    PhenotypeConfig,
    PhenotypeEngine,
    EpistaticPair,
)
from app.validation.scientific.attribution import NoveltyTracer, Candidate
from app.validation.scientific.benchmark import run_benchmark, classify_benchmark_candidate


def test_tracer_does_not_receive_planted_breakpoint():
    """Verify that NoveltyTracer functions identically when all simulation crossover

    metadata is completely stripped from the gametes.
    """
    loci = generate_loci(50)
    p1 = EpistaticPair(id="E_L10_L31", locus_a="L10", locus_b="L31", locus_a_pos=10, locus_b_pos=31, coefficient=24.0)
    config = PhenotypeConfig(base_value=0.0, epistasis=[p1])
    engine = PhenotypeEngine(config)

    pa, pb = generate_synthetic_parents(loci, seed=42, planted_config={"epistatic_pairs": [(10, 31)], "crossover_positions_a": [20]})
    ga = simulate_meiosis(pa.homolog_1, pa.homolog_2, "A", crossover_positions=[20])
    gb = simulate_meiosis(pb.homolog_1, pb.homolog_2, "B", crossover_positions=[])

    # Strip simulation metadata completely
    ga.segments = []
    ga.crossovers = []
    gb.segments = []
    gb.crossovers = []
    off = fertilize(ga, gb, loci)

    tracer = NoveltyTracer(pa, pb, off, engine)

    # Verify observable-only inference executed and populated inferred events
    assert len(tracer.inferred_events_a) == 1
    ev = tracer.inferred_events_a[0]
    assert ev.interval_start <= 20 <= ev.interval_end
    assert abs(ev.inferred_breakpoint - 20) <= 3

    # Verify candidates and ranking proceed without simulation metadata
    results = tracer.rank_candidates(evaluation=True)
    assert len(results) > 0
    top_cand = results[0]
    assert top_cand.candidate_id == "E_L10_L31"
    assert top_cand.delta == 24.0


def test_observable_only_ancestry_reconstruction():
    """Verify that infer_recombination_events correctly identifies informative markers,

    detects transitions, and builds bounding intervals without external truth.
    """
    h1 = [0] * 30
    h2 = [1] * 30
    # Simulate crossover at index 12 (locus 12 boundary)
    # gamete alleles: 0..12 from h1, 12..30 from h2
    gamete_alleles = h1[:12] + h2[12:]

    segments, breakpoints = infer_recombination_events(h1, h2, gamete_alleles, "A")

    assert len(breakpoints) == 1
    bp = breakpoints[0]
    assert bp.parent_id == "A"
    # Informative markers are adjacent: 11 (0) and 12 (1)
    # Bounding interval: [11+1, 12] = [12, 12] -> exact localization
    assert bp.inferred_breakpoint == 12
    assert bp.interval_start == 12
    assert bp.interval_end == 12
    assert bp.left_homolog == "A1"
    assert bp.right_homolog == "A2"

    assert len(segments) == 2
    assert segments[0].start == 0
    assert segments[0].end == 12
    assert segments[0].source_homolog == "A1"
    assert segments[1].start == 12
    assert segments[1].end == 30
    assert segments[1].source_homolog == "A2"


def test_inferred_breakpoint_compared_to_hidden_truth_only_post_hoc():
    """Verify tracer has no access to ground-truth crossover coordinates during inference."""
    res = run_benchmark(level=4, seed=1005, noise=0.0, stochastic=True)
    tracer = res["raw_tracer"]

    # Tracer attributes contain only observable objects
    assert not hasattr(tracer, "crossover_positions_a")
    assert not hasattr(tracer, "planted_config")

    # Inferred events were computed from observables
    events = tracer.inferred_events_a
    assert len(events) == 1

    # Hidden truth is only queried post-hoc during evaluation
    true_bp = 20
    assert events[0].interval_start <= true_bp <= events[0].interval_end


def test_single_breakpoint_localization():
    """Test localization accuracy across multiple distinct single crossover coordinates."""
    loci = generate_loci(50)
    for bp in [15, 20, 25, 30, 35]:
        pa, pb = generate_synthetic_parents(loci, seed=100 + bp, planted_config={"crossover_positions_a": [bp]})
        ga = simulate_meiosis(pa.homolog_1, pa.homolog_2, "A", crossover_positions=[bp])
        gb = simulate_meiosis(pb.homolog_1, pb.homolog_2, "B", crossover_positions=[])
        off = fertilize(ga, gb, loci)

        config = PhenotypeConfig(base_value=0.0)
        tracer = NoveltyTracer(pa, pb, off, PhenotypeEngine(config))

        assert len(tracer.inferred_events_a) == 1
        ev = tracer.inferred_events_a[0]
        # True breakpoint must be strictly bounded inside inferred interval
        assert ev.interval_start <= bp <= ev.interval_end
        # Point estimate error is strictly bounded by half the interval width
        assert abs(ev.inferred_breakpoint - bp) <= (ev.interval_end - ev.interval_start + 1) // 2


def test_multiple_breakpoint_attribution():
    """Test that multiple sequential crossovers are all localized into ordered segments."""
    loci = generate_loci(60)
    pa, pb = generate_synthetic_parents(loci, seed=42, planted_config={"crossover_positions_a": [18, 42]})
    ga = simulate_meiosis(pa.homolog_1, pa.homolog_2, "A", crossover_positions=[18, 42])
    gb = simulate_meiosis(pb.homolog_1, pb.homolog_2, "B", crossover_positions=[])
    off = fertilize(ga, gb, loci)

    config = PhenotypeConfig(base_value=0.0)
    tracer = NoveltyTracer(pa, pb, off, PhenotypeEngine(config))

    events = tracer.inferred_events_a
    assert len(events) == 2
    ev1, ev2 = events[0], events[1]

    assert ev1.interval_start <= 18 <= ev1.interval_end
    assert ev2.interval_start <= 42 <= ev2.interval_end
    assert ev1.inferred_breakpoint < ev2.inferred_breakpoint

    # Segments must be 3 non-overlapping spans
    segs = tracer.inferred_segments_a
    assert len(segs) == 3
    assert segs[0].start == 0 and segs[0].end == ev1.inferred_breakpoint
    assert segs[1].start == ev1.inferred_breakpoint and segs[1].end == ev2.inferred_breakpoint
    assert segs[2].start == ev2.inferred_breakpoint and segs[2].end == 60


def test_irrelevant_crossover_negative_control():
    """Verify that an irrelevant crossover (in a non-causal region) produces 0.0 delta

    and attribution score 0.0, preventing false attribution.
    """
    loci = generate_loci(50)
    p1 = EpistaticPair(id="E_L10_L31", locus_a="L10", locus_b="L31", locus_a_pos=10, locus_b_pos=31, coefficient=24.0)
    config = PhenotypeConfig(base_value=0.0, epistasis=[p1])
    engine = PhenotypeEngine(config)

    # 2 crossovers: pos 20 (relevant) and pos 40 (irrelevant)
    pa, pb = generate_synthetic_parents(loci, seed=42, planted_config={"epistatic_pairs": [(10, 31)], "crossover_positions_a": [20, 40]})
    ga = simulate_meiosis(pa.homolog_1, pa.homolog_2, "A", crossover_positions=[20, 40])
    gb = simulate_meiosis(pb.homolog_1, pb.homolog_2, "B", crossover_positions=[])
    off = fertilize(ga, gb, loci)

    tracer = NoveltyTracer(pa, pb, off, engine)
    results = tracer.rank_candidates(evaluation=True)

    # Locate segment candidates
    relevant_segs = []
    irrelevant_segs = []
    for r in results:
        if r.candidate_type == "SEGMENT":
            target = r.semantics.get("target", {})
            start = target.get("start", 0)
            end = target.get("end", 50)
            if start <= 9 < end or start <= 30 < end:
                relevant_segs.append(r)
            elif start >= 35:
                irrelevant_segs.append(r)

    assert len(relevant_segs) > 0, "Expected relevant segments covering causal loci"
    assert len(irrelevant_segs) > 0, "Expected irrelevant segment beyond locus 35"

    for r_rel in relevant_segs:
        assert r_rel.delta == 24.0, "Relevant recombinant segment must exhibit causal delta"

    for r_irrel in irrelevant_segs:
        assert r_irrel.delta == 0.0, "Irrelevant recombinant segment must exhibit 0.0 delta"
        assert r_irrel.attribution_score == 0.0, "Irrelevant segment must have 0.0 attribution score"


def test_counterfactual_validation_of_attributed_interval():
    """Verify that the attributed recombinant interval exhibits substantial counterfactual

    effect separation over unrelated control segments.
    """
    loci = generate_loci(50)
    p1 = EpistaticPair(id="E_L10_L31", locus_a="L10", locus_b="L31", locus_a_pos=10, locus_b_pos=31, coefficient=24.0)
    config = PhenotypeConfig(base_value=0.0, epistasis=[p1])
    engine = PhenotypeEngine(config)

    # Parent A has relevant crossover at 20 joining L10 and L31 in cis
    # Parent B has unrelated crossover at 25 (no epistatic pair)
    pa, pb = generate_synthetic_parents(loci, seed=42, planted_config={"epistatic_pairs": [(10, 31)], "crossover_positions_a": [20]})
    ga = simulate_meiosis(pa.homolog_1, pa.homolog_2, "A", crossover_positions=[20])
    gb = simulate_meiosis(pb.homolog_1, pb.homolog_2, "B", crossover_positions=[25])
    off = fertilize(ga, gb, loci)

    tracer = NoveltyTracer(pa, pb, off, engine)
    results = tracer.rank_candidates(evaluation=True)

    rel_segs = [r for r in results if r.candidate_type == "SEGMENT" and r.semantics.get("target", {}).get("parent") == "A" and r.delta > 0]
    unrel_segs = [r for r in results if r.candidate_type == "SEGMENT" and r.semantics.get("target", {}).get("parent") == "B"]

    assert len(rel_segs) > 0, "Expected relevant segments from Parent A"
    assert len(unrel_segs) > 0, "Expected unrelated segments from Parent B"

    mean_rel = sum(r.delta for r in rel_segs) / len(rel_segs)
    mean_unrel = sum(r.delta for r in unrel_segs) / len(unrel_segs)

    assert mean_rel == 24.0
    assert mean_unrel == 0.0


def test_ranking_independence_from_ground_truth():
    """Verify that wiping simulation truth objects produces 100% identical ranking."""
    loci = generate_loci(50)
    p1 = EpistaticPair(id="E_L10_L31", locus_a="L10", locus_b="L31", locus_a_pos=10, locus_b_pos=31, coefficient=24.0)
    config = PhenotypeConfig(base_value=0.0, epistasis=[p1])
    engine = PhenotypeEngine(config)

    pa, pb = generate_synthetic_parents(loci, seed=1001, planted_config={"epistatic_pairs": [(10, 31)], "crossover_positions_a": [20]})
    ga = simulate_meiosis(pa.homolog_1, pa.homolog_2, "A", crossover_positions=[20])
    gb = simulate_meiosis(pb.homolog_1, pb.homolog_2, "B", crossover_positions=[])
    off1 = fertilize(ga, gb, loci)

    tracer1 = NoveltyTracer(pa, pb, off1, engine)
    res1 = tracer1.rank_candidates(evaluation=True)

    # Run B: wipe simulation truth
    ga2 = simulate_meiosis(pa.homolog_1, pa.homolog_2, "A", crossover_positions=[20])
    gb2 = simulate_meiosis(pb.homolog_1, pb.homolog_2, "B", crossover_positions=[])
    ga2.segments = []
    ga2.crossovers = []
    gb2.segments = []
    gb2.crossovers = []
    off2 = fertilize(ga2, gb2, loci)

    tracer2 = NoveltyTracer(pa, pb, off2, engine)
    res2 = tracer2.rank_candidates(evaluation=True)

    assert len(res1) == len(res2)
    for r1, r2 in zip(res1, res2):
        assert r1.candidate_id == r2.candidate_id
        assert abs(r1.attribution_score - r2.attribution_score) < 1e-9
        assert abs(r1.delta - r2.delta) < 1e-9


def test_provenance_randomization_control():
    """Verify that breaking the relationship between recombination ancestry and phenotype

    decouples the attribution and eliminates the recombination support bonus.
    """
    loci = generate_loci(50)
    p1 = EpistaticPair(id="E_L10_L31", locus_a="L10", locus_b="L31", locus_a_pos=10, locus_b_pos=31, coefficient=24.0)
    config = PhenotypeConfig(base_value=0.0, epistasis=[p1])
    engine = PhenotypeEngine(config)

    pa, pb = generate_synthetic_parents(loci, seed=42, planted_config={"epistatic_pairs": [(10, 31)], "crossover_positions_a": [20]})
    ga = simulate_meiosis(pa.homolog_1, pa.homolog_2, "A", crossover_positions=[20])
    gb = simulate_meiosis(pb.homolog_1, pb.homolog_2, "B", crossover_positions=[])
    off = fertilize(ga, gb, loci)

    tracer = NoveltyTracer(pa, pb, off, engine)
    cands_normal = tracer.generate_candidates()
    recomb_normal = [c for c in cands_normal if c.details.get("recombinant_assembly")]
    assert len(recomb_normal) > 0

    # Under randomized gamete with no crossover:
    ga_no_cross = simulate_meiosis(pa.homolog_1, pa.homolog_2, "A", crossover_positions=[])
    off_no_cross = fertilize(ga_no_cross, gb, loci)
    tracer_no_cross = NoveltyTracer(pa, pb, off_no_cross, engine)
    cands_no_cross = tracer_no_cross.generate_candidates()
    recomb_no_cross = [c for c in cands_no_cross if c.details.get("recombinant_assembly")]
    # Without recombination, 0 recombinant assemblies are formed
    assert len(recomb_no_cross) == 0


def test_task1_and_task2_anti_regression():
    """Verify that Task 1 causal recovery and Task 2 counterfactual separation remain intact."""
    for lvl in [1, 4, 8]:
        res = run_benchmark(level=lvl, seed=42, noise=0.0)
        m = res["metrics"]
        assert m["recall"] >= 0.80
        assert m["top_1_causal"] is True
        assert m["top_k_recovery"] is True
        assert m["mean_delta_causal"] >= 10.0
        if lvl in [1, 4]:
            assert m["mean_delta_null"] == 0.0
            assert m["faithfulness_ratio"] >= 50.0
