"""PostgreSQL repository name kept separate from the SQLite implementation.

The SQLAlchemy adapter uses portable SQL for the bounded MVP metadata store,
so the same implementation runs against SQLite in tests and PostgreSQL in
Compose. This alias keeps the repository boundary explicit for later dialect-
specific optimizations.
"""

from .sqlalchemy import SqlAlchemyRunRepository

PostgresRunRepository = SqlAlchemyRunRepository

__all__ = ["PostgresRunRepository"]
