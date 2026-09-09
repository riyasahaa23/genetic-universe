"""Ground-truth access is isolated to evaluation code only."""

from app.scientific.synthetic.benchmark import DIFFICULTY_LEVELS, get_difficulty_levels

__all__ = ["DIFFICULTY_LEVELS", "get_difficulty_levels"]
