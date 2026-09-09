"""Tests for quantitative phenotype engine."""
import pytest
from app.validation.scientific.phenotype import (
    PhenotypeConfig,
    PhenotypeEngine,
    EpistaticPair,
)


def test_additive_effect():
    """Verify additive contributions sum proportionally to allele dosage."""
    config = PhenotypeConfig(
        base_value=10.0,
        additive={"L01": 2.0, "L02": 3.0},
    )
    engine = PhenotypeEngine(config)

    # Diploid with homozygous alternate at L01 (dosage=2), heterozygous at L02 (dosage=1)
    h1 = [1, 1, 0, 0]
    h2 = [1, 0, 0, 0]
    breakdown = engine.evaluate_diploid(h1, h2)

    # total = 10.0 (base) + (2*2.0) + (1*3.0) = 17.0
    assert breakdown.base_value == 10.0
    assert breakdown.additive_component == 7.0
    assert breakdown.total == 17.0
    assert breakdown.additive_details["L01"] == 4.0
    assert breakdown.additive_details["L02"] == 3.0


def test_epistatic_effect():
    """Verify epistatic coefficient contributes when both loci carry alternate alleles in cis."""
    pair = EpistaticPair(
        id="E_01_02",
        locus_a="L01",
        locus_b="L02",
        locus_a_pos=1,
        locus_b_pos=2,
        coefficient=15.0,
    )
    config = PhenotypeConfig(
        base_value=0.0,
        additive={"L01": 1.0, "L02": 1.0},
        epistasis=[pair],
        mode="cis_haplotype",
    )
    engine = PhenotypeEngine(config)

    # Homolog 1 has both alternate alleles in cis
    h1 = [1, 1, 0]
    h2 = [0, 0, 0]
    res = engine.evaluate_diploid(h1, h2)
    # Additive: 1.0 + 1.0 = 2.0. Epistatic: 15.0. Total = 17.0
    assert res.epistatic_component == 15.0
    assert res.total == 17.0


def test_zero_interaction():
    """Verify interaction contributes zero when alleles are on separate un-recombined homologs in cis mode."""
    pair = EpistaticPair(
        id="E_01_02",
        locus_a="L01",
        locus_b="L02",
        locus_a_pos=1,
        locus_b_pos=2,
        coefficient=25.0,
    )
    config = PhenotypeConfig(
        base_value=0.0,
        additive={},
        epistasis=[pair],
        mode="cis_haplotype",
    )
    engine = PhenotypeEngine(config)

    # Trans-phase: H1 has L01, H2 has L02. Neither homolog carries BOTH.
    h1 = [1, 0, 0]
    h2 = [0, 1, 0]
    res = engine.evaluate_diploid(h1, h2)
    assert res.epistatic_component == 0.0
    assert res.total == 0.0


def test_known_ground_truth():
    """Verify the proposal formula P = 2A + 3B + 8(A x B) + 12(C x D)."""
    # Locus A = L01, Locus B = L02, Locus C = L03, Locus D = L04
    config = PhenotypeConfig(
        base_value=0.0,
        additive={"L01": 2.0, "L02": 3.0},
        epistasis=[
            EpistaticPair("E_AB", "L01", "L02", 1, 2, 8.0),
            EpistaticPair("E_CD", "L03", "L04", 3, 4, 12.0),
        ],
        mode="cis_haplotype",
    )
    engine = PhenotypeEngine(config)

    # Recombined gamete carries L01=1, L02=1, L03=1, L04=1
    h1 = [1, 1, 1, 1]
    h2 = [0, 0, 0, 0]
    res = engine.evaluate_diploid(h1, h2)
    # Additive: 2(1) + 3(1) = 5.0
    # Epistasis: 8(1) + 12(1) = 20.0
    # Total = 25.0
    assert res.total == 25.0
