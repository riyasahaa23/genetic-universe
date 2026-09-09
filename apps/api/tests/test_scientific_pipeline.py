"""Comprehensive verification suite for the completed scientific pipeline.

Tests:
1. Evidence-tiered Genotype -> Phenotype Engine (reported vs database vs predicted null).
2. Candidate Pairwise Genetic Interaction & Epistasis Layer (hypothesis labeling, classification, API).
3. Transgressive Phenotypic Novelty Engine (dual-mode: honest null on real GIAB, evaluated on benchmark).
4. Expanded Counterfactual Interventions (REMOVE_VARIANT, REPLACE_WITH_PARENTAL_GENOTYPE, REPLACE_SEGMENT, BREAK_INTERACTION).
5. Ground-Truth Benchmark & Evaluation Suite (precision, recall, F1, counterfactual faithfulness, API).
6. Enhanced Scientific Audit readiness gates & summary metrics.
"""
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.trio.models import CounterfactualRequest, BenchmarkParams
from app.trio.pipeline import FamilyStore
from app.trio.phenotype_engine import categorize_phenotypes
from app.trio.interaction import find_candidate_interactions, build_interaction_response
from app.trio.novelty_engine import assess_novelty, evaluate_quantitative_novelty
from app.trio.attribution import counterfactual, scientific_audit
from app.trio.benchmark_suite import execute_benchmark, get_benchmark_summary

DATA = Path("data").resolve()


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture(scope="module")
def real_state():
    store = FamilyStore(DATA)
    return store.state("GIAB_AJ")


# =========================================================================
# 1. Evidence-Tiered Genotype -> Phenotype Engine
# =========================================================================

def test_phenotype_engine_categorization(real_state):
    """Categorizes phenotype evidence into strict truth tiers without fabrication."""
    categorization = categorize_phenotypes(real_state)

    assert categorization.family_id == "GIAB_AJ"
    assert categorization.sample_id == "HG002"
    assert categorization.phenotype_model_status == "unavailable"
    assert categorization.predicted_phenotype is None

    # Tier 1: Reported phenotypes (from Coriell subject history)
    reported_labels = {p.label for p in categorization.reported_phenotypes}
    assert "Migraine with aura" in reported_labels
    assert "Hemangioma" in reported_labels
    for p in categorization.reported_phenotypes:
        assert p.evidence_status == "observed"
        assert p.ascertainment == "repository_reported_history"

    # Tier 2: Database-associated phenotypes (from ClinVar snapshot)
    assert len(categorization.database_associated_phenotypes) > 0
    for db_p in categorization.database_associated_phenotypes:
        assert db_p.evidence_status == "hypothesis"
        assert db_p.scope == "external_variant_knowledge_not_subject_observation"
        assert db_p.clinvar_record_id is not None
        assert any("does not link another individual" in lim.lower() for lim in db_p.limitations)

    # Unsupported variant count is non-negative
    assert categorization.unsupported_variant_count >= 0
    assert len(categorization.limitations) >= 4


def test_phenotype_api_endpoint(client):
    """GET /api/families/{family_id}/phenotype serves valid categorization."""
    response = client.get("/api/families/GIAB_AJ/phenotype")
    assert response.status_code == 200
    data = response.json()
    assert data["phenotype_model_status"] == "unavailable"
    assert len(data["reported_phenotypes"]) == 2
    assert len(data["database_associated_phenotypes"]) > 0


# =========================================================================
# 2. Candidate Pairwise Genetic Interaction & Epistasis Layer
# =========================================================================

def test_candidate_interaction_discovery(real_state):
    """Discovers and classifies pairwise interaction candidates labeled hypothesis."""
    candidates = find_candidate_interactions(real_state, max_distance_bp=500_000, max_candidates=50)

    assert len(candidates) > 0
    assert all(c.evidence_status == "hypothesis" for c in candidates)
    assert all(c.ranking_score > 0 for c in candidates)
    assert all(c.formula_component.startswith("gamma_") for c in candidates)

    # Verify interaction types present
    types = {c.interaction_type for c in candidates}
    assert any(t in types for t in ["inter_homolog_biparental_pair", "intra_block_cis_pair", "general_candidate_pair"])

    # Verify missing links are explicit
    for c in candidates:
        assert any("wet-lab" in ml.lower() for ml in c.missing_links)


def test_interactions_api_endpoint(client):
    """GET /api/families/{family_id}/interactions serves structured interaction response."""
    response = client.get("/api/families/GIAB_AJ/interactions")
    assert response.status_code == 200
    data = response.json()
    assert data["family_id"] == "GIAB_AJ"
    assert data["total_candidates"] > 0
    assert "interaction_type_counts" in data
    assert any(w["code"] == "HYPOTHETICAL_INTERACTION_CANDIDATES" for w in data["warnings"])


# =========================================================================
# 3. Transgressive Phenotypic Novelty Engine
# =========================================================================

def test_novelty_real_giab_honest_null(real_state):
    """Real GIAB trio returns unresolved status with null transgressive scores."""
    assessment = assess_novelty(real_state)

    assert assessment.phenotype_novelty_status == "unresolved_no_quantitative_phenotype_model"
    assert assessment.is_transgressive is None
    assert assessment.novelty_margin is None
    assert assessment.direction == "unresolved"
    assert assessment.percent_transgression is None
    assert assessment.quantitative_scores is None
    assert assessment.genotype_configurations_count == 22
    assert "unresolved because no quantitative phenotype measurement exists" in assessment.explanation


def test_novelty_quantitative_benchmark_mode():
    """Quantitative scalar traits correctly calculate transgressive segregation."""
    # Transgressive above range
    above = evaluate_quantitative_novelty(parent_a_phenotype=10.0, parent_b_phenotype=15.0, child_phenotype=25.0)
    assert above.is_transgressive is True
    assert above.direction == "above_range"
    assert above.novelty_margin == 10.0
    assert above.percent_transgression == 200.0

    # Transgressive below range
    below = evaluate_quantitative_novelty(parent_a_phenotype=10.0, parent_b_phenotype=15.0, child_phenotype=5.0)
    assert below.is_transgressive is True
    assert below.direction == "below_range"
    assert below.novelty_margin == 5.0

    # Within range
    within = evaluate_quantitative_novelty(parent_a_phenotype=10.0, parent_b_phenotype=15.0, child_phenotype=12.0)
    assert within.is_transgressive is False
    assert within.direction == "within_range"
    assert within.novelty_margin == 0.0


def test_novelty_api_endpoint(client):
    """GET /api/families/{family_id}/novelty serves honest assessment."""
    response = client.get("/api/families/GIAB_AJ/novelty")
    assert response.status_code == 200
    data = response.json()
    assert data["phenotype_novelty_status"] == "unresolved_no_quantitative_phenotype_model"
    assert data["is_transgressive"] is None


# =========================================================================
# 4. Expanded Counterfactual Interventions
# =========================================================================

def test_counterfactual_segment_intervention(real_state):
    """REPLACE_SEGMENT switches an inherited block's variants to parental genotype."""
    seg = real_state.segments[0]
    request = CounterfactualRequest(
        family_id="GIAB_AJ",
        intervention="REPLACE_SEGMENT",
        target_id=seg.id,
        parent_role="parent_B" if seg.parent_sample == "HG004" else "parent_A",
    )
    result = counterfactual(real_state, request)

    assert result.intervention == "REPLACE_SEGMENT"
    assert result.counterfactual_state.state_status == "hypothetical"
    assert len(result.changed_variant_ids) > 0
    assert result.original_score is None and result.counterfactual_score is None
    assert result.counterfactual_ready is False


def test_counterfactual_break_interaction(real_state):
    """BREAK_INTERACTION raises NotImplementedError on unmodeled real data."""
    request = CounterfactualRequest(
        family_id="GIAB_AJ",
        intervention="BREAK_INTERACTION",
        target_id="1:814309:T:G",
    )
    with pytest.raises(NotImplementedError, match="lacks supported segment/interaction state semantics"):
        counterfactual(real_state, request)


def test_counterfactual_api_endpoint(client):
    """POST /api/counterfactual executes cleanly via HTTP."""
    payload = {
        "family_id": "GIAB_AJ",
        "intervention": "REMOVE_VARIANT",
        "target_id": "1:814309:T:G",
        "parent_role": "parent_A",
    }
    response = client.post("/api/counterfactual", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["intervention"] == "REMOVE_VARIANT"
    assert data["counterfactual_state"]["state_status"] == "hypothetical"


# =========================================================================
# 5. Ground-Truth Benchmark & Evaluation Suite
# =========================================================================

def test_benchmark_suite_execution():
    """Controlled ground-truth benchmark measures precision, recall, and faithfulness."""
    params = BenchmarkParams(
        locus_count=50,
        causal_interactions=2,
        recombination_rate=0.08,
        effect_size=24.0,
        seed=42,
        top_k=3,
    )
    result = execute_benchmark(params)

    assert result.parameters.locus_count == 50
    assert 0.0 <= result.metrics.precision <= 1.0
    assert 0.0 <= result.metrics.recall <= 1.0
    assert 0.0 <= result.metrics.f1_score <= 1.0
    assert result.metrics.faithfulness_ratio >= 1.0
    assert len(result.reproducibility_hash) == 64
    assert result.performance["duration_ms"] > 0


def test_benchmark_api_endpoints(client):
    """Benchmark summary and run endpoints respond with complete validation data."""
    # GET summary
    sum_resp = client.get("/api/benchmark/summary")
    assert sum_resp.status_code == 200
    sum_data = sum_resp.json()
    assert sum_data["benchmark_mode"] == "controlled_ground_truth_simulation"
    assert "baseline_evaluation" in sum_data
    assert len(sum_data["scalability_results"]) >= 4

    # POST run
    run_resp = client.post("/api/benchmark/run", json={"locus_count": 50, "causal_interactions": 2, "seed": 42})
    assert run_resp.status_code == 200
    run_data = run_resp.json()
    assert run_data["metrics"]["f1_score"] >= 0.0
    assert run_data["metrics"]["faithfulness_ratio"] >= 1.0


# =========================================================================
# 6. Enhanced Scientific Audit Gates
# =========================================================================

def test_enhanced_scientific_audit(real_state):
    """Audit exposes updated readiness flags and summary tier breakdown."""
    audit = scientific_audit(real_state)

    assert audit.real_data is True
    assert audit.phenotype_available is True
    assert audit.phenotype_model_available is False  # Honest gate
    assert audit.recombination_evidence_available is True
    assert audit.candidate_interactions_count > 0
    assert audit.novelty_trace_ready is False
    assert audit.counterfactual_ready is False
    assert audit.causal_claim_supported is False

    # Summary tier counts
    assert "observed" in audit.audit_summary
    assert "inferred" in audit.audit_summary
    assert "hypothesis" in audit.audit_summary
    assert "unresolved" in audit.audit_summary
    assert audit.audit_summary["observed"] > 0
    assert audit.audit_summary["inferred"] > 0
    assert audit.audit_summary["hypothesis"] > 0
