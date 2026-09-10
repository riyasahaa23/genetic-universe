"""Contract tests for the archive's post-run analyses on the canonical API."""

from fastapi.testclient import TestClient

from app.main import create_app
from app.settings import Settings


def _client() -> TestClient:
    return TestClient(create_app(Settings(repository_backend="memory", allowed_origins="")))


def test_v1_postrun_analyses_are_bounded_and_reproducible() -> None:
    with _client() as client:
        created = client.post(
            "/v1/runs",
            json={"seed": 42, "options": {"locus_count": 24, "candidate_interactions": 2}},
        )
        assert created.status_code == 201
        run_id = created.json()["run_id"]
        assert client.post(f"/v1/runs/{run_id}/start").status_code == 200

        first = client.post(
            f"/v1/runs/{run_id}/meiotic-null",
            json={"seed": 7, "simulation_count": 8, "histogram_bin_count": 4},
        )
        second = client.post(
            f"/v1/runs/{run_id}/meiotic-null",
            json={"seed": 7, "simulation_count": 8, "histogram_bin_count": 4},
        )
        assert first.status_code == second.status_code == 200
        assert first.json() == second.json()
        assert first.json()["null_count"] == 8
        assert "null_phenotypes" not in first.json()

        rescue = client.post(
            f"/v1/runs/{run_id}/minimal-rescue",
            json={"top_k": 3, "max_set_size": 2, "max_combination_count": 10},
        )
        assert rescue.status_code == 200, rescue.text
        payload = rescue.json()
        assert payload["run_id"] == run_id
        assert payload["maximum_theoretical_combinations"] <= 10

        timeline = client.get(f"/v1/runs/{run_id}/timeline").json()["events"]
        event_types = [event["type"] for event in timeline]
        assert event_types[-6:] == [
            "meiotic_null_started",
            "meiotic_null_completed",
            "meiotic_null_started",
            "meiotic_null_completed",
            "minimal_rescue_started",
            "minimal_rescue_completed",
        ]


def test_archive_analysis_urls_delegate_to_canonical_service() -> None:
    with _client() as client:
        created = client.post("/api/experiments", json={"seed": 42, "locus_count": 50})
        assert created.status_code == 200
        experiment_id = created.json()["experiment_id"]

        null = client.post(
            f"/api/experiments/{experiment_id}/meiotic-null",
            json={"simulation_count": 5, "histogram_bin_count": 3},
        )
        assert null.status_code == 200, null.text
        assert null.json()["experiment_id"] == experiment_id
        assert null.json()["null_count"] == 5

        rescue = client.post(
            f"/api/experiments/{experiment_id}/minimal-rescue",
            json={"top_k": 3, "max_set_size": 2, "max_combination_count": 10},
        )
        assert rescue.status_code == 200, rescue.text
        assert rescue.json()["experiment_id"] == experiment_id

        trace = client.post(f"/api/experiments/{experiment_id}/trace")
        assert trace.status_code == 200, trace.text
        interaction = next(
            item for item in trace.json()["ranked_candidates"] if item["candidate_type"] == "INTERACTION"
        )
        assert interaction["interaction_contrast"] is not None
        assert interaction["epistatic_excess"] is not None


def test_v1_counterfactual_exposes_pairwise_formal_fields() -> None:
    with _client() as client:
        created = client.post(
            "/v1/runs",
            json={"seed": 42, "options": {"locus_count": 50, "candidate_interactions": 2}},
        )
        run_id = created.json()["run_id"]
        assert client.post(f"/v1/runs/{run_id}/start").status_code == 200
        snapshot = client.get(f"/v1/runs/{run_id}/snapshot").json()
        interaction = next(item for item in snapshot["candidates"] if item["kind"] == "interaction")
        response = client.post(
            f"/v1/runs/{run_id}/counterfactuals",
            json={"candidate_id": interaction["candidate_id"], "intervention": "break_interaction"},
        )
        assert response.status_code == 200, response.text
        payload = response.json()
        assert payload["interaction_contrast"] is not None
        assert payload["epistatic_excess"] is not None
        assert payload["interaction_edge_delta"] is not None
        assert payload["counterfactual"]["value"] == payload["original"]["value"] - payload["delta"]


def test_research_benchmark_http_adapter_validates_compact_report() -> None:
    with _client() as client:
        response = client.get(
            "/v1/benchmarks/research",
            params={"n_seeds": 1, "bootstrap_replicates": 3, "null_simulations": 2, "include_per_seed": True},
        )
        assert response.status_code == 200, response.text
        payload = response.json()
        assert payload["benchmark_name"] == "blind_recovery_validation"
        assert payload["n_seeds"] == 1
        assert len(payload["per_seed_metrics"]) == 1
