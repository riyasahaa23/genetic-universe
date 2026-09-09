"""Integration tests for FastAPI REST endpoints."""
import pytest
from fastapi.testclient import TestClient
from app.validation.main import app
from app.validation.db.database import init_db

init_db()
client = TestClient(app)


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "genetic-universe-api"


def test_full_experiment_api_flow():
    # 1. Create experiment
    res = client.post("/api/experiments", json={"seed": 42, "locus_count": 50})
    assert res.status_code == 200
    exp_id = res.json()["experiment_id"]

    # 2. Genomes
    res = client.post(f"/api/experiments/{exp_id}/genomes")
    assert res.status_code == 200
    assert "parent_a" in res.json()
    assert "parent_b" in res.json()

    # 3. Meiosis
    res = client.post(f"/api/experiments/{exp_id}/meiosis")
    assert res.status_code == 200
    assert len(res.json()["gamete_a"]["crossovers"]) >= 1

    # 4. Offspring
    res = client.post(f"/api/experiments/{exp_id}/offspring")
    assert res.status_code == 200
    assert len(res.json()["dosage"]) == 50

    # 5. Phenotype
    res = client.post(f"/api/experiments/{exp_id}/phenotype")
    assert res.status_code == 200
    p_data = res.json()
    assert p_data["offspring"]["total"] > 0

    # 6. Novelty
    res = client.post(f"/api/experiments/{exp_id}/novelty")
    assert res.status_code == 200
    n_data = res.json()
    assert n_data["is_transgressive"] is True
    assert n_data["novelty_margin"] > 0

    # 7. Trace
    res = client.post(f"/api/experiments/{exp_id}/trace")
    assert res.status_code == 200
    t_data = res.json()
    assert t_data["total_candidates"] > 0
    top = t_data["ranked_candidates"][0]

    # 8. Counterfactual intervention
    res = client.post(
        f"/api/experiments/{exp_id}/counterfactual",
        json={"candidate_id": top["candidate_id"], "intervention": "break_interaction"},
    )
    assert res.status_code == 200
    cf_data = res.json()
    assert cf_data["delta"] > 0
    assert cf_data["novelty_removed"] is True

    # 9. Evidence graph
    res = client.get(f"/api/experiments/{exp_id}/evidence-graph")
    assert res.status_code == 200
    g_data = res.json()
    assert len(g_data["nodes"]) > 0
    assert len(g_data["links"]) > 0


def test_one_click_demo_api():
    res = client.post("/api/experiments/demo/run")
    assert res.status_code == 200
    data = res.json()
    assert data["novelty"]["is_transgressive"] is True
    assert data["phenotypes"]["offspring"]["total"] == 31.0
    assert data["phenotypes"]["parent_a"]["total"] == 12.0
    assert data["phenotypes"]["parent_b"]["total"] == 18.0
    assert data["novelty"]["novelty_margin"] == 13.0
    assert len(data["trace"]["ranked_candidates"]) > 0


def test_benchmark_api():
    res = client.get("/api/benchmark?locus_count=50&causal_interactions=2&seed=42")
    assert res.status_code == 200
    b_data = res.json()
    assert b_data["metrics"]["top_k_recovery"] is True
    assert b_data["performance"]["duration_ms"] > 0
