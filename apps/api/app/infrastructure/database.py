"""Database bootstrap kept separate from repositories and application use cases."""

from __future__ import annotations

from pathlib import Path

from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine


def create_database_engine(database_url: str) -> Engine:
    connect_args = {"check_same_thread": False} if database_url.startswith("sqlite") else {}
    return create_engine(database_url, connect_args=connect_args, pool_pre_ping=True)


def initialize_database(engine: Engine) -> None:
    """Create the small MVP metadata schema.

    This is intentionally idempotent and safe for local development. A
    production deployment should run an equivalent versioned migration before
    starting the API; import-time schema mutation is never performed.
    """

    migration_dir = Path(__file__).resolve().parent / "migrations"
    migrations = sorted(migration_dir.glob("*.sql"))
    if not migrations:
        raise RuntimeError("No database migrations are packaged")
    with engine.begin() as connection:
        for migration in migrations:
            content = migration.read_text(encoding="utf-8")
            for statement in content.split(";\n"):
                if statement.strip():
                    connection.execute(text(statement))
