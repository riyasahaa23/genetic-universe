"""Tests for mathematical reproducibility and audit consistency."""
import pytest
import numpy as np

from app.validation.scientific.recombination import (
    generate_loci,
    generate_synthetic_parents,
    simulate_meiosis,
    fertilize,
)
from app.validation.scientific.phenotype import get_default_demo_phenotype_config, PhenotypeEngine
from app.validation.scientific.attribution import NoveltyTracer


def run_full_pipeline(seed: int):
    loci = generate_loci(50)
    p_a, p_b = generate_synthetic_parents(loci, seed=seed)

    rng_a = np.random.default_rng(seed + 100)
    rng_b = np.random.default_rng(seed + 200)

    gamete_a = simulate_meiosis(p_a.homolog_1, p_a.homolog_2, "A", rng=rng_a)
    gamete_b = simulate_meiosis(p_b.homolog_1, p_b.homolog_2, "B", rng=rng_b)

    offspring = fertilize(gamete_a, gamete_b, loci)

    engine = PhenotypeEngine(get_default_demo_phenotype_config())
    tracer = NoveltyTracer(p_a, p_b, offspring, engine)
    ranked = tracer.rank_candidates()

    return {
        "crossovers_a": gamete_a.crossovers,
        "crossovers_b": gamete_b.crossovers,
        "offspring_dosage": offspring.get_dosage(),
        "phenotype_o": tracer.y_O,
        "ranked_ids": [r.candidate_id for r in ranked],
        "top_attribution_score": ranked[0].attribution_score if ranked else None,
    }


def test_reproducibility_across_identical_seeds():
    """Verify same seed produces identical crossovers, offspring, phenotype, and ranking."""
    run_1 = run_full_pipeline(seed=42)
    run_2 = run_full_pipeline(seed=42)

    assert run_1["crossovers_a"] == run_2["crossovers_a"]
    assert run_1["crossovers_b"] == run_2["crossovers_b"]
    assert run_1["offspring_dosage"] == run_2["offspring_dosage"]
    assert run_1["phenotype_o"] == run_2["phenotype_o"]
    assert run_1["ranked_ids"] == run_2["ranked_ids"]
    assert run_1["top_attribution_score"] == run_2["top_attribution_score"]


def test_different_seeds_diverge():
    """Verify different seeds produce divergent meiotic crossovers."""
    run_a = run_full_pipeline(seed=42)
    run_b = run_full_pipeline(seed=999)

    assert run_a["crossovers_a"] != run_b["crossovers_a"] or run_a["crossovers_b"] != run_b["crossovers_b"]
