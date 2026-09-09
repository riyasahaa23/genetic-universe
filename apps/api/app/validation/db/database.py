"""
Database Connection and Session Management
Supports PostgreSQL (default) and seamlessly falls back to SQLite for local development
without external infrastructure dependencies.
"""
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from sqlalchemy.pool import StaticPool
from app.validation.config import settings

logger = logging.getLogger("genetic_universe.db")

DATABASE_URL = settings.database_url
database_backend = "postgresql"

def get_engine():
    global database_backend
    db_url = DATABASE_URL
    try:
        if db_url.startswith("postgresql"):
            engine = create_engine(
                db_url,
                pool_pre_ping=True,
                connect_args={"connect_timeout": 3},
            )
            with engine.connect() as conn:
                pass
            logger.info("Connected to PostgreSQL successfully.")
            return engine
    except Exception as e:
        logger.warning(f"PostgreSQL connection failed ({e}). Falling back to SQLite.")

    database_backend = "sqlite"
    sqlite_url = db_url if db_url.startswith("sqlite:") else "sqlite:///./genetic_universe.db"
    return create_engine(
        sqlite_url,
        connect_args={"check_same_thread": False},
        **({"poolclass": StaticPool} if sqlite_url == "sqlite:///:memory:" else {}),
    )

engine = get_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """FastAPI dependency yielding a SQLAlchemy DB session."""
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Create tables if they do not exist."""
    # Import all models before create_all
    import app.validation.db.models  # noqa: F401
    Base.metadata.create_all(bind=engine)
