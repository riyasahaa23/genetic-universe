import hashlib
from pathlib import Path

import pytest

from app.repositories.artifacts import ArtifactVerificationError, LocalArtifactRepository
from app.schemas.common import SourceArtifactReference


def test_local_artifact_repository_verifies_checksum_and_blocks_escape(tmp_path: Path):
    artifact = tmp_path / "slice.vcf"
    artifact.write_text("vcf\n", encoding="utf-8")
    checksum = hashlib.sha256(artifact.read_bytes()).hexdigest()
    reference = SourceArtifactReference(
        artifact_id="vcf_slice",
        sha256=checksum,
        source_url="https://example.invalid/slice.vcf",
        role="genotype",
    )
    record = LocalArtifactRepository(tmp_path).verify(reference, "slice.vcf")
    assert record.sha256 == checksum
    assert record.size_bytes == artifact.stat().st_size

    with pytest.raises(ArtifactVerificationError):
        LocalArtifactRepository(tmp_path).resolve("../slice.vcf")
