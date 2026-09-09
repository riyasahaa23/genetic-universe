from pathlib import Path

from fastapi.testclient import TestClient

from app.main import create_app
from app.settings import Settings


def test_sqlalchemy_backend_persists_snapshot_and_timeline(tmp_path: Path):
    database = tmp_path / "runs.sqlite3"
    settings = Settings(
        repository_backend="sqlalchemy",
        database_url=f"sqlite:///{database}",
        data_root=tmp_path,
    )
    with TestClient(create_app(settings)) as client:
        created = client.post("/v1/runs", json={"seed": 42})
        assert created.status_code == 201
        run_id = created.json()["run_id"]
        assert client.post(f"/v1/runs/{run_id}/start").status_code == 200
        assert client.get(f"/v1/runs/{run_id}/snapshot").status_code == 200
        event_count = len(client.get(f"/v1/runs/{run_id}/timeline").json()["events"])
        assert event_count > 1

    # A new application instance reconstructs the durable public state.
    with TestClient(create_app(settings)) as client:
        status = client.get(f"/v1/runs/{run_id}")
        assert status.status_code == 200
        assert status.json()["status"] == "completed"
        assert len(client.get(f"/v1/runs/{run_id}/timeline").json()["events"]) == event_count
        assert client.get(f"/v1/runs/{run_id}/snapshot").json()["phenotype"]["offspring"]["value"] == 31.0
        trace = client.get(f"/v1/runs/{run_id}/trace")
        assert trace.status_code == 200
        candidate = trace.json()["candidates"][0]
        counterfactual = client.post(
            f"/v1/runs/{run_id}/counterfactuals",
            json={"candidate_id": candidate["candidate_id"], "intervention": "break_interaction"},
        )
        assert counterfactual.status_code == 200
        assert counterfactual.json()["delta"] == 16.0
