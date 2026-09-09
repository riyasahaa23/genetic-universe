"""Dataset discovery endpoint."""

from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter, Request

from app.schemas.common import RunMode
from app.schemas.run import DatasetListResponse, DatasetSummary
from app.scientific.real_data.adapter import available_families

router = APIRouter(prefix="/v1/datasets", tags=["datasets"])


@router.get("", response_model=DatasetListResponse)
def list_datasets(request: Request) -> DatasetListResponse:
    root: Path = request.app.state.settings.data_root
    try:
        families = available_families(root)
    except Exception:
        # Dataset discovery is intentionally best-effort. A malformed or
        # incomplete download is reported as unavailable and is diagnosed by
        # the ingestion preview endpoint rather than leaking a traceback from
        # a simple catalog request.
        families = []
    datasets = [
            DatasetSummary(
                dataset_id="fixture_epistasis_ab_cd_v1",
                label="Synthetic planted epistasis fixture",
                mode=RunMode.SYNTHETIC,
                assembly="synthetic",
                disclosure="All genotype and phenotype values are synthetic.",
                available=True,
            ),
            DatasetSummary(
                dataset_id="1000g_chr22_prepared_trio",
                label="Prepared phased public trio region",
                mode=RunMode.REAL_TRIO_SYNTHETIC_PHENOTYPE,
                assembly="GRCh38",
                disclosure="Genotypes and inheritance relationships are public data; phenotype values are synthetic.",
                available=bool(families),
            ),
        ]
    datasets.extend(
        DatasetSummary(
            dataset_id=family.family_id,
            label=f"Prepared phased trio {family.family_id}",
            mode=RunMode.REAL_TRIO_SYNTHETIC_PHENOTYPE,
            assembly=family.reference_build,
            disclosure="Genotypes and pedigree are observed public data; phenotype values remain synthetic for method validation.",
            available=True,
        )
        for family in families
    )
    return DatasetListResponse(datasets=datasets)
