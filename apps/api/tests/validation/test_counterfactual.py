"""Tests for counterfactual interventions and attribution deltas."""
import pytest
from app.validation.scientific.recombination import (
    generate_loci,
    generate_synthetic_parents,
    simulate_meiosis,
    fertilize,
)
from app.validation.scientific.phenotype import (
    get_default_demo_phenotype_config,
    PhenotypeEngine,
)
from app.validation.scientific.attribution import NoveltyTracer, Candidate


@pytest.fixture
def experiment_setup():
    loci = generate_loci(50)
    parent_a, parent_b = generate_synthetic_parents(loci, seed=42)

    # Crossover at 20 brings A1's L10 (pos 10) and A2's L31 (pos 31) into gamete A
    gamete_a = simulate_meiosis(
        parent_a.homolog_1, parent_a.homolog_2, "A", crossover_positions=[20], start_homolog=0
    )
    gamete_b = simulate_meiosis(
        parent_b.homolog_1, parent_b.homolog_2, "B", crossover_positions=[15], start_homolog=0
    )
    offspring = fertilize(gamete_a, gamete_b, loci)

    engine = PhenotypeEngine(get_default_demo_phenotype_config())
    tracer = NoveltyTracer(parent_a, parent_b, offspring, engine)
    return tracer


def test_interaction_break(experiment_setup):
    """Breaking the epistatic interaction removes the epistasis delta and eliminates novelty."""
    tracer = experiment_setup
    cand = Candidate(
        id="E_L10_L31",
        candidate_type="INTERACTION",
        name="L10 x L31",
        details={"locus_a_pos": 10, "locus_b_pos": 31},
        provenance_chain=[],
        provenance_score=0.95,
    )
    result = tracer.run_counterfactual(cand)

    assert result.delta == 16.0
    assert result.absolute_effect == 16.0
    assert result.novelty_removed is True
    assert result.counterfactual_phenotype == 15.0


def test_segment_swap(experiment_setup):
    """Swapping the recombinant segment alters the transmitted combination."""
    tracer = experiment_setup
    cand = Candidate(
        id="SEG_A_01_20_50",
        candidate_type="SEGMENT",
        name="Segment 20-50",
        details={
            "parent": "A",
            "start": 20,
            "end": 50,
            "source_homolog": "A2",
        },
        provenance_chain=[],
        provenance_score=0.80,
    )
    result = tracer.run_counterfactual(cand)
    assert result.delta > 0
    assert result.novelty_removed is True


def test_variant_revert(experiment_setup):
    """Reverting L10 allele back to 0 silences the epistatic interaction."""
    tracer = experiment_setup
    cand = Candidate(
        id="VAR_L10",
        candidate_type="VARIANT",
        name="Locus L10",
        details={"locus_id": "L10"},
        provenance_chain=[],
        provenance_score=0.75,
    )
    result = tracer.run_counterfactual(cand)
    assert result.absolute_effect >= 16.0
    assert result.novelty_removed is True


def test_delta_and_ranking(experiment_setup):
    """Verify ranked candidates order highest attribution score first."""
    tracer = experiment_setup
    ranked = tracer.rank_candidates()
    assert len(ranked) > 0
    top = ranked[0]
    assert top.candidate_id == "E_L10_L31"
    assert top.delta == 16.0
    assert top.attribution_score > 0.65
