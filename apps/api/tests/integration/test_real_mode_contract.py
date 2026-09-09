from __future__ import annotations

from pathlib import Path

from fastapi.testclient import TestClient

from app.main import create_app
from app.scientific.real_data.ingestion import sha256
from app.scientific.real_data.models import Family, Filters, Region, SampleInput
from app.settings import Settings


def _write_vcf(path: Path, sample_id: str, genotypes: list[str]) -> None:
    rows = [
        "##fileformat=VCFv4.2",
        "##reference=GRCh38",
        "#CHROM\tPOS\tID\tREF\tALT\tQUAL\tFILTER\tINFO\tFORMAT\t" + sample_id,
    ]
    for position, genotype in zip((10, 20, 30), genotypes):
        rows.append(f"22\t{position}\t.\tA\tG\t100\tPASS\t.\tGT:GQ:DP\t{genotype}:99:30")
    path.write_text("\n".join(rows) + "\n", encoding="utf-8")


def _prepared_real_fixture(root: Path) -> None:
    (root / "metadata").mkdir(parents=True)
    _write_vcf(root / "father.vcf", "FATHER", ["0|1", "0|0", "1|0"])
    _write_vcf(root / "mother.vcf", "MOTHER", ["0|0", "0|1", "0|1"])
    _write_vcf(root / "child.vcf", "CHILD", ["0|1", "0|1", "1|1"])
    (root / "trio.ped").write_text(
        "trio_fixture\tFATHER\t0\t0\t1\t0\n"
        "trio_fixture\tMOTHER\t0\t0\t2\t0\n"
        "trio_fixture\tCHILD\tFATHER\tMOTHER\t1\t0\n",
        encoding="utf-8",
    )

    def sample(sample_id: str, filename: str) -> SampleInput:
        return SampleInput(
            sample_id=sample_id,
            vcf=filename,
            sha256=sha256(root / filename),
            source_url=f"file://prepared/{filename}",
        )

    family = Family(
        family_id="trio_fixture",
        dataset_kind="real",
        reference_build="GRCh38",
        parent_a=sample("FATHER", "father.vcf"),
        parent_b=sample("MOTHER", "mother.vcf"),
        child=sample("CHILD", "child.vcf"),
        pedigree="trio.ped",
        pedigree_sha256=sha256(root / "trio.ped"),
        pedigree_source="file://prepared/trio.ped",
        regions=[Region(chromosome="22", start=1, end=100)],
        filters=Filters(min_qual=20, min_gq=20, min_dp=5),
    )
    (root / "metadata" / "trio_fixture.family.json").write_text(family.model_dump_json(), encoding="utf-8")


def test_real_trio_synthetic_phenotype_uses_common_run_contract(tmp_path: Path):
    _prepared_real_fixture(tmp_path)
    client = TestClient(create_app(Settings(data_root=tmp_path)))

    preview = client.post("/v1/ingestion/preview", json={"dataset_id": "trio_fixture"})
    assert preview.status_code == 200
    assert preview.json()["status"] == "manifest_and_checksums_verified"
    assert preview.json()["sample_ids"]["child"] == "CHILD"

    created = client.post(
        "/v1/runs",
        json={
            "mode": "real_trio_synthetic_phenotype",
            "dataset_id": "trio_fixture",
            "options": {"family_id": "trio_fixture"},
        },
    )
    assert created.status_code == 201
    run_id = created.json()["run_id"]
    started = client.post(f"/v1/runs/{run_id}/start")
    assert started.status_code == 200, started.text

    snapshot = client.get(f"/v1/runs/{run_id}/snapshot")
    assert snapshot.status_code == 200, snapshot.text
    body = snapshot.json()
    assert body["disclosure"]["dataset_kind"] == "real_trio_synthetic_phenotype"
    assert body["disclosure"]["phenotype_source"].startswith("Synthetic phenotype")
    assert len(body["source_artifacts"]) == 4
    assert body["genome"]["loci"][0]["source_variant_id"] == "22:10:A:G"
    assert body["reproducibility"]["disclosure"].startswith("Genotypes and inheritance")
