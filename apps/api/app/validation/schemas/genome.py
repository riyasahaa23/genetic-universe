"""Schemas for genomic loci, haplotypes, gametes, and offspring."""
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class LocusSchema(BaseModel):
    id: str
    position: int
    chromosome: str = "chr1"
    alleles: List[int] = Field(default_factory=lambda: [0, 1])


class HomologPairSchema(BaseModel):
    parent_id: str
    haplotypes: Dict[str, List[int]]
    dosage: List[int]
    locus_count: int


class ParentGenomesResponse(BaseModel):
    experiment_id: str
    parent_a: HomologPairSchema
    parent_b: HomologPairSchema


class SegmentProvenanceSchema(BaseModel):
    start: int
    end: int
    source_homolog: str
    parent_id: str


class GameteSchema(BaseModel):
    parent_id: str
    alleles: List[int]
    crossovers: List[int]
    segments: List[SegmentProvenanceSchema]


class MeiosisSimulationResponse(BaseModel):
    experiment_id: str
    gamete_a: GameteSchema
    gamete_b: GameteSchema


class LocusProvenanceSchema(BaseModel):
    locus_id: str
    position: int
    allele_a: int
    source_parent_a: str
    source_homolog_a: str
    crossover_interval_a: str
    allele_b: int
    source_parent_b: str
    source_homolog_b: str
    crossover_interval_b: str
    genotype_dosage: int


class OffspringResponse(BaseModel):
    experiment_id: str
    offspring_id: str
    maternal_or_parent_a: List[int]
    paternal_or_parent_b: List[int]
    dosage: List[int]
    provenance: List[LocusProvenanceSchema]
