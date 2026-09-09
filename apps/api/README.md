# Genetic Universe API

The canonical backend for Genetic Universe → Offspring Universe.

It exposes a versioned FastAPI contract for:

```text
parent haplotypes
  → seeded meiosis and crossover provenance
  → gametes and offspring
  → synthetic phenotype model
  → outside-parental-range novelty
  → Novelty Trace candidates
  → counterfactual evidence
  → Novelty Evidence Graph
```

The service is a computational research framework. It does not predict baby traits, diagnose disease, or prove biological causality.

## Local development

From this directory:

```bash
python3.12 -m venv .venv
. .venv/bin/activate
python -m pip install -e '.[test]'
uvicorn app.main:app --reload --port 8000
```

The API is available at `http://localhost:8000`. Interactive OpenAPI documentation is at `/docs`.
An installed environment also provides the equivalent `genetic-universe-api` console command.

## First vertical slice

```bash
curl -X POST http://localhost:8000/v1/runs \
  -H 'content-type: application/json' \
  -d '{"mode":"synthetic","dataset_id":"fixture_epistasis_ab_cd_v1","seed":42}'

curl -X POST http://localhost:8000/v1/runs/<run_id>/start
curl http://localhost:8000/v1/runs/<run_id>/snapshot
curl http://localhost:8000/v1/runs/<run_id>/timeline
curl http://localhost:8000/v1/runs/<run_id>/trace
```

The default fixture is deterministic. It plants an interpretable interaction and exposes model-relative counterfactual deltas.

## HTTP client boundary

The API is OpenAPI-first. The frontend should use the generated contract with
`openapi-fetch` through a small typed wrapper, then use TanStack Query for REST
cache, loading, retry, mutation and invalidation state. WebSocket events are a
separate ordered playback stream and are not stored in the query cache.

Regenerate and verify the checked-in contract from the repository root:

```bash
PYTHONPATH=apps/api python apps/api/scripts/export-openapi.py
PYTHONPATH=apps/api python apps/api/scripts/check-openapi.py
```

## Testing

```bash
pytest
pytest tests/unit tests/contract tests/integration -q
python scripts/check-openapi.py
```

The copied `app/trio` and `app/validation` packages are migration references.
Their former public behavior is available through canonical compatibility
adapters: `/api/experiments/*`, `/api/families/*`, `/api/benchmark/*`, and
`/ws/experiments/{experiment_id}`. New features belong under the canonical
packages described in [`PLAN.md`](PLAN.md); clients should migrate to `/v1`.

## Runtime modes

- `synthetic`: all genomes and phenotype values are synthetic.
- `real_trio_synthetic_phenotype`: prepared public phased trio genotypes with an explicitly synthetic phenotype model. It requires a checksum-verified manifest and never fabricates phenotype or crossover evidence.

Prepare a bounded 1000 Genomes region. The input `.vcf.gz` must have a `.tbi`
or `.csi` index:

```bash
PYTHONPATH=apps/api python apps/api/scripts/prepare-1000g.py \
  --data-root apps/api/data \
  --vcf apps/api/data/raw/1kGP_high_coverage_Illumina.chr22.filtered.SNV_INDEL_SV_phased_panel.vcf.gz \
  --pedigree apps/api/data/raw/1kGP.3202_samples.pedigree_info.txt \
  --child HG00405 --chromosome 22 --start 10500000 --end 10600000 \
  --source-url 'https://ftp.1000genomes.ebi.ac.uk/vol1/ftp/data_collections/1000G_2504_high_coverage/'
```

Then validate the prepared manifest before creating a run:

```bash
curl -X POST http://localhost:8000/v1/ingestion/preview \
  -H 'content-type: application/json' \
  -d '{"dataset_id":"1000g_chr22_prepared_trio"}'
```

Prepared VCF/PED files remain local research artifacts and should stay ignored
by Git. Their checksums, source URL, assembly and region are retained in the
manifest and surfaced as provenance without exposing local paths.

## Durable local or Compose mode

Memory mode is the default for the hackathon and tests. To persist run metadata
in SQLite:

```bash
GENETIC_REPOSITORY_BACKEND=sqlalchemy \
GENETIC_DATABASE_URL=sqlite:///./genetic_universe.db \
uvicorn app.main:app --port 8000
```

For PostgreSQL, run `docker compose -f docker-compose.yml up --build` from this
directory. The API stores bounded run metadata, snapshots, events and
counterfactual results in SQL; large VCF/BCF/tree artifacts remain files.

## Scientific wording

Use “computational attribution”, “counterfactual evidence”, “candidate configuration”, and “inferred breakpoint interval”. Avoid “clinical risk”, “proof of causality”, and “guaranteed biological explanation”.
