# Phase 2 Audit — Synthetic scientific core

## Scope completed

- Migrated the transparent synthetic engine to `app/scientific/synthetic/`.
- Added the typed `runner.py` adapter from legacy scientific results to public
  schemas.
- Implemented seeded meiosis, contiguous segment provenance, fertilization,
  contribution-ledger phenotype evaluation and parental-envelope novelty.
- Implemented candidate ranking, graph serialization and model-relative
  `revert_variant`, `swap_segment` and `break_interaction` counterfactuals.
- Added evaluation wrappers and synthetic scientific property tests.

## Verification

- `pytest tests/unit tests/contract tests/property` — passed.
- Seed 42 demo produces parent values 12.0 and 18.0, offspring 31.0 and a
  13.0 outside-parental-range margin.
- The ranked `E_L10_L31` interaction returns delta 16.0 and resolves novelty.
- Manual smoke verified all three intervention kinds return 200 responses.
- `ruff check app tests/unit tests/contract tests/property` — passed.

## Plan comparison

- Planned behavior: pure, seeded synthetic computation behind a protocol with
  auditable provenance and planted truth only for evaluation.
- Implemented behavior: the MVP adapter computes all displayed values and does
  not use planted truth to rank production candidates.
- Remaining gap: the copied scientific implementation is not fully typed and
  the msprime/tskit adapter is a later research-scale extension.

## Scorecard

1. Code Quality: 7.2/10 — the public adapter is narrow; the copied engine has
   legacy style and typing debt.
2. Code Readability: 7.4/10 — formulas, evidence status and provenance are
   understandable; the large attribution module remains dense.
3. Implementation Quality: 7.5/10 — the complete synthetic research story is
   executable through Python and the public model.
4. Architecture & Design: 7.5/10 — scientific code is isolated from API and
   persistence; the orchestrator still needed extraction at this point.
5. Performance & Optimization: 6.8/10 — bounded 20–1,000-locus work is fast;
   pairwise/exhaustive scaling is intentionally not solved.
6. Security: 6.7/10 — no browser input reaches raw scientific internals;
   limits and failure-path coverage need expansion.
7. Testing Quality: 7.0/10 — invariant and vertical-slice checks cover the
   core; multi-seed benchmark evidence is not yet a committed report.
8. Documentation: 7.0/10 — scientific wording is careful and the README has
   a demo path; formula/model registry documentation is still limited.
9. Scalability: 6.0/10 — candidate limits are bounded; execution is still
   synchronous and in-process.
10. DevOps Practices: 5.8/10 — reproducible package metadata exists; no full
    CI or container verification yet.
11. User Experience: 7.0/10 — snapshots contain enough data for animation and
    trace panels; live transport is not yet the final integrated path.

Overall: 7.1/10
Maturity: Functional research prototype

## Strengths

- The hackathon’s central claim is demonstrable without a clinical claim.
- Counterfactual values come from recomputation, not frontend arithmetic.
- The same scientific state can feed cards, tracks and an evidence graph.

## Weaknesses

- A deterministic demo fixture can hide weaknesses in generalization.
- Candidate interactions are bounded and model-defined, not genome-wide.
- The current engine has a legacy implementation underneath the adapter.

## Critical fixes

1. Separate pipeline selection from the run service.
2. Persist event and snapshot state.
3. Test real API failures without exposing library/path details.

## Five next improvements

1. Add explicit pipeline and protocol interfaces.
2. Add WebSocket replay tests.
3. Add SQL repository contract tests.
4. Add real-trio/synthetic-phenotype mode.
5. Generate multi-seed benchmark output.
