/**
 * REST API client for Genetic Universe backend.
 */
import {
  ExperimentFullState,
  CounterfactualResult,
  EvidenceGraphData,
  NoveltyAssessment,
  ParentGenomeData,
  GameteData,
  OffspringData,
  PhenotypeBreakdown,
  BenchmarkResult,
  MeioticNullResult,
  MinimalRescueResult,
  ResearchBenchmarkResult,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/** Convert all non-2xx responses into one useful, user-facing error type. */
export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "An unexpected error occurred";
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body = await response.json();
      message = body.error?.message || body.detail || message;
    } catch {
      // Keep the status-based message when the server did not return JSON.
    }
    throw new ApiError(response.status, message);
  }

  return response.json() as Promise<T>;
}

export async function runDemoExperiment(): Promise<ExperimentFullState> {
  return request<ExperimentFullState>("/api/experiments/demo/run", { method: "POST" });
}

export async function createExperiment(seed = 42, locusCount = 50) {
  return request<{ experiment_id: string; seed: number; locus_count: number; status: string }>("/api/experiments", {
    method: "POST",
    body: JSON.stringify({ seed, locus_count: locusCount }),
  });
}

export async function generateGenomes(experimentId: string): Promise<{ parent_a: ParentGenomeData; parent_b: ParentGenomeData }> {
  return request(`/api/experiments/${experimentId}/genomes`, { method: "POST" });
}

export async function simulateMeiosis(experimentId: string): Promise<{ gamete_a: GameteData; gamete_b: GameteData }> {
  return request(`/api/experiments/${experimentId}/meiosis`, { method: "POST" });
}

export async function generateOffspring(experimentId: string): Promise<OffspringData> {
  return request<OffspringData>(`/api/experiments/${experimentId}/offspring`, { method: "POST" });
}

export async function calculatePhenotype(experimentId: string): Promise<{ parent_a: PhenotypeBreakdown; parent_b: PhenotypeBreakdown; offspring: PhenotypeBreakdown }> {
  return request(`/api/experiments/${experimentId}/phenotype`, { method: "POST" });
}

export async function detectNovelty(experimentId: string): Promise<NoveltyAssessment> {
  return request<NoveltyAssessment>(`/api/experiments/${experimentId}/novelty`, { method: "POST" });
}

export async function runNoveltyTrace(experimentId: string): Promise<{ total_candidates: number; ranked_candidates: CounterfactualResult[] }> {
  return request(`/api/experiments/${experimentId}/trace`, { method: "POST" });
}

export async function applyCounterfactual(
  experimentId: string,
  candidateId: string,
  intervention: string = "break_interaction"
): Promise<CounterfactualResult> {
  return request<CounterfactualResult>(`/api/experiments/${experimentId}/counterfactual`, {
    method: "POST",
    body: JSON.stringify({ candidate_id: candidateId, intervention }),
  });
}

export async function runMeioticNull(
  experimentId: string,
  simulationCount = 1000,
  seed?: number,
  histogramBinCount = 20,
): Promise<MeioticNullResult> {
  return request<MeioticNullResult>(`/api/experiments/${experimentId}/meiotic-null`, {
    method: "POST",
    body: JSON.stringify({
      ...(seed === undefined ? {} : { seed }),
      simulation_count: simulationCount,
      histogram_bin_count: histogramBinCount,
    }),
  });
}

export async function runMinimalRescue(
  experimentId: string,
  options: {
    topK?: number;
    maxSetSize?: number;
    maxReturnedSets?: number;
    maxCombinationCount?: number;
  } = {},
): Promise<MinimalRescueResult> {
  return request<MinimalRescueResult>(`/api/experiments/${experimentId}/minimal-rescue`, {
    method: "POST",
    body: JSON.stringify({
      ...(options.topK === undefined ? {} : { top_k: options.topK }),
      ...(options.maxSetSize === undefined ? {} : { max_set_size: options.maxSetSize }),
      ...(options.maxReturnedSets === undefined
        ? {}
        : { max_returned_sets: options.maxReturnedSets }),
      ...(options.maxCombinationCount === undefined
        ? {}
        : { max_combination_count: options.maxCombinationCount }),
    }),
  });
}

export async function fetchEvidenceGraph(experimentId: string): Promise<EvidenceGraphData> {
  return request<EvidenceGraphData>(`/api/experiments/${experimentId}/evidence-graph`);
}

export async function fetchBenchmark(locusCount = 50, seed = 42): Promise<BenchmarkResult> {
  return request<BenchmarkResult>(`/api/benchmark?locus_count=${locusCount}&seed=${seed}`);
}

export async function fetchResearchBenchmark(
  difficulty = "easy",
  nSeeds = 50,
  bootstrapSeed = 20250910,
  nullSimulations = 100,
  includePerSeed = false,
): Promise<ResearchBenchmarkResult> {
  const params = new URLSearchParams({
    difficulty,
    n_seeds: String(nSeeds),
    bootstrap_seed: String(bootstrapSeed),
    null_simulations: String(nullSimulations),
    include_per_seed: String(includePerSeed),
  });
  return request<ResearchBenchmarkResult>(`/api/research-benchmark?${params.toString()}`);
}
