# Phase 1 Audit — Contracts and domain boundary

## Scope completed

- Added strict Pydantic contracts in `app/schemas/` for runs, genomes,
  phenotype ledgers, events, traces, counterfactuals, errors, ingestion,
  disclosure and artifact references.
- Added dependency-light domain modules in `app/domain/` for identifiers,
  interval/provenance validation, novelty, phenotype and evidence graph state.
- Added `packages/contracts/openapi.json` and export/check scripts.
- Added `apps/api/MIGRATION.md` so copied modules cannot silently become new
  production entrypoints.

## Verification

- `pytest tests/contract tests/unit` — passed at this checkpoint.
- `ruff check app tests/unit tests/contract` — passed.
- `python scripts/check-openapi.py` — passed.
- Contract validation rejects unknown fields and invalid real-mode fixture IDs.

## Plan comparison

- Planned behavior: a language-neutral, versioned contract and domain models
  independent of FastAPI and persistence.
- Implemented behavior: `/v1` request/response shapes are typed, strict and
  exported from the canonical FastAPI app; domain imports do not require the
  web framework.
- Remaining gap: generated TypeScript types and the web wrapper are planned in
  `packages/contracts`/`frontend/PLAN.md` but are not implemented yet.

## Scorecard

1. Code Quality: 7.0/10 — clear schemas and domain seams; copied scientific
   code is still present beside the new boundary.
2. Code Readability: 7.2/10 — names and enums are explicit; some migration
   adapters still expose legacy dataclass shapes.
3. Implementation Quality: 6.5/10 — contract is usable, but it is not yet
   backed by the complete scientific lifecycle.
4. Architecture & Design: 7.0/10 — transport/domain separation is real;
   persistence and event replay are not yet integrated.
5. Performance & Optimization: 5.8/10 — validation is bounded; no benchmark
   or artifact storage policy is exercised yet.
6. Security: 6.5/10 — strict input models and stable error types exist;
   endpoint-level failure and resource-limit tests are still missing.
7. Testing Quality: 6.0/10 — contract and bootstrap coverage exists; scientific
   properties and full HTTP flows are not yet canonical.
8. Documentation: 6.8/10 — plans and migration notes explain the boundary;
   examples are still sparse.
9. Scalability: 5.2/10 — schemas are suitable for bounded snapshots, but the
   only repository at this point is memory-oriented.
10. DevOps Practices: 5.2/10 — package metadata is present; CI, migrations and
    deployment checks are not complete.
11. User Experience: 6.0/10 — the frontend can target a stable contract;
    there is no complete live workflow yet.

Overall: 6.2/10
Maturity: Prototype with a stable contract foundation

## Strengths

- Unknown JSON fields cannot silently drift across frontend and backend.
- Real-data disclosure and breakpoint confidence are first-class fields.
- The OpenAPI file is generated from the canonical application rather than
  hand-maintained independently.

## Weaknesses

- No durable run lifecycle exists yet.
- No generated TypeScript client exists yet.
- Legacy scientific modules are not yet hidden behind a complete adapter.

## Critical fixes

1. Wire the synthetic scientific engine to these schemas.
2. Add deterministic property tests for segments and Mendelian inheritance.
3. Add event envelopes, repository interfaces and the first HTTP integration.

## Five next improvements

1. Finish the synthetic runner adapter.
2. Add a committed demo snapshot fixture.
3. Add error-handler integration tests.
4. Add a replayable event timeline.
5. Add the SQL migration boundary.
