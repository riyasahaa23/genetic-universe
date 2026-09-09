#!/usr/bin/env python3
"""Apply packaged metadata migrations to the configured database."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.infrastructure.database import create_database_engine, initialize_database
from app.settings import get_settings


def main() -> int:
    settings = get_settings()
    engine = create_database_engine(settings.database_url)
    initialize_database(engine)
    print(f"migrations_applied database={settings.database_url.split('://', 1)[0]}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
