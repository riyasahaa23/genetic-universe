"""Exhaustive streaming of configured real VCF resources through shared switch rules.

Every source is consumed through EOF. One chromosome at a time is retained in
memory. No chromosome whitelist, candidate limit, genotype imputation or PS
bridging is applied. Diploid transmission remains the unchanged eligibility rule.
"""
import gzip
import hashlib
import json
import re
from collections import Counter
from dataclasses import dataclass
from itertools import groupby, product
from pathlib import Path

from .ingestion import numeric, parse_gt, sha256
from .models import Genotype, PhaseEvidence, RecombinationEvent, SourceArtifact, SwitchMarkerEvidence, chromosome_name
from .switch_rules import ALGORITHM, MAX_MARKER_GAP, partition_runs, rejection_reasons

SCAN_VERSION = "exhaustive-giab-transmission/1.0.0"


def chrom_order(chrom):
    return (0, int(chrom)) if chrom.isdigit() else (1, {"X": 23, "Y": 24, "MT": 25}.get(chrom, 99), chrom)


@dataclass(slots=True)
class Call:
    alleles: tuple
    raw_gt: str
    phase_set: str | None
    qual: float | None
    gq: float | None
    dp: int | None
    pq: float | None
    jq: float | None
    alt: str
    usable: bool
    reasons: tuple


def decode(fields, phase):
    values = dict(zip(fields[8].split(":"), fields[9].split(":")))
    raw = values.get("GT", ".")
    alts = [] if fields[4] == "." else fields[4].split(",")
    alleles, phased = parse_gt(raw, fields[3], alts)
    qual, gq, dp = numeric(fields[5]), numeric(values.get("GQ")), numeric(values.get("DP"), True)
    reasons = []
    if len(alleles) != 2:
        reasons.append("unsupported_ploidy")
    if None in alleles:
        reasons.append("missing_genotype")
    if fields[6] != "PASS":
        reasons.append("filtered")
    if any(v is not None and v < minimum for v, minimum in [(qual, 20), (gq, 30 if phase else 20), (dp, 5)]):
        reasons.append("low_quality")
    if any(not re.fullmatch("[ACGTNacgtn]+", a) for a in [fields[3], *alts]):
        reasons.append("unsupported_allele")
    ps = values.get("PS") if values.get("PS") not in (None, ".") else None
    if phase and (not phased or ps is None or gq is None):
        reasons.append("phase_or_phase_quality_unavailable")
    return Call(tuple(alleles), raw, ps, qual, gq, dp, numeric(values.get("PQ")), numeric(values.get("JQ")), fields[4], not reasons, tuple(reasons))


class SourceReader:
    def __init__(self, root, metadata, sample_id, phase):
        self.metadata, self.sample_id, self.phase = metadata, sample_id, phase
        self.lengths, self.coverage = {}, {}
        self.raw_sample = None
        self.handle = gzip.open(root / metadata["path"], "rt")
        self.groups = groupby(self.lines(), key=lambda f: chromosome_name(f[0]))
        self.peek = next(self.groups, None)
        self.seen_chromosomes = set()

    def lines(self):
        for line in self.handle:
            if line.startswith("##contig="):
                match = re.search(r"ID=([^,>]+),length=(\d+)", line)
                if match:
                    self.lengths[chromosome_name(match[1])] = int(match[2])
            if line.startswith("#CHROM"):
                samples = line.rstrip().split("\t")[9:]
                if len(samples) != 1:
                    raise ValueError("Configured source must be single-sample")
                self.raw_sample = samples[0]
            if not line.startswith("#"):
                if self.raw_sample is None:
                    raise ValueError("Source lacks sample header")
                yield line.rstrip().split("\t")

    def take(self, chrom):
        if self.peek is None or self.peek[0] != chrom:
            return {}
        if chrom in self.seen_chromosomes:
            raise ValueError("Chromosome records must be contiguous")
        self.seen_chromosomes.add(chrom)
        records, counts = {}, Counter()
        first, last, previous = None, None, 0
        for fields in self.peek[1]:
            pos = int(fields[1])
            if pos < previous:
                raise ValueError("VCF source is not coordinate sorted")
            previous = pos
            first = pos if first is None else first
            last = pos
            key = (pos, fields[3])
            call = decode(fields, self.phase)
            counts["records"] += 1
            counts.update(call.reasons)
            if key in records:
                call.usable = False
                call.reasons = ("duplicate_site",)
                counts["duplicate_site"] += 1
            records[key] = call
        self.coverage[chrom] = {"first_record": first, "last_record": last, "reference_length": self.lengths.get(chrom),
                                "raw_sample_id": self.raw_sample, **dict(counts)}
        self.peek = next(self.groups, None)
        return records


@dataclass(slots=True)
class Point:
    chromosome: str
    start: int
    phase_set: str
    homolog: int
    key: tuple
    transmitted: str
    variant_id: str


def informative_points(chrom, calls, phases, index):
    points, excluded = [], Counter()
    for key, child in sorted(calls[2].items()):
        parents = [p.get(key) for p in calls[:2]]
        if not child.usable:
            excluded["unusable_child"] += 1
            continue
        if any(p is None for p in parents):
            excluded["missing_parent_record"] += 1
            continue
        if any(not p.usable for p in parents):
            excluded["unusable_parent"] += 1
            continue
        pairs = {pair for pair in product(*(p.alleles for p in parents)) if sorted(pair) == sorted(child.alleles)}
        transmitted = {pair[index] for pair in pairs}
        if len(transmitted) != 1:
            excluded["ambiguous_transmission" if pairs else "mendelian_inconsistent"] += 1
            continue
        phase = phases.get(key)
        if phase is None or not phase.usable:
            excluded["missing_or_unusable_phase"] += 1
            continue
        if sorted(phase.alleles) != sorted(parents[index].alleles):
            excluded["phase_genotype_conflict"] += 1
            continue
        if len(set(phase.alleles)) != 2:
            excluded["homozygous_parent_not_homolog_informative"] += 1
            continue
        allele = next(iter(transmitted))
        points.append(Point(chrom, key[0], phase.phase_set, phase.alleles.index(allele), key,
                            allele, f"{chrom}:{key[0]}:{key[1]}:{child.alt}"))
    return points, dict(excluded)


def source_genotype(call, raw_sample, chrom, key):
    return Genotype(sample_id=raw_sample, raw_gt=call.raw_gt, alleles=list(call.alleles), phased="|" in call.raw_gt,
                    phase_set=call.phase_set, qual=call.qual, gq=call.gq, dp=call.dp, phase_quality=call.pq,
                    junction_quality=call.jq, filter="PASS", usable=call.usable, status="observed",
                    source_record=f"chr{chrom}:{key[0]}:{key[1]}:{call.alt}")


def run_scan(root: Path, family, metadata):
    identifiers = [family.parent_a.sample_id, family.parent_b.sample_id, family.child.sample_id]
    names = [s + ".benchmark" for s in identifiers] + [s + ".phase" for s in identifiers]
    by_name = {s["id"]: s for s in metadata}
    sources = [SourceArtifact(id=name, path=by_name[name]["path"], sha256=by_name[name]["sha256"],
                source_url=by_name[name]["source_url"], reference_build=family.reference_build,
                description="Complete upstream compressed VCF, consumed through EOF") for name in names]
    for source in sources:
        if sha256(root / source.path) != source.sha256:
            raise ValueError("Source checksum mismatch: " + source.id)
    code = hashlib.sha256()
    for name in ("genome_scan.py", "switch_rules.py", "models.py", "ingestion.py"):
        code.update(name.encode()); code.update(Path(__file__).with_name(name).read_bytes())
    code_hash = code.hexdigest()
    provenance = {"scan_version": SCAN_VERSION, "algorithm": ALGORITHM, "code_sha256": code_hash,
                  "sources": [s.model_dump() for s in sources], "reference_build": family.reference_build,
                  "parameters": {"minimum_flank_markers": 2, "max_marker_gap_bp": MAX_MARKER_GAP,
                                 "min_qual": 20, "min_dp_when_present": 5, "benchmark_min_gq_when_present": 20,
                                 "phase_min_gq_required": 30, "require_pass": True, "require_diploid": True}}
    computation = hashlib.sha256(json.dumps(provenance, sort_keys=True).encode()).hexdigest()
    provenance["computation_id"] = computation
    readers = [SourceReader(root, by_name[name], identifiers[i % 3], i >= 3) for i, name in enumerate(names)]
    events, rejected, insufficient, statistics = [], [], [], []
    try:
        while any(r.peek is not None for r in readers):
            chrom = min((r.peek[0] for r in readers if r.peek is not None), key=chrom_order)
            tables = [r.take(chrom) for r in readers]
            calls = tables[:3]
            lengths = {r.lengths[chrom] for r in readers if chrom in r.lengths}
            if len(lengths) != 1:
                raise ValueError("Missing or conflicting chromosome lengths: " + chrom)
            length = next(iter(lengths))
            for i, sample in enumerate(identifiers[:2]):
                points, exclusions = informative_points(chrom, calls, tables[3 + i], i)
                runs = partition_runs(points)
                counts, reasons_count = Counter(), Counter()
                for left, right in zip(runs, runs[1:]):
                    reasons = rejection_reasons(left, right)
                    if reasons:
                        counts["rejected_transitions"] += 1
                        reasons_count[reasons[0]] += 1
                        rejected.append({"chromosome": chrom, "parent": sample, "start": left[-1].start, "end": right[0].start,
                            "left_count": len(left), "right_count": len(right), "left_PS": left[-1].phase_set,
                            "right_PS": right[0].phase_set, "homolog_before": left[-1].homolog, "homolog_after": right[0].homolog,
                            "reasons": reasons, "classification": "rejected_transition_not_a_crossover"})
                        continue

                    def phase_evidence(table_index, point):
                        call = tables[table_index].get(point.key)
                        benchmark = calls[table_index - 3].get(point.key)
                        if call is None or not call.usable or benchmark is None or sorted(call.alleles) != sorted(benchmark.alleles):
                            return None
                        genotype = source_genotype(call, readers[table_index].raw_sample, chrom, point.key)
                        return PhaseEvidence(sample_id=identifiers[table_index - 3], raw_sample_id=genotype.sample_id,
                            raw_gt=call.raw_gt, alleles=list(call.alleles), phase_set=call.phase_set,
                            source_record=genotype.source_record, source_artifact_id=sources[table_index].id,
                            method="10x_linked_read_phasing" if table_index != 5 else "GIAB_StrandSeq_HiFi_trio_consensus",
                            source_genotype=genotype, provenance=[computation, sources[table_index].id])

                    def flank(point):
                        return SwitchMarkerEvidence(variant_id=point.variant_id, chromosome=chrom, position=point.start,
                            genotypes={identifiers[j]: source_genotype(calls[j][point.key], identifiers[j], chrom, point.key) for j in range(3)},
                            parental_phase=phase_evidence(3 + i, point), child_phase=phase_evidence(5, point), parent_sample=sample,
                            transmitted_allele=point.transmitted, transmitted_homolog=point.homolog, provenance=[computation])

                    event = RecombinationEvent(id=f"switch:{chrom}:{sample}:{left[-1].start}-{right[0].start}", chromosome=chrom,
                        start=left[-1].start, end=right[0].start, parent_sample=sample, phase_set=left[-1].phase_set,
                        left_origin=f"{sample}:homolog_{left[-1].homolog}", right_origin=f"{sample}:homolog_{right[0].homolog}",
                        left_homolog=left[-1].homolog, right_homolog=right[0].homolog,
                        left_marker_ids=[p.variant_id for p in left], right_marker_ids=[p.variant_id for p in right],
                        left_flanking_markers=[flank(p) for p in left[-2:]], right_flanking_markers=[flank(p) for p in right[:2]],
                        source_artifact_ids=[sources[3+i].id], sources=sources, provenance=[computation])
                    events.append(event.model_dump())
                    counts["candidates"] += 1
                cursor, unresolved_count, unresolved_bp = 1, 0, 0
                for run in runs:
                    if len(run) < 2:
                        continue
                    start, end = run[0].start, run[-1].start
                    if cursor < start:
                        insufficient.append({"chromosome": chrom, "parent": sample, "start": cursor, "end": start-1,
                            "evidence_status": "unresolved", "reason": "outside_supported_multi_marker_span"})
                        unresolved_count += 1; unresolved_bp += start-cursor
                    cursor = end+1
                if cursor <= length:
                    insufficient.append({"chromosome": chrom, "parent": sample, "start": cursor, "end": length,
                        "evidence_status": "unresolved", "reason": "outside_supported_multi_marker_span"})
                    unresolved_count += 1; unresolved_bp += length-cursor+1
                statistics.append({"chromosome": chrom, "parent": sample, "reference_length": length,
                    "informative_markers": len(points), "runs": len(runs), "candidate_count": counts["candidates"],
                    "rejected_transition_count": counts["rejected_transitions"], "rejected_primary_reasons": dict(reasons_count),
                    "locus_exclusions": exclusions, "insufficient_region_count": unresolved_count, "insufficient_bp": unresolved_bp})
            print("SCANNED", chrom, "candidates", sum(s["candidate_count"] for s in statistics if s["chromosome"] == chrom),
                  "informative", sum(s["informative_markers"] for s in statistics if s["chromosome"] == chrom), flush=True)
            del tables, calls, points, runs
    finally:
        for reader in readers:
            reader.handle.close()
    for j, reader in enumerate(readers):
        expected = identifiers[j] if j < 3 else next(p.raw_sample_id for p in family.phase_inputs if p.sample_id == identifiers[j-3])
        if reader.raw_sample != expected:
            raise ValueError("Raw source sample identity mismatch")
    events.sort(key=lambda e: (chrom_order(e["chromosome"]), e["start"], e["parent_sample"], e["end"]))
    if len({e["id"] for e in events}) != len(events):
        raise ValueError("Duplicate candidate IDs")
    return {"family_id": family.family_id, "complete": True, "scope": "all_record_bearing_chromosomes_in_configured_sources",
            "provenance": provenance, "source_coverage": {names[i]: r.coverage for i, r in enumerate(readers)},
            "header_chromosomes": {names[i]: r.lengths for i, r in enumerate(readers)}, "statistics": statistics,
            "candidates": events, "rejected_transitions": rejected, "insufficient_evidence_regions": insufficient,
            "limitations": ["Candidates are conditional on reported phase, not proven meiotic crossovers",
                "Diploid usable shared trio variant loci only; absent reference calls are not imputed",
                "Child supplementary phase includes trio information and is not independent validation",
                "Unresolved coverage intervals are not inferred crossover events",
                "Rejected transitions are run boundaries, not a count of biological crossovers",
                "No calibrated crossover probability, exact breakpoint or phenotype effect"]}
