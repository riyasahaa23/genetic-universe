from app.schemas.counterfactual import CounterfactualRequest
from app.schemas.events import RunEvent
from app.schemas.run import CreateRunRequest


def test_default_run_request_is_contract_valid():
    request = CreateRunRequest.model_validate({})
    assert request.mode.value == "synthetic"
    assert request.options.locus_count == 50


def test_real_mode_requires_real_dataset():
    try:
        CreateRunRequest.model_validate({"mode": "real_trio_synthetic_phenotype"})
    except ValueError as exc:
        assert "real-trio" in str(exc)
    else:
        raise AssertionError("real mode must not silently use a synthetic fixture")


def test_event_serializes_with_sequence_and_schema_version():
    event = RunEvent(
        event_id="evt_001",
        run_id="run_001",
        sequence=1,
        type="run_created",
        stage="setup",
        emitted_at="2026-01-01T00:00:00Z",
    )
    payload = event.model_dump(mode="json")
    assert payload["schema_version"] == "1.0"
    assert payload["sequence"] == 1


def test_counterfactual_request_rejects_unknown_fields():
    try:
        CounterfactualRequest.model_validate({"candidate_id": "x", "intervention": "break_interaction", "extra": 1})
    except ValueError:
        pass
    else:
        raise AssertionError("public schemas must reject unknown fields")
