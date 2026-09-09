# API phase audits

These files are implementation checkpoints for [`../PLAN.md`](../PLAN.md), not
marketing scores. Each audit records what was actually implemented, which
commands were run, and what is still unsafe to claim.

The scorecard is intentionally repeated in every phase so an agent or reviewer
can compare quality over time. Scores are for the canonical `apps/api` only;
they do not award credit for code left in `app/trio`, `app/validation`, or the
legacy root-level tests unless the canonical runtime imports and tests that
behavior.

The current endpoint is `phase-8-legacy-compat.md`. A final audit should be refreshed after
the frontend is connected, a clean environment runs CI, Docker is exercised,
and a formal multi-seed benchmark report is checked in.
