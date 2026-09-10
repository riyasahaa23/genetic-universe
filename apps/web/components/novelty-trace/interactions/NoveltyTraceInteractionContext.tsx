"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

export type TraceWorkflowStep = 1 | 2 | 3 | 4;
export type VerticalStage = 1 | 2 | 3 | 4;

export interface TooltipData {
  visible: boolean;
  x: number;
  y: number;
  title: string;
  subtitle: string;
  badge?: string;
  badgeColor?: string;
  details?: { label: string; value: string; color?: string }[];
}

export interface CandidateIdeogramSegment {
  start: number; // in Mb
  end: number;
  type: "parent_a" | "parent_b" | "breakpoint" | "locus";
  label?: string;
}

export interface CandidateVariantDetails {
  locus: string;
  allele: string;
  type: string;
  modelRole: string;
  effect: string;
  inConfiguration: string;
}

export interface CandidateConfig {
  id: string;
  num: number;
  name: string;
  type: "INTERACTION" | "SEGMENT" | "VARIANT";
  score: number;
  keyMechanism: string;
  mechanismShort: string;
  originalPhenotype: number;
  counterfactualPhenotype: number;
  delta: number;
  noveltyRemoved: boolean;
  contributionBreakdown: {
    epistasis: number;
    additive: number;
    dominance: number;
    other: number;
  };
  scoreComponents: {
    effect: number;
    provenance: number;
    stability: number;
  };
  variantDetails: CandidateVariantDetails;
  ideogramSegments: CandidateIdeogramSegment[];
  networkNodes: { id: string; name: string; isDriver?: boolean; active?: boolean }[];
  networkLinks: { source: string; target: string; strength: "Strong" | "Moderate" | "Weak" }[];
  // Formal scientific fields from attribution engine
  interactionEdgeDelta?: number;
  interactionContrast?: number;
  epistaticExcess?: number;
  synergyDirection?: "positive_synergy" | "antagonistic_nonpositive_synergy" | "approximately_additive";
  phenotypeAfterA?: number;
  phenotypeAfterB?: number;
  phenotypeAfterAb?: number;
  noveltyRemovedA?: boolean;
  noveltyRemovedB?: boolean;
  noveltyRemovedAb?: boolean;
  recombinantAssembly?: string;
  parentOrigin?: string;
  homolog?: string;
  crossoverAssociation?: string;
}

export const CANDIDATES_DATA: CandidateConfig[] = [
  {
    id: "candidate_1",
    num: 1,
    name: "Candidate 1",
    type: "INTERACTION",
    score: 0.82,
    keyMechanism: "Epistatic synergy (A × B × C)",
    mechanismShort: "Epistatic synergy\nA × B × C",
    originalPhenotype: 2.1,
    counterfactualPhenotype: 0.4,
    delta: 1.7,
    noveltyRemoved: true,
    contributionBreakdown: {
      epistasis: 45,
      additive: 25,
      dominance: 18,
      other: 12,
    },
    scoreComponents: {
      effect: 0.45,
      provenance: 0.22,
      stability: 0.15,
    },
    variantDetails: {
      locus: "3:72,431,002",
      allele: "A / G",
      type: "SNV",
      modelRole: "Epistatic (A × B)",
      effect: "+0.42",
      inConfiguration: "Present",
    },
    ideogramSegments: [
      { start: 0, end: 40, type: "parent_a", label: "Parental A origin" },
      { start: 40, end: 46, type: "breakpoint", label: "Recombination breakpoint (BP1)" },
      { start: 46, end: 72, type: "parent_b", label: "Parental B origin" },
      { start: 72, end: 76, type: "locus", label: "Interacting Locus A (72.4 Mb)" },
      { start: 76, end: 118, type: "parent_a", label: "Parental A origin" },
      { start: 118, end: 122, type: "locus", label: "Interacting Locus B (118.9 Mb)" },
      { start: 122, end: 130, type: "breakpoint", label: "Recombination breakpoint (BP2)" },
      { start: 130, end: 200, type: "parent_b", label: "Parental B origin" },
    ],
    networkNodes: [
      { id: "Gene A", name: "Gene A", isDriver: true, active: true },
      { id: "Gene B", name: "Gene B", isDriver: true, active: true },
      { id: "Gene D", name: "Gene D", active: false },
      { id: "Gene E", name: "Gene E", isDriver: true, active: true },
      { id: "Gene F", name: "Gene F", active: false },
    ],
    networkLinks: [
      { source: "Gene A", target: "Gene B", strength: "Strong" },
      { source: "Gene A", target: "Gene E", strength: "Strong" },
      { source: "Gene B", target: "Gene D", strength: "Weak" },
      { source: "Gene B", target: "Gene E", strength: "Moderate" },
      { source: "Gene E", target: "Gene F", strength: "Moderate" },
      { source: "Gene D", target: "Gene F", strength: "Weak" },
    ],
    interactionEdgeDelta: 1.70,
    interactionContrast: -0.92,
    epistaticExcess: 0.92,
    synergyDirection: "positive_synergy",
    phenotypeAfterA: 1.80,
    phenotypeAfterB: 1.60,
    phenotypeAfterAb: 0.40,
    noveltyRemovedA: false,
    noveltyRemovedB: false,
    noveltyRemovedAb: true,
    recombinantAssembly: "Chr3: Locus A (72.4 Mb) × Locus B (118.9 Mb)",
    parentOrigin: "Trans-homolog assembly (Parent A × Parent B)",
    homolog: "Homolog 1 (Maternal) ╪ Homolog 2 (Paternal)",
    crossoverAssociation: "Interval 40–46 Mb (Breakpoint BP1)",
  },
  {
    id: "candidate_2",
    num: 2,
    name: "Candidate 2",
    type: "SEGMENT",
    score: 0.67,
    keyMechanism: "Recombination-enabled segment swap",
    mechanismShort: "Recombination-enabled\nnovel configuration",
    originalPhenotype: 2.1,
    counterfactualPhenotype: 0.7,
    delta: 1.4,
    noveltyRemoved: true,
    contributionBreakdown: {
      epistasis: 28,
      additive: 42,
      dominance: 15,
      other: 15,
    },
    scoreComponents: {
      effect: 0.38,
      provenance: 0.18,
      stability: 0.11,
    },
    variantDetails: {
      locus: "3:118,924,108",
      allele: "C / T",
      type: "Recombinant Segment",
      modelRole: "Additive Dosage Block",
      effect: "+0.31",
      inConfiguration: "Transmitted",
    },
    ideogramSegments: [
      { start: 0, end: 60, type: "parent_a", label: "Parental A origin" },
      { start: 60, end: 66, type: "breakpoint", label: "Recombination breakpoint" },
      { start: 66, end: 118, type: "parent_b", label: "Parental B origin" },
      { start: 118, end: 122, type: "locus", label: "Key variant (Locus B)" },
      { start: 122, end: 160, type: "parent_b", label: "Parental B origin" },
      { start: 160, end: 165, type: "breakpoint", label: "Recombination breakpoint" },
      { start: 165, end: 200, type: "parent_a", label: "Parental A origin" },
    ],
    networkNodes: [
      { id: "Gene A", name: "Gene A", active: false },
      { id: "Gene B", name: "Gene B", isDriver: true, active: true },
      { id: "Gene D", name: "Gene D", isDriver: true, active: true },
      { id: "Gene E", name: "Gene E", active: false },
      { id: "Gene F", name: "Gene F", active: true },
    ],
    networkLinks: [
      { source: "Gene B", target: "Gene D", strength: "Strong" },
      { source: "Gene B", target: "Gene F", strength: "Moderate" },
      { source: "Gene D", target: "Gene F", strength: "Strong" },
      { source: "Gene A", target: "Gene B", strength: "Weak" },
    ],
    recombinantAssembly: "Chr3: 66–160 Mb recombinant block",
    parentOrigin: "Parent B origin (Paternal)",
    homolog: "Homolog 2 (Paternal)",
    crossoverAssociation: "Interval 60–66 Mb & 160–165 Mb",
  },
  {
    id: "candidate_3",
    num: 3,
    name: "Candidate 3",
    type: "VARIANT",
    score: 0.54,
    keyMechanism: "Rare variant combination",
    mechanismShort: "Rare variant\ncombination",
    originalPhenotype: 2.1,
    counterfactualPhenotype: 1.3,
    delta: 0.8,
    noveltyRemoved: false,
    contributionBreakdown: {
      epistasis: 20,
      additive: 35,
      dominance: 30,
      other: 15,
    },
    scoreComponents: {
      effect: 0.28,
      provenance: 0.16,
      stability: 0.10,
    },
    variantDetails: {
      locus: "3:164,209,550",
      allele: "G / A",
      type: "Rare Variant",
      modelRole: "Dominance Modifier",
      effect: "+0.22",
      inConfiguration: "Heterozygous",
    },
    ideogramSegments: [
      { start: 0, end: 95, type: "parent_b", label: "Parental B origin" },
      { start: 95, end: 100, type: "breakpoint", label: "Recombination breakpoint" },
      { start: 100, end: 164, type: "parent_a", label: "Parental A origin" },
      { start: 164, end: 168, type: "locus", label: "Key variant (Locus C)" },
      { start: 168, end: 200, type: "parent_a", label: "Parental A origin" },
    ],
    networkNodes: [
      { id: "Gene A", name: "Gene A", active: false },
      { id: "Gene B", name: "Gene B", active: false },
      { id: "Gene D", name: "Gene D", active: false },
      { id: "Gene E", name: "Gene E", isDriver: true, active: true },
      { id: "Gene F", name: "Gene F", isDriver: true, active: true },
    ],
    networkLinks: [
      { source: "Gene E", target: "Gene F", strength: "Strong" },
      { source: "Gene A", target: "Gene E", strength: "Weak" },
    ],
    recombinantAssembly: "Chr3: 164.2 Mb single nucleotide locus",
    parentOrigin: "Parent A origin (Maternal)",
    homolog: "Homolog 1 (Maternal)",
    crossoverAssociation: "Sub-telomeric flanking interval",
  },
  {
    id: "candidate_4",
    num: 4,
    name: "Candidate 4",
    type: "VARIANT",
    score: 0.42,
    keyMechanism: "Additive dosage variant",
    mechanismShort: "Additive +\ndominance",
    originalPhenotype: 2.1,
    counterfactualPhenotype: 1.5,
    delta: 0.6,
    noveltyRemoved: false,
    contributionBreakdown: {
      epistasis: 10,
      additive: 55,
      dominance: 25,
      other: 10,
    },
    scoreComponents: {
      effect: 0.22,
      provenance: 0.12,
      stability: 0.08,
    },
    variantDetails: {
      locus: "3:48,110,290",
      allele: "T / C",
      type: "Dosage Variant",
      modelRole: "Additive Locus",
      effect: "+0.18",
      inConfiguration: "Homozygous",
    },
    ideogramSegments: [
      { start: 0, end: 120, type: "parent_a", label: "Parental A origin" },
      { start: 120, end: 200, type: "parent_b", label: "Parental B origin" },
    ],
    networkNodes: [
      { id: "Gene A", name: "Gene A", active: true },
      { id: "Gene B", name: "Gene B", active: false },
      { id: "Gene D", name: "Gene D", active: false },
      { id: "Gene E", name: "Gene E", active: false },
      { id: "Gene F", name: "Gene F", active: false },
    ],
    networkLinks: [
      { source: "Gene A", target: "Gene B", strength: "Weak" },
    ],
    recombinantAssembly: "Chr3: 48.1 Mb dosage variant",
    parentOrigin: "Parent A origin (Maternal)",
    homolog: "Homolog 1 (Maternal)",
    crossoverAssociation: "Centromere-proximal region",
  },
  {
    id: "candidate_5",
    num: 5,
    name: "Candidate 5",
    type: "INTERACTION",
    score: 0.28,
    keyMechanism: "Alternative epistatic model",
    mechanismShort: "Alternative\nepistatic model",
    originalPhenotype: 2.1,
    counterfactualPhenotype: 1.7,
    delta: 0.4,
    noveltyRemoved: false,
    contributionBreakdown: {
      epistasis: 30,
      additive: 30,
      dominance: 20,
      other: 20,
    },
    scoreComponents: {
      effect: 0.14,
      provenance: 0.08,
      stability: 0.06,
    },
    variantDetails: {
      locus: "3:91,803,142",
      allele: "C / G",
      type: "SNV Pair",
      modelRole: "Secondary Epistasis",
      effect: "+0.12",
      inConfiguration: "Present",
    },
    ideogramSegments: [
      { start: 0, end: 80, type: "parent_b", label: "Parental B origin" },
      { start: 80, end: 200, type: "parent_a", label: "Parental A origin" },
    ],
    networkNodes: [
      { id: "Gene A", name: "Gene A", active: false },
      { id: "Gene B", name: "Gene B", active: true },
      { id: "Gene D", name: "Gene D", active: true },
      { id: "Gene E", name: "Gene E", active: false },
      { id: "Gene F", name: "Gene F", active: false },
    ],
    networkLinks: [
      { source: "Gene B", target: "Gene D", strength: "Moderate" },
    ],
    recombinantAssembly: "Chr3: 91.8 Mb secondary pair",
    parentOrigin: "Parent B origin (Paternal)",
    homolog: "Homolog 2 (Paternal)",
    crossoverAssociation: "Interval 75–80 Mb",
  },
];

export interface SearchSpaceStats {
  variantsCount: number;
  segmentsCount: number;
  interactionsCount: number;
  totalEvaluated: number;
  progressPct: number;
  pruningThreshold: number;
  evidenceCategories: {
    category: string;
    description: string;
    weight: number;
    status: string;
  }[];
}

export const SEARCH_SPACE_DATA: SearchSpaceStats = {
  variantsCount: 18,
  segmentsCount: 6,
  interactionsCount: 12,
  totalEvaluated: 36,
  progressPct: 100,
  pruningThreshold: 0.25,
  evidenceCategories: [
    { category: "Phenotype Effect (Δy)", description: "Counterfactual trait ablation delta", weight: 45, status: "Evaluated" },
    { category: "Provenance Support", description: "Haplotype & crossover transmission tracking", weight: 30, status: "Evaluated" },
    { category: "Recombination Association", description: "Proximity to crossover chiasma breakpoints", weight: 15, status: "Evaluated" },
    { category: "Model Stability", description: "Resistance to stochastic background noise", weight: 10, status: "Evaluated" },
  ],
};

export const BASELINE_MODEL_COMPONENTS = {
  additive: 42,
  dominance: 20,
  epistasis: 26,
  other: 12,
};

interface NoveltyTraceContextType {
  activeWorkflowStep: TraceWorkflowStep;
  setActiveWorkflowStep: (step: TraceWorkflowStep) => void;
  activeTraceStage: VerticalStage;
  setActiveTraceStage: (stage: VerticalStage) => void;
  setStage: (stage: TraceWorkflowStep) => void;
  selectedCandidateId: string;
  setSelectedCandidateId: (id: string) => void;
  selectedCandidate: CandidateConfig;
  candidates: CandidateConfig[];
  hoveredCandidateId: string | null;
  setHoveredCandidateId: (id: string | null) => void;
  hoveredLocus: string | null;
  setHoveredLocus: (locus: string | null) => void;
  selectedLocus: string | null;
  setSelectedLocus: (locus: string | null) => void;
  selectedInteraction: string | null;
  setSelectedInteraction: (interaction: string | null) => void;
  tooltip: TooltipData | null;
  setTooltip: (tooltip: TooltipData | null) => void;
  parentRange: { min: number; max: number };
  parentA: { name: string; phenotype: number; label: string };
  parentB: { name: string; phenotype: number; label: string };
  observedPhenotype: number;
  noveltyMargin: number;
  isTransgressive: boolean;
  searchSpace: SearchSpaceStats;
  baselineModel: typeof BASELINE_MODEL_COMPONENTS;
}

const NoveltyTraceContext = createContext<NoveltyTraceContextType | undefined>(undefined);

export const NoveltyTraceInteractionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Synchronized stage state: Stage 1 Phenotype Input active by default to start at OBSERVE
  const [stage, setInternalStage] = useState<TraceWorkflowStep>(1);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>("candidate_1");
  const [hoveredCandidateId, setHoveredCandidateId] = useState<string | null>(null);
  const [hoveredLocus, setHoveredLocus] = useState<string | null>(null);
  const [selectedLocus, setSelectedLocus] = useState<string | null>(null);
  const [selectedInteraction, setSelectedInteraction] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);

  const setStage = (newStage: TraceWorkflowStep) => {
    setInternalStage(newStage);
  };

  const setActiveWorkflowStep = (s: TraceWorkflowStep) => {
    setInternalStage(s);
  };

  const setActiveTraceStage = (s: VerticalStage) => {
    setInternalStage(s as TraceWorkflowStep);
  };

  const selectedCandidate =
    CANDIDATES_DATA.find((c) => c.id === selectedCandidateId) || CANDIDATES_DATA[0];

  const parentRange = { min: -1.5, max: 1.0 };
  const parentA = { name: "Parent A", phenotype: -1.8, label: "Maternal line" };
  const parentB = { name: "Parent B", phenotype: 0.4, label: "Paternal line" };
  const observedPhenotype = 2.1;
  const noveltyMargin = observedPhenotype - parentRange.max; // +1.1 units beyond envelope

  return (
    <NoveltyTraceContext.Provider
      value={{
        activeWorkflowStep: stage,
        setActiveWorkflowStep,
        activeTraceStage: stage,
        setActiveTraceStage,
        setStage,
        selectedCandidateId,
        setSelectedCandidateId,
        selectedCandidate,
        candidates: CANDIDATES_DATA,
        hoveredCandidateId,
        setHoveredCandidateId,
        hoveredLocus,
        setHoveredLocus,
        selectedLocus,
        setSelectedLocus,
        selectedInteraction,
        setSelectedInteraction,
        tooltip,
        setTooltip,
        parentRange,
        parentA,
        parentB,
        observedPhenotype,
        noveltyMargin,
        isTransgressive: true,
        searchSpace: SEARCH_SPACE_DATA,
        baselineModel: BASELINE_MODEL_COMPONENTS,
      }}
    >
      {children}
    </NoveltyTraceContext.Provider>
  );
};

export const useNoveltyTrace = (): NoveltyTraceContextType => {
  const context = useContext(NoveltyTraceContext);
  if (!context) {
    throw new Error("useNoveltyTrace must be used within a NoveltyTraceInteractionProvider");
  }
  return context;
};
