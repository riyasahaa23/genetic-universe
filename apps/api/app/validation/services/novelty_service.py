"""Novelty service: detects transgressive segregation and margins."""
from app.validation.scientific.novelty import detect_novelty, NoveltyAssessment


class NoveltyService:
    def evaluate(
        self, parent_a_val: float, parent_b_val: float, offspring_val: float
    ) -> NoveltyAssessment:
        return detect_novelty(parent_a_val, parent_b_val, offspring_val)


novelty_service = NoveltyService()
