"""Checksum-addressed local artifact repository.

Large VCF/BCF/tree files stay outside relational rows. This small repository
owns the safe path and checksum checks used by preparation jobs and can later
be replaced by object storage without changing scientific code.
"""

from __future__ import annotations

import hashlib
from dataclasses import dataclass
from pathlib import Path

from app.schemas.common import SourceArtifactReference


class ArtifactVerificationError(ValueError):
    """Raised when an artifact is missing, outside the root, or changed."""


@dataclass(frozen=True, slots=True)
class ArtifactRecord:
    artifact_id: str
    relative_path: str
    sha256: str
    size_bytes: int


class LocalArtifactRepository:
    """Read-only verifier for prepared artifacts below one configured root."""

    def __init__(self, root: Path):
        self.root = root.resolve()

    def resolve(self, relative_path: str) -> Path:
        path = (self.root / relative_path).resolve()
        if not path.is_relative_to(self.root) or not path.is_file():
            raise ArtifactVerificationError("Artifact is missing or outside the data root")
        return path

    def verify(self, reference: SourceArtifactReference, relative_path: str) -> ArtifactRecord:
        path = self.resolve(relative_path)
        digest = hashlib.sha256()
        with path.open("rb") as handle:
            for block in iter(lambda: handle.read(1024 * 1024), b""):
                digest.update(block)
        actual = digest.hexdigest()
        if actual != reference.sha256:
            raise ArtifactVerificationError("Artifact checksum mismatch")
        return ArtifactRecord(
            artifact_id=reference.artifact_id,
            relative_path=Path(relative_path).as_posix(),
            sha256=actual,
            size_bytes=path.stat().st_size,
        )
