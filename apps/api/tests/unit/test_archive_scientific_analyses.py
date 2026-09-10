"""Focused tests for the scientific modules transplanted from the archive."""

from app.scientific.evaluation.research_benchmark import build_synthetic_world, run_research_benchmark
from app.scientific.synthetic.attribution import (
    NoveltyTracer,
    calculate_epistatic_excess,
    calculate_interaction_contrast,
)
from app.scientific.synthetic.meiotic_null import run_meiotic_null_distribution
from app.scientific.synthetic.minimal_rescue import search_minimal_novelty_rescue
from app.scientific.synthetic.phenotype import PhenotypeConfig, PhenotypeEngine
from app.scientific.synthetic.recombination import ParentGenome, fertilize, generate_loci, simulate_meiosis


def test_pairwise_interaction_contrast_has_explicit_sign_convention() -> None:
    assert calculate_interaction_contrast(2.0, 3.0, 8.0) == 3.0
    assert calculate_epistatic_excess(2.0, 3.0, 8.0) == -3.0


def test_transplanted_null_analysis_is_reproducible_and_preserves_observed_state() -> None:
    world = build_synthetic_world("easy", 0)
    tracer = world.tracer
    result_a = run_meiotic_null_distribution(
        tracer.parent_a,
        tracer.parent_b,
        tracer.offspring,
        tracer.phenotype_engine,
        seed=11,
        simulation_count=7,
        histogram_bin_count=3,
    )
    result_b = run_meiotic_null_distribution(
        tracer.parent_a,
        tracer.parent_b,
        tracer.offspring,
        tracer.phenotype_engine,
        seed=11,
        simulation_count=7,
        histogram_bin_count=3,
    )
    assert result_a.to_dict() == result_b.to_dict()
    assert len(result_a.null_phenotypes) == 7
    assert result_a.to_dict().get("null_phenotypes") is None


def test_blind_benchmark_candidate_generation_remains_observable_only() -> None:
    world = build_synthetic_world("easy", 0)
    candidate_ids = {candidate.id for candidate in world.tracer.generate_candidates()}
    assert world.truth["causal_candidate_ids"]
    assert set(world.truth["causal_candidate_ids"]).issubset(candidate_ids)
    assert all(not candidate_id.startswith("MODEL_") for candidate_id in candidate_ids)


def test_bounded_rescue_finds_the_minimal_variant_set() -> None:
    loci = generate_loci(2)
    zeros = [0, 0]
    parent_a = ParentGenome("A", zeros, zeros, loci)
    parent_b = ParentGenome("B", zeros, zeros, loci)
    offspring = fertilize(
        simulate_meiosis([1, 1], [1, 1], "A", crossover_positions=[]),
        simulate_meiosis(zeros, zeros, "B", crossover_positions=[]),
        loci,
    )
    tracer = NoveltyTracer(
        parent_a,
        parent_b,
        offspring,
        PhenotypeEngine(PhenotypeConfig(additive={"L01": 6.0, "L02": 6.0})),
    )
    result = search_minimal_novelty_rescue(tracer, max_set_size=2)
    assert result.search_status == "rescue_found"
    assert result.minimal_cardinality == 2
    assert result.minimal_rescue_sets[0].candidate_ids == ["VAR_L01", "VAR_L02"]


def test_blind_research_report_repeats_for_fixed_seeds() -> None:
    kwargs = {
        "difficulty": "easy",
        "n_seeds": 2,
        "bootstrap_seed": 17,
        "bootstrap_replicates": 5,
        "null_simulations": None,
        "include_per_seed": True,
    }
    first = run_research_benchmark(**kwargs)
    second = run_research_benchmark(**kwargs)
    first.pop("runtime_summary")
    second.pop("runtime_summary")
    for report in (first, second):
        for seed_report in report["per_seed_metrics"] or []:
            seed_report.pop("timings", None)
    assert first == second
