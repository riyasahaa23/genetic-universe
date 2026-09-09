import json
import logging

from app.infrastructure.logging import JsonFormatter


def test_json_formatter_includes_operational_context():
    record = logging.LogRecord("test", logging.INFO, __file__, 1, "run started", (), None)
    record.request_id = "req_test"
    record.run_id = "run_test"

    payload = json.loads(JsonFormatter().format(record))

    assert payload["message"] == "run started"
    assert payload["request_id"] == "req_test"
    assert payload["run_id"] == "run_test"
