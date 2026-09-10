"use client";

import React, { createContext, useContext, useState, useMemo } from "react";

export type ModelMode = "genotype" | "interaction" | "phenotype";
export type ComponentType = "additive" | "dominance" | "epistasis" | "combined";

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

export interface InteractionPair {
  source: string;
  target: string;
  type: string;
  coefficient: number;
  edgeDelta: number;
  contrast: number;
  epistaticExcess: number;
  synergyDirection: "synergistic" | "antagonistic";
  confidence: number;
}

interface PhenotypeInteractionContextType {
  activeMode: ModelMode;
  setActiveMode: (mode: ModelMode) => void;
  activeStage: number; // 1: Genotype, 2: Additive, 3: Dominance, 4: Epistasis, 5: Phenotype
  setActiveStage: (stage: number) => void;
  isGenotypeStage: boolean;
  isInteractionStage: boolean;
  isPhenotypeStage: boolean;
  activeComponent: ComponentType;
  setActiveComponent: (comp: ComponentType) => void;
  isExplorationMode: boolean;
  setIsExplorationMode: (val: boolean) => void;
  toggleExplorationMode: () => void;
  isExplanationOpen: boolean;
  setIsExplanationOpen: (val: boolean) => void;
  selectedLocus: string | null;
  setSelectedLocus: (locus: string | null) => void;
  hoveredLocus: string | null;
  setHoveredLocus: (locus: string | null) => void;
  selectedPair: InteractionPair | null;
  setSelectedPair: (pair: InteractionPair | null) => void;
  networkFilter: "all" | "active" | "strongest" | "selected";
  setNetworkFilter: (filter: "all" | "active" | "strongest" | "selected") => void;
  resetInteractions: () => void;

  // Model simulation inputs (Demo model controls)
  locusADosage: number; // 0, 1, 2
  setLocusADosage: (val: number) => void;
  locusBDosage: number; // 0, 1, 2
  setLocusBDosage: (val: number) => void;
  dominanceEnabled: boolean;
  setDominanceEnabled: (val: boolean) => void;
  epistasisEnabled: boolean;
  setEpistasisEnabled: (val: boolean) => void;
  selectedTrait: string;
  setSelectedTrait: (t: string) => void;

  // Dynamically derived model contributions
  contributions: {
    additive: number;
    dominance: number;
    epistasis: number;
    residual: number;
    total: number;
    additivePct: number;
    dominancePct: number;
    epistasisPct: number;
    residualPct: number;
    isTransgressive: boolean;
    parentA: number;
    parentB: number;
    offspring: number;
  };

  // Tooltip
  tooltip: TooltipState | null;
  setTooltip: (tooltip: TooltipState | null) => void;
}

const PhenotypeInteractionContext = createContext<PhenotypeInteractionContextType | null>(null);

export const defaultInteractionPair: InteractionPair = {
  source: "Gene A",
  target: "Gene B",
  type: "Pairwise epistatic term",
  coefficient: 0.42,
  edgeDelta: 0.42,
  contrast: 0.28,
  epistaticExcess: 0.14,
  synergyDirection: "synergistic",
  confidence: 0.87,
};

export const PhenotypeInteractionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeMode, setActiveModeState] = useState<ModelMode>("genotype");
  const [activeStage, setActiveStageState] = useState<number>(1);
  const [activeComponent, setActiveComponent] = useState<ComponentType>("combined");
  const [isExplorationMode, setIsExplorationMode] = useState<boolean>(false);
  const [isExplanationOpen, setIsExplanationOpen] = useState<boolean>(false);
  const [selectedLocus, setSelectedLocus] = useState<string | null>("Gene A");
  const [hoveredLocus, setHoveredLocus] = useState<string | null>(null);
  const [selectedPair, setSelectedPair] = useState<InteractionPair | null>(defaultInteractionPair);
  const [networkFilter, setNetworkFilter] = useState<"all" | "active" | "strongest" | "selected">("all");

  // Model parameters (Default values matching reference UI)
  const [locusADosage, setLocusADosage] = useState<number>(1.6);
  const [locusBDosage, setLocusBDosage] = useState<number>(0.8);
  const [dominanceEnabled, setDominanceEnabled] = useState<boolean>(true);
  const [epistasisEnabled, setEpistasisEnabled] = useState<boolean>(true);
  const [selectedTrait, setSelectedTrait] = useState<string>("Trait Expression (Model)");

  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  // Sync mode and stage
  const setActiveMode = (mode: ModelMode) => {
    setActiveModeState(mode);
    if (mode === "genotype") setActiveStageState(1);
    else if (mode === "interaction") setActiveStageState(4);
    else if (mode === "phenotype") setActiveStageState(5);
  };

  const setActiveStage = (stage: number) => {
    setActiveStageState(stage);
    if (stage === 1) setActiveModeState("genotype");
    else if (stage >= 2 && stage <= 4) setActiveModeState("interaction");
    else if (stage === 5) setActiveModeState("phenotype");
  };

  const isGenotypeStage = activeMode === "genotype" || activeStage === 1;
  const isInteractionStage = activeMode === "interaction" || (activeStage >= 2 && activeStage <= 4);
  const isPhenotypeStage = activeMode === "phenotype" || activeStage === 5;

  const toggleExplorationMode = () => {
    setIsExplorationMode((prev) => !prev);
  };

  const resetInteractions = () => {
    setSelectedLocus("Gene A");
    setHoveredLocus(null);
    setSelectedPair(defaultInteractionPair);
    setActiveComponent("combined");
    setLocusADosage(1.6);
    setLocusBDosage(0.8);
    setDominanceEnabled(true);
    setEpistasisEnabled(true);
    setNetworkFilter("all");
  };

  // Derive model metrics mathematically
  const contributions = useMemo(() => {
    // Base baseline
    const base = 0.5;
    // Additive: Sum(alpha_i * x_i)
    const additive = Number(((locusADosage * 0.48) + (locusBDosage * 0.38)).toFixed(2));
    // Dominance: Sum(beta_j * d_j) - positive magnitude contribution
    const dominance = dominanceEnabled ? Math.max(0.12, Math.abs(Number((0.25 * Math.sin(locusADosage * Math.PI) + 0.18 * Math.sin(locusBDosage * Math.PI)).toFixed(2)))) : 0;
    // Epistasis: Sum(gamma_uv * (x_u * x_v))
    const epistasis = epistasisEnabled ? Number(((locusADosage * locusBDosage) * 0.36).toFixed(2)) : 0;
    // Residual stochastic term
    const residual = 0.18;

    const total = Number((base + additive + dominance + epistasis).toFixed(2));
    const sum = Math.max(0.1, additive + dominance + epistasis + residual);

    // Exact percentages
    const additivePct = Math.round((additive / sum) * 100);
    const dominancePct = Math.round((dominance / sum) * 100);
    const epistasisPct = Math.round((epistasis / sum) * 100);
    const residualPct = Math.max(0, 100 - additivePct - dominancePct - epistasisPct);

    // Parental range envelope
    const parentA = -0.92;
    const parentB = 0.48;
    // Offspring normalized value
    const offspring = Number((total - 1.1).toFixed(2));
    const isTransgressive = offspring > Math.max(parentA, parentB) || offspring < Math.min(parentA, parentB);

    return {
      additive,
      dominance,
      epistasis,
      residual,
      total,
      additivePct,
      dominancePct,
      epistasisPct,
      residualPct,
      isTransgressive,
      parentA,
      parentB,
      offspring,
    };
  }, [locusADosage, locusBDosage, dominanceEnabled, epistasisEnabled]);

  return (
    <PhenotypeInteractionContext.Provider
      value={{
        activeMode,
        setActiveMode,
        activeStage,
        setActiveStage,
        isGenotypeStage,
        isInteractionStage,
        isPhenotypeStage,
        activeComponent,
        setActiveComponent,
        isExplorationMode,
        setIsExplorationMode,
        toggleExplorationMode,
        isExplanationOpen,
        setIsExplanationOpen,
        selectedLocus,
        setSelectedLocus,
        hoveredLocus,
        setHoveredLocus,
        selectedPair,
        setSelectedPair,
        networkFilter,
        setNetworkFilter,
        resetInteractions,
        locusADosage,
        setLocusADosage,
        locusBDosage,
        setLocusBDosage,
        dominanceEnabled,
        setDominanceEnabled,
        epistasisEnabled,
        setEpistasisEnabled,
        selectedTrait,
        setSelectedTrait,
        contributions,
        tooltip,
        setTooltip,
      }}
    >
      {children}
    </PhenotypeInteractionContext.Provider>
  );
};

export const usePhenotypeInteraction = () => {
  const context = useContext(PhenotypeInteractionContext);
  if (!context) {
    throw new Error("usePhenotypeInteraction must be used within a PhenotypeInteractionProvider");
  }
  return context;
};
