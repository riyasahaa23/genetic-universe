"use client";

import React from "react";
import { useCounterfactual } from "../interactions/CounterfactualInteractionContext";

export const MinimalRescuePanel: React.FC = () => {
  const { selectedCandidate, activeWorkflowStep, showTooltip, hideTooltip } = useCounterfactual();

  const isMinimal = selectedCandidate.isMinimal;
  const minimalRescue = selectedCandidate.minimalRescue;
  const isStep4Active = activeWorkflowStep === 4;

  const getInterventionVerdict = () => {
    if (selectedCandidate.id === 1) {
      return "Minimal single-locus intervention — 1 change restores phenotype";
    }
    if (selectedCandidate.id === 2) {
      return "Sub-minimal — larger segment swap than necessary";
    }
    if (selectedCandidate.id === 4) {
      return "Higher-order rescue — requires 2 coordinated changes";
    }
    return isMinimal ? "Minimal candidate intervention" : "Evaluated candidate intervention";
  };

  return (
    <div
      className={`h-full bg-[#040817]/90 backdrop-blur-md border ${
        isStep4Active ? "border-cyan-500/50 shadow-[0_0_20px_rgba(56,189,248,0.15)]" : "border-slate-800/80"
      } rounded-2xl p-2.5 flex flex-col justify-between shadow-[0_4px_24px_rgba(0,0,0,0.5)] select-none transition-all duration-300`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-0.5">
        <div>
          <div className="flex items-center gap-1.5">
            <h3 className="text-xs font-bold text-white font-sans tracking-wide">
              Minimal Rescue Analysis
            </h3>
            {isStep4Active ? (
              <span className="text-[8px] font-mono px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded">
                Active Interpretation
              </span>
            ) : (
              <span className="text-[8px] font-mono px-1.5 py-0.2 bg-slate-800/80 text-slate-400 border border-slate-700/50 rounded">
                Step 4 Evaluation
              </span>
            )}
          </div>
          <p className="text-[9px] text-slate-400">
            {isStep4Active
              ? "Parsimonious perturbation resolving offspring novel phenotype."
              : "Minimal rescue analysis evaluated in Step 4"}
          </p>
        </div>
        <button
          className="w-4 h-4 rounded-full bg-slate-800/60 border border-slate-700/60 flex items-center justify-center text-[10px] text-slate-400 hover:text-cyan-300 hover:border-cyan-500/50 transition-colors flex-shrink-0"
          title="Minimal rescue details"
        >
          &gt;
        </button>
      </div>

      {/* Main Content: Left Checkmark Card + Right Metrics */}
      <div className={`grid grid-cols-12 gap-2 flex-1 items-center mt-0.5 ${isStep4Active ? "opacity-100" : "opacity-60"}`}>
        {/* Left Highlight Box */}
        <div
          className="col-span-7 bg-[#061426]/90 border border-cyan-500/30 rounded-xl p-2 flex items-center gap-2 cursor-pointer hover:border-cyan-400 transition-colors"
          onMouseEnter={(e) => {
            showTooltip({
              x: e.clientX,
              y: e.clientY,
              title: isStep4Active ? "Minimal Rescue Set" : "Minimal Rescue Analysis",
              subtitle: isStep4Active ? "Minimal within evaluated candidate subset" : "Minimal rescue analysis evaluated in Step 4",
              badge: isMinimal ? "MINIMAL SUFFICIENCY" : "EVALUATED SUBSET",
              badgeColor: "bg-cyan-950/70 text-cyan-300 border-cyan-500/40",
              details: [
                { label: "Target locus", value: selectedCandidate.target, color: "#f6c85f" },
                { label: "Cardinality", value: `k = ${minimalRescue?.minimal_cardinality ?? 1}`, color: "#34d399" },
                { label: "Rescue set", value: minimalRescue?.minimal_rescue_sets.join(", ") ?? "{Locus 3}", color: "#38bdf8" },
                { label: "Exhaustive?", value: "False (Subset bound)", color: "#f472b6" },
              ],
            });
          }}
          onMouseLeave={hideTooltip}
        >
          <div className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-400/80 flex items-center justify-center text-cyan-300 text-xs font-bold flex-shrink-0 shadow-[0_0_10px_rgba(56,189,248,0.5)]">
            {isMinimal ? "✓" : "•"}
          </div>
          <div className="leading-tight min-w-0">
            <div className="text-[9.5px] font-bold text-white truncate" title={getInterventionVerdict()}>
              {getInterventionVerdict()}
            </div>
            <div className="text-[9px] font-mono text-cyan-300 font-semibold truncate">
              {minimalRescue?.minimal_rescue_sets ? minimalRescue.minimal_rescue_sets[0] : `(${selectedCandidate.target})`}
            </div>
            <div className="text-[8px] text-slate-400">
              k = {minimalRescue?.minimal_cardinality ?? 1} | Δ {minimalRescue?.joint_delta ?? selectedCandidate.predictedDelta}
            </div>
          </div>
        </div>

        {/* Right Metrics */}
        <div className="col-span-5 flex flex-col justify-center space-y-0.5 pl-1 text-[9px]">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Cardinality</span>
            <span className="font-mono text-white font-medium">
              k = {minimalRescue?.minimal_cardinality ?? 1}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Joint Pheno</span>
            <span className="font-mono text-cyan-400 font-medium">
              +{minimalRescue?.joint_phenotype ?? selectedCandidate.newPhenotype}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Novelty Rmv</span>
            <span className="font-mono text-emerald-400 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              {minimalRescue?.novelty_removed ? "True" : "Partial"}
            </span>
          </div>
        </div>
      </div>

      {/* Mandatory Caveat Banner for Scientific Honesty */}
      <div className="pt-1 mt-0.5 border-t border-slate-800/60 flex items-center justify-between text-[7.5px]">
        <div className="flex items-center gap-1 text-amber-300 font-medium">
          <span>⚠</span>
          <span className="font-semibold tracking-wide">
            Minimal within evaluated candidate subset
          </span>
        </div>
        <span className="text-slate-500 font-mono truncate max-w-[130px]" title={minimalRescue?.search_status}>
          {minimalRescue?.search_status ?? "Evaluated candidate subset"}
        </span>
      </div>
    </div>
  );
};
