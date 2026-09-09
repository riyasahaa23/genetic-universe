"""Bounded VCF/BCF ingestion. Absent records NEVER imply a reference genotype."""
import gzip
import hashlib
import math
import re
from dataclasses import dataclass, field
from pathlib import Path

from .models import Family, Filters, Genotype, Region, SampleInput, Warning, chromosome_name

MAX_RECORDS = 50_000
MAX_TEXT_BYTES = 64 * 1024 * 1024


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def resolve_input(root: Path, name: str) -> Path:
    path = (root / name).resolve()
    if not path.is_relative_to(root.resolve()):
        raise ValueError("Input paths must stay within the data directory")
    if not path.is_file():
        raise ValueError(f"Missing input: {name}")
    return path


def verify_pedigree(family: Family, root: Path) -> None:
    """PED father/mother order is checked as an unordered parental pair; roles stay explicit."""
    path = resolve_input(root, family.pedigree)
    if sha256(path) != family.pedigree_sha256:
        raise ValueError("Pedigree checksum mismatch")
    rows = [line.split() for line in path.read_text().splitlines()
            if line.strip() and not line.startswith("#")]
    if any(len(row) != 6 for row in rows):
        raise ValueError("PED requires six columns")
    child = [row for row in rows if row[0] == family.family_id and row[1] == family.child.sample_id]
    if len(child) != 1 or set(child[0][2:4]) != {family.parent_a.sample_id, family.parent_b.sample_id}:
        raise ValueError("PED does not identify the configured child and parents uniquely")


@dataclass
class Site:
    chromosome: str
    position: int
    reference: str
    alternates: list[str]
    genotype: Genotype
    annotations: dict[str, str] = field(default_factory=dict)


def parse_gt(raw: str, reference: str, alternates: list[str]) -> tuple[list[str | None], bool]:
    """Resolve allele indices against each record's own ALT order, preserving missing alleles."""
    if not re.fullmatch(r"(?:\d+|\.)(?:[|/](?:\d+|\.))*", raw):
        raise ValueError(f"Malformed GT: {raw}")
    if "/" in raw and "|" in raw:
        raise ValueError("Mixed phasing separators are unsupported")
    catalog = [reference, *alternates]
    result = []
    for item in re.split(r"[|/]", raw):
        if item == ".":
            result.append(None)
        elif int(item) >= len(catalog):
            raise ValueError(f"GT allele index {item} exceeds ALT count")
        else:
            result.append(catalog[int(item)])
    return result, "|" in raw


def numeric(value: str | None, integer: bool = False):
    if value in {None, "."}:
        return None
    number = float(value)
    if not math.isfinite(number) or number < 0 or (integer and not number.is_integer()):
        raise ValueError("Invalid nonnegative quality/depth field")
    return int(number) if integer else number


def parse_record(line: str, sample_index: int, sample_id: str, filters: Filters) -> tuple[Site, list[Warning]]:
    fields = line.rstrip().split("\t")
    if len(fields) <= sample_index:
        raise ValueError("VCF row has fewer sample columns than its header")
    chrom, position, _, ref, alt, qual, filt, _, fmt = fields[:9]
    pos = int(position)
    if pos < 1 or not ref:
        raise ValueError("Invalid VCF coordinate/reference")
    alts = [] if alt == "." else alt.split(",")
    values = dict(zip(fmt.split(":"), fields[sample_index].split(":")))
    raw = values.get("GT", ".")
    alleles, phased = parse_gt(raw, ref, alts)
    record_id = f"{chrom}:{position}:{ref}:{alt}"
    gt = Genotype(sample_id=sample_id, raw_gt=raw, alleles=alleles, phased=phased,
                  phase_set=values.get("PS") if values.get("PS") not in {None, "."} else None,
                  qual=numeric(qual), gq=numeric(values.get("GQ")),
                  dp=numeric(values.get("DP"), integer=True), filter=filt,
                  phase_quality=numeric(values.get("PQ")), junction_quality=numeric(values.get("JQ")),
                  usable=True, status="observed", source_record=record_id)
    issues = []
    if len(alleles) != 2:
        issues.append(("UNSUPPORTED_PLOIDY", "Only diploid autosomal GTs are analyzed"))
    if None in alleles:
        issues.append(("MISSING_GT", "Missing or partial genotype"))
    if filters.require_pass and filt != "PASS":
        issues.append(("FILTERED", f"FILTER is {filt}, not PASS"))
    for label, value, minimum in (("QUAL", gt.qual, filters.min_qual),
                                   ("GQ", gt.gq, filters.min_gq), ("DP", gt.dp, filters.min_dp)):
        if value is not None and value < minimum:
            issues.append(("LOW_QUALITY", f"{label}={value} below {minimum}"))
        elif value is None and filters.require_quality_fields:
            issues.append(("MISSING_QUALITY", f"Required {label} unavailable"))
    if any(not re.fullmatch("[ACGTNacgtn]+", allele) for allele in [ref, *alts]):
        issues.append(("UNSUPPORTED_ALLELE", "Symbolic/spanning/breakend alleles are retained but not inferred"))
    gt.usable = not issues
    if issues:
        gt.status = ";".join(sorted({code for code, _ in issues}))
    warnings = [Warning(code=code, message=msg, sample_id=sample_id, record=record_id)
                for code, msg in issues]
    if not filters.require_quality_fields and any(x is None for x in (gt.qual, gt.gq, gt.dp)):
        warnings.append(Warning(code="QUALITY_UNAVAILABLE", message="One or more QUAL/GQ/DP fields absent; existing fields filtered, no quality confidence assigned", sample_id=sample_id, record=record_id))
    annotations = {}
    for item in fields[7].split(";"):
        key, _, value = item.partition("=")
        if key in {"difficultregion", "callable", "platforms", "platformnames"}:
            annotations[key] = value
    return Site(chromosome_name(chrom), pos, ref, alts, gt, annotations), warnings


def vcf_lines(path: Path, region: Region):
    """Use HTSlib for indexed large inputs/BCF; stream bounded small VCFs portably on Windows."""
    indexed = Path(str(path) + ".tbi").exists() or Path(str(path) + ".csi").exists()
    if path.suffix == ".bcf" or indexed:
        try:
            from cyvcf2 import VCF
        except ImportError:
            raise ValueError("Indexed VCF/BCF requires cyvcf2; install backend/requirements-genomics.txt on Linux/WSL") from None
        try:
            reader = VCF(str(path))
        except Exception as exc:
            raise ValueError(f"HTSlib could not open input: {exc}") from exc
        try:
            matches = [name for name in reader.seqnames if chromosome_name(name) == region.chromosome]
            if len(matches) != 1:
                raise ValueError("Requested chromosome missing or ambiguous in VCF header")
            for line in reader.raw_header.splitlines():
                yield line
            for record in reader(f"{matches[0]}:{region.start}-{region.end}"):
                yield str(record)
        except Exception as exc:
            raise ValueError(f"HTSlib region query failed; verify VCF/BCF and index: {exc}") from exc
        finally:
            reader.close()
        return
    if path.stat().st_size > MAX_TEXT_BYTES:
        raise ValueError("Large VCF requires a tabix/CSI index and cyvcf2")
    opener = gzip.open if path.suffix in {".gz", ".bgz"} else open
    with opener(path, "rt", encoding="utf-8") as handle:
        total = 0
        for line in handle:
            total += len(line)
            if total > MAX_TEXT_BYTES:
                raise ValueError("Uncompressed VCF exceeds 64 MiB; use indexed region access")
            yield line


def read_sample(sample: SampleInput, root: Path, region: Region, filters: Filters,
                reference_build: str | None = None):
    path = resolve_input(root, sample.vcf)
    if sha256(path) != sample.sha256:
        raise ValueError(f"VCF checksum mismatch: {sample.sample_id}")
    sites, warnings = {}, []
    sample_index = None
    count = 0
    header_builds = set()
    for line in vcf_lines(path, region):
        if line.startswith(("##reference=", "##contig=")):
            header_builds.update(re.findall(r"GRCh(?:37|38)", line))
            if "hg19" in line:
                header_builds.add("GRCh37")
            if "hg38" in line:
                header_builds.add("GRCh38")
            if reference_build and header_builds - {reference_build}:
                raise ValueError(f"VCF assembly conflicts with declared {reference_build}")
        if line.startswith("#CHROM"):
            columns = line.rstrip().split("\t")
            if columns[9:].count(sample.sample_id) != 1:
                raise ValueError(f"Sample {sample.sample_id} missing or duplicated in {path.name}")
            sample_index = columns.index(sample.sample_id, 9)
        elif not line.startswith("#") and line.strip():
            if sample_index is None:
                raise ValueError("Missing #CHROM/sample header")
            try:
                columns = line.split("\t", 3)
                chrom, pos = chromosome_name(columns[0]), int(columns[1])
            except (ValueError, IndexError):
                raise ValueError("Malformed VCF coordinate; cannot determine requested-region membership") from None
            if chrom != region.chromosome or not region.start <= pos <= region.end:
                continue
            count += 1
            if count > MAX_RECORDS:
                raise ValueError("Region exceeds 50,000 VCF records per sample; request a smaller region")
            try:
                site, issues = parse_record(line, sample_index, sample.sample_id, filters)
            except (ValueError, IndexError) as exc:
                # Reject a malformed input rather than accidentally using a partial trio.
                raise ValueError(f"{sample.sample_id} {chrom}:{pos}: {exc}") from exc
            key = (chrom, pos, site.reference)
            if key in sites:
                sites[key].genotype.usable = False
                sites[key].genotype.status = "duplicate_site"
                sites[key].alternates = sorted(set(sites[key].alternates + site.alternates))
                warnings.append(Warning(code="DUPLICATE_SITE", message="Duplicate/split site cannot be combined safely; inference disabled", sample_id=sample.sample_id, record=site.genotype.source_record))
            else:
                sites[key] = site
            warnings.extend(issues)
    if sample_index is None:
        raise ValueError("VCF sample header not found")
    if reference_build and not header_builds:
        warnings.append(Warning(code="ASSEMBLY_UNVERIFIED", sample_id=sample.sample_id,
                                message=f"No recognized build in VCF header; using manifest declaration {reference_build}"))
    return sites, warnings
