"""Novelty Trace and evidence graph contracts."""

from __future__ import annotations

from pydantic import Field

from .common import CandidateKind, ContractModel, EvidenceStatus


class EvidenceNode(ContractModel):
    node_id: str
    node_type: str
    label: str
    evidence_status: EvidenceStatus
    provenance: list[str] = Field(default_factory=list)
    attributes: dict[str, object] = Field(default_factory=dict)


class EvidenceLink(ContractModel):
    source: str
    target: str
    relation: str
    evidence_status: EvidenceStatus
    provenance: list[str] = Field(default_factory=list)


class EvidenceGraph(ContractModel):
    nodes: list[EvidenceNode]
    links: list[EvidenceLink]


class TraceCandidate(ContractModel):
    candidate_id: str
    kind: CandidateKind
    rank: int = Field(ge=1)
    label: str
    loci: list[str] = Field(default_factory=list)
    source_parents: list[str] = Field(default_factory=list)
    source_haplotypes: list[str] = Field(default_factory=list)
    crossover_ids: list[str] = Field(default_factory=list)
    provenance_score: float = Field(ge=0.0, le=1.0)
    phenotype_delta: float
    attribution_score: float
    novelty_resolved: bool
    reason: str
    evidence_status: EvidenceStatus


class TraceResponse(ContractModel):
    run_id: str
    novelty_available: bool
    ranking_definition: str
    candidates: list[TraceCandidate]
    graph: EvidenceGraph
    limitations: list[str]
