"""Frontend contract; genomic coordinates are 1-based, closed intervals."""
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator, field_validator

EvidenceStatus = Literal["observed", "inferred", "unresolved", "hypothesis"]


def chromosome_name(value: str) -> str:
    value = value.removeprefix("chr")
    return "MT" if value in {"M", "MT"} else value


class Model(BaseModel):
    model_config = ConfigDict(extra="forbid", allow_inf_nan=False)


class Region(Model):
    chromosome: str
    start: int = Field(ge=1)
    end: int = Field(ge=1)

    @field_validator("chromosome")
    @classmethod
    def canonical_chromosome(cls, value: str) -> str:
        value = chromosome_name(value)
        if value not in {str(i) for i in range(1, 23)}:
            raise ValueError("MVP supports diploid autosomes 1-22 only")
        return value

    @model_validator(mode="after")
    def bounded(self):
        if self.end < self.start or self.end - self.start >= 5_000_000:
            raise ValueError("Region must be ordered and at most 5 Mb")
        return self


class Evidence(Model):
    source: str = Field(min_length=1)
    description: str = Field(min_length=1)
    hpo_id: str | None = Field(default=None, pattern=r"^HP:\d{7}$")


class SourceArtifact(Model):
    id: str
    path: str
    sha256: str = Field(pattern=r"^[a-f0-9]{64}$")
    source_url: str
    description: str
    reference_build: Literal["GRCh37", "GRCh38"] | None = None
    region: Region | None = None


class PhaseInput(Model):
    sample_id: str
    raw_sample_id: str
    artifact: SourceArtifact
    identity_source: str
    method: str


class PhenotypeObservation(Model):
    id: str
    sample_id: str
    label: str
    hpo_id: str = Field(pattern=r"^HP:\d{7}$")
    evidence_status: Literal["observed"] = "observed"
    ascertainment: Literal["repository_reported_history"] = "repository_reported_history"
    source_artifact_id: str
    source_locator: str
    linkage_artifact_id: str
    external_individual_id: str
    ontology_artifact_id: str
    mapping_status: Literal["inferred_exact_label_mapping"] = "inferred_exact_label_mapping"
    limitations: list[str]


class SampleInput(Model):
    sample_id: str = Field(min_length=1)
    vcf: str
    sha256: str = Field(pattern=r"^[a-f0-9]{64}$")
    source_url: str = Field(min_length=1)


class Filters(Model):
    min_qual: float = Field(default=20, ge=0)
    min_gq: float = Field(default=20, ge=0)
    min_dp: int = Field(default=5, ge=0)
    require_pass: bool = True
    require_quality_fields: bool = False


class Family(Model):
    family_id: str = Field(pattern=r"^[A-Za-z0-9_.-]+$")
    dataset_kind: Literal["real", "synthetic_validation"] = "real"
    reference_build: Literal["GRCh37", "GRCh38"]
    parent_a: SampleInput
    parent_b: SampleInput
    child: SampleInput
    pedigree: str
    pedigree_sha256: str = Field(pattern=r"^[a-f0-9]{64}$")
    pedigree_source: str = Field(min_length=1)
    regions: list[Region] = Field(min_length=1, max_length=8)
    filters: Filters = Field(default_factory=Filters)
    phenotype_evidence: list[Evidence] = Field(default_factory=list)
    variant_annotations: dict[str, list[Evidence]] = Field(default_factory=dict)
    phase_inputs: list[PhaseInput] = Field(default_factory=list)
    evidence_artifacts: list[SourceArtifact] = Field(default_factory=list)
    phenotype_observations: list[PhenotypeObservation] = Field(default_factory=list)
    recombination_catalog: SourceArtifact | None = None

    @model_validator(mode="after")
    def unique_samples(self):
        if len({self.parent_a.sample_id, self.parent_b.sample_id, self.child.sample_id}) != 3:
            raise ValueError("The three trio sample IDs must be distinct")
        return self


class Provenance(Model):
    computation_id: str
    algorithm: str = "trio-scientific-evidence/2.1.0"
    dataset_kind: str
    family_id: str
    reference_build: str
    region: Region
    filters: Filters
    inputs: list[dict[str, Any]]
    coordinate_system: str = "1-based closed"
    code_sha256: str = ""
    parent_computation_id: str | None = None
    transformation: dict[str, Any] | None = None


class Warning(Model):
    code: str
    message: str
    sample_id: str | None = None
    record: str | None = None


class Genotype(Model):
    sample_id: str
    raw_gt: str | None = None
    alleles: list[str | None] = Field(default_factory=list)
    phased: bool = False
    phase_set: str | None = None
    qual: float | None = None
    gq: float | None = None
    dp: int | None = None
    phase_quality: float | None = None
    junction_quality: float | None = None
    filter: str | None = None
    usable: bool = False
    status: str
    source_record: str | None = None
    evidence_status: EvidenceStatus = "observed"


class PhaseEvidence(Model):
    sample_id: str
    raw_sample_id: str
    raw_gt: str
    alleles: list[str]
    phase_set: str
    source_record: str
    source_artifact_id: str
    method: str
    evidence_status: Literal["observed"] = "observed"
    observation_scope: str = "Phase and PS as reported in source VCF; not directly observed meiosis"
    attachment_status: Literal["inferred"] = "inferred"
    source_genotype: Genotype | None = None
    genotype_concordant: Literal[True] = True
    provenance: list[str]


Origin = Literal["parent_A", "parent_B", "both", "de_novo_candidate", "unknown"]


class Variant(Model):
    id: str
    chromosome: str
    position: int
    reference: str
    alternate: str
    child_genotype: Genotype
    parent_a_genotype: Genotype
    parent_b_genotype: Genotype
    origin: Origin
    status: str
    confidence: float | None = None
    confidence_description: str = "Logical compatibility only; no calibrated probability"
    transmission_pairs: list[list[str]] = Field(default_factory=list)
    inherited_alt_copies: int = 0
    child_specific_genotype: bool | None = None
    segment_ids: list[str] = Field(default_factory=list)
    recombination_event_ids: list[str] = Field(default_factory=list)
    annotations: list[Evidence] = Field(default_factory=list)
    provenance: list[str]
    evidence_status: EvidenceStatus = "observed"
    origin_evidence_status: EvidenceStatus = "inferred"
    phase_evidence: dict[str, PhaseEvidence] = Field(default_factory=dict)
    marker_ids: list[str] = Field(default_factory=list)
    source_annotations: dict[str, str] = Field(default_factory=dict)
    reference_evidence: list[dict[str, Any]] = Field(default_factory=list)


class Marker(Model):
    id: str
    chromosome: str
    start: int
    end: int
    origin: Literal["parent_A", "parent_B"]
    parent_sample: str
    homolog: int | None = None
    phase_set: str | None = None
    status: str
    confidence: float | None = None
    variant_ids: list[str]
    recombination_event_id: str | None = None
    provenance: list[str]
    kind: Literal["point_marker"] = "point_marker"
    evidence_status: Literal["inferred", "hypothesis"] = "inferred"
    coordinate_evidence_status: Literal["observed"] = "observed"

    @model_validator(mode="after")
    def point_only(self):
        if self.start != self.end:
            raise ValueError("Point markers must have start == end")
        return self


class Segment(Model):
    id: str
    chromosome: str
    start: int
    end: int
    origin: Literal["parent_A", "parent_B"]
    parent_sample: str
    homolog: int = Field(ge=0, le=1)
    phase_set: str
    kind: Literal["inferred_haplotype_block"] = "inferred_haplotype_block"
    evidence_status: Literal["inferred", "hypothesis"] = "inferred"
    status: str = "phase_consistent_transmission_span"
    confidence: None = None
    marker_variant_ids: list[str] = Field(min_length=2)
    variant_ids: list[str]
    source_artifact_ids: list[str] = Field(min_length=1)
    provenance: list[str] = Field(min_length=1)
    limitations: list[str] = Field(default_factory=lambda: [
        "Span between informative markers, not base-by-base experimentally observed transmission",
        "Unobserved double crossovers and phasing errors cannot be excluded",
        "Homolog 0/1 labels are local to this source phase set, not grandparent identities"])

    @model_validator(mode="after")
    def supported_span(self):
        if self.start >= self.end or len(set(self.marker_variant_ids)) < 2:
            raise ValueError("An inferred block requires two distinct informative markers and nonzero span")
        return self


class SwitchMarkerEvidence(Model):
    variant_id: str
    chromosome: str
    position: int
    coordinate_evidence_status: Literal["observed"] = "observed"
    genotypes: dict[str, Genotype]
    parental_phase: PhaseEvidence
    child_phase: PhaseEvidence | None = None
    parent_sample: str
    transmitted_allele: str
    transmitted_homolog: int = Field(ge=0, le=1)
    evidence_status: Literal["inferred", "hypothesis"] = "inferred"
    provenance: list[str]


class RecombinationEvent(Model):
    id: str
    chromosome: str
    start: int
    end: int
    parent_sample: str
    left_origin: str
    right_origin: str
    status: Literal["candidate_recombination_interval"] = "candidate_recombination_interval"
    evidence: str = "Unique transmitted alleles switch parental homolog within one PS block; phase/genotype errors remain alternative explanations"
    confidence: None = None
    algorithm: str = "parental-transmission-switch/1.0.0"
    algorithm_parameters: dict[str, int] = Field(default_factory=lambda: {"minimum_markers_per_flank": 2, "maximum_marker_gap_bp": 50000})
    left_flanking_markers: list[SwitchMarkerEvidence] = Field(default_factory=list)
    right_flanking_markers: list[SwitchMarkerEvidence] = Field(default_factory=list)
    sources: list[SourceArtifact] = Field(default_factory=list)
    interval_warnings: list[Warning] = Field(default_factory=list)
    uncertainty: list[str] = Field(default_factory=lambda: [
        "Interval bounded by observed informative markers; exact breakpoint unresolved",
        "Parental homolog IDs are local to the reported phase set, not grandparent identities",
        "Conditional on source parental phase; phasing/genotype error or gene conversion can mimic a switch",
        "Support counts and source GQ/PQ/JQ are not calibrated crossover probabilities",
        "Missing or ambiguous intervening markers are not imputed; undetected switches remain possible",
        "Child supplementary phase includes trio information and is not independent crossover validation"])
    provenance: list[str]
    evidence_status: Literal["inferred", "hypothesis"] = "inferred"
    phase_set: str
    left_homolog: int = Field(ge=0, le=1)
    right_homolog: int = Field(ge=0, le=1)
    left_marker_ids: list[str] = Field(min_length=2)
    right_marker_ids: list[str] = Field(min_length=2)
    source_artifact_ids: list[str] = Field(min_length=1)

    @model_validator(mode="after")
    def supported_interval(self):
        if self.start >= self.end or self.left_homolog == self.right_homolog:
            raise ValueError("Crossover candidates require an interval and different homologs")
        if len(set(self.left_marker_ids)) < 2 or len(set(self.right_marker_ids)) < 2 or not self.provenance:
            raise ValueError("Crossover candidates require distinct flanking markers and provenance")
        if set(self.left_marker_ids) & set(self.right_marker_ids):
            raise ValueError("Crossover candidate flanks must use disjoint markers")
        if self.left_flanking_markers or self.right_flanking_markers or self.sources:
            if len(self.left_flanking_markers) < 2 or len(self.right_flanking_markers) < 2:
                raise ValueError("Source-linked candidates require two explicit flanking markers per side")
            if self.left_flanking_markers[-1].position != self.start or self.right_flanking_markers[0].position != self.end:
                raise ValueError("Candidate interval must be bounded by its nearest flanking markers")
            for flank, homolog, ids in [(self.left_flanking_markers, self.left_homolog, self.left_marker_ids),
                                         (self.right_flanking_markers, self.right_homolog, self.right_marker_ids)]:
                for marker in flank:
                    if (marker.variant_id not in ids or marker.chromosome != self.chromosome
                            or marker.parent_sample != self.parent_sample or marker.transmitted_homolog != homolog
                            or marker.parental_phase.phase_set != self.phase_set
                            or marker.parental_phase.alleles[homolog] != marker.transmitted_allele):
                        raise ValueError("Flanking evidence conflicts with candidate homolog assignment")
        return self


class UnresolvedRegion(Model):
    chromosome: str
    start: int
    end: int
    parent_sample: str
    evidence_status: Literal["unresolved"] = "unresolved"
    reason: str
    provenance: list[str]


class Configuration(Model):
    id: str
    variant_ids: list[str]
    child_genotype: list[str | None]
    parent_a_genotype: list[str | None]
    parent_b_genotype: list[str | None]
    different_from_both_parents: bool
    mendelian_compatible: bool
    evidence_status: EvidenceStatus
    classification: str
    parental_homologs: dict[str, int]
    block_ids: list[str]
    recombination_event_ids: list[str]
    recombination_generated: None = None
    recombination_status: Literal["unresolved"] = "unresolved"
    phenotype_link_status: Literal["unresolved"] = "unresolved"
    novel_phenotype: None = None
    provenance: list[str]
    reference_evidence: list[dict[str, Any]] = Field(default_factory=list)


class ChildState(Model):
    family_id: str
    child_id: str
    reference_build: str
    region: Region
    samples: dict[str, str]
    variants: list[Variant]
    segments: list[Segment]
    markers: list[Marker] = Field(default_factory=list)
    recombination_events: list[RecombinationEvent]
    phenotype_evidence: list[Evidence]
    phenotype_status: str
    phenotype_available: bool = False
    phenotype_observations: list[PhenotypeObservation] = Field(default_factory=list)
    configurations: list[Configuration] = Field(default_factory=list)
    unresolved_regions: list[UnresolvedRegion] = Field(default_factory=list)
    state_status: Literal["observed_with_inferences", "hypothetical"] = "observed_with_inferences"
    inventory_metrics: dict[str, int] = Field(default_factory=dict)
    warnings: list[Warning]
    provenance: Provenance


class TraceRequest(Model):
    family_id: str
    region: Region | None = None
    limit: int = Field(default=50, ge=1, le=500)


class GraphNode(Model):
    id: str
    type: str
    label: str
    provenance: list[str]
    evidence_status: EvidenceStatus


class GraphEdge(Model):
    source: str
    target: str
    relation: str
    provenance: list[str]
    evidence_status: EvidenceStatus


class EvidenceGraph(Model):
    nodes: list[GraphNode]
    links: list[GraphEdge]
    provenance: Provenance


class LineageAttribution(Model):
    parent_a_origin_evidence: dict[str, Any] = Field(default_factory=dict)
    parent_b_origin_evidence: dict[str, Any] = Field(default_factory=dict)
    transmission_type: str = "child_specific_novel_combination"
    candidate_mechanism: str = "Biparental heterozygous assembly of discordant parental alleles"
    supported_homologs: dict[str, int] = Field(default_factory=dict)
    recombination_context: dict[str, Any] = Field(default_factory=dict)
    recommended_counterfactual: dict[str, str] = Field(default_factory=dict)
    attribution_narrative: str = ""


class Candidate(Model):
    rank: int
    configuration: Configuration
    status: str = "configuration_candidate_phenotype_link_unresolved"
    evidence_status: EvidenceStatus = "inferred"
    ranking_evidence: dict[str, int]
    lineage_attribution: LineageAttribution | None = None
    phenotype_score: None = None
    missing_links: list[str]
    provenance: list[str]


class TraceResult(Model):
    family_id: str
    mode: str = "configuration_evidence_only"
    phenotype_status: str
    phenotype_available: bool
    novelty_trace_ready: bool = False
    score: None = None
    score_model: None = None
    ranking_definition: str = "Descending number of source-supported parental homolog assignments, then block associations, then coordinate; evidence ordering only, not phenotype novelty"
    total_candidates: int
    ranked_candidates: list[Candidate]
    graph: EvidenceGraph
    warnings: list[Warning]
    provenance: Provenance
    limitations: list[str]


class CounterfactualRequest(TraceRequest):
    intervention: Literal["REMOVE_VARIANT", "REPLACE_WITH_PARENTAL_GENOTYPE", "REMOVE_SEGMENT", "REPLACE_SEGMENT", "REVERT_RECOMBINATION_CONFIGURATION", "BREAK_INTERACTION"]
    target_id: str
    parent_role: Literal["parent_A", "parent_B"] = "parent_A"


class CounterfactualResult(Model):
    label: str = "COMPUTATIONAL GENOTYPE-STATE INTERVENTION; PHENOTYPE MODEL UNAVAILABLE"
    model_used: None = None
    phenotype_change: None = None
    interpretation: str = "Hypothetical genotype state recomputed with transmission rules; quantitative phenotype effects remain unavailable."

    family_id: str
    intervention: str
    target_id: str
    original_state: ChildState
    counterfactual_state: ChildState
    original_score: None = None
    counterfactual_score: None = None
    delta: None = None
    score_model: None = None
    counterfactual_ready: bool = False
    status: str = "state_intervention_complete_phenotype_model_unavailable"
    explanation: str
    changed_variant_ids: list[str]
    changed_genomic_intervals: list[dict[str, Any]] = Field(default_factory=list)
    parental_origin_consequences: dict[str, Any] = Field(default_factory=dict)
    downstream_structures_affected: dict[str, int] = Field(default_factory=dict)
    reproducibility_hash: str | None = None
    phenotype_effect: None = None
    provenance: Provenance
    intervention_id: str
    evidence: list[str]
    limitations: list[str]


class DatabaseAssociatedPhenotype(Model):
    variant_id: str
    gene_symbol: str | None = None
    molecular_consequence: str | None = None
    clinvar_record_id: str | None = None
    clinical_significance: str | None = None
    condition_names: str | None = None
    review_status: str | None = None
    evidence_status: EvidenceStatus = "hypothesis"
    scope: str = "external_variant_knowledge_not_subject_observation"
    limitations: list[str] = Field(default_factory=lambda: [
        "External variant annotation from public database (ClinVar)",
        "Does not link another individual's clinical diagnosis to this child",
        "Does not constitute molecular proof of pathogenicity in this individual",
    ])


class PhenotypeCategorization(Model):
    family_id: str
    sample_id: str
    phenotype_model_status: Literal["unavailable", "available", "simulated"] = "unavailable"
    reported_phenotypes: list[PhenotypeObservation] = Field(default_factory=list)
    database_associated_phenotypes: list[DatabaseAssociatedPhenotype] = Field(default_factory=list)
    predicted_phenotype: None = None
    unsupported_variant_count: int = 0
    limitations: list[str] = Field(default_factory=list)
    provenance: Provenance


class EpistaticInteractionCandidate(Model):
    id: str
    variant_a_id: str
    variant_b_id: str
    variant_a_pos: int
    variant_b_pos: int
    variant_a_origin: Origin
    variant_b_origin: Origin
    interaction_type: Literal[
        "inter_homolog_biparental_pair",
        "intra_block_cis_pair",
        "recombination_adjacent_pair",
        "general_candidate_pair"
    ]
    genomic_distance_bp: int
    child_genotypes: dict[str, list[str | None]]
    parental_sources: dict[str, str]
    evidence_status: Literal["hypothesis"] = "hypothesis"
    formula_component: str
    ranking_score: float = Field(description="Evidence ranking heuristic based on homolog support, block context, and proximity; not calibrated functional affinity")
    recombination_event_id: str | None = None
    block_ids: list[str] = Field(default_factory=list)
    biological_rationale: str
    missing_links: list[str] = Field(default_factory=lambda: [
        "Wet-lab functional validation (e.g. dual-luciferase or CRISPR combinatorial edit)",
        "Calibrated biochemical binding or regulatory affinity",
        "Expression quantitative trait locus (eQTL) co-regulation data",
    ])
    provenance: list[str]


class InteractionResponse(Model):
    family_id: str
    total_candidates: int
    interaction_type_counts: dict[str, int]
    candidates: list[EpistaticInteractionCandidate]
    warnings: list[Warning]
    provenance: Provenance
    limitations: list[str]


class QuantitativeNoveltyScore(Model):
    parent_a_phenotype: float
    parent_b_phenotype: float
    child_phenotype: float
    parental_min: float
    parental_max: float
    is_transgressive: bool
    novelty_margin: float
    direction: Literal["above_range", "below_range", "within_range"]
    percent_transgression: float


class NoveltyAssessment(Model):
    family_id: str
    phenotype_novelty_status: Literal[
        "unresolved_no_quantitative_phenotype_model",
        "evaluated_quantitative_model"
    ] = "unresolved_no_quantitative_phenotype_model"
    is_transgressive: bool | None = None
    novelty_margin: float | None = None
    direction: Literal["above_range", "below_range", "within_range", "unresolved"] = "unresolved"
    percent_transgression: float | None = None
    quantitative_scores: QuantitativeNoveltyScore | None = None
    genotype_configurations_count: int = 0
    child_specific_configurations_count: int = 0
    candidate_interactions_count: int = 0
    recombination_intervals_count: int = 0
    explanation: str
    limitations: list[str] = Field(default_factory=list)
    provenance: Provenance


class BenchmarkParams(Model):
    level: int = Field(default=4, ge=1, le=8)
    locus_count: int = Field(default=50, ge=10, le=500)
    causal_interactions: int = Field(default=2, ge=1, le=10)
    recombination_rate: float = Field(default=0.08, ge=0.0, le=0.5)
    effect_size: float = Field(default=24.0, ge=0.1)
    noise: float = Field(default=0.0, ge=0.0, le=100.0)
    seed: int = Field(default=42)
    top_k: int = Field(default=3, ge=1, le=20)


class BenchmarkMetrics(Model):
    precision: float
    recall: float
    f1_score: float
    top_k_recovery: bool
    top_1_causal: bool = False
    mean_delta_causal: float
    median_delta_causal: float | None = None
    mean_delta_related: float | None = None
    median_delta_related: float | None = None
    mean_delta_null: float
    median_delta_null: float | None = None
    faithfulness_ratio: float
    median_faithfulness_ratio: float | None = None
    recombination_interval_recovered: bool
    total_candidates_evaluated: int
    classification_counts: dict[str, Any] | None = None
    fraction_causal_gt_null: float | None = None
    directionality_consistent: bool | None = None
    seed: int | None = None
    bootstrap_ci: dict[str, Any] | None = None



class ScalabilityPoint(Model):
    locus_count: int
    duration_ms: float
    peak_memory_kb: float
    candidates_count: int
    f1_score: float


class BenchmarkResult(Model):
    genetic_state: dict[str, Any] = Field(default_factory=dict)
    screened_candidates: list[dict[str, Any]] = Field(default_factory=list)
    benchmark_id: str
    parameters: BenchmarkParams
    metrics: BenchmarkMetrics
    phenotypes: dict[str, Any]
    performance: dict[str, float]
    ranked_top_candidates: list[dict[str, Any]]
    reproducibility_hash: str
    search_accounting: dict[str, Any] = Field(default_factory=dict)


class BaselineMetrics(Model):
    baseline_id: str
    baseline_name: str
    description: str
    precision_at_k: float
    recall_at_k: float
    f1_score: float
    faithfulness_ratio: float
    top_k_recovery: bool
    top_1_causal: bool = False


class BaselineComparisonResult(Model):
    benchmark_id: str
    locus_count: int
    top_k: int
    seed: int
    baselines: list[BaselineMetrics]
    attribution_advantage: dict[str, float]


class BenchmarkDifficultyLevel(Model):
    level: int
    name: str
    description: str
    causal_structure: str
    challenge: str
    locus_count: int = 50
    causal_entities_count: int = 1
    noise_sigma: float = 0.0


class MultiSeedAggregateMetrics(Model):
    metric_name: str
    mean: float
    median: float
    std_dev: float
    min_value: float
    max_value: float
    ci_95_low: float
    ci_95_high: float


class MultiSeedBenchmarkResult(Model):
    seeds_evaluated: list[int]
    locus_count: int
    total_runs: int
    aggregate_metrics: list[MultiSeedAggregateMetrics]
    faithfulness_bootstrap_ci: dict[str, float]
    individual_runs: list[BenchmarkMetrics]


class ScientificAudit(Model):
    family_id: str
    real_data: bool
    phenotype_available: bool
    phenotype_status: str
    phenotype_model_available: bool = False
    recombination_evidence_available: bool = True
    candidate_interactions_count: int = 0
    recombination_evidence: str
    point_markers: int
    inferred_haplotype_blocks: int
    resolved_crossover_events: int = 0
    inferred_crossover_events: int = Field(description="Legacy count alias for candidate recombination intervals; not proven crossovers")
    candidate_recombination_intervals: int = 0
    candidate_interval_ids: list[str] = Field(default_factory=list)
    recombination_algorithm: str = "parental-transmission-switch/1.0.0"
    unresolved_regions: int
    child_specific_configurations: int
    phenotype_linked_configurations: int = 0
    novelty_trace_ready: bool = False
    counterfactual_ready: bool = False
    causal_claim_supported: bool = False
    audit_summary: dict[str, int] = Field(default_factory=dict)
    limitations: list[str]
    provenance: Provenance
