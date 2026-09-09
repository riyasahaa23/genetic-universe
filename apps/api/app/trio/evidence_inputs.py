"""Verify same-individual source linkage and attach concordant supplementary phase."""
import json
from collections import Counter
from pathlib import Path

from .ingestion import read_sample, resolve_input, sha256
from .models import Family, Filters, PhaseEvidence, Region, SampleInput, Variant, Warning

PHASE_FILTERS = Filters(min_qual=20, min_gq=30, min_dp=5)


def verified_artifacts(family: Family, root: Path):
    artifacts = [*family.evidence_artifacts, *(item.artifact for item in family.phase_inputs)]
    ids = set()
    for artifact in artifacts:
        if artifact.id in ids:
            raise ValueError("Duplicate evidence artifact ID")
        ids.add(artifact.id)
        if sha256(resolve_input(root, artifact.path)) != artifact.sha256:
            raise ValueError(f"Evidence checksum mismatch: {artifact.id}")
    return artifacts


def phenotype_observations(family: Family, root: Path):
    """Require explicit subject crosswalk, cited source assertion, and exact ontology mapping.

    These checks establish internal source linkage, not an independent medical
    diagnosis or the truth of a repository's reported history.
    """
    artifacts = {a.id: a for a in family.evidence_artifacts}

    def read(identifier):
        if identifier not in artifacts:
            raise ValueError(f"Missing phenotype evidence artifact: {identifier}")
        artifact = artifacts[identifier]
        payload = json.loads(resolve_input(root, artifact.path).read_text())
        if payload.get("source_url") != artifact.source_url:
            raise ValueError("Phenotype artifact URL does not match its source")
        return payload

    result = []
    for item in family.phenotype_observations:
        if item.sample_id != family.child.sample_id:
            raise ValueError("Child phenotype record belongs to a different individual")
        history, linkage, ontology = (read(item.source_artifact_id), read(item.linkage_artifact_id), read(item.ontology_artifact_id))
        if linkage.get("sample_links", {}).get(item.sample_id) != item.external_individual_id:
            raise ValueError("Phenotype-to-genome identity linkage is not documented")
        if history.get("external_individual_id") != item.external_individual_id:
            raise ValueError("Phenotype source subject mismatch")
        linked_family = linkage.get("family", {})
        if linked_family.get("child") != family.child.sample_id or {linked_family.get("father"), linked_family.get("mother")} != {family.parent_a.sample_id, family.parent_b.sample_id}:
            raise ValueError("Phenotype family linkage does not match the real trio")
        if item.label not in history.get("reported_terms", []) or ontology.get("terms", {}).get(item.hpo_id) != item.label:
            raise ValueError("Phenotype term lacks a source assertion or verified HPO mapping")
        result.append(item)
    return result


def attach_phase(variants: list[Variant], family: Family, root: Path, region: Region, computation_id: str):
    warnings = []
    roles = {family.parent_a.sample_id: "parent_A", family.parent_b.sample_id: "parent_B", family.child.sample_id: "child"}
    gt_attributes = {"parent_A": "parent_a_genotype", "parent_B": "parent_b_genotype", "child": "child_genotype"}
    seen_samples = set()
    for source in family.phase_inputs:
        if source.sample_id not in roles or source.sample_id in seen_samples:
            raise ValueError("Phase source must identify one unique member of this trio")
        seen_samples.add(source.sample_id)
        sample = SampleInput(sample_id=source.raw_sample_id, vcf=source.artifact.path,
                            sha256=source.artifact.sha256, source_url=source.artifact.source_url)
        records, issues = read_sample(sample, root, region, PHASE_FILTERS, family.reference_build)
        if issues:
            warnings.append(Warning(code="PHASE_SOURCE_QC", sample_id=source.sample_id,
                message=f"Supplementary phase input warning counts (all records retained in source): {dict(Counter(w.code for w in issues))}"))
        role = roles[source.sample_id]
        for variant in variants:
            original = getattr(variant, gt_attributes[role])
            site = records.get((variant.chromosome, variant.position, variant.reference))
            if not site or not original.usable:
                continue
            phase = site.genotype
            if not phase.usable or phase.gq is None or phase.gq < PHASE_FILTERS.min_gq or not phase.phased or not phase.phase_set:
                continue
            if sorted(original.alleles) != sorted(phase.alleles):
                warnings.append(Warning(code="PHASE_GENOTYPE_CONFLICT", sample_id=source.sample_id,
                    record=phase.source_record, message="Phase source genotype disagrees with benchmark; no phase transferred"))
                continue
            variant.phase_evidence[role] = PhaseEvidence(sample_id=source.sample_id, raw_sample_id=source.raw_sample_id,
                raw_gt=phase.raw_gt, alleles=phase.alleles, phase_set=phase.phase_set,
                source_record=phase.source_record, source_artifact_id=source.artifact.id, method=source.method,
                source_genotype=phase,
                provenance=[computation_id, source.artifact.id, source.identity_source])
    return warnings


def attach_reference_knowledge(variants: list[Variant], family: Family, root: Path, computation_id: str):
    """Exact-allele ClinVar lookup is external knowledge, never a join between people."""
    artifact = next((a for a in family.evidence_artifacts if a.id == "annotation:ClinVar:region"), None)
    if artifact is None:
        return
    if artifact.reference_build != family.reference_build:
        raise ValueError("ClinVar snapshot must declare the matching reference build")
    records, date = {}, None
    with resolve_input(root, artifact.path).open() as handle:
        for line in handle:
            if line.startswith("##fileDate="):
                date = line.strip().partition("=")[2]
            if line.startswith("#"):
                continue
            fields = line.rstrip().split("\t")
            if len(fields) < 8:
                raise ValueError("Malformed ClinVar reference record")
            info = dict(item.split("=", 1) for item in fields[7].split(";") if "=" in item)
            for alt in fields[4].split(","):
                identifier = f"{fields[0].removeprefix('chr')}:{fields[1]}:{fields[3]}:{alt}"
                records.setdefault(identifier, []).append({
                    "clinvar_record_id": fields[2],
                    "clinical_significance": info.get("CLNSIG"),
                    "condition_names": info.get("CLNDN"),
                    "review_status": info.get("CLNREVSTAT"),
                    "gene_info": info.get("GENEINFO"),
                    "molecular_consequence": info.get("MC"),
                })
    if date is None:
        raise ValueError("ClinVar snapshot date unavailable")
    for variant in variants:
        matches = records.get(variant.id, [])
        covered = artifact.region is not None and artifact.region.chromosome == variant.chromosome and artifact.region.start <= variant.position <= artifact.region.end
        match_status = ("exact_allele_match" if matches else "no_exact_allele_record_in_bounded_snapshot") if covered else "unresolved_outside_declared_snapshot_coverage"
        variant.reference_evidence = [{"source_artifact_id": artifact.id, "snapshot_date": date,
            "query_variant_id": variant.id, "evidence_status": "inferred" if covered else "unresolved", "scope": "external_variant_knowledge_not_subject_observation",
            "match_status": match_status, "reference_build": artifact.reference_build,
            "snapshot_region": artifact.region.model_dump() if artifact.region else None,
            "records": matches if covered else [], "limitations": ["Exact CHROM/POS/REF/ALT lookup; no reference-based normalization",
                "No record is not evidence of benignity or absence from all literature",
                "An allele annotation does not link another individual's phenotype to this child"],
            "provenance": [computation_id, artifact.id]}]
