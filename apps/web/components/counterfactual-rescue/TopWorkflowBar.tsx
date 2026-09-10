"use client";

import React from "react";
import { useCounterfactual } from "./interactions/CounterfactualInteractionContext";

export const TopWorkflowBar: React.FC = () => {
  const { activeWorkflowStep, setActiveWorkflowStep, selectedCandidate, showTooltip, hideTooltip } =
    useCounterfactual();

  const steps = [
    {
      id: 1,
      title: "Select Target",
      desc: "Choose candidate",
      details: [
        { label: "Target locus", value: `${selectedCandidate.target} (${selectedCandidate.locusMb} Mb)`, color: "#f6c85f" },
        { label: "Candidate type", value: selectedCandidate.candidateType.toUpperCase(), color: "#38bdf8" },
        { label: "Selection basis", value: "Novelty trace attribution", color: "#38bdf8" },
      ],
    },
    {
      id: 2,
      title: "Simulate Intervention",
      desc: "In-silico modification",
      details: [
        { label: "Current status", value: "Active counterfactual test", color: "#38bdf8" },
        { label: "Modification", value: `${selectedCandidate.target}: ${selectedCandidate.modificationLabel}`, color: "#34d399" },
        { label: "Intervention mode", value: selectedCandidate.candidateType === "interaction" ? "Edge ablation" : selectedCandidate.candidateType === "segment" ? "Haplotype swap" : "Variant reversion", color: "#f472b6" },
      ],
    },
    {
      id: 3,
      title: "Evaluate Effect",
      desc: "Predict phenotype",
      details: [
        { label: "Model engine", value: "Non-linear trait evaluation", color: "#f472b6" },
        { label: "Predicted Δ", value: `${selectedCandidate.predictedDelta.toFixed(1)} units`, color: "#38bdf8" },
        { label: "Rescued phenotype", value: `${selectedCandidate.newPhenotype > 0 ? "+" : ""}${selectedCandidate.newPhenotype.toFixed(1)}`, color: "#34d399" },
      ],
    },
    {
      id: 4,
      title: "Compare & Interpret",
      desc: "Assess rescue",
      details: [
        { label: "Parental envelope", value: selectedCandidate.noveltyRemoved ? `Restored (+${selectedCandidate.newPhenotype.toFixed(1)})` : `Partial shift (+${selectedCandidate.newPhenotype.toFixed(1)})`, color: selectedCandidate.noveltyRemoved ? "#34d399" : "#fbbf24" },
        { label: "Novelty removed", value: selectedCandidate.noveltyRemoved ? "TRUE" : "FALSE (Partial)", color: selectedCandidate.noveltyRemoved ? "#34d399" : "#fbbf24" },
        { label: "Sufficiency", value: selectedCandidate.isMinimal ? "Minimal evaluated rescue" : "Evaluated candidate subset", color: "#f6c85f" },
      ],
    },
  ];

  return (
    <div
      role="tablist"
      aria-label="Counterfactual Rescue Scientific Stages"
      className="flex items-center justify-between p-1 rounded-2xl bg-[#040817]/90 border border-slate-800/80 backdrop-blur-md shadow-[0_4px_24px_rgba(0,0,0,0.6)] w-full select-none"
    >
      {steps.map((step) => {
        const isActive = activeWorkflowStep === step.id;
        return (
          <div
            key={step.id}
            role="tab"
            aria-selected={isActive}
            tabIndex={0}
            onClick={() => setActiveWorkflowStep(step.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setActiveWorkflowStep(step.id);
              }
            }}
            onMouseEnter={(e) => {
              showTooltip({
                x: e.clientX,
                y: e.clientY,
                title: `Step ${step.id}: ${step.title}`,
                subtitle: step.desc,
                badge: isActive ? "ACTIVE SIMULATION" : "WORKFLOW STEP",
                badgeColor: isActive
                  ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50"
                  : "bg-slate-800/60 text-slate-400 border-slate-700/60",
                details: step.details,
              });
            }}
            onMouseLeave={hideTooltip}
            className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl cursor-pointer transition-all duration-300 flex-1 outline-none ${
              isActive
                ? "bg-gradient-to-r from-blue-950/90 via-[#0a2347]/95 to-cyan-950/90 border border-cyan-400/80 shadow-[0_0_20px_rgba(56,189,248,0.35)]"
                : "hover:bg-slate-900/50 text-slate-400 hover:text-slate-200 border border-transparent"
            }`}
          >
            {/* Step Number Circle */}
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold transition-all flex-shrink-0 ${
                isActive
                  ? "bg-cyan-400 text-slate-950 shadow-[0_0_10px_rgba(56,189,248,0.8)]"
                  : "bg-[#0b142c] text-slate-400 border border-slate-700/80"
              }`}
            >
              {step.id}
            </div>

            {/* Title & Desc */}
            <div className="flex flex-col text-left leading-tight min-w-0">
              <span
                className={`text-[11px] font-semibold tracking-wide truncate ${
                  isActive ? "text-white font-bold" : "text-slate-300"
                }`}
              >
                {step.title}
              </span>
              <span
                className={`text-[9.5px] truncate ${
                  isActive ? "text-cyan-300" : "text-slate-400"
                }`}
              >
                {step.desc}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
