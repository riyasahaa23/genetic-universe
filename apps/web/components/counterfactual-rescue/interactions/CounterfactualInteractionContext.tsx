"use client";

import React, { createContext, useContext, useState, useMemo, useCallback } from "react";

export type CandidateType = "variant" | "segment" | "interaction";

export interface PairwiseMetrics {
  delta_a: number;
  delta_b: number;
  delta_ab: number;
  interaction_contrast: number;
  epistatic_excess: number;
  interaction_edge_delta: number;
  synergy_direction: string;
}

export interface MinimalRescueDetails {
  minimal_cardinality: number;
  minimal_rescue_sets: string[];
  joint_phenotype: number;
  joint_delta: number;
  novelty_removed: boolean;
  search_status: string;
  search_is_globally_exhaustive: boolean;
}

export interface CandidateModification {
  id: number;
  target: string;
  candidateType: CandidateType;
  locusMb: number;
  provenance: string;
  originalAllele: string;
  modifiedAllele: string;
  originalEffect: string;
  modifiedEffect: string;
  modificationLabel: string;
  predictedDelta: number;
  baselinePhenotype: number;
  newPhenotype: number;
  status: "Rescue" | "Partial" | "Minimal";
  noveltyRemoved: boolean;
  additiveEffect: number;
  dominanceEffect: number;
  epistaticEffect: number;
  netChange: number;
  isMinimal: boolean;
  explanation: string;
  pairwiseMetrics?: PairwiseMetrics;
  minimalRescue?: MinimalRescueDetails;
  networkNodes: {
    id: string;
    label: string;
    x: number;
    y: number;
    color: string;
  }[];
  networkLinks: {
    source: string;
    target: string;
    type: "original" | "modified" | "reduced" | "removed";
  }[];
}

const CANDIDATE_MODIFICATIONS: CandidateModification[] = [
  {
    id: 1,
    target: "Locus 3",
    candidateType: "variant",
    locusMb: 72.4,
    provenance: "Parent B transmitted homolog (recombination block 42–95 Mb)",
    originalAllele: "A",
    modifiedAllele: "G",
    originalEffect: "+0.68",
    modifiedEffect: "-0.62",
    modificationLabel: "A → G Reversion",
    predictedDelta: -1.8,
    baselinePhenotype: 2.1,
    newPhenotype: 0.3,
    status: "Rescue",
    noveltyRemoved: true,
    additiveEffect: -0.78,
    dominanceEffect: -0.32,
    epistaticEffect: -0.68,
    netChange: -1.78,
    isMinimal: true,
    explanation:
      "Removing this variant reduces a key epistatic interaction, bringing the phenotype back within the parental range.",
    minimalRescue: {
      minimal_cardinality: 1,
      minimal_rescue_sets: ["{Locus 3 (A → G)}"],
      joint_phenotype: 0.3,
      joint_delta: -1.8,
      novelty_removed: true,
      search_status: "Evaluated 12 single-locus and 6 pairwise perturbations",
      search_is_globally_exhaustive: false,
    },
    networkNodes: [
      { id: "A", label: "Gene A", x: 45, y: 70, color: "#38bdf8" },
      { id: "B", label: "Gene B", x: 130, y: 40, color: "#f472b6" },
      { id: "D", label: "Gene D", x: 210, y: 80, color: "#94a3b8" },
      { id: "E1", label: "Gene E", x: 65, y: 140, color: "#38bdf8" },
      { id: "E2", label: "Gene E", x: 185, y: 155, color: "#38bdf8" },
    ],
    networkLinks: [
      { source: "A", target: "B", type: "modified" },
      { source: "B", target: "D", type: "reduced" },
      { source: "A", target: "E1", type: "original" },
      { source: "B", target: "E1", type: "removed" },
      { source: "E1", target: "E2", type: "modified" },
      { source: "D", target: "E2", type: "reduced" },
    ],
  },
  {
    id: 2,
    target: "Locus 7",
    candidateType: "variant",
    locusMb: 142.1,
    provenance: "Parent B transmitted homolog (crossover interval 95–145 Mb)",
    originalAllele: "T",
    modifiedAllele: "C",
    originalEffect: "+0.45",
    modifiedEffect: "-0.35",
    modificationLabel: "T → C Reversion",
    predictedDelta: -1.2,
    baselinePhenotype: 2.1,
    newPhenotype: 0.9,
    status: "Partial",
    noveltyRemoved: false,
    additiveEffect: -0.52,
    dominanceEffect: -0.21,
    epistaticEffect: -0.47,
    netChange: -1.2,
    isMinimal: false,
    explanation:
      "Partial reversion reduces additive contribution but leaves high-order epistatic interaction with Locus 3 intact.",
    minimalRescue: {
      minimal_cardinality: 2,
      minimal_rescue_sets: ["{Locus 7 (T → C), Locus 3 (A → G)}"],
      joint_phenotype: 0.1,
      joint_delta: -2.0,
      novelty_removed: true,
      search_status: "Evaluated 12 single-locus and 6 pairwise perturbations",
      search_is_globally_exhaustive: false,
    },
    networkNodes: [
      { id: "A", label: "Gene A", x: 45, y: 70, color: "#38bdf8" },
      { id: "B", label: "Gene B", x: 130, y: 40, color: "#f472b6" },
      { id: "D", label: "Gene D", x: 210, y: 80, color: "#94a3b8" },
      { id: "E1", label: "Gene E", x: 65, y: 140, color: "#38bdf8" },
      { id: "E2", label: "Gene E", x: 185, y: 155, color: "#38bdf8" },
    ],
    networkLinks: [
      { source: "A", target: "B", type: "original" },
      { source: "B", target: "D", type: "modified" },
      { source: "A", target: "E1", type: "original" },
      { source: "B", target: "E1", type: "reduced" },
      { source: "E1", target: "E2", type: "original" },
      { source: "D", target: "E2", type: "reduced" },
    ],
  },
  {
    id: 3,
    target: "Haplotype Block 38",
    candidateType: "segment",
    locusMb: 38.6,
    provenance: "Transmitted recombinant haplotype (Chr3: 0–42 Mb segment)",
    originalAllele: "Hap-A",
    modifiedAllele: "Hap-P",
    originalEffect: "+0.38",
    modifiedEffect: "-0.22",
    modificationLabel: "Segment Swap (Hap-A → Hap-P)",
    predictedDelta: -0.6,
    baselinePhenotype: 2.1,
    newPhenotype: 1.5,
    status: "Partial",
    noveltyRemoved: false,
    additiveEffect: -0.25,
    dominanceEffect: -0.15,
    epistaticEffect: -0.2,
    netChange: -0.6,
    isMinimal: false,
    explanation:
      "Compensatory segment swap dampens downstream expression but does not dismantle the primary driver.",
    minimalRescue: {
      minimal_cardinality: 2,
      minimal_rescue_sets: ["{Block 38 (Swap), Locus 3 (A → G)}"],
      joint_phenotype: 0.2,
      joint_delta: -1.9,
      novelty_removed: true,
      search_status: "Evaluated 12 single-locus and 6 pairwise perturbations",
      search_is_globally_exhaustive: false,
    },
    networkNodes: [
      { id: "A", label: "Gene A", x: 45, y: 70, color: "#38bdf8" },
      { id: "B", label: "Gene B", x: 130, y: 40, color: "#f472b6" },
      { id: "D", label: "Gene D", x: 210, y: 80, color: "#94a3b8" },
      { id: "E1", label: "Gene E", x: 65, y: 140, color: "#38bdf8" },
      { id: "E2", label: "Gene E", x: 185, y: 155, color: "#38bdf8" },
    ],
    networkLinks: [
      { source: "A", target: "B", type: "original" },
      { source: "B", target: "D", type: "original" },
      { source: "A", target: "E1", type: "reduced" },
      { source: "B", target: "E1", type: "reduced" },
      { source: "E1", target: "E2", type: "modified" },
      { source: "D", target: "E2", type: "original" },
    ],
  },
  {
    id: 4,
    target: "Locus 3 × 7 Edge",
    candidateType: "interaction",
    locusMb: 72.4,
    provenance: "Pairwise trans-interaction between Chr3 (72.4 Mb) and Chr7 (142.1 Mb)",
    originalAllele: "Active",
    modifiedAllele: "Ablated",
    originalEffect: "+1.13",
    modifiedEffect: "-0.97",
    modificationLabel: "Interaction Edge Ablation (γ_3,7 = 0)",
    predictedDelta: -2.1,
    baselinePhenotype: 2.1,
    newPhenotype: -0.1,
    status: "Rescue",
    noveltyRemoved: true,
    additiveEffect: -1.1,
    dominanceEffect: -0.42,
    epistaticEffect: -0.58,
    netChange: -2.1,
    isMinimal: false,
    explanation:
      "Dual intervention completely over-corrects the phenotype toward the lower parental boundary.",
    pairwiseMetrics: {
      delta_a: -0.95,
      delta_b: -0.55,
      delta_ab: -2.1,
      interaction_contrast: -0.6,
      epistatic_excess: -0.58,
      interaction_edge_delta: -0.72,
      synergy_direction: "Synergistic Suppression",
    },
    minimalRescue: {
      minimal_cardinality: 1,
      minimal_rescue_sets: ["{Edge 3×7 Ablation}"],
      joint_phenotype: -0.1,
      joint_delta: -2.1,
      novelty_removed: true,
      search_status: "Evaluated 12 single-locus and 6 pairwise perturbations",
      search_is_globally_exhaustive: false,
    },
    networkNodes: [
      { id: "A", label: "Gene A", x: 45, y: 70, color: "#38bdf8" },
      { id: "B", label: "Gene B", x: 130, y: 40, color: "#f472b6" },
      { id: "D", label: "Gene D", x: 210, y: 80, color: "#94a3b8" },
      { id: "E1", label: "Gene E", x: 65, y: 140, color: "#38bdf8" },
      { id: "E2", label: "Gene E", x: 185, y: 155, color: "#38bdf8" },
    ],
    networkLinks: [
      { source: "A", target: "B", type: "removed" },
      { source: "B", target: "D", type: "removed" },
      { source: "A", target: "E1", type: "modified" },
      { source: "B", target: "E1", type: "removed" },
      { source: "E1", target: "E2", type: "modified" },
      { source: "D", target: "E2", type: "reduced" },
    ],
  },
  {
    id: 5,
    target: "Locus 5",
    candidateType: "variant",
    locusMb: 98.2,
    provenance: "Parent B transmitted homolog (intergenic variant 98.2 Mb)",
    originalAllele: "C",
    modifiedAllele: "T",
    originalEffect: "+0.31",
    modifiedEffect: "-0.15",
    modificationLabel: "C → T Reversion",
    predictedDelta: -0.4,
    baselinePhenotype: 2.1,
    newPhenotype: 1.7,
    status: "Minimal",
    noveltyRemoved: false,
    additiveEffect: -0.18,
    dominanceEffect: -0.08,
    epistaticEffect: -0.14,
    netChange: -0.4,
    isMinimal: false,
    explanation:
      "Subtle single-nucleotide shift with negligible impact on phenotype envelope.",
    minimalRescue: {
      minimal_cardinality: 2,
      minimal_rescue_sets: ["{Locus 5 (C → T), Locus 3 (A → G)}"],
      joint_phenotype: 0.4,
      joint_delta: -1.7,
      novelty_removed: true,
      search_status: "Evaluated 12 single-locus and 6 pairwise perturbations",
      search_is_globally_exhaustive: false,
    },
    networkNodes: [
      { id: "A", label: "Gene A", x: 45, y: 70, color: "#38bdf8" },
      { id: "B", label: "Gene B", x: 130, y: 40, color: "#f472b6" },
      { id: "D", label: "Gene D", x: 210, y: 80, color: "#94a3b8" },
      { id: "E1", label: "Gene E", x: 65, y: 140, color: "#38bdf8" },
      { id: "E2", label: "Gene E", x: 185, y: 155, color: "#38bdf8" },
    ],
    networkLinks: [
      { source: "A", target: "B", type: "original" },
      { source: "B", target: "D", type: "original" },
      { source: "A", target: "E1", type: "original" },
      { source: "B", target: "E1", type: "reduced" },
      { source: "E1", target: "E2", type: "original" },
      { source: "D", target: "E2", type: "original" },
    ],
  },
];

export interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  title: string;
  subtitle?: string;
  badge?: string;
  badgeColor?: string;
  details?: { label: string; value: string; color?: string }[];
}

interface CounterfactualContextType {
  candidates: CandidateModification[];
  selectedCandidateId: number;
  setSelectedCandidateId: (id: number) => void;
  selectedCandidate: CandidateModification;
  selectedCandidateType: CandidateType;
  activeWorkflowStep: number;
  setActiveWorkflowStep: (step: number) => void;
  stepName: "target" | "intervention" | "effect" | "interpret";
  setStepByName: (name: "target" | "intervention" | "effect" | "interpret") => void;
  isCounterfactualMode: boolean;
  setIsCounterfactualMode: (val: boolean) => void;
  toggleCounterfactualMode: () => void;
  isExplanationOpen: boolean;
  setIsExplanationOpen: (val: boolean) => void;
  selectedTrait: string;
  setSelectedTrait: (trait: string) => void;
  selectedChromosome: string;
  setSelectedChromosome: (chr: string) => void;
  baselinePhenotype: number;
  counterfactualPhenotype: number;
  noveltyRemoved: boolean;
  tooltip: TooltipState;
  showTooltip: (tooltipData: Omit<TooltipState, "visible">) => void;
  hideTooltip: () => void;
  resetCounterfactual: () => void;
  startGuidedFlow: () => void;
}

const CounterfactualContext = createContext<CounterfactualContextType | null>(null);

export const CounterfactualInteractionProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [selectedCandidateId, setSelectedCandidateId] = useState<number>(1);
  const [activeWorkflowStep, setActiveWorkflowStep] = useState<number>(2);
  const [isCounterfactualMode, setIsCounterfactualMode] = useState<boolean>(false);
  const [isExplanationOpen, setIsExplanationOpen] = useState<boolean>(false);
  const [selectedTrait, setSelectedTrait] = useState<string>("Trait Value");
  const [selectedChromosome, setSelectedChromosome] = useState<string>("Chromosome 3");

  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    title: "",
  });

  const showTooltip = useCallback((tooltipData: Omit<TooltipState, "visible">) => {
    setTooltip({ ...tooltipData, visible: true });
  }, []);

  const hideTooltip = useCallback(() => {
    setTooltip((prev) => ({ ...prev, visible: false }));
  }, []);

  const selectedCandidate = useMemo(() => {
    return (
      CANDIDATE_MODIFICATIONS.find((c) => c.id === selectedCandidateId) ||
      CANDIDATE_MODIFICATIONS[0]
    );
  }, [selectedCandidateId]);

  const selectedCandidateType = selectedCandidate.candidateType;
  const baselinePhenotype = selectedCandidate.baselinePhenotype;
  const counterfactualPhenotype = selectedCandidate.newPhenotype;
  const noveltyRemoved = selectedCandidate.noveltyRemoved;

  const stepName = useMemo(() => {
    switch (activeWorkflowStep) {
      case 1:
        return "target";
      case 2:
        return "intervention";
      case 3:
        return "effect";
      case 4:
        return "interpret";
      default:
        return "intervention";
    }
  }, [activeWorkflowStep]);

  const setStepByName = useCallback(
    (name: "target" | "intervention" | "effect" | "interpret") => {
      switch (name) {
        case "target":
          setActiveWorkflowStep(1);
          break;
        case "intervention":
          setActiveWorkflowStep(2);
          break;
        case "effect":
          setActiveWorkflowStep(3);
          break;
        case "interpret":
          setActiveWorkflowStep(4);
          break;
      }
    },
    []
  );

  const toggleCounterfactualMode = useCallback(() => {
    setIsCounterfactualMode((prev) => !prev);
  }, []);

  const resetCounterfactual = useCallback(() => {
    setSelectedCandidateId(1);
    setActiveWorkflowStep(2);
    setSelectedTrait("Trait Value");
    setSelectedChromosome("Chromosome 3");
  }, []);

  const startGuidedFlow = useCallback(() => {
    setIsCounterfactualMode(true);
    setActiveWorkflowStep(1);
  }, []);

  return (
    <CounterfactualContext.Provider
      value={{
        candidates: CANDIDATE_MODIFICATIONS,
        selectedCandidateId,
        setSelectedCandidateId,
        selectedCandidate,
        selectedCandidateType,
        activeWorkflowStep,
        setActiveWorkflowStep,
        stepName,
        setStepByName,
        isCounterfactualMode,
        setIsCounterfactualMode,
        toggleCounterfactualMode,
        isExplanationOpen,
        setIsExplanationOpen,
        selectedTrait,
        setSelectedTrait,
        selectedChromosome,
        setSelectedChromosome,
        baselinePhenotype,
        counterfactualPhenotype,
        noveltyRemoved,
        tooltip,
        showTooltip,
        hideTooltip,
        resetCounterfactual,
        startGuidedFlow,
      }}
    >
      {children}
    </CounterfactualContext.Provider>
  );
};

export const useCounterfactual = () => {
  const context = useContext(CounterfactualContext);
  if (!context) {
    throw new Error(
      "useCounterfactual must be used within a CounterfactualInteractionProvider"
    );
  }
  return context;
};
