"""Typed environment configuration for the canonical API."""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="GENETIC_",
        env_file=(".env",),
        extra="ignore",
        case_sensitive=False,
    )

    app_name: str = "Genetic Universe API"
    app_version: str = "4.0.0"
    environment: str = "development"
    host: str = "127.0.0.1"
    port: int = Field(default=8000, ge=1, le=65535)
    allowed_origins: str = "http://localhost:3000"
    # settings.py lives at apps/api/app/settings.py; the API-owned data root
    # is apps/api/data, not the monorepo-level apps/data directory.
    data_root: Path = Path(__file__).resolve().parents[1] / "data"
    database_url: str = "sqlite:///./genetic_universe.db"
    repository_backend: Literal["memory", "sqlalchemy"] = "memory"
    log_level: Literal["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"] = "INFO"
    max_events_per_run: int = Field(default=2000, ge=100, le=100_000)
    max_snapshot_candidates: int = Field(default=100, ge=1, le=500)
    # Expensive post-run analyses are synchronous in this research MVP. Keep
    # their public ceilings explicit so a browser cannot turn an API worker
    # into an unbounded simulation process. Operators can lower these values
    # per environment through the GENETIC_ prefix.
    max_null_simulations: int = Field(default=5000, ge=1, le=5000)
    max_rescue_combination_count: int = Field(default=5000, ge=1, le=5000)
    max_research_seeds: int = Field(default=50, ge=1, le=200)
    max_research_bootstrap_replicates: int = Field(default=2000, ge=1, le=5000)
    max_research_null_simulations: int = Field(default=1000, ge=1, le=5000)

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
