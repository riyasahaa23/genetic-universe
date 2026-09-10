"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

export interface ScientificTooltipData {
  visible: boolean;
  x: number;
  y: number;
  title: string;
  subtitle?: string;
  badge?: string;
  badgeColor?: string;
  details: { label: string; value: string; color?: string }[];
}

interface InteractionContextType {
  hoveredChromosome: "parent_a" | "parent_b" | "offspring" | null;
  setHoveredChromosome: (val: "parent_a" | "parent_b" | "offspring" | null) => void;
  hoveredLocus: number | null;
  setHoveredLocus: (locus: number | null) => void;
  hoveredCrossover: number | null;
  setHoveredCrossover: (crossover: number | null) => void;
  hoveredCandidate: string | null;
  setHoveredCandidate: (cand: string | null) => void;
  hoveredTrack: "parent_a" | "parent_b" | "offspring" | null;
  setHoveredTrack: (val: "parent_a" | "parent_b" | "offspring" | null) => void;
  tooltip: ScientificTooltipData | null;
  setTooltip: (tooltip: ScientificTooltipData | null) => void;
  showFlow: boolean;
  setShowFlow: (val: boolean) => void;
  isSimulating: boolean;
  setIsSimulating: (val: boolean) => void;
  reducedMotion: boolean;
  setReducedMotion: (val: boolean) => void;
}

const InteractionContext = createContext<InteractionContextType | undefined>(undefined);

export const InteractionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [hoveredChromosome, setHoveredChromosome] = useState<"parent_a" | "parent_b" | "offspring" | null>(null);
  const [hoveredLocus, setHoveredLocus] = useState<number | null>(null);
  const [hoveredCrossover, setHoveredCrossover] = useState<number | null>(null);
  const [hoveredCandidate, setHoveredCandidate] = useState<string | null>(null);
  const [hoveredTrack, setHoveredTrack] = useState<"parent_a" | "parent_b" | "offspring" | null>(null);
  const [tooltip, setTooltip] = useState<ScientificTooltipData | null>(null);
  const [showFlow, setShowFlow] = useState<boolean>(true);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [reducedMotion, setReducedMotion] = useState<boolean>(false);

  return (
    <InteractionContext.Provider
      value={{
        hoveredChromosome,
        setHoveredChromosome,
        hoveredLocus,
        setHoveredLocus,
        hoveredCrossover,
        setHoveredCrossover,
        hoveredCandidate,
        setHoveredCandidate,
        hoveredTrack,
        setHoveredTrack,
        tooltip,
        setTooltip,
        showFlow,
        setShowFlow,
        isSimulating,
        setIsSimulating,
        reducedMotion,
        setReducedMotion,
      }}
    >
      {children}
    </InteractionContext.Provider>
  );
};

export const useInteraction = () => {
  const context = useContext(InteractionContext);
  if (!context) {
    throw new Error("useInteraction must be used within an InteractionProvider");
  }
  return context;
};
