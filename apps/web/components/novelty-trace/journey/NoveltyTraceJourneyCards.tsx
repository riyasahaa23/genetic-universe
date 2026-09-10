"use client";

import React from "react";
import { useNoveltyTrace, TraceWorkflowStep } from "../interactions/NoveltyTraceInteractionContext";

export const NoveltyTraceJourneyCards: React.FC = () => {
  const { activeWorkflowStep, setActiveWorkflowStep } = useNoveltyTrace();

  const cards: {
    id: number;
    num: string;
    title: string;
    desc: string;
    step: TraceWorkflowStep;
    isActive: boolean;
    renderGraphic: () => JSX.Element;
  }[] = [
    {
      id: 1,
      num: "01",
      title: "Phenotype Input",
      desc: "Start from an observed phenotype.",
      step: 1,
      isActive: false,
      renderGraphic: () => (
        <svg viewBox="0 0 44 44" className="w-10 h-10">
          <circle cx="22" cy="22" r="14" fill="#034570" fillOpacity="0.4" stroke="#38bdf8" strokeWidth="1.2" />
          <circle cx="22" cy="22" r="8" fill="#fbbf24" fillOpacity="0.7" filter="drop-shadow(0 0 6px #fbbf24)" />
          <circle cx="22" cy="22" r="3" fill="#ffffff" />
          <circle cx="22" cy="22" r="18" fill="none" stroke="#38bdf8" strokeWidth="0.8" strokeDasharray="2 2" opacity="0.6" />
        </svg>
      ),
    },
    {
      id: 2,
      num: "02",
      title: "Trace Inference",
      desc: "Find genomic configurations that explain the phenotype.",
      step: 2,
      isActive: true, // ACTIVE IN REFERENCE IMAGE
      renderGraphic: () => (
        <svg viewBox="0 0 44 44" className="w-10 h-10">
          {/* Magnifying glass finding chromosomes */}
          <circle cx="20" cy="20" r="11" fill="none" stroke="#38bdf8" strokeWidth="2.5" />
          <line x1="28" y1="28" x2="38" y2="38" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" />
          {/* Miniature chromosomes inside lens */}
          <line x1="16" y1="14" x2="24" y2="26" stroke="#fbbf24" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="24" y1="14" x2="16" y2="26" stroke="#ec4899" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="20" cy="20" r="2" fill="#ffffff" />
        </svg>
      ),
    },
    {
      id: 3,
      num: "03",
      title: "Mechanism Interpretation",
      desc: "Understand the genetic drivers of novelty.",
      step: 4,
      isActive: false,
      renderGraphic: () => (
        <svg viewBox="0 0 44 44" className="w-10 h-10">
          {/* Mechanism network triangle */}
          <polygon points="22,10 11,32 33,32" fill="none" stroke="#a855f7" strokeWidth="1.5" strokeOpacity="0.8" />
          <circle cx="22" cy="10" r="3.5" fill="#fbbf24" filter="drop-shadow(0 0 4px #fbbf24)" />
          <circle cx="11" cy="32" r="3.5" fill="#38bdf8" />
          <circle cx="33" cy="32" r="3.5" fill="#ec4899" />
          <line x1="22" y1="10" x2="22" y2="24" stroke="#e0f2fe" strokeWidth="1" strokeDasharray="1 1" />
          <circle cx="22" cy="24" r="2.5" fill="#ffffff" />
        </svg>
      ),
    },
  ];

  return (
    <div className="w-full flex flex-col gap-2 mt-2">
      {/* 3 Cards */}
      <div className="w-full grid grid-cols-3 gap-3.5">
        {cards.map((card) => {
          return (
            <div
              key={card.id}
              onClick={() => setActiveWorkflowStep(card.step)}
              className={`rounded-xl p-3 flex items-center justify-between gap-3 cursor-pointer transition-all duration-300 relative ${
                card.isActive
                  ? "bg-[#0a1329]/95 border-2 border-cyan-400 shadow-[0_0_24px_rgba(56,189,248,0.35)]"
                  : "bg-[#060b18]/80 border border-slate-800/80 hover:border-slate-700/80 hover:bg-[#080f20]/90"
              }`}
            >
              {/* Graphic thumbnail */}
              <div className="flex-shrink-0 flex items-center justify-center p-1">
                {card.renderGraphic()}
              </div>

              {/* Middle text column */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-0.5">
                  <span className="text-[11px] font-mono font-bold text-slate-400">
                    {card.num}
                  </span>
                  <h4 className="text-[12.5px] font-semibold text-white tracking-wide">
                    {card.title}
                  </h4>
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  {card.desc}
                </p>
              </div>

              {/* Right circular arrow button */}
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs transition-colors flex-shrink-0 ${
                  card.isActive
                    ? "bg-cyan-500/30 text-cyan-300 border border-cyan-400/50"
                    : "border border-slate-800 text-slate-500 hover:text-slate-300"
                }`}
              >
                →
              </div>
            </div>
          );
        })}
      </div>

      {/* Sub-footer tracking text */}
      <div className="w-full flex items-center justify-between text-[9px] font-mono tracking-widest text-slate-500 pt-2 border-t border-slate-900/80 select-none">
        <div>SAME GENES. NEW WORLDS.</div>
        <div className="flex items-center gap-1.5 text-slate-400 hover:text-cyan-300 cursor-pointer transition-colors">
          <span>⌄</span>
          <span>SCROLL TO EXPLORE NOVELTY TRACE</span>
        </div>
        <div>SCIENCE / VISUALIZATION / POSSIBILITIES</div>
      </div>
    </div>
  );
};
