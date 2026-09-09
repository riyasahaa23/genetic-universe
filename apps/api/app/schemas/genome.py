"""Genome, gamete, segment and crossover API contracts."""

from __future__ import annotations

from pydantic import Field, model_validator

from .common import BreakpointConfidence, ContractModel, EvidenceStatus


class LocusSnapshot(ContractModel):
    locus_id: str
    chromosome: str
    position: int = Field(ge=0)
    allele_values: list[int] = Field(min_length=2)
    source_variant_id: str | None = None


class SegmentProvenance(ContractModel):
    segment_id: str
    start_locus_index: int = Field(ge=0)
    end_locus_index: int = Field(gt=0)
    source_parent: str
    source_haplotype_id: str
    crossover_id: str | None = None
    confidence: BreakpointConfidence
    evidence_status: EvidenceStatus = EvidenceStatus.INFERRED

    @model_validator(mode="after")
    def ordered_interval(self) -> "SegmentProvenance":
        if self.end_locus_index <= self.start_locus_index:
            raise ValueError("Segment end_locus_index must be greater than start_locus_index")
        if self.source_parent not in {"parent_a", "parent_b"}:
            raise ValueError("Segment source_parent must be parent_a or parent_b")
        return self


class CrossoverSnapshot(ContractModel):
    crossover_id: str
    parent_id: str
    breakpoint: int = Field(gt=0)
    interval_start: int = Field(ge=0)
    interval_end: int = Field(gt=0)
    left_haplotype: str
    right_haplotype: str
    confidence: BreakpointConfidence
    evidence_status: EvidenceStatus

    @model_validator(mode="after")
    def valid_interval(self) -> "CrossoverSnapshot":
        if self.interval_end < self.interval_start:
            raise ValueError("Crossover interval must be ordered")
        if self.breakpoint < self.interval_start or self.breakpoint > self.interval_end:
            raise ValueError("Crossover breakpoint must lie in its interval")
        return self


class ParentGenomeSnapshot(ContractModel):
    parent_id: str
    haplotypes: dict[str, list[int]]
    dosage: list[int]
    loci: list[LocusSnapshot]

    @model_validator(mode="after")
    def matching_haplotypes(self) -> "ParentGenomeSnapshot":
        lengths = {len(values) for values in self.haplotypes.values()}
        if len(self.haplotypes) != 2 or len(lengths) != 1 or lengths.pop() != len(self.loci) or len(self.dosage) != len(self.loci):
            raise ValueError("Parent haplotypes must contain two arrays matching the locus count")
        return self


class GameteSnapshot(ContractModel):
    parent_id: str
    alleles: list[int]
    crossovers: list[CrossoverSnapshot]
    segments: list[SegmentProvenance]

    @model_validator(mode="after")
    def complete_segment_partition(self) -> "GameteSnapshot":
        if not self.alleles or not self.segments:
            raise ValueError("A gamete must contain alleles and at least one segment")
        if self.segments[0].start_locus_index != 0 or self.segments[-1].end_locus_index != len(self.alleles):
            raise ValueError("Gamete segments must cover the complete allele array")
        for left, right in zip(self.segments, self.segments[1:]):
            if left.end_locus_index != right.start_locus_index:
                raise ValueError("Gamete segments must be contiguous and ordered")
        return self


class LocusProvenanceSnapshot(ContractModel):
    locus_id: str
    position: int = Field(ge=0)
    allele_a: int = Field(ge=0, le=1)
    source_parent_a: str
    source_homolog_a: str
    crossover_interval_a: str
    allele_b: int = Field(ge=0, le=1)
    source_parent_b: str
    source_homolog_b: str
    crossover_interval_b: str
    genotype_dosage: int = Field(ge=0, le=2)


class OffspringSnapshot(ContractModel):
    offspring_id: str
    maternal_gamete: GameteSnapshot
    paternal_gamete: GameteSnapshot
    dosage: list[int]
    locus_provenance: list[LocusProvenanceSnapshot]

    @model_validator(mode="after")
    def matching_gametes(self) -> "OffspringSnapshot":
        if (
            len(self.dosage) != len(self.maternal_gamete.alleles)
            or len(self.dosage) != len(self.paternal_gamete.alleles)
            or len(self.locus_provenance) != len(self.dosage)
        ):
            raise ValueError("Offspring dosage must match both transmitted gametes")
        if any(value != left + right for value, left, right in zip(self.dosage, self.maternal_gamete.alleles, self.paternal_gamete.alleles)):
            raise ValueError("Offspring dosage must equal the sum of transmitted alleles")
        return self


class GenomeSnapshot(ContractModel):
    loci: list[LocusSnapshot]
    parent_a: ParentGenomeSnapshot
    parent_b: ParentGenomeSnapshot
    gamete_a: GameteSnapshot
    gamete_b: GameteSnapshot
    offspring: OffspringSnapshot
