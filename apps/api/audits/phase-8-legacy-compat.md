# Phase 8 Audit — Legacy backend completion

## Scope completed

The remaining behavior from the extracted backend has been brought behind the
canonical `app.main:app` runtime. The migration preserves the old transport
surface while replacing the old singleton experiment manager, validation
database and competing FastAPI entrypoints with the canonical repository,
scientific pipeline and event bus.

### Compatibility matrix

| Extracted capability | Canonical implementation | Result |
| --- | --- | --- |
| `/api/experiments` creation and status | `app/api/compat/experiments.py` → `RunService` | Available |
| Stage endpoints: genomes, meiosis, offspring, phenotype, novelty, trace | Compatibility response translators → seeded synthetic pipeline | Available |
| Experiment counterfactual and evidence graph | Compatibility adapter → canonical scientific execution | Available |
| One-click `/api/experiments/demo/run` | Canonical deterministic fixture execution | Available |
| `/api/families/*` real-trio analysis | `app/api/compat/real_trio.py` → canonical `FamilyStore` | Available |
| Real-trio trace, counterfactual, evidence, audit, phenotype and interaction routes | Canonical evidence-tiered real-data modules | Available |
| `/api/benchmark/*` | `app/api/compat/benchmarks.py` → typed evaluation suite | Available |
| `/v1/benchmarks/*` | Same typed evaluation suite under a versioned path | Available |
| `/ws/experiments/{id}` | Canonical event replay translated to the old envelope and ping/pong protocol | Available |
| `app.validation.main:app` | Import compatibility wrapper to `app.main:app` | No second runtime |
| Legacy benchmark imports | `app.trio.benchmark_suite` reexports canonical evaluation functions/models | Available |

Legacy stage requests intentionally execute the complete deterministic run on
the first stage call and then translate the completed state. This preserves
the old response contracts without maintaining two mutable stage machines.

## Correctness and hardening changes

- Added caller-selected validated IDs for compatibility experiment creation.
- Added all missing stage-start events to the canonical timeline.
- Prevented post-run counterfactual events from regressing a completed run to
  the counterfactual stage.
- Made SQL-backed counterfactuals appear in both the counterfactual table and
  the persisted snapshot.
- Added idempotent canonical counterfactual lookup for repeated requests.
- Added bounded benchmark parameters, including valid zero-interaction null
  worlds.
- Persisted legacy counterfactual results through the canonical repository and
  snapshot, with canonical intervention aliases and completion events.
- Sanitized real-data compatibility errors so local paths and parser details
  are not returned to clients.
- Added the legacy `database_backend` field to the health response.
- Regenerated and checked the shared OpenAPI document.

## Verification

Commands run in this workspace:

- Canonical tests: **26 passed**, 2 dependency deprecation warnings.
- Legacy synthetic regression subset: **53 passed**; one real-GIAB test is
  unavailable because the supplied archive contains no `GIAB_AJ` fixture.
- Ruff on canonical application and test paths: **passed**.
- Mypy strict canonical boundary: **passed**, 43 source files checked.
- Python compileall for application and scripts: **passed**.
- OpenAPI freshness check: **passed**.
- SQLAlchemy/SQLite restart and counterfactual persistence test: **passed**.
- Manual smoke for every benchmark endpoint family: **200 responses**.
- Docker execution: not run; Docker is unavailable in this workspace.

## Strict completion judgment

The old backend feature surface is complete for the hackathon MVP through the
canonical application. The following are deliberately not claimed as complete
production capabilities:

- The external `GIAB_AJ` fixture and the user-provided 1000 Genomes files are
  not bundled or fabricated. Real mode requires operator-prepared,
  checksum-verified indexed artifacts.
- 1000 Genomes supplies genotype/pedigree data, not a validated phenotype
  function. Real mode therefore uses a disclosed synthetic phenotype model.
- Counterfactuals are model-relative computational evidence, not biological
  causality.
- The frontend’s generated TypeScript client, `openapi-fetch` wrapper and
  TanStack Query integration are separate `apps/web` work.
- Authentication, rate limiting, asynchronous workers and distributed event
  delivery remain outside hackathon scope.

## Scorecard

1. Code Quality: 8.3/10 — canonical adapters, typed contracts and one runtime
   are strong; legacy-derived scientific modules retain complexity.
2. Code Readability: 8.2/10 — the compatibility matrix and explicit
   translation boundaries make the migration understandable.
3. Implementation Quality: 8.6/10 — synthetic, benchmark, real prepared-data,
   persistence and legacy transport paths are executable.
4. Architecture & Design: 8.7/10 — one repository/event/pipeline boundary
   avoids duplicate application state.
5. Performance & Optimization: 7.6/10 — bounded requests and indexed data
   preparation are present; benchmark endpoints remain synchronous.
6. Security: 8.0/10 — strict schemas, stable errors, path/checksum controls,
   CORS limits and non-root container are present; auth is deferred.
7. Testing Quality: 8.6/10 — canonical and compatibility tests cover the
   working synthetic and persistence paths; external data remains unavailable.
8. Documentation: 8.8/10 — plan, migration inventory, README and audits state
   implementation and scientific limits clearly.
9. Scalability: 7.4/10 — repository and artifact seams exist; worker and
   distributed event infrastructure are deferred.
10. DevOps Practices: 7.7/10 — CI, pinned dependencies, migration, Docker and
    Compose definitions exist; Docker/PostgreSQL were not executable here.
11. User Experience: 8.2/10 — old clients and the future frontend have stable
    snapshots, events, errors and counterfactual responses.

Overall: **8.2/10** for the backend hackathon MVP.

Maturity: **MVP / advanced computational-genetics research prototype**; not
production-ready or clinical software.
