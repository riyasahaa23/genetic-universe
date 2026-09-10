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

export type HighlightedElement =
  | "parent_a"
  | "parent_b"
  | "recombination"
  | "offspring"
  | "epistasis"
  | "hidden_variation"
  | null;

export type KeyFactor = "recombination" | "epistasis" | "hidden_variation" | null;

interface ParadoxInteractionContextType {
  isExplorationMode: boolean;
  setIsExplorationMode: React.Dispatch<React.SetStateAction<boolean>>;
  selectedElement: HighlightedElement;
  setSelectedElement: (el: HighlightedElement) => void;
  selectedFactor: KeyFactor;
  setSelectedFactor: (factor: KeyFactor) => void;
  hoveredElement: HighlightedElement;
  setHoveredElement: (el: HighlightedElement) => void;
  hoveredFactor: KeyFactor;
  setHoveredFactor: (factor: KeyFactor) => void;
  hoveredStep: number | null;
  setHoveredStep: (step: number | null) => void;
  hoveredDataCluster: "parent_a" | "parent_b" | "offspring" | null;
  setHoveredDataCluster: (cluster: "parent_a" | "parent_b" | "offspring" | null) => void;
  tooltip: TooltipState | null;
  setTooltip: (t: TooltipState | null) => void;
  reducedMotion: boolean;
  setReducedMotion: (val: boolean) => void;
  selectOrToggleElement: (el: HighlightedElement) => void;
  selectOrToggleFactor: (factor: KeyFactor) => void;
  resetInteractions: () => void;
  isParentAActive: boolean;
  isParentBActive: boolean;
  isRecombinationActive: boolean;
  isOffspringActive: boolean;
  isEpistasisActive: boolean;
  isHiddenVariationActive: boolean;
}

const ParadoxInteractionContext = createContext<ParadoxInteractionContextType>({
  isExplorationMode: false,
  setIsExplorationMode: () => {},
  selectedElement: null,
  setSelectedElement: () => {},
  selectedFactor: null,
  setSelectedFactor: () => {},
  hoveredElement: null,
  setHoveredElement: () => {},
  hoveredFactor: null,
  setHoveredFactor: () => {},
  hoveredStep: null,
  setHoveredStep: () => {},
  hoveredDataCluster: null,
  setHoveredDataCluster: () => {},
  tooltip: null,
  setTooltip: () => {},
  reducedMotion: false,
  setReducedMotion: () => {},
  selectOrToggleElement: () => {},
  selectOrToggleFactor: () => {},
  resetInteractions: () => {},
  isParentAActive: false,
  isParentBActive: false,
  isRecombinationActive: false,
  isOffspringActive: false,
  isEpistasisActive: false,
  isHiddenVariationActive: false,
});

export const ParadoxInteractionProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isExplorationMode, setIsExplorationMode] = useState<boolean>(false);
  const [selectedElement, setSelectedElement] = useState<HighlightedElement>(null);
  const [selectedFactor, setSelectedFactor] = useState<KeyFactor>(null);
  const [hoveredElement, setHoveredElement] = useState<HighlightedElement>(null);
  const [hoveredFactor, setHoveredFactor] = useState<KeyFactor>(null);
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);
  const [hoveredDataCluster, setHoveredDataCluster] = useState<
    "parent_a" | "parent_b" | "offspring" | null
  >(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  const resetInteractions = () => {
    setSelectedElement(null);
    setSelectedFactor(null);
    setHoveredElement(null);
    setHoveredFactor(null);
    setHoveredStep(null);
    setHoveredDataCluster(null);
    setTooltip(null);
  };

  const selectOrToggleElement = (el: HighlightedElement) => {
    setSelectedElement((prev) => (prev === el ? null : el));
  };

  const selectOrToggleFactor = (factor: KeyFactor) => {
    setSelectedFactor((prev) => (prev === factor ? null : factor));
  };

  const isParentAActive =
    hoveredElement === "parent_a" ||
    selectedElement === "parent_a" ||
    hoveredDataCluster === "parent_a";

  const isParentBActive =
    hoveredElement === "parent_b" ||
    selectedElement === "parent_b" ||
    hoveredDataCluster === "parent_b";

  const isRecombinationActive =
    hoveredElement === "recombination" ||
    selectedElement === "recombination" ||
    hoveredFactor === "recombination" ||
    selectedFactor === "recombination" ||
    hoveredStep === 2;

  const isOffspringActive =
    hoveredElement === "offspring" ||
    selectedElement === "offspring" ||
    hoveredDataCluster === "offspring" ||
    hoveredStep === 3 ||
    hoveredStep === 4;

  const isEpistasisActive =
    hoveredElement === "epistasis" ||
    selectedElement === "epistasis" ||
    hoveredFactor === "epistasis" ||
    selectedFactor === "epistasis";

  const isHiddenVariationActive =
    hoveredElement === "hidden_variation" ||
    selectedElement === "hidden_variation" ||
    hoveredFactor === "hidden_variation" ||
    selectedFactor === "hidden_variation";

  return (
    <ParadoxInteractionContext.Provider
      value={{
        isExplorationMode,
        setIsExplorationMode,
        selectedElement,
        setSelectedElement,
        selectedFactor,
        setSelectedFactor,
        hoveredElement,
        setHoveredElement,
        hoveredFactor,
        setHoveredFactor,
        hoveredStep,
        setHoveredStep,
        hoveredDataCluster,
        setHoveredDataCluster,
        tooltip,
        setTooltip,
        reducedMotion,
        setReducedMotion,
        selectOrToggleElement,
        selectOrToggleFactor,
        resetInteractions,
        isParentAActive,
        isParentBActive,
        isRecombinationActive,
        isOffspringActive,
        isEpistasisActive,
        isHiddenVariationActive,
      }}
    >
      {children}
    </ParadoxInteractionContext.Provider>
  );
};

export const useParadoxInteraction = () => useContext(ParadoxInteractionContext);
