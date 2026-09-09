"""1000 Genomes Project (1kGP) dataset adapter module.

Provides pedigree parsing, bounded regional VCF extraction, and family store
adaptation for multi-family real human genomic validation.
"""
from .adapter import ThousandGenomesAdapter, export_family_manifest
from .extractor import BoundedRegionalExtractor
from .pedigree import PedigreeRegistry, TrioInfo, load_pedigree

__all__ = [
    "PedigreeRegistry",
    "TrioInfo",
    "load_pedigree",
    "ThousandGenomesAdapter",
    "export_family_manifest",
    "BoundedRegionalExtractor",
]
