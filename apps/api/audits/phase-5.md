# Phase 5 Audit — Real phased-trio adapter

## Scope completed

- Migrated the prepared-family pipeline to `app/scientific/real_data/`.
- Added strict manifest, checksum, pedigree, region and phased-genotype checks.
- Added `scripts/prepare-1000g.py` using an indexed VCF and bounded region
  extraction; it never fabricates missing input or phenotype data.
- Added `real_trio_synthetic_phenotype` mode through the same run contract.
- Added inferred marker-bounded breakpoint intervals and disclosure fields for
  observed genotype/pedigree versus synthetic phenotype.
- Added a small canonical real-data integration fixture without committing
  public human genomic files.

## Verification

- `pytest tests/integration/test_real_mode_contract.py` — passed.
- Manifest preview reports `manifest_and_checksums_verified` for the fixture.
- Real-mode snapshot includes source variant IDs, four checksum-addressed input
  artifacts, `inferred_interval` confidence and the synthetic phenotype notice.
- Missing real artifacts fail with `REAL_DATA_UNAVAILABLE`, status 503 and no
  local path in the response.

## Plan comparison

- Planned behavior: one phased trio/region path using 1000 Genomes-style inputs,
  with no claim of real phenotype causality.
- Implemented behavior: the adapter consumes prepared real files and applies an
  explicit synthetic model to observed genotypes.
- Remaining gap: no full public 1000 Genomes download is present in the repo or
  test environment; exact biological crossovers are not inferred.

## Scorecard

1. Code Quality: 7.8/10 — strict adapter and disclosure are good; the migrated
   real-data modules still carry legacy typing/style debt.
2. Code Readability: 7.7/10 — preparation and adapter responsibilities are
   documented; VCF edge-case code is necessarily dense.
3. Implementation Quality: 8.1/10 — real genotype/transmission data reaches the
   common snapshot without changing frontend contracts.
4. Architecture & Design: 8.3/10 — observed evidence and synthetic phenotype
   are explicitly separated.
5. Performance & Optimization: 7.2/10 — extraction is indexed and bounded;
   full-cohort processing is intentionally absent.
6. Security: 7.8/10 — checksum/path/region controls and fail-closed behavior
   exist; downloaded artifact trust still depends on operator verification.
7. Testing Quality: 8.1/10 — fixture integration covers the contract and
   failure behavior; a real downloaded file path is not exercised here.
8. Documentation: 8.0/10 — preparation command and scientific disclosure are
   explicit; licensing/consent operations need a deployment runbook.
9. Scalability: 7.0/10 — bounded indexed slices are practical; no Hail or
   distributed path is included.
10. DevOps Practices: 7.0/10 — raw/prepared data are ignored and manifests are
    checksum-addressed; download automation is not CI-safe by default.
11. User Experience: 8.1/10 — the same screens can show a real-trio disclosure
    without presenting clinical predictions.

Overall: 7.9/10
Maturity: Defensible research MVP for prepared data

## Strengths

- The project does not silently turn missing parent records into homozygous
  reference calls.
- Real mode is visibly and contractually different from a clinical phenotype
  mode.
- The duplicate-manifest preparation bug was fixed by writing one canonical
  manifest location.

## Weaknesses

- The public dataset has no phenotype labels, so this is not real phenotype
  validation.
- A real VCF can produce no usable novelty, which the UI must explain.
- The adapter maps observed phased evidence into a bounded binary internal model.

## Critical fixes

1. Run the preparation command against a licensed, indexed local test slice.
2. Document data licensing and artifact retention policy.
3. Keep “synthetic phenotype” visible in every real-mode result view.

## Five next improvements

1. Add a committed non-sensitive prepared fixture manifest example.
2. Add real VCF parser fuzz/negative tests.
3. Add region/variant-count metrics to ingestion preview.
4. Persist preparation command and tool versions in manifests.
5. Add an optional msprime/tskit research adapter behind the same protocol.
