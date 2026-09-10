"use client";

import React from "react";
import { useNoveltyTrace } from "../interactions/NoveltyTraceInteractionContext";

export const CandidateRankingPanel: React.FC = () => {
  const {
    activeWorkflowStep,
    candidates,
    selectedCandidateId,
    setSelectedCandidateId,
    selectedCandidate,
    setHoveredCandidateId,
    setTooltip,
    parentA,
    parentB,
    parentRange,
    observedPhenotype,
    noveltyMargin,
    searchSpace,
  } = useNoveltyTrace();

  return (
    <div className="w-full h-full bg-[#070d1d]/85 backdrop-blur-md border border-slate-800/80 rounded-xl p-3 shadow-[0_8px_32px_rgba(0,0,0,0.6)] flex flex-col justify-between group hover:border-slate-700/80 transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/50 pb-1 mb-1">
        <div className="flex items-center gap-1.5">
          <span className="text-cyan-400 font-bold text-xs">|</span>
          <h2 className="text-xs font-semibold text-slate-100 tracking-wide font-sans">
            {activeWorkflowStep === 1 && "Observed Phenotype Summary"}
            {activeWorkflowStep === 2 && "Candidate Search Space"}
            {activeWorkflowStep === 3 && "Top Candidate Configurations"}
            {activeWorkflowStep === 4 && "Selected Mechanism"}
          </h2>
        </div>
        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-800/60 border border-slate-700/60 text-[8.5px] text-slate-300 cursor-pointer hover:border-cyan-500/50">
          <span>{activeWorkflowStep === 1 ? "Baseline" : activeWorkflowStep === 2 ? "Search Mode" : activeWorkflowStep === 3 ? "Ranked 1–5" : "Mechanism"}</span>
          <span className="text-[7.5px] text-slate-400">⌄</span>
        </div>
      </div>

      {/* STAGE 1: OBSERVED PHENOTYPE SUMMARY */}
      {activeWorkflowStep === 1 && (
        <div className="flex-1 flex flex-col justify-between text-[9.5px] py-0.5">
          <div className="grid grid-cols-2 gap-2">
            <div className="p-1.5 rounded-lg bg-[#040916] border border-slate-800/80">
              <span className="text-[8px] text-slate-400 block">Parent A (Maternal)</span>
              <span className="font-mono text-sm font-bold text-cyan-300">{parentA.phenotype.toFixed(1)} SD</span>
            </div>
            <div className="p-1.5 rounded-lg bg-[#040916] border border-slate-800/80">
              <span className="text-[8px] text-slate-400 block">Parent B (Paternal)</span>
              <span className="font-mono text-sm font-bold text-pink-300">+{parentB.phenotype.toFixed(1)} SD</span>
            </div>
          </div>

          <div className="space-y-1 my-1 text-[9px]">
            <div className="flex justify-between py-0.5 border-b border-slate-800/60">
              <span className="text-slate-400">Parental Envelope:</span>
              <span className="font-mono text-slate-200">[{parentRange.min.toFixed(1)}, +{parentRange.max.toFixed(1)}] SD</span>
            </div>
            <div className="flex justify-between py-0.5 border-b border-slate-800/60">
              <span className="text-slate-400">Offspring Phenotype:</span>
              <span className="font-mono font-bold text-amber-300">+{observedPhenotype.toFixed(1)} SD</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-slate-400">Novelty Status:</span>
              <span className="font-mono font-semibold text-amber-400">+{noveltyMargin.toFixed(1)} Transgressive</span>
            </div>
          </div>

          <div className="text-[8px] text-slate-400 italic bg-[#050d22] p-1.5 rounded border border-slate-800/60 text-center">
            Awaiting candidate generation to search for causal explanations.
          </div>
        </div>
      )}

      {/* STAGE 2: CANDIDATE SEARCH SPACE */}
      {activeWorkflowStep === 2 && (
        <div className="flex-1 flex flex-col justify-between text-[9.5px] py-0.5">
          <div className="grid grid-cols-3 gap-1.5 text-center">
            <div className="p-1.5 rounded bg-[#040916] border border-slate-800">
              <span className="font-mono text-xs font-bold text-cyan-400">{searchSpace.variantsCount}</span>
              <span className="text-[8px] text-slate-400 block mt-0.5">Variants</span>
            </div>
            <div className="p-1.5 rounded bg-[#040916] border border-slate-800">
              <span className="font-mono text-xs font-bold text-purple-400">{searchSpace.segmentsCount}</span>
              <span className="text-[8px] text-slate-400 block mt-0.5">Segments</span>
            </div>
            <div className="p-1.5 rounded bg-[#040916] border border-slate-800">
              <span className="font-mono text-xs font-bold text-pink-400">{searchSpace.interactionsCount}</span>
              <span className="text-[8px] text-slate-400 block mt-0.5">Interactions</span>
            </div>
          </div>

          <div className="space-y-1 text-[8.5px] my-1">
            <div className="flex justify-between">
              <span className="text-slate-400">Total Search Pool:</span>
              <span className="font-mono font-bold text-slate-200">{searchSpace.totalEvaluated} configurations</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Search Algorithm:</span>
              <span className="text-cyan-300 font-mono">Model-relative ablation scan</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Pruning Threshold:</span>
              <span className="font-mono text-slate-300">Score &ge; {searchSpace.pruningThreshold}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-[#081530] p-1.5 rounded border border-cyan-500/30">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping flex-shrink-0" />
            <span className="text-[8.5px] text-cyan-200 font-medium truncate">
              Scanning offspring genome state across chromosomes...
            </span>
          </div>
        </div>
      )}

      {/* STAGE 3: TOP CANDIDATE CONFIGURATIONS */}
      {activeWorkflowStep === 3 && (
        <div className="flex-1 flex flex-col justify-between text-[9.5px]">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-1 text-[8.5px] text-slate-400 pb-1 border-b border-slate-800/60 font-medium">
            <div className="col-span-1 text-center">#</div>
            <div className="col-span-3">Configuration</div>
            <div className="col-span-3">Attribution</div>
            <div className="col-span-5 text-right pr-1">Primary Evidence</div>
          </div>

          {/* Rows */}
          <div className="space-y-1 my-0.5">
            {candidates.map((c) => {
              const isSelected = selectedCandidateId === c.id;

              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedCandidateId(c.id)}
                  onMouseEnter={(e) => {
                    setHoveredCandidateId(c.id);
                    setTooltip({
                      visible: true,
                      x: e.clientX,
                      y: e.clientY,
                      title: `${c.name}: ${c.keyMechanism}`,
                      subtitle: `Attribution Score: ${c.score.toFixed(2)}`,
                      badge: isSelected ? "ACTIVE SELECTION" : "CANDIDATE CONFIG",
                      badgeColor: isSelected
                        ? "bg-amber-500/20 text-amber-300 border-amber-500/50"
                        : "bg-cyan-500/20 text-cyan-300 border-cyan-500/50",
                      details: [
                        { label: "Model fit / Score", value: `${c.score.toFixed(2)}`, color: "#fbbf24" },
                        { label: "Mechanism", value: c.keyMechanism, color: "#38bdf8" },
                        { label: "Counterfactual", value: `Restores to ${c.counterfactualPhenotype.toFixed(1)}`, color: "#94a3b8" },
                      ],
                    });
                  }}
                  onMouseLeave={() => {
                    setHoveredCandidateId(null);
                    setTooltip(null);
                  }}
                  className={`grid grid-cols-12 gap-1 items-center py-1 px-1 rounded-md cursor-pointer transition-all ${
                    isSelected
                      ? "bg-[#0c1b38] border border-cyan-500/60 shadow-[0_0_12px_rgba(56,189,248,0.25)]"
                      : "hover:bg-slate-900/60 border border-transparent text-slate-300"
                  }`}
                >
                  <div className="col-span-1 text-center font-mono text-[9px] text-slate-400 font-semibold">
                    {c.num}
                  </div>

                  <div className="col-span-3 flex items-center gap-1">
                    <span className={`text-[8px] font-mono font-bold px-1 rounded ${c.type === "INTERACTION" ? "bg-cyan-950 text-cyan-300" : c.type === "SEGMENT" ? "bg-purple-950 text-purple-300" : "bg-pink-950 text-pink-300"}`}>
                      {c.type.slice(0, 3)}
                    </span>
                    <span className="text-[8.5px] truncate font-medium">{c.name}</span>
                  </div>

                  <div className="col-span-3 flex items-center gap-1">
                    <div className="w-10 h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className={`h-full rounded-full ${isSelected ? "bg-amber-400" : "bg-cyan-400"}`}
                        style={{ width: `${c.score * 100}%` }}
                      />
                    </div>
                    <span className={`font-mono text-[8px] ${isSelected ? "text-cyan-300 font-bold" : "text-slate-400"}`}>
                      {c.score.toFixed(2)}
                    </span>
                  </div>

                  <div className="col-span-5 text-right text-[8px] truncate font-medium text-slate-300 pr-1">
                    {c.keyMechanism}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* STAGE 4: SELECTED MECHANISM */}
      {activeWorkflowStep === 4 && (
        <div className="flex-1 flex flex-col justify-between text-[9.5px] py-0.5">
          <div className="p-2 rounded-lg bg-[#051126] border border-cyan-500/40">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-1 mb-1">
              <span className="font-bold text-white text-xs">{selectedCandidate.name}</span>
              <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[8px] font-mono border border-amber-500/40">
                SCORE {selectedCandidate.score.toFixed(2)}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[8.5px]">
              <div>
                <span className="text-slate-400 block text-[7.5px]">CANDIDATE TYPE</span>
                <span className="font-mono text-cyan-300 font-bold">{selectedCandidate.type}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[7.5px]">COUNTERFACTUAL Δ</span>
                <span className="font-mono text-amber-300 font-bold">-{selectedCandidate.delta.toFixed(2)} SD</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[7.5px]">NOVELTY REMOVED</span>
                <span className="font-mono text-emerald-400 font-bold">Yes (Restores Envelope)</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[7.5px]">PARENT ORIGIN</span>
                <span className="font-mono text-slate-200">{selectedCandidate.parentOrigin?.slice(0, 14) || "Biparental"}</span>
              </div>
            </div>
          </div>

          <div className="space-y-1 text-[8px] font-mono text-slate-300 bg-[#040a18] p-1.5 rounded border border-slate-800/70">
            <div className="flex justify-between">
              <span className="text-slate-500">Homolog:</span>
              <span className="text-cyan-300">{selectedCandidate.homolog || "Homolog 1 ╪ 2"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Crossover Assoc:</span>
              <span className="text-pink-300">{selectedCandidate.crossoverAssociation || "Breakpoint 40–46 Mb"}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
