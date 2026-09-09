from app.scientific.synthetic.recombination import generate_loci, generate_synthetic_parents, simulate_meiosis


def test_seeded_meiosis_covers_the_full_chromosome_without_overlap():
    for seed in range(10):
        loci = generate_loci(50)
        parent_a, _ = generate_synthetic_parents(loci, seed=seed)
        gamete = simulate_meiosis(parent_a.homolog_1, parent_a.homolog_2, "A", rng=None)
        assert len(gamete.alleles) == 50
        assert gamete.segments[0].start == 0
        assert gamete.segments[-1].end == 50
        for left, right in zip(gamete.segments, gamete.segments[1:]):
            assert left.end == right.start


def test_same_explicit_seed_and_plan_is_reproducible():
    loci = generate_loci(50)
    parent_a, _ = generate_synthetic_parents(loci, seed=42)
    first = simulate_meiosis(parent_a.homolog_1, parent_a.homolog_2, "A", crossover_positions=[20], start_homolog=0)
    second = simulate_meiosis(parent_a.homolog_1, parent_a.homolog_2, "A", crossover_positions=[20], start_homolog=0)
    assert first.to_dict() == second.to_dict()
