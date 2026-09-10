"use client";

import React from "react";
import { useNoveltyTrace, VerticalStage } from "./interactions/NoveltyTraceInteractionContext";

export const VerticalTraceStages: React.FC = () => {
  const { activeTraceStage, setActiveTraceStage, setTooltip } = useNoveltyTrace();

  const stages: {
    id: VerticalStage;
    title: string;
    desc: string;
    topPct: string;
    details: { label: string; value: string; color?: string }[];
  }[] = [
    {
      id: 1,
      title: "Phenotype Input",
      desc: "Observed transgressive value",
      topPct: "8%",
      details: [
        { label: "Target phenotype", value: "+2.1 (Transgressive)", color: "#fbbf24" },
        { label: "Parental envelope", value: "[-1.5, +1.0]", color: "#38bdf8" },
      ],
    },
    {
      id: 2,
      title: "Model-based Search",
      desc: "Backward computational attribution",
      topPct: "32%",
      details: [
        { label: "Attribution engine", value: "Model-relative candidate search", color: "#38bdf8" },
        { label: "Search mode", value: "Non-linear interaction scanning", color: "#c084fc" },
      ],
    },
    {
      id: 3,
      title: "Candidate Genomic Configurations",
      desc: "Ranked structural solutions",
      topPct: "58%",
      details: [
        { label: "Evaluated configurations", value: "3 primary candidates in 3D", color: "#fbbf24" },
        { label: "Ranking metric", value: "Model Attribution Score", color: "#38bdf8" },
      ],
    },
    {
      id: 4,
      title: "Mechanism Interpretation",
      desc: "Epistatic & recombinant drivers",
      topPct: "88%",
      details: [
        { label: "Mechanism breakdown", value: "Additive, Dominance, Epistasis", color: "#ec4899" },
        { label: "Counterfactual", value: "Restores parental envelope", color: "#38bdf8" },
      ],
    },
  ];

  return (
    <div className="absolute left-2 top-16 bottom-8 w-44 z-20 pointer-events-none select-none">
      {/* Continuous Vertical Neon Line */}
      <div className="absolute left-[11px] top-[14px] bottom-[18px] w-[1.5px] bg-gradient-to-b from-cyan-500/60 via-cyan-400/40 to-slate-700/40 shadow-[0_0_8px_rgba(56,189,248,0.4)]" />

      {stages.map((st) => {
        const isActive = activeTraceStage === st.id;
        return (
          <button
            key={st.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            tabIndex={0}
            onClick={() => setActiveTraceStage(st.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setActiveTraceStage(st.id);
              }
            }}
            onMouseEnter={(e) => {
              setTooltip({
                visible: true,
                x: e.clientX,
                y: e.clientY,
                title: st.title,
                subtitle: st.desc,
                badge: isActive ? "ACTIVE LAYER" : "TRACE STAGE",
                badgeColor: isActive
                  ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50"
                  : "bg-slate-800/60 text-slate-400 border-slate-700/60",
                details: st.details,
              });
            }}
            onMouseLeave={() => setTooltip(null)}
            className="absolute left-0 flex items-center gap-2.5 cursor-pointer pointer-events-auto group transition-all text-left bg-transparent border-0 p-0"
            style={{ top: st.topPct }}
          >
            {/* Outer Ring & Inner Dot */}
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center transition-all bg-[#040916] border ${
                isActive
                  ? "border-cyan-400 shadow-[0_0_12px_rgba(56,189,248,0.8)] scale-110"
                  : "border-slate-700 group-hover:border-cyan-500/60"
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full transition-all ${
                  isActive ? "bg-cyan-300 shadow-[0_0_6px_#38bdf8]" : "bg-slate-500 group-hover:bg-cyan-400"
                }`}
              />
            </div>

            {/* Label */}
            <div className="flex flex-col text-left leading-tight max-w-[125px]">
              <span
                className={`text-[10px] font-semibold tracking-wide transition-colors ${
                  isActive ? "text-cyan-200 font-bold" : "text-slate-300 group-hover:text-white"
                }`}
              >
                {st.title}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
};
