"""Application configuration loaded from environment variables.

Keeping configuration in one place makes local, Docker, and test execution
behave consistently. Pydantic Settings also validates values before the app
starts, instead of scattering ``os.getenv`` calls across modules.
"""
from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_env: str = "development"
    backend_host: str = "0.0.0.0"
    backend_port: int = 8000
    database_url: str = "postgresql+psycopg://genetic:genetic@localhost:5432/genetic_universe"
    cors_origins: str = Field(default="http://localhost:3000")
    default_seed: int = 42
    default_locus_count: int = 50

    model_config = SettingsConfigDict(
        env_file=("../.env", ".env"), extra="ignore", case_sensitive=False
    )

    @property
    def allowed_origins(self) -> list[str]:
        """Return comma-separated CORS origins as a normalized list."""
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    """Build settings once so every dependency uses the same configuration."""
    return Settings()


settings = get_settings()
