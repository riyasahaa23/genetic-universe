"use client";

import React, { useRef } from "react";
import { Navigation } from "../genetic-universe/ui/Navigation";
import {
  ValidationInteractionProvider,
  useValidation,
} from "./ValidationInteractionContext";
import { ValidationTooltip } from "./ValidationTooltip";
import { StageNavigator } from "./StageNavigator";
import { CentralRecoveryMap } from "./CentralRecoveryMap";
import { RecoveryMetricsPanel } from "./panels/RecoveryMetricsPanel";
import { BenchmarkRegimesPanel } from "./panels/BenchmarkRegimesPanel";
import { GeneralizationPanel } from "./panels/GeneralizationPanel";
import { ResidualAnalysisPanel } from "./panels/ResidualAnalysisPanel";
import { BiologicalPlausibilityPanel } from "./panels/BiologicalPlausibilityPanel";
import { ModelConfidenceLimitationsPanel } from "./panels/ModelConfidenceLimitationsPanel";
import { ValidationJourneyCards } from "./journey/ValidationJourneyCards";
import { ScientificExplanationOverlay } from "../explanations/ScientificExplanationOverlay";
import { VALIDATION_EXPLANATION } from "../explanations/configs";
import { ValidationExplanation } from "../explanations/validation/ValidationExplanation";

const ValidationContent: React.FC = () => {
  const {
    isExplorationMode,
    startExploration,
    exitExploration,
    resetValidation,
    isExplanationOpen,
    setIsExplanationOpen,
  } = useValidation();

  const explanationBtnRef = useRef<HTMLButtonElement>(null);

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col justify-between pt-16 pb-2 overflow-x-hidden relative select-none">
      {/* Global Navigation - Validation active */}
      <Navigation activeTab="Validation" />

      {/* Ambient Cosmic Background Lighting */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[10%] left-[20%] w-[550px] h-[550px] bg-cyan-600/10 rounded-full blur-[140px]" />
        <div className="absolute top-[35%] right-[15%] w-[600px] h-[600px] bg-pink-600/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-[10%] left-[40%] w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[130px]" />
      </div>

      {/* Master Dashboard Grid */}
      <div className="max-w-[1720px] w-full mx-auto px-6 grid grid-cols-12 gap-5 items-start relative z-10 mt-1">
        {/* ==================================================== */}
        {/* LEFT COLUMN: Hero & Validation Framing Context       */}
        {/* ==================================================== */}
        <div className="col-span-12 lg:col-span-3 h-[685px] flex flex-col justify-between py-1 z-20">
          <div>
            {/* Section Marker */}
            <div className="flex items-center gap-2 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#38bdf8]" />
              <span className="text-[10px] font-mono tracking-widest text-cyan-400 uppercase font-semibold">
                07 / VALIDATION
              </span>
            </div>

            {/* Hero Heading: Editorial Serif */}
            <h1 className="text-3xl lg:text-[40px] font-serif font-normal leading-[1.08] tracking-tight mb-3">
              <span className="text-white block">From Model</span>
              <span className="text-white block">to Confidence.</span>
              <span className="text-[#f6c85f] block">Does It Hold Up?</span>
            </h1>

            {/* Body Paragraphs */}
            <p className="text-[11px] text-slate-300 leading-relaxed mb-2.5">
              Evaluate how well the model explains observed phenotypes and generalizes beyond
              the training data.
            </p>
            <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
              Compare predicted vs. observed phenotypes, examine model performance, and explore
              robustness across datasets and novel configurations.
            </p>

            {/* Action Buttons & Exploration Status */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <button
                  onClick={isExplorationMode ? exitExploration : startExploration}
                  className="px-4 py-2 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-xs font-medium shadow-[0_0_20px_rgba(56,189,248,0.4)] hover:shadow-[0_0_28px_rgba(56,189,248,0.6)] hover:scale-[1.02] transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span>{isExplorationMode ? "Active Exploration" : "Explore Validation"}</span>
                  <span>→</span>
                </button>
                <button
                  ref={explanationBtnRef}
                  onClick={() => setIsExplanationOpen(true)}
                  className="px-4 py-2 rounded-full bg-[#050b18]/80 border border-slate-700/80 text-slate-300 text-xs font-medium hover:border-slate-500 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="text-slate-400 text-[10px]">▷</span>
                  <span>Watch Explanation</span>
                </button>
              </div>

              {/* Exploration Indicator when active */}
              {isExplorationMode && (
                <div className="flex items-center gap-2 pt-1 animate-in fade-in duration-200">
                  <span className="px-2.5 py-0.5 rounded-full bg-cyan-950/70 border border-cyan-500/40 text-[9.5px] font-mono text-cyan-300 flex items-center gap-1.5 shadow-[0_0_8px_rgba(56,189,248,0.3)]">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                    <span>Validation Exploration</span>
                  </span>
                  <button
                    onClick={resetValidation}
                    className="text-[9px] font-mono text-slate-400 hover:text-white transition-colors flex items-center gap-0.5 px-2 py-0.5 rounded bg-slate-900/60 border border-slate-800 hover:border-slate-700 cursor-pointer"
                    title="Reset View"
                  >
                    <span>↺</span>
                    <span>Reset</span>
                  </button>
                  <button
                    onClick={exitExploration}
                    className="text-[9px] font-mono text-slate-400 hover:text-white transition-colors flex items-center gap-0.5 px-2 py-0.5 rounded bg-slate-900/60 border border-slate-800 hover:border-slate-700 cursor-pointer"
                    title="Exit Exploration"
                  >
                    <span>✕</span>
                    <span>Exit</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Meta Badges, Quote & Framing */}
          <div className="pt-3 border-t border-slate-800/60">
            {/* Micro Metrics Row */}
            <div className="grid grid-cols-3 gap-2 pb-3 mb-3 border-b border-slate-800/50 text-left">
              <div>
                <div className="text-[9.5px] font-bold font-mono text-cyan-300 tracking-wider">
                  RIGOROUS
                </div>
                <div className="text-[8px] text-slate-400 leading-tight">
                  Model evaluation
                </div>
              </div>
              <div>
                <div className="text-[9.5px] font-bold font-mono text-cyan-300 tracking-wider">
                  TRANSPARENT
                </div>
                <div className="text-[8px] text-slate-400 leading-tight">
                  Performance metrics
                </div>
              </div>
              <div>
                <div className="text-[9.5px] font-bold font-mono text-cyan-300 tracking-wider">
                  GENERALIZABLE
                </div>
                <div className="text-[8px] text-slate-400 leading-tight">
                  Real-world relevance
                </div>
              </div>
            </div>

            {/* Quote */}
            <div className="mb-2">
              <p className="text-[11px] font-serif italic text-slate-300 leading-tight">
                &ldquo;Trust in science comes from what holds, not just what works.&rdquo;
              </p>
              <p className="text-[9px] text-slate-400 mt-0.5 tracking-wider font-mono uppercase">
                — VALIDATE TODAY, EXPLORE TOMORROW.
              </p>
            </div>
          </div>
        </div>

        {/* ==================================================== */}
        {/* RIGHT AREA: 2-Tier Dashboard (Upper Tier + Lower Tier)*/}
        {/* ==================================================== */}
        <div className="col-span-12 lg:col-span-9 h-[685px] flex flex-col justify-between py-0.5 gap-2.5 z-20">
          {/* -------------------------------------------------- */}
          {/* UPPER TIER: Stage Nav + Model vs Reality + Metrics */}
          {/* -------------------------------------------------- */}
          <div className="flex gap-3 h-[470px] w-full items-stretch">
            {/* Left: 5-Stage Navigator Column */}
            <div className="w-[165px] h-full flex-shrink-0">
              <StageNavigator />
            </div>

            {/* Center: Model vs. Reality Hero Visual */}
            <div className="flex-1 h-full min-w-0">
              <CentralRecoveryMap />
            </div>

            {/* Right: Metrics Stack (Top Row + Generalization Box Plots) */}
            <div className="w-[510px] h-full flex-shrink-0 flex flex-col justify-between gap-2.5">
              {/* Row 1: Performance Metrics (Left) + Trait-wise Performance (Right) */}
              <div className="grid grid-cols-2 gap-2.5 h-[195px]">
                <RecoveryMetricsPanel />
                <BenchmarkRegimesPanel />
              </div>

              {/* Row 2: Generalization to Novel Configurations */}
              <div className="w-full flex-1 min-h-0">
                <GeneralizationPanel />
              </div>
            </div>
          </div>

          {/* -------------------------------------------------- */}
          {/* LOWER TIER: Residuals + Biological Plausibility + Limitations */}
          {/* -------------------------------------------------- */}
          <div className="grid grid-cols-12 gap-3 h-[195px] w-full">
            {/* Card 1: Residual Analysis */}
            <div className="col-span-4 h-full">
              <ResidualAnalysisPanel />
            </div>

            {/* Card 2: Biological Plausibility Checks */}
            <div className="col-span-4 h-full">
              <BiologicalPlausibilityPanel />
            </div>

            {/* Card 3: Model Confidence & Limitations */}
            <div className="col-span-4 h-full">
              <ModelConfidenceLimitationsPanel />
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================== */}
      {/* BOTTOM SECTION: 3 Journey Cards + Sub-Footer         */}
      {/* ==================================================== */}
      <div className="w-full max-w-[1720px] mx-auto px-6 pb-2 pt-1 z-20 relative">
        <ValidationJourneyCards />
      </div>

      {/* Global HUD Scientific Tooltip */}
      <ValidationTooltip />

      {/* Scientific Explanation Overlay Modal */}
      <ScientificExplanationOverlay
        isOpen={isExplanationOpen}
        onClose={() => {
          setIsExplanationOpen(false);
          setTimeout(() => explanationBtnRef.current?.focus(), 50);
        }}
        config={VALIDATION_EXPLANATION}
        renderScene={(sceneIdx, reducedMotion) => (
          <ValidationExplanation currentSceneIndex={sceneIdx} reducedMotion={reducedMotion} />
        )}
      />
    </div>
  );
};

export const ValidationPage: React.FC = () => {
  return (
    <ValidationInteractionProvider>
      <ValidationContent />
    </ValidationInteractionProvider>
  );
};
