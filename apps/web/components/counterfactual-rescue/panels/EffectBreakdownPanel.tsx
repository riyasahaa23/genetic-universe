"use client";

import React from "react";
import { useCounterfactual } from "../interactions/CounterfactualInteractionContext";

export const EffectBreakdownPanel: React.FC = () => {
  const { selectedCandidate, activeWorkflowStep, showTooltip, hideTooltip } = useCounterfactual();

  const maxAbs = 2.0;

  const effects = [
    {
      label: "Additive effect",
      value: selectedCandidate.additiveEffect,
      color: "bg-cyan-400",
      textColor: "text-slate-300",
      barWidth: `${Math.min(100, (Math.abs(selectedCandidate.additiveEffect) / maxAbs) * 100)}%`,
    },
    {
      label: "Dominance effect",
      value: selectedCandidate.dominanceEffect,
      color: "bg-pink-400",
      textColor: "text-slate-300",
      barWidth: `${Math.min(100, (Math.abs(selectedCandidate.dominanceEffect) / maxAbs) * 100)}%`,
    },
    {
      label: "Epistatic interactions",
      value: selectedCandidate.epistaticEffect,
      color: "bg-amber-400",
      textColor: "text-slate-300",
      barWidth: `${Math.min(100, (Math.abs(selectedCandidate.epistaticEffect) / maxAbs) * 100)}%`,
    },
    {
      label: "Net change",
      value: selectedCandidate.netChange,
      color: "bg-cyan-400 shadow-[0_0_8px_#38bdf8]",
      textColor: "text-cyan-300 font-bold",
      barWidth: `${Math.min(100, (Math.abs(selectedCandidate.netChange) / maxAbs) * 100)}%`,
    },
  ];

  const hasPairwise = !!selectedCandidate.pairwiseMetrics && activeWorkflowStep >= 3;

  return (
    <div className="h-full bg-[#040817]/90 backdrop-blur-md border border-slate-800/80 rounded-2xl p-2.5 flex flex-col justify-between shadow-[0_4px_24px_rgba(0,0,0,0.5)] select-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-0.5">
        <div className="flex items-center gap-1.5">
          <h3 className="text-xs font-bold text-white font-sans tracking-wide">
            Effect Breakdown (Selected)
          </h3>
          {activeWorkflowStep === 3 && (
            <span className="text-[8px] font-mono px-1.5 py-0.2 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded">
              Active Evaluation
            </span>
          )}
        </div>
        <button
          className="w-4 h-4 rounded-full bg-slate-800/60 border border-slate-700/60 flex items-center justify-center text-[10px] text-slate-400 hover:text-cyan-300 hover:border-cyan-500/50 transition-colors"
          title="Effect details"
        >
          &gt;
        </button>
      </div>

      {/* Progress Bars */}
      <div className={`space-y-1 flex-1 flex flex-col justify-center ${activeWorkflowStep === 1 ? "opacity-60" : "opacity-100"}`}>
        {effects.map((eff, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between gap-2 text-[9.5px]"
            onMouseEnter={(e) => {
              showTooltip({
                x: e.clientX,
                y: e.clientY,
                title: eff.label,
                subtitle: "Decomposed counterfactual delta component",
                badge: "MECHANISTIC EFFECT",
                badgeColor: "bg-slate-800/80 text-cyan-300 border-slate-700/60",
                details: [
                  { label: "Target variant", value: selectedCandidate.target, color: "#f6c85f" },
                  { label: "Contribution", value: `${eff.value.toFixed(2)} units`, color: "#38bdf8" },
                  { label: "State", value: activeWorkflowStep >= 3 ? "Evaluated" : "Predicted", color: "#34d399" },
                ],
              });
            }}
            onMouseLeave={hideTooltip}
          >
            <span className="text-slate-400 w-32 truncate">{eff.label}</span>
            <div className="flex-1 h-1.5 bg-slate-800/70 rounded-full overflow-hidden relative">
              <div
                className={`h-full rounded-full transition-all duration-300 ${eff.color}`}
                style={{ width: eff.barWidth }}
              />
            </div>
            <span className={`w-10 text-right font-mono text-[9px] ${eff.textColor}`}>
              {eff.value > 0 ? "+" : ""}
              {eff.value.toFixed(2)}
            </span>
          </div>
        ))}
      </div>

      {/* Pairwise Non-Additivity Sub-Grid (Active in Step 3/4 for Pairwise Candidates) */}
      {hasPairwise && selectedCandidate.pairwiseMetrics && (
        <div className="my-0.5 bg-[#051726]/80 border border-cyan-500/30 rounded-lg p-1 text-[8px] font-mono">
          <div className="flex justify-between items-center text-[8.5px] font-sans font-bold text-cyan-300 mb-0.5">
            <span>Pairwise Contrast</span>
            <span className="text-pink-300 font-normal">{selectedCandidate.pairwiseMetrics.synergy_direction}</span>
          </div>
          <div className="grid grid-cols-4 gap-x-1 gap-y-0.5 text-slate-300">
            <div>ΔA: <span className="text-white">+{selectedCandidate.pairwiseMetrics.delta_a.toFixed(2)}</span></div>
            <div>ΔB: <span className="text-white">+{selectedCandidate.pairwiseMetrics.delta_b.toFixed(2)}</span></div>
            <div>ΔAB: <span className="text-cyan-300">{selectedCandidate.pairwiseMetrics.delta_ab.toFixed(2)}</span></div>
            <div>Contrast: <span className="text-amber-300">{selectedCandidate.pairwiseMetrics.interaction_contrast.toFixed(2)}</span></div>
            <div>Excess: <span className="text-pink-400">{selectedCandidate.pairwiseMetrics.epistatic_excess.toFixed(2)}</span></div>
            <div>Edge Δ: <span className="text-cyan-400">{selectedCandidate.pairwiseMetrics.interaction_edge_delta.toFixed(2)}</span></div>
            <div className="col-span-2 text-[7.5px] text-emerald-400 truncate">Coupling: Severed (0.0)</div>
          </div>
        </div>
      )}

      {/* Bottom Info Callout */}
      <div className="pt-1 border-t border-slate-800/50 flex items-start gap-1.5 text-[8.5px] text-slate-300 leading-tight">
        <span className="text-cyan-400 font-bold flex-shrink-0 mt-0.5">ⓘ</span>
        <p className="line-clamp-2">
          {activeWorkflowStep === 1
            ? "Step 1: Target selected. Effect decomposition computed upon simulation in Step 3."
            : selectedCandidate.explanation}
        </p>
      </div>
    </div>
  );
};
