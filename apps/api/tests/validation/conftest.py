"""Legacy synthetic regression tests use a local in-memory database only."""
import os

os.environ["DATABASE_URL"] = "sqlite:///:memory:"
