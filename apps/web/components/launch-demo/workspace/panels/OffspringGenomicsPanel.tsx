"use client";

import React from "react";
import { useLaunchDemo } from "../../LaunchDemoContext";

export const OffspringGenomicsPanel: React.FC = () => {
  const { offspring, executeStep5Phenotype, isRunning } = useLaunchDemo();

  return (
    <div className="w-full flex flex-col justify-between h-full space-y-4 p-2 select-none text-left">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#38bdf8]" />
          <span className="text-[10px] font-mono tracking-widest text-cyan-400 uppercase font-semibold">
            Stage 04 • Offspring Assembly
          </span>
        </div>
        <h3 className="text-lg font-serif text-white font-normal mb-1">
          Diploid Mosaic Genome
        </h3>
        <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
          Fertilization unites maternal and paternal recombinant gametes into a novel diploid
          offspring possessing hybrid genomic configurations.
        </p>

        {/* Offspring Details Card */}
        <div className="bg-[#050e20]/80 p-3.5 rounded-xl border border-slate-800/80 mb-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white font-mono">
              Offspring {offspring?.offspring_id || "O1"}
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px] font-mono font-bold">
              Diploid (2n)
            </span>
          </div>

          {/* Mosaic Ancestry Composition */}
          <div>
            <div className="flex justify-between text-[9.5px] font-mono mb-1">
              <span className="text-cyan-300">Maternal Origin: 50%</span>
              <span className="text-pink-300">Paternal Origin: 50%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden flex">
              <div className="h-full bg-cyan-400 shadow-[0_0_8px_#38bdf8] w-1/2" />
              <div className="h-full bg-pink-500 shadow-[0_0_8px_#ec4899] w-1/2" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[10px] pt-1 border-t border-slate-800">
            <div>
              <span className="text-slate-500">Loci with Provenance:</span>
              <div className="font-mono text-white font-semibold">
                {offspring?.provenance?.length || 50} loci
              </div>
            </div>
            <div>
              <span className="text-slate-500">Recombination Status:</span>
              <div className="font-mono text-cyan-300 font-semibold">
                Mosaic Segments Verified
              </div>
            </div>
          </div>
        </div>

        {/* Explanation Note */}
        <div className="bg-[#030d1a]/70 rounded-xl p-2.5 border border-cyan-500/20 text-[10px] text-slate-300 space-y-1">
          <div className="font-mono font-bold text-cyan-400 uppercase text-[9px]">
            Hypothesis Foundation
          </div>
          <p className="leading-tight text-slate-400">
            Because offspring inherit unique combinations of maternal and paternal alleles at
            linked loci, non-linear epistatic interactions can arise that were absent in either
            parent.
          </p>
        </div>
      </div>

      {/* Primary CTA */}
      <div className="pt-2">
        <button
          onClick={executeStep5Phenotype}
          disabled={isRunning}
          className="w-full py-3 rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-emerald-500 to-pink-500 shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:shadow-[0_0_28px_rgba(16,185,129,0.6)] hover:scale-[1.01] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <span>{isRunning ? "Evaluating Phenotype..." : "Calculate Phenotype & Detect Novelty"}</span>
          <span>📊</span>
        </button>
      </div>
    </div>
  );
};
