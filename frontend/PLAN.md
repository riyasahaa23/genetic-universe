# Frontend Plan

## 1. Frontend objective

Build a visually compelling, scientifically honest research interface that lets a user see:

```text
parents
  → meiosis
  → crossover provenance
  → offspring
  → phenotype novelty
  → Novelty Trace
  → counterfactual evidence
```

The frontend is a renderer and interaction layer. It must never calculate the authoritative phenotype, infer causality, or invent provenance. It receives typed snapshots and events from the API or the identical mock transport.

## 2. Frontend architecture

The existing apps/web Next.js app becomes the product shell.

```text
apps/web/src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── globals.css
│   ├── experiment/
│   │   └── page.tsx
│   └── history/
│       └── page.tsx
├── components/
│   ├── app-shell/
│   ├── controls/
│   ├── data-display/
│   ├── feedback/
│   └── visualization/
├── features/
│   ├── experiment-setup/
│   ├── simulation-stage/
│   ├── genome-tracks/
│   ├── phenotype-summary/
│   ├── novelty-trace/
│   ├── counterfactual-lab/
│   └── evidence-graph/
├── lib/
│   ├── api/
│   │   ├── client.ts
│   │   ├── live-transport.ts
│   │   └── mock-transport.ts
│   ├── contracts/
│   ├── formatters/
│   ├── visualization/
│   └── validation/
├── store/
│   ├── run-store.ts
│   ├── playback-store.ts
│   └── ui-store.ts
└── styles/
    ├── tokens.css
    └── visualization.css
```

Use feature folders so the page does not become one giant component. Keep the 3D scene, genome tracks, graph, and controls independently testable.

## 3. Route and screen plan

### /

Purpose:

- communicate the research question
- offer “Start synthetic experiment”
- offer “Load real trio mode”
- explain the computational-only guardrail

Primary actions:

- Start demo
- Explore how Novelty Trace works
- Open a previous run if history is enabled

### /experiment

The primary hackathon screen. It should support these visual stages:

1. Setup
2. Parents
3. Meiosis
4. Offspring
5. Phenotype
6. Novelty
7. Trace
8. Counterfactual
9. Evidence

The user should be able to skip animation and jump to a stage after the run completes.

### /history

Optional for the MVP. Show saved run cards with:

- run ID
- mode
- seed
- phenotype values
- novelty status
- model version
- date

Do not build a full account system for the hackathon.

## 4. Main workspace layout

```text
┌─────────────────────────────────────────────────────────────┐
│ Header: Genetic Universe | run status | seed | reset        │
├───────────────┬───────────────────────────────┬─────────────┤
│ Parent A      │                               │ Parent B    │
│ haplotypes    │  3D Universe / event stage    │ haplotypes  │
│ phenotype     │  chromosomes and animation    │ phenotype   │
├───────────────┴───────────────────────────────┴─────────────┤
│ Timeline / scrubber / current event                         │
├───────────────────────────────┬─────────────────────────────┤
│ Genome tracks and provenance   │ Novelty Trace / controls     │
├───────────────────────────────┴─────────────────────────────┤
│ Evidence graph or counterfactual result                      │
└─────────────────────────────────────────────────────────────┘
```

On narrow screens, stack the three regions vertically. The demo layout should remain usable without requiring a 3D view.

## 5. Client data architecture

### Contract types

Consume generated TypeScript types from packages/contracts. Do not duplicate API interfaces inside feature components.

### REST API client

Use openapi-fetch with the generated OpenAPI types as the typed transport layer. Wrap it in a small application client so feature code does not know about base URLs or raw response handling.

The wrapper must provide:

- base URL from NEXT_PUBLIC_API_BASE_URL
- request timeout and cancellation
- normalized error handling
- request ID capture for debugging
- consistent handling of successful and error responses
- mock and live implementations behind the same transport interface

Do not add Axios unless a later requirement specifically needs Axios-only middleware or adapter behavior. Native fetch remains the underlying transport.

### Server state

Use TanStack Query for REST server state. Configure one QueryClientProvider at the application root and organize query keys by resource.

Use queries for:

- dataset list
- run snapshot
- trace result
- counterfactual history

Use mutations for:

- creating a run
- starting or restarting a run
- requesting Novelty Trace
- executing a counterfactual

After a successful counterfactual, invalidate the affected run snapshot, trace, and counterfactual-history queries. After a live run reaches completion, invalidate or refetch the final snapshot instead of manually reconstructing it from animation events.

Suggested query-key shape:

```text
["datasets"]
["runs", runId]
["runs", runId, "snapshot"]
["runs", runId, "timeline"]
["runs", runId, "trace"]
["runs", runId, "counterfactuals"]
```

TanStack Query owns remote data lifecycle. It does not own the high-frequency animation timeline.

### Local UI state

Keep only ephemeral state locally:

- current stage
- selected segment/locus/candidate
- playback position
- graph focus
- panel visibility
- whether the reduced-motion mode is active

The frontend should not store a second mutable copy of the scientific genome. Local state is only for presentation and interaction.

### WebSocket events and playback

Use the native WebSocket API through a custom useRunEvents hook. The hook should:

- open and close the connection for the active run
- track the last applied event sequence
- ignore duplicate events
- dispatch events to playback-store
- expose connection and reconnect status
- invalidate the final TanStack Query snapshot when run_completed arrives

Keep event playback state outside TanStack Query. This avoids using the server cache as a frame-by-frame animation buffer.

### Run transport interface

Both live and mock implementations must satisfy:

```text
createRun(config) -> RunCreated
startRun(runId) -> RunStatus
subscribeToEvents(runId, onEvent) -> unsubscribe
getSnapshot(runId) -> RunSnapshot
getTrace(runId) -> TraceResult
runCounterfactual(runId, request) -> CounterfactualResult
```

The mock transport uses the typed client shape and replays packages/contracts/examples/demo-timeline.json with configurable speed. The live transport uses openapi-fetch for REST and native WebSocket for events.

## 6. Feature plans

### Experiment setup

Inputs:

- mode: synthetic or real-trio
- dataset
- seed
- locus count or region
- phenotype model
- optional noise toggle
- maximum candidates

Defaults should produce a successful demo immediately. Advanced settings can be collapsed.

Validation:

- seed must be an integer
- locus count must stay within the MVP range
- real mode must show its disclosure text
- the frontend should not allow options the backend does not advertise

### Simulation stage

Responsibilities:

- subscribe to ordered events
- map events to visual states
- animate only the current event and nearby context
- allow pause, resume, replay, and skip
- keep a textual event log for accessibility and debugging

Event-to-visual mapping:

| Event                    | Visual response                                |
| ------------------------ | ---------------------------------------------- |
| parent_loaded            | reveal parent haplotype tracks                 |
| crossover_detected       | draw breakpoint and pulse the affected segment |
| gamete_segment_created   | move colored segment into a gamete             |
| fertilization_complete   | assemble offspring chromosome                  |
| phenotype_computed       | update phenotype cards and contribution bars   |
| novelty_detected         | show boundary escape state                     |
| candidate_ranked         | highlight candidate loci and interaction edges |
| counterfactual_completed | animate original value to counterfactual value |
| evidence_graph_ready     | reveal graph and explanation summary           |

### 3D Genetic Universe

Use React Three Fiber for abstract chromosome segments, not individual base pairs.

Rules:

- Render a maximum of a few hundred visual objects.
- Use one color family per parent and a distinct highlight for the offspring.
- Render homologs as parallel strands or rails.
- Represent crossover with a visible break/bridge marker.
- Use stable IDs for Three.js keys.
- Use camera presets: overview, meiosis, offspring, trace.
- Provide a 2D fallback panel with the same information.
- Respect prefers-reduced-motion.

The 3D scene is narrative. Scientific values come from the 2D tracks and cards.

### Genome tracks

Render:

- chromosome/locus axis
- parent homolog tracks
- offspring inherited segments
- crossover intervals
- selected candidate loci
- active epistatic pair

Use SVG or a lightweight canvas layer for exact alignment. D3 may calculate scales and paths, but React owns selection and lifecycle.

The track must support:

- hover tooltip
- click to select
- keyboard focus
- zoom only if it helps the demo
- visible legend

### Phenotype summary

Display:

- Parent A value
- Parent B value
- Offspring value
- parental envelope
- novelty margin
- contribution waterfall

Use explicit labels such as:

- “Simulated phenotype”
- “Outside parental range”
- “Model contribution”

Avoid “medical risk,” “diagnosis,” or “predicted child trait.”

### Novelty Trace panel

The primary research UI.

Display ranked candidates with:

- rank
- candidate type
- involved loci
- parent/homolog provenance
- crossover interval
- contribution
- counterfactual delta
- confidence/strength label

Interactions:

- select candidate
- focus corresponding segment in 3D and tracks
- open explanation drawer
- run counterfactual
- compare candidates

The top explanation should be understandable in one sentence:

“The L_A × L_B configuration contributed +21.0 model units and was assembled from Parent A homolog 2 and Parent B homolog 1.”

### Counterfactual Lab

Controls:

- break interaction
- revert allele
- swap segment
- run intervention
- reset to original state

Results:

- original phenotype
- counterfactual phenotype
- delta
- whether novelty remains
- intervention description
- affected nodes in the evidence graph

Use counterfactual evidence, not proof.

### Evidence Graph

Render a small graph, preferably with SVG/D3 for predictable layout.

Minimum view:

```text
Parent A → Homolog A2 → Crossover → Segment S17
                                      ↓
                                  Locus A
                                      ↘
                                     A×B → Phenotype novelty
                                      ↗
                                  Locus B
                                      ↑
Parent B → Homolog B1 ────────────────┘
```

Features:

- hover node to show metadata
- click node to focus related track/3D segment
- show edge labels
- show intervention impact
- provide a text explanation below the graph

Do not call the graph a biological causal DAG. Call it an evidence or attribution graph.

## 7. Visual system

### Color semantics

- Parent A: warm amber
- Parent B: cool cyan
- Offspring: violet or white with mixed provenance
- Crossover: bright yellow marker
- Candidate: magenta highlight
- Counterfactual: green for novelty reduced, red for novelty increased
- Uncertain real-data interval: striped or dashed treatment

Color must never be the only meaning. Pair it with labels, patterns, icons, or line styles.

### Typography and layout

- Use a dark space-like canvas only where it improves the universe metaphor.
- Keep analysis panels high-contrast and calm.
- Prefer compact cards with one metric and one explanation.
- Keep the current stage and run status visible at all times.

### Motion

- Animate state changes, not every data point.
- Keep event transitions short.
- Pause motion when the user opens an explanation.
- Support reduced motion and a “jump to result” action.

## 8. Error, loading, and empty states

Implement these before polish:

- backend unavailable
- WebSocket disconnected
- run failed
- invalid dataset
- no novelty detected
- no candidate passes threshold
- counterfactual failed
- real region still loading
- reduced-motion mode

Every loading state needs:

- current stage
- progress or indeterminate status
- cancel/reset action
- a useful human-readable message

## 9. Frontend testing

### Unit tests

- formatters for loci, deltas, and intervals
- event reducer/state transitions
- candidate ranking display
- stage derivation from run status
- error normalization

### Component tests

- setup form validation
- phenotype summary
- candidate row selection
- counterfactual result
- graph node selection

### Integration tests

- mock run from start to finish
- event replay updates visual state
- selecting a candidate highlights all linked views
- counterfactual result updates cards and graph
- live transport can be swapped for mock transport without component changes

### Browser smoke test

The demo path must work:

```text
open app
→ click Start synthetic experiment
→ watch or skip meiosis
→ see offspring novelty
→ click Trace Novelty
→ select A×B
→ run Break Interaction
→ see phenotype delta
```

## 10. Frontend implementation order

### F0 — replace starter page

- Create app shell and design tokens.
- Add route structure.
- Remove starter Next.js content.
- Add mock-mode banner and run reset.

### F1 — contract and mock transport

- Add generated contract types.
- Add typed API adapter.
- Add fixture timeline and snapshot.
- Render static parent/offspring cards.

### F2 — live simulation canvas

- Add 3D scene shell.
- Add event-driven playback.
- Add 2D genome tracks.
- Add timeline controls.

### F3 — phenotype and novelty

- Add phenotype cards, range band, and contribution waterfall.
- Add novelty state and candidate list.
- Connect selection across tracks and scene.

### F4 — attribution and counterfactual

- Add evidence graph.
- Add intervention controls.
- Add delta comparison and explanation drawer.

### F5 — real-data mode

- Add dataset picker from API.
- Add trio/region metadata.
- Add uncertainty styling and disclosure copy.

### F6 — polish

- Add loading/error states.
- Add accessibility and reduced motion.
- Add responsive layout.
- Add demo reset and replay.

## 11. Frontend definition of done

- The app is useful in mock mode without the backend.
- Live mode uses the same components and the same contract types.
- No scientific value is computed only in React.
- Every selected candidate highlights its provenance consistently in the scene, tracks, panel, and graph.
- The user can complete the demo in under two minutes.
- The user can skip animation and inspect the final result.
- The UI clearly distinguishes synthetic phenotype values from real genotype data.
- The app has a usable keyboard and reduced-motion path.
