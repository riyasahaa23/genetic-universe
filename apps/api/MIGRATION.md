# Backend migration inventory

`apps/api` is the canonical backend. The copied implementation is retained only
as a comparison reference while the canonical modules are migrated and tested.

## Canonical runtime

The supported entrypoint is `app.main:app`. New API code must import only from
the canonical packages below and must not import from the temporary extraction
directory or the legacy application entrypoints.

| Source material | Canonical destination | Status | Notes |
| --- | --- | --- | --- |
| `app/validation/scientific/*` | `app/scientific/synthetic/*` | wrapped/refactored | Deterministic planted-epistasis engine used by the MVP. |
| `app/trio/models.py` | `app/schemas/*`, `app/domain/*` | wrapped | Public API models are intentionally smaller and transport-stable. |
| `app/trio/pipeline.py` | `app/scientific/real_data/pipeline.py` | migrated/wrapped | Canonical `FamilyStore` now serves only `dataset_kind=real` manifests. |
| `app/trio/ingestion.py` | `app/scientific/real_data/vcf.py` | migrated/wrapped | Strict VCF parsing; no synthetic fallback and no absent-parent-as-reference assumption. |
| `app/trio/inheritance.py` | `app/scientific/real_data/inheritance.py` | migrated/wrapped | Converts observed trio records into evidence-bearing states. |
| `app/trio/segments.py` | `app/scientific/real_data/segments.py` | migrated/wrapped | Produces marker-bounded inferred intervals, never exact biological breakpoints. |
| `app/datasets/thousand_genomes/*` | `app/scientific/real_data/*`, `scripts/prepare-1000g.py` | migrated/wrapped | Dataset preparation, pedigree registry and canonical preparation command. |
| `app/validation/api/*` | `app/api/v1/*` | replaced | Legacy endpoints are not included by the canonical app. |
| `app/validation/db/*` | `app/repositories/*` | replaced | Repository contract is shared by memory and durable adapters. |
| `app/validation/main.py` | `app/main.py` | replaced | There is one supported FastAPI application. |
| `app/trio/api.py` | `app/api/v1/*` | replaced | Transport is separated from scientific pipeline code. |

The copied `app/datasets/` package remains a migration reference for old
dataset helpers. It is not imported by the supported `app.main:app` runtime.

## Known behavior decisions

- Synthetic mode is the default and is the only mode required for the first
  demo path.
- `real_trio_synthetic_phenotype` means real phased genotype/transmission data
  combined with an explicitly synthetic phenotype model. It does not expose a
  clinical phenotype and must disclose that fact in the response.
- Synthetic crossover coordinates are exact because the simulator generated
  them. Real-data crossover outputs are inferred marker-bounded intervals.
- Counterfactuals are computational evidence relative to a phenotype model;
  they are never labelled biological proof.
- The frontend receives snapshots and ordered events. It does not recompute
  inheritance or phenotype values.

## Removal gate

The legacy `app/trio`, `app/validation`, and copied root-level tests may be
removed only after:

1. the real-data integration tests pass against a prepared, checksummed fixture;
2. the repository contract tests pass for memory and durable adapters;
3. the final audit compares every item in `backend/PLAN.md` and `common/PLAN.md`;
4. no canonical import references a legacy package.
