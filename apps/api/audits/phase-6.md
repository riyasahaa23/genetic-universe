# Phase 6 Audit — Evaluation and scientific validation

## Scope completed

- Preserved the copied synthetic evaluation/benchmark modules behind canonical
  `app/scientific/evaluation/` imports.
- Added local benchmark entrypoints for attribution metrics, negative controls,
  reproducibility and locus-count scaling.
- Added property tests for seeded meiosis coverage and deterministic output.
- Verified the default negative control is inside the parental phenotype range.

## Verification

- Canonical `pytest` suite — passed.
- Local benchmark smoke ran for the default fixture and 20/50/100/200 loci.
- The benchmark output was treated as a smoke result, not a published accuracy
  claim; a formal multi-seed report is still not checked in.
- `ruff` and strict boundary `mypy` — passed.

## Plan comparison

- Planned behavior: report top-1/top-k recovery, false positives, delta
  separation, novelty resolution, reproducibility and runtime at 20/100/1,000
  loci.
- Implemented behavior: evaluation functions and smoke execution exist, and
  the runtime path is measured locally.
- Remaining gap: no committed statistical report with confidence intervals,
  null-world repetitions or 1,000-locus acceptance baseline yet.

## Scorecard

1. Code Quality: 7.8/10 — evaluation is separated from production ranking;
   copied benchmark code remains less typed.
2. Code Readability: 7.5/10 — metric names are meaningful; benchmark entrypoint
   surface is larger than the MVP needs.
3. Implementation Quality: 8.0/10 — the benchmark can exercise planted truth
   without putting truth into production candidate generation.
4. Architecture & Design: 8.2/10 — evaluation is a separate scientific layer;
   result artifact persistence is still basic.
5. Performance & Optimization: 7.5/10 — bounded scaling is measurable; no
   load-test harness or optimization profile is committed.
6. Security: 7.7/10 — benchmark inputs are synthetic and bounded; malformed
   artifact fuzzing remains incomplete.
7. Testing Quality: 8.2/10 — contract, integration, property and smoke tests
   pass; mutation testing and broad statistical repetition are missing.
8. Documentation: 7.8/10 — claims are constrained; no checked-in benchmark
   table makes replication immediate.
9. Scalability: 7.2/10 — candidate limits and locus tests exist; larger
   interactions remain combinatorial.
10. DevOps Practices: 7.2/10 — CI commands include test/lint/type/OpenAPI
    checks; Docker and Postgres remain environment-dependent.
11. User Experience: 8.0/10 — the UI can show evidence strength rather than a
    binary “proof” label; polished frontend integration is still absent.

Overall: 7.8/10
Maturity: Research MVP with measured smoke coverage

## Strengths

- Synthetic ground truth makes attribution objectively testable.
- Benchmark code is not used as a hidden production shortcut.
- Performance claims are being withheld until repeated measurements exist.

## Weaknesses

- One successful fixture is not evidence of general scientific accuracy.
- Benchmark output is not yet versioned as a formal artifact.
- The copied evaluation code has technical debt outside the strict boundary
  type-check.

## Critical fixes

1. Generate a deterministic multi-seed benchmark report.
2. Include null worlds and confidence intervals.
3. Define pass/fail thresholds before presenting accuracy to judges.

## Five next improvements

1. Add `benchmark --seeds 0..99 --json`.
2. Commit a machine-readable benchmark summary.
3. Add pairwise candidate scaling plots.
4. Add mutation tests for candidate ranking.
5. Add 1,000-locus performance measurement.
