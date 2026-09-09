from fastapi.testclient import TestClient
from starlette.websockets import WebSocketDisconnect

from app.main import create_app


def _completed_run(client: TestClient) -> str:
    run_id = client.post("/v1/runs", json={"seed": 42}).json()["run_id"]
    assert client.post(f"/v1/runs/{run_id}/start").status_code == 200
    return run_id


def test_websocket_replays_ordered_events_and_supports_resume():
    client = TestClient(create_app())
    run_id = _completed_run(client)

    with client.websocket_connect(f"/v1/runs/{run_id}/events?after_sequence=2") as socket:
        received: list[dict[str, object]] = []
        try:
            while True:
                received.append(socket.receive_json())
        except WebSocketDisconnect:
            pass

    assert received
    assert received[0]["sequence"] == 3
    assert received[-1]["type"] == "run_completed"
    assert [event["sequence"] for event in received] == list(range(3, len(received) + 3))
