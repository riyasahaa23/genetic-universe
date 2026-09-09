"""Describe observed genotype differences without equating them with phenotype novelty."""
from .models import Configuration, Variant


def investigate_configurations(variants: list[Variant], computation_id: str):
    result = []
    loci = {}
    for variant in variants:
        loci.setdefault((variant.chromosome, variant.position, variant.reference), []).append(variant)
    for siblings in loci.values():
        variant = siblings[0]
        if variant.child_specific_genotype is not True:
            continue
        homologs = {}
        for index, role in enumerate(("parent_A", "parent_B")):
            phase = variant.phase_evidence.get(role)
            transmitted = {pair[index] for pair in variant.transmission_pairs}
            if phase and len(set(phase.alleles)) == 2 and len(transmitted) == 1:
                homologs[role] = phase.alleles.index(next(iter(transmitted)))
        result.append(Configuration(id=f"config:{variant.id}", variant_ids=[v.id for v in siblings],
            child_genotype=variant.child_genotype.alleles, parent_a_genotype=variant.parent_a_genotype.alleles,
            parent_b_genotype=variant.parent_b_genotype.alleles, different_from_both_parents=True,
            mendelian_compatible=bool(variant.transmission_pairs),
            evidence_status="hypothesis" if variant.evidence_status == "hypothesis" else "inferred",
            classification="ordinary_mendelian_combination" if variant.transmission_pairs else "mendelian_inconsistent_requires_review",
            parental_homologs=homologs, block_ids=variant.segment_ids,
            recombination_event_ids=variant.recombination_event_ids,
            reference_evidence=[e for v in siblings for e in v.reference_evidence],
            provenance=[computation_id, *sorted({p.source_artifact_id for p in variant.phase_evidence.values()})]))
    return result
