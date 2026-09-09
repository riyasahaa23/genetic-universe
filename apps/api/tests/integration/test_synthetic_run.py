from fastapi.testclient import TestClient

from app.main import create_app


def test_complete_synthetic_vertical_slice():
    client = TestClient(create_app())
    created = client.post("/v1/runs", json={"seed": 42})
    assert created.status_code == 201
    run_id = created.json()["run_id"]

    started = client.post(f"/v1/runs/{run_id}/start")
    assert started.status_code == 200
    assert started.json()["status"] == "completed"

    snapshot = client.get(f"/v1/runs/{run_id}/snapshot")
    assert snapshot.status_code == 200
    body = snapshot.json()
    assert body["phenotype"]["novelty"]["outside_parental_range"] is True
    assert body["phenotype"]["offspring"]["value"] == 31.0
    assert body["reproducibility"]["seed"] == 42
    assert body["limitations"]

    trace = client.get(f"/v1/runs/{run_id}/trace")
    assert trace.status_code == 200
    assert trace.json()["candidates"][0]["candidate_id"] == "E_L10_L31"
    assert trace.json()["candidates"][0]["kind"] == "interaction"

    candidate = trace.json()["candidates"][0]
    counterfactual = client.post(
        f"/v1/runs/{run_id}/counterfactuals",
        json={"candidate_id": candidate["candidate_id"], "intervention": "break_interaction"},
    )
    assert counterfactual.status_code == 200
    cf = counterfactual.json()
    assert cf["delta"] == 16.0
    assert cf["novelty_resolved"] is True

    updated = client.get(f"/v1/runs/{run_id}/snapshot").json()
    assert len(updated["counterfactuals"]) == 1


def test_timeline_is_ordered_and_replayable():
    client = TestClient(create_app())
    run_id = client.post("/v1/runs", json={}).json()["run_id"]
    client.post(f"/v1/runs/{run_id}/start")
    timeline = client.get(f"/v1/runs/{run_id}/timeline").json()["events"]
    assert [event["sequence"] for event in timeline] == list(range(1, len(timeline) + 1))
    assert timeline[0]["type"] == "run_created"
    assert timeline[-1]["type"] == "run_completed"
    suffix = client.get(f"/v1/runs/{run_id}/timeline?after_sequence=2").json()["events"]
    assert suffix[0]["sequence"] == 3


def test_errors_are_stable_and_do_not_expose_internal_messages():
    client = TestClient(create_app())
    response = client.get("/v1/runs/run_missing")
    assert response.status_code == 404
    body = response.json()["error"]
    assert body["code"] == "RUN_NOT_FOUND"
    assert body["request_id"].startswith("req_")
    assert "Traceback" not in response.text
