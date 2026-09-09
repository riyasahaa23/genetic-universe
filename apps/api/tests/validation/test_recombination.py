"""Tests for meiotic recombination, gamete formation, and fertilization provenance."""
import pytest
import numpy as np

from app.validation.scientific.recombination import (
    generate_loci,
    simulate_meiosis,
    fertilize,
    generate_synthetic_parents,
)


def test_no_crossover():
    """Verify transmission when no crossover occurs (empty crossover list)."""
    h1 = [0] * 20
    h2 = [1] * 20
    gamete = simulate_meiosis(h1, h2, "A", crossover_positions=[], start_homolog=0)
    assert gamete.alleles == h1
    assert len(gamete.segments) == 1
    assert gamete.segments[0].source_homolog == "A1"
    assert gamete.segments[0].start == 0
    assert gamete.segments[0].end == 20


def test_single_crossover():
    """Verify single crossover exchange at defined breakpoint."""
    h1 = [0] * 10
    h2 = [1] * 10
    gamete = simulate_meiosis(h1, h2, "A", crossover_positions=[4], start_homolog=0)
    # [0:4] from h1 (0s), [4:10] from h2 (1s)
    expected = [0, 0, 0, 0, 1, 1, 1, 1, 1, 1]
    assert gamete.alleles == expected
    assert len(gamete.segments) == 2
    assert gamete.segments[0].source_homolog == "A1"
    assert gamete.segments[0].start == 0
    assert gamete.segments[0].end == 4
    assert gamete.segments[1].source_homolog == "A2"
    assert gamete.segments[1].start == 4
    assert gamete.segments[1].end == 10


def test_multiple_crossovers():
    """Verify multiple alternating crossovers."""
    h1 = [0] * 20
    h2 = [1] * 20
    gamete = simulate_meiosis(h1, h2, "B", crossover_positions=[5, 12, 16], start_homolog=1)
    # Starts on h2 (B2)
    # 0..5 -> 1s (B2)
    # 5..12 -> 0s (B1)
    # 12..16 -> 1s (B2)
    # 16..20 -> 0s (B1)
    assert gamete.alleles[:5] == [1] * 5
    assert gamete.alleles[5:12] == [0] * 7
    assert gamete.alleles[12:16] == [1] * 4
    assert gamete.alleles[16:20] == [0] * 4
    assert len(gamete.segments) == 4
    assert gamete.segments[0].source_homolog == "B2"
    assert gamete.segments[1].source_homolog == "B1"
    assert gamete.segments[2].source_homolog == "B2"
    assert gamete.segments[3].source_homolog == "B1"


def test_crossover_bounds_validation():
    """Verify error handling on invalid crossover coordinates."""
    h1 = [0] * 10
    h2 = [1] * 10
    with pytest.raises(ValueError):
        simulate_meiosis(h1, h2, "A", crossover_positions=[0])
    with pytest.raises(ValueError):
        simulate_meiosis(h1, h2, "A", crossover_positions=[10])


def test_provenance():
    """Verify that fertilization preserves locus-level provenance from both parents."""
    loci = generate_loci(10)
    h1_a = [0] * 10
    h2_a = [1] * 10
    gamete_a = simulate_meiosis(h1_a, h2_a, "A", crossover_positions=[5], start_homolog=0)

    h1_b = [1] * 10
    h2_b = [0] * 10
    gamete_b = simulate_meiosis(h1_b, h2_b, "B", crossover_positions=[3], start_homolog=1)

    offspring = fertilize(gamete_a, gamete_b, loci)

    assert len(offspring.loci_provenance) == 10
    # Check locus 2 (0-indexed position 1)
    loc2 = offspring.loci_provenance[1]
    assert loc2.source_parent_a == "A"
    assert loc2.source_homolog_a == "A1"
    assert loc2.allele_a == 0

    assert loc2.source_parent_b == "B"
    assert loc2.source_homolog_b == "B2"
    assert loc2.allele_b == 0

    # Check locus 7 (0-indexed position 6)
    loc7 = offspring.loci_provenance[6]
    assert loc7.source_parent_a == "A"
    assert loc7.source_homolog_a == "A2"
    assert loc7.allele_a == 1


def test_deterministic_seed():
    """Verify identical RNG seed produces identical meiotic outcomes."""
    loci = generate_loci(50)
    p_a1, p_b1 = generate_synthetic_parents(loci, seed=42)
    p_a2, p_b2 = generate_synthetic_parents(loci, seed=42)

    assert p_a1.homolog_1 == p_a2.homolog_1
    assert p_a1.homolog_2 == p_a2.homolog_2
    assert p_b1.homolog_1 == p_b2.homolog_1
    assert p_b1.homolog_2 == p_b2.homolog_2

    rng1 = np.random.default_rng(999)
    gamete_1 = simulate_meiosis(p_a1.homolog_1, p_a1.homolog_2, "A", rng=rng1)

    rng2 = np.random.default_rng(999)
    gamete_2 = simulate_meiosis(p_a2.homolog_1, p_a2.homolog_2, "A", rng=rng2)

    assert gamete_1.alleles == gamete_2.alleles
    assert gamete_1.crossovers == gamete_2.crossovers
