"""Formal pairwise interaction tests for the canonical synthetic engine."""

import pytest

from app.scientific.synthetic.attribution import Candidate, NoveltyTracer
from app.scientific.synthetic.phenotype import EpistaticPair, PhenotypeConfig, PhenotypeEngine
from app.scientific.synthetic.recombination import ParentGenome, fertilize, generate_loci, simulate_meiosis


def _make_tracer(config: PhenotypeConfig, a1: list[int], a2: list[int], b1: list[int], b2: list[int], cross_a=None, cross_b=None) -> NoveltyTracer:
    loci = generate_loci(len(a1))
    parent_a = ParentGenome("A", a1, a2, loci)
    parent_b = ParentGenome("B", b1, b2, loci)
    gamete_a = simulate_meiosis(parent_a.homolog_1, parent_a.homolog_2, "A", crossover_positions=cross_a or [], start_homolog=0)
    gamete_b = simulate_meiosis(parent_b.homolog_1, parent_b.homolog_2, "B", crossover_positions=cross_b or [], start_homolog=0)
    offspring = fertilize(gamete_a, gamete_b, loci)
    return NoveltyTracer(parent_a, parent_b, offspring, PhenotypeEngine(config))


def _pair_candidate(candidate_id: str = "E_AB") -> Candidate:
    return Candidate(
        id=candidate_id,
        candidate_type="INTERACTION",
        name="L01 × L02 interaction",
        details={"locus_a": "L01", "locus_b": "L02", "locus_a_pos": 1, "locus_b_pos": 2, "coefficient": 8.0},
        provenance_chain=["observable pair metadata"],
        provenance_score=0.9,
    )


def _pair_config(coefficient: float) -> PhenotypeConfig:
    return PhenotypeConfig(
        additive={"L01": 2.0, "L02": 3.0},
        epistasis=[EpistaticPair("E_AB", "L01", "L02", 1, 2, coefficient)],
        mode="cis_haplotype",
    )


def _cis_recombinant(config: PhenotypeConfig) -> NoveltyTracer:
    return _make_tracer(config, [1, 0], [0, 1], [0, 0], [0, 0], cross_a=[1])


def test_pairwise_contrast_is_zero_for_additive_pair() -> None:
    result = _cis_recombinant(_pair_config(0.0)).run_counterfactual(_pair_candidate())
    assert result.baseline_phenotype == 5.0
    assert result.interaction_contrast == pytest.approx(0.0)
    assert result.epistatic_excess == pytest.approx(0.0)
    assert result.synergy_direction == "approximately_additive"


def test_positive_epistasis_keeps_edge_ablation_separate_from_formal_contrast() -> None:
    result = _cis_recombinant(_pair_config(8.0)).run_counterfactual(_pair_candidate())
    assert result.baseline_phenotype == 13.0
    assert result.phenotype_after_a == 3.0
    assert result.phenotype_after_b == 2.0
    assert result.phenotype_after_ab == 0.0
    assert result.delta_a == 10.0
    assert result.delta_b == 11.0
    assert result.delta_ab == 13.0
    assert result.interaction_contrast == pytest.approx(-8.0)
    assert result.epistatic_excess == pytest.approx(8.0)
    assert result.interaction_edge_delta == 8.0
    assert result.interaction_edge_delta != result.interaction_contrast


def test_negative_epistasis_has_opposite_synergy_direction() -> None:
    result = _cis_recombinant(_pair_config(-8.0)).run_counterfactual(_pair_candidate())
    assert result.interaction_contrast == pytest.approx(8.0)
    assert result.epistatic_excess == pytest.approx(-8.0)
    assert result.synergy_direction == "antagonistic_nonpositive_synergy"
    assert result.interaction_edge_delta == -8.0


def test_pairwise_analysis_is_independent_of_candidate_id() -> None:
    tracer = _cis_recombinant(_pair_config(8.0))
    first = tracer.analyze_pairwise_interaction(_pair_candidate("E_OBSERVED_PAIR"))
    second = tracer.analyze_pairwise_interaction(_pair_candidate("E_PLANTED_01"))
    keys = ("baseline_phenotype", "phenotype_after_a", "phenotype_after_b", "phenotype_after_ab", "delta_a", "delta_b", "delta_ab", "interaction_contrast")
    assert {key: first[key] for key in keys} == {key: second[key] for key in keys}


def test_pairwise_provenance_retains_recombinant_ancestry() -> None:
    result = _cis_recombinant(_pair_config(8.0)).run_counterfactual(_pair_candidate())
    assert result.provenance["recombinant_assembly"] is True
    assert result.provenance["cis_in_parent_a"] is False
    active = result.provenance["active_haplotypes"][0]
    assert active["locus_a"]["homolog"] == "A1"
    assert active["locus_b"]["homolog"] == "A2"
    assert active["locus_b"]["crossover_interval"] == "A_XO_01"


def test_joint_intervention_does_not_hide_opposite_side_transgression() -> None:
    config = PhenotypeConfig(
        additive={"L01": 10.0, "L02": 10.0, "L03": -6.0},
        epistasis=[EpistaticPair("E_AB", "L01", "L02", 1, 2, 0.0)],
        mode="diploid",
    )
    tracer = _make_tracer(config, [1, 0, 1], [0, 0, 0], [0, 1, 1], [0, 0, 0], cross_a=[1], cross_b=[2])
    result = tracer.run_counterfactual(_pair_candidate())
    assert result.parental_envelope == {"min": 4.0, "max": 4.0}
    assert result.baseline_phenotype == 20.0
    assert result.novelty_removed_a is False
    assert result.novelty_removed_b is False
    # The observed novelty is above the parental envelope. Resetting both
    # loci pushes the result below the envelope, so the full transgressive
    # state remains novel rather than being mislabeled as rescued.
    assert result.novelty_removed_ab is False
