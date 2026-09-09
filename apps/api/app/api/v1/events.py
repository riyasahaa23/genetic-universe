"""Replayable WebSocket event stream."""

from __future__ import annotations

import asyncio

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.orchestration.run_service import ServiceError
from app.schemas.common import RunStatus

router = APIRouter(tags=["events"])


@router.websocket("/v1/runs/{run_id}/events")
async def run_events(websocket: WebSocket, run_id: str) -> None:
    await websocket.accept()
    service = websocket.app.state.run_service
    try:
        after_sequence = int(websocket.query_params.get("after_sequence", "0"))
        if after_sequence < 0:
            raise ValueError("after_sequence must be nonnegative")
        last_sequence = after_sequence
        while True:
            try:
                record = service.get(run_id)
                timeline = service.timeline(run_id, last_sequence)
            except ServiceError as exc:
                await websocket.send_json({"error": {"code": exc.code, "message": exc.message}})
                await websocket.close(code=1008)
                return
            for event in timeline.events:
                await websocket.send_json(event.model_dump(mode="json"))
                last_sequence = event.sequence
            if record.status in {RunStatus.COMPLETED, RunStatus.FAILED, RunStatus.CANCELLED}:
                await websocket.close(code=1000)
                return
            await asyncio.sleep(0.05)
    except WebSocketDisconnect:
        return
    except ValueError:
        try:
            await websocket.send_json({
                "error": {
                    "code": "INVALID_EVENT_CURSOR",
                    "message": "after_sequence must be a nonnegative integer",
                    "retryable": False,
                }
            })
            await websocket.close(code=1008)
        except WebSocketDisconnect:
            pass
        return
