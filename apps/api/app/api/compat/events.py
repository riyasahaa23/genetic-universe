"""Compatibility WebSocket for the extracted experiment API."""

from __future__ import annotations

import asyncio
import time

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.orchestration.run_service import ServiceError

router = APIRouter(tags=["legacy-experiment-events"])

_EVENT_NAMES = {
    "run_created": "experiment_created",
    "parent_loaded": "experiment_started",
    "stage_started": "stage_started",
    "crossover_detected": "crossover_created",
    "gamete_segment_created": "gamete_created",
    "fertilization_complete": "offspring_created",
    "phenotype_computed": "phenotype_calculated",
    "novelty_detected": "novelty_detected",
    "candidate_set_ready": "candidate_set_ready",
    "candidate_ranked": "candidate_found",
    "evidence_graph_ready": "evidence_graph_ready",
    "counterfactual_completed": "counterfactual_completed",
    "run_completed": "experiment_completed",
    "run_failed": "experiment_failed",
}

_STAGE_START_NAMES = {
    "parent_loading": "experiment_started",
    "meiosis": "meiosis_started",
    "fertilization": "fertilization_started",
    "phenotype": "phenotype_started",
    "novelty_detection": "novelty_detection_started",
    "candidate_mining": "trace_started",
    "counterfactual": "counterfactual_started",
    "evidence_graph": "evidence_graph_started",
}


def _legacy_event_name(event_type: str, stage: str) -> str:
    if event_type == "stage_started":
        return _STAGE_START_NAMES.get(stage, event_type)
    return _EVENT_NAMES.get(event_type, event_type)


@router.websocket("/ws/experiments/{experiment_id}")
async def experiment_events(websocket: WebSocket, experiment_id: str) -> None:
    """Serve the old event envelope while replaying canonical run events.

    The old client protocol sends a text ``ping`` and expects ``pong``.  That
    heartbeat is retained.  Events are replayed from the canonical event bus,
    so a client can connect before or after a stage-oriented compatibility
    request without losing provenance events.
    """

    await websocket.accept()
    service = websocket.app.state.run_service
    try:
        service.get(experiment_id)
    except ServiceError as exc:
        await websocket.send_json({"error": {"code": exc.code, "message": exc.message}})
        await websocket.close(code=1008)
        return

    await websocket.send_json(
        {
            "event": "connected",
            "experiment_id": experiment_id,
            # The extracted client consumed a Unix timestamp. Keep that
            # field while also exposing the canonical ISO timestamp on event
            # messages below.
            "timestamp": time.time(),
        }
    )
    try:
        last_sequence = int(websocket.query_params.get("after_sequence", "0"))
        if last_sequence < 0:
            raise ValueError
    except ValueError:
        await websocket.send_json(
            {
                "error": {
                    "code": "INVALID_EVENT_CURSOR",
                    "message": "after_sequence must be a nonnegative integer",
                }
            }
        )
        await websocket.close(code=1008)
        return

    try:
        while True:
            timeline = service.timeline(experiment_id, last_sequence)
            for event in timeline.events:
                await websocket.send_json(
                    {
                        "event": _legacy_event_name(event.type, event.stage.value),
                        "experiment_id": experiment_id,
                        "data": event.payload,
                        "timestamp": event.emitted_at.timestamp(),
                        "emitted_at": event.emitted_at.isoformat(),
                        "sequence": event.sequence,
                        "stage": event.stage.value,
                    }
                )
                last_sequence = event.sequence

            try:
                message = await asyncio.wait_for(websocket.receive_text(), timeout=0.1)
            except asyncio.TimeoutError:
                continue
            if message == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        return
