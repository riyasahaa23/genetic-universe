"""Console entrypoint for local and container launches."""

from __future__ import annotations

import uvicorn

from app.settings import get_settings


def main() -> None:
    settings = get_settings()
    uvicorn.run("app.main:app", host=settings.host, port=settings.port, reload=False)
