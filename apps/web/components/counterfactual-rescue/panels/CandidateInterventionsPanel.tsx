"use client";

import React from "react";
import { useCounterfactual } from "../interactions/CounterfactualInteractionContext";

export const CandidateInterventionsPanel: React.FC = () => {
  const {
    candidates,
    selectedCandidateId,
    setSelectedCandidateId,
    activeWorkflowStep,
    showTooltip,
    hideTooltip,
  } = useCounterfactual();

  const isStep1 = activeWorkflowStep === 1;

  return (
    <div
      className={`h-full bg-[#040817]/90 backdrop-blur-md rounded-2xl p-2.5 flex flex-col justify-between shadow-[0_4px_24px_rgba(0,0,0,0.5)] select-none transition-all duration-300 ${
        isStep1
          ? "border-2 border-cyan-400/90 shadow-[0_0_24px_rgba(56,189,248,0.35)]"
          : "border border-slate-800/80"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-0.5">
        <div className="flex items-center gap-1.5">
          <h3 className="text-xs font-bold text-white font-sans tracking-wide">
            Candidate Modifications
          </h3>
          {isStep1 && (
            <span className="px-1.5 py-0.2 rounded-full bg-cyan-950 border border-cyan-400/60 text-cyan-300 font-mono text-[7.5px] font-bold uppercase tracking-wider animate-pulse">
              Select Target
            </span>
          )}
        </div>
        <button
          className="w-4 h-4 rounded-full bg-slate-800/60 border border-slate-700/60 flex items-center justify-center text-[10px] text-slate-400 hover:text-cyan-300 hover:border-cyan-500/50 transition-colors"
          title="Browse candidates"
        >
          &gt;
        </button>
      </div>

      {/* Table */}
      <div className="w-full flex-1 flex flex-col justify-between overflow-hidden">
        <table className="w-full text-left border-collapse text-[9.5px]">
          <thead>
            <tr className="text-[8px] font-mono uppercase text-slate-400 border-b border-slate-800/60">
              <th className="py-0.5 px-0.5 font-semibold">#</th>
              <th className="py-0.5 px-0.5 font-semibold">Target</th>
              <th className="py-0.5 px-0.5 font-semibold">Modification</th>
              <th className="py-0.5 px-0.5 font-semibold">Predicted Δ</th>
              <th className="py-0.5 px-0.5 font-semibold">New Phenotype</th>
              <th className="py-0.5 px-0.5 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {candidates.map((cand) => {
              const isSelected = cand.id === selectedCandidateId;
              const isRescue = cand.status === "Rescue";
              const isMinimal = cand.status === "Minimal";

              return (
                <tr
                  key={cand.id}
                  data-candidate-id={cand.id}
                  role="row"
                  tabIndex={0}
                  aria-selected={isSelected}
                  onClick={() => setSelectedCandidateId(cand.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedCandidateId(cand.id);
                    }
                  }}
                  onMouseEnter={(e) => {
                    showTooltip({
                      x: e.clientX,
                      y: e.clientY,
                      title: `${cand.target}: ${cand.modificationLabel}`,
                      subtitle: cand.explanation,
                      badge: `${cand.candidateType.toUpperCase()} · ${cand.status.toUpperCase()}`,
                      badgeColor: isRescue
                        ? "bg-cyan-950/80 text-cyan-300 border-cyan-500/50"
                        : "bg-amber-950/80 text-amber-300 border-amber-500/50",
                      details: [
                        { label: "Target locus", value: `${cand.target} (${cand.locusMb} Mb)`, color: "#f6c85f" },
                        { label: "Provenance", value: cand.provenance, color: "#38bdf8" },
                        { label: "Predicted shift", value: `${cand.predictedDelta.toFixed(1)} units`, color: "#38bdf8" },
                        { label: "New phenotype", value: `${cand.newPhenotype > 0 ? "+" : ""}${cand.newPhenotype.toFixed(1)}`, color: isRescue ? "#34d399" : "#fbbf24" },
                        { label: "Sufficiency", value: cand.isMinimal ? "Minimal evaluated rescue" : "Evaluated intervention", color: "#e2e8f0" },
                      ],
                    });
                  }}
                  onMouseLeave={hideTooltip}
                  className={`cursor-pointer transition-all duration-150 border-b border-slate-800/30 outline-none ${
                    isSelected
                      ? "bg-cyan-950/60 border-l-2 border-l-cyan-400 text-white font-medium shadow-[inset_0_0_12px_rgba(56,189,248,0.2)]"
                      : "hover:bg-slate-900/40 text-slate-300"
                  }`}
                >
                  <td className="py-0.5 px-0.5 font-mono text-slate-400">
                    {cand.id}
                  </td>
                  <td className="py-0.5 px-0.5 font-semibold text-white">
                    {cand.target}
                  </td>
                  <td className="py-0.5 px-0.5 font-mono text-cyan-300">
                    {cand.modificationLabel}
                  </td>
                  <td className="py-0.5 px-0.5 font-mono text-slate-300">
                    {cand.predictedDelta.toFixed(1)}
                  </td>
                  <td
                    className={`py-0.5 px-0.5 font-mono font-medium ${
                      isRescue ? "text-cyan-400" : "text-slate-300"
                    }`}
                  >
                    {cand.newPhenotype > 0 ? "+" : ""}
                    {cand.newPhenotype.toFixed(1)}
                  </td>
                  <td className="py-0.5 px-0.5">
                    <span className="inline-flex items-center gap-1 text-[8.5px] font-mono">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isRescue
                            ? "bg-cyan-400 shadow-[0_0_6px_#38bdf8]"
                            : isMinimal
                            ? "bg-cyan-300 shadow-[0_0_4px_#38bdf8]"
                            : "bg-amber-400 shadow-[0_0_6px_#fbbf24]"
                        }`}
                      />
                      <span
                        className={
                          isRescue || isMinimal ? "text-cyan-300" : "text-amber-300"
                        }
                      >
                        {cand.status}
                      </span>
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
