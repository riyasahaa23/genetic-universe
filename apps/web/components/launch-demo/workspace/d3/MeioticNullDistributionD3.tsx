"use client";

import React from "react";
import { MeioticNullResult } from "@/lib/types";

interface MeioticNullProps {
  nullResult: MeioticNullResult | null;
  onSimulateMore?: () => void;
  isLoading?: boolean;
}

export const MeioticNullDistributionD3: React.FC<MeioticNullProps> = ({
  nullResult,
  onSimulateMore,
  isLoading,
}) => {
  if (!nullResult) {
    return (
      <div className="p-4 rounded-xl bg-[#050e22]/50 border border-slate-800 text-center text-xs text-slate-500 italic flex flex-col items-center gap-2">
        <span>Awaiting meiotic-null empirical distribution...</span>
        {onSimulateMore && (
          <button
            onClick={onSimulateMore}
            disabled={isLoading}
            className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-mono transition-colors"
          >
            {isLoading ? "Simulating..." : "Simulate 200 Null Progeny"}
          </button>
        )}
      </div>
    );
  }

  const bins = nullResult.histogram_bins || [];
  const counts = nullResult.histogram_counts || [];
  const maxCount = Math.max(...counts, 1);
  const obs = nullResult.observed_phenotype;

  return (
    <div className="w-full bg-[#050e20]/80 rounded-xl border border-slate-800/80 p-3 select-none">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold">
          Meiotic-Null Empirical Distribution ({nullResult.null_count} Progeny)
        </span>
        <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-purple-950/60 text-purple-300 border border-purple-500/40 font-bold">
          Observed: {nullResult.observed_percentile.toFixed(1)}th Percentile
        </span>
      </div>

      {/* SVG Histogram */}
      <div className="h-28 w-full relative my-1">
        <svg viewBox="0 0 320 100" className="w-full h-full" preserveAspectRatio="none">
          {/* Histogram Bars */}
          {counts.map((count, idx) => {
            const barH = (count / maxCount) * 80;
            const x = (idx / counts.length) * 310 + 5;
            const w = Math.max(2, 310 / counts.length - 1.5);
            const y = 90 - barH;

            return (
              <rect
                key={idx}
                x={x}
                y={y}
                width={w}
                height={barH}
                fill="#6366f1"
                opacity={0.65}
                rx={1}
                className="hover:opacity-100 hover:fill-cyan-400 transition-all cursor-pointer"
              />
            );
          })}

          {/* Baseline axis */}
          <line x1="0" y1="92" x2="320" y2="92" stroke="#334155" strokeWidth="1" />

          {/* Observed Value Line */}
          <line
            x1="285"
            y1="5"
            x2="285"
            y2="92"
            stroke="#f6c85f"
            strokeWidth="2"
            strokeDasharray="3,2"
          />
          <circle cx="285" cy="8" r="3" fill="#f6c85f" filter="drop-shadow(0 0 4px #f6c85f)" />
          <text x="280" y="22" fill="#f6c85f" fontSize="7" textAnchor="end" fontFamily="monospace">
            Observed: {obs.toFixed(1)}
          </text>
        </svg>
      </div>

      {/* Statistics Row */}
      <div className="grid grid-cols-3 gap-2 text-center text-[9px] pt-1.5 border-t border-slate-800/60">
        <div>
          <span className="text-slate-500">Null Mean:</span>{" "}
          <strong className="text-slate-300 font-mono">{nullResult.null_mean.toFixed(1)}</strong>
        </div>
        <div>
          <span className="text-slate-500">Std Dev:</span>{" "}
          <strong className="text-slate-300 font-mono">±{nullResult.null_std.toFixed(2)}</strong>
        </div>
        <div>
          <span className="text-slate-500">Transgressive:</span>{" "}
          <strong className="text-amber-300 font-mono">
            {(nullResult.fraction_null_transgressive * 100).toFixed(1)}%
          </strong>
        </div>
      </div>
    </div>
  );
};
