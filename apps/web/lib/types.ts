/**
 * TypeScript definitions for Genetic Universe -> Offspring Universe.
 */

export interface SegmentProvenance {
  start: number;
  end: number;
  source_homolog: string;
  parent_id: string;
}

export interface GameteData {
  parent_id: string;
  alleles: number[];
  crossovers: number[];
  segments: SegmentProvenance[];
}

export interface LocusProvenance {
  locus_id: string;
  position: number;
  allele_a: number;
  source_parent_a: string;
  source_homolog_a: string;
  crossover_interval_a: string;
  allele_b: number;
  source_parent_b: string;
  source_homolog_b: string;
  crossover_interval_b: string;
  genotype_dosage: number;
}

export interface ParentGenomeData {
  parent_id: string;
  haplotypes: {
    [key: string]: number[];
  };
  dosage: number[];
  locus_count: number;
}

export interface OffspringData {
  offspring_id: string;
  maternal_or_parent_a: number[];
  paternal_or_parent_b: number[];
  dosage: number[];
  provenance: LocusProvenance[];
}

export interface PhenotypeBreakdown {
  total: number;
  base_value: number;
  additive_component: number;
  dominance_component: number;
  epistatic_component: number;
  additive_details: Record<string, number>;
  dominance_details: Record<string, number>;
  epistatic_details: Record<string, number>;
  formula_expression: string;
}

export interface NoveltyAssessment {
  parent_a: number;
  parent_b: number;
  offspring: number;
  parental_min: number;
  parental_max: number;
  is_transgressive: boolean;
  novelty_margin: number;
  direction: string;
  percent_transgression: number;
}

export interface CounterfactualResult {
  candidate_id: string;
  candidate_name: string;
  candidate_type: "INTERACTION" | "SEGMENT" | "VARIANT";
  intervention: string;
  original_phenotype: number;
  counterfactual_phenotype: number;
  delta: number;
  absolute_effect: number;
  novelty_removed: boolean;
  new_novelty_margin: number;
  stability: number;
  provenance_score: number;
  attribution_score: number;
  score_components: {
    normalized_effect: number;
    stability: number;
    provenance: number;
  };
  provenance_summary: string;
  baseline_phenotype?: number;
  phenotype_after_a?: number;
  phenotype_after_b?: number;
  phenotype_after_ab?: number;
  delta_a?: number;
  delta_b?: number;
  delta_ab?: number;
  interaction_contrast?: number;
  epistatic_excess?: number;
  interaction_edge_delta?: number;
  novelty_removed_a?: boolean;
  novelty_removed_b?: boolean;
  novelty_removed_ab?: boolean;
  parental_envelope?: { min: number; max: number };
  synergy_direction?:
    | "positive_synergy"
    | "approximately_additive"
    | "antagonistic_nonpositive_synergy";
  provenance?: Record<string, unknown>;
}

export interface MeioticNullResult {
  experiment_id: string;
  observed_phenotype: number;
  parent_a_phenotype: number;
  parent_b_phenotype: number;
  parental_envelope: { min: number; max: number };
  null_count: number;
  null_mean: number;
  null_std: number;
  null_median: number;
  null_min: number;
  null_max: number;
  quantiles: Record<string, number>;
  observed_percentile: number;
  transgression_direction: "above" | "below" | "not_transgressive";
  empirical_tail_probability: number | null;
  extreme_count: number | null;
  fraction_null_transgressive: number;
  fraction_null_above_envelope: number;
  fraction_null_below_envelope: number;
  seed: number;
  simulation_count: number;
  histogram_bins: number[];
  histogram_counts: number[];
}

export interface MinimalRescueSet {
  candidate_ids: string[];
  candidate_types: string[];
  candidate_names: string[];
  counterfactual_phenotype: number;
  joint_delta: number;
  novelty_removed: boolean;
  inside_parental_envelope: boolean;
  envelope_position: string;
  member_attribution_scores: Record<string, number>;
  mean_attribution_score: number;
  provenance_summary: string[];
  member_provenance: Array<Record<string, unknown>>;
  contains_variant: boolean;
  contains_segment: boolean;
  contains_interaction: boolean;
}

export interface MinimalRescueResult {
  experiment_id: string;
  search_status: string;
  baseline_phenotype: number;
  parent_a_phenotype: number;
  parent_b_phenotype: number;
  parental_envelope: { min: number; max: number };
  candidate_pool_size: number;
  search_top_k: number;
  max_set_size: number;
  max_returned_sets: number;
  maximum_theoretical_combinations: number;
  evaluated_combination_count: number;
  invalid_combination_count: number;
  invalid_combination_reasons: Record<string, number>;
  minimal_cardinality: number | null;
  minimal_rescue_sets: MinimalRescueSet[];
  search_is_globally_exhaustive: boolean;
  searched_candidate_ids: string[];
}

export interface EvidenceNode {
  id: string;
  label: string;
  type: string;
  value?: number;
  parent?: string;
  position?: number;
  dosage?: number;
  source?: string;
  coefficient?: number;
  is_primary_cause?: boolean;
  is_transgressive?: boolean;
  margin?: number;
  x?: number;
  y?: number;
}

export interface EvidenceLink {
  source: string | EvidenceNode;
  target: string | EvidenceNode;
  relationship: string;
}

export interface EvidenceGraphData {
  directed: boolean;
  nodes: EvidenceNode[];
  links: EvidenceLink[];
  top_candidate?: CounterfactualResult;
}

export interface BenchmarkResult {
  parameters: {
    locus_count: number;
    causal_interactions: number;
    recombination_rate: number;
    effect_size: number;
    noise: number;
    seed: number;
    top_k: number;
  };
  phenotypes: {
    parent_a: number;
    parent_b: number;
    offspring: number;
    is_transgressive: boolean;
    novelty_margin: number;
  };
  metrics: {
    precision: number;
    recall: number;
    f1_score: number;
    top_k_recovery: boolean;
    mean_delta_causal: number;
    mean_delta_null: number;
    faithfulness_ratio: number;
    recombination_interval_recovered: boolean;
    total_candidates_evaluated: number;
  };
  performance: { duration_ms: number; peak_memory_kb: number };
  ranked_candidates: CounterfactualResult[];
}

export interface ResearchBenchmarkResult {
  benchmark_name: string;
  difficulty: string;
  n_seeds: number;
  aggregate_metrics: Record<string, number | null>;
  confidence_intervals: Record<string, Record<string, number | null>>;
  confidence_interval_method: Record<string, unknown>;
  baseline_results: Record<string, unknown>;
  ablation_results: Record<string, unknown>;
  negative_controls: Record<string, unknown>;
  exact_generative_recovery?: Record<string, unknown>;
  functional_rescue_recovery?: Record<string, unknown>;
  hierarchical_metrics?: Record<string, unknown>;
  candidate_redundancy?: Record<string, unknown>;
  provenance_contribution?: Record<string, unknown>;
  baseline_deltas?: Record<string, unknown>;
  difficulty_diagnostics?: Record<string, unknown>;
  runtime_summary: Record<string, unknown>;
  config: Record<string, unknown>;
  software_version: string;
  seed_information: Record<string, unknown>;
  per_seed_metrics?: Array<Record<string, unknown>>;
}

export interface ExperimentFullState {
  experiment_id: string;
  seed: number;
  locus_count: number;
  parent_a: ParentGenomeData;
  parent_b: ParentGenomeData;
  gamete_a: GameteData;
  gamete_b: GameteData;
  offspring: OffspringData;
  phenotypes: {
    parent_a: PhenotypeBreakdown;
    parent_b: PhenotypeBreakdown;
    offspring: PhenotypeBreakdown;
  };
  novelty: NoveltyAssessment;
  trace: {
    total_candidates: number;
    primary_candidate: CounterfactualResult;
    ranked_candidates: CounterfactualResult[];
  };
  evidence_graph: EvidenceGraphData;
}
