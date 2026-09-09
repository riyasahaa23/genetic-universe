"""Schemas for candidates, novelty trace, and evidence DAG."""
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from app.validation.schemas.phenotype import CounterfactualInterventionResponse


class NoveltyTraceResponse(BaseModel):
    experiment_id: str
    total_candidates: int
    primary_candidate: Optional[CounterfactualInterventionResponse]
    ranked_candidates: List[CounterfactualInterventionResponse]


class EvidenceGraphNode(BaseModel):
    id: str
    label: str
    type: str
    value: Optional[float] = None
    parent: Optional[str] = None
    position: Optional[int] = None
    dosage: Optional[int] = None
    source: Optional[str] = None
    coefficient: Optional[float] = None
    is_primary_cause: Optional[bool] = None
    is_transgressive: Optional[bool] = None
    margin: Optional[float] = None


class EvidenceGraphLink(BaseModel):
    source: str
    target: str
    relationship: str


class EvidenceGraphResponse(BaseModel):
    experiment_id: str
    directed: bool = True
    nodes: List[Dict[str, Any]]
    links: List[Dict[str, Any]]
    top_candidate: Optional[Dict[str, Any]] = None
