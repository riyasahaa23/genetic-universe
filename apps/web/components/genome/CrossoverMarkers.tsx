"use client";

import React from "react";

interface CrossoverMarkersProps {
  crossoversA: number[];
  crossoversB: number[];
}

export const CrossoverMarkers: React.FC<CrossoverMarkersProps> = ({
  crossoversA,
  crossoversB,
}) => {
  return (
    <div className="flex flex-wrap gap-2 text-xs">
      {crossoversA.map((pos, idx) => (
        <span
          key={`xo_a_${idx}`}
          className="px-2.5 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center space-x-1"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          <span>Parent A Crossover #{idx + 1}: pos {pos}</span>
        </span>
      ))}
      {crossoversB.map((pos, idx) => (
        <span
          key={`xo_b_${idx}`}
          className="px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>Parent B Crossover #{idx + 1}: pos {pos}</span>
        </span>
      ))}
    </div>
  );
};
