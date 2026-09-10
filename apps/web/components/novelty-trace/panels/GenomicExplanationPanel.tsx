"use client";

import React from "react";
import { useNoveltyTrace } from "../interactions/NoveltyTraceInteractionContext";

export const GenomicExplanationPanel: React.FC = () => {
  const {
    activeWorkflowStep,
    selectedCandidate,
    setSelectedCandidateId,
    candidates,
    setHoveredLocus,
    setTooltip,
    searchSpace,
  } = useNoveltyTrace();

  const details = selectedCandidate.variantDetails;
  const segments = selectedCandidate.ideogramSegments;

  return (
    <div className="w-full h-full bg-[#070d1d]/85 backdrop-blur-md border border-slate-800/80 rounded-xl p-3 shadow-[0_8px_32px_rgba(0,0,0,0.6)] flex flex-col justify-between group hover:border-slate-700/80 transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/50 pb-1 mb-1">
        <div className="flex items-center gap-1.5">
          <span className="text-cyan-400 font-bold text-xs">|</span>
          <h2 className="text-xs font-semibold text-slate-100 tracking-wide font-sans">
            {activeWorkflowStep === 1 && "Input Genomic Context"}
            {activeWorkflowStep === 2 && "Genomic Search Scanning"}
            {activeWorkflowStep === 3 && "Genomic Explanation View"}
            {activeWorkflowStep === 4 && "Mechanistic Provenance & Interaction Loci"}
          </h2>
        </div>
        <div className="w-4 h-4 rounded-full border border-slate-700 flex items-center justify-center text-[9px] text-slate-400 cursor-pointer">
          ›
        </div>
      </div>

      {/* Subheader: Context Selector */}
      <div className="flex items-center justify-between text-[9.5px] mb-1.5 px-0.5">
        <span className="text-slate-300 font-medium">
          {activeWorkflowStep === 1
            ? "Chromosome 3 — Transmitted Offspring Genome"
            : activeWorkflowStep === 2
            ? "Chromosome 3 — Scan Intervals (0–200 Mb)"
            : "Chromosome 3 (Syntenic Region)"}
        </span>
        {activeWorkflowStep >= 3 ? (
          <div className="relative">
            <select
              value={selectedCandidate.id}
              onChange={(e) => setSelectedCandidateId(e.target.value)}
              className="bg-[#0b142c] border border-slate-700/80 rounded px-2 py-0.5 text-[9px] text-cyan-300 focus:outline-none appearance-none pr-4 cursor-pointer"
            >
              {candidates.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.type})
                </option>
              ))}
            </select>
            <div className="absolute right-1 top-1/2 -translate-y-1/2 text-[7px] text-slate-400 pointer-events-none">
              ⌄
            </div>
          </div>
        ) : (
          <span className="text-[8.5px] font-mono text-cyan-400">
            {activeWorkflowStep === 1 ? "INITIAL STATE" : "3 REGIONS SCANNING"}
          </span>
        )}
      </div>

      {/* Main Grid: Ideogram Track (Col 8) + Side Card (Col 4) */}
      <div className="grid grid-cols-12 gap-3 items-center flex-1 min-h-0">
        {/* Left: Ideogram Track & Axis (Col 8) */}
        <div className="col-span-8 flex flex-col justify-between h-full py-0.5">
          {/* Chromosome Ribbon */}
          <div className="relative w-full h-8 bg-slate-900/80 rounded-full overflow-hidden border border-slate-700/80 flex p-0.5 shadow-inner">
            {segments.map((seg, idx) => {
              const widthPct = ((seg.end - seg.start) / 200) * 100;
              const isBreakpoint = seg.type === "breakpoint";
              const isLocus = seg.type === "locus";
              const isParentA = seg.type === "parent_a";

              // Stage 1: Neutral ideogram (no candidate locus highlighted)
              if (activeWorkflowStep === 1) {
                return (
                  <div
                    key={idx}
                    style={{ width: `${widthPct}%` }}
                    className={`h-full relative transition-all duration-200 ${
                      isBreakpoint
                        ? "bg-amber-400/80 w-1 shadow-[0_0_6px_#f59e0b]"
                        : isParentA
                        ? "bg-gradient-to-r from-cyan-600 to-cyan-500"
                        : "bg-gradient-to-r from-pink-600 to-pink-500"
                    }`}
                  />
                );
              }

              // Stage 2: Multiple pulsing candidate regions
              if (activeWorkflowStep === 2) {
                const isScanningRegion = isLocus || isBreakpoint;
                return (
                  <div
                    key={idx}
                    style={{ width: `${widthPct}%` }}
                    className={`h-full relative transition-all duration-200 ${
                      isScanningRegion
                        ? "bg-gradient-to-r from-amber-400 to-cyan-400 animate-pulse shadow-[0_0_10px_#38bdf8] z-10"
                        : isParentA
                        ? "bg-gradient-to-r from-cyan-700 to-cyan-600 opacity-70"
                        : "bg-gradient-to-r from-pink-700 to-pink-600 opacity-70"
                    }`}
                  />
                );
              }

              // Stage 3 & 4: Focus on candidate locus
              return (
                <div
                  key={idx}
                  style={{ width: `${widthPct}%` }}
                  onMouseEnter={(e) => {
                    setHoveredLocus(seg.label || null);
                    setTooltip({
                      visible: true,
                      x: e.clientX,
                      y: e.clientY,
                      title: seg.label || "Genomic Segment",
                      subtitle: `Interval: ${seg.start} Mb – ${seg.end} Mb`,
                      badge: isLocus ? "KEY LOCUS" : isBreakpoint ? "CROSSOVER" : "ORIGIN BLOCK",
                      badgeColor: isLocus
                        ? "bg-amber-500/20 text-amber-300 border-amber-500/50"
                        : isBreakpoint
                        ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50"
                        : "bg-slate-800 text-slate-300 border-slate-700",
                      details: [
                        { label: "Segment length", value: `${seg.end - seg.start} Mb`, color: "#38bdf8" },
                        { label: "Transmitted homolog", value: isParentA ? "Parent A (Maternal)" : "Parent B (Paternal)", color: "#c084fc" },
                      ],
                    });
                  }}
                  onMouseLeave={() => {
                    setHoveredLocus(null);
                    setTooltip(null);
                  }}
                  className={`h-full relative cursor-pointer transition-all duration-200 ${
                    isLocus
                      ? "bg-gradient-to-r from-amber-400 to-amber-300 shadow-[0_0_12px_#fbbf24] z-10"
                      : isBreakpoint
                      ? "bg-amber-400/90 w-1 shadow-[0_0_8px_#f59e0b]"
                      : isParentA
                      ? "bg-gradient-to-r from-cyan-600 to-cyan-500"
                      : "bg-gradient-to-r from-pink-600 to-pink-500"
                  }`}
                >
                  {isLocus && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-1.5 h-14 bg-white/80 rounded-full blur-[1px] shadow-[0_0_8px_#ffffff] pointer-events-none" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Coordinate Scale Marks */}
          <div className="w-full flex justify-between text-[8px] font-mono text-slate-500 px-1 pt-1 border-t border-slate-800/80">
            <span>0 Mb</span>
            <span>50 Mb</span>
            <span>100 Mb</span>
            <span>150 Mb</span>
            <span>200 Mb</span>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-between text-[7.5px] text-slate-400 px-0.5 pt-0.5">
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span>Parental A (Maternal)</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-pink-400" />
              <span>Parental B (Paternal)</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>Crossover Breakpoint</span>
            </div>
            {activeWorkflowStep >= 3 && (
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_4px_#ffffff]" />
                <span>Candidate Locus</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Side Card (Col 4) */}
        <div className="col-span-4 bg-[#081226]/90 border border-slate-800/90 rounded-lg p-2 flex flex-col justify-between h-full text-left">
          {/* STAGE 1: INPUT GENOMIC STATE */}
          {activeWorkflowStep === 1 && (
            <div>
              <div className="flex items-center justify-between border-b border-slate-800/60 pb-1 mb-1">
                <span className="text-[9.5px] text-slate-300 font-medium">Transmitted Genome</span>
                <span className="text-cyan-400 text-xs">🧬</span>
              </div>
              <div className="space-y-1 text-[8.5px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Ploidy</span>
                  <span className="font-mono text-slate-200">2n (Diploid)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Crossover Chiasmata</span>
                  <span className="font-mono text-cyan-300">2 Breakpoints</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Maternal (Parent A)</span>
                  <span className="text-cyan-400 font-mono">58%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Paternal (Parent B)</span>
                  <span className="text-pink-400 font-mono">42%</span>
                </div>
                <div className="flex justify-between pt-0.5 border-t border-slate-800/50">
                  <span className="text-slate-500">Inference Status</span>
                  <span className="font-mono text-amber-400">Awaiting Search</span>
                </div>
              </div>
            </div>
          )}

          {/* STAGE 2: SEARCH METRICS */}
          {activeWorkflowStep === 2 && (
            <div>
              <div className="flex items-center justify-between border-b border-slate-800/60 pb-1 mb-1">
                <span className="text-[9.5px] text-cyan-300 font-medium">Search Intervals</span>
                <span className="text-cyan-400 text-xs">🔍</span>
              </div>
              <div className="space-y-1 text-[8.5px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Candidate Regions</span>
                  <span className="font-mono text-slate-200">3 Priority Blocks</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Region A</span>
                  <span className="font-mono text-amber-300">72.4 Mb (Epistatic)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Region B</span>
                  <span className="font-mono text-purple-300">118.9 Mb (Segment)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Region C</span>
                  <span className="font-mono text-pink-300">164.2 Mb (Rare SNV)</span>
                </div>
                <div className="flex justify-between pt-0.5 border-t border-slate-800/50">
                  <span className="text-slate-500">Evaluated Pool</span>
                  <span className="font-mono text-cyan-300 font-bold">{searchSpace.totalEvaluated} Total</span>
                </div>
              </div>
            </div>
          )}

          {/* STAGE 3: VARIANT DETAILS */}
          {activeWorkflowStep === 3 && (
            <div>
              <div className="flex items-center justify-between border-b border-slate-800/60 pb-1 mb-1">
                <span className="text-[9.5px] text-slate-300 font-medium">Variant Details</span>
                <span className="text-cyan-400 text-xs">🧬</span>
              </div>
              <div className="space-y-1 text-[8.5px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Locus</span>
                  <span className="font-mono text-slate-200 font-medium">{details.locus}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Allele</span>
                  <span className="font-mono text-cyan-300 font-bold">{details.allele}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Type</span>
                  <span className="text-slate-300">{details.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Model Role</span>
                  <span className="text-amber-300 font-medium">{details.modelRole}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Effect (model)</span>
                  <span className="font-mono text-emerald-400 font-bold">{details.effect}</span>
                </div>
                <div className="flex justify-between pt-0.5 border-t border-slate-800/50">
                  <span className="text-slate-500">Configuration</span>
                  <span className="font-mono text-pink-400 font-semibold">{details.inConfiguration}</span>
                </div>
              </div>
            </div>
          )}

          {/* STAGE 4: FORMAL EPISTASIS DETAILS */}
          {activeWorkflowStep === 4 && (
            <div>
              <div className="flex items-center justify-between border-b border-slate-800/60 pb-1 mb-1">
                <span className="text-[9.5px] text-amber-300 font-medium">Epistatic Circuit</span>
                <span className="text-amber-400 text-xs">⚡</span>
              </div>
              <div className="space-y-1 text-[8.5px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Locus Pair</span>
                  <span className="font-mono text-slate-200">72.4 × 118.9 Mb</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Edge Delta (Δ)</span>
                  <span className="font-mono text-amber-300 font-bold">-{selectedCandidate.interactionEdgeDelta?.toFixed(2) || "1.70"} SD</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Raw Contrast</span>
                  <span className="font-mono text-cyan-300">{selectedCandidate.interactionContrast?.toFixed(2) || "-0.92"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Epistatic Excess</span>
                  <span className="font-mono text-emerald-400 font-bold">+{selectedCandidate.epistaticExcess?.toFixed(2) || "0.92"} SD</span>
                </div>
                <div className="flex justify-between pt-0.5 border-t border-slate-800/50">
                  <span className="text-slate-500">Synergy Class</span>
                  <span className="font-mono text-emerald-300 font-semibold">positive_synergy</span>
                </div>
              </div>
            </div>
          )}

          {/* Action Link */}
          <div className="pt-1 border-t border-slate-800/60 text-right">
            <span className="text-[8.5px] text-cyan-400 hover:text-cyan-300 cursor-pointer font-medium">
              View in context →
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
