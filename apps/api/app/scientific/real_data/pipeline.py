"""Compose immutable input provenance into a bounded, JSON-ready child state."""
import hashlib
import importlib.metadata
import json
import logging
import platform
from pathlib import Path

from .configurations import investigate_configurations
from .evidence_inputs import (
    PHASE_FILTERS,
    attach_phase,
    attach_reference_knowledge,
    phenotype_observations,
    verified_artifacts,
)
from .ingestion import read_sample, verify_pedigree
from .inheritance import infer_variant
from .models import ChildState, Family, Genotype, Provenance, Region, SourceArtifact, Warning
from .segments import build_segments

logger = logging.getLogger(__name__)


def code_digest() -> str:
    digest = hashlib.sha256()
    for path in sorted(Path(__file__).parent.glob("*.py")):
        digest.update(path.name.encode())
        digest.update(path.read_bytes())
    return digest.hexdigest()


class FamilyStore:
    def __init__(self, root: Path, allow_validation: bool = False):
        self.root = root.resolve()
        self.allow_validation = allow_validation

    def _metadata_directories(self) -> list[Path]:
        """Return supported manifest locations in deterministic order.

        Prepared datasets use a namespaced directory while the first MVP
        preparation command writes a short path under ``data/metadata``.
        Accepting both keeps the artifact layout backwards-compatible without
        making the API guess a filesystem path supplied by a client.
        """

        candidates = [self.root / "metadata", self.root / "real" / "1000g" / "metadata"]
        return [directory for directory in candidates if directory.is_dir()]

    def families(self) -> list[Family]:
        result = []
        paths = [path for directory in self._metadata_directories() for path in directory.glob("*.family.json")]
        for path in sorted(paths):
            family = Family.model_validate_json(path.read_text(encoding="utf-8"))
            if family.dataset_kind != "real" and not self.allow_validation:
                raise ValueError("Synthetic validation manifest cannot be served by the real-data API")
            if any(existing.family_id == family.family_id for existing in result):
                raise ValueError("Duplicate family ID")
            result.append(family)
        return result

    def family(self, family_id: str) -> Family:
        for family in self.families():
            if family.family_id == family_id:
                return family
        raise KeyError(f"Unknown family: {family_id}")

    def state(self, family_id: str, requested: Region | None = None) -> ChildState:
        family = self.family(family_id)
        region = requested or family.regions[0]
        if not any(r.chromosome == region.chromosome and r.start <= region.start <= region.end <= r.end
                   for r in family.regions):
            raise ValueError("Requested region is outside this family's ingested regions")
        verify_pedigree(family, self.root)
        artifacts = verified_artifacts(family, self.root)
        observations = phenotype_observations(family, self.root)
        code_hash = code_digest()
        runtime = {name: importlib.metadata.version(name) for name in ("pydantic", "fastapi", "networkx")}
        runtime["python"] = platform.python_version()
        payload = {"family": family.model_dump(), "region": region.model_dump(), "algorithm": "trio-scientific-evidence/2.1.0",
                   "code_sha256": code_hash, "runtime": runtime, "phase_filters": PHASE_FILTERS.model_dump()}
        computation_id = hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()
        provenance = Provenance(computation_id=computation_id, dataset_kind=family.dataset_kind,
                                family_id=family.family_id, reference_build=family.reference_build,
                                region=region, filters=family.filters,
                                code_sha256=code_hash,
                                inputs=[s.model_dump() for s in (family.parent_a, family.parent_b, family.child)] +
                                [{"pedigree": family.pedigree, "sha256": family.pedigree_sha256,
                                  "source": family.pedigree_source}] + [a.model_dump() for a in artifacts] +
                                [{"runtime": runtime, "phase_filters": PHASE_FILTERS.model_dump(),
                                  "phase_identity_mappings": [p.model_dump() for p in family.phase_inputs]}])
        records, warnings = [], []
        for sample in (family.parent_a, family.parent_b, family.child):
            sites, issues = read_sample(sample, self.root, region, family.filters, family.reference_build)
            records.append(sites)
            warnings.extend(issues)
        variants = []
        for key, site in sorted(records[2].items()):
            parent_genotypes = []
            for sites, sample in zip(records[:2], (family.parent_a, family.parent_b)):
                if key in sites:
                    parent_genotypes.append(sites[key].genotype)
                else:
                    parent_genotypes.append(Genotype(sample_id=sample.sample_id, status="record_absent_not_reference", evidence_status="unresolved"))
                    warnings.append(Warning(code="PARENT_RECORD_ABSENT", sample_id=sample.sample_id,
                                            record=site.genotype.source_record,
                                            message="No matching CHROM/POS/REF record; no reference genotype assumed. Inputs must be normalized against the same assembly."))
            for alt in site.alternates:
                if alt not in site.genotype.alleles and site.genotype.usable:
                    continue
                variant = infer_variant(*key, alt, site.genotype, *parent_genotypes, computation_id)
                variant.annotations = family.variant_annotations.get(variant.id, [])
                variant.source_annotations = site.annotations
                variants.append(variant)
        warnings.extend(attach_phase(variants, family, self.root, region, computation_id))
        attach_reference_knowledge(variants, family, self.root, computation_id)
        samples = {"parent_a": family.parent_a.sample_id, "parent_b": family.parent_b.sample_id, "child": family.child.sample_id}
        recombination_sources = [SourceArtifact(id=f"benchmark:{s.sample_id}:GIAB", path=s.vcf,
            sha256=s.sha256, source_url=s.source_url, reference_build=family.reference_build,
            description="Unchanged benchmark VCF calls in configured regions")
            for s in (family.parent_a, family.parent_b, family.child)] + [p.artifact for p in family.phase_inputs]
        markers, segments, events, unresolved = build_segments(variants, computation_id, region, samples, recombination_sources)
        for event in events:
            event.interval_warnings = [w for w in warnings if w.record and event.start <= int(w.record.split(":")[1]) <= event.end]
        configurations = investigate_configurations(variants, computation_id)
        if not events:
            warnings.append(Warning(code="CROSSOVERS_UNRESOLVED", message="No supported within-PS homolog switch found. Empty events does not imply absence of biological recombination."))
        warnings.append(Warning(code="SEGMENT_RESOLUTION", message="Point markers and inferred haplotype blocks are separate. Blocks span phased informative markers, not experimentally observed continuous transmission; gaps and unobserved switches remain uncertain."))
        if family.phenotype_evidence:
            warnings.append(Warning(code="UNLINKED_PHENOTYPE_EVIDENCE", message="Legacy free-text phenotype evidence lacks checked individual linkage and is excluded from phenotype availability"))
        if not variants:
            warnings.append(Warning(code="NO_CHILD_VARIANTS", message="No child alternate records found in requested region"))
        logger.info("family=%s region=%s:%s-%s algorithm=%s computation=%s variants=%s warnings=%s",
                    family_id, region.chromosome, region.start, region.end, provenance.algorithm,
                    computation_id, len(variants), len(warnings))
        return ChildState(family_id=family_id, child_id=family.child.sample_id,
                          reference_build=family.reference_build, region=region,
                          samples=samples, variants=variants, markers=markers, segments=segments, recombination_events=events,
                          configurations=configurations, unresolved_regions=unresolved,
                          phenotype_evidence=[], phenotype_observations=observations, phenotype_available=bool(observations),
                          phenotype_status="phenotype_available" if observations else "phenotype_not_available",
                          inventory_metrics={"child_alt_features": len(variants),
                                             "mendelian_compatible_alt_copies": sum(v.inherited_alt_copies for v in variants)},
                          warnings=warnings, provenance=provenance)
