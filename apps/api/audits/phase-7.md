# Phase 7 Audit — Current hardening and handoff

## Scope completed

- Added strict canonical-boundary type checking and `app/py.typed`.
- Added Ruff checks, CI workflow, compile checks, OpenAPI freshness checks and
  a non-root Docker image definition.
- Added Docker Compose configuration for PostgreSQL-backed metadata persistence.
- Added stable error mapping, CORS configuration, request IDs, path traversal
  protection, checksum validation, event limits and bounded real-data regions.
- Added JSON operational logging with request/run/stage context kept on the
  server side.
- Added explicit pipeline and adapter import seams, canonical migration wrappers
  and detailed setup/wording documentation.
- Added WebSocket replay and failure-mode integration tests.

## Verification

Commands run in this workspace:

- `cd apps/api && .../pytest -q` — **21 passed**, 2 dependency deprecation warnings.
- `cd apps/api && .../ruff check app scripts tests/unit tests/contract tests/integration tests/property` — **passed**.
- `cd apps/api && .../mypy --config-file pyproject.toml` — **passed**, 36 canonical boundary source files.
- `.../python apps/api/scripts/check-openapi.py` — **OpenAPI contract is current**.
- Manual synthetic smoke — REST run, trace, all three interventions and
  WebSocket replay passed.
- Uvicorn process smoke — `/health`, run creation, run start and trace returned
  successful responses.
- Docker build/Compose/PostgreSQL — **not run** because Docker is unavailable
  in this workspace.
- Full legacy copied tests — **not counted**; they require absent GIAB files
  and old entrypoints and remain migration references.

## Plan comparison

- Planned behavior: a reproducible backend MVP that can support simultaneous
  frontend work through a stable OpenAPI/WebSocket contract.
- Implemented behavior: canonical `apps/api` supports synthetic runs,
  model-relative attribution, three interventions, real prepared-trio mode,
  memory/SQL persistence, error-safe REST and ordered WebSocket playback.
- Remaining gap: frontend live integration, generated TypeScript client output,
  formal benchmark report, Docker execution, and a versioned serialized
  scientific artifact are not complete. Completed deterministic runs can be
  rehydrated by rerunning the same configured adapter.

## Scorecard

1. Code Quality: 8.2/10 — canonical layers and typed public boundary are clear;
   migrated scientific modules still contain legacy complexity and are not all
   strict-typed.
2. Code Readability: 8.1/10 — README, migration inventory, explicit disclosure
   and stage names help review; `RunService.start` remains larger than ideal.
3. Implementation Quality: 8.4/10 — the complete synthetic path, all three
   interventions, prepared real-data path and durable public results work.
4. Architecture & Design: 8.5/10 — modular monolith, pipeline seam, repository
   protocol and contract-first API are appropriate; distributed execution is
   intentionally absent.
5. Performance & Optimization: 7.5/10 — bounded loci/candidates/events and
   indexed preparation are implemented; no clean-machine load benchmark or
   async job queue exists.
6. Security: 7.8/10 — strict models, explicit CORS, safe errors, non-root image,
   checksum/path controls and limits are present; auth/rate limiting are out of
   scope for the hackathon.
7. Testing Quality: 8.4/10 — 21 canonical tests cover contracts, HTTP,
   WebSocket, SQL restart, real mode, failures and properties; real downloaded
   data and Docker are unverified here.
8. Documentation: 8.5/10 — setup, API boundary, real-data preparation,
   scientific wording, migration and phase audits are documented.
9. Scalability: 7.2/10 — metadata persistence and bounded artifacts are sound;
   synchronous in-process execution, JSON snapshots and polling limit scale.
10. DevOps Practices: 7.4/10 — CI, migration script, pinned runtime inputs,
    Docker hardening and Compose exist; container/DB execution is unverified.
11. User Experience: 7.8/10 — the API can drive the intended frontend and has
    stable failures/replay; the actual live frontend is not part of this audit.

Overall: 8.0/10
Maturity: MVP backend / advanced research prototype, not production-ready

## Top strengths

- The central Novelty Trace workflow is real: inherited state → candidate →
  provenance → interaction → counterfactual delta.
- The synthetic path is deterministic and auditable, including all three
  intervention types.
- Real mode is scientifically honest: observed phased genotype/pedigree inputs
  are separated from an explicitly synthetic phenotype model.
- The public contract is stable enough for the frontend to proceed in parallel.
- The code no longer depends on a second legacy FastAPI entrypoint.

## Biggest weaknesses

- `app/scientific/synthetic` and `app/scientific/real_data` still contain copied
  implementation complexity; only the canonical boundary is strict-typed.
- The checked-in OpenAPI exists, but generated TypeScript types and the actual
  `openapi-fetch` + TanStack Query web client are still pending in `apps/web`.
- No full public 1000 Genomes artifact is committed, and 1000 Genomes has no
  phenotype data; real mode is not real-human phenotype validation.
- SQL persistence stores public JSON state and deterministic completed runs can
  rehydrate the engine after restart; a versioned serialized scientific artifact
  is still not stored for long-lived or non-deterministic engines.
- Docker, PostgreSQL and a formal repeated benchmark report could not be
  verified in this workspace.

## Critical fixes before calling it production-ready

1. Integrate the frontend against generated OpenAPI types and the typed wrapper.
2. Run Docker/PostgreSQL/CI on a clean machine and fix any environment drift.
3. Persist a versioned replayable scientific execution artifact if future
   engines become non-deterministic or too expensive to rehydrate.
4. Produce and commit a multi-seed benchmark report with null controls and
   confidence intervals.
5. Complete the real-data licensing, retention and operator runbook.

## Five improvements that would increase the score

1. Add generated `openapi-typescript` output plus `openapi-fetch` and TanStack
   Query integration in `apps/web`.
2. Split `RunService.start()` into stage functions with typed stage results and
   cancellation/timeout support.
3. Add a real `ArtifactRepository` with immutable checksum-addressed storage.
4. Replace polling with a bounded publish/subscribe event queue for deployment
   beyond one process.
5. Type and fuzz-test the migrated VCF/attribution modules, then add an
   optional msprime/tskit adapter behind the existing protocol.
