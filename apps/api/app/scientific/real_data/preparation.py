"""Prepare a bounded 1000 Genomes trio manifest from an indexed VCF.

This module never invents calls, phases or phenotypes. It requires cyvcf2 for
the large indexed source file and writes small, checksum-addressed regional
VCFs suitable for the run API.
"""

from __future__ import annotations

from pathlib import Path
from typing import Any

from .ingestion import RealDataUnavailableError, sha256
from .models import Family, Filters, PhaseInput, Region, SampleInput, SourceArtifact
from .pedigree import PedigreeRegistry, TrioInfo, load_pedigree


def _cyvcf2():
    try:
        from cyvcf2 import VCF
    except ImportError as exc:  # pragma: no cover - exercised by the CLI smoke path
        raise RealDataUnavailableError(
            "Preparing an indexed VCF requires cyvcf2; install the genomics dependencies."
        ) from exc
    return VCF


def _scalar_format(record: Any, field: str, sample_index: int) -> str:
    try:
        values = record.format(field)
        value = values[sample_index]
        if hasattr(value, "tolist"):
            value = value.tolist()
        if isinstance(value, list):
            value = value[0] if value else "."
        return str(value) if value is not None else "."
    except (KeyError, IndexError, TypeError, ValueError):
        return "."


def _sample_format(record: Any, sample_index: int) -> str:
    genotype = record.genotypes[sample_index]
    if len(genotype) < 3 or genotype[0] < 0 or genotype[1] < 0:
        gt = "./."
    else:
        separator = "|" if genotype[2] else "/"
        gt = f"{genotype[0]}{separator}{genotype[1]}"
    return ":".join((gt, _scalar_format(record, "PS", sample_index), _scalar_format(record, "DP", sample_index), _scalar_format(record, "GQ", sample_index)))


def _record_fields(record: Any) -> list[str]:
    values = str(record).rstrip("\n").split("\t")
    if len(values) < 8:
        raise ValueError("cyvcf2 returned a malformed VCF record")
    return values[:8]


def extract_indexed_trio(
    raw_vcf: Path,
    trio: TrioInfo,
    region: Region,
    output_dir: Path,
) -> dict[str, Path]:
    """Extract exactly three samples from a bounded indexed VCF region."""

    if not raw_vcf.is_file():
        raise RealDataUnavailableError("The configured indexed VCF is unavailable")
    if not (Path(f"{raw_vcf}.tbi").is_file() or Path(f"{raw_vcf}.csi").is_file()):
        raise RealDataUnavailableError("The configured VCF must have a .tbi or .csi index")

    VCF = _cyvcf2()
    try:
        reader = VCF(str(raw_vcf))
    except Exception as exc:
        raise RealDataUnavailableError("The configured VCF could not be opened") from exc
    sample_ids = [trio.father_id, trio.mother_id, trio.child_id]
    missing = [sample_id for sample_id in sample_ids if sample_id not in reader.samples]
    if missing:
        reader.close()
        raise RealDataUnavailableError("One or more trio samples are missing from the VCF")
    indices = {sample_id: reader.samples.index(sample_id) for sample_id in sample_ids}
    sequence_names = [name for name in reader.seqnames if name.removeprefix("chr") == region.chromosome]
    if len(sequence_names) != 1:
        reader.close()
        raise RealDataUnavailableError("The requested chromosome is missing or ambiguous in the VCF")

    output_dir.mkdir(parents=True, exist_ok=True)
    paths = {sample_id: output_dir / f"{sample_id}.chr{region.chromosome}.{region.start}-{region.end}.vcf" for sample_id in sample_ids}
    handles = {sample_id: path.open("w", encoding="utf-8") for sample_id, path in paths.items()}
    try:
        header = reader.raw_header.splitlines()
        meta = [line for line in header if line.startswith("##")]
        if not any(line.startswith("##reference=") for line in meta):
            meta.append("##reference=GRCh38")
        meta.extend([
            '##FORMAT=<ID=GT,Number=1,Type=String,Description="Genotype">',
            '##FORMAT=<ID=PS,Number=1,Type=Integer,Description="Phase set identifier">',
            '##FORMAT=<ID=DP,Number=1,Type=Integer,Description="Read depth">',
            '##FORMAT=<ID=GQ,Number=1,Type=Integer,Description="Genotype quality">',
        ])
        for sample_id, handle in handles.items():
            handle.write("\n".join(meta) + "\n")
            handle.write("#CHROM\tPOS\tID\tREF\tALT\tQUAL\tFILTER\tINFO\tFORMAT\t" + sample_id + "\n")

        count = 0
        for record in reader(f"{sequence_names[0]}:{region.start}-{region.end}"):
            count += 1
            if count > 50_000:
                raise ValueError("Requested region contains more than 50,000 records")
            fields = _record_fields(record)
            prefix = "\t".join(fields + ["GT:PS:DP:GQ"])
            for sample_id, handle in handles.items():
                handle.write(prefix + "\t" + _sample_format(record, indices[sample_id]) + "\n")
    except Exception as exc:
        if isinstance(exc, ValueError):
            raise
        raise RealDataUnavailableError("The indexed VCF region could not be extracted") from exc
    finally:
        for handle in handles.values():
            handle.close()
        reader.close()
    return paths


def _family_manifest(
    root: Path,
    trio: TrioInfo,
    region: Region,
    paths: dict[str, Path],
    source_url: str,
) -> Family:
    relative = {sample_id: path.relative_to(root).as_posix() for sample_id, path in paths.items()}
    samples = {
        sample_id: SampleInput(
            sample_id=sample_id,
            vcf=relative[sample_id],
            sha256=sha256(paths[sample_id]),
            source_url=source_url,
        )
        for sample_id in paths
    }
    pedigree_dir = root / "real" / "1000g" / "pedigree"
    pedigree_dir.mkdir(parents=True, exist_ok=True)
    pedigree_path = pedigree_dir / f"{trio.trio_id}.ped"
    pedigree_path.write_text("\n".join(trio.to_full_ped_rows()) + "\n", encoding="utf-8")
    pedigree_relative = pedigree_path.relative_to(root).as_posix()

    phase_inputs = [
        PhaseInput(
            sample_id=sample_id,
            raw_sample_id=sample_id,
            artifact=SourceArtifact(
                id=f"phase:{sample_id}:{trio.trio_id}",
                path=relative[sample_id],
                sha256=samples[sample_id].sha256,
                source_url=source_url,
                description="Bounded phased VCF slice extracted from the official indexed panel",
                reference_build="GRCh38",
                region=region,
            ),
            identity_source=source_url,
            method="indexed_vcf_region_extraction",
        )
        for sample_id in (trio.father_id, trio.mother_id, trio.child_id)
    ]
    return Family(
        family_id=trio.trio_id,
        dataset_kind="real",
        reference_build="GRCh38",
        parent_a=samples[trio.father_id],
        parent_b=samples[trio.mother_id],
        child=samples[trio.child_id],
        pedigree=pedigree_relative,
        pedigree_sha256=sha256(pedigree_path),
        pedigree_source=source_url,
        regions=[region],
        filters=Filters(min_qual=0, min_gq=0, min_dp=0, require_pass=False, require_quality_fields=False),
        phase_inputs=phase_inputs,
    )


def prepare_1000g_trio(
    *,
    root: Path,
    raw_vcf: Path,
    pedigree_path: Path,
    child_id: str,
    region: Region,
    source_url: str,
) -> Family:
    """Extract one trio and write a manifest consumed by the API."""

    registry: PedigreeRegistry = load_pedigree(pedigree_path)
    trio = registry.get_trio(child_id)
    if trio is None:
        raise ValueError("The requested child is not a complete trio in the pedigree")
    paths = extract_indexed_trio(raw_vcf, trio, region, root / "real" / "1000g" / "regions")
    family = _family_manifest(root, trio, region, paths, source_url)
    # Keep one canonical manifest. FamilyStore still reads the short
    # ``metadata`` path for hand-authored fixtures, but writing both locations
    # would make one prepared family appear twice and fail duplicate detection.
    manifest_dir = root / "real" / "1000g" / "metadata"
    manifest_dir.mkdir(parents=True, exist_ok=True)
    (manifest_dir / f"{family.family_id}.family.json").write_text(family.model_dump_json(indent=2), encoding="utf-8")
    return family
