"""Evidence service: builds and serializes NetworkX evidence DAG."""
from typing import Dict, Any, List, Optional
from app.validation.scientific.attribution import NoveltyTracer, CounterfactualResult


class EvidenceService:
    def generate_graph(
        self, tracer: NoveltyTracer, top_candidates: Optional[List[CounterfactualResult]] = None
    ) -> Dict[str, Any]:
        return tracer.build_evidence_graph(top_candidates=top_candidates)


evidence_service = EvidenceService()
