# Backend Plan

## 1. Backend objective

Build a FastAPI scientific API that owns the authoritative experiment state and computation:

```text
parent haplotypes
    → meiosis and crossover provenance
    → gametes
    → offspring genome
    → phenotype
    → novelty detection
    → candidate mining
    → counterfactual attribution
    → Novelty Evidence Graph
```

The backend must be deterministic, inspectable, testable, and usable without the frontend. The browser receives results and events; it does not calculate the scientific answer.

## 2. Backend architecture

Use a modular monolith rather than separate microservices. The modules are independently testable, but the hackathon runs one FastAPI process.

```text
apps/api/
├── pyproject.toml
├── README.md
├── app/
│   ├── main.py
│   ├── settings.py
│   ├── api/
│   │   ├── router.py
│   │   ├── dependencies.py
│   │   └── v1/
│   │       ├── health.py
│   │       ├── datasets.py
│   │       ├── runs.py
│   │       ├── trace.py
│   │       └── counterfactuals.py
│   ├── schemas/
│   │   ├── common.py
│   │   ├── run.py
│   │   ├── genome.py
│   │   ├── events.py
│   │   ├── trace.py
│   │   └── errors.py
│   ├── domain/
│   │   ├── identifiers.py
│   │   ├── genome.py
│   │   ├── provenance.py
│   │   ├── phenotype.py
│   │   ├── novelty.py
│   │   ├── interventions.py
│   │   └── evidence_graph.py
│   ├── scientific/
│   │   ├── meiosis/
│   │   │   ├── protocol.py
│   │   │   ├── custom_engine.py
│   │   │   └── msprime_adapter.py
│   │   ├── phenotype/
│   │   │   ├── evaluator.py
│   │   │   └── models.py
│   │   ├── novelty_trace/
│   │   │   ├── detector.py
│   │   │   ├── candidates.py
│   │   │   ├── ranking.py
│   │   │   └── counterfactuals.py
│   │   └── evaluation/
│   │       ├── planted_truth.py
│   │       └── metrics.py
│   ├── orchestration/
│   │   ├── run_service.py
│   │   ├── event_bus.py
│   │   └── pipeline.py
│   ├── ingestion/
│   │   ├── synthetic.py
│   │   ├── vcf.py
│   │   ├── pedigree.py
│   │   └── region_slice.py
│   ├── repositories/
│   │   ├── interfaces.py
│   │   ├── memory.py
│   │   └── postgres.py
│   └── infrastructure/
│       ├── database.py
│       ├── artifacts.py
│       └── logging.py
└── tests/
    ├── unit/
    ├── integration/
    ├── contract/
    └── property/
```

## 3. Layer responsibilities

### API layer

- Validate incoming requests with Pydantic.
- Translate API requests into application service calls.
- Return contract-shaped responses only.
- Never contain crossover, phenotype, or attribution mathematics.
- Apply CORS, request IDs, structured errors, and API versioning.

### Orchestration layer

- Create and update run state.
- Coordinate the scientific pipeline.
- Emit ordered events.
- Persist snapshots and artifacts.
- Keep the in-process execution path simple for the MVP.

### Domain layer

- Hold small, dependency-light data models and invariants.
- Contain no FastAPI or database imports.
- Represent provenance explicitly rather than deriving it in the UI.

### Scientific layer

- Implement pure functions wherever possible.
- Accept explicit input state and RNG state.
- Return data plus traceable metadata.
- Keep the custom simulator behind a protocol so another simulator can be added later.

### Repository layer

- Expose interfaces such as RunRepository, ArtifactRepository, and DatasetRepository.
- Provide an in-memory adapter for tests and a PostgreSQL adapter for the demo.
- Keep VCF and large arrays in artifact files, not one SQL row per variant.

## 4. Domain model

### Identifiers

Use stable string IDs in the API. IDs must be unique within a run and easy to inspect in logs.

```text
run_id          run_01J...
sample_id       sample_parent_a
chromosome_id   chr22
locus_id        chr22:10583
haplotype_id    hap_parent_a_1
segment_id      seg_0007
crossover_id    xo_0003
term_id         epistasis_A_B
candidate_id    cand_A_B
intervention_id int_001
event_id        evt_0042
```

### Genome state

Minimum fields:

```text
Genome
  genome_id
  sample_id
  role: parent_a | parent_b | offspring
  assembly: GRCh38 or synthetic
  chromosomes[]

Chromosome
  chromosome_id
  length
  loci[]

Locus
  locus_id
  chromosome_id
  position
  ref
  alt
  label
  allele_values

Haplotype
  haplotype_id
  sample_id
  homolog_index: 1 | 2
  chromosome_id
  alleles[]
```

For the synthetic engine, allele values can be 0 and 1. For VCF-backed mode, preserve allele strings and maintain a normalized numeric encoding for the phenotype model.

### Provenance state

Every offspring segment must carry:

```text
SegmentProvenance
  segment_id
  offspring_chromosome
  start_locus_index
  end_locus_index
  source_parent
  source_haplotype_id
  source_homolog_index
  created_by_crossover_id
  confidence: exact | inferred_interval
```

Synthetic runs may use exact crossover coordinates. Real-data runs should use marker-bounded intervals and set confidence to inferred_interval.

### Phenotype model

Represent the phenotype model as data, not hard-coded branches.

```text
PhenotypeModel
  model_id
  model_version
  trait_name
  additive_terms[]
  dominance_terms[]
  epistasis_terms[]
  noise
  planted_truth[]
```

The MVP model should support:

- additive terms: coefficient × allele/dosage
- dominance terms: coefficient × heterozygosity indicator
- pairwise epistasis: coefficient × active interaction predicate
- optional seeded noise, defaulting to zero for the first demo

Example:

```json
{
  "model_id": "synthetic_height_like",
  "model_version": "1.0.0",
  "trait_name": "simulated_trait",
  "additive_terms": [
    { "term_id": "A", "locus_id": "L_A", "coefficient": 2.0 },
    { "term_id": "B", "locus_id": "L_B", "coefficient": 3.0 }
  ],
  "epistasis_terms": [
    {
      "term_id": "A_x_B",
      "left_locus": "L_A",
      "right_locus": "L_B",
      "coefficient": 8.0
    }
  ],
  "noise": { "distribution": "none", "seed": 0 }
}
```

## 5. Scientific pipeline

### Step 1: validate input

- Confirm both parents have two homologous haplotypes.
- Confirm locus order is strictly increasing within a chromosome.
- Confirm all referenced phenotype loci exist.
- Confirm the seed and model version are present.
- Reject malformed phased genotypes instead of silently repairing them.

### Step 2: simulate meiosis

Implement a transparent custom engine first.

Inputs:

- two ordered homologous haplotypes
- chromosome length or locus count
- crossover rate or explicit crossover plan
- seeded random generator

Outputs:

- transmitted gamete
- sorted crossover records
- contiguous segment provenance
- event payloads for animation

Rules:

- Choose a starting homolog using the seeded RNG.
- Sample zero or more valid crossover boundaries.
- Alternate homolog source at each boundary.
- Preserve half-open segment intervals [start, end).
- Do not mutate alleles in the MVP unless a mutation mode is explicitly enabled.
- Make the crossover plan inspectable in the response.

Use a protocol:

```text
MeiosisEngine.simulate(parent_haplotypes, chromosome_config, rng) -> GameteResult
```

The future msprime/tskit implementation must map back into the same GameteResult and provenance contract.

### Step 3: fertilization

- Select one gamete from each parent.
- Assemble offspring chromosomes.
- Attach source-parent and source-haplotype provenance to every segment.
- Validate Mendelian consistency when mutation is disabled.
- Emit a fertilization_complete event containing summary data, not giant arrays.

### Step 4: phenotype evaluation

Calculate:

```text
y = additive contribution
  + dominance contribution
  + epistasis contribution
  + optional noise
```

Return a contribution ledger:

```text
PhenotypeResult
  value
  contributions[]
    term_id
    term_type
    loci[]
    value
    active
  model_id
  model_version
```

The contribution ledger is the source for the frontend waterfall and evidence graph.

### Step 5: novelty detection

Use the parental envelope:

```text
lower = min(parent_a_value, parent_b_value)
upper = max(parent_a_value, parent_b_value)
is_novel = offspring_value < lower or offspring_value > upper
margin = distance from nearest boundary when novel
```

Do not call this biological proof of transgressive segregation. In the UI and API, use outside_parental_range or phenotypic_novelty.

### Step 6: candidate mining

Generate a bounded candidate set from:

1. Differential offspring loci.
2. Recombined segments that differ from both parental haplotype paths.
3. Active phenotype terms involving offspring-specific configurations.
4. Planted truth only for benchmark metadata, never for production ranking.

Candidate records must include:

- candidate ID
- kind: variant, segment, interaction
- involved loci
- source parent/haplotype
- crossover IDs or intervals
- baseline contribution
- reason for inclusion

Limit the candidate count with configuration such as max_candidates. The initial engine may test single candidates and explicitly listed interactions; it must not claim arbitrary subset search is linear.

### Step 7: counterfactual attribution

Supported intervention kinds:

- revert_variant: replace a child allele with a selected parental/reference state
- swap_segment: replace a child segment with a selected source segment
- break_interaction: disable one phenotype interaction term while keeping genotype fixed

For each intervention:

```text
counterfactual_value = evaluate(intervened_genome, intervened_model)
delta = original_value - counterfactual_value
novelty_resolved = counterfactual_value inside parental envelope
```

Return both the numerical result and an explanation of what changed. Use counterfactual evidence in all product language.

### Step 8: evidence graph

Build a graph with typed nodes:

- parent
- homolog
- meiosis
- crossover
- segment
- locus
- interaction
- phenotype
- intervention

Typed edges:

- has_homolog
- participated_in_meiosis
- created_segment
- transmitted_to
- contains_locus
- interacts_with
- contributes_to
- tested_by
- changed_value

Serialize graph nodes and edges into stable JSON. The frontend can lay out the graph without knowing the Python graph implementation.

## 6. API plan

All endpoints are under /v1.

| Method | Endpoint                       | Purpose                                                       |
| ------ | ------------------------------ | ------------------------------------------------------------- |
| GET    | /health                        | Process and dependency health                                 |
| GET    | /datasets                      | Available synthetic fixtures and prepared real-data manifests |
| POST   | /runs                          | Validate configuration and create a run                       |
| GET    | /runs/{run_id}                 | Current run status and summary                                |
| POST   | /runs/{run_id}/start           | Start or resume a run                                         |
| GET    | /runs/{run_id}/snapshot        | Full renderable run snapshot                                  |
| GET    | /runs/{run_id}/timeline        | Ordered event timeline for replay                             |
| WS     | /runs/{run_id}/events          | Live event stream                                             |
| POST   | /runs/{run_id}/trace           | Run or rerun Novelty Trace                                    |
| GET    | /runs/{run_id}/trace           | Ranked candidates and graph                                   |
| POST   | /runs/{run_id}/counterfactuals | Execute one or more interventions                             |
| GET    | /runs/{run_id}/counterfactuals | List saved interventions                                      |
| POST   | /ingestion/preview             | Validate a prepared VCF/pedigree manifest                     |

### Create run request

```json
{
  "mode": "synthetic",
  "dataset_id": "fixture_epistasis_ab_cd_v1",
  "seed": 42,
  "phenotype_model_id": "synthetic_height_like",
  "options": {
    "locus_count": 40,
    "max_candidates": 25,
    "include_noise": false
  }
}
```

### Run status response

```json
{
  "run_id": "run_demo_001",
  "status": "completed",
  "mode": "synthetic",
  "seed": 42,
  "stage": "evidence_graph_ready",
  "progress": 1.0,
  "parent_phenotypes": { "parent_a": 42.0, "parent_b": 51.0 },
  "offspring_phenotype": 73.0,
  "novelty": {
    "outside_parental_range": true,
    "lower": 42.0,
    "upper": 51.0,
    "margin": 22.0
  },
  "model_version": "synthetic_height_like@1.0.0"
}
```

### Error envelope

Every error uses the same shape:

```json
{
  "error": {
    "code": "INVALID_RUN_CONFIGURATION",
    "message": "The phenotype model references an unknown locus.",
    "request_id": "req_001",
    "details": {
      "locus_id": "L_UNKNOWN"
    },
    "retryable": false
  }
}
```

Never expose Python tracebacks or filesystem paths to the browser.

## 7. WebSocket event protocol

Every event uses this envelope:

```json
{
  "schema_version": "1.0",
  "event_id": "evt_0042",
  "run_id": "run_demo_001",
  "sequence": 42,
  "type": "crossover_detected",
  "stage": "meiosis",
  "emitted_at": "2026-01-01T00:00:00Z",
  "payload": {}
}
```

Required event types:

```text
run_created
stage_started
parent_loaded
crossover_detected
gamete_segment_created
fertilization_complete
phenotype_computed
novelty_detected
candidate_set_ready
candidate_ranked
counterfactual_completed
evidence_graph_ready
run_completed
run_failed
```

Rules:

- sequence is strictly increasing per run.
- Events are replayable from the persisted timeline.
- Payloads remain small; large arrays are fetched from a snapshot endpoint.
- The frontend must tolerate duplicate events and reconnect by requesting events after the last sequence.
- A completed run always emits run_completed, even if no novelty is found.

## 8. Persistence and artifacts

### PostgreSQL metadata

Store:

- runs and configuration
- model and dataset references
- status and timestamps
- seed and code revision
- compact phenotype summaries
- candidates and rankings
- counterfactual summaries
- evidence graph JSON
- event timeline or event artifact reference

Do not store one SQL row per allele for large data.

### Filesystem artifacts

Store outside Git:

- raw VCF/BCF files
- tabix indexes
- prepared region slices
- serialized tree sequences if added later
- large run snapshots
- benchmark output tables

Every artifact gets a manifest entry with:

- logical ID
- source URL
- assembly
- chromosome/region
- file checksum
- preparation command/version
- license or usage note

## 9. Real-data ingestion plan

Start with a prepared chr22 region and one pedigree-listed trio. Do not download or parse the entire 3,202-sample file during the live demo.

Pipeline:

1. Download the phased chr22 VCF and .tbi index once.
2. Download the pedigree file.
3. Select a trio with two parents and one child.
4. Use tabix/BCFtools to extract a small region.
5. Parse the region with cyvcf2.
6. Confirm phased GT fields use the expected separator.
7. Validate child alleles against parental alleles when mutation is disabled.
8. Convert the selected region into the internal Genome and Provenance models.
9. Apply a clearly labeled synthetic phenotype model.
10. Store the preparation manifest and checksum.

Real-data mode must show a disclosure:

“Genotypes and inheritance relationships are real public data. Phenotype values and interaction rules are synthetic for method validation.”

## 10. Scientific and API testing

### Unit tests

- crossover segmentation
- homolog switching
- gamete assembly
- Mendelian validation
- phenotype term evaluation
- novelty boundary logic
- candidate generation
- intervention deltas
- evidence graph serialization

### Property-based tests

- no child allele comes from nowhere when mutation is disabled
- every child segment has exactly one source parent and source homolog
- segment intervals are ordered, non-overlapping, and cover the chromosome
- replaying a seed gives the same logical crossover plan
- breaking a planted interaction removes its contribution

### Integration tests

- create synthetic run
- start run
- consume all events
- fetch final snapshot
- request trace
- run counterfactual
- verify event sequence and final state

### Benchmark tests

Report:

- planted interaction top-1 and top-k recovery
- false positive rate on null interactions
- delta separation between causal and null candidates
- novelty resolution rate after true intervention
- seed reproducibility
- runtime for 20, 100, and 1,000 loci

Treat 90% recovery as a target until measured. Do not present it as an existing result.

## 11. Backend implementation order

### B0 — foundation

- Create Python project and environment.
- Add settings, logging, request IDs, and health route.
- Add in-memory repository.
- Add contract examples and a fixture-backed run service.

### B1 — domain and simulation

- Implement genome, haplotype, segment, and provenance models.
- Implement seeded crossover engine.
- Implement gamete and offspring assembly.
- Emit timeline events.

### B2 — phenotype and novelty

- Implement data-driven phenotype model.
- Add contribution ledger.
- Add parental envelope and novelty margin.
- Add planted ground-truth metadata.

### B3 — trace and counterfactuals

- Implement candidate mining and ranking.
- Implement three intervention types.
- Implement evidence graph.
- Add trace and counterfactual endpoints.

### B4 — persistence and live transport

- Add PostgreSQL repository.
- Add run snapshots and event replay.
- Add WebSocket connection management and reconnect support.

### B5 — real-data adapter

- Add manifest validation.
- Add pedigree selection.
- Add VCF region parsing.
- Add real-genome mode with synthetic phenotype disclosure.

### B6 — hardening

- Add contract, property, integration, and benchmark tests.
- Add structured failure modes.
- Document local setup and demo reset.

## 12. Backend definition of done

- The API can run a complete synthetic experiment from a clean environment.
- Scientific modules can be tested without FastAPI.
- All output has a seed, model version, dataset ID, and code revision.
- The final snapshot is sufficient for the frontend to render the run without reconstructing science.
- WebSocket events can be replayed from the timeline.
- Counterfactual results are persisted and auditable.
- Real-data ingestion never silently converts uncertain breakpoints into exact breakpoints.
