"use client";

import React from "react";
import { useCounterfactual } from "./interactions/CounterfactualInteractionContext";

export const CounterfactualHeroOverlay: React.FC = () => {
  const { selectedCandidate, selectedCandidateType, activeWorkflowStep, showTooltip, hideTooltip } = useCounterfactual();

  const isStep1 = activeWorkflowStep === 1;
  const isStep2 = activeWorkflowStep === 2;
  const isStep3 = activeWorkflowStep === 3;
  const isStep4 = activeWorkflowStep === 4;

  // Mode label for Center Operator
  const operatorLabel =
    selectedCandidateType === "interaction"
      ? "Interaction Ablation"
      : selectedCandidateType === "segment"
      ? "Haplotype Block Swap"
      : "Variant Reversion";

  const operatorSub =
    selectedCandidateType === "interaction"
      ? "γ_3,7 = 0 epistatic decouple"
      : selectedCandidateType === "segment"
      ? "Recombinant segment swap"
      : `${selectedCandidate.originalAllele} → ${selectedCandidate.modifiedAllele} substitution`;

  return (
    <div className="absolute inset-0 pointer-events-none z-10 p-3 flex flex-col justify-between select-none">
      {/* Top Headers: Original vs Modified */}
      <div className="flex items-start justify-between w-full px-5 pt-1">
        {/* Left: Original Configuration */}
        <div className="text-left w-[200px]">
          <h3 className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-rose-300">
            Original Configuration
          </h3>
          <p className="text-[10px] text-slate-400">
            Produces novel phenotype
          </p>
        </div>

        {/* Right: Modified Configuration */}
        <div className={`text-right w-[200px] transition-opacity duration-300 ${isStep1 ? "opacity-20" : "opacity-100"}`}>
          <h3 className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-300">
            Modified Configuration
          </h3>
          <p className="text-[10px] text-cyan-400 font-medium">
            {isStep1 ? "Awaiting simulation in Step 2" : "Rescues phenotype to parental range"}
          </p>
        </div>
      </div>

      {/* SVG Connecting Leader Lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
        {/* Left Target Locus Leader Line */}
        <line
          x1="26%"
          y1="34%"
          x2="31%"
          y2="24%"
          stroke="#f6c85f"
          strokeWidth="1.2"
          strokeDasharray="2,2"
          opacity="0.85"
        />
        <circle cx="26%" cy="34%" r="3" fill="#f6c85f" />

        {/* Right Modified Locus Leader Line */}
        <line
          x1="63.5%"
          y1="34%"
          x2="71.5%"
          y2="24%"
          stroke="#38bdf8"
          strokeWidth="1.2"
          strokeDasharray="2,2"
          opacity={isStep1 ? 0.15 : 0.85}
        />
        <circle cx="63.5%" cy="34%" r="3" fill="#38bdf8" opacity={isStep1 ? 0.15 : 1} />
      </svg>

      {/* Floating Interactive Callout Cards & Center Operator */}
      <div className="relative w-full h-[180px] my-auto">
        {/* Floating Card: Target Variant (to the right of Left Chromosome) */}
        <div
          className={`absolute left-[31%] top-[8%] pointer-events-auto bg-[#050b18]/92 backdrop-blur-md border rounded-xl px-2 py-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.8)] text-left transition-all cursor-pointer group w-[114px] z-20 ${
            isStep1 ? "border-amber-400 shadow-[0_0_18px_rgba(245,158,11,0.5)]" : "border-amber-500/50 hover:border-amber-400"
          }`}
          onMouseEnter={(e) => {
            showTooltip({
              x: e.clientX,
              y: e.clientY,
              title: `Target Candidate: ${selectedCandidate.target}`,
              subtitle: selectedCandidate.provenance,
              badge: selectedCandidate.candidateType.toUpperCase(),
              badgeColor: "bg-amber-950/70 text-amber-300 border-amber-500/40",
              details: [
                { label: "Target locus", value: `${selectedCandidate.target}: ${selectedCandidate.locusMb} Mb`, color: "#f6c85f" },
                { label: "Observed state", value: selectedCandidate.originalAllele, color: "#f472b6" },
                { label: "Model contribution", value: selectedCandidate.originalEffect, color: "#f472b6" },
              ],
            });
          }}
          onMouseLeave={hideTooltip}
        >
          <div className="text-[10px] font-bold text-white mb-0.5 group-hover:text-amber-300 transition-colors">
            Target {selectedCandidateType === "interaction" ? "Interaction" : selectedCandidateType === "segment" ? "Segment" : "Variant"}
          </div>
          <div className="text-[8.5px] text-slate-300 font-mono">
            {selectedCandidate.target}: {selectedCandidate.locusMb} Mb
          </div>
          <div className="text-[8.5px] text-slate-400 font-mono">
            Allele: {selectedCandidate.originalAllele} (inherited)
          </div>
          <div className="text-[8.5px] text-slate-400 font-mono">
            Effect (model):{" "}
            <span className="text-pink-400 font-bold">
              {selectedCandidate.originalEffect}
            </span>
          </div>
        </div>

        {/* Center Operator Card: In Silico Modification */}
        <div
          className={`absolute left-[50.5%] top-[46%] -translate-x-1/2 -translate-y-1/2 pointer-events-auto bg-[#04091a]/90 backdrop-blur-md border rounded-2xl px-3 py-2 shadow-[0_0_30px_rgba(56,189,248,0.25)] text-center flex flex-col items-center justify-center transition-all cursor-pointer z-20 w-[118px] ${
            isStep1
              ? "opacity-35 border-slate-700"
              : isStep3
              ? "opacity-60 border-cyan-500/40"
              : "border-cyan-400 shadow-[0_0_24px_rgba(56,189,248,0.5)]"
          }`}
          onMouseEnter={(e) => {
            showTooltip({
              x: e.clientX,
              y: e.clientY,
              title: "In-Silico Counterfactual Operator",
              subtitle: `Computational ${operatorLabel.toLowerCase()}`,
              badge: "IN-SILICO MODEL",
              badgeColor: "bg-cyan-950/70 text-cyan-300 border-cyan-500/40",
              details: [
                { label: "Intervention mode", value: operatorLabel, color: "#38bdf8" },
                { label: "Target", value: selectedCandidate.modificationLabel, color: "#34d399" },
                { label: "Predicted shift", value: `${selectedCandidate.predictedDelta.toFixed(1)} units`, color: "#38bdf8" },
              ],
            });
          }}
          onMouseLeave={hideTooltip}
        >
          <span className="text-[10px] font-semibold tracking-wide text-cyan-300 font-sans">
            In Silico Modification
          </span>
          <div className="text-cyan-400 text-xs font-black tracking-widest my-0.5 animate-pulse">
            &gt;&gt;&gt;
          </div>
          <div className="px-2 py-0.5 mt-0.5 rounded-full bg-cyan-950/70 border border-cyan-500/50 text-[8px] font-mono text-cyan-300 font-medium">
            {isStep1 ? "Step 1: Select Target" : operatorLabel}
          </div>
          <span className="text-[7.5px] text-slate-400 mt-0.5 max-w-[110px] leading-tight">
            {isStep1 ? "Choose candidate to test" : operatorSub}
          </span>
        </div>

        {/* Floating Card: Modified Variant (to the right of Right Chromosome) */}
        <div
          className={`absolute left-[71.5%] top-[8%] pointer-events-auto bg-[#050b18]/92 backdrop-blur-md border rounded-xl px-2 py-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.8)] text-left transition-all cursor-pointer group w-[114px] z-20 ${
            isStep1 ? "opacity-20 border-slate-700 pointer-events-none" : "border-cyan-500/50 hover:border-cyan-400"
          }`}
          onMouseEnter={(e) => {
            showTooltip({
              x: e.clientX,
              y: e.clientY,
              title: "Modified Variant",
              subtitle: "Rescued locus allele under counterfactual test",
              badge: "RESCUED VARIANT",
              badgeColor: "bg-cyan-950/70 text-cyan-300 border-cyan-500/40",
              details: [
                { label: "Target locus", value: `${selectedCandidate.target}: ${selectedCandidate.locusMb} Mb`, color: "#38bdf8" },
                { label: "Alternative allele", value: selectedCandidate.modifiedAllele, color: "#34d399" },
                { label: "Counterfactual effect", value: selectedCandidate.modifiedEffect, color: "#38bdf8" },
              ],
            });
          }}
          onMouseLeave={hideTooltip}
        >
          <div className="text-[10px] font-bold text-white mb-0.5 group-hover:text-cyan-300 transition-colors">
            Modified {selectedCandidateType === "interaction" ? "Interaction" : selectedCandidateType === "segment" ? "Segment" : "Variant"}
          </div>
          <div className="text-[8.5px] text-slate-300 font-mono">
            {selectedCandidate.target}: {selectedCandidate.locusMb} Mb
          </div>
          <div className="text-[8.5px] text-slate-400 font-mono">
            Allele: {selectedCandidate.modifiedAllele} (alternative)
          </div>
          <div className="text-[8.5px] text-slate-400 font-mono">
            Effect (model):{" "}
            <span className="text-cyan-400 font-bold">
              {selectedCandidate.modifiedEffect}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Indicators: Predicted Phenotypes directly under each chromosome */}
      <div className="relative w-full h-12 pb-1">
        {/* Left: Original Phenotype */}
        <div className="absolute left-[24%] -translate-x-1/2 bottom-0 text-center w-[140px]">
          <div className="text-[8.5px] text-slate-400 font-mono uppercase tracking-wider">
            PREDICTED PHENOTYPE
          </div>
          <div className="text-2xl font-bold font-mono text-[#f6c85f] drop-shadow-[0_0_12px_rgba(246,200,95,0.5)]">
            +2.1
          </div>
          <div className="text-[9px] text-slate-400 font-medium">
            Outside parental range
          </div>
        </div>

        {/* Right: Modified Phenotype */}
        <div className={`absolute left-[61%] -translate-x-1/2 bottom-0 text-center w-[140px] transition-opacity duration-300 ${isStep1 ? "opacity-25" : "opacity-100"}`}>
          <div className="text-[8.5px] text-slate-400 font-mono uppercase tracking-wider">
            PREDICTED PHENOTYPE
          </div>
          <div className={`text-2xl font-bold font-mono text-cyan-400 ${isStep3 ? "drop-shadow-[0_0_18px_rgba(56,189,248,0.9)] animate-pulse" : "drop-shadow-[0_0_12px_rgba(56,189,248,0.5)]"}`}>
            {isStep1 ? "—" : `${selectedCandidate.newPhenotype > 0 ? "+" : ""}${selectedCandidate.newPhenotype.toFixed(1)}`}
          </div>
          <div className="text-[9px] text-cyan-400 font-medium flex items-center justify-center gap-1">
            {isStep1
              ? "Awaiting intervention"
              : selectedCandidate.noveltyRemoved
              ? "Within parental range"
              : "Partial shift"}
            {isStep4 && selectedCandidate.noveltyRemoved && (
              <span className="text-[8px] bg-cyan-950 px-1 rounded border border-cyan-400/40 text-cyan-300 font-bold">
                ✓ Rescued
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
