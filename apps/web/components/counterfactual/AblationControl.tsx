"use client";

import React from "react";
import { CounterfactualResult } from "@/lib/types";

interface AblationControlProps {
  selectedCandidate?: CounterfactualResult | null;
  onApplyIntervention: (candidateId: string, intervention: string) => void;
  isLoading?: boolean;
}

export const AblationControl: React.FC<AblationControlProps> = ({
  selectedCandidate,
  onApplyIntervention,
  isLoading = false,
}) => {
  const candidateId = selectedCandidate?.candidate_id || "E_L10_L31";

  return (
    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
          Counterfactual Control Studio
        </h3>
        <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
          COMPUTATIONAL COUNTERFACTUAL
        </span>
      </div>

      <p className="text-xs text-slate-400">
        Test causal faithfulness by applying controlled genetic interventions to candidate genomic loci or epistatic interactions.
      </p>

      {/* Intervention action buttons */}
      <div className="grid grid-cols-3 gap-2.5">
        <button
          disabled={isLoading}
          onClick={() => onApplyIntervention(candidateId, "break_interaction")}
          className="p-3 rounded-lg bg-slate-950 hover:bg-purple-950/40 border border-purple-500/40 hover:border-purple-400 transition-all text-left space-y-1 group disabled:opacity-50"
        >
          <div className="text-xs font-bold text-purple-300 group-hover:text-purple-200">
            [ Break Interaction ]
          </div>
          <div className="text-[10px] text-slate-400">
            Ablate epistatic interaction (γ = 0)
          </div>
        </button>

        <button
          disabled={isLoading}
          onClick={() => onApplyIntervention(candidateId, "swap_segment")}
          className="p-3 rounded-lg bg-slate-950 hover:bg-blue-950/40 border border-blue-500/40 hover:border-blue-400 transition-all text-left space-y-1 group disabled:opacity-50"
        >
          <div className="text-xs font-bold text-blue-300 group-hover:text-blue-200">
            [ Swap Segment ]
          </div>
          <div className="text-[10px] text-slate-400">
            Revert recombinant segment to homolog
          </div>
        </button>

        <button
          disabled={isLoading}
          onClick={() => onApplyIntervention(candidateId, "revert_variant")}
          className="p-3 rounded-lg bg-slate-950 hover:bg-emerald-950/40 border border-emerald-500/40 hover:border-emerald-400 transition-all text-left space-y-1 group disabled:opacity-50"
        >
          <div className="text-xs font-bold text-emerald-300 group-hover:text-emerald-200">
            [ Revert Variant ]
          </div>
          <div className="text-[10px] text-slate-400">
            Revert causal locus allele to reference
          </div>
        </button>
      </div>

      <div className="text-[11px] text-slate-500 italic text-center">
        * Computational attribution is a testable hypothesis generator and does not replace biological laboratory validation.
      </div>
    </div>
  );
};
