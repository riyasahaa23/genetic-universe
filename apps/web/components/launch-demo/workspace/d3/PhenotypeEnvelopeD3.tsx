"use client";

import React from "react";
import { NoveltyAssessment, PhenotypeBreakdown } from "@/lib/types";

interface PhenotypeEnvelopeProps {
  phenotypes: {
    parent_a: PhenotypeBreakdown;
    parent_b: PhenotypeBreakdown;
    offspring: PhenotypeBreakdown;
  } | null;
  novelty: NoveltyAssessment | null;
}

export const PhenotypeEnvelopeD3: React.FC<PhenotypeEnvelopeProps> = ({ phenotypes, novelty }) => {
  if (!phenotypes || !novelty) {
    return (
      <div className="p-4 rounded-xl bg-[#050e22]/50 border border-slate-800 text-center text-xs text-slate-500 italic">
        Awaiting phenotypic computation...
      </div>
    );
  }

  const pA = phenotypes.parent_a.total;
  const pB = phenotypes.parent_b.total;
  const pOff = phenotypes.offspring.total;
  const pMin = novelty.parental_min;
  const pMax = novelty.parental_max;

  // Scale bounds with comfortable padding
  const allVals = [pA, pB, pOff, pMin, pMax];
  const minBound = Math.floor(Math.min(...allVals) - 5);
  const maxBound = Math.ceil(Math.max(...allVals) + 8);
  const range = maxBound - minBound || 1;

  const toPct = (val: number) => {
    return Math.max(0, Math.min(100, ((val - minBound) / range) * 100));
  };

  const envLeft = toPct(pMin);
  const envRight = toPct(pMax);
  const envWidth = Math.max(4, envRight - envLeft);

  return (
    <div className="w-full bg-[#050e20]/80 rounded-xl border border-slate-800/80 p-3 select-none">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold">
          Parental Envelope vs Offspring
        </span>
        {novelty.is_transgressive ? (
          <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_8px_rgba(245,158,11,0.3)]">
            NOVELTY DETECTED (+{novelty.novelty_margin.toFixed(2)} units)
          </span>
        ) : (
          <span className="px-2 py-0.5 rounded-full text-[9px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            Within Envelope
          </span>
        )}
      </div>

      {/* Visual Continuum Track */}
      <div className="relative h-12 w-full my-3 flex items-center">
        {/* Track axis line */}
        <div className="absolute left-0 right-0 h-1 bg-slate-800 rounded-full" />

        {/* Parental Envelope Range Band */}
        <div
          className="absolute h-4 bg-cyan-500/20 border-x-2 border-cyan-400/80 rounded"
          style={{ left: `${envLeft}%`, width: `${envWidth}%` }}
        />

        {/* Parent A Marker */}
        <div
          className="absolute flex flex-col items-center -top-3 group cursor-pointer"
          style={{ left: `${toPct(pA)}%`, transform: "translateX(-50%)" }}
        >
          <span className="text-[8.5px] font-mono text-cyan-300 font-bold mb-0.5">P_A</span>
          <div className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_8px_#38bdf8]" />
          <span className="text-[8px] font-mono text-slate-300 mt-0.5">{pA.toFixed(1)}</span>
        </div>

        {/* Parent B Marker */}
        <div
          className="absolute flex flex-col items-center -top-3 group cursor-pointer"
          style={{ left: `${toPct(pB)}%`, transform: "translateX(-50%)" }}
        >
          <span className="text-[8.5px] font-mono text-pink-300 font-bold mb-0.5">P_B</span>
          <div className="w-3 h-3 rounded-full bg-pink-500 shadow-[0_0_8px_#ec4899]" />
          <span className="text-[8px] font-mono text-slate-300 mt-0.5">{pB.toFixed(1)}</span>
        </div>

        {/* Offspring Marker */}
        <div
          className="absolute flex flex-col items-center -bottom-3 z-10 group cursor-pointer"
          style={{ left: `${toPct(pOff)}%`, transform: "translateX(-50%)" }}
        >
          <div className="w-3.5 h-3.5 rounded-full bg-[#f6c85f] ring-2 ring-amber-400/50 shadow-[0_0_12px_#f6c85f]" />
          <span className="text-[9px] font-mono text-[#f6c85f] font-bold mt-0.5">
            Offspring: {pOff.toFixed(1)}
          </span>
        </div>
      </div>

      {/* Mathematical Breakdown Details */}
      <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-slate-800/60 text-[9.5px]">
        <div>
          <div className="text-slate-500">Additive:</div>
          <div className="font-mono text-cyan-300 font-semibold">
            {phenotypes.offspring.additive_component.toFixed(1)}
          </div>
        </div>
        <div>
          <div className="text-slate-500">Dominance:</div>
          <div className="font-mono text-indigo-300 font-semibold">
            {phenotypes.offspring.dominance_component.toFixed(1)}
          </div>
        </div>
        <div>
          <div className="text-slate-500">Epistasis:</div>
          <div className="font-mono text-amber-300 font-semibold">
            +{phenotypes.offspring.epistatic_component.toFixed(1)}
          </div>
        </div>
      </div>
    </div>
  );
};
