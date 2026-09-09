from pathlib import Path

from fastapi.testclient import TestClient

from app.main import create_app
from app.settings import Settings


def test_validation_errors_use_the_public_error_envelope():
    client = TestClient(create_app())
    response = client.post("/v1/runs", json={"options": {"locus_count": 5}})

    assert response.status_code == 422
    body = response.json()["error"]
    assert body["code"] == "INVALID_REQUEST"
    assert body["request_id"].startswith("req_")
    assert "Traceback" not in response.text
    assert str(Path.cwd()) not in response.text


def test_missing_real_data_fails_closed_with_a_retryable_public_error(tmp_path: Path):
    client = TestClient(create_app(Settings(data_root=tmp_path)))
    created = client.post(
        "/v1/runs",
        json={
            "mode": "real_trio_synthetic_phenotype",
            "dataset_id": "1000g_chr22_prepared_trio",
        },
    )
    assert created.status_code == 201

    response = client.post(f"/v1/runs/{created.json()['run_id']}/start")
    assert response.status_code == 503
    error = response.json()["error"]
    assert error["code"] == "REAL_DATA_UNAVAILABLE"
    assert error["retryable"] is True
    assert str(tmp_path) not in response.text
