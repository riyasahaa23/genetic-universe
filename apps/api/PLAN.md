# `apps/api` Implementation Plan

## Status

This is the execution plan for the canonical FastAPI backend. It supersedes the temporary copied entrypoints while preserving them as migration references under `app/trio` and `app/validation`. Their old HTTP/WebSocket surfaces are available through canonical adapters under `app/api/compat/`, so clients can migrate without a second runtime.

The implementation target is the backend described in [`../../backend/PLAN.md`](../../backend/PLAN.md), the cross-stack rules in [`../../common/PLAN.md`](../../common/PLAN.md), and the system architecture in [`../../PLAN.md`](../../PLAN.md).

The target is a reproducible research MVP. “10/10” means complete against the agreed hackathon scope and honest about scientific limitations; it does not mean clinical causality or production medical software.

## Current implementation status

This repository is currently at an integrated MVP checkpoint:

| Phase | Status | Evidence |
| --- | --- | --- |
| P0 foundation/migration | Complete | Canonical package, settings, Docker files, migration inventory and bootstrap test exist. |
| P1 contracts/domain | Complete for the MVP boundary | Strict Pydantic contracts, domain invariants and checked-in OpenAPI exist. |
| P2 synthetic scientific core | Complete for the demo model | Seeded meiosis, phenotype ledger, novelty, trace, graph and three intervention kinds are wired. |
| P3 orchestration/events | Complete for single-process execution | `ScientificPipeline`, run service, ordered timeline and replayable WebSocket exist. |
| P4 API/persistence | Complete for memory and SQLite/PostgreSQL-compatible SQLAlchemy mode | REST routes, stable errors, migrations, repository contract and legacy compatibility adapters are covered by integration tests. |
| P5 real-data mode | Complete as a prepared-region adapter | Indexed 1000 Genomes preparation CLI, checksum validation and real-genotype/synthetic-phenotype disclosure are implemented; no large public download is committed. |
| P6 evaluation | Complete as an executable evaluation surface; report artifact pending | Typed benchmark endpoints cover fixed, baseline, multi-seed, scalability, ablation, negative-control and final-evidence workflows. A formal committed report is still a release artifact, not a missing route. |
| P7 hardening/deployment | Partial | Lint, strict boundary typing, tests, OpenAPI checks, non-root Docker and CI are present; Docker execution is environment-dependent and not run in this workspace. |

The remaining gaps are deliberately visible in the phase audits under
[`audits/`](audits/). Do not mark the final checklist complete merely because
the synthetic demo passes.

## 1. Working rules for parallel agents

### 1.1 Canonical ownership

After Phase 0, only the following paths are canonical:

```text
apps/api/app/main.py
apps/api/app/api/
apps/api/app/schemas/
apps/api/app/domain/
apps/api/app/scientific/
apps/api/app/orchestration/
apps/api/app/repositories/
apps/api/app/infrastructure/
apps/api/tests/unit/
apps/api/tests/integration/
apps/api/tests/contract/
apps/api/tests/property/
```

The copied paths below are migration references only. New features must not be added there:

```text
apps/api/app/trio/
apps/api/app/validation/
apps/api/tests/*.py
apps/api/tests/validation/
```

The copied `apps/api/app/datasets/` package is also migration/reference code
for the older 1000 Genomes helpers. The canonical runtime uses
`app/scientific/real_data/` and `scripts/prepare-1000g.py`; do not add new API
behavior to `app/datasets/`.

### 1.2 Same-worktree parallelism

Agents must own disjoint file paths. No two agents may edit the same file in parallel. A phase coordinator owns shared files such as `app/main.py`, `pyproject.toml`, `README.md`, `PLAN.md`, and the OpenAPI export.

Each agent must:

1. Read this plan and the relevant source files before editing.
2. Modify only its assigned paths.
3. Add or update tests in its owned test directory.
4. Run the smallest relevant command before handing off.
5. Record changed files, commands, results, risks, and score changes in the phase audit.
6. Never delete the migration reference implementation until the migration gate explicitly permits it.

### 1.3 Integration order

Parallel work is allowed only within a phase. Phases are integrated in this order:

```text
P0 foundation
  → P1 contracts and domain
  → P2 scientific core
  → P3 orchestration and events
  → P4 API and repositories
  → P5 frontend contract/integration support
  → P6 real-data mode
  → P7 hardening and final audit
```

Agents may prepare later-phase code against frozen contracts, but later code must not be merged into the canonical runtime until the dependency phase passes its exit gate.

## 2. Target architecture

```text
apps/api/
├── app/
│   ├── main.py                         # one canonical FastAPI app
│   ├── settings.py                     # typed environment configuration
│   ├── api/
│   │   ├── router.py                   # top-level router and versioning
│   │   ├── dependencies.py             # repositories, services, request IDs
│   │   ├── errors.py                   # stable public error mapping
│   │   ├── v1/
│   │   │   ├── health.py
│   │   │   ├── datasets.py
│   │   │   ├── runs.py
│   │   │   ├── trace.py
│   │   │   ├── counterfactuals.py
│   │   │   └── events.py               # WebSocket route
│   │   └── compat/                     # legacy /api and /ws adapters
│   │       ├── experiments.py
│   │       ├── real_trio.py
│   │       ├── benchmarks.py
│   │       └── events.py
│   ├── schemas/
│   │   ├── common.py                   # IDs, enums, pagination, provenance
│   │   ├── run.py                      # requests, status and snapshots
│   │   ├── genome.py                   # genome and segment contracts
│   │   ├── phenotype.py                # model and contribution contracts
│   │   ├── trace.py                    # candidate and graph contracts
│   │   ├── counterfactual.py           # intervention contracts
│   │   ├── events.py                   # ordered event envelope
│   │   └── errors.py                   # error envelope
│   ├── domain/
│   │   ├── identifiers.py
│   │   ├── genome.py
│   │   ├── provenance.py
│   │   ├── phenotype.py
│   │   ├── novelty.py
│   │   ├── interventions.py
│   │   └── evidence_graph.py
│   ├── scientific/
│   │   ├── protocols.py                # simulator/evaluator interfaces
│   │   ├── synthetic/
│   │   │   ├── fixtures.py
│   │   │   ├── meiosis.py
│   │   │   ├── phenotype.py
│   │   │   ├── novelty.py
│   │   │   ├── trace.py
│   │   │   └── counterfactuals.py
│   │   ├── real_data/
│   │   │   ├── vcf.py
│   │   │   ├── pedigree.py
│   │   │   ├── regions.py
│   │   │   └── adapter.py
│   │   └── evaluation/
│   │       ├── planted_truth.py
│   │       ├── metrics.py
│   │       └── benchmarks.py
│   ├── orchestration/
│   │   ├── run_service.py              # application use cases
│   │   ├── pipeline.py                 # stage transitions
│   │   └── event_bus.py                # ordered, replayable events
│   ├── repositories/
│   │   ├── interfaces.py
│   │   ├── memory.py
│   │   ├── postgres.py
│   │   └── artifacts.py
│   └── infrastructure/
│       ├── logging.py
│       ├── database.py
│       ├── manifests.py
│       └── runtime.py
├── data/
│   ├── fixtures/                       # tiny committed, non-sensitive fixtures
│   ├── manifests/                      # metadata and checksums
│   ├── raw/                            # ignored downloads
│   └── prepared/                       # ignored or locally prepared artifacts
├── scripts/
│   ├── prepare-fixtures.py
│   └── prepare-1000g.py
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── contract/
│   └── property/
├── pyproject.toml
├── requirements.lock.txt
├── Dockerfile
├── docker-compose.yml
├── README.md
└── PLAN.md
```

### Runtime rules

- `app.main:app` is the only supported application entrypoint.
- Synthetic mode is the default demo mode.
- Real mode is `real_trio_synthetic_phenotype`, never an implied clinical phenotype mode.
- FastAPI owns transport; domain/scientific modules do not import FastAPI, SQLAlchemy, or WebSocket classes.
- The frontend receives snapshots and events; it never calculates scientific values.
- The frontend uses generated OpenAPI types, `openapi-fetch`, and TanStack Query for REST state. WebSocket playback remains a separate event store.
- Every scientific result carries a seed, model version, dataset ID, code revision, and artifact manifest reference.

## 3. Public contract to freeze

All public routes are versioned under `/v1` except `/health`.

```text
GET  /health
GET  /v1/datasets
POST /v1/runs
GET  /v1/runs/{run_id}
POST /v1/runs/{run_id}/start
GET  /v1/runs/{run_id}/snapshot
GET  /v1/runs/{run_id}/timeline
WS   /v1/runs/{run_id}/events
POST /v1/runs/{run_id}/trace
GET  /v1/runs/{run_id}/trace
POST /v1/runs/{run_id}/counterfactuals
GET  /v1/runs/{run_id}/counterfactuals
POST /v1/ingestion/preview
```

### Run modes

```text
synthetic
real_trio_synthetic_phenotype
```

### Run stages

```text
setup
parent_loading
meiosis
fertilization
phenotype
novelty_detection
candidate_mining
counterfactual
evidence_graph
complete
```

### Required interventions

```text
revert_variant
swap_segment
break_interaction
```

### Required event envelope

```json
{
  "schema_version": "1.0",
  "event_id": "evt_0042",
  "run_id": "run_demo_001",
  "sequence": 42,
  "type": "candidate_ranked",
  "stage": "candidate_mining",
  "emitted_at": "2026-01-01T00:00:00Z",
  "payload": {}
}
```

Rules:

- `sequence` is strictly increasing per run.
- Event IDs are unique per run.
- Events can be replayed after reconnecting from a sequence number.
- Terminal states always emit `run_completed` or `run_failed`.
- Large arrays belong in snapshots or artifacts, not event payloads.
- Errors use one stable envelope and never expose tracebacks or local paths.

## 4. Phase plan

## P0 — Foundation and migration baseline

### Objective

Create a runnable Python application boundary without changing scientific behavior yet.

### Coordinator-owned files

```text
apps/api/PLAN.md
apps/api/README.md
apps/api/pyproject.toml
apps/api/.gitignore
apps/api/Dockerfile
apps/api/requirements*.txt
apps/api/app/main.py
```

### Agent P0-A — package and runtime

Work:

- Add `pyproject.toml` with Python version, runtime dependencies, test/lint/type-check commands, and package discovery.
- Keep a generated/pinned `requirements.lock.txt` for Docker and clean-machine installs.
- Add `settings.py` using typed environment settings.
- Add `app/infrastructure/runtime.py` for code revision and dependency metadata.
- Add `/health` with service version, environment, database status, and scientific-core version.

Acceptance:

- `python -m app.main` imports from `apps/api` without the temporary backend.
- Settings never read secrets from source control.
- Health response is typed and stable.

### Agent P0-B — migration inventory

Work:

- Add `apps/api/MIGRATION.md` mapping every copied legacy module to its canonical destination.
- Mark each module as `reuse`, `wrap`, `refactor`, `replace`, or `remove-after-migration`.
- Record known scientific limitations and behavior-preserving tests.

Acceptance:

- Every copied Python module is accounted for.
- No new canonical code imports from the temporary directory.

### P0 exit gate

- Clean virtual environment imports the app.
- `python -m compileall app` passes.
- `pytest tests/unit/test_bootstrap.py` passes.
- Phase audit is written with scores for all eleven categories.

## P1 — Contract, schemas and domain invariants

### Objective

Freeze the boundary required by simultaneous frontend/backend work.

### Agent P1-A — schemas

Own:

```text
app/schemas/
tests/contract/
```

Work:

- Implement typed Pydantic schemas for runs, genomes, segments, phenotypes, candidates, interventions, graphs, events and errors.
- Use stable IDs and explicit enums.
- Encode real-data disclosure and breakpoint confidence in the schema.
- Reject unknown fields and non-finite numbers.
- Add JSON examples matching `common/PLAN.md`.

Acceptance:

- All request and response objects validate independently of FastAPI.
- Contract examples round-trip through Pydantic.
- No public response contains untyped `dict[str, Any]` where a schema is possible.

### Agent P1-B — domain models

Own:

```text
app/domain/
tests/unit/test_domain_*.py
```

Work:

- Move stable identifiers, genome state, segment provenance, phenotype contribution ledger, novelty state, intervention state and evidence graph entities into dependency-light domain models.
- Add invariants for ordered non-overlapping segments and source-parent validity.
- Separate observed, inferred, hypothesis and unresolved evidence states.

Acceptance:

- Domain modules import without FastAPI, SQLAlchemy, NumPy or filesystem access.
- Property tests cover interval and provenance invariants.

### Agent P1-C — OpenAPI export and frontend boundary

Own:

```text
packages/contracts/                    # if created in this phase
apps/api/openapi/
```

Work:

- Export a checked-in OpenAPI document.
- Add example request/response fixtures.
- Document `openapi-fetch` and TanStack Query usage for `apps/web`.
- Add a schema compatibility check that fails when generated output is stale.

Acceptance:

- OpenAPI validates.
- Backend route responses match the exported schema.
- Frontend can generate types without importing Python code.

### P1 exit gate

- Contract fixtures validate.
- The frontend can consume a fixture snapshot without a live backend.
- Breaking schema changes require an explicit schema-version change.

## P2 — Scientific core migration

### Objective

Move the reusable synthetic engine behind stable protocols and remove transport/database coupling.

### Agent P2-A — simulator

Own:

```text
app/scientific/protocols.py
app/scientific/synthetic/meiosis.py
app/scientific/synthetic/fixtures.py
tests/unit/test_meiosis.py
tests/property/test_meiosis_properties.py
```

Work:

- Adapt the copied recombination implementation.
- Accept explicit RNG state and crossover configuration.
- Preserve half-open intervals and source homolog provenance.
- Make crossover positions genuinely seed-driven unless a fixture explicitly plants them.
- Validate Mendelian inheritance when mutation is disabled.

Acceptance:

- Same seed produces the same logical gamete and provenance.
- Different seeds can produce different valid crossover plans.
- Segment coverage is complete, ordered and non-overlapping.

### Agent P2-B — phenotype and novelty

Own:

```text
app/scientific/synthetic/phenotype.py
app/scientific/synthetic/novelty.py
tests/unit/test_phenotype.py
tests/unit/test_novelty.py
```

Work:

- Adapt the data-driven phenotype engine.
- Return a contribution ledger for every term.
- Support additive, dominance-like, recessive-like and pairwise epistatic terms.
- Make noise optional and seeded.
- Implement parental envelope detection and novelty margin.
- Correct all encoding/formula-display issues.

Acceptance:

- A planted A×B interaction is visible in the contribution ledger.
- Parent and offspring values are reproducible.
- No UI or API wording claims biological causality.

### Agent P2-C — trace, interventions and graph

Own:

```text
app/scientific/synthetic/trace.py
app/scientific/synthetic/counterfactuals.py
app/domain/evidence_graph.py
tests/unit/test_trace.py
tests/unit/test_counterfactuals.py
```

Work:

- Rank bounded candidates using phenotype contribution and provenance evidence.
- Implement `revert_variant`, `swap_segment`, and `break_interaction`.
- Compute original value, counterfactual value, delta and novelty resolution.
- Build a stable Novelty Evidence Graph.
- Keep planted truth out of production ranking.

Acceptance:

- Removing A×B changes the phenotype by the expected delta.
- Null candidates have lower delta than causal candidates in the benchmark fixture.
- Evidence graph serialization is deterministic.

### P2 exit gate

- A complete synthetic pipeline can run without FastAPI.
- Scientific unit and property tests pass.
- Benchmark reports top-1/top-k recovery, delta separation, reproducibility and runtime.

## P3 — Orchestration and event system

### Objective

Create one authoritative run state machine usable by both REST and WebSocket transport.

### Agent P3-A — run state machine

Own:

```text
app/orchestration/pipeline.py
app/orchestration/run_service.py
tests/unit/test_run_state.py
tests/integration/test_synthetic_run.py
```

Work:

- Implement explicit stage transitions.
- Reject invalid transitions.
- Make runs idempotent by run ID and seed/model/dataset configuration.
- Generate a complete renderable snapshot.
- Ensure failed runs enter a terminal failed state with a public error code.

Acceptance:

- One service runs setup → meiosis → fertilization → phenotype → novelty → trace → graph.
- The final snapshot is sufficient for frontend rendering without recomputing science.

### Agent P3-B — ordered event bus

Own:

```text
app/orchestration/event_bus.py
app/schemas/events.py
tests/unit/test_event_bus.py
tests/integration/test_event_replay.py
```

Work:

- Add unique event IDs, sequence numbers, stage, timestamp and schema version.
- Add bounded in-memory replay for the MVP.
- Expose events after a requested sequence.
- Add terminal success/failure events.
- Keep event payloads small.

Acceptance:

- Duplicate events can be ignored by sequence.
- Reconnecting from sequence N yields a correct suffix.
- Event order is deterministic.

### P3 exit gate

- A synthetic run can be executed by the service and replayed entirely from its event timeline.
- No scientific code imports WebSocket or FastAPI types.

## P4 — API, repositories and persistence

### Objective

Expose the canonical contract and make run state auditable.

### Agent P4-A — REST API

Own:

```text
app/api/router.py
app/api/dependencies.py
app/api/errors.py
app/api/v1/health.py
app/api/v1/datasets.py
app/api/v1/runs.py
app/api/v1/trace.py
app/api/v1/counterfactuals.py
tests/integration/test_api_runs.py
```

Work:

- Add all `/v1` endpoints from the contract.
- Use typed request and response models for every route.
- Add request IDs and stable error mapping.
- Never expose local paths, tracebacks or raw library exceptions.
- Add pagination for candidates and large graph payloads where appropriate.

Acceptance:

- OpenAPI contains every planned route.
- Invalid requests return the shared error envelope.
- A complete run is possible through HTTP alone.

### Agent P4-B — WebSocket route

Own:

```text
app/api/v1/events.py
tests/integration/test_api_events.py
```

Work:

- Add `/v1/runs/{run_id}/events`.
- Validate optional `after_sequence` on connect.
- Replay missed events before subscribing to live events.
- Close cleanly for unknown/completed runs.
- Add heartbeat and backpressure-safe bounded queues.

Acceptance:

- The frontend can reconnect without losing the run timeline.
- WebSocket envelopes exactly match the common contract.

### Agent P4-C — repository adapters

Own:

```text
app/repositories/
app/infrastructure/database.py
app/infrastructure/artifacts.py
tests/unit/test_repositories.py
```

Work:

- Define repository interfaces.
- Implement in-memory repository for tests and local demo.
- Implement PostgreSQL metadata repository for runs, snapshots, events, candidates, interventions and graph JSON.
- Store large genomic artifacts outside relational rows.
- Add transaction boundaries and idempotent writes.
- Add migrations rather than `create_all` in production.

Acceptance:

- Service logic runs against the memory repository.
- PostgreSQL adapter passes the same repository contract tests.
- Re-running the same intervention ID is idempotent.

### P4 exit gate

- All planned routes are reachable from `app.main:app`.
- Synthetic HTTP + WebSocket integration tests pass.
- Memory mode works without PostgreSQL.

## P5 — Real-data adapter and 1000 Genomes mode

### Objective

Add one real phased trio/region path without claiming real phenotype causality.

### Agent P5-A — ingestion adapter

Own:

```text
app/scientific/real_data/
scripts/prepare-1000g.py
data/manifests/
tests/integration/test_real_data.py
```

Work:

- Adapt VCF/BCF parsing and pedigree validation from the copied backend.
- Enforce checksums, reference build, region bounds and phased GT rules.
- Infer marker-bounded crossover intervals with `inferred_interval` confidence.
- Add a small prepared chr22 fixture or a deterministic preparation command.
- Never assume absent parent records are reference homozygous.

Acceptance:

- One real trio can load through the same run contract.
- The response includes the disclosure: real genotypes/inheritance, synthetic phenotype model.
- No exact biological crossover is claimed for real data.

### Agent P5-B — real/synthetic phenotype bridge

Own:

```text
app/scientific/real_data/adapter.py
app/orchestration/pipeline.py  # only the real-mode extension section
tests/integration/test_real_synthetic_mode.py
```

Work:

- Convert a selected real region into the internal genome model.
- Apply an explicitly selected synthetic phenotype model.
- Preserve source evidence separately from simulated phenotype evidence.
- Run the same novelty/trace/counterfactual pipeline with clear evidence tiers.

Acceptance:

- The UI contract is unchanged between synthetic and real-trio-synthetic-phenotype modes.
- Real mode never imports or invents clinical phenotype data.

### P5 exit gate

- A prepared trio loads through `/v1/runs`.
- The final snapshot exposes source artifacts, checksums, confidence and disclosure.
- Real-data tests pass without full-genome downloads.

## P6 — Benchmarks and scientific validation

### Objective

Make performance and attribution claims measured, reproducible and auditable.

### Agent P6-A — benchmark suite

Own:

```text
app/scientific/evaluation/
tests/integration/test_benchmarks.py
```

Work:

- Measure top-1/top-k causal recovery.
- Measure null false-positive rate.
- Measure causal/null counterfactual delta separation.
- Measure novelty resolution rate.
- Measure seeded reproducibility.
- Measure runtime at 20, 100 and 1,000 loci.
- Record benchmark configuration and code revision.

Acceptance:

- No performance claim appears in documentation without a recorded benchmark result.
- Planted truth is separated from production ranking.

### Agent P6-B — property and mutation testing

Own:

```text
tests/property/
tests/unit/
```

Work:

- Add property tests for Mendelian inheritance, segment coverage, deterministic replay and counterfactual locality.
- Add malformed VCF and path traversal cases.
- Add tests for unsupported `BREAK_INTERACTION` behavior until implemented, then replace with positive tests.

Acceptance:

- Scientific invariants fail loudly.
- At least one test protects every critical prior defect.

## P7 — Hardening, documentation and final audit

### Objective

Raise the project from an advanced prototype to a defensible hackathon MVP.

### Agent P7-A — security and reliability

Own:

```text
app/infrastructure/logging.py
app/api/errors.py
tests/integration/test_failure_modes.py
```

Work:

- Add structured JSON logging with request/run IDs.
- Normalize all errors.
- Add request size, region size, candidate count and event queue limits.
- Verify CORS from explicit allowed origins.
- Add timeout and cancellation behavior for long runs.

### Agent P7-B — deployment

Own:

```text
Dockerfile
docker-compose.yml
.dockerignore
.github/workflows/
```

Work:

- Build a minimal non-root image.
- Add `/health` health check.
- Add optional PostgreSQL Compose service.
- Run migrations during controlled deployment, not import time.
- Add CI for formatting, lint, type checks, unit, property, contract and integration tests.

### Agent P7-C — documentation and handoff

Own:

```text
README.md
docs/
audits/
```

Work:

- Document local setup, mock mode, real-data preparation, API usage and frontend connection.
- Document scientific limitations and evidence terminology.
- Add demo script with expected output.
- Add troubleshooting for missing indexed VCF dependencies.

### P7 exit gate

- Clean checkout starts in mock mode.
- Backend passes the complete test suite.
- Docker build and health check pass.
- Synthetic live run works through REST and WebSocket.
- Real trio mode works with a prepared region.
- Final audit compares every item in `backend/PLAN.md` and `common/PLAN.md`.

## 5. Phase audit protocol

After every phase, create `apps/api/audits/phase-<id>.md` containing:

```text
# Phase <id> Audit

## Scope completed
- exact tasks completed
- exact files changed

## Verification
- commands run
- pass/fail result
- known skipped tests

## Plan comparison
- planned behavior
- implemented behavior
- remaining gap

## Scorecard
1. Code Quality: _/10 — explanation
2. Code Readability: _/10 — explanation
3. Implementation Quality: _/10 — explanation
4. Architecture & Design: _/10 — explanation
5. Performance & Optimization: _/10 — explanation
6. Security: _/10 — explanation
7. Testing Quality: _/10 — explanation
8. Documentation: _/10 — explanation
9. Scalability: _/10 — explanation
10. DevOps Practices: _/10 — explanation
11. User Experience: _/10 — explanation

Overall: _/10
Maturity: Prototype | MVP | Production-ready

## Strengths
## Weaknesses
## Critical fixes
## Five next improvements
```

Scores must be evidence-based. A passing unit test does not justify a production-readiness score. Missing fixtures, unmeasured latency, unsupported modes and unverified deployment claims must reduce the score.

## 6. Final audit checklist

### Architecture

- [ ] One canonical `app.main:app`.
- [ ] No production route imports legacy application entrypoints.
- [ ] Domain and scientific layers are transport-independent.
- [ ] Repository interfaces separate persistence from use cases.

### Contract

- [ ] Versioned OpenAPI document exists.
- [ ] Every route has typed request and response schemas.
- [ ] Generated TypeScript types are current.
- [ ] Event envelopes have sequence and replay semantics.

### Science

- [ ] Meiosis is seeded and inspectable.
- [ ] Segment provenance is complete and valid.
- [ ] Phenotype model is explicit and versioned.
- [ ] Novelty uses the parental envelope.
- [ ] Candidate ranking uses evidence and phenotype contribution.
- [ ] Three interventions produce auditable deltas.
- [ ] Real-data breakpoints are intervals, not claimed exact crossovers.

### Reproducibility

- [ ] Seed, model version, dataset ID, code revision and artifact checksums are persisted.
- [ ] Synthetic fixtures are committed and deterministic.
- [ ] Real-data preparation is scripted.
- [ ] Clean-machine tests pass.

### Security and operations

- [ ] No traceback/path leakage.
- [ ] Explicit CORS configuration.
- [ ] Request and computational limits are enforced.
- [ ] Docker runs as non-root.
- [ ] Health check, CI and migrations exist.

### Product

- [ ] Mock mode works without backend data downloads.
- [ ] Frontend can render a final snapshot without scientific inference.
- [ ] WebSocket reconnect does not lose events.
- [ ] Synthetic phenotype disclosure is visible in real mode.
- [ ] No wording implies clinical prediction or biological proof.
