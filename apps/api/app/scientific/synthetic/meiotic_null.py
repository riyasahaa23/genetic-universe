"""Same-parent alternative-meiosis null distribution.

This module repeatedly simulates alternative gametes from the same two
parental genomes, assembles alternative offspring, and evaluates their
phenotypes under the supplied model.  The result is a model-relative
simulation reference distribution, not a clinical or real-world reproductive
probability.
"""

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

import numpy as np

from app.scientific.synthetic.novelty import detect_novelty
from app.scientific.synthetic.phenotype import PhenotypeEngine
from app.scientific.synthetic.recombination import (
    OffspringGenome,
    ParentGenome,
    fertilize,
    simulate_meiosis,
)

DEFAULT_NULL_SIMULATIONS = 1000
DEFAULT_HISTOGRAM_BINS = 20
NULL_QUANTILE_LEVELS = (0.01, 0.05, 0.25, 0.50, 0.75, 0.95, 0.99)
NOVELTY_TOLERANCE = 1e-6


@dataclass
class MeioticNullResult:
    """Summary of a same-parent simulated offspring phenotype distribution."""

    observed_phenotype: float
    parent_a_phenotype: float
    parent_b_phenotype: float
    parental_envelope: Dict[str, float]
    null_count: int
    null_mean: float
    null_std: float
    null_median: float
    null_min: float
    null_max: float
    quantiles: Dict[str, float]
    observed_percentile: float
    transgression_direction: str
    empirical_tail_probability: Optional[float]
    extreme_count: Optional[int]
    fraction_null_transgressive: float
    fraction_null_above_envelope: float
    fraction_null_below_envelope: float
    seed: int
    simulation_count: int
    histogram_bins: List[float] = field(default_factory=list)
    histogram_counts: List[int] = field(default_factory=list)
    # Kept for scientific inspection/tests, but deliberately omitted from
    # to_dict() so normal API responses do not serialize every null draw.
    null_phenotypes: List[float] = field(default_factory=list, repr=False, compare=False)

    @property
    def percentile_of_observed(self) -> float:
        """Backward/alternate naming alias for the observed percentile."""
        return self.observed_percentile

    def to_dict(self) -> Dict[str, Any]:
        """Return the compact API-safe summary without raw null draws."""
        return {
            "observed_phenotype": round(self.observed_phenotype, 4),
            "parent_a_phenotype": round(self.parent_a_phenotype, 4),
            "parent_b_phenotype": round(self.parent_b_phenotype, 4),
            "parental_envelope": {
                key: round(value, 4) for key, value in self.parental_envelope.items()
            },
            "null_count": self.null_count,
            "null_mean": round(self.null_mean, 4),
            "null_std": round(self.null_std, 4),
            "null_median": round(self.null_median, 4),
            "null_min": round(self.null_min, 4),
            "null_max": round(self.null_max, 4),
            "quantiles": {key: round(value, 4) for key, value in self.quantiles.items()},
            "observed_percentile": round(self.observed_percentile, 4),
            "transgression_direction": self.transgression_direction,
            "empirical_tail_probability": (
                round(self.empirical_tail_probability, 8)
                if self.empirical_tail_probability is not None
                else None
            ),
            "extreme_count": self.extreme_count,
            "fraction_null_transgressive": round(self.fraction_null_transgressive, 4),
            "fraction_null_above_envelope": round(self.fraction_null_above_envelope, 4),
            "fraction_null_below_envelope": round(self.fraction_null_below_envelope, 4),
            "seed": self.seed,
            "simulation_count": self.simulation_count,
            "histogram_bins": [round(value, 4) for value in self.histogram_bins],
            "histogram_counts": self.histogram_counts,
        }


def _draw_rng_pairs(seed: int, simulation_count: int):
    """Yield independent deterministic maternal/paternal RNGs per draw.

    A master ``SeedSequence`` spawns one sequence per alternative offspring;
    each draw then gets separate maternal and paternal child sequences.  This
    makes the complete distribution reproducible without repeating one RNG
    state or one identical offspring M times.
    """
    master_sequence = np.random.SeedSequence(seed)
    for draw_sequence in master_sequence.spawn(simulation_count):
        maternal_sequence, paternal_sequence = draw_sequence.spawn(2)
        yield (
            np.random.default_rng(maternal_sequence),
            np.random.default_rng(paternal_sequence),
        )


def _simulate_null_phenotypes(
    parent_a: ParentGenome,
    parent_b: ParentGenome,
    phenotype_engine: PhenotypeEngine,
    simulation_count: int,
    seed: int,
) -> List[float]:
    """Generate alternative offspring phenotypes without mutating observed state."""
    phenotypes: List[float] = []
    loci = parent_a.loci

    for draw_index, (maternal_rng, paternal_rng) in enumerate(
        _draw_rng_pairs(seed, simulation_count)
    ):
        gamete_a = simulate_meiosis(
            parent_a.homolog_1,
            parent_a.homolog_2,
            parent_a.parent_id,
            crossover_positions=None,
            start_homolog=int(maternal_rng.integers(0, 2)),
            rng=maternal_rng,
        )
        gamete_b = simulate_meiosis(
            parent_b.homolog_1,
            parent_b.homolog_2,
            parent_b.parent_id,
            crossover_positions=None,
            start_homolog=int(paternal_rng.integers(0, 2)),
            rng=paternal_rng,
        )
        null_offspring = fertilize(
            gamete_a,
            gamete_b,
            loci,
            offspring_id=f"NULL_{draw_index:06d}",
        )
        phenotype = phenotype_engine.evaluate_diploid(
            null_offspring.maternal_gamete.alleles,
            null_offspring.paternal_gamete.alleles,
        ).total
        phenotypes.append(float(phenotype))

    return phenotypes


def run_meiotic_null_distribution(
    parent_a: ParentGenome,
    parent_b: ParentGenome,
    observed_offspring: OffspringGenome,
    phenotype_engine: PhenotypeEngine,
    seed: int = 42,
    simulation_count: int = DEFAULT_NULL_SIMULATIONS,
    histogram_bin_count: int = DEFAULT_HISTOGRAM_BINS,
) -> MeioticNullResult:
    """Estimate model-relative phenotype extremeness among same-parent meioses.

    ``observed_percentile`` uses the weak empirical-CDF convention: the
    percentile is ``100 * count(null <= observed) / M``, so ties are included
    in the lower-side rank.  Quantiles use NumPy's linear interpolation.

    For a transgressive observed phenotype, the directional tail probability
    uses the finite-sample correction ``(extreme_count + 1) / (M + 1)``.  A
    non-transgressive observed phenotype receives no directional tail p-value.
    """
    if seed < 0:
        raise ValueError("Null-distribution seed must be non-negative.")
    if simulation_count <= 0:
        raise ValueError("simulation_count must be greater than zero.")
    if histogram_bin_count <= 0:
        raise ValueError("histogram_bin_count must be greater than zero.")
    if len(parent_a.homolog_1) != len(parent_a.homolog_2):
        raise ValueError("Parent A homologs must have equal length.")
    if len(parent_b.homolog_1) != len(parent_b.homolog_2):
        raise ValueError("Parent B homologs must have equal length.")
    if len(parent_a.homolog_1) != len(parent_b.homolog_1):
        raise ValueError("Both parents must have the same locus count.")

    parent_a_phenotype = phenotype_engine.evaluate_diploid(
        parent_a.homolog_1, parent_a.homolog_2
    ).total
    parent_b_phenotype = phenotype_engine.evaluate_diploid(
        parent_b.homolog_1, parent_b.homolog_2
    ).total
    observed_phenotype = phenotype_engine.evaluate_diploid(
        observed_offspring.maternal_gamete.alleles,
        observed_offspring.paternal_gamete.alleles,
    ).total

    null_phenotypes = _simulate_null_phenotypes(
        parent_a,
        parent_b,
        phenotype_engine,
        simulation_count,
        seed,
    )
    null_values = np.asarray(null_phenotypes, dtype=float)

    parental_min = min(parent_a_phenotype, parent_b_phenotype)
    parental_max = max(parent_a_phenotype, parent_b_phenotype)
    parental_envelope = {"min": parental_min, "max": parental_max}

    novelty = detect_novelty(
        parent_a_phenotype,
        parent_b_phenotype,
        observed_phenotype,
        tolerance=NOVELTY_TOLERANCE,
    )
    if novelty.direction == "above_range":
        transgression_direction = "above"
    elif novelty.direction == "below_range":
        transgression_direction = "below"
    else:
        transgression_direction = "not_transgressive"

    above_mask = null_values > (parental_max + NOVELTY_TOLERANCE)
    below_mask = null_values < (parental_min - NOVELTY_TOLERANCE)
    above_count = int(np.count_nonzero(above_mask))
    below_count = int(np.count_nonzero(below_mask))
    transgressive_count = above_count + below_count

    observed_percentile = float(
        np.count_nonzero(null_values <= observed_phenotype) / simulation_count * 100.0
    )

    if transgression_direction == "above":
        extreme_count: Optional[int] = int(
            np.count_nonzero(null_values >= observed_phenotype)
        )
    elif transgression_direction == "below":
        extreme_count = int(np.count_nonzero(null_values <= observed_phenotype))
    else:
        extreme_count = None

    empirical_tail_probability = (
        (extreme_count + 1) / (simulation_count + 1)
        if extreme_count is not None
        else None
    )

    quantile_values = np.quantile(
        null_values,
        np.asarray(NULL_QUANTILE_LEVELS, dtype=float),
        method="linear",
    )
    quantiles = {
        f"q{int(level * 100):02d}": float(value)
        for level, value in zip(NULL_QUANTILE_LEVELS, quantile_values)
    }
    histogram_counts, histogram_edges = np.histogram(
        null_values,
        bins=histogram_bin_count,
    )

    return MeioticNullResult(
        observed_phenotype=float(observed_phenotype),
        parent_a_phenotype=float(parent_a_phenotype),
        parent_b_phenotype=float(parent_b_phenotype),
        parental_envelope=parental_envelope,
        null_count=simulation_count,
        null_mean=float(np.mean(null_values)),
        null_std=float(np.std(null_values, ddof=0)),
        null_median=float(np.median(null_values)),
        null_min=float(np.min(null_values)),
        null_max=float(np.max(null_values)),
        quantiles=quantiles,
        observed_percentile=observed_percentile,
        transgression_direction=transgression_direction,
        empirical_tail_probability=(
            float(empirical_tail_probability)
            if empirical_tail_probability is not None
            else None
        ),
        extreme_count=extreme_count,
        fraction_null_transgressive=transgressive_count / simulation_count,
        fraction_null_above_envelope=above_count / simulation_count,
        fraction_null_below_envelope=below_count / simulation_count,
        seed=seed,
        simulation_count=simulation_count,
        histogram_bins=[float(value) for value in histogram_edges],
        histogram_counts=[int(value) for value in histogram_counts],
        null_phenotypes=null_phenotypes,
    )


def simulate_meiotic_null_distribution(
    parent_a: ParentGenome,
    parent_b: ParentGenome,
    observed_offspring: OffspringGenome,
    phenotype_engine: PhenotypeEngine,
    seed: int = 42,
    simulation_count: int = DEFAULT_NULL_SIMULATIONS,
    histogram_bin_count: int = DEFAULT_HISTOGRAM_BINS,
) -> MeioticNullResult:
    """Explicit simulation-named alias for the null-distribution runner."""
    return run_meiotic_null_distribution(
        parent_a=parent_a,
        parent_b=parent_b,
        observed_offspring=observed_offspring,
        phenotype_engine=phenotype_engine,
        seed=seed,
        simulation_count=simulation_count,
        histogram_bin_count=histogram_bin_count,
    )
