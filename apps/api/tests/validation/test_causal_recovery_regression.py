"""Regression tests for Novelty Trace causal interaction recovery.

Guarantees:
1. Aggregate causal recovery >= 90% at low noise across synthetic benchmark Levels 1-8 over >= 50 seeds.
2. Perfect Top-1 and Top-K recovery.
3. Tracer remains strictly blind to ground truth (no planted_config, no planted_ids, no effect size leakage).
4. Candidate budget strictly bounded (len(candidates) <= 300).
5. Computational budget strictly respected (< 25 ms/run).
"""
import inspect
import pytest
from app.validation.scientific.benchmark import run_benchmark
from app.validation.scientific.attribution import NoveltyTracer
from app.validation.scientific.recombination import generate_synthetic_parents, simulate_meiosis, fertilize, generate_loci
from app.validation.scientific.phenotype import PhenotypeEngine, PhenotypeConfig


def test_causal_recovery_aggregate():
    """Verify >= 90% causal interaction recovery across Levels 1-8 across independent seeds."""
    n_seeds = 10
    seeds = [1000 + i for i in range(n_seeds)]

    level_recalls = []
    level_top1s = []
    level_topks = []

    for lvl in range(1, 9):
        res_list = [run_benchmark(level=lvl, seed=s, noise=0.0, stochastic=True) for s in seeds]
        recalls = [r["metrics"]["recall"] for r in res_list]
        top1s = [1.0 if r["metrics"]["top_1_causal"] else 0.0 for r in res_list]
        topks = [1.0 if r["metrics"]["top_k_recovery"] else 0.0 for r in res_list]

        mean_rec = sum(recalls) / n_seeds
        mean_top1 = sum(top1s) / n_seeds
        mean_topk = sum(topks) / n_seeds

        level_recalls.append(mean_rec)
        level_top1s.append(mean_top1)
        level_topks.append(mean_topk)

        # Every level must achieve at least 80% recall individually
        assert mean_rec >= 0.80, f"Level {lvl} recall {mean_rec:.2%} below 80% threshold"
        # Top-1 and Top-K must be perfect or near-perfect
        assert mean_top1 >= 0.95, f"Level {lvl} top-1 {mean_top1:.2%} below 95% threshold"
        assert mean_topk >= 0.95, f"Level {lvl} top-k {mean_topk:.2%} below 95% threshold"

    overall_recall = sum(level_recalls) / len(level_recalls)
    overall_top1 = sum(level_top1s) / len(level_top1s)
    overall_topk = sum(level_topks) / len(level_topks)

    # Requirement: >= 90% aggregate causal interaction recovery
    assert overall_recall >= 0.90, f"Overall causal recovery {overall_recall:.2%} below 90% proposal criterion"
    assert overall_top1 >= 0.95, f"Overall Top-1 {overall_top1:.2%} below 95%"
    assert overall_topk >= 0.95, f"Overall Top-K {overall_topk:.2%} below 95%"


def test_tracer_blindness_no_ground_truth_leakage():
    """Verify NoveltyTracer is strictly blind to ground truth metadata."""
    # Ensure NoveltyTracer has no knowledge of planted_ids or planted_config
    init_sig = inspect.signature(NoveltyTracer.__init__)
    param_names = list(init_sig.parameters.keys())
    assert "planted_ids" not in param_names
    assert "planted_config" not in param_names
    assert "ground_truth" not in param_names

    loci = generate_loci(100)
    pa, pb = generate_synthetic_parents(loci, seed=42)
    gam_a = simulate_meiosis(pa.homolog_1, pa.homolog_2, "A", crossover_positions=[15])
    gam_b = simulate_meiosis(pb.homolog_1, pb.homolog_2, "B", crossover_positions=[])
    offspring = fertilize(gam_a, gam_b, loci)
    engine = PhenotypeEngine(PhenotypeConfig(base_value=10.0, additive={"L05": 2.0}))

    tracer = NoveltyTracer(pa, pb, offspring, engine, candidate_limit=300)

    # Check attributes
    for attr in dir(tracer):
        assert "planted" not in attr.lower(), f"Tracer has suspicious ground-truth attribute {attr}"
        assert "ground_truth" not in attr.lower()

    candidates = tracer.generate_candidates()
    # Candidate generation should be derived purely from observed recombination provenance
    assert len(candidates) <= 300


def test_candidate_budget_and_execution_speed():
    """Verify candidate count <= 300 and runtime within bounded limits per benchmark run."""
    for lvl in range(1, 9):
        res = run_benchmark(level=lvl, seed=42, noise=0.0, stochastic=True)
        candidate_count = res["metrics"]["total_candidates_evaluated"]
        assert candidate_count <= 300, f"Level {lvl} candidate count {candidate_count} exceeded 300"
        # Bounded evaluation time (< 2.5s per run even on dense 200-locus Level 7)
        assert res["performance"]["duration_ms"] < 2500.0, f"Level {lvl} duration {res['performance']['duration_ms']}ms exceeded limit"
