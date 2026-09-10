"use client";

import React from "react";
import { useCounterfactual } from "../interactions/CounterfactualInteractionContext";

export const GenomicContextPanel: React.FC = () => {
  const {
    selectedCandidate,
    selectedChromosome,
    setSelectedChromosome,
    activeWorkflowStep,
    showTooltip,
    hideTooltip,
  } = useCounterfactual();

  // Ideogram segments (0 to 200 Mb)
  const segments = [
    { start: 0, end: 42, origin: "A", color: "from-sky-600 to-cyan-500" },
    { start: 42, end: 95, origin: "B", color: "from-pink-600 to-rose-500" },
    { start: 95, end: 145, origin: "A", color: "from-sky-600 to-cyan-500" },
    { start: 145, end: 200, origin: "B", color: "from-pink-600 to-rose-500" },
  ];

  // Target locus percent (0 - 200 Mb)
  const targetPct = (selectedCandidate.locusMb / 200) * 100;

  return (
    <div className="h-full bg-[#040817]/90 backdrop-blur-md border border-slate-800/80 rounded-2xl p-2.5 flex flex-col justify-between shadow-[0_4px_24px_rgba(0,0,0,0.5)] select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <h3 className="text-xs font-bold text-white font-sans tracking-wide">
            Genomic Context
          </h3>
          {activeWorkflowStep === 1 && (
            <span className="text-[8px] font-mono px-1.5 py-0.2 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded">
              Original Target
            </span>
          )}
        </div>
        <select
          value={selectedChromosome}
          onChange={(e) => setSelectedChromosome(e.target.value)}
          className="bg-slate-900/80 border border-slate-700/80 rounded-lg px-2 py-0.5 text-[9.5px] font-mono text-cyan-300 outline-none cursor-pointer hover:border-cyan-500/50 transition-colors"
        >
          <option value="Chromosome 3">Chromosome 3 ⌵</option>
          <option value="Chromosome 7">Chromosome 7</option>
          <option value="Chromosome 12">Chromosome 12</option>
        </select>
      </div>

      {/* Chromosome Ideogram Ribbon */}
      <div className="relative w-full my-1">
        {/* Locus Indicator Diamonds & Pin Lines */}
        <div
          className="absolute -top-3 -translate-x-1/2 flex flex-col items-center pointer-events-auto cursor-pointer z-10"
          style={{ left: `${targetPct}%` }}
          onMouseEnter={(e) => {
            showTooltip({
              x: e.clientX,
              y: e.clientY,
              title: `${selectedCandidate.target}: ${selectedCandidate.locusMb} Mb`,
              subtitle: activeWorkflowStep === 1 ? "Selected target locus for counterfactual test" : "Active in-silico substitution point",
              badge: "TARGET LOCUS",
              badgeColor: "bg-amber-950/70 text-amber-300 border-amber-500/40",
              details: [
                { label: "Position", value: `${selectedCandidate.locusMb} Mb`, color: "#f6c85f" },
                { label: "Type", value: selectedCandidate.candidateType.toUpperCase(), color: "#38bdf8" },
                { label: "Substituted allele", value: `${selectedCandidate.originalAllele} → ${selectedCandidate.modifiedAllele}`, color: "#34d399" },
              ],
            });
          }}
          onMouseLeave={hideTooltip}
        >
          <div className="w-2.5 h-2.5 bg-[#f6c85f] rotate-45 border border-white shadow-[0_0_8px_#f6c85f]" />
          <div className="w-0.5 h-3.5 bg-[#f6c85f]" />
        </div>

        {/* The Chromosome Ribbon Capsule */}
        <div className="w-full h-5 rounded-full overflow-hidden flex border border-slate-700/70 shadow-inner bg-slate-950 relative">
          {segments.map((seg, idx) => {
            const widthPct = ((seg.end - seg.start) / 200) * 100;
            return (
              <div
                key={idx}
                className={`h-full bg-gradient-to-r ${seg.color} border-r border-slate-950/60 transition-opacity hover:opacity-90`}
                style={{ width: `${widthPct}%` }}
                title={`${seg.start}-${seg.end} Mb (Parent ${seg.origin})`}
              />
            );
          })}
        </div>

        {/* Mb Scale Axis Labels */}
        <div className="flex justify-between text-[8px] font-mono text-slate-400 mt-1 px-1">
          <span>0 Mb</span>
          <span>50 Mb</span>
          <span>100 Mb</span>
          <span>150 Mb</span>
          <span>200 Mb</span>
        </div>
      </div>

      {/* Mini Legend Row */}
      <div className="flex items-center justify-between text-[8px] text-slate-400 py-0.5 border-b border-slate-800/60">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-sky-500" />
          <span>Parent A origin</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-pink-500" />
          <span>Parent B origin</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#f6c85f]" />
          <span>Target locus</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          <span>In-silico modified</span>
        </div>
      </div>

      {/* Sub-Section: Candidate Intervention Details (Side by side comparison) */}
      <div className="mt-1">
        <div className="flex items-center justify-between text-[10px] font-bold text-white mb-1">
          <span>
            {selectedCandidate.candidateType === "interaction"
              ? "Interaction Configuration"
              : selectedCandidate.candidateType === "segment"
              ? "Segment Configuration"
              : "Variant Configuration"}
          </span>
          <span className="text-[8px] font-mono text-slate-400 font-normal">
            Step {activeWorkflowStep}/4
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-[9.5px]">
          {/* Column 1: Original */}
          <div className="bg-[#060b18]/70 border border-slate-800/70 rounded-xl p-1.5 space-y-0.5">
            <div className="text-[10px] font-semibold text-slate-200 border-b border-slate-800/60 pb-0.5 flex justify-between">
              <span>Original</span>
              <span className="text-[8px] font-mono text-amber-400">Offspring</span>
            </div>
            {selectedCandidate.candidateType === "interaction" ? (
              <>
                <div className="flex justify-between">
                  <span className="text-slate-400">Coupling</span>
                  <span className="font-mono text-white font-medium">γ_3,7 = +0.80</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Synergy</span>
                  <span className="font-mono text-pink-400 font-medium">Supra-additive</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Status</span>
                  <span className="font-mono text-rose-400 font-semibold">Coupled</span>
                </div>
              </>
            ) : selectedCandidate.candidateType === "segment" ? (
              <>
                <div className="flex justify-between">
                  <span className="text-slate-400">Haplotype</span>
                  <span className="font-mono text-white font-medium">42–95 Mb (B)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Effect</span>
                  <span className="font-mono text-pink-400 font-medium">+1.45</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Status</span>
                  <span className="font-mono text-rose-400 font-semibold">Present</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between">
                  <span className="text-slate-400">Allele</span>
                  <span className="font-mono text-white font-medium">
                    {selectedCandidate.originalAllele}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Effect (model)</span>
                  <span className="font-mono text-pink-400 font-medium">
                    {selectedCandidate.originalEffect}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">In config</span>
                  <span className="font-mono text-rose-400 font-semibold">
                    Present
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Column 2: Modified */}
          {activeWorkflowStep === 1 ? (
            <div className="bg-[#051726]/30 border border-dashed border-slate-700/60 rounded-xl p-1.5 flex flex-col justify-center items-center text-center space-y-1">
              <span className="text-[10px] font-semibold text-slate-400">Modified</span>
              <span className="text-[8px] font-mono text-amber-300/80 leading-tight">
                Awaiting intervention in Step 2
              </span>
            </div>
          ) : (
            <div className="bg-[#051726]/70 border border-cyan-500/30 rounded-xl p-1.5 space-y-0.5">
              <div className="text-[10px] font-semibold text-cyan-300 border-b border-cyan-500/30 pb-0.5 flex justify-between">
                <span>Modified</span>
                <span className="text-[8px] font-mono text-emerald-400">In-Silico</span>
              </div>
              {selectedCandidate.candidateType === "interaction" ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Coupling</span>
                    <span className="font-mono text-cyan-300 font-medium">γ_3,7 = 0.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Synergy</span>
                    <span className="font-mono text-cyan-400 font-medium">Severed</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Status</span>
                    <span className="font-mono text-emerald-400 font-semibold">Ablated</span>
                  </div>
                </>
              ) : selectedCandidate.candidateType === "segment" ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Haplotype</span>
                    <span className="font-mono text-cyan-300 font-medium">42–95 Mb (A)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Effect</span>
                    <span className="font-mono text-cyan-400 font-medium">-1.45</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Status</span>
                    <span className="font-mono text-emerald-400 font-semibold">Swapped</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Allele</span>
                    <span className="font-mono text-cyan-300 font-medium">
                      {selectedCandidate.modifiedAllele}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Effect (model)</span>
                    <span className="font-mono text-cyan-400 font-medium">
                      {selectedCandidate.modifiedEffect}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">In config</span>
                    <span className="font-mono text-emerald-400 font-semibold">
                      Replaced
                    </span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Provenance Footer */}
        <div className="mt-1 pt-1 border-t border-slate-800/60 flex items-center justify-between text-[8px]">
          <span className="text-slate-500 font-medium">Provenance:</span>
          <span
            className="text-cyan-300/90 font-mono truncate max-w-[200px]"
            title={selectedCandidate.provenance}
          >
            {selectedCandidate.provenance}
          </span>
        </div>
      </div>
    </div>
  );
};
