"use client";

import React, { useRef } from "react";
import { Navigation } from "../genetic-universe/ui/Navigation";
import {
  CounterfactualInteractionProvider,
  useCounterfactual,
} from "./interactions/CounterfactualInteractionContext";
import { CounterfactualTooltip } from "./interactions/CounterfactualTooltip";
import { TopWorkflowBar } from "./TopWorkflowBar";
import { CounterfactualScene } from "./scene/CounterfactualScene";
import { CounterfactualHeroOverlay } from "./CounterfactualHeroOverlay";
import { CandidateInterventionsPanel } from "./panels/CandidateInterventionsPanel";
import { EffectBreakdownPanel } from "./panels/EffectBreakdownPanel";
import { InteractionNetworkPanel } from "./panels/InteractionNetworkPanel";
import { MinimalRescuePanel } from "./panels/MinimalRescuePanel";
import { PhenotypeComparisonPanel } from "./panels/PhenotypeComparisonPanel";
import { GenomicContextPanel } from "./panels/GenomicContextPanel";
import { RescueLandscapePanel } from "./panels/RescueLandscapePanel";
import { CounterfactualJourneyCards } from "./journey/CounterfactualJourneyCards";
import { ScientificExplanationOverlay } from "../explanations/ScientificExplanationOverlay";
import { COUNTERFACTUAL_RESCUE_EXPLANATION } from "../explanations/configs";
import { CounterfactualExplanation } from "../explanations/counterfactual-rescue/CounterfactualExplanation";

const CounterfactualRescueContent: React.FC = () => {
  const {
    isCounterfactualMode,
    setIsCounterfactualMode,
    isExplanationOpen,
    setIsExplanationOpen,
    startGuidedFlow,
    resetCounterfactual,
  } = useCounterfactual();
  const watchBtnRef = useRef<HTMLButtonElement>(null);

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col justify-between pt-16 pb-2 overflow-x-hidden relative select-none">
      {/* Global Navigation - Counterfactual Rescue active */}
      <Navigation activeTab="Counterfactual Rescue" />

      {/* Ambient Cosmic Background Lighting */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[10%] left-[20%] w-[550px] h-[550px] bg-cyan-600/10 rounded-full blur-[140px]" />
        <div className="absolute top-[35%] right-[15%] w-[600px] h-[600px] bg-pink-600/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-[10%] left-[40%] w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[130px]" />
      </div>

      {/* Master Dashboard Grid */}
      <div className="max-w-[1720px] w-full mx-auto px-6 grid grid-cols-12 gap-5 items-start relative z-10 mt-1">
        {/* ==================================================== */}
        {/* LEFT COLUMN: Hero & Interventions Context            */}
        {/* ==================================================== */}
        <div className="col-span-12 lg:col-span-3 h-[685px] flex flex-col justify-between py-1 z-20">
          <div>
            {/* Section Marker */}
            <div className="flex items-center gap-2 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#38bdf8]" />
              <span className="text-[10px] font-mono tracking-widest text-cyan-400 uppercase font-semibold">
                06 / COUNTERFACTUAL RESCUE
              </span>
              {isCounterfactualMode && (
                <span className="px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-400/50 text-cyan-300 font-mono text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-[0_0_10px_rgba(56,189,248,0.3)] animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  Counterfactual Mode
                </span>
              )}
            </div>

            {/* Hero Heading: Editorial Serif */}
            <h1 className="text-3xl lg:text-[40px] font-serif font-normal leading-[1.08] tracking-tight mb-3">
              <span className="text-white block">What If We</span>
              <span className="text-white block">Change It?</span>
              <span className="text-[#f6c85f] block">Can We Rescue</span>
              <span className="text-[#f6c85f] block">the Phenotype?</span>
            </h1>

            {/* Body Paragraphs */}
            <p className="text-[11px] text-slate-300 leading-relaxed mb-2.5">
              Explore counterfactual genomic modifications to test whether the unexpected
              phenotype can be restored to the parental range.
            </p>
            <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
              Simulate alternative configurations, evaluate their effects under the model,
              and identify minimal changes that remove the phenotypic novelty.
            </p>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={startGuidedFlow}
                className="px-4 py-2 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-xs font-medium shadow-[0_0_20px_rgba(56,189,248,0.4)] hover:shadow-[0_0_28px_rgba(56,189,248,0.6)] hover:scale-[1.02] transition-all flex items-center gap-1.5"
              >
                <span>Run Counterfactuals</span>
                <span>→</span>
              </button>
              <button
                ref={watchBtnRef}
                type="button"
                onClick={() => setIsExplanationOpen(true)}
                className="px-4 py-2 rounded-full bg-[#050b18]/80 border border-slate-700/80 text-slate-300 text-xs font-medium hover:border-slate-500 hover:text-white transition-all flex items-center gap-1.5"
              >
                <span className="text-slate-400 text-[10px]">▷</span>
                <span>Watch Explanation</span>
              </button>
            </div>

            {/* In-Page Exploration Mode Controls */}
            {isCounterfactualMode && (
              <div className="flex items-center gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setIsCounterfactualMode(false)}
                  className="px-2.5 py-1 rounded-full bg-slate-900/80 border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white text-[10px] font-mono transition-all flex items-center gap-1"
                >
                  ✕ Exit Counterfactual
                </button>
                <button
                  type="button"
                  onClick={resetCounterfactual}
                  className="px-2.5 py-1 rounded-full bg-slate-900/80 border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white text-[10px] font-mono transition-all flex items-center gap-1"
                >
                  ↺ Reset View
                </button>
              </div>
            )}
          </div>

          {/* Bottom Meta Badges, Quote & Framing */}
          <div className="pt-3 border-t border-slate-800/60">
            {/* Micro Metrics Row */}
            <div className="grid grid-cols-3 gap-2 pb-3 mb-3 border-b border-slate-800/50 text-left">
              <div>
                <div className="text-[9.5px] font-bold font-mono text-cyan-300 tracking-wider">
                  TESTABLE
                </div>
                <div className="text-[8px] text-slate-400 leading-tight">
                  In silico interventions
                </div>
              </div>
              <div>
                <div className="text-[9.5px] font-bold font-mono text-cyan-300 tracking-wider">
                  TARGETED
                </div>
                <div className="text-[8px] text-slate-400 leading-tight">
                  Minimal genetic changes
                </div>
              </div>
              <div>
                <div className="text-[9.5px] font-bold font-mono text-cyan-300 tracking-wider">
                  INSIGHTFUL
                </div>
                <div className="text-[8px] text-slate-400 leading-tight">
                  Mechanism validation
                </div>
              </div>
            </div>

            {/* Quote */}
            <div className="mb-2">
              <p className="text-[11px] font-serif italic text-slate-300 leading-tight">
                &ldquo;Change a variant, Explore a new possibility.&rdquo;
              </p>
              <p className="text-[9px] text-slate-400 mt-0.5 tracking-wider font-mono uppercase">
                — FROM HYPOTHESIS TO INSIGHT
              </p>
            </div>
          </div>
        </div>

        {/* ==================================================== */}
        {/* CENTER COLUMN: Central 3D Scene + Lower Analysis Grid */}
        {/* ==================================================== */}
        <div className="col-span-12 lg:col-span-5 h-[685px] relative flex flex-col justify-between py-0.5 gap-2">
          {/* Top Workflow Bar */}
          <div className="w-full z-20">
            <TopWorkflowBar />
          </div>

          {/* Central 3D Visual with Chromosomes & Interactive Callouts */}
          <div className="relative w-full h-[310px] overflow-hidden rounded-2xl bg-[#040817]/40 border border-slate-800/40">
            {/* Three.js R3F Scene */}
            <CounterfactualScene />

            {/* 2D HUD Annotations Overlay */}
            <CounterfactualHeroOverlay />
          </div>

          {/* Center Lower Row 1: Candidate Modifications + Effect Breakdown */}
          <div className="grid grid-cols-12 gap-2 h-[155px] z-20">
            <div className="col-span-6 h-full">
              <CandidateInterventionsPanel />
            </div>
            <div className="col-span-6 h-full">
              <EffectBreakdownPanel />
            </div>
          </div>

          {/* Center Lower Row 2: Interaction Network + Minimal Rescue */}
          <div className="grid grid-cols-12 gap-2 h-[155px] z-20">
            <div className="col-span-6 h-full">
              <InteractionNetworkPanel />
            </div>
            <div className="col-span-6 h-full">
              <MinimalRescuePanel />
            </div>
          </div>
        </div>

        {/* ==================================================== */}
        {/* RIGHT COLUMN: Phenotype, Context & Rescue Landscape  */}
        {/* ==================================================== */}
        <div className="col-span-12 lg:col-span-4 h-[685px] flex flex-col justify-between py-0.5 gap-2.5 z-20">
          {/* Row 1: Phenotype Comparison */}
          <div className="w-full h-[225px]">
            <PhenotypeComparisonPanel />
          </div>

          {/* Row 2: Genomic Context & Variant Details */}
          <div className="w-full h-[230px]">
            <GenomicContextPanel />
          </div>

          {/* Row 3: Rescue Landscape */}
          <div className="w-full h-[205px]">
            <RescueLandscapePanel />
          </div>
        </div>
      </div>

      {/* ==================================================== */}
      {/* BOTTOM SECTION: 3 Journey Cards + Sub-Footer         */}
      {/* ==================================================== */}
      <div className="w-full max-w-[1720px] mx-auto px-6 pb-2 pt-1 z-20 relative">
        <CounterfactualJourneyCards />
      </div>

      {/* Global HUD Scientific Tooltip */}
      <CounterfactualTooltip />

      {/* 3D Cinematic Explanation Modal */}
      <ScientificExplanationOverlay
        config={COUNTERFACTUAL_RESCUE_EXPLANATION}
        isOpen={isExplanationOpen}
        onClose={() => {
          setIsExplanationOpen(false);
          setTimeout(() => watchBtnRef.current?.focus(), 50);
        }}
        renderScene={(sceneIdx, reducedMotion) => (
          <CounterfactualExplanation currentSceneIndex={sceneIdx} reducedMotion={reducedMotion} />
        )}
      />
    </div>
  );
};

export const CounterfactualRescuePage: React.FC = () => {
  return (
    <CounterfactualInteractionProvider>
      <CounterfactualRescueContent />
    </CounterfactualInteractionProvider>
  );
};
