"use client";

import React from "react";
import { useLaunchDemo } from "../../LaunchDemoContext";

export const MeiosisMetricsPanel: React.FC = () => {
  const { gameteA, gameteB, executeStep4Offspring, isRunning } = useLaunchDemo();

  return (
    <div className="w-full flex flex-col justify-between h-full space-y-4 p-2 select-none text-left">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#38bdf8]" />
          <span className="text-[10px] font-mono tracking-widest text-cyan-400 uppercase font-semibold">
            Stage 03 • Meiotic Recombination
          </span>
        </div>
        <h3 className="text-lg font-serif text-white font-normal mb-1">
          Chiasmata & Gamete Segregation
        </h3>
        <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
          Independent homolog pairing and reciprocal crossovers generate recombinant haploid
          gametes with authentic breakpoint intervals.
        </p>

        {/* Gamete Cards */}
        <div className="space-y-3 mb-4">
          {/* Gamete gA (Maternal) */}
          <div className="bg-[#031526]/80 p-3 rounded-xl border border-cyan-500/30">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold font-mono text-cyan-300">
                Maternal Gamete (gA)
              </span>
              <span className="px-2 py-0.2 rounded bg-cyan-950/80 border border-cyan-500/40 text-[9px] font-mono text-cyan-300">
                {gameteA?.crossovers?.length || 0} Crossovers
              </span>
            </div>
            <div className="text-[10px] text-slate-300 space-y-1">
              <div>
                Breakpoints:{" "}
                <strong className="font-mono text-cyan-300">
                  {gameteA?.crossovers && gameteA.crossovers.length > 0
                    ? `Loci [${gameteA.crossovers.join(", ")}]`
                    : "No crossover (intact parent haplotype)"}
                </strong>
              </div>
              <div>
                Transmitted Segments:{" "}
                <span className="font-mono text-slate-200">
                  {gameteA?.segments?.length || 1} segments
                </span>
              </div>
            </div>
          </div>

          {/* Gamete gB (Paternal) */}
          <div className="bg-[#1f0518]/80 p-3 rounded-xl border border-pink-500/30">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold font-mono text-pink-300">
                Paternal Gamete (gB)
              </span>
              <span className="px-2 py-0.2 rounded bg-pink-950/80 border border-pink-500/40 text-[9px] font-mono text-pink-300">
                {gameteB?.crossovers?.length || 0} Crossovers
              </span>
            </div>
            <div className="text-[10px] text-slate-300 space-y-1">
              <div>
                Breakpoints:{" "}
                <strong className="font-mono text-pink-300">
                  {gameteB?.crossovers && gameteB.crossovers.length > 0
                    ? `Loci [${gameteB.crossovers.join(", ")}]`
                    : "No crossover (intact parent haplotype)"}
                </strong>
              </div>
              <div>
                Transmitted Segments:{" "}
                <span className="font-mono text-slate-200">
                  {gameteB?.segments?.length || 1} segments
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Breakpoint Provenance Note */}
        <div className="bg-[#050e20]/80 rounded-xl p-2.5 border border-slate-800 text-[10px] text-slate-400 space-y-1">
          <div className="font-mono font-bold text-slate-300 uppercase text-[9px]">
            Recombination Provenance
          </div>
          <p className="leading-tight">
            Breakpoints define alternating maternal and paternal homolog switches. These loci form
            the candidate recombination segments analyzed in subsequent novelty tracing.
          </p>
        </div>
      </div>

      {/* Primary CTA */}
      <div className="pt-2">
        <button
          onClick={executeStep4Offspring}
          disabled={isRunning}
          className="w-full py-3 rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-cyan-500 to-emerald-500 shadow-[0_0_20px_rgba(56,189,248,0.4)] hover:shadow-[0_0_28px_rgba(56,189,248,0.6)] hover:scale-[1.01] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <span>{isRunning ? "Assembling Offspring..." : "Assemble Offspring & Fertilize"}</span>
          <span>🐣</span>
        </button>
      </div>
    </div>
  );
};
