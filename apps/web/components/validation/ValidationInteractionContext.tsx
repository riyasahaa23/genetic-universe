"use client";

import React, { createContext, useContext, useState, useMemo, useCallback } from "react";

export type ValidationStage = 1 | 2 | 3 | 4 | 5;
export type BenchmarkRegime = "easy" | "medium" | "hard" | "all";
export type GeneralizationTab = "known" | "novel" | "unseen";
export type MetricFamily = "Overview" | "Ranking" | "Mechanism" | "Rescue";

export interface BenchmarkMetrics {
  top1Recovery: number;
  top3Recovery: number;
  recall: number;
  precision: number;
  exactInteractionRecovery: number;
  rescueEquivalenceRecovery: number;
  causalVsNullRatio: number;
  meanReciprocalRank: number;
  provenanceRecovery: number;
  causalVsNullCI: [number, number];
  recallCI: [number, number];
  precisionCI: [number, number];
  top3RecoveryCI: [number, number];
  mrrCI: [number, number];
}

export const REGIME_DATA: Record<BenchmarkRegime, BenchmarkMetrics> = {
  all: {
    top1Recovery: 0.94,
    top3Recovery: 1.0,
    recall: 0.98,
    precision: 0.67,
    exactInteractionRecovery: 0.95,
    rescueEquivalenceRecovery: 0.96,
    causalVsNullRatio: 2.27,
    meanReciprocalRank: 0.82,
    provenanceRecovery: 1.0,
    causalVsNullCI: [2.255, 2.288],
    recallCI: [0.94, 1.0],
    precisionCI: [0.61, 0.74],
    top3RecoveryCI: [0.99, 1.0],
    mrrCI: [0.78, 0.86],
  },
  easy: {
    top1Recovery: 1.0,
    top3Recovery: 1.0,
    recall: 1.0,
    precision: 0.33,
    exactInteractionRecovery: 1.0,
    rescueEquivalenceRecovery: 1.0,
    causalVsNullRatio: 2.25,
    meanReciprocalRank: 1.0,
    provenanceRecovery: 1.0,
    causalVsNullCI: [2.24, 2.26],
    recallCI: [1.0, 1.0],
    precisionCI: [0.33, 0.33],
    top3RecoveryCI: [1.0, 1.0],
    mrrCI: [1.0, 1.0],
  },
  medium: {
    top1Recovery: 0.92,
    top3Recovery: 1.0,
    recall: 1.0,
    precision: 0.67,
    exactInteractionRecovery: 1.0,
    rescueEquivalenceRecovery: 0.94,
    causalVsNullRatio: 2.04,
    meanReciprocalRank: 0.85,
    provenanceRecovery: 1.0,
    causalVsNullCI: [2.02, 2.06],
    recallCI: [0.98, 1.0],
    precisionCI: [0.63, 0.71],
    top3RecoveryCI: [1.0, 1.0],
    mrrCI: [0.81, 0.89],
  },
  hard: {
    top1Recovery: 0.89,
    top3Recovery: 1.0,
    recall: 0.95,
    precision: 1.0,
    exactInteractionRecovery: 0.86,
    rescueEquivalenceRecovery: 0.91,
    causalVsNullRatio: 2.63,
    meanReciprocalRank: 0.78,
    provenanceRecovery: 1.0,
    causalVsNullCI: [2.58, 2.68],
    recallCI: [0.91, 0.99],
    precisionCI: [0.96, 1.0],
    top3RecoveryCI: [0.98, 1.0],
    mrrCI: [0.73, 0.83],
  },
};

export interface NegativeControlCheck {
  id: string;
  name: string;
  desc: string;
  expected: string;
  observed: string;
  status: "Pass" | "Needs study" | "Expected";
  icon: string;
  iconBg: string;
  badge: string;
  badgeColor: string;
  details: { label: string; value: string; color?: string }[];
}

export const NEGATIVE_CONTROLS: NegativeControlCheck[] = [
  {
    id: "additive",
    name: "Additive Control",
    desc: "Linear baseline simulation — epistatic excess ≈ 0",
    expected: "Epistatic excess ≈ 0.00",
    observed: "Excess = 0.000 (pass)",
    status: "Pass",
    icon: "✓",
    iconBg: "bg-emerald-500/20 text-emerald-400 border border-emerald-400/60 shadow-[0_0_8px_rgba(16,185,129,0.3)]",
    badge: "ZERO NON-ADDITIVITY",
    badgeColor: "bg-emerald-950/70 text-emerald-300 border-emerald-500/40",
    details: [
      { label: "Expected non-additivity", value: "≈ 0.000", color: "#34d399" },
      { label: "Observed epistatic excess", value: "0.000", color: "#38bdf8" },
      { label: "False positive epistasis", value: "0.0%", color: "#34d399" },
    ],
  },
  {
    id: "non_transgressive",
    name: "Non-Transgressive Control",
    desc: "Offspring within parental envelope — no false rescue claims",
    expected: "0 false rescue claims",
    observed: "0 false claims (pass)",
    status: "Pass",
    icon: "✓",
    iconBg: "bg-emerald-500/20 text-emerald-400 border border-emerald-400/60 shadow-[0_0_8px_rgba(16,185,129,0.3)]",
    badge: "NO FALSE RESCUE",
    badgeColor: "bg-emerald-950/70 text-emerald-300 border-emerald-500/40",
    details: [
      { label: "Expected rescues", value: "0", color: "#34d399" },
      { label: "False rescue triggers", value: "0 / 100 seeds", color: "#38bdf8" },
      { label: "Envelope bounds check", value: "Strictly enforced", color: "#34d399" },
    ],
  },
  {
    id: "random_null",
    name: "Random Null Candidate",
    desc: "Permutation control — negligible counterfactual phenotype shift",
    expected: "Δy ≈ 0.00 units",
    observed: "Δy = +0.08 units (pass)",
    status: "Pass",
    icon: "✓",
    iconBg: "bg-emerald-500/20 text-emerald-400 border border-emerald-400/60 shadow-[0_0_8px_rgba(16,185,129,0.3)]",
    badge: "LOW PERMUTATION SHIFT",
    badgeColor: "bg-emerald-950/70 text-emerald-300 border-emerald-500/40",
    details: [
      { label: "Expected perturbation", value: "Δy < 0.15", color: "#34d399" },
      { label: "Mean null delta", value: "+0.08 units", color: "#38bdf8" },
      { label: "Causal vs null ratio", value: "15.5x separation", color: "#f472b6" },
    ],
  },
  {
    id: "unrelated_crossover",
    name: "Unrelated Crossover",
    desc: "Distant breakpoint — no automatic provenance credit",
    expected: "0% provenance credit",
    observed: "0.0% attribution (pass)",
    status: "Pass",
    icon: "✓",
    iconBg: "bg-emerald-500/20 text-emerald-400 border border-emerald-400/60 shadow-[0_0_8px_rgba(16,185,129,0.3)]",
    badge: "SPECIFIC PROVENANCE",
    badgeColor: "bg-emerald-950/70 text-emerald-300 border-emerald-500/40",
    details: [
      { label: "Expected provenance", value: "0.0%", color: "#34d399" },
      { label: "Observed attribution", value: "0.0% on unrelated locus", color: "#38bdf8" },
      { label: "Breakpoint specificity", value: "Strict window bound", color: "#34d399" },
    ],
  },
  {
    id: "large_segment",
    name: "Large Segment Swap",
    desc: "Macroscopic swap — sufficient rescue but reduced specificity",
    expected: "Rescue sufficient, low precision",
    observed: "Rescued, precision 0.25",
    status: "Expected",
    icon: "⚠",
    iconBg: "bg-amber-500/20 text-amber-400 border border-amber-400/60 shadow-[0_0_8px_rgba(245,158,11,0.3)]",
    badge: "SUB-MINIMAL RESCUE",
    badgeColor: "bg-amber-950/70 text-amber-300 border-amber-500/40",
    details: [
      { label: "Rescue outcome", value: "Sufficient (within envelope)", color: "#34d399" },
      { label: "Parsimony verdict", value: "Sub-minimal (k > 1)", color: "#fbbf24" },
      { label: "Specificity penalty", value: "Candidate precision 0.25", color: "#f87171" },
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

interface ValidationContextType {
  activeStage: ValidationStage;
  setActiveStage: (stage: ValidationStage) => void;
  isExplorationMode: boolean;
  setIsExplorationMode: (val: boolean) => void;
  toggleExplorationMode: () => void;
  startExploration: () => void;
  exitExploration: () => void;
  resetValidation: () => void;
  isExplanationOpen: boolean;
  setIsExplanationOpen: (val: boolean) => void;
  selectedRegime: BenchmarkRegime;
  setSelectedRegime: (regime: BenchmarkRegime) => void;
  activeGeneralizationTab: GeneralizationTab;
  setActiveGeneralizationTab: (tab: GeneralizationTab) => void;
  selectedMetricFamily: MetricFamily;
  setSelectedMetricFamily: (family: MetricFamily) => void;
  selectedMetric: string | null;
  setSelectedMetric: (metric: string | null) => void;
  selectedControl: string;
  setSelectedControl: (ctrlId: string) => void;
  selectedConfidenceSection: "strengths" | "limitations" | "future";
  setSelectedConfidenceSection: (sec: "strengths" | "limitations" | "future") => void;
  selectedTrait: string;
  setSelectedTrait: (trait: string) => void;
  metrics: BenchmarkMetrics;
  tooltip: TooltipState;
  showTooltip: (tooltipData: Omit<TooltipState, "visible">) => void;
  hideTooltip: () => void;
}

const ValidationContext = createContext<ValidationContextType | null>(null);

export const ValidationInteractionProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [activeStage, setActiveStage] = useState<ValidationStage>(2); // Stage 2: Model Performance (Active in reference)
  const [isExplorationMode, setIsExplorationMode] = useState<boolean>(false);
  const [isExplanationOpen, setIsExplanationOpen] = useState<boolean>(false);
  const [selectedRegime, setSelectedRegime] = useState<BenchmarkRegime>("all");
  const [activeGeneralizationTab, setActiveGeneralizationTab] =
    useState<GeneralizationTab>("novel"); // Novel Recomb (Active in reference)
  const [selectedMetricFamily, setSelectedMetricFamily] =
    useState<MetricFamily>("Overview");
  const [selectedMetric, setSelectedMetric] = useState<string | null>("Top-3 Recovery");
  const [selectedControl, setSelectedControl] = useState<string>("additive");
  const [selectedConfidenceSection, setSelectedConfidenceSection] =
    useState<"strengths" | "limitations" | "future">("strengths");
  const [selectedTrait, setSelectedTrait] = useState<string>("All Traits");

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

  const startExploration = useCallback(() => {
    setIsExplorationMode(true);
  }, []);

  const exitExploration = useCallback(() => {
    setIsExplorationMode(false);
  }, []);

  const toggleExplorationMode = useCallback(() => {
    setIsExplorationMode((prev) => !prev);
  }, []);

  const resetValidation = useCallback(() => {
    setActiveStage(2);
    setSelectedRegime("all");
    setActiveGeneralizationTab("novel");
    setSelectedMetricFamily("Overview");
    setSelectedMetric("Top-3 Recovery");
    setSelectedControl("additive");
    setSelectedConfidenceSection("strengths");
    setSelectedTrait("All Traits");
  }, []);

  const metrics = useMemo(() => {
    return REGIME_DATA[selectedRegime] || REGIME_DATA.all;
  }, [selectedRegime]);

  return (
    <ValidationContext.Provider
      value={{
        activeStage,
        setActiveStage,
        isExplorationMode,
        setIsExplorationMode,
        toggleExplorationMode,
        startExploration,
        exitExploration,
        resetValidation,
        isExplanationOpen,
        setIsExplanationOpen,
        selectedRegime,
        setSelectedRegime,
        activeGeneralizationTab,
        setActiveGeneralizationTab,
        selectedMetricFamily,
        setSelectedMetricFamily,
        selectedMetric,
        setSelectedMetric,
        selectedControl,
        setSelectedControl,
        selectedConfidenceSection,
        setSelectedConfidenceSection,
        selectedTrait,
        setSelectedTrait,
        metrics,
        tooltip,
        showTooltip,
        hideTooltip,
      }}
    >
      {children}
    </ValidationContext.Provider>
  );
};

export const useValidation = () => {
  const context = useContext(ValidationContext);
  if (!context) {
    throw new Error(
      "useValidation must be used within a ValidationInteractionProvider"
    );
  }
  return context;
};
