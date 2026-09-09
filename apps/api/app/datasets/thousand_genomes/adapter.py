"""1000 Genomes Project FamilyStore adapter.

Bridges 1kGP trios into the core FamilyStore pipeline while enforcing:
- Dataset kind: 'real'.
- Reference build: 'GRCh38'.
- Pedigree integrity: 6-column PED with SHA-256 verification.
- Strict phenotype boundary: phenotype_available=False, phenotype_status='phenotype_not_available'.
- Accurate inheritance taxonomy: ordinary Mendelian combinations are never labeled de novo mutations.
- Recombination intervals: labeled as candidate homolog switches, never exact biological breakpoints.
- Strict NO-FALLBACK: Fails with RealDataUnavailableError when authentic data is missing.
"""
from __future__ import annotations

import logging
import time
from pathlib import Path
from typing import Optional, Sequence

from app.scientific.real_data.models import (
    ChildState,
    Family,
    Filters,
    PhaseInput,
    Region,
    SampleInput,
    SourceArtifact,
)
from app.scientific.real_data.pipeline import FamilyStore

from .extractor import BoundedRegionalExtractor, compute_sha256
from .pedigree import PedigreeRegistry, TrioInfo, load_pedigree

logger = logging.getLogger(__name__)

EBI_PEDIGREE_SOURCE_URL = (
    "http://ftp.1000genomes.ebi.ac.uk/vol1/ftp/data_collections/1000G_2504_high_coverage/"
    "20130606_g1k_3202_samples_ped_population.txt"
)
EBI_VCF_SOURCE_URL = (
    "http://ftp.1000genomes.ebi.ac.uk/vol1/ftp/data_collections/1000G_2504_high_coverage/working/"
    "20220422_3202_phased_SNV_INDEL_SV/1kGP_high_coverage_Illumina.chr1.filtered.SNV_INDEL_SV_phased_panel.vcf.gz"
)


def export_family_manifest(
    trio: TrioInfo,
    region: Region,
    data_root: Path,
    father_vcf_rel: str,
    mother_vcf_rel: str,
    child_vcf_rel: str,
    father_sha256: str,
    mother_sha256: str,
    child_sha256: str,
    copy_to_root_metadata: bool = True,
) -> Family:
    """Generate and write a Family manifest matching GIAB_AJ schema parity."""
    data_root = data_root.resolve()
    ped_dir = data_root / "real" / "1000g" / "pedigree"
    ped_dir.mkdir(parents=True, exist_ok=True)
    meta_dir = data_root / "real" / "1000g" / "metadata"
    meta_dir.mkdir(parents=True, exist_ok=True)

    # 1. Write trio PED file
    ped_file = ped_dir / f"{trio.trio_id}.ped"
    ped_content = "\n".join(trio.to_full_ped_rows()) + "\n"
    ped_file.write_text(ped_content, encoding="utf-8")
    ped_sha256 = compute_sha256(ped_file)
    ped_rel = f"real/1000g/pedigree/{trio.trio_id}.ped"

    # 2. Build Family model
    family = Family(
        family_id=trio.trio_id,
        dataset_kind="real",
        reference_build="GRCh38",
        regions=[region],
        phenotype_evidence=[],  # STRICT: No fabricated phenotype evidence
        variant_annotations={},
        parent_a=SampleInput(
            sample_id=trio.father_id,
            vcf=father_vcf_rel,
            sha256=father_sha256,
            source_url=EBI_VCF_SOURCE_URL,
        ),
        parent_b=SampleInput(
            sample_id=trio.mother_id,
            vcf=mother_vcf_rel,
            sha256=mother_sha256,
            source_url=EBI_VCF_SOURCE_URL,
        ),
        child=SampleInput(
            sample_id=trio.child_id,
            vcf=child_vcf_rel,
            sha256=child_sha256,
            source_url=EBI_VCF_SOURCE_URL,
        ),
        pedigree=ped_rel,
        pedigree_sha256=ped_sha256,
        pedigree_source=EBI_PEDIGREE_SOURCE_URL,
        phase_inputs=[
            PhaseInput(
                sample_id=trio.father_id,
                raw_sample_id=trio.father_id,
                artifact=SourceArtifact(
                    id=f"phase:{trio.father_id}:1000G",
                    path=father_vcf_rel,
                    sha256=father_sha256,
                    source_url=EBI_VCF_SOURCE_URL,
                    description="1000 Genomes high-coverage phased VCF slice",
                    reference_build="GRCh38",
                ),
                identity_source=EBI_PEDIGREE_SOURCE_URL,
                method="1kGP_high_coverage_phasing",
            ),
            PhaseInput(
                sample_id=trio.mother_id,
                raw_sample_id=trio.mother_id,
                artifact=SourceArtifact(
                    id=f"phase:{trio.mother_id}:1000G",
                    path=mother_vcf_rel,
                    sha256=mother_sha256,
                    source_url=EBI_VCF_SOURCE_URL,
                    description="1000 Genomes high-coverage phased VCF slice",
                    reference_build="GRCh38",
                ),
                identity_source=EBI_PEDIGREE_SOURCE_URL,
                method="1kGP_high_coverage_phasing",
            ),
            PhaseInput(
                sample_id=trio.child_id,
                raw_sample_id=trio.child_id,
                artifact=SourceArtifact(
                    id=f"phase:{trio.child_id}:1000G",
                    path=child_vcf_rel,
                    sha256=child_sha256,
                    source_url=EBI_VCF_SOURCE_URL,
                    description="1000 Genomes high-coverage phased VCF slice",
                    reference_build="GRCh38",
                ),
                identity_source=EBI_PEDIGREE_SOURCE_URL,
                method="1kGP_high_coverage_phasing",
            ),
        ],
        filters=Filters(
            min_qual=0.0,
            min_gq=0.0,
            min_dp=0,
            require_pass=False,
            require_quality_fields=False,
        ),
    )

    # 3. Save manifest to data/real/1000g/metadata/
    manifest_json = family.model_dump_json(indent=2)
    manifest_path = meta_dir / f"{trio.trio_id}.family.json"
    manifest_path.write_text(manifest_json, encoding="utf-8")

    # 4. Also copy to data/metadata/ if requested so default FamilyStore(data_root) sees it directly
    if copy_to_root_metadata:
        root_meta_dir = data_root / "metadata"
        root_meta_dir.mkdir(parents=True, exist_ok=True)
        (root_meta_dir / f"{trio.trio_id}.family.json").write_text(manifest_json, encoding="utf-8")

    logger.debug("Exported authentic manifest for %s to %s", trio.trio_id, manifest_path)
    return family


class ThousandGenomesAdapter:
    """High-level orchestration adapter for authentic 1000 Genomes trios."""

    def __init__(self, data_root: Path, registry: Optional[PedigreeRegistry] = None, raw_vcf_path: Optional[Path] = None):
        self.data_root = data_root.resolve()
        self.registry = registry or load_pedigree(self.data_root / "real" / "1000g" / "pedigree" / "20130606_g1k_3202_samples_ped_population.txt")
        self.extractor = BoundedRegionalExtractor(self.data_root, raw_vcf_path=raw_vcf_path)
        self.store = FamilyStore(self.data_root)

    def prepare_trio(
        self,
        trio: TrioInfo,
        region: Region,
    ) -> Family:
        """Extract authentic bounded trio regional slice and write Family manifest.

        Strict no-fallback: Fails with RealDataUnavailableError if authentic data is missing.
        """
        vcf_dir = self.data_root / "real" / "1000g" / "regions"
        vcf_dir.mkdir(parents=True, exist_ok=True)

        records = self.extractor.extract_trio_records(
            child_id=trio.child_id,
            father_id=trio.father_id,
            mother_id=trio.mother_id,
            region=region,
        )

        reg_tag = f"chr{region.chromosome}_{region.start}_{region.end}"
        father_vcf = vcf_dir / f"{trio.father_id}.{reg_tag}.vcf"
        mother_vcf = vcf_dir / f"{trio.mother_id}.{reg_tag}.vcf"
        child_vcf = vcf_dir / f"{trio.child_id}.{reg_tag}.vcf"

        self.extractor.write_sample_vcf(trio.father_id, region, records, father_vcf)
        self.extractor.write_sample_vcf(trio.mother_id, region, records, mother_vcf)
        self.extractor.write_sample_vcf(trio.child_id, region, records, child_vcf)

        father_rel = f"real/1000g/regions/{trio.father_id}.{reg_tag}.vcf"
        mother_rel = f"real/1000g/regions/{trio.mother_id}.{reg_tag}.vcf"
        child_rel = f"real/1000g/regions/{trio.child_id}.{reg_tag}.vcf"

        family = export_family_manifest(
            trio=trio,
            region=region,
            data_root=self.data_root,
            father_vcf_rel=father_rel,
            mother_vcf_rel=mother_rel,
            child_vcf_rel=child_rel,
            father_sha256=compute_sha256(father_vcf),
            mother_sha256=compute_sha256(mother_vcf),
            child_sha256=compute_sha256(child_vcf),
            copy_to_root_metadata=True,
        )
        return family

    def run_pipeline(self, trio_id: str, region: Optional[Region] = None) -> ChildState:
        """Run the core FamilyStore pipeline on an authentic 1000G trio."""
        state = self.store.state(trio_id, region)

        # STRICT REAL-DATA ASSERTIONS
        assert state.phenotype_available is False, "Real 1000G trio must not claim phenotype availability"
        assert state.phenotype_status == "phenotype_not_available", "Phenotype status must be phenotype_not_available"
        assert len(state.phenotype_observations) == 0, "Phenotype observations must be strictly empty"

        return state

    def evaluate_cohort(
        self,
        trios: Sequence[TrioInfo],
        region: Region,
    ) -> dict:
        """Evaluate multi-trio cohort across authentic real-data criteria."""
        results = []
        t0 = time.perf_counter()

        for trio in trios:
            self.prepare_trio(trio=trio, region=region)
            state = self.run_pipeline(trio.trio_id, region)

            de_novo_vars = [v.id for v in state.variants if v.origin == "de_novo_candidate"]
            ord_combos = [c.id for c in state.configurations if c.classification == "ordinary_mendelian_combination"]

            results.append({
                "trio_id": trio.trio_id,
                "child_id": trio.child_id,
                "superpopulation": trio.superpopulation,
                "population": trio.population,
                "variant_count": len(state.variants),
                "marker_count": len(state.markers),
                "recombination_event_count": len(state.recombination_events),
                "de_novo_candidate_count": len(de_novo_vars),
                "ordinary_mendelian_configurations": len(ord_combos),
                "phenotype_available": state.phenotype_available,
                "phenotype_status": state.phenotype_status,
            })

        elapsed = time.perf_counter() - t0
        mean_ms = (elapsed / len(trios) * 1000.0) if trios else 0.0

        superpops = sorted(list({r["superpopulation"] for r in results}))
        pops = sorted(list({r["population"] for r in results}))

        summary = {
            "total_trios_evaluated": len(results),
            "superpopulations_represented": superpops,
            "populations_represented": pops,
            "total_variants_analyzed": sum(r["variant_count"] for r in results),
            "total_recombination_events_inferred": sum(r["recombination_event_count"] for r in results),
            "total_ordinary_mendelian_combinations": sum(r["ordinary_mendelian_configurations"] for r in results),
            "total_de_novo_candidates": sum(r["de_novo_candidate_count"] for r in results),
            "elapsed_seconds": round(elapsed, 2),
            "mean_execution_ms_per_trio": round(mean_ms, 2),
            "phenotype_leakage_detected": any(r["phenotype_available"] for r in results),
            "phenotype_model_status_unavailable_pct": 100.0,
            "cohort_results": results,
        }
        return summary
