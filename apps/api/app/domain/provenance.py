"""Small provenance value objects shared by scientific adapters.

The public schemas carry the serialized form. These helpers keep validation
and deterministic ordering out of FastAPI handlers and database adapters.
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class ArtifactIdentity:
    artifact_id: str
    sha256: str
    source_url: str
    role: str
    reference_build: str | None = None

    def __post_init__(self) -> None:
        if len(self.sha256) != 64 or any(character not in "0123456789abcdef" for character in self.sha256):
            raise ValueError("Artifact checksums must be lowercase SHA-256 values")
        if not self.artifact_id or not self.source_url or not self.role:
            raise ValueError("Artifact identity fields cannot be empty")


def stable_artifact_order(artifacts: list[ArtifactIdentity]) -> list[ArtifactIdentity]:
    """Return artifacts in deterministic order for hashing and serialization."""

    return sorted(artifacts, key=lambda artifact: (artifact.role, artifact.artifact_id, artifact.sha256))
