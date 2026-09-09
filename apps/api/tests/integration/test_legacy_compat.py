"""Regression tests for the extracted backend contract on the canonical app."""

from pathlib import Path

from fastapi.testclient import TestClient

from app.main import create_app
from app.scientific.real_data.ingestion import sha256
from app.scientific.real_data.models import Family, Filters, Region, SampleInput
from app.settings import Settings


def _client() -> TestClient:
    return TestClient(
        create_app(
            Settings(
                repository_backend="memory",
                data_root=Path("data"),
                cors_origins=[],
            )
        )
    )


def test_legacy_stage_api_delegates_to_one_canonical_run() -> None:
    with _client() as client:
        created = client.post("/api/experiments", json={"seed": 42, "locus_count": 50})
        assert created.status_code == 200
        experiment_id = created.json()["experiment_id"]

        for suffix in ("genomes", "meiosis", "offspring", "phenotype", "novelty", "trace"):
            response = client.post(f"/api/experiments/{experiment_id}/{suffix}")
            assert response.status_code == 200, response.text

        novelty = client.post(f"/api/experiments/{experiment_id}/novelty").json()
        assert novelty["is_transgressive"] is True
        assert novelty["novelty_margin"] == 13.0

        trace = client.post(f"/api/experiments/{experiment_id}/trace").json()
        assert trace["total_candidates"] > 0
        primary = trace["primary_candidate"]["candidate_id"]

        counterfactual = client.post(
            f"/api/experiments/{experiment_id}/counterfactual",
            json={"candidate_id": primary, "intervention": "break_interaction"},
        )
        assert counterfactual.status_code == 200, counterfactual.text
        assert counterfactual.json()["novelty_removed"] is True
        assert counterfactual.json()["delta"] > 0

        timeline = client.get(f"/v1/runs/{experiment_id}/timeline").json()["events"]
        assert [event["type"] for event in timeline][-2:] == [
            "counterfactual_started",
            "counterfactual_completed",
        ]
        stored = client.get(f"/v1/runs/{experiment_id}/counterfactuals")
        assert stored.status_code == 200
        assert [item["candidate_id"] for item in stored.json()["results"]] == [primary]
        snapshot = client.get(f"/v1/runs/{experiment_id}/snapshot")
        assert snapshot.status_code == 200
        assert snapshot.json()["counterfactuals"][0]["candidate_id"] == primary

        graph = client.get(f"/api/experiments/{experiment_id}/evidence-graph")
        assert graph.status_code == 200
        assert graph.json()["nodes"]
        assert graph.json()["links"]


def test_legacy_demo_and_benchmark_surfaces_are_available() -> None:
    with _client() as client:
        demo = client.post("/api/experiments/demo/run")
        assert demo.status_code == 200, demo.text
        assert demo.json()["phenotypes"]["offspring"]["total"] == 31.0

        benchmark = client.get("/api/benchmark", params={"locus_count": 50, "seed": 42})
        assert benchmark.status_code == 200, benchmark.text
        assert benchmark.json()["metrics"]["top_k_recovery"] is True
        assert benchmark.json()["performance"]["duration_ms"] > 0

        levels = client.get("/api/benchmark/levels")
        assert levels.status_code == 200
        assert len(levels.json()) == 8


def test_legacy_websocket_replays_events_and_supports_old_ping() -> None:
    with _client() as client:
        created = client.post("/api/experiments", json={"seed": 42, "locus_count": 50}).json()
        experiment_id = created["experiment_id"]
        assert client.post(f"/api/experiments/{experiment_id}/trace").status_code == 200

        with client.websocket_connect(f"/ws/experiments/{experiment_id}") as websocket:
            assert websocket.receive_json()["event"] == "connected"
            seen_event = False
            for _ in range(32):
                message = websocket.receive_text()
                if message == "pong":
                    continue
                if '"event"' in message:
                    seen_event = True
                if seen_event:
                    break
            websocket.send_text("ping")
            pong_seen = False
            for _ in range(32):
                if websocket.receive_text() == "pong":
                    pong_seen = True
                    break
            assert seen_event
            assert pong_seen


def test_legacy_real_trio_routes_delegate_to_canonical_store(tmp_path: Path) -> None:
    (tmp_path / "metadata").mkdir()
    for filename, sample_id, genotypes in (
        ("father.vcf", "FATHER", ("0|1", "0|0", "1|0")),
        ("mother.vcf", "MOTHER", ("0|0", "0|1", "0|1")),
        ("child.vcf", "CHILD", ("0|1", "0|1", "1|1")),
    ):
        rows = [
            "##fileformat=VCFv4.2",
            "##reference=GRCh38",
            "#CHROM\tPOS\tID\tREF\tALT\tQUAL\tFILTER\tINFO\tFORMAT\t" + sample_id,
        ]
        rows.extend(
            f"22\t{position}\t.\tA\tG\t100\tPASS\t.\tGT:GQ:DP\t{genotype}:99:30"
            for position, genotype in zip((10, 20, 30), genotypes)
        )
        (tmp_path / filename).write_text("\n".join(rows) + "\n", encoding="utf-8")
    pedigree = tmp_path / "trio.ped"
    pedigree.write_text(
        "trio_fixture\tFATHER\t0\t0\t1\t0\n"
        "trio_fixture\tMOTHER\t0\t0\t2\t0\n"
        "trio_fixture\tCHILD\tFATHER\tMOTHER\t1\t0\n",
        encoding="utf-8",
    )

    def sample(sample_id: str, filename: str) -> SampleInput:
        return SampleInput(
            sample_id=sample_id,
            vcf=filename,
            sha256=sha256(tmp_path / filename),
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
        pedigree_sha256=sha256(pedigree),
        pedigree_source="file://prepared/trio.ped",
        regions=[Region(chromosome="22", start=1, end=100)],
        filters=Filters(min_qual=20, min_gq=20, min_dp=5),
    )
    (tmp_path / "metadata" / "trio_fixture.family.json").write_text(
        family.model_dump_json(), encoding="utf-8"
    )

    with TestClient(create_app(Settings(data_root=tmp_path))) as client:
        for path in (
            "/api/families",
            "/api/families/trio_fixture",
            "/api/families/trio_fixture/genome",
            "/api/families/trio_fixture/child-state",
            "/api/families/trio_fixture/segments",
            "/api/families/trio_fixture/recombination",
            "/api/families/trio_fixture/scientific-audit",
            "/api/scientific-audit/trio_fixture",
            "/api/evidence/trio_fixture",
            "/api/families/trio_fixture/evidence",
            "/api/families/trio_fixture/phenotype",
            "/api/families/trio_fixture/interactions",
            "/api/families/trio_fixture/novelty",
        ):
            response = client.get(path)
            assert response.status_code == 200, f"{path}: {response.text}"

        trace = client.post("/api/novelty-trace", json={"family_id": "trio_fixture"})
        assert trace.status_code == 200
        target_id = trace.json()["ranked_candidates"][0]["configuration"]["variant_ids"][0]
        counterfactual = client.post(
            "/api/counterfactual",
            json={
                "family_id": "trio_fixture",
                "intervention": "REPLACE_WITH_PARENTAL_GENOTYPE",
                "target_id": target_id,
            },
        )
        assert counterfactual.status_code == 200
        assert counterfactual.json()["counterfactual_score"] is None
