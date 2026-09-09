# Phase 3 Audit — Orchestration and event system

## Scope completed

- Added `app/orchestration/pipeline.py` as the mode-selection boundary.
- `RunService` now owns create/start/status/snapshot/trace/counterfactual use
  cases while scientific modules remain transport-free.
- `EventBus` emits bounded, ordered envelopes with event IDs, sequence numbers,
  stages, timestamps and replay support.
- Terminal success and failure events are represented.

## Verification

- `pytest tests/integration/test_synthetic_run.py tests/integration/test_api_events.py` — passed.
- Timeline sequences are contiguous from 1 and end with `run_completed`.
- WebSocket reconnect from `after_sequence=2` returns sequence 3 onward.
- `mypy --config-file pyproject.toml` — passed for the strict canonical
  boundary after the pipeline seam was added.

## Plan comparison

- Planned behavior: one authoritative state machine usable by REST and live
  playback.
- Implemented behavior: REST and WebSocket both read the same repository-backed
  run record and timeline.
- Remaining gap: the MVP is synchronous; cancellation, distributed fan-out,
  heartbeats and queue-level backpressure are deferred.

## Scorecard

1. Code Quality: 7.5/10 — use-case code is centralized; some state remains in
   a mutable record for the single-process MVP.
2. Code Readability: 7.6/10 — stage/event names make the flow inspectable;
   `start()` is still a long orchestration method.
3. Implementation Quality: 7.8/10 — a complete run can be replayed from its
   timeline and final snapshot.
4. Architecture & Design: 8.0/10 — a pipeline seam now prevents route-level
   scientific branching.
5. Performance & Optimization: 6.8/10 — event payloads are small and bounded;
   polling is not appropriate for high-volume distributed workloads.
6. Security: 7.0/10 — terminal errors are normalized and request IDs exist;
   resource/rate limits are still incomplete.
7. Testing Quality: 7.5/10 — synthetic HTTP, event replay and invariant tests
   pass; failure and persistence tests remain.
8. Documentation: 7.2/10 — event contract and reconnect semantics are written;
   operational runbooks are not complete.
9. Scalability: 6.2/10 — repository abstraction is ready, but execution and
   event polling are process-local.
10. DevOps Practices: 6.0/10 — code is packageable; deployment has not been
    exercised.
11. User Experience: 7.8/10 — the frontend has enough ordered progress data
    to animate the intended story and recover after reconnect.

Overall: 7.4/10
Maturity: Advanced prototype

## Strengths

- REST snapshots remain authoritative; events are playback signals.
- Event sequence semantics are simple enough for a hackathon frontend.
- Failure paths end in a known state rather than leaving a run indefinitely
  running.

## Weaknesses

- WebSocket implementation polls every 50 ms and has no heartbeat protocol.
- `RunService.start()` is still the primary orchestration integration point.
- Restarted durable processes cannot reconstruct raw scientific engine objects.

## Critical fixes

1. Add a durable repository and migration.
2. Test failed real-data runs and WebSocket unknown-run behavior.
3. Document the restart limitation instead of implying distributed execution.

## Five next improvements

1. Add SQL-backed timeline persistence.
2. Add a bounded event queue abstraction.
3. Add cancellation/timeout policy.
4. Add frontend mock replay fixtures.
5. Split stage execution into independently testable functions.
