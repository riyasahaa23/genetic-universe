"use client";

import React, { useRef } from "react";
import { Navigation } from "@/components/genetic-universe/ui/Navigation";
import { PhenotypeInteractionProvider, usePhenotypeInteraction } from "./interactions/PhenotypeInteractionContext";
import { PhenotypeTooltip } from "./interactions/PhenotypeTooltip";
import { PhenotypeEngineScene } from "./scene/PhenotypeEngineScene";
import { VerticalModelPipeline } from "./VerticalModelPipeline";
import { PhenotypeAnnotationsOverlay } from "./PhenotypeAnnotationsOverlay";
import { ModelExplorerPanel } from "./panels/ModelExplorerPanel";
import { PhenotypeDistributionPanel } from "./panels/PhenotypeDistributionPanel";
import { InteractionNetworkPanel } from "./panels/InteractionNetworkPanel";
import { ContributionBreakdownPanel } from "./panels/ContributionBreakdownPanel";
import { PhenotypeComponentExplorer } from "./panels/PhenotypeComponentExplorer";
import { PhenotypeJourneyCards } from "./journey/PhenotypeJourneyCards";
import { ScientificExplanationOverlay } from "@/components/explanations/ScientificExplanationOverlay";
import { PHENOTYPE_ENGINE_EXPLANATION } from "@/components/explanations/configs";
import { PhenotypeExplanation } from "@/components/explanations/phenotype-engine/PhenotypeExplanation";

const PhenotypeEngineContent: React.FC = () => {
  const {
    isExplorationMode,
    setIsExplorationMode,
    toggleExplorationMode,
    isExplanationOpen,
    setIsExplanationOpen,
    resetInteractions,
  } = usePhenotypeInteraction();

  const exploreButtonRef = useRef<HTMLButtonElement>(null);
  const watchButtonRef = useRef<HTMLButtonElement>(null);

  const handleToggleExploration = () => {
    toggleExplorationMode();
  };

  const handleOpenExplanation = () => {
    setIsExplanationOpen(true);
  };

  const handleCloseExplanation = () => {
    setIsExplanationOpen(false);
    setTimeout(() => {
      watchButtonRef.current?.focus();
    }, 50);
  };

  return (
    <div className="relative w-full min-h-screen bg-[#030712] text-slate-100 overflow-x-hidden flex flex-col justify-between font-sans select-none">
      {/* Global Navigation Bar */}
      <Navigation activeTab="Phenotype Engine" />

      {/* Main Content Viewport: 3-column Grid */}
      <div className="w-full max-w-[1720px] mx-auto px-6 pt-[66px] grid grid-cols-12 gap-5 relative z-10">

        {/* ==================================================== */}
        {/* LEFT COLUMN: Hero Narrative, Stats & Micro-Copy      */}
        {/* ==================================================== */}
        <div className="col-span-12 lg:col-span-3 h-[685px] flex flex-col justify-between py-1 z-20 pointer-events-auto">
          {/* Top Narrative Block */}
          <div>
            {/* Eyebrow */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-mono tracking-widest text-cyan-400 uppercase font-semibold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#38bdf8]" />
                <span>04 &nbsp;/&nbsp; PHENOTYPE ENGINE</span>
              </span>
              {isExplorationMode && (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 animate-pulse uppercase tracking-wider">
                  ● Exploration Active
                </span>
              )}
            </div>

            {/* Main Heading */}
            <h1 className="text-3xl xl:text-4xl font-serif tracking-tight text-white font-normal leading-[1.12] mb-2.5">
              From Genotype<br />
              to Phenotype.
            </h1>

            {/* Accent Line */}
            <p className="text-[15px] font-serif text-[#e8c476] font-medium leading-snug mb-3">
              A Dynamic Story.
            </p>

            {/* Supporting Line */}
            <p className="text-[12px] text-slate-200 font-medium leading-snug mb-2 max-w-sm">
              The same inherited variants can contribute differently depending on how their effects combine.
            </p>

            {/* Scientific Explanation */}
            <p className="text-[11px] text-slate-400/95 leading-relaxed mb-4 max-w-sm">
              Explore how additive effects, dominance and non-linear epistatic interactions combine to produce an offspring phenotype under the configured model.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 mb-2">
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
                aria-label={isExplorationMode ? "Exit interactive exploration mode" : "Explore the Phenotype Engine interactively"}
                aria-pressed={isExplorationMode}
                className="px-4 py-2 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white text-[12px] font-medium shadow-[0_0_20px_rgba(79,70,229,0.5)] border border-indigo-400/40 flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-[#030712]"
              >
                <span>Explore the Engine</span>
                <span className="text-xs font-bold">{isExplorationMode ? "✦" : "→"}</span>
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
                aria-label="Watch scientific explanation of the Phenotype Engine"
                className="px-3.5 py-2 rounded-full bg-slate-900/80 hover:bg-slate-800/90 text-slate-300 hover:text-white text-[12px] font-medium border border-slate-700/80 flex items-center gap-2 transition-all backdrop-blur-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-[#030712]"
              >
                <span className="w-3.5 h-3.5 rounded-full border border-slate-400 flex items-center justify-center text-[8px] pl-0.5 text-cyan-400">
                  ▶
                </span>
                <span>Watch Explanation</span>
              </button>

              {/* Subtle Exit / Reset Exploration Control */}
              {isExplorationMode && (
                <div className="flex items-center gap-2 animate-fadeIn w-full mt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsExplorationMode(false);
                      resetInteractions();
                    }}
                    aria-label="Exit interactive exploration mode"
                    className="px-3 py-1 rounded-full text-[10px] font-mono text-cyan-300 bg-cyan-950/70 border border-cyan-500/50 hover:bg-cyan-900/60 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-sm focus:outline-none focus:ring-1 focus:ring-cyan-400"
                  >
                    <span>✕</span>
                    <span>Exit Exploration</span>
                  </button>

                  <button
                    type="button"
                    onClick={resetInteractions}
                    aria-label="Reset View"
                    className="px-2.5 py-1 rounded-full text-[10px] font-mono text-slate-400 hover:text-slate-200 bg-slate-900/80 border border-slate-700/60 hover:border-slate-500 transition-all flex items-center gap-1 cursor-pointer focus:outline-none focus:ring-1 focus:ring-cyan-400"
                  >
                    <span>Reset View</span>
                  </button>
                </div>
              )}
            </div>
          </div>

            {/* Bottom Micro-Stats & Quotes */}
            <div className="pt-3 border-t border-slate-800/60">
              {/* 3 Stats Columns */}
              <div className="grid grid-cols-3 gap-2 pb-2.5 mb-2.5 border-b border-slate-800/40">
                <div>
                  <div className="text-[13px] font-mono font-bold text-cyan-300 uppercase leading-tight">
                    MULTI-LOCUS
                  </div>
                  <div className="text-[9px] text-slate-400 leading-tight mt-0.5">
                    Genetic contributions
                  </div>
                </div>

                <div className="border-l border-slate-800/60 pl-2">
                  <div className="text-[13px] font-mono font-bold text-cyan-300 uppercase leading-tight">
                    NON-LINEAR
                  </div>
                  <div className="text-[9px] text-slate-400 leading-tight mt-0.5">
                    Epistatic interactions
                  </div>
                </div>

                <div className="border-l border-slate-800/60 pl-2">
                  <div className="text-[13px] font-mono font-bold text-cyan-300 uppercase leading-tight">
                    AUDITABLE
                  </div>
                  <div className="text-[9px] text-slate-400 leading-tight mt-0.5">
                    Component decomposition
                  </div>
                </div>
              </div>

              {/* Quote */}
              <div className="mb-2">
                <p className="text-[11px] font-serif italic text-slate-400 leading-tight">
                  &ldquo;Genes set the stage. Interactions write the story.&rdquo;
                </p>
                <p className="text-[9px] text-slate-500 mt-0.5">
                  — COMPLEXITY CREATES POSSIBILITY
                </p>
              </div>

              {/* Computational Disclaimer */}
              <div className="text-[8px] font-mono tracking-widest text-slate-500 uppercase flex items-center gap-1">
                <span>—</span>
                <span>COMPUTATIONAL GENOTYPE–PHENOTYPE MODEL.</span>
              </div>
            </div>
          </div>

          {/* ==================================================== */}
          {/* CENTER COLUMN: Central 3D Funnel Phenotype Engine    */}
          {/* ==================================================== */}
          <div className="col-span-12 lg:col-span-5 h-[685px] relative flex items-center justify-center">
            {/* Vertical Model Pipeline Strip on left */}
            <VerticalModelPipeline />

            {/* Trait Contribution Breakdown Panel at bottom-left */}
            <div className="absolute left-1.5 bottom-2 w-[225px] z-20 pointer-events-auto">
              <ContributionBreakdownPanel />
            </div>

            {/* Central 3D Canvas */}
            <div className="w-full h-full relative">
              <PhenotypeEngineScene />
            </div>

            {/* Annotations Overlay (Tabs, Legend, Labels, Icons) */}
            <PhenotypeAnnotationsOverlay />
          </div>

          {/* ==================================================== */}
          {/* RIGHT COLUMN: Analysis Panels Stack                  */}
          {/* ==================================================== */}
          <div className="col-span-12 lg:col-span-4 h-[685px] flex flex-col justify-between py-0.5 gap-2.5 z-20">
            {/* Row 1 (Top): Trait Simulation + Phenotype Distribution */}
            <div className="grid grid-cols-12 gap-2 h-[205px]">
              <div className="col-span-6 h-full">
                <ModelExplorerPanel />
              </div>
              <div className="col-span-6 h-full">
                <PhenotypeDistributionPanel />
              </div>
            </div>

            {/* Row 2 (Middle): Gene Interaction Network (Full Width) */}
            <div className="w-full h-[235px]">
              <InteractionNetworkPanel />
            </div>

            {/* Row 3 (Bottom): Phenotype Component Explorer (Full Width) */}
            <div className="w-full h-[200px]">
              <PhenotypeComponentExplorer />
            </div>
          </div>
        </div>

        {/* ==================================================== */}
        {/* BOTTOM SECTION: 3 Journey Cards + Sub-Footer         */}
        {/* ==================================================== */}
        <div className="w-full max-w-[1720px] mx-auto px-6 pb-2 pt-1 z-20 relative">
          <PhenotypeJourneyCards />
        </div>

        {/* Global HUD Scientific Tooltip */}
        <PhenotypeTooltip />

        {/* Scientific Explanation Cinematic Overlay */}
        <ScientificExplanationOverlay
          config={PHENOTYPE_ENGINE_EXPLANATION}
          isOpen={isExplanationOpen}
          onClose={handleCloseExplanation}
          renderScene={(currentSceneIndex, reducedMotion) => (
            <PhenotypeExplanation
              currentSceneIndex={currentSceneIndex}
              reducedMotion={reducedMotion}
            />
          )}
        />
      </div>
  );
};

export const PhenotypeEnginePage: React.FC = () => {
  return (
    <PhenotypeInteractionProvider>
      <PhenotypeEngineContent />
    </PhenotypeInteractionProvider>
  );
};
