"use client";

import React from "react";
import { PhenotypeBreakdown, NoveltyAssessment } from "@/lib/types";
import { ParentalRange } from "./ParentalRange";

interface PhenotypePanelProps {
  parentA?: PhenotypeBreakdown;
  parentB?: PhenotypeBreakdown;
  offspring?: PhenotypeBreakdown;
  novelty?: NoveltyAssessment;
}

export const PhenotypePanel: React.FC<PhenotypePanelProps> = ({
  parentA,
  parentB,
  offspring,
  novelty,
}) => {
  const pAVal = parentA?.total ?? 12.0;
  const pBVal = parentB?.total ?? 18.0;
  const pOVal = offspring?.total ?? 31.0;
  const isTrans = novelty?.is_transgressive ?? true;
  const margin = novelty?.novelty_margin ?? 13.0;

  return (
    <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
            Phenotype Emergence & Quantitative Evaluation
          </h2>
          <p className="text-xs text-slate-400">
            Forward Simulation Phenotypic State Evaluation
          </p>
        </div>
        {isTrans && (
          <div className="px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/40 text-pink-400 text-xs font-bold flex items-center space-x-1.5 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-pink-500" />
            <span>NOVEL PHENOTYPE DETECTED (+{margin.toFixed(1)} beyond max)</span>
          </div>
        )}
      </div>

      {/* Parental Range Comparison */}
      <ParentalRange
        parentA={pAVal}
        parentB={pBVal}
        offspring={pOVal}
        isTransgressive={isTrans}
        noveltyMargin={margin}
      />

      {/* Phenotype Formula Expression */}
      {offspring && (
        <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400">Phenotype Model Formulation:</span>
          <div className="font-mono text-xs text-sky-300 break-all">
            {offspring.formula_expression}
          </div>
        </div>
      )}

      {/* Component Breakdown Cards */}
      {offspring && (
        <div className="grid grid-cols-3 gap-2.5 text-center text-xs">
          <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-slate-400 text-[11px]">Additive Component</span>
            <div className="text-base font-bold text-white mt-1">
              +{offspring.additive_component.toFixed(1)}
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-slate-400 text-[11px]">Dominance Component</span>
            <div className="text-base font-bold text-white mt-1">
              +{offspring.dominance_component.toFixed(1)}
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-950 border border-pink-500/30">
            <span className="text-pink-400 text-[11px] font-semibold">Epistatic Component</span>
            <div className="text-base font-bold text-pink-400 mt-1">
              +{offspring.epistatic_component.toFixed(1)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
