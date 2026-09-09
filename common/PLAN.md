# Common Plan

## 1. Purpose

This plan prevents the frontend and backend from becoming two separate projects that only meet at the end. The common layer owns:

- API and WebSocket contracts
- shared IDs and vocabulary
- fixture datasets
- event replay formats
- environment conventions
- integration tests
- scientific wording and disclosure rules

## 2. Contract-first workflow

Create packages/contracts as the shared boundary.

```text
packages/contracts/
├── openapi.yaml
├── schemas/
│   ├── common.yaml
│   ├── run.yaml
│   ├── genome.yaml
│   ├── phenotype.yaml
│   ├── trace.yaml
│   ├── counterfactual.yaml
│   └── events.yaml
├── examples/
│   ├── demo-run-request.json
│   ├── demo-snapshot.json
│   ├── demo-timeline.json
│   ├── demo-trace.json
│   └── demo-counterfactual.json
├── generated/
│   └── api.ts
└── README.md
```

The OpenAPI document is the public contract. Backend Pydantic models implement and validate it. Frontend TypeScript types are generated from it. The frontend uses openapi-fetch with those generated types for REST requests, and TanStack Query consumes that typed client for server-state management. Examples are executable fixtures, not documentation-only samples.

The transport split is intentional:

```text
REST snapshots and mutations
  → openapi-fetch
  → TanStack Query

Live simulation events
  → native WebSocket
  → frontend playback store
  → final snapshot invalidation in TanStack Query
```

The common contract does not prescribe Axios. Native fetch remains the underlying HTTP transport.

### Contract rules

1. Every request and response has a schema.
2. Every enum has a documented meaning.
3. IDs are strings and stable across snapshots and events.
4. Fields required for rendering cannot be optional.
5. New fields should be additive whenever possible.
6. Breaking changes require a new schema version or /v2.
7. A fixture must be updated whenever a schema changes.
8. Never expose database columns directly as API fields without deciding their public meaning.

## 3. Shared vocabulary

| Term            | Meaning                                                        |
| --------------- | -------------------------------------------------------------- |
| Parent          | One of the two simulated or observed contributors              |
| Homolog         | One chromosome copy within a parent                            |
| Haplotype       | Ordered allele state along one homolog                         |
| Gamete          | One transmitted haploid product of meiosis                     |
| Crossover       | A modeled exchange boundary between homologs                   |
| Segment         | A contiguous offspring interval with one provenance source     |
| Provenance      | Parent, homolog, interval, and event that explain a segment    |
| Offspring       | The assembled child genome in the experiment                   |
| Phenotype model | Explicit function mapping genome state to a simulated value    |
| Interaction     | A non-additive phenotype term involving multiple loci          |
| Novelty         | Offspring value outside the two-parent envelope                |
| Candidate       | A variant, segment, or interaction considered by Novelty Trace |
| Intervention    | A controlled change used to compute counterfactual evidence    |
| Evidence Graph  | Auditable graph linking inheritance events to model output     |

Avoid using mutation for recombination-derived novelty. Recombination creates a new configuration from existing parental alleles; mutation is a separate optional mode.

## 4. Shared enums

```text
RunMode:
  synthetic
  real_trio_synthetic_phenotype

RunStatus:
  created
  queued
  running
  completed
  failed
  cancelled

Stage:
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

CandidateKind:
  variant
  segment
  interaction

InterventionKind:
  revert_variant
  swap_segment
  break_interaction

BreakpointConfidence:
  exact
  inferred_interval

EventType:
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

## 5. Snapshot contract

The snapshot is the frontend’s authoritative render model after a run.

```json
{
  "schema_version": "1.0",
  "run_id": "run_demo_001",
  "status": "completed",
  "mode": "synthetic",
  "seed": 42,
  "stage": "complete",
  "dataset": {
    "dataset_id": "fixture_epistasis_ab_cd_v1",
    "label": "Synthetic planted epistasis fixture",
    "assembly": "synthetic",
    "disclosure": "All genotype and phenotype values are synthetic."
  },
  "parents": [],
  "offspring": {},
  "crossovers": [],
  "segments": [],
  "phenotypes": {},
  "novelty": {},
  "candidates": [],
  "evidence_graph": {},
  "reproducibility": {
    "seed": 42,
    "model_version": "synthetic_height_like@1.0.0",
    "code_revision": "local",
    "dataset_manifest_version": "fixture@1.0.0"
  }
}
```

The example is intentionally compact here. The committed fixture must contain enough data to render all views without additional scientific inference.

## 6. Event contract

Use a common envelope:

```json
{
  "schema_version": "1.0",
  "event_id": "evt_0042",
  "run_id": "run_demo_001",
  "sequence": 42,
  "type": "candidate_ranked",
  "stage": "candidate_mining",
  "emitted_at": "2026-01-01T00:00:00Z",
  "payload": {
    "candidate_id": "cand_A_B",
    "rank": 1,
    "delta": 21.0
  }
}
```

Event payloads should contain the minimum required for immediate animation. The final snapshot contains complete details.

The frontend must:

- process events in sequence order
- ignore an event already applied
- request a snapshot after a reconnect
- show a non-blocking reconnect state
- handle run_failed

The backend must:

- never reuse an event ID
- preserve sequence order
- persist or reconstruct the timeline
- emit terminal success or failure

## 7. Fixture strategy

Fixtures are the bridge that lets both teams work simultaneously.

### Required fixtures

1. demo-novelty-ab.json
   - offspring outside parental range
   - A×B is the top interaction
   - counterfactual resolves novelty

2. demo-no-novelty.json
   - offspring remains inside parental range
   - trace panel explains that no novelty was detected

3. demo-noisy-ranking.json
   - true interaction ranks highly but not perfectly
   - demonstrates ranking rather than hard-coded highlighting

4. demo-real-trio-manifest.json
   - metadata only
   - points to a prepared local region artifact
   - includes disclosure and checksum

### Fixture requirements

- Valid against the contract.
- Small enough to commit.
- Deterministic.
- Include expected top candidate and expected counterfactual result.
- Include enough events for the complete animation.
- Never include restricted or personally identifying data.

## 8. Data and dataset conventions

### Synthetic data

- Use stable locus labels such as L_A, L_B, L_C, and L_D.
- Keep positions ordered even if the locus names are symbolic.
- Store planted truth separately from the model output.
- Use a seed in every fixture manifest.

### Real data

- Keep raw downloads out of Git.
- Commit only manifest, preparation script, and tiny test slices if licensing and size permit.
- Record assembly, source URL, region, selected samples, and checksum.
- Treat phased genotype values as source data, not as guaranteed biological certainty.
- Use inferred_interval for real crossover localization.
- Always expose the synthetic-phenotype disclosure in the run snapshot.

## 9. Environment contract

### Frontend

```text
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_DATA_MODE=mock
NEXT_PUBLIC_WS_BASE_URL=ws://localhost:8000
```

### Backend

```text
API_ENV=development
API_HOST=0.0.0.0
API_PORT=8000
DATABASE_URL=postgresql://genetic:genetic@localhost:5432/genetic_universe
ARTIFACT_ROOT=./data/prepared
DEFAULT_DATASET_ID=fixture_epistasis_ab_cd_v1
ALLOWED_ORIGINS=http://localhost:3000
```

Do not commit secrets. The local MVP should run with the values above or a documented SQLite/in-memory fallback.

## 10. Integration checkpoints

### Checkpoint 1: contract handshake

Acceptance:

- frontend loads generated types
- backend exposes /health
- fixture request and response validate on both sides

### Checkpoint 2: event handshake

Acceptance:

- frontend can replay the committed timeline
- every event renders a visible state
- event sequence and terminal status are correct

### Checkpoint 3: live synthetic run

Acceptance:

- frontend creates a real run
- backend emits live events
- frontend final state equals backend snapshot

### Checkpoint 4: trace and intervention

Acceptance:

- selected candidate IDs are the same in both systems
- counterfactual request produces a persisted result
- graph and phenotype cards update together

### Checkpoint 5: real-data mode

Acceptance:

- one prepared trio loads
- all source metadata is visible
- synthetic phenotype disclosure is present
- no real clinical conclusion is shown

## 11. Contract and integration testing

Add checks for:

- OpenAPI schema validity.
- Every backend route response matches the schema.
- Every committed fixture validates.
- Generated TypeScript types are up to date.
- Event sequences contain no gaps.
- A mock run and live run produce equivalent final snapshot shapes.
- A counterfactual request is idempotent when supplied the same intervention ID.

The most important cross-stack assertion is:

```text
render(frontend, live_snapshot)
=
render(frontend, fixture_snapshot)
```

The numerical values may differ between fixtures, but the UI should not need a different code path.

## 12. Scientific wording contract

Use:

- simulated phenotype
- computational attribution
- counterfactual evidence
- candidate configuration
- inferred breakpoint interval
- Novelty Evidence Graph
- planted ground truth

Avoid:

- predicted baby trait
- clinical risk
- proof of causality
- exact biological breakpoint in real data
- verified causal chain
- guaranteed biological explanation

## 13. Branch and handoff rules

Recommended work lanes:

- common/contract-v1
- backend/scientific-core
- backend/api
- frontend/shell
- frontend/visualization
- integration/live-run

Handoff artifacts:

- contract change
- fixture update
- example request/response
- backend route or frontend adapter change
- test command and result

Do not merge a contract change without updating:

1. OpenAPI
2. generated frontend types
3. at least one example fixture
4. backend validation
5. frontend mock transport

## 14. Common definition of done

- Both applications can be started independently.
- Frontend mock mode is always available.
- Backend can be tested without a browser.
- The first live integration uses no undocumented fields.
- Synthetic and real-data modes are visibly distinct.
- Reproducibility metadata follows the run through every layer.
- The demo can be reset to a known seed.
- The result language remains scientifically defensible.
