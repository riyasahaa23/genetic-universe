# Current implementation analysis — plan-to-code audit

This is the strict handoff audit for the canonical backend at the current
workspace state. It compares the code with `backend/PLAN.md` and the shared
rules in `common/PLAN.md`. It is deliberately not a claim that the whole
monorepo, frontend, downloaded human data, or a production deployment is
complete.

## What changed from the extracted backend

| Area | Extracted state | Canonical `apps/api` state |
| --- | --- | --- |
| Entry point | Two competing FastAPI/application paths under `app/validation` and `app/trio` | One supported `app.main:app`; old HTTP/WebSocket behavior is served by canonical compatibility adapters, while old copies remain migration references. |
| API shape | Legacy route families and mixed response/error shapes | Versioned `/v1` routes with strict Pydantic request/response schemas and one error envelope. |
| Scientific ownership | Scientific code was reachable from transport/application modules | `app/scientific` is called through `ScientificPipeline` and the typed `runner.py` adapter. |
| Synthetic path | Useful engine but hard to consume consistently | Seeded synthetic run returns genome, provenance, phenotype ledger, novelty, candidates, graph and counterfactuals. |
| Events | Legacy WebSocket publisher behavior | Ordered event envelopes with stable sequence, replay timeline, terminal events and reconnect cursor. |
| Persistence | Legacy database path and in-memory manager were coupled to old services | Repository protocol with memory and SQLAlchemy adapters; versioned migration; SQLite tested and PostgreSQL configured. |
| Real data | Existing family pipeline required data files and exposed old API behavior | Prepared indexed-region CLI, checksums, pedigree validation, real-trio/synthetic-phenotype adapter and disclosure. |
| Error/security | Raw exception text could reach clients; broad CORS in old app | Stable public codes, request IDs, sanitized messages, explicit CORS, safe paths, bounds and non-root container. |
| Verification | Full extracted test set depended on unavailable GIAB/public artifacts and old imports | 26 canonical tests, including 4 compatibility tests, pass; data-dependent legacy tests remain separately labelled and are not silently counted. |
| Reproducibility | Configuration and code provenance were distributed across old modules | Seed, model/dataset IDs, code revision, runtime/disclosure and source checksums are carried in result contracts. |

## Backend plan comparison

### Objective and architecture

- Complete: modular-monolith FastAPI boundary, transport-independent domain
  models, scientific adapter, event bus and repositories are present.
- Complete: the default demo path is usable without data downloads.
- Partial: the scientific engine is still a migrated implementation with
  typing/refactoring debt; msprime/tskit is only a future adapter boundary.

### Domain and scientific pipeline

- Input validation: complete for public request models, synthetic invariants,
  manifest/checksum/pedigree/region checks and bounded candidate/locus options.
- Meiosis: complete for transparent seeded synthetic simulation; crossover
  positions and source homologs are exposed.
- Fertilization: complete; offspring dosage and locus provenance are validated.
- Phenotype: complete for additive, dominance-like, recessive-like and pairwise
  terms in the migrated model; values are synthetic and versioned.
- Novelty: complete using the parental envelope and outside-range margin.
- Candidate mining: complete for bounded variant, segment and interaction
  candidates; not an exhaustive arbitrary-subset search.
- Counterfactuals: complete for all three requested intervention kinds in
  synthetic mode; results include original/counterfactual values, delta and
  novelty resolution. Legacy counterfactual aliases are persisted through the
  same canonical repository and snapshot path.
- Evidence graph: complete as a stable JSON graph with typed evidence status;
  it is called an evidence graph, not a proven causal DAG.

### API, compatibility routes and events

- All planned REST routes are present under `/v1`; `/health` remains unversioned.
- All extracted HTTP surfaces are also available through `app/api/compat/`:
  stage-oriented experiments, real-trio analysis, benchmark/evaluation routes,
  and the old `/ws/experiments/{id}` event protocol. They delegate to the
  canonical services instead of mounting a second FastAPI application.
- WebSocket replay is present at `/v1/runs/{run_id}/events` and accepts
  `after_sequence`.
- Errors are normalized for HTTP; invalid WebSocket cursors are rejected with a
  bounded public error message.
- Large result arrays are in snapshots, not event payloads.
- Partial: WebSocket live delivery uses single-process repository polling at
  50 ms; it is not a distributed pub/sub implementation.

### Persistence and artifacts

- Complete for bounded MVP metadata: runs, status, snapshots, traces, events and
  counterfactuals are stored through SQLAlchemy and an idempotent migration.
- Complete for local artifact verification: paths remain below the data root
  and SHA-256 is checked before use.
- Partial for production scale: no object storage, retention policy or large
  artifact streaming is configured.
- Deterministic completed runs can rehydrate the scientific state by rerunning
  the same seeded/configured adapter; a general serialized engine artifact is
  not yet stored.

### Real-data plan

- Complete as a prepared-region method-validation mode.
- The 1000 Genomes VCF, index and pedigree are operator-provided inputs; the
  repository does not include or download them automatically.
- Phenotype data is not inferred from 1000 Genomes. The response explicitly
  states that the phenotype is synthetic.
- Real recombination is represented as marker-bounded inferred intervals, not an
  exact nucleotide-level biological breakpoint.

### Testing and benchmarks

- Complete for canonical contract, HTTP, WebSocket, SQL restart, failure-mode,
  real fixture, artifact safety, core-property, and legacy compatibility tests.
- The old benchmark endpoint family is implemented through a typed canonical
  benchmark suite. Partial remains only for the release artifact: a committed
  multi-seed report with null controls, confidence intervals and a 1,000-locus
  baseline is still required.

## Common plan comparison

- OpenAPI-first contract: complete; `packages/contracts/openapi.json` is checked
  for staleness against `app.main:create_app`.
- Shared vocabulary/enums/disclosures: complete in `app/schemas/common.py` and
  related modules.
- Generated TypeScript types: pending. The frontend should add
  `openapi-typescript` output rather than hand-copying schemas.
- `openapi-fetch` + TanStack Query: documented in `packages/contracts/README.md`,
  `frontend/PLAN.md` and `apps/api/README.md`; not yet wired into `apps/web`.
- Mock fixtures: synthetic backend responses are deterministic, but the full
  `packages/contracts/examples/` fixture set is pending.
- Event replay: complete at the backend contract layer.
- Scientific wording: complete in backend response text and README; frontend
  must preserve the same disclosure.
- Integration with the actual visual frontend: pending and intentionally kept
  out of this backend change.

## Current strict scorecard

1. Code Quality: 8.2/10 — canonical boundaries, repository protocol, strict
   public models and linting are strong; migrated scientific code remains dense.
2. Code Readability: 8.1/10 — names, schemas, README, migration and audits are
   clear; `RunService.start` still deserves stage-level extraction.
3. Implementation Quality: 8.4/10 — the complete synthetic story, three
   interventions, real prepared mode and persistence are functional.
4. Architecture & Design: 8.5/10 — modular monolith, pipeline seam and
   OpenAPI-first design fit the hackathon; distributed execution is deferred.
5. Performance & Optimization: 7.5/10 — bounded inputs and indexed extraction
   are enforced; no clean-machine load profile or async worker exists.
6. Security: 7.8/10 — strict validation, CORS, path/checksum controls, safe
   errors, limits and non-root Docker are present; no auth/rate limiting by
   explicit MVP scope.
7. Testing Quality: 8.4/10 — 26 canonical tests, including 4 compatibility
   tests, pass across contracts, API, WebSocket, persistence, failures, real
   mode and properties; the supplied external data and container tests remain
   environment-dependent.
8. Documentation: 8.6/10 — implementation plan, migration inventory, README,
   phase audits and scientific wording are unusually complete for an MVP.
9. Scalability: 7.2/10 — bounded artifacts and durable metadata are sound;
   synchronous execution, polling and JSON snapshots limit larger workloads.
10. DevOps Practices: 7.4/10 — CI, pinned dependencies, migrations, Docker and
    Compose are present; Docker/PostgreSQL were not executable in this workspace.
11. User Experience: 7.8/10 — the contract supports the intended animated
    frontend and stable failure/reconnect states; actual live UI integration is
    pending.

Overall: 8.0/10
Maturity: MVP backend / advanced research prototype; not production-ready

## Top strengths

- Novelty Trace is the center of the implementation rather than a decorative
  chromosome animation.
- Counterfactuals are calculated by the scientific engine and persisted, not
  fabricated by the browser.
- The real-data mode makes the genotype/phenotype boundary explicit.
- The frontend can proceed independently against a checked-in contract.
- Reviewers can reproduce the default run and inspect the complete event chain.

## Biggest weaknesses

- The backend is complete enough for a hackathon MVP, including the extracted
  HTTP/WebSocket feature surface, but not for clinical or population-scale
  inference.
- No 1000 Genomes phenotype labels exist in the supplied public inputs, so real
  mode cannot validate real human phenotype causality.
- Generated TypeScript/openapi-fetch/TanStack Query integration is still a
  frontend task.
- Scientific legacy modules need a full typing/refactor pass.
- Docker/PostgreSQL, supplied real-data fixtures and repeated benchmark claims
  still need external execution.

## Critical fixes before final full audit

1. Connect `apps/web` through generated OpenAPI types, `openapi-fetch` and
   TanStack Query; do not duplicate API shapes.
2. Run CI and Docker Compose on a clean machine with PostgreSQL.
3. Add the formal multi-seed benchmark report before quoting accuracy/latency.
4. Decide whether deterministic adapter rehydration is enough or persist a
   versioned scientific artifact for long-lived runs.
5. Document public-data licensing, retention and operator handling.

## Five score-improving changes

1. Add the generated TypeScript client and live frontend integration.
2. Extract stage functions and add timeout/cancellation support.
3. Replace WebSocket polling with a bounded pub/sub implementation for multiple
   workers.
4. Type/fuzz the migrated VCF and attribution modules.
5. Add msprime/tskit and larger-scale artifact/benchmark adapters without
   changing the public contract.
