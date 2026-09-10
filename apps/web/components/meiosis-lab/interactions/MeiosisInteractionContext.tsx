"use client";

import React, { createContext, useContext, useState } from "react";

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

export type MeiosisElement =
  | "homolog_maternal"
  | "homolog_paternal"
  | "maternal_homolog"
  | "paternal_homolog"
  | "chiasma"
  | "chromatid_1"
  | "chromatid_2"
  | "chromatid_3"
  | "chromatid_4"
  | "gamete_1"
  | "gamete_2"
  | "gamete_3"
  | "gamete_4"
  | `stage_${number}`
  | null;

export type MeiosisPhaseName = "prophase" | "metaphase" | "anaphase" | "telophase";

interface MeiosisInteractionContextType {
  activeStage: number; // 1..5
  setActiveStage: (s: number) => void;
  activePhase: number; // 0..3 (Prophase I, Metaphase I, Anaphase I, Telophase I/II)
  setActivePhase: (p: number) => void;
  phaseName: MeiosisPhaseName;
  setPhaseByName: (name: MeiosisPhaseName) => void;
  isExplorationMode: boolean;
  setIsExplorationMode: (v: boolean) => void;
  toggleExplorationMode: () => void;
  isExplanationOpen: boolean;
  setIsExplanationOpen: (v: boolean) => void;
  selectedHomolog: "maternal" | "paternal" | null;
  setSelectedHomolog: (h: "maternal" | "paternal" | null) => void;
  selectedChromatid: string | null;
  setSelectedChromatid: (c: string | null) => void;
  selectedGamete: string | null;
  setSelectedGamete: (g: string | null) => void;
  hoveredElement: MeiosisElement;
  setHoveredElement: (el: MeiosisElement) => void;
  showLabels: boolean;
  setShowLabels: (v: boolean) => void;
  showCrossoverPoints: boolean;
  setShowCrossoverPoints: (v: boolean) => void;
  animateProgression: boolean;
  setAnimateProgression: (v: boolean) => void;
  compareGametes: boolean;
  setCompareGametes: (v: boolean) => void;
  selectedOrganism: string;
  setSelectedOrganism: (org: string) => void;
  tooltip: TooltipState | null;
  setTooltip: (t: TooltipState | null) => void;
  reducedMotion: boolean;
  setReducedMotion: (v: boolean) => void;
  resetExploration: () => void;
}

const PHASE_NAMES: MeiosisPhaseName[] = ["prophase", "metaphase", "anaphase", "telophase"];

const MeiosisInteractionContext = createContext<MeiosisInteractionContextType>({
  activeStage: 2,
  setActiveStage: () => {},
  activePhase: 0,
  setActivePhase: () => {},
  phaseName: "prophase",
  setPhaseByName: () => {},
  isExplorationMode: false,
  setIsExplorationMode: () => {},
  toggleExplorationMode: () => {},
  isExplanationOpen: false,
  setIsExplanationOpen: () => {},
  selectedHomolog: null,
  setSelectedHomolog: () => {},
  selectedChromatid: null,
  setSelectedChromatid: () => {},
  selectedGamete: null,
  setSelectedGamete: () => {},
  hoveredElement: null,
  setHoveredElement: () => {},
  showLabels: true,
  setShowLabels: () => {},
  showCrossoverPoints: true,
  setShowCrossoverPoints: () => {},
  animateProgression: true,
  setAnimateProgression: () => {},
  compareGametes: false,
  setCompareGametes: () => {},
  selectedOrganism: "Human",
  setSelectedOrganism: () => {},
  tooltip: null,
  setTooltip: () => {},
  reducedMotion: false,
  setReducedMotion: () => {},
  resetExploration: () => {},
});

export const MeiosisInteractionProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [activeStage, setActiveStageState] = useState<number>(2); // Default to Crossover stage highlighted
  const [activePhase, setActivePhaseState] = useState<number>(0); // Prophase I default
  const [isExplorationMode, setIsExplorationMode] = useState<boolean>(false);
  const [isExplanationOpen, setIsExplanationOpen] = useState<boolean>(false);
  const [selectedHomolog, setSelectedHomolog] = useState<"maternal" | "paternal" | null>(null);
  const [selectedChromatid, setSelectedChromatid] = useState<string | null>(null);
  const [selectedGamete, setSelectedGamete] = useState<string | null>(null);
  const [hoveredElement, setHoveredElement] = useState<MeiosisElement>(null);
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [showCrossoverPoints, setShowCrossoverPoints] = useState<boolean>(true);
  const [animateProgression, setAnimateProgression] = useState<boolean>(true);
  const [compareGametes, setCompareGametes] = useState<boolean>(false);
  const [selectedOrganism, setSelectedOrganism] = useState<string>("Human");
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [reducedMotion, setReducedMotion] = useState<boolean>(false);

  const setActivePhase = (p: number) => {
    setActivePhaseState(p);
    // Align stage
    if (p === 0) setActiveStageState(2);
    else if (p === 1) setActiveStageState(1);
    else if (p === 2) setActiveStageState(4);
    else if (p === 3) setActiveStageState(5);
  };

  const setActiveStage = (s: number) => {
    setActiveStageState(s);
    if (s === 1 || s === 2 || s === 3) setActivePhaseState(0);
    else if (s === 4) setActivePhaseState(2);
    else if (s === 5) setActivePhaseState(3);
  };

  const phaseName: MeiosisPhaseName = PHASE_NAMES[activePhase] || "prophase";

  const setPhaseByName = (name: MeiosisPhaseName) => {
    const idx = PHASE_NAMES.indexOf(name);
    if (idx !== -1) {
      setActivePhase(idx);
    }
  };

  const toggleExplorationMode = () => {
    setIsExplorationMode((prev) => !prev);
  };

  const resetExploration = () => {
    setActivePhase(0);
    setActiveStage(2);
    setSelectedHomolog(null);
    setSelectedChromatid(null);
    setSelectedGamete(null);
    setHoveredElement(null);
    setCompareGametes(false);
    setTooltip(null);
  };

  return (
    <MeiosisInteractionContext.Provider
      value={{
        activeStage,
        setActiveStage,
        activePhase,
        setActivePhase,
        phaseName,
        setPhaseByName,
        isExplorationMode,
        setIsExplorationMode,
        toggleExplorationMode,
        isExplanationOpen,
        setIsExplanationOpen,
        selectedHomolog,
        setSelectedHomolog,
        selectedChromatid,
        setSelectedChromatid,
        selectedGamete,
        setSelectedGamete,
        hoveredElement,
        setHoveredElement,
        showLabels,
        setShowLabels,
        showCrossoverPoints,
        setShowCrossoverPoints,
        animateProgression,
        setAnimateProgression,
        compareGametes,
        setCompareGametes,
        selectedOrganism,
        setSelectedOrganism,
        tooltip,
        setTooltip,
        reducedMotion,
        setReducedMotion,
        resetExploration,
      }}
    >
      {children}
    </MeiosisInteractionContext.Provider>
  );
};

export const useMeiosisInteraction = () => useContext(MeiosisInteractionContext);
