"use client";

import React from "react";
import { useValidation, ValidationStage } from "./ValidationInteractionContext";

export const StageNavigator: React.FC = () => {
  const { activeStage, setActiveStage, showTooltip, hideTooltip } = useValidation();

  const stages: {
    id: ValidationStage;
    title: string;
    subtitle: string;
    badge: string;
    details: { label: string; value: string; color?: string }[];
  }[] = [
    {
      id: 1,
      title: "Dataset Overview",
      subtitle: "Understand the data",
      badge: "BENCHMARK WORLDS",
      details: [
        { label: "Design", value: "Ground-truth separated synthetic genomes", color: "#38bdf8" },
        { label: "Seeds", value: "Multi-seed deterministic generator", color: "#f6c85f" },
      ],
    },
    {
      id: 2,
      title: "Model Performance",
      subtitle: "Evaluate predictive power",
      badge: "ACTIVE STAGE",
      details: [
        { label: "Status", value: "Blind mechanistic recovery", color: "#34d399" },
        { label: "Top-3 Recovery", value: "100% across all regimes", color: "#38bdf8" },
        { label: "Causal / Null", value: "2.27x separation ratio", color: "#ec4899" },
      ],
    },
    {
      id: 3,
      title: "Generalization",
      subtitle: "Test on unseen data",
      badge: "OUT-OF-DISTRIBUTION",
      details: [
        { label: "Scope", value: "Novel recombinant configurations", color: "#38bdf8" },
        { label: "Robustness", value: "Tested across easy, medium, hard", color: "#f6c85f" },
      ],
    },
    {
      id: 4,
      title: "Biological Plausibility",
      subtitle: "Check consistency",
      badge: "NEGATIVE CONTROLS",
      details: [
        { label: "Directionality", value: "Sign-consistent effect orientations", color: "#34d399" },
        { label: "Controls", value: "Additive nulls & unrelated crossovers pass", color: "#38bdf8" },
      ],
    },
    {
      id: 5,
      title: "Confidence & Limitations",
      subtitle: "Know what it means",
      badge: "INTERPRETATION & AUDIT",
      details: [
        { label: "Bound", value: "95% bootstrap confidence intervals", color: "#38bdf8" },
        { label: "Honesty", value: "No clinical/wet-lab extrapolation", color: "#f6c85f" },
      ],
    },
  ];

  return (
    <div
      role="tablist"
      aria-label="Validation Stages"
      className="h-full flex flex-col justify-between py-1 w-full select-none"
    >
      {stages.map((stage, idx) => {
        const isActive = activeStage === stage.id;
        return (
          <React.Fragment key={stage.id}>
            <div
              role="tab"
              aria-selected={isActive}
              tabIndex={0}
              onClick={() => setActiveStage(stage.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setActiveStage(stage.id);
                }
              }}
              onMouseEnter={(e) => {
                showTooltip({
                  x: e.clientX,
                  y: e.clientY,
                  title: `Stage ${stage.id}: ${stage.title}`,
                  subtitle: stage.subtitle,
                  badge: stage.badge,
                  badgeColor: isActive
                    ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50"
                    : "bg-slate-800/60 text-slate-400 border-slate-700/60",
                  details: stage.details,
                });
              }}
              onMouseLeave={hideTooltip}
              className={`px-2.5 py-2 rounded-2xl cursor-pointer transition-all duration-300 flex items-center gap-2.5 outline-none focus-visible:ring-1 focus-visible:ring-cyan-400 ${
                isActive
                  ? "bg-gradient-to-r from-blue-950/90 via-[#0a2347]/95 to-cyan-950/90 border border-cyan-400/90 shadow-[0_0_22px_rgba(56,189,248,0.35)]"
                  : "bg-[#040817]/70 border border-slate-800/70 hover:border-slate-700 hover:bg-[#070e22]/80 text-slate-400 hover:text-slate-200"
              }`}
            >
              {/* Number Circle */}
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold transition-all flex-shrink-0 ${
                  isActive
                    ? "bg-cyan-400 text-slate-950 shadow-[0_0_10px_rgba(56,189,248,0.8)]"
                    : "bg-[#0b142c] text-slate-400 border border-slate-700/80"
                }`}
              >
                {stage.id}
              </div>

              {/* Title and Subtitle */}
              <div className="flex flex-col text-left leading-[1.15] min-w-0">
                <span
                  className={`text-[10px] font-semibold tracking-tight ${
                    isActive ? "text-white font-bold" : "text-slate-200"
                  }`}
                >
                  {stage.title}
                </span>
                <span
                  className={`text-[8.5px] mt-0.5 ${
                    isActive ? "text-cyan-300" : "text-slate-400"
                  }`}
                >
                  {stage.subtitle}
                </span>
              </div>
            </div>

            {/* Connecting Arrow */}
            {idx < stages.length - 1 && (
              <div className="flex justify-center text-slate-500 text-[10px] my-0.5" aria-hidden="true">
                ↓
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
