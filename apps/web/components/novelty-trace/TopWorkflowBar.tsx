"use client";

import React from "react";
import { useNoveltyTrace, TraceWorkflowStep } from "./interactions/NoveltyTraceInteractionContext";

export const TopWorkflowBar: React.FC = () => {
  const { activeWorkflowStep, setActiveWorkflowStep, setTooltip } = useNoveltyTrace();

  const steps: {
    id: TraceWorkflowStep;
    title: string;
    desc: string;
    details: { label: string; value: string; color?: string }[];
  }[] = [
    {
      id: 1,
      title: "Phenotype Input",
      desc: "Observed trait value",
      details: [
        { label: "Observed value", value: "+2.1 normalized", color: "#fbbf24" },
        { label: "Status", value: "Transgressive / Outside envelope", color: "#38bdf8" },
      ],
    },
    {
      id: 2,
      title: "Trace Inference",
      desc: "Search genomic space",
      details: [
        { label: "Search algorithm", value: "Model-relative candidate search", color: "#38bdf8" },
        { label: "Evaluation", value: "Explanatory attribution scoring", color: "#c084fc" },
      ],
    },
    {
      id: 3,
      title: "Candidate Configurations",
      desc: "Ranked solutions",
      details: [
        { label: "Candidate pool", value: "5 ranked genomic configurations", color: "#fbbf24" },
        { label: "Top score", value: "0.82 (Candidate 1)", color: "#38bdf8" },
      ],
    },
    {
      id: 4,
      title: "Mechanism Analysis",
      desc: "Interpret genetic drivers",
      details: [
        { label: "Decomposition", value: "Epistasis + Additive + Dominance", color: "#ec4899" },
        { label: "Counterfactual", value: "Tested against parental range", color: "#94a3b8" },
      ],
    },
  ];

  return (
    <div
      role="tablist"
      aria-label="Novelty Trace Workflow Stages"
      className="flex items-center justify-between p-1.5 rounded-2xl bg-[#040817]/90 border border-slate-800/80 backdrop-blur-md shadow-[0_4px_24px_rgba(0,0,0,0.6)] w-full select-none"
    >
      {/* Hidden screen-reader announcement for stage changes */}
      <div className="sr-only" aria-live="polite" role="status">
        {`Current active scientific stage: Step ${activeWorkflowStep} of 4: ${steps[activeWorkflowStep - 1]?.title}. ${steps[activeWorkflowStep - 1]?.desc}`}
      </div>

      {steps.map((step) => {
        const isActive = activeWorkflowStep === step.id;
        return (
          <button
            key={step.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls={`panel-stage-${step.id}`}
            id={`tab-stage-${step.id}`}
            tabIndex={0}
            onClick={() => setActiveWorkflowStep(step.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setActiveWorkflowStep(step.id);
              } else if (e.key === "ArrowRight") {
                e.preventDefault();
                const nextStep = step.id === 4 ? 1 : ((step.id + 1) as TraceWorkflowStep);
                setActiveWorkflowStep(nextStep);
              } else if (e.key === "ArrowLeft") {
                e.preventDefault();
                const prevStep = step.id === 1 ? 4 : ((step.id - 1) as TraceWorkflowStep);
                setActiveWorkflowStep(prevStep);
              }
            }}
            onMouseEnter={(e) => {
              setTooltip({
                visible: true,
                x: e.clientX,
                y: e.clientY,
                title: `Step ${step.id}: ${step.title}`,
                subtitle: step.desc,
                badge: isActive ? "ACTIVE STAGE" : "WORKFLOW STEP",
                badgeColor: isActive
                  ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50"
                  : "bg-slate-800/60 text-slate-400 border-slate-700/60",
                details: step.details,
              });
            }}
            onMouseLeave={() => setTooltip(null)}
            className={`flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl cursor-pointer transition-all duration-300 flex-1 text-left ${
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
                className={`text-[9px] truncate ${
                  isActive ? "text-cyan-300" : "text-slate-500"
                }`}
              >
                {step.desc}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
};
