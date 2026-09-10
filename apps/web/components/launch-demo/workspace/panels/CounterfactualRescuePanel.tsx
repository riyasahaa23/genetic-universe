"use client";

import React from "react";
import { useLaunchDemo } from "../../LaunchDemoContext";

export const CounterfactualRescuePanel: React.FC = () => {
  const {
    counterfactualResult,
    minimalRescueResult,
    selectedCandidate,
    executeStep7Counterfactual,
    executeStep7MinimalRescue,
    setCurrentStage,
    isRunning,
  } = useLaunchDemo();

  return (
    <div className="w-full flex flex-col justify-between h-full space-y-4 p-2 select-none text-left">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#38bdf8]" />
          <span className="text-[10px] font-mono tracking-widest text-cyan-400 uppercase font-semibold">
            Stage 07 • Counterfactual Rescue
          </span>
        </div>
        <h3 className="text-lg font-serif text-white font-normal mb-1">
          In-Silico Ablation & Minimal Rescue
        </h3>
        <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
          Simulating targeted genomic interventions to evaluate whether ablating candidate
          interactions restores the offspring phenotype into the parental envelope.
        </p>

        {/* Counterfactual Result Card */}
        {counterfactualResult ? (
          <div className="bg-[#050e20]/80 rounded-xl p-3.5 border border-slate-800/80 mb-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white font-mono text-xs">
                {counterfactualResult.candidate_name}
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase border ${
                  counterfactualResult.novelty_removed
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                    : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                }`}
              >
                {counterfactualResult.novelty_removed ? "Novelty Rescued" : "Novelty Persists"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px] pt-1 border-t border-slate-800">
              <div>
                <span className="text-slate-500">Original Phenotype:</span>
                <div className="font-mono text-slate-200">
                  {counterfactualResult.original_phenotype?.toFixed(1) || "N/A"}
                </div>
              </div>
              <div>
                <span className="text-slate-500">Counterfactual Phenotype:</span>
                <div className="font-mono text-cyan-300 font-bold">
                  {counterfactualResult.counterfactual_phenotype?.toFixed(1) || "N/A"} (Δ{" "}
                  {counterfactualResult.delta?.toFixed(2)})
                </div>
              </div>
            </div>

            {/* Pairwise Synergy Details */}
            {counterfactualResult.interaction_contrast !== undefined && (
              <div className="bg-[#030914] p-2 rounded-lg border border-slate-800/60 text-[9px] space-y-0.5">
                <div className="text-slate-400 font-mono">
                  Contrast:{" "}
                  <strong className="text-cyan-300">
                    {counterfactualResult.interaction_contrast?.toFixed(2)}
                  </strong>{" "}
                  | Epistatic Excess:{" "}
                  <strong className="text-pink-300">
                    {counterfactualResult.epistatic_excess?.toFixed(2)}
                  </strong>
                </div>
                <div className="text-slate-500">
                  Synergy:{" "}
                  <span className="text-amber-300 font-mono">
                    {counterfactualResult.synergy_direction || "positive_synergy"}
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-center text-xs text-slate-500 italic mb-3">
            Select a candidate and test in-silico ablation.
          </div>
        )}

        {/* Minimal Rescue Search Section */}
        <div className="bg-[#030d1a]/80 rounded-xl p-3 border border-cyan-500/30 text-[10px] space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-white font-mono uppercase text-[9px]">
              Minimal Rescue Search
            </span>
            <button
              onClick={executeStep7MinimalRescue}
              disabled={isRunning}
              className="px-2.5 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-[9px] font-mono transition-colors"
            >
              {isRunning ? "Searching..." : "Search Combinations"}
            </button>
          </div>

          {minimalRescueResult ? (
            <div className="space-y-1 text-[9.5px]">
              <div className="flex justify-between">
                <span className="text-slate-400">Minimal Cardinality:</span>
                <strong className="text-cyan-300 font-mono">
                  {minimalRescueResult.minimal_cardinality ?? "N/A"}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Evaluated Combinations:</span>
                <span className="font-mono text-slate-300">
                  {minimalRescueResult.evaluated_combination_count}
                </span>
              </div>
              <div className="text-[8.5px] text-amber-300/80 italic pt-1 border-t border-slate-800">
                {!minimalRescueResult.search_is_globally_exhaustive
                  ? "Minimal within evaluated candidate subset (top-K pruned)."
                  : "Globally verified minimal set."}
              </div>
            </div>
          ) : (
            <p className="text-[9px] text-slate-400 leading-tight">
              Evaluate combinations of 1, 2, or 3 interventions to find the smallest set sufficient
              to eliminate transgressive novelty.
            </p>
          )}
        </div>
      </div>

      {/* Primary CTA */}
      <div className="pt-2">
        <button
          onClick={() => setCurrentStage(8)}
          disabled={isRunning}
          className="w-full py-3 rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-cyan-500 via-indigo-600 to-emerald-500 shadow-[0_0_20px_rgba(56,189,248,0.4)] hover:shadow-[0_0_28px_rgba(56,189,248,0.6)] hover:scale-[1.01] transition-all flex items-center justify-center gap-2"
        >
          <span>Generate Final Research Summary</span>
          <span>📜</span>
        </button>
      </div>
    </div>
  );
};
