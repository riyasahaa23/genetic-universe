# Phase 4 Audit — API and persistence

## Scope completed

- Added all planned REST routes under `/v1`, including dataset discovery,
  ingestion preview, trace and counterfactual history.
- Added request IDs, stable error envelopes and safe validation/internal error
  responses.
- Added SQLite/PostgreSQL-compatible SQLAlchemy persistence for run metadata,
  snapshots, trace JSON, events and counterfactuals.
- Added versioned SQL migration `app/infrastructure/migrations/001_initial.sql`
  and explicit `scripts/migrate.py`.
- Moved database initialization to application startup instead of import-time
  side effects.

## Verification

- `pytest` canonical suite — passed.
- SQL integration recreated an application instance and read the persisted
  completed run, snapshot and event timeline.
- OpenAPI export/check — passed.
- Invalid IDs and malformed requests returned the public error shape without
  traceback/path leakage.

## Plan comparison

- Planned behavior: HTTP-only synthetic completion, replayable events and a
  repository abstraction with durable metadata.
- Implemented behavior: memory is the default; SQLAlchemy uses SQLite locally
  and the same bounded SQL shape against PostgreSQL in Compose.
- Remaining gap: large genomic artifacts remain file-backed by policy, but an
  explicit artifact repository interface and object-store integration are still
  future work.

## Scorecard

1. Code Quality: 7.8/10 — repository and API boundaries are explicit; raw SQL
   serialization remains compact but deserves dialect/integration coverage.
2. Code Readability: 7.8/10 — stable route modules and schemas are easy to
   navigate; some handler code is repetitive.
3. Implementation Quality: 8.0/10 — planned MVP routes and durable state are
   live and tested.
4. Architecture & Design: 8.2/10 — modular monolith and dependency inversion
   are implemented; engine artifacts are still process-local after restart.
5. Performance & Optimization: 7.0/10 — bounded JSON persistence and indexes
   are adequate for hackathon runs; no load benchmark exists.
6. Security: 7.4/10 — strict schemas, CORS allowlist, safe errors and path
   isolation exist; authentication is intentionally deferred.
7. Testing Quality: 8.0/10 — canonical contract, integration, property,
   persistence and failure tests pass.
8. Documentation: 7.8/10 — README covers setup, routes, Compose and wording;
   API examples and operational recovery are still limited.
9. Scalability: 6.8/10 — metadata can survive restart; synchronous execution,
   JSON snapshots and polling limit scale.
10. DevOps Practices: 7.0/10 — migration, Docker and CI definitions exist;
    Docker has not been executable in this workspace.
11. User Experience: 8.0/10 — typed snapshots and stable failures support a
    responsive frontend integration.

Overall: 7.7/10
Maturity: MVP backend for synthetic mode

## Strengths

- One canonical application owns all public behavior.
- Public errors no longer expose raw filesystem or traceback details.
- A new process can serve the persisted public result and timeline.

## Weaknesses

- Trace/counterfactual actions after a restart cannot rerun the process-local
  scientific engine state.
- No authentication/rate limiting is included, by explicit hackathon scope.
- PostgreSQL compatibility is reasoned from portable SQL and not exercised here.

## Critical fixes

1. Keep restart behavior documented or persist replayable scientific artifacts.
2. Run Docker and PostgreSQL integration in CI or a deployment environment.
3. Add artifact checksums and bounded file storage as a first-class repository.

## Five next improvements

1. Add PostgreSQL service integration.
2. Add artifact-store contract tests.
3. Add generated TypeScript types.
4. Add request timeout/size middleware.
5. Add API performance measurements.
