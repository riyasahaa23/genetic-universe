"use client";

import React from "react";
import { CounterfactualResult } from "@/lib/types";

interface CandidateListProps {
  candidates: CounterfactualResult[];
  selectedCandidateId?: string;
  onSelectCandidate: (candidate: CounterfactualResult) => void;
  onApplyIntervention: (candidateId: string, intervention: string) => void;
}

export const CandidateList: React.FC<CandidateListProps> = ({
  candidates = [],
  selectedCandidateId,
  onSelectCandidate,
  onApplyIntervention,
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
          Ranked Causal Candidates (Novelty Trace)
        </h3>
        <span className="text-[11px] text-slate-400">
          Ranked by |Δ| & Attribution Score
        </span>
      </div>

      <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
        {candidates.map((cand, idx) => {
          const isSelected = cand.candidate_id === selectedCandidateId;
          const isInteraction = cand.candidate_type === "INTERACTION";
          const isSegment = cand.candidate_type === "SEGMENT";

          return (
            <div
              key={cand.candidate_id}
              onClick={() => onSelectCandidate(cand)}
              className={`p-3 rounded-lg border transition-all cursor-pointer ${
                isSelected
                  ? "bg-slate-800/90 border-amber-500 shadow-md ring-1 ring-amber-500/20"
                  : "bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-amber-400">
                      #{idx + 1}
                    </span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                        isInteraction
                          ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                          : isSegment
                          ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                          : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      }`}
                    >
                      {cand.candidate_type}
                    </span>
                    <h4 className="text-xs font-semibold text-white">
                      {cand.candidate_name}
                    </h4>
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono">
                    {cand.provenance_summary || "Provenance traced through meiotic breakpoint"}
                  </p>
                </div>

                <div className="text-right space-y-0.5">
                  <div className="text-xs font-bold text-pink-400">
                    Δ = {cand.delta > 0 ? `-${cand.delta.toFixed(1)}` : cand.delta.toFixed(1)}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Score: {cand.attribution_score.toFixed(3)}
                  </div>
                </div>
              </div>

              {isSelected && (
                <div className="mt-3 pt-2 border-t border-slate-800 flex justify-end space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const inter =
                        cand.candidate_type === "INTERACTION"
                          ? "break_interaction"
                          : cand.candidate_type === "SEGMENT"
                          ? "swap_segment"
                          : "revert_variant";
                      onApplyIntervention(cand.candidate_id, inter);
                    }}
                    className="px-3 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors shadow"
                  >
                    Run Counterfactual Ablation
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
