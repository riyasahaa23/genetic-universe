"""Strict evidence-tiered Genotype -> Phenotype engine.

Enforces zero-fabrication:
- Reported individual phenotypes from repository history (Coriell NA24385) are observed history.
- Variant-level external annotations from ClinVar are external reference hypotheses.
- Quantitative predicted phenotypes are strictly null/unavailable for real GIAB trio.
"""
from typing import Any

from .models import (
    ChildState,
    DatabaseAssociatedPhenotype,
    PhenotypeCategorization,
    Variant,
)

PHENOTYPE_ENGINE_LIMITATIONS = [
    "No experimentally validated quantitative phenotype prediction model is available for this trio",
    "Reported repository history (Coriell) documents clinical observations but does not assert molecular etiology",
    "External ClinVar records report external variant literature; they do NOT establish clinical diagnoses for this child",
    "Absence of an external variant record is not evidence of benignity or wild-type status",
    "Child-specific genotype configurations are structural genomic combinations, not phenotypic traits",
]


def parse_gene_symbol(gene_info: str | None) -> str | None:
    if not gene_info:
        return None
    # ClinVar GENEINFO format: SYMBOL:ID or SYMBOL1:ID1|SYMBOL2:ID2
    primary = gene_info.split("|")[0]
    return primary.split(":")[0] if ":" in primary else primary


def parse_consequence(mc: str | None) -> str | None:
    if not mc:
        return None
    # ClinVar MC format: SO:0001583|missense_variant
    parts = mc.split("|")
    return parts[-1] if len(parts) > 1 else mc


def extract_database_associated_phenotypes(variants: list[Variant]) -> list[DatabaseAssociatedPhenotype]:
    results: list[DatabaseAssociatedPhenotype] = []
    seen = set()

    for variant in variants:
        for ref_ev in variant.reference_evidence:
            records = ref_ev.get("records", [])
            for rec in records:
                clinvar_id = rec.get("clinvar_record_id")
                key = (variant.id, clinvar_id)
                if key in seen:
                    continue
                seen.add(key)

                gene_sym = parse_gene_symbol(rec.get("gene_info"))
                consequence = parse_consequence(rec.get("molecular_consequence"))

                results.append(
                    DatabaseAssociatedPhenotype(
                        variant_id=variant.id,
                        gene_symbol=gene_sym,
                        molecular_consequence=consequence,
                        clinvar_record_id=clinvar_id,
                        clinical_significance=rec.get("clinical_significance"),
                        condition_names=rec.get("condition_names"),
                        review_status=rec.get("review_status"),
                        evidence_status="hypothesis",
                        scope="external_variant_knowledge_not_subject_observation",
                    )
                )

    return results


def categorize_phenotypes(state: ChildState) -> PhenotypeCategorization:
    """Categorize all phenotypic evidence in a child state into strict truth tiers."""
    db_phenotypes = extract_database_associated_phenotypes(state.variants)
    annotated_variant_ids = {p.variant_id for p in db_phenotypes}
    unsupported_count = sum(1 for v in state.variants if v.id not in annotated_variant_ids)

    return PhenotypeCategorization(
        family_id=state.family_id,
        sample_id=state.child_id,
        phenotype_model_status="unavailable",
        reported_phenotypes=state.phenotype_observations,
        database_associated_phenotypes=db_phenotypes,
        predicted_phenotype=None,
        unsupported_variant_count=unsupported_count,
        limitations=PHENOTYPE_ENGINE_LIMITATIONS,
        provenance=state.provenance,
    )
