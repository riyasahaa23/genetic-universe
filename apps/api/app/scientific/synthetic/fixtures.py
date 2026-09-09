"""Deterministic synthetic inputs used by demos and evaluation."""

from .phenotype import get_default_demo_phenotype_config
from .recombination import generate_loci, generate_synthetic_parents

__all__ = ["generate_loci", "generate_synthetic_parents", "get_default_demo_phenotype_config"]
