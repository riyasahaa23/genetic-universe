"""Response models for legacy analysis URLs."""

from app.schemas.meiotic_null import MeioticNullSummary
from app.schemas.minimal_rescue import MinimalRescueSummary


class LegacyMeioticNullResponse(MeioticNullSummary):
    experiment_id: str


class LegacyMinimalRescueResponse(MinimalRescueSummary):
    experiment_id: str
