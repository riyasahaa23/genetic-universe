"use client";

import React from "react";
import { useLaunchDemo } from "../../LaunchDemoContext";
import { HaplotypeTrackD3 } from "../d3/HaplotypeTrackD3";

export const ParentalGenomesPanel: React.FC = () => {
  const { parentA, parentB, executeStep3Meiosis, isRunning } = useLaunchDemo();

  return (
    <div className="w-full flex flex-col justify-between h-full space-y-4 p-2 select-none text-left">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#38bdf8]" />
          <span className="text-[10px] font-mono tracking-widest text-cyan-400 uppercase font-semibold">
            Stage 02 • Parental Genomes
          </span>
        </div>
        <h3 className="text-lg font-serif text-white font-normal mb-1">
          Phase-Resolved Diploid Parents
        </h3>
        <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
          Synthesized phase-resolved homologous chromosomes with verified locus dosage and
          biparental variation.
        </p>

        {/* Dual Parent Summary Cards */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Parent A */}
          <div className="bg-[#031526]/80 p-3 rounded-xl border border-cyan-500/30">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#38bdf8]" />
              <span className="text-xs font-bold font-mono text-cyan-300">Parent A</span>
            </div>
            <div className="space-y-1 text-[10px] text-slate-300">
              <div>Homologs: <strong className="font-mono text-white">A1, A2</strong></div>
              <div>Loci: <strong className="font-mono text-white">{parentA?.locus_count || 50}</strong></div>
              <div>Dosage: <strong className="font-mono text-cyan-300">Phase-resolved</strong></div>
            </div>
          </div>

          {/* Parent B */}
          <div className="bg-[#1f0518]/80 p-3 rounded-xl border border-pink-500/30">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-pink-500 shadow-[0_0_6px_#ec4899]" />
              <span className="text-xs font-bold font-mono text-pink-300">Parent B</span>
            </div>
            <div className="space-y-1 text-[10px] text-slate-300">
              <div>Homologs: <strong className="font-mono text-white">B1, B2</strong></div>
              <div>Loci: <strong className="font-mono text-white">{parentB?.locus_count || 50}</strong></div>
              <div>Dosage: <strong className="font-mono text-pink-300">Phase-resolved</strong></div>
            </div>
          </div>
        </div>

        {/* D3 Haplotype Tracks */}
        <HaplotypeTrackD3 parentA={parentA} parentB={parentB} />
      </div>

      {/* Primary CTA */}
      <div className="pt-2">
        <button
          onClick={executeStep3Meiosis}
          disabled={isRunning}
          className="w-full py-3 rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-amber-500 to-cyan-500 shadow-[0_0_20px_rgba(245,158,11,0.4)] hover:shadow-[0_0_28px_rgba(245,158,11,0.6)] hover:scale-[1.01] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <span>{isRunning ? "Simulating Meiosis..." : "Simulate Meiosis & Crossover"}</span>
          <span>🔀</span>
        </button>
      </div>
    </div>
  );
};
