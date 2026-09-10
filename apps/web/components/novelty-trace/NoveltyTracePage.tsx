"use client";

import React, { useState } from "react";
import { Navigation } from "../genetic-universe/ui/Navigation";
import {
  NoveltyTraceInteractionProvider,
  useNoveltyTrace,
} from "./interactions/NoveltyTraceInteractionContext";
import { NoveltyTraceTooltip } from "./interactions/NoveltyTraceTooltip";
import { TopWorkflowBar } from "./TopWorkflowBar";
import { VerticalTraceStages } from "./VerticalTraceStages";
import { NoveltyTraceScene } from "./scene/NoveltyTraceScene";
import { NoveltyTraceAnnotationsOverlay } from "./NoveltyTraceAnnotationsOverlay";
import { CandidateRankingPanel } from "./panels/CandidateRankingPanel";
import { PhenotypeComparisonPanel } from "./panels/PhenotypeComparisonPanel";
import { GenomicExplanationPanel } from "./panels/GenomicExplanationPanel";
import { MechanismContributionPanel } from "./panels/MechanismContributionPanel";
import { InteractionNetworkPanel } from "./panels/InteractionNetworkPanel";
import { CandidateComparisonPanel } from "./panels/CandidateComparisonPanel";
import { NoveltyTraceJourneyCards } from "./journey/NoveltyTraceJourneyCards";
import { ScientificExplanationOverlay } from "../explanations/ScientificExplanationOverlay";
import { NOVELTY_TRACE_EXPLANATION } from "../explanations/configs";
import { NoveltyTraceExplanation } from "../explanations/novelty-trace/NoveltyTraceExplanation";

const NoveltyTraceContent: React.FC = () => {
  const [isExplanationOpen, setIsExplanationOpen] = useState<boolean>(false);
  const { activeWorkflowStep, setStage } = useNoveltyTrace();

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col justify-between pt-16 pb-2 overflow-x-hidden relative select-none">
      {/* Global Navigation - Novelty Trace active */}
      <Navigation activeTab="Novelty Trace" />

      {/* Ambient Cosmic Background Lighting */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[10%] left-[20%] w-[550px] h-[550px] bg-cyan-600/10 rounded-full blur-[140px]" />
        <div className="absolute top-[35%] right-[15%] w-[600px] h-[600px] bg-pink-600/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-[10%] left-[40%] w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[130px]" />
      </div>

      {/* Master Dashboard Grid */}
      <div className="max-w-[1720px] w-full mx-auto px-6 grid grid-cols-12 gap-5 items-start relative z-10 mt-1">
        {/* ==================================================== */}
        {/* LEFT COLUMN: Hero & Attribution Context              */}
        {/* ==================================================== */}
        <div className="col-span-12 lg:col-span-3 h-[685px] flex flex-col justify-between py-1 z-20">
          <div>
            {/* Section Marker */}
            <div className="flex items-center gap-2 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#38bdf8]" />
              <span className="text-[10px] font-mono tracking-widest text-cyan-400 uppercase font-semibold">
                05 / NOVELTY TRACE
              </span>
            </div>

            {/* Hero Heading: Editorial Serif */}
            <h1 className="text-3xl lg:text-[40px] font-serif font-normal leading-[1.08] tracking-tight mb-3">
              <span className="text-white block">An Unexpected</span>
              <span className="text-white block">Phenotype.</span>
              <span className="text-[#f6c85f] italic block">What Explains It?</span>
            </h1>

            {/* Supporting Subtitle */}
            <h2 className="text-xs font-medium text-slate-300 mb-2 leading-relaxed">
              Trace the genomic configurations that can produce a novel phenotype.
            </h2>

            {/* Body Paragraph */}
            <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
              Starting from an observed phenotype, explore the most likely genomic
              configurations, key interacting variants, and the causal genetic mechanisms
              under our model.
            </p>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  const nextStep = activeWorkflowStep < 4 ? ((activeWorkflowStep + 1) as 1 | 2 | 3 | 4) : 1;
                  setStage(nextStep);
                }}
                className="px-4 py-2 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-xs font-medium shadow-[0_0_20px_rgba(56,189,248,0.4)] hover:shadow-[0_0_28px_rgba(56,189,248,0.6)] hover:scale-[1.02] transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>
                  {activeWorkflowStep === 1
                    ? "Trace the Novelty"
                    : activeWorkflowStep === 2
                    ? "Inspect Candidates"
                    : activeWorkflowStep === 3
                    ? "Analyze Mechanism"
                    : "Restart Workflow"}
                </span>
                <span>→</span>
              </button>
              <button
                onClick={() => setIsExplanationOpen(true)}
                className="px-4 py-2 rounded-full bg-[#050b18]/80 border border-slate-700/80 text-slate-300 text-xs font-medium hover:border-slate-500 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span className="text-slate-400 text-[10px]">▷</span>
                <span>Watch Explanation</span>
              </button>
            </div>
          </div>

          {/* Bottom Meta Badges, Quote & Disclaimer */}
          <div className="pt-3 border-t border-slate-800/60">
            {/* Micro Metrics Row */}
            <div className="grid grid-cols-3 gap-2 pb-3 mb-3 border-b border-slate-800/50 text-left">
              <div>
                <div className="text-[9.5px] font-bold font-mono text-cyan-300 tracking-wider">
                  REVERSE
                </div>
                <div className="text-[8px] text-slate-400 leading-tight">
                  MODEL INFERENCE
                </div>
              </div>
              <div>
                <div className="text-[9.5px] font-bold font-mono text-cyan-300 tracking-wider">
                  INTERPRETABLE
                </div>
                <div className="text-[8px] text-slate-400 leading-tight">
                  GENETIC MECHANISMS
                </div>
              </div>
              <div>
                <div className="text-[9.5px] font-bold font-mono text-cyan-300 tracking-wider">
                  MULTIPLE
                </div>
                <div className="text-[8px] text-slate-400 leading-tight">
                  PLAUSIBLE SOLUTIONS
                </div>
              </div>
            </div>

            {/* Quote */}
            <div className="mb-2">
              <p className="text-[11px] font-serif italic text-slate-400 leading-tight">
                &ldquo;From phenotype to possibility.&rdquo;
              </p>
              <p className="text-[9px] text-slate-500 mt-0.5">
                — TRACE THE UNSEEN
              </p>
            </div>

            {/* Computational Disclaimer */}
            <div className="text-[8px] font-mono tracking-widest text-slate-500 uppercase flex items-center gap-1">
              <span>—</span>
              <span>BACKWARD COMPUTATIONAL ATTRIBUTION UNDER CONFIGURED MODEL.</span>
            </div>
          </div>
        </div>

        {/* ==================================================== */}
        {/* CENTER COLUMN: Central 3D Trace Visualization Tree    */}
        {/* ==================================================== */}
        <div className="col-span-12 lg:col-span-5 h-[685px] relative flex flex-col justify-between py-0.5">
          {/* Top Workflow Bar */}
          <div className="w-full z-20">
            <TopWorkflowBar />
          </div>

          {/* Central 3D Visual with Vertical Stages and Annotations */}
          <div className="relative flex-1 min-h-0 w-full flex items-center justify-center my-1 overflow-hidden rounded-2xl bg-[#040817]/40 border border-slate-800/40">
            {/* Vertical Trace Stages on left */}
            <VerticalTraceStages />

            {/* Three.js R3F Scene */}
            <NoveltyTraceScene />

            {/* 2D Annotations Overlay */}
            <NoveltyTraceAnnotationsOverlay />
          </div>

          {/* Bottom Row of Center Column: Mechanism Contribution + Interaction Network */}
          <div className="grid grid-cols-12 gap-2 h-[195px] z-20">
            <div className="col-span-6 h-full">
              <MechanismContributionPanel />
            </div>
            <div className="col-span-6 h-full">
              <InteractionNetworkPanel />
            </div>
          </div>
        </div>

        {/* ==================================================== */}
        {/* RIGHT COLUMN: Analysis Panels Stack                  */}
        {/* ==================================================== */}
        <div className="col-span-12 lg:col-span-4 h-[685px] flex flex-col justify-between py-0.5 gap-2.5 z-20">
          {/* Row 1 (Top): Top Candidate Configurations + Parental vs Traced Phenotype */}
          <div className="grid grid-cols-12 gap-2 h-[205px]">
            <div className="col-span-6 h-full">
              <CandidateRankingPanel />
            </div>
            <div className="col-span-6 h-full">
              <PhenotypeComparisonPanel />
            </div>
          </div>

          {/* Row 2 (Middle): Genomic Explanation View (Full Width) */}
          <div className="w-full h-[245px]">
            <GenomicExplanationPanel />
          </div>

          {/* Row 3 (Bottom): Configuration Comparison (Full Width) */}
          <div className="w-full h-[195px]">
            <CandidateComparisonPanel />
          </div>
        </div>
      </div>

      {/* ==================================================== */}
      {/* BOTTOM SECTION: 3 Journey Cards + Sub-Footer         */}
      {/* ==================================================== */}
      <div className="w-full max-w-[1720px] mx-auto px-6 pb-2 pt-1 z-20 relative">
        <NoveltyTraceJourneyCards />
      </div>

      {/* Global HUD Scientific Tooltip */}
      <NoveltyTraceTooltip />

      {/* Scientific Explanation Overlay */}
      <ScientificExplanationOverlay
        config={NOVELTY_TRACE_EXPLANATION}
        isOpen={isExplanationOpen}
        onClose={() => setIsExplanationOpen(false)}
        renderScene={(currentSceneIndex, reducedMotion) => (
          <NoveltyTraceExplanation
            currentSceneIndex={currentSceneIndex}
            reducedMotion={reducedMotion}
          />
        )}
      />
    </div>
  );
};

export const NoveltyTracePage: React.FC = () => {
  return (
    <NoveltyTraceInteractionProvider>
      <NoveltyTraceContent />
    </NoveltyTraceInteractionProvider>
  );
};
