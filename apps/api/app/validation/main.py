"""Compatibility entrypoint for the extracted backend.

The validation package is retained as a source reference for old experiments,
but it must not create a second FastAPI application.  Deployments should use
``app.main:app``; importing this module resolves to that same canonical app so
old ASGI commands and test fixtures do not silently bypass the new run,
provenance, security, and event contracts.
"""

from app.main import app, create_app

__all__ = ["app", "create_app"]
