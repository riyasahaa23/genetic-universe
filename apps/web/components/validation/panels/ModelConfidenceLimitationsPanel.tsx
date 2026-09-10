"use client";

import React from "react";
import { useValidation } from "../ValidationInteractionContext";

export const ModelConfidenceLimitationsPanel: React.FC = () => {
  const {
    activeStage,
    selectedConfidenceSection,
    setSelectedConfidenceSection,
    showTooltip,
    hideTooltip,
  } = useValidation();

  const isStage5 = activeStage === 5;

  return (
    <div
      className={`h-full bg-[#040817]/90 backdrop-blur-md border rounded-2xl p-2.5 flex flex-col justify-between select-none transition-all duration-300 ${
        isStage5
          ? "border-amber-500/60 shadow-[0_0_24px_rgba(245,158,11,0.2)] ring-1 ring-amber-500/30"
          : "border-slate-800/80 shadow-[0_4px_24px_rgba(0,0,0,0.5)]"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-0.5">
        <h3 className="text-xs font-bold text-white font-sans tracking-wide">
          Model Confidence & Limitations
        </h3>
        {isStage5 && (
          <span className="text-[8px] font-mono text-amber-300 bg-amber-950/70 border border-amber-500/40 px-1.5 py-0.2 rounded animate-pulse">
            AUDIT BOUNDS
          </span>
        )}
      </div>

      {/* 3 Columns Grid */}
      <div className="grid grid-cols-3 gap-2 flex-1 items-stretch py-0.5">
        {/* Column 1: Strengths */}
        <div
          onClick={() => setSelectedConfidenceSection("strengths")}
          className={`rounded-xl p-2 flex flex-col justify-start cursor-pointer transition-all duration-200 text-left ${
            selectedConfidenceSection === "strengths"
              ? "bg-[#061e38]/90 border border-cyan-400/90 shadow-[0_0_14px_rgba(56,189,248,0.3)] scale-[1.01]"
              : "bg-[#051124]/60 border border-cyan-500/20 hover:border-cyan-500/40"
          }`}
          onMouseEnter={(e) => {
            showTooltip({
              x: e.clientX,
              y: e.clientY,
              title: "Framework Strengths",
              subtitle: "Key scientific capabilities validated by benchmark",
              badge: "STRENGTHS",
              badgeColor: "bg-cyan-950/70 text-cyan-300 border-cyan-500/40",
              details: [
                { label: "Non-linear", value: "Recovers higher-order epistasis", color: "#38bdf8" },
                { label: "Interpretable", value: "Mechanistic decomposition", color: "#34d399" },
                { label: "Rank 1-3", value: "100% causal top-3 recovery", color: "#38bdf8" },
              ],
            });
          }}
          onMouseLeave={hideTooltip}
        >
          <div className="flex items-center gap-1.5 mb-1.5">
            <div className="w-4 h-4 rounded flex items-center justify-center text-cyan-400 text-[11px]">
              🛡
            </div>
            <span className="text-[9.5px] font-bold text-white">Strengths</span>
          </div>
          <ul className="space-y-1 text-[8px] text-slate-300 leading-tight">
            <li className="flex items-center gap-1">
              <span className="text-cyan-400">•</span>
              <span>Captures non-linear effects</span>
            </li>
            <li className="flex items-center gap-1">
              <span className="text-cyan-400">•</span>
              <span>100% Top-3 recovery</span>
            </li>
            <li className="flex items-center gap-1">
              <span className="text-cyan-400">•</span>
              <span>Interpretable components</span>
            </li>
          </ul>
        </div>

        {/* Column 2: Limitations */}
        <div
          onClick={() => setSelectedConfidenceSection("limitations")}
          className={`rounded-xl p-2 flex flex-col justify-start cursor-pointer transition-all duration-200 text-left ${
            selectedConfidenceSection === "limitations"
              ? "bg-[#241705]/90 border border-amber-400/90 shadow-[0_0_14px_rgba(245,158,11,0.3)] scale-[1.01]"
              : "bg-[#140e06]/60 border border-amber-500/20 hover:border-amber-500/40"
          }`}
          onMouseEnter={(e) => {
            showTooltip({
              x: e.clientX,
              y: e.clientY,
              title: "Model Limitations",
              subtitle: "Explicit boundaries of current computational models",
              badge: "LIMITATIONS",
              badgeColor: "bg-amber-950/70 text-amber-300 border-amber-500/40",
              details: [
                { label: "Biological scope", value: "In-silico benchmark calibration only", color: "#fbbf24" },
                { label: "Wet-lab", value: "No clinical/wet-lab extrapolation", color: "#f87171" },
                { label: "Distractor ratio", value: "Precision sensitive to pool size", color: "#fbbf24" },
              ],
            });
          }}
          onMouseLeave={hideTooltip}
        >
          <div className="flex items-center gap-1.5 mb-1.5">
            <div className="w-4 h-4 rounded flex items-center justify-center text-amber-400 text-[11px]">
              ⚠
            </div>
            <span className="text-[9.5px] font-bold text-white">Limitations</span>
          </div>
          <ul className="space-y-1 text-[8px] text-slate-300 leading-tight">
            <li className="flex items-center gap-1">
              <span className="text-amber-400">•</span>
              <span>In-silico benchmark only</span>
            </li>
            <li className="flex items-center gap-1">
              <span className="text-amber-400">•</span>
              <span>Distractor pool sensitivity</span>
            </li>
            <li className="flex items-center gap-1">
              <span className="text-amber-400">•</span>
              <span>No clinical claims made</span>
            </li>
          </ul>
        </div>

        {/* Column 3: Future Directions */}
        <div
          onClick={() => setSelectedConfidenceSection("future")}
          className={`rounded-xl p-2 flex flex-col justify-start cursor-pointer transition-all duration-200 text-left ${
            selectedConfidenceSection === "future"
              ? "bg-[#0c1a3b]/90 border border-blue-400/90 shadow-[0_0_14px_rgba(96,165,250,0.3)] scale-[1.01]"
              : "bg-[#050e20]/60 border border-blue-500/20 hover:border-blue-500/40"
          }`}
          onMouseEnter={(e) => {
            showTooltip({
              x: e.clientX,
              y: e.clientY,
              title: "Future Directions",
              subtitle: "Planned expansions and experimental avenues",
              badge: "ROADMAP",
              badgeColor: "bg-blue-950/70 text-blue-300 border-blue-500/40",
              details: [
                { label: "Data scale", value: "Whole-genome trio cohorts", color: "#60a5fa" },
                { label: "Experimental", value: "Wet-lab assay coupling", color: "#c084fc" },
                { label: "Network scale", value: "Higher-order epistatic graphs", color: "#38bdf8" },
              ],
            });
          }}
          onMouseLeave={hideTooltip}
        >
          <div className="flex items-center gap-1.5 mb-1.5">
            <div className="w-4 h-4 rounded flex items-center justify-center text-blue-400 text-[11px]">
              📊
            </div>
            <span className="text-[9.5px] font-bold text-white">Future Directions</span>
          </div>
          <ul className="space-y-1 text-[8px] text-slate-300 leading-tight">
            <li className="flex items-center gap-1">
              <span className="text-blue-400">•</span>
              <span>Larger multi-seed cohorts</span>
            </li>
            <li className="flex items-center gap-1">
              <span className="text-blue-400">•</span>
              <span>Higher-order epistasis graphs</span>
            </li>
            <li className="flex items-center gap-1">
              <span className="text-blue-400">•</span>
              <span>Prospective wet-lab validation</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
