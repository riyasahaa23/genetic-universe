"""Safe manifest-level validation for prepared real-data inputs."""

from __future__ import annotations

from fastapi import APIRouter, Request

from app.schemas.ingestion import IngestionPreviewRequest, IngestionPreviewResponse
from app.scientific.real_data.adapter import available_families
from app.scientific.real_data.evidence_inputs import verified_artifacts
from app.scientific.real_data.ingestion import RealDataUnavailableError, verify_pedigree
from app.scientific.real_data.models import Region

router = APIRouter(prefix="/v1/ingestion", tags=["ingestion"])


@router.post("/preview", response_model=IngestionPreviewResponse)
def preview(request: IngestionPreviewRequest, http_request: Request) -> IngestionPreviewResponse:
    if request.dataset_id.startswith("fixture_"):
        return IngestionPreviewResponse(
            dataset_id=request.dataset_id,
            available=True,
            status="synthetic_fixture",
            artifact_count=0,
            disclosure="Synthetic fixture; no external VCF or pedigree artifacts are read.",
        )

    data_root = http_request.app.state.settings.data_root
    try:
        families = available_families(data_root)
        candidates = [family for family in families if request.family_id and family.family_id == request.family_id]
        if not candidates:
            candidates = [family for family in families if family.family_id == request.dataset_id]
        if not candidates:
            candidates = families
        if not candidates:
            return IngestionPreviewResponse(
                dataset_id=request.dataset_id,
                available=False,
                status="manifest_missing",
                issues=["No prepared family manifest is available."],
                disclosure="Real mode requires prepared, checksum-addressed public trio artifacts.",
            )
        family = sorted(candidates, key=lambda item: item.family_id)[0]
        region = Region(
            chromosome=request.chromosome or family.regions[0].chromosome,
            start=request.start or family.regions[0].start,
            end=request.end or family.regions[0].end,
        )
        verify_pedigree(family, data_root)
        artifacts = verified_artifacts(family, data_root)
        if not any(
            declared.chromosome == region.chromosome
            and declared.start <= region.start <= region.end <= declared.end
            for declared in family.regions
        ):
            raise ValueError("Requested region is outside the prepared family region")
        return IngestionPreviewResponse(
            dataset_id=request.dataset_id,
            available=True,
            status="manifest_and_checksums_verified",
            family_id=family.family_id,
            reference_build=family.reference_build,
            region=region.model_dump(),
            sample_ids={
                "parent_a": family.parent_a.sample_id,
                "parent_b": family.parent_b.sample_id,
                "child": family.child.sample_id,
            },
            artifact_count=len(artifacts) + 1,
            disclosure="Genotypes/pedigree are observed public data. Phenotype values, if used in a run, are explicitly synthetic.",
        )
    except RealDataUnavailableError:
        return IngestionPreviewResponse(
            dataset_id=request.dataset_id,
            available=False,
            status="manifest_missing",
            issues=["No prepared family manifest is available."],
            disclosure="Real mode requires prepared, checksum-addressed public trio artifacts.",
        )
    except Exception as exc:
        issue = "Prepared input validation failed."
        if isinstance(exc, ValueError):
            issue = str(exc)
            # Do not return filesystem paths from checksum/path validation.
            if "Missing input:" in issue:
                issue = "One or more prepared artifacts are missing."
        return IngestionPreviewResponse(
            dataset_id=request.dataset_id,
            available=False,
            status="manifest_invalid",
            issues=[issue],
            disclosure="Real mode requires prepared, checksum-addressed public trio artifacts.",
        )
