"use client";

import React from "react";

interface DeltaGaugeProps {
  originalPhenotype: number;
  counterfactualPhenotype: number;
  delta: number;
  noveltyRemoved: boolean;
}

export const DeltaGauge: React.FC<DeltaGaugeProps> = ({
  originalPhenotype = 31.0,
  counterfactualPhenotype = 15.0,
  delta = 16.0,
  noveltyRemoved = true,
}) => {
  const maxVal = Math.max(originalPhenotype, counterfactualPhenotype, 35);
  const origPct = (originalPhenotype / maxVal) * 100;
  const cfPct = (counterfactualPhenotype / maxVal) * 100;

  return (
    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
          Phenotype Ablation Delta Gauge
        </h4>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400">Novelty Status:</span>
          <span
            className={`px-2 py-0.5 rounded text-xs font-bold ${
              noveltyRemoved
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : "bg-pink-500/20 text-pink-400 border border-pink-500/30"
            }`}
          >
            {noveltyRemoved ? "YES → NO (Ablated)" : "REMAINS NOVEL"}
          </span>
        </div>
      </div>

      {/* Bar visual comparison */}
      <div className="space-y-3 text-xs">
        <div>
          <div className="flex justify-between text-[11px] mb-1 text-slate-400">
            <span>Original Transgressive State</span>
            <span className="font-bold text-pink-400">{originalPhenotype.toFixed(1)}</span>
          </div>
          <div className="w-full h-5 bg-slate-900 rounded overflow-hidden p-0.5 border border-slate-800">
            <div
              style={{ width: `${origPct}%` }}
              className="h-full bg-pink-500 rounded-xs transition-all duration-500"
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-[11px] mb-1 text-slate-400">
            <span>Counterfactual Intervention State</span>
            <span className="font-bold text-sky-400">{counterfactualPhenotype.toFixed(1)}</span>
          </div>
          <div className="w-full h-5 bg-slate-900 rounded overflow-hidden p-0.5 border border-slate-800">
            <div
              style={{ width: `${cfPct}%` }}
              className="h-full bg-sky-500 rounded-xs transition-all duration-500"
            />
          </div>
        </div>
      </div>

      <div className="p-2.5 rounded bg-slate-900/90 border border-slate-800 flex items-center justify-between text-xs">
        <span className="text-slate-400">Measured Attribution Effect (|Δ|):</span>
        <span className="text-base font-bold text-amber-400">
          Δ = {delta.toFixed(1)} units
        </span>
      </div>
    </div>
  );
};
