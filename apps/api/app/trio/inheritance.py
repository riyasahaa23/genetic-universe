"""Deterministic allele transmission compatibility, without population priors."""
from itertools import product

from .models import Genotype, Variant


def infer_variant(chromosome: str, position: int, ref: str, alt: str,
                  child: Genotype, parent_a: Genotype, parent_b: Genotype,
                  computation_id: str) -> Variant:
    """Enumerate one transmitted allele per parent and match the entire child genotype."""
    origin, status, pairs, dosage, unique = "unknown", "insufficient_or_filtered_genotypes", [], 0, None
    if all(gt.usable for gt in (child, parent_a, parent_b)):
        child_sorted = sorted(child.alleles)
        pairs = sorted({(a, b) for a, b in product(parent_a.alleles, parent_b.alleles)
                        if sorted((a, b)) == child_sorted})
        unique = child_sorted != sorted(parent_a.alleles) and child_sorted != sorted(parent_b.alleles)
        if pairs:
            dosage = child.alleles.count(alt)
            sources = {role for a, b in pairs for role, allele in (("parent_A", a), ("parent_B", b)) if allele == alt}
            origin = next(iter(sources)) if len(sources) == 1 else "both"
            status = "compatible_with_both" if len(sources) == 2 else "unambiguous_alt_origin"
            if dosage == 2:
                status = "inherited_from_both"
        elif alt in child.alleles and alt not in parent_a.alleles + parent_b.alleles:
            origin, status = "de_novo_candidate", "mendelian_inconsistent_requires_validation"
        else:
            status = "mendelian_inconsistent"
        if alt not in child.alleles:
            origin, status, dosage = "unknown", "alt_absent_from_child", 0
    return Variant(id=f"{chromosome}:{position}:{ref}:{alt}", chromosome=chromosome,
                   position=position, reference=ref, alternate=alt,
                   child_genotype=child, parent_a_genotype=parent_a, parent_b_genotype=parent_b,
                   origin=origin, status=status, transmission_pairs=[list(p) for p in pairs],
                   inherited_alt_copies=dosage, child_specific_genotype=unique,
                   provenance=[computation_id], origin_evidence_status="unresolved" if origin == "unknown" else "inferred")
