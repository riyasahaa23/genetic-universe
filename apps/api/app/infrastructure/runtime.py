"""Runtime metadata captured with every scientific result."""

from __future__ import annotations

import hashlib
import platform
import sys
from importlib import metadata
from pathlib import Path


def code_revision(root: Path | None = None) -> str:
    """Return a deterministic digest of canonical application source files."""

    source_root = root or Path(__file__).resolve().parents[1]
    digest = hashlib.sha256()
    for path in sorted(source_root.rglob("*.py")):
        relative = path.relative_to(source_root)
        if "__pycache__" in path.parts or any(part in {"trio", "validation"} for part in relative.parts):
            continue
        digest.update(relative.as_posix().encode("utf-8"))
        digest.update(path.read_bytes())
    return digest.hexdigest()


def runtime_versions() -> dict[str, str]:
    values = {"python": platform.python_version(), "implementation": platform.python_implementation()}
    for package in ("fastapi", "pydantic", "networkx"):
        try:
            values[package] = metadata.version(package)
        except metadata.PackageNotFoundError:
            values[package] = "unavailable"
    values["executable"] = sys.executable
    return values
