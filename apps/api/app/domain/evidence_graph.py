"""Deterministic evidence graph serialization."""

from __future__ import annotations

from collections.abc import Iterable

from app.schemas.common import EvidenceStatus
from app.schemas.trace import EvidenceGraph, EvidenceLink, EvidenceNode


def build_graph(
    nodes: Iterable[EvidenceNode], links: Iterable[EvidenceLink]
) -> EvidenceGraph:
    ordered_nodes = sorted(nodes, key=lambda node: node.node_id)
    ordered_links = sorted(links, key=lambda link: (link.source, link.target, link.relation))
    known = {node.node_id for node in ordered_nodes}
    for link in ordered_links:
        if link.source not in known or link.target not in known:
            raise ValueError("Evidence graph links must reference known nodes")
    return EvidenceGraph(nodes=ordered_nodes, links=ordered_links)


def observed_node(node_id: str, node_type: str, label: str) -> EvidenceNode:
    return EvidenceNode(node_id=node_id, node_type=node_type, label=label, evidence_status=EvidenceStatus.OBSERVED)
