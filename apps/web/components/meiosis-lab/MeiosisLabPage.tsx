"use client";

import React, { useRef } from "react";
import { Navigation } from "@/components/genetic-universe/ui/Navigation";
import { MeiosisInteractionProvider, useMeiosisInteraction } from "./interactions/MeiosisInteractionContext";
import { MeiosisTooltip } from "./interactions/MeiosisTooltip";
import { MeiosisScene } from "./canvas/MeiosisScene";
import { MeiosisStageTimeline } from "./MeiosisStageTimeline";
import { MeiosisAnnotationsOverlay } from "./MeiosisAnnotationsOverlay";
import { PhaseTimelinePanel } from "./panels/PhaseTimelinePanel";
import { CrossoverInspector } from "./panels/CrossoverInspector";
import { RecombinantChromatidViewer } from "./panels/RecombinantChromatidViewer";
import { GameteOutcomesPanel } from "./panels/GameteOutcomesPanel";
import { MeiosisControlsPanel } from "./panels/MeiosisControlsPanel";
import { MeiosisJourneyCards } from "./journey/MeiosisJourneyCards";
import { ScientificExplanationOverlay } from "@/components/explanations/ScientificExplanationOverlay";
import { MEIOSIS_LAB_EXPLANATION } from "@/components/explanations/configs";
import { MeiosisExplanation } from "@/components/explanations/meiosis-lab/MeiosisExplanation";

const MeiosisLabContent: React.FC = () => {
  const {
    isExplorationMode,
    setIsExplorationMode,
    toggleExplorationMode,
    isExplanationOpen,
    setIsExplanationOpen,
    resetExploration,
  } = useMeiosisInteraction();

  const exploreButtonRef = useRef<HTMLButtonElement>(null);
  const watchButtonRef = useRef<HTMLButtonElement>(null);

  const handleCloseExplanation = () => {
    setIsExplanationOpen(false);
    setTimeout(() => {
      watchButtonRef.current?.focus();
    }, 50);
  };

  return (
    <div className="relative w-screen h-screen min-h-[900px] bg-[#030712] text-slate-100 overflow-hidden flex flex-col font-sans select-none">
      {/* Navigation Bar */}
      <Navigation activeTab="Meiosis Lab" />

      {/* Main Content Viewport: 3-column Grid starting below the 64px fixed navbar */}
      <div className="flex-1 w-full max-w-[1720px] mx-auto px-6 pt-[78px] pb-1.5 grid grid-cols-12 gap-5 relative z-10 min-h-0">

        {/* ==================================================== */}
        {/* LEFT COLUMN: Hero Narrative, Stats & Micro-Copy      */}
        {/* ==================================================== */}
        <div className="col-span-12 lg:col-span-3 flex flex-col justify-between py-1 z-20 pointer-events-auto">
          {/* Top Narrative Block */}
          <div>
            {/* Eyebrow */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-mono tracking-widest text-cyan-400 uppercase font-semibold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#38bdf8]" />
                <span>·→ 03 / MEIOSIS LAB</span>
              </span>
              {isExplorationMode && (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 animate-pulse uppercase tracking-wider">
                  ● Exploration Mode
                </span>
              )}
            </div>

            {/* Main Heading */}
            <h1 className="text-3xl xl:text-4xl font-serif tracking-tight text-white font-normal leading-[1.12] mb-2.5">
              Inside Meiotic<br />
              Recombination
            </h1>

            {/* Subtitle Accent */}
            <p className="text-[13.5px] font-sans text-[#e8c476] font-medium leading-snug mb-3">
              From two genomes to infinite possibilities.
            </p>

            {/* Body Description */}
            <p className="text-[11px] text-slate-400/95 leading-relaxed mb-4 max-w-sm">
              Trace how homologous chromosomes pair, exchange genetic material through crossover, and segregate into recombinant gametes — the engine of genetic diversity across generations.
            </p>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                ref={exploreButtonRef}
                onClick={toggleExplorationMode}
                aria-pressed={isExplorationMode}
                className={`px-4 py-2 rounded-full text-white text-[12px] font-medium shadow-[0_0_20px_rgba(79,70,229,0.5)] border border-indigo-400/40 flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] ${
                  isExplorationMode
                    ? "bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 ring-2 ring-cyan-400/50 shadow-[0_0_25px_rgba(56,189,248,0.6)]"
                    : "bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500"
                }`}
              >
                <span>Start Exploration</span>
                <span className="text-xs font-bold">{isExplorationMode ? "✦" : "→"}</span>
              </button>

              <button
                ref={watchButtonRef}
                onClick={() => setIsExplanationOpen(true)}
                aria-haspopup="dialog"
                aria-expanded={isExplanationOpen}
                className="px-3.5 py-2 rounded-full bg-slate-900/80 hover:bg-slate-800/90 text-slate-300 hover:text-white text-[12px] font-medium border border-slate-700/80 flex items-center gap-2 transition-all backdrop-blur-sm focus-visible:ring-2 focus-visible:ring-cyan-400 outline-none"
              >
                <span className="w-3.5 h-3.5 rounded-full border border-slate-400 flex items-center justify-center text-[8px] pl-0.5">
                  ▶
                </span>
                <span>Watch the Process</span>
              </button>
            </div>

            {/* In-Page Exploration Mode Controls */}
            {isExplorationMode && (
              <div className="flex items-center gap-2 mt-2.5">
                <button
                  onClick={() => {
                    setIsExplorationMode(false);
                    resetExploration();
                  }}
                  className="px-3 py-1 rounded-full bg-slate-900/90 border border-slate-700/80 hover:border-red-500/50 hover:bg-red-950/20 text-slate-300 hover:text-red-300 text-[10px] font-mono transition-all flex items-center gap-1.5"
                >
                  <span>✕</span>
                  <span>Exit Exploration</span>
                </button>
                <button
                  onClick={resetExploration}
                  className="px-3 py-1 rounded-full bg-slate-900/90 border border-slate-700/80 hover:border-cyan-500/50 hover:bg-cyan-950/20 text-slate-300 hover:text-cyan-300 text-[10px] font-mono transition-all flex items-center gap-1.5"
                >
                  <span>↺</span>
                  <span>Reset View</span>
                </button>
              </div>
            )}
          </div>

          {/* Bottom Micro-Stats & Quotes */}
          <div className="mt-3 pt-3 border-t border-slate-800/60">
            {/* 3 Stats Columns */}
            <div className="grid grid-cols-3 gap-2 pb-2.5 mb-2.5 border-b border-slate-800/40">
              <div>
                <div className="text-xl xl:text-2xl font-serif font-light text-white leading-tight">
                  4
                </div>
                <div className="text-[9px] text-slate-400 leading-tight mt-0.5">
                  Gametes per meiosis
                </div>
              </div>

              <div className="border-l border-slate-800/60 pl-2">
                <div className="text-xl xl:text-2xl font-serif font-light text-white leading-tight">
                  ~10–50
                </div>
                <div className="text-[9px] text-slate-400 leading-tight mt-0.5">
                  Crossovers per human cell
                </div>
              </div>

              <div className="border-l border-slate-800/60 pl-2">
                <div className="text-xl xl:text-2xl font-serif font-light text-white leading-tight">
                  2×
                </div>
                <div className="text-[9px] text-slate-400 leading-tight mt-0.5">
                  Genetic diversity vs. mitosis
                </div>
              </div>
            </div>

            {/* Quote */}
            <div className="mb-2.5">
              <p className="text-[11px] font-serif italic text-slate-400 leading-tight">
                &ldquo;Meiosis reshuffles the code of life.&rdquo;
              </p>
              <p className="text-[9.5px] text-slate-500 mt-0.5">
                — A more diverse tomorrow
              </p>
            </div>

            {/* Micro Tag */}
            <div className="text-[8.5px] font-mono tracking-widest text-slate-500 uppercase flex items-center gap-1">
              <span>—</span>
              <span>DIFFERENT GENOMES. BRIGHTER POSSIBILITIES.</span>
            </div>
          </div>
        </div>

        {/* ==================================================== */}
        {/* CENTER COLUMN: Interactive 3D Meiosis Pipeline        */}
        {/* ==================================================== */}
        <div className="col-span-12 lg:col-span-5 relative h-full flex items-center justify-center min-h-[500px]">
          {/* Vertical Stage Timeline Overlay on left */}
          <MeiosisStageTimeline />

          {/* Central 3D Canvas */}
          <div className="w-full h-full relative">
            <MeiosisScene />
          </div>

          {/* Annotations Overlay (Maternal/Paternal labels, Chiasma callout, Gametes 1-4) */}
          <MeiosisAnnotationsOverlay />
        </div>

        {/* ==================================================== */}
        {/* RIGHT COLUMN: Scientific Analysis Panels Stack        */}
        {/* ==================================================== */}
        <div className="col-span-12 lg:col-span-4 flex flex-col justify-between py-1 gap-2 z-20">
          {/* Top Italic Slogan aligned above Phase Timeline */}
          <div className="w-full flex justify-end pb-0.5">
            <p className="text-[11px] font-serif italic text-slate-400/90 tracking-wider">
              &ldquo;New combinations. Brighter tomorrows.&rdquo;
            </p>
          </div>

          {/* Panel 1 (Top): Phase Timeline */}
          <div className="w-full">
            <PhaseTimelinePanel />
          </div>

          {/* Row 2 (Middle): Crossover Inspector + Recombinant Chromatid Viewer */}
          <div className="grid grid-cols-12 gap-2 flex-1 min-h-0">
            <div className="col-span-7 h-full">
              <CrossoverInspector />
            </div>
            <div className="col-span-5 h-full">
              <RecombinantChromatidViewer />
            </div>
          </div>

          {/* Row 3 (Bottom): Gamete Outcomes + Interactive Controls */}
          <div className="grid grid-cols-12 gap-2 flex-1 min-h-0">
            <div className="col-span-8 h-full">
              <GameteOutcomesPanel />
            </div>
            <div className="col-span-4 h-full">
              <MeiosisControlsPanel />
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================== */}
      {/* BOTTOM SECTION: 3 Journey Cards + Footer Tag         */}
      {/* ==================================================== */}
      <div className="w-full max-w-[1720px] mx-auto px-6 pb-2 z-20 relative">
        <MeiosisJourneyCards />
      </div>

      {/* Interactive HUD Scientific Tooltip */}
      <MeiosisTooltip />

      {/* Page 3 Specific Futuristic 3D Cinematic Explanation */}
      <ScientificExplanationOverlay
        config={MEIOSIS_LAB_EXPLANATION}
        isOpen={isExplanationOpen}
        onClose={handleCloseExplanation}
        renderScene={(currentSceneIndex, reducedMotion) => (
          <MeiosisExplanation
            currentSceneIndex={currentSceneIndex}
            reducedMotion={reducedMotion}
          />
        )}
      />
    </div>
  );
};

export const MeiosisLabPage: React.FC = () => {
  return (
    <MeiosisInteractionProvider>
      <MeiosisLabContent />
    </MeiosisInteractionProvider>
  );
};
