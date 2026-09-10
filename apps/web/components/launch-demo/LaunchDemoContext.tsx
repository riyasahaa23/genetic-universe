"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import {
  createExperiment,
  generateGenomes,
  simulateMeiosis,
  generateOffspring,
  calculatePhenotype,
  detectNovelty,
  runNoveltyTrace,
  applyCounterfactual,
  runMinimalRescue,
  runMeioticNull,
  fetchEvidenceGraph,
  getErrorMessage,
} from "@/lib/api";
import {
  ParentGenomeData,
  GameteData,
  OffspringData,
  PhenotypeBreakdown,
  NoveltyAssessment,
  CounterfactualResult,
  MinimalRescueResult,
  MeioticNullResult,
  EvidenceGraphData,
} from "@/lib/types";

export type UniverseMode = "plant" | "animal" | "human";

export interface OrganismMetadata {
  species: string;
  variety: string;
  commonName: string;
  ploidyDescription: string;
  contextDisclaimer: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  stageName: string;
  event: string;
  severity: "info" | "success" | "warn" | "error";
  details?: Record<string, unknown>;
}

export interface LaunchDemoContextType {
  universeMode: UniverseMode | null;
  organismMeta: OrganismMetadata;
  seed: number;
  locusCount: number;
  experimentId: string;
  currentStage: number; // 1 to 8
  maxCompletedStage: number;
  isRunning: boolean;
  error: string | null;
  auditLogs: AuditLogEntry[];
  isAuditDrawerOpen: boolean;

  // Scientific data structures
  parentA: ParentGenomeData | null;
  parentB: ParentGenomeData | null;
  gameteA: GameteData | null;
  gameteB: GameteData | null;
  offspring: OffspringData | null;
  phenotypes: {
    parent_a: PhenotypeBreakdown;
    parent_b: PhenotypeBreakdown;
    offspring: PhenotypeBreakdown;
  } | null;
  novelty: NoveltyAssessment | null;
  traceCandidates: CounterfactualResult[];
  selectedCandidate: CounterfactualResult | null;
  counterfactualResult: CounterfactualResult | null;
  minimalRescueResult: MinimalRescueResult | null;
  meioticNullResult: MeioticNullResult | null;
  evidenceGraph: EvidenceGraphData | null;

  // Actions
  selectUniverse: (mode: UniverseMode) => void;
  clearUniverse: () => void;
  setSeed: (seed: number) => void;
  setLocusCount: (count: number) => void;
  setOrganismMeta: (meta: Partial<OrganismMetadata>) => void;
  applyPreset: (preset: "quick" | "high_recomb" | "novelty_epistasis") => void;
  setCurrentStage: (stage: number) => void;
  setIsAuditDrawerOpen: (open: boolean) => void;
  setSelectedCandidate: (cand: CounterfactualResult | null) => void;

  // Step-by-step workflow actions
  initExperiment: () => Promise<void>;
  executeStep2Genomes: () => Promise<void>;
  executeStep3Meiosis: () => Promise<void>;
  executeStep4Offspring: () => Promise<void>;
  executeStep5Phenotype: () => Promise<void>;
  executeStep6Trace: () => Promise<void>;
  executeStep7Counterfactual: (candidateId?: string, intervention?: string) => Promise<void>;
  executeStep7MinimalRescue: () => Promise<void>;
  executeStep7MeioticNull: (count?: number) => Promise<void>;
  executeCompletePipeline: () => Promise<void>;
  resetExperiment: () => void;
}

const DEFAULT_ORGANISM_METAS: Record<UniverseMode, OrganismMetadata> = {
  plant: {
    species: "Arabidopsis thaliana",
    variety: "Columbia (Col-0) × Landsberg erecta (Ler)",
    commonName: "Thale Cress",
    ploidyDescription: "Diploid model plant (2n = 10, representative linkage)",
    contextDisclaimer: "Generic computational meiosis engine with plant context metadata",
  },
  animal: {
    species: "Mus musculus",
    variety: "C57BL/6J × DBA/2J (BXD recombinant inbred)",
    commonName: "House Mouse",
    ploidyDescription: "Diploid mammalian model (2n = 40, simulated 1-chromosome tract)",
    contextDisclaimer: "Generic computational meiosis engine with animal context metadata",
  },
  human: {
    species: "Homo sapiens",
    variety: "Synthetic Trio Genome Benchmark",
    commonName: "Human Synthetic Model",
    ploidyDescription: "Diploid human model (simulated 50-100 locus candidate region)",
    contextDisclaimer: "Research model only. Strictly non-causal population context; not for clinical diagnosis.",
  },
};

const LaunchDemoContext = createContext<LaunchDemoContextType | undefined>(undefined);

export const LaunchDemoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [universeMode, setUniverseMode] = useState<UniverseMode | null>(null);
  const [organismMeta, setOrganismMetaState] = useState<OrganismMetadata>(
    DEFAULT_ORGANISM_METAS.plant
  );
  const [seed, setSeed] = useState<number>(42);
  const [locusCount, setLocusCount] = useState<number>(50);
  const [experimentId, setExperimentId] = useState<string>("");
  const [currentStage, setCurrentStage] = useState<number>(1);
  const [maxCompletedStage, setMaxCompletedStage] = useState<number>(1);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [isAuditDrawerOpen, setIsAuditDrawerOpen] = useState<boolean>(false);

  // Scientific data
  const [parentA, setParentA] = useState<ParentGenomeData | null>(null);
  const [parentB, setParentB] = useState<ParentGenomeData | null>(null);
  const [gameteA, setGameteA] = useState<GameteData | null>(null);
  const [gameteB, setGameteB] = useState<GameteData | null>(null);
  const [offspring, setOffspring] = useState<OffspringData | null>(null);
  const [phenotypes, setPhenotypes] = useState<{
    parent_a: PhenotypeBreakdown;
    parent_b: PhenotypeBreakdown;
    offspring: PhenotypeBreakdown;
  } | null>(null);
  const [novelty, setNovelty] = useState<NoveltyAssessment | null>(null);
  const [traceCandidates, setTraceCandidates] = useState<CounterfactualResult[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<CounterfactualResult | null>(null);
  const [counterfactualResult, setCounterfactualResult] = useState<CounterfactualResult | null>(null);
  const [minimalRescueResult, setMinimalRescueResult] = useState<MinimalRescueResult | null>(null);
  const [meioticNullResult, setMeioticNullResult] = useState<MeioticNullResult | null>(null);
  const [evidenceGraph, setEvidenceGraph] = useState<EvidenceGraphData | null>(null);

  const addLog = useCallback(
    (
      stageName: string,
      event: string,
      severity: "info" | "success" | "warn" | "error" = "info",
      details?: Record<string, unknown>
    ) => {
      const entry: AuditLogEntry = {
        id: Math.random().toString(36).substring(2, 9),
        timestamp: new Date().toISOString(),
        stageName,
        event,
        severity,
        details,
      };
      setAuditLogs((prev) => [entry, ...prev]);
    },
    []
  );

  const selectUniverse = useCallback(
    (mode: UniverseMode) => {
      setUniverseMode(mode);
      setOrganismMetaState(DEFAULT_ORGANISM_METAS[mode]);
      addLog("Universe", `Initialized ${mode.toUpperCase()} Universe workspace.`, "info", {
        mode,
        species: DEFAULT_ORGANISM_METAS[mode].species,
      });
    },
    [addLog]
  );

  const clearUniverse = useCallback(() => {
    setUniverseMode(null);
    setCurrentStage(1);
    setMaxCompletedStage(1);
    setExperimentId("");
  }, []);

  const setOrganismMeta = useCallback((meta: Partial<OrganismMetadata>) => {
    setOrganismMetaState((prev) => ({ ...prev, ...meta }));
  }, []);

  const applyPreset = useCallback(
    (preset: "quick" | "high_recomb" | "novelty_epistasis") => {
      if (preset === "quick") {
        setSeed(42);
        setLocusCount(50);
        addLog("Configure", "Applied 'Quick Demo' preset (Seed 42, 50 Loci).", "info");
      } else if (preset === "high_recomb") {
        setSeed(101);
        setLocusCount(80);
        addLog("Configure", "Applied 'High Recombination' preset (Seed 101, 80 Loci).", "info");
      } else {
        setSeed(2024);
        setLocusCount(60);
        addLog("Configure", "Applied 'Interaction-Driven Novelty' preset (Seed 2024, 60 Loci).", "info");
      }
    },
    [addLog]
  );

  // STAGE 1 -> Initialize Experiment
  const initExperiment = useCallback(async () => {
    setIsRunning(true);
    setError(null);
    try {
      addLog("Stage 1", `Creating experiment chamber (Seed: ${seed}, Loci: ${locusCount})...`);
      const res = await createExperiment(seed, locusCount);
      setExperimentId(res.experiment_id);
      addLog(
        "Stage 1",
        `Experiment ${res.experiment_id} initialized successfully.`,
        "success",
        { experiment_id: res.experiment_id, seed, locus_count: locusCount }
      );
      setMaxCompletedStage((prev) => Math.max(prev, 1));
      setCurrentStage(2);
      // Immediately fetch parental genomes
      const genRes = await generateGenomes(res.experiment_id);
      setParentA(genRes.parent_a);
      setParentB(genRes.parent_b);
      addLog(
        "Stage 2",
        `Parent A (${genRes.parent_a.locus_count} loci) & Parent B phased haplotypes generated.`,
        "success"
      );
      setMaxCompletedStage((prev) => Math.max(prev, 2));
    } catch (e) {
      const msg = getErrorMessage(e);
      setError(msg);
      addLog("Stage 1", `Experiment initialization failed: ${msg}`, "error");
    } finally {
      setIsRunning(false);
    }
  }, [seed, locusCount, addLog]);

  // STAGE 2 -> Parental Genomes
  const executeStep2Genomes = useCallback(async () => {
    if (!experimentId) return;
    setIsRunning(true);
    setError(null);
    try {
      addLog("Stage 2", `Synthesizing homologous parental chromosomes...`);
      const genRes = await generateGenomes(experimentId);
      setParentA(genRes.parent_a);
      setParentB(genRes.parent_b);
      addLog(
        "Stage 2",
        `Synthesized Parent A and Parent B phased homologs (A1/A2, B1/B2).`,
        "success"
      );
      setMaxCompletedStage((prev) => Math.max(prev, 2));
    } catch (e) {
      const msg = getErrorMessage(e);
      setError(msg);
      addLog("Stage 2", `Genome generation failed: ${msg}`, "error");
    } finally {
      setIsRunning(false);
    }
  }, [experimentId, addLog]);

  // STAGE 3 -> Simulate Meiosis
  const executeStep3Meiosis = useCallback(async () => {
    if (!experimentId) return;
    setIsRunning(true);
    setError(null);
    try {
      addLog("Stage 3", `Simulating homolog synapsis, chiasmata, and reciprocal crossover...`);
      const meioticRes = await simulateMeiosis(experimentId);
      setGameteA(meioticRes.gamete_a);
      setGameteB(meioticRes.gamete_b);
      addLog(
        "Stage 3",
        `Meiosis simulated. Gamete gA crossovers: [${meioticRes.gamete_a.crossovers.join(", ")}], gB crossovers: [${meioticRes.gamete_b.crossovers.join(", ")}].`,
        "success",
        {
          gamete_a_crossovers: meioticRes.gamete_a.crossovers,
          gamete_b_crossovers: meioticRes.gamete_b.crossovers,
        }
      );
      setMaxCompletedStage((prev) => Math.max(prev, 3));
      setCurrentStage(3);
    } catch (e) {
      const msg = getErrorMessage(e);
      setError(msg);
      addLog("Stage 3", `Meiotic simulation failed: ${msg}`, "error");
    } finally {
      setIsRunning(false);
    }
  }, [experimentId, addLog]);

  // STAGE 4 -> Assemble Offspring
  const executeStep4Offspring = useCallback(async () => {
    if (!experimentId) return;
    setIsRunning(true);
    setError(null);
    try {
      addLog("Stage 4", `Fertilizing transmitted gametes and constructing diploid offspring...`);
      const offRes = await generateOffspring(experimentId);
      setOffspring(offRes);
      addLog(
        "Stage 4",
        `Offspring ${offRes.offspring_id} assembled with full locus-level provenance.`,
        "success",
        { offspring_id: offRes.offspring_id }
      );
      setMaxCompletedStage((prev) => Math.max(prev, 4));
      setCurrentStage(4);
    } catch (e) {
      const msg = getErrorMessage(e);
      setError(msg);
      addLog("Stage 4", `Offspring assembly failed: ${msg}`, "error");
    } finally {
      setIsRunning(false);
    }
  }, [experimentId, addLog]);

  // STAGE 5 -> Evaluate Phenotype & Novelty
  const executeStep5Phenotype = useCallback(async () => {
    if (!experimentId) return;
    setIsRunning(true);
    setError(null);
    try {
      addLog("Stage 5", `Computing additive, dominance, and cis-epistatic phenotype model...`);
      const pRes = await calculatePhenotype(experimentId);
      const nRes = await detectNovelty(experimentId);
      setPhenotypes(pRes);
      setNovelty(nRes);
      addLog(
        "Stage 5",
        `Phenotypes evaluated. Parent A: ${pRes.parent_a.total.toFixed(1)}, Parent B: ${pRes.parent_b.total.toFixed(1)}, Offspring: ${pRes.offspring.total.toFixed(1)}. Transgressive Novelty: ${nRes.is_transgressive ? "YES (+" + nRes.novelty_margin.toFixed(2) + ")" : "NO"}.`,
        nRes.is_transgressive ? "warn" : "success",
        {
          parent_a: pRes.parent_a.total,
          parent_b: pRes.parent_b.total,
          offspring: pRes.offspring.total,
          is_transgressive: nRes.is_transgressive,
          novelty_margin: nRes.novelty_margin,
        }
      );
      setMaxCompletedStage((prev) => Math.max(prev, 5));
      setCurrentStage(5);
    } catch (e) {
      const msg = getErrorMessage(e);
      setError(msg);
      addLog("Stage 5", `Phenotype evaluation failed: ${msg}`, "error");
    } finally {
      setIsRunning(false);
    }
  }, [experimentId, addLog]);

  // STAGE 6 -> Novelty Trace
  const executeStep6Trace = useCallback(async () => {
    if (!experimentId) return;
    setIsRunning(true);
    setError(null);
    try {
      addLog("Stage 6", `Executing backward novelty trace across candidate interactions and segments...`);
      const traceRes = await runNoveltyTrace(experimentId);
      setTraceCandidates(traceRes.ranked_candidates);
      if (traceRes.ranked_candidates.length > 0) {
        setSelectedCandidate(traceRes.ranked_candidates[0]);
      }
      addLog(
        "Stage 6",
        `Novelty trace discovered ${traceRes.total_candidates} candidate mechanisms. Top: ${traceRes.ranked_candidates[0]?.candidate_name || "None"}.`,
        "success",
        {
          total_candidates: traceRes.total_candidates,
          top_candidate: traceRes.ranked_candidates[0]?.candidate_id,
        }
      );
      setMaxCompletedStage((prev) => Math.max(prev, 6));
      setCurrentStage(6);
    } catch (e) {
      const msg = getErrorMessage(e);
      setError(msg);
      addLog("Stage 6", `Novelty trace failed: ${msg}`, "error");
    } finally {
      setIsRunning(false);
    }
  }, [experimentId, addLog]);

  // STAGE 7 -> Counterfactual Rescue & Minimal Rescue
  const executeStep7Counterfactual = useCallback(
    async (candidateId?: string, intervention: string = "break_interaction") => {
      if (!experimentId) return;
      const targetId = candidateId || selectedCandidate?.candidate_id;
      if (!targetId) return;
      setIsRunning(true);
      setError(null);
      try {
        addLog("Stage 7", `Evaluating in-silico intervention on candidate ${targetId}...`);
        const cfRes = await applyCounterfactual(experimentId, targetId, intervention);
        setCounterfactualResult(cfRes);
        addLog(
          "Stage 7",
          `Counterfactual result: Δ = ${cfRes.delta.toFixed(2)}, Novelty Removed = ${cfRes.novelty_removed ? "YES" : "NO"}.`,
          cfRes.novelty_removed ? "success" : "info",
          {
            candidate_id: cfRes.candidate_id,
            counterfactual_phenotype: cfRes.counterfactual_phenotype,
            novelty_removed: cfRes.novelty_removed,
          }
        );
        setMaxCompletedStage((prev) => Math.max(prev, 7));
        setCurrentStage(7);
      } catch (e) {
        const msg = getErrorMessage(e);
        setError(msg);
        addLog("Stage 7", `Counterfactual evaluation failed: ${msg}`, "error");
      } finally {
        setIsRunning(false);
      }
    },
    [experimentId, selectedCandidate, addLog]
  );

  const executeStep7MinimalRescue = useCallback(async () => {
    if (!experimentId) return;
    setIsRunning(true);
    setError(null);
    try {
      addLog("Stage 7", `Searching for minimal rescue intervention sets across candidate combinations...`);
      const minRes = await runMinimalRescue(experimentId, {
        topK: 10,
        maxSetSize: 3,
        maxReturnedSets: 5,
      });
      setMinimalRescueResult(minRes);
      addLog(
        "Stage 7",
        `Minimal rescue search completed: Cardinality = ${minRes.minimal_cardinality ?? "N/A"}, Evaluated combinations = ${minRes.evaluated_combination_count}.`,
        "success",
        {
          minimal_cardinality: minRes.minimal_cardinality,
          status: minRes.search_status,
          exhaustive: minRes.search_is_globally_exhaustive,
        }
      );
    } catch (e) {
      const msg = getErrorMessage(e);
      setError(msg);
      addLog("Stage 7", `Minimal rescue search failed: ${msg}`, "error");
    } finally {
      setIsRunning(false);
    }
  }, [experimentId, addLog]);

  const executeStep7MeioticNull = useCallback(
    async (count: number = 200) => {
      if (!experimentId) return;
      setIsRunning(true);
      setError(null);
      try {
        addLog("Stage 7", `Simulating ${count} meiotic null offspring to build empirical distribution...`);
        const nullRes = await runMeioticNull(experimentId, count);
        setMeioticNullResult(nullRes);
        addLog(
          "Stage 7",
          `Meiotic null simulated: Observed percentile = ${nullRes.observed_percentile.toFixed(1)}%, Null mean = ${nullRes.null_mean.toFixed(2)}.`,
          "success",
          {
            observed_percentile: nullRes.observed_percentile,
            fraction_transgressive: nullRes.fraction_null_transgressive,
          }
        );
      } catch (e) {
        const msg = getErrorMessage(e);
        setError(msg);
        addLog("Stage 7", `Meiotic null simulation failed: ${msg}`, "error");
      } finally {
        setIsRunning(false);
      }
    },
    [experimentId, addLog]
  );

  // Complete pipeline runner
  const executeCompletePipeline = useCallback(async () => {
    setIsRunning(true);
    setError(null);
    try {
      // Step 1: Create experiment if needed
      let expId = experimentId;
      if (!expId) {
        const exp = await createExperiment(seed, locusCount);
        expId = exp.experiment_id;
        setExperimentId(exp.experiment_id);
        addLog("Init", `Created experiment ${exp.experiment_id}`);
      }

      // Step 2: Genomes
      const genRes = await generateGenomes(expId);
      setParentA(genRes.parent_a);
      setParentB(genRes.parent_b);

      // Step 3: Meiosis
      const meioticRes = await simulateMeiosis(expId);
      setGameteA(meioticRes.gamete_a);
      setGameteB(meioticRes.gamete_b);

      // Step 4: Offspring
      const offRes = await generateOffspring(expId);
      setOffspring(offRes);

      // Step 5: Phenotype
      const pRes = await calculatePhenotype(expId);
      const nRes = await detectNovelty(expId);
      setPhenotypes(pRes);
      setNovelty(nRes);

      // Step 6: Trace
      const traceRes = await runNoveltyTrace(expId);
      setTraceCandidates(traceRes.ranked_candidates);
      if (traceRes.ranked_candidates.length > 0) {
        setSelectedCandidate(traceRes.ranked_candidates[0]);
      }

      // Step 7: Counterfactual & Minimal Rescue & Null
      if (traceRes.ranked_candidates.length > 0) {
        const cfRes = await applyCounterfactual(
          expId,
          traceRes.ranked_candidates[0].candidate_id,
          "break_interaction"
        );
        setCounterfactualResult(cfRes);
      }

      const minRes = await runMinimalRescue(expId, { topK: 10, maxSetSize: 3 });
      setMinimalRescueResult(minRes);

      const nullRes = await runMeioticNull(expId, 150);
      setMeioticNullResult(nullRes);

      const egRes = await fetchEvidenceGraph(expId);
      setEvidenceGraph(egRes);

      setMaxCompletedStage(8);
      setCurrentStage(8);
      addLog("Stage 8", `Complete experimental pipeline finished. Research summary ready.`, "success");
    } catch (e) {
      const msg = getErrorMessage(e);
      setError(msg);
      addLog("Pipeline", `Pipeline execution failed: ${msg}`, "error");
    } finally {
      setIsRunning(false);
    }
  }, [experimentId, seed, locusCount, addLog]);

  const resetExperiment = useCallback(() => {
    setExperimentId("");
    setCurrentStage(1);
    setMaxCompletedStage(1);
    setParentA(null);
    setParentB(null);
    setGameteA(null);
    setGameteB(null);
    setOffspring(null);
    setPhenotypes(null);
    setNovelty(null);
    setTraceCandidates([]);
    setSelectedCandidate(null);
    setCounterfactualResult(null);
    setMinimalRescueResult(null);
    setMeioticNullResult(null);
    setEvidenceGraph(null);
    setError(null);
    addLog("Reset", "Experiment chamber reset. Ready for new configuration.", "info");
  }, [addLog]);

  useEffect(() => {
    if (currentStage === 8 && experimentId && !evidenceGraph) {
      fetchEvidenceGraph(experimentId)
        .then((eg) => setEvidenceGraph(eg))
        .catch((e) => console.error("Failed to load evidence graph:", e));
    }
  }, [currentStage, experimentId, evidenceGraph]);

  return (
    <LaunchDemoContext.Provider
      value={{
        universeMode,
        organismMeta,
        seed,
        locusCount,
        experimentId,
        currentStage,
        maxCompletedStage,
        isRunning,
        error,
        auditLogs,
        isAuditDrawerOpen,
        parentA,
        parentB,
        gameteA,
        gameteB,
        offspring,
        phenotypes,
        novelty,
        traceCandidates,
        selectedCandidate,
        counterfactualResult,
        minimalRescueResult,
        meioticNullResult,
        evidenceGraph,
        selectUniverse,
        clearUniverse,
        setSeed,
        setLocusCount,
        setOrganismMeta,
        applyPreset,
        setCurrentStage,
        setIsAuditDrawerOpen,
        setSelectedCandidate,
        initExperiment,
        executeStep2Genomes,
        executeStep3Meiosis,
        executeStep4Offspring,
        executeStep5Phenotype,
        executeStep6Trace,
        executeStep7Counterfactual,
        executeStep7MinimalRescue,
        executeStep7MeioticNull,
        executeCompletePipeline,
        resetExperiment,
      }}
    >
      {children}
    </LaunchDemoContext.Provider>
  );
};

export const useLaunchDemo = (): LaunchDemoContextType => {
  const context = useContext(LaunchDemoContext);
  if (!context) {
    throw new Error("useLaunchDemo must be used within a LaunchDemoProvider");
  }
  return context;
};
