"use client";

import React, { useState, useRef, useCallback } from "react";
import { Navigation } from "@/components/genetic-universe/ui/Navigation";
import { ParadoxScene } from "./ParadoxScene";
import { PhenotypeRangePanel } from "./panels/PhenotypeRangePanel";
import { KeyFactorsPanel } from "./panels/KeyFactorsPanel";
import { VariationPathwayPanel } from "./panels/VariationPathwayPanel";
import { TraitDistributionPanel } from "./panels/TraitDistributionPanel";
import { ParadoxExamplesPanel } from "./panels/ParadoxExamplesPanel";
import { ParadoxJourneyCards } from "./journey/ParadoxJourneyCards";
import { ParadoxInteractionProvider, useParadoxInteraction } from "./interactions/ParadoxInteractionContext";
import { ParadoxTooltip } from "./interactions/ParadoxTooltip";
import { ScientificExplanationOverlay } from "../explanations/ScientificExplanationOverlay";
import { INHERITANCE_PARADOX_EXPLANATION } from "../explanations/configs";
import { InheritanceParadoxExplanation } from "../explanations/inheritance-paradox/InheritanceParadoxExplanation";

const InheritanceParadoxContent: React.FC = () => {
  const [isExplanationOpen, setIsExplanationOpen] = useState(false);
  const exploreButtonRef = useRef<HTMLButtonElement>(null);
  const watchButtonRef = useRef<HTMLButtonElement>(null);

  const {
    isExplorationMode,
    setIsExplorationMode,
    selectOrToggleElement,
    resetInteractions,
    selectedElement,
    selectedFactor,
    hoveredElement,
  } = useParadoxInteraction();

  const handleToggleExploration = useCallback(() => {
    setIsExplorationMode((prev) => {
      const next = !prev;
      if (!next) {
        resetInteractions();
      } else {
        // Visually emphasize central recombination flow initially
        selectOrToggleElement("recombination");
      }
      return next;
    });
  }, [setIsExplorationMode, resetInteractions, selectOrToggleElement]);

  const handleOpenExplanation = useCallback(() => {
    setIsExplanationOpen(true);
  }, []);

  const handleCloseExplanation = useCallback(() => {
    setIsExplanationOpen(false);
    // Return focus to Watch Explanation button after closing
    setTimeout(() => {
      watchButtonRef.current?.focus();
    }, 50);
  }, []);

  return (
    <div className="relative w-full min-h-screen bg-[#030712] text-slate-100 overflow-x-hidden select-none font-sans">
      {/* Navigation Bar */}
      <Navigation activeTab="Inheritance Paradox" />

      {/* 3D WebGL Background Scene */}
      <div className="fixed inset-0 w-full h-full z-0 pointer-events-none">
        <ParadoxScene />
      </div>

      {/* Global Interactive Scientific Tooltip */}
      <ParadoxTooltip />

      {/* Main Viewport Content Container */}
      <main className="relative z-10 w-full max-w-[1720px] mx-auto min-h-screen px-6 lg:px-10 pt-[68px] pb-3 flex flex-col justify-between pointer-events-none">
        {/* Top Section: Hero Copy (Left) + Scientific Control Panels (Right) */}
        <div className="w-full grid grid-cols-1 xl:grid-cols-12 gap-8 items-start pt-1">
          {/* Left Hero Content (Columns 1-4) */}
          <div className="xl:col-span-4 flex flex-col items-start pt-1 pointer-events-auto z-20">
            {/* Eyebrow */}
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-[11px] font-semibold tracking-wider text-cyan-400 uppercase">
                02 &nbsp;/&nbsp; INHERITANCE PARADOX
              </span>
              {isExplorationMode && (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 animate-pulse uppercase tracking-wider">
                  ● Exploration Active
                </span>
              )}
            </div>

            {/* Main Heading */}
            <h1 className="text-4xl lg:text-[45px] leading-[1.06] font-serif font-medium tracking-tight mb-3">
              <span className="block text-white">Same Parents.</span>
              <span className="block text-[#e8c476]">New Possibilities.</span>
            </h1>

            {/* Scientific Question Subheading */}
            <p className="text-slate-200 text-[14px] font-medium leading-snug mb-2.5 max-w-[420px]">
              Why can offspring exhibit phenotypes beyond what we expect from their parents?
            </p>

            {/* Body Paragraph */}
            <p className="text-slate-400 text-[12px] leading-relaxed mb-4 max-w-[410px]">
              Inheritance is not a simple average. Recombination, new combinations of variants, and epistatic interactions can create phenotypes that lie outside the parental range.
            </p>

            {/* CTA Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <button
                ref={exploreButtonRef}
                type="button"
                onClick={handleToggleExploration}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleToggleExploration();
                  }
                }}
                aria-label={isExplorationMode ? "Exit interactive exploration mode" : "Explore the Inheritance Paradox interactively"}
                aria-pressed={isExplorationMode}
                className="px-5 py-2.5 rounded-full text-xs font-semibold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-cyan-500 shadow-[0_0_24px_rgba(37,99,235,0.45)] hover:shadow-[0_0_32px_rgba(56,189,248,0.7)] transition-all flex items-center gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-[#030712]"
              >
                Explore the Paradox
                <span className="text-sm">{isExplorationMode ? "✦" : "→"}</span>
              </button>

              <button
                ref={watchButtonRef}
                type="button"
                onClick={handleOpenExplanation}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleOpenExplanation();
                  }
                }}
                aria-label="Watch scientific explanation of the Inheritance Paradox"
                className="px-4 py-2.5 rounded-full text-xs font-medium text-slate-200 bg-[#070e20]/80 border border-slate-700/70 hover:bg-slate-800/80 hover:border-slate-600 transition-all flex items-center gap-2 cursor-pointer shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-[#030712]"
              >
                <span className="text-[10px] text-cyan-400">▶</span>
                Watch Explanation
              </button>

              {/* Subtle Exit / Reset Exploration Control */}
              {isExplorationMode && (
                <div className="flex items-center gap-2 animate-fadeIn">
                  <button
                    type="button"
                    onClick={() => {
                      setIsExplorationMode(false);
                      resetInteractions();
                    }}
                    aria-label="Exit interactive exploration mode"
                    className="px-3 py-1.5 rounded-full text-[11px] font-mono text-cyan-300 bg-cyan-950/70 border border-cyan-500/50 hover:bg-cyan-900/60 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  >
                    <span>✕</span>
                    <span>Exit Exploration</span>
                  </button>

                  {(selectedElement || selectedFactor || hoveredElement) && (
                    <button
                      type="button"
                      onClick={resetInteractions}
                      aria-label="Reset View"
                      className="px-2.5 py-1.5 rounded-full text-[11px] font-mono text-slate-400 hover:text-slate-200 bg-slate-900/80 border border-slate-700/60 hover:border-slate-500 transition-all flex items-center gap-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    >
                      <span>Reset View</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Subtle Bottom Hero Tag */}
            <div className="text-[9px] font-mono tracking-[0.25em] text-slate-400 uppercase">
              VARIATION DRIVES BIOLOGICAL TOMORROW
            </div>
          </div>

          {/* Spacer for Center 3D Interactive Canvas (Columns 5-7) */}
          <div className="hidden xl:block xl:col-span-4 h-full pointer-events-none" />

          {/* Right Side Panels (Columns 8-12) */}
          <div className="xl:col-span-4 flex flex-col gap-3 pointer-events-auto z-20">
            <PhenotypeRangePanel />
            <KeyFactorsPanel />
          </div>
        </div>

        {/* Middle/Lower Section: 3 Horizontal Scientific Analysis Panels */}
        <div id="pathway-section" className="w-full grid grid-cols-1 xl:grid-cols-12 gap-3.5 mt-3 pointer-events-auto z-20">
          {/* Panel 1: Variation Pathway (Cols 1-4) */}
          <div className="xl:col-span-4 flex">
            <VariationPathwayPanel />
          </div>

          {/* Panel 2: Interactive Trait Distribution (Cols 5-8) */}
          <div className="xl:col-span-4 flex">
            <TraitDistributionPanel />
          </div>

          {/* Panel 3: Paradox Examples (Cols 9-12) */}
          <div className="xl:col-span-4 flex">
            <ParadoxExamplesPanel />
          </div>
        </div>

        {/* Bottom Journey Navigation Bar */}
        <div className="w-full mt-3 pointer-events-auto z-20">
          <ParadoxJourneyCards />
        </div>

        {/* Bottom-most Scientific Micro-Footer */}
        <div className="w-full flex items-center justify-between text-[8.5px] font-mono tracking-[0.25em] text-slate-400/80 uppercase pt-2 pb-1 border-t border-slate-900/60 mt-1.5 pointer-events-auto">
          <span>SAME GENES. NEW WORLDS.</span>
          <div className="flex items-center gap-1.5 text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer">
            <span>⌄</span>
            <span>SCROLL TO EXPLORE THE PARADOX</span>
          </div>
          <span>SCIENCE / VISUALIZATION / POSSIBILITIES</span>
        </div>
      </main>

      {/* Scientific Explanation Cinematic Overlay */}
      <ScientificExplanationOverlay
        config={INHERITANCE_PARADOX_EXPLANATION}
        isOpen={isExplanationOpen}
        onClose={handleCloseExplanation}
        renderScene={(currentSceneIndex, reducedMotion) => (
          <InheritanceParadoxExplanation
            currentSceneIndex={currentSceneIndex}
            reducedMotion={reducedMotion}
          />
        )}
      />
    </div>
  );
};

export const InheritanceParadoxPage: React.FC = () => {
  return (
    <ParadoxInteractionProvider>
      <InheritanceParadoxContent />
    </ParadoxInteractionProvider>
  );
};
