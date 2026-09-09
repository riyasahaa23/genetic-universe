from pathlib import Path

from app.domain.genome import validate_segments
from app.domain.identifiers import new_event_id, new_run_id
from app.domain.novelty import novelty_margin
from app.main import create_app
from app.repositories.memory import InMemoryRunRepository
from app.settings import Settings


def test_app_has_canonical_contract_routes():
    app = create_app()
    paths = set(app.openapi()["paths"])
    assert "/health" in paths
    assert "/v1/runs" in paths
    assert "/v1/runs/{run_id}/snapshot" in paths
    assert "/v1/runs/{run_id}/timeline" in paths


def test_identifiers_and_novelty_are_stable():
    run_id = new_run_id()
    assert run_id.startswith("run_")
    assert new_event_id(run_id, 1) == new_event_id(run_id, 1)
    assert novelty_margin(42.0, 51.0, 73.0) == (True, 22.0, "above_range")


def test_segments_are_contiguous():
    validate_segments([(0, 20), (20, 50)])


def test_repository_rejects_unknown_event_run():
    repository = InMemoryRunRepository()
    try:
        repository.events("run_missing")
    except KeyError as exc:
        assert str(exc) == "'Run not found'"
    else:
        raise AssertionError("unknown runs must fail closed")


def test_default_data_root_belongs_to_the_api_application():
    assert Settings().data_root == Path(__file__).resolve().parents[2] / "data"
