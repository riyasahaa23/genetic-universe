"use client";

import React from "react";
import { useCounterfactual } from "../interactions/CounterfactualInteractionContext";

export const CounterfactualJourneyCards: React.FC = () => {
  const { activeWorkflowStep, setActiveWorkflowStep } = useCounterfactual();

  const cards = [
    {
      id: 1,
      num: "01",
      title: "Identify Target",
      desc: "Select variants from novelty trace.",
      step: 1,
      isActive: activeWorkflowStep === 1,
      renderGraphic: () => (
        <svg viewBox="0 0 44 44" className="w-10 h-10">
          <circle
            cx="22"
            cy="22"
            r="15"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="1.5"
            strokeDasharray="3 3"
          />
          <circle
            cx="22"
            cy="22"
            r="8"
            fill="none"
            stroke="#ec4899"
            strokeWidth="1.8"
          />
          <line x1="22" y1="4" x2="22" y2="10" stroke="#38bdf8" strokeWidth="1.5" />
          <line x1="22" y1="34" x2="22" y2="40" stroke="#38bdf8" strokeWidth="1.5" />
          <line x1="4" y1="22" x2="10" y2="22" stroke="#38bdf8" strokeWidth="1.5" />
          <line x1="34" y1="22" x2="40" y2="22" stroke="#38bdf8" strokeWidth="1.5" />
          <circle cx="22" cy="22" r="3" fill="#f6c85f" filter="drop-shadow(0 0 4px #f6c85f)" />
        </svg>
      ),
    },
    {
      id: 2,
      num: "02",
      title: "Simulate Intervention",
      desc: "Test alternative alleles and configurations.",
      step: 2,
      isActive: true, // Prominently active as in reference image
      renderGraphic: () => (
        <svg viewBox="0 0 44 44" className="w-10 h-10">
          {/* Double chromosome X glyph */}
          <line
            x1="12"
            y1="10"
            x2="32"
            y2="34"
            stroke="#38bdf8"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <line
            x1="32"
            y1="10"
            x2="12"
            y2="34"
            stroke="#ec4899"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <circle cx="22" cy="22" r="4.5" fill="#030712" stroke="#f6c85f" strokeWidth="2" />
        </svg>
      ),
    },
    {
      id: 3,
      num: "03",
      title: "Evaluate Rescue",
      desc: "Determine if the phenotype returns to the parental range.",
      step: 3,
      isActive: activeWorkflowStep === 3,
      renderGraphic: () => (
        <svg viewBox="0 0 44 44" className="w-10 h-10">
          {/* 3 Distribution bars */}
          <rect
            x="10"
            y="20"
            width="5"
            height="16"
            rx="2.5"
            fill="#ec4899"
            opacity="0.8"
          />
          <rect
            x="19"
            y="12"
            width="5"
            height="24"
            rx="2.5"
            fill="#38bdf8"
            className="filter drop-shadow-[0_0_4px_#38bdf8]"
          />
          <rect
            x="28"
            y="17"
            width="5"
            height="19"
            rx="2.5"
            fill="#f6c85f"
            opacity="0.85"
          />
          <line x1="6" y1="38" x2="38" y2="38" stroke="#475569" strokeWidth="1" />
        </svg>
      ),
    },
  ];

  return (
    <div className="w-full flex flex-col gap-2 mt-1">
      {/* 3 Cards */}
      <div className="w-full grid grid-cols-3 gap-3.5">
        {cards.map((card) => {
          return (
            <div
              key={card.id}
              onClick={() => setActiveWorkflowStep(card.step)}
              className={`rounded-xl p-2.5 flex items-center justify-between gap-3 cursor-pointer transition-all duration-300 relative ${
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
                  <span
                    className={`text-[11px] font-mono font-bold ${
                      card.isActive ? "text-cyan-400" : "text-slate-400"
                    }`}
                  >
                    {card.num}
                  </span>
                  <h4 className="text-[12px] font-semibold text-white tracking-wide truncate">
                    {card.title}
                  </h4>
                </div>
                <p className="text-[10px] text-slate-400 leading-tight line-clamp-1">
                  {card.desc}
                </p>
              </div>

              {/* Right navigation arrow (crisp SVG) */}
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${
                  card.isActive
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/80 shadow-[0_0_10px_rgba(56,189,248,0.4)]"
                    : "bg-slate-800/60 text-slate-400 border border-slate-700/60 hover:text-white"
                }`}
              >
                <svg
                  viewBox="0 0 24 24"
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </div>
            </div>
          );
        })}
      </div>

      {/* Subtle Sub-Footer Tracking Line */}
      <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 tracking-widest uppercase pt-1 px-1">
        <span>SAME GENES. NEW WORLDS.</span>
        <span className="flex items-center gap-1 text-slate-400 hover:text-cyan-400 cursor-pointer transition-colors">
          <span>⌵</span>
          <span>SCROLL TO EXPLORE COUNTERFACTUAL RESCUE</span>
        </span>
        <span>SCIENCE / VISUALIZATION / POSSIBILITIES</span>
      </div>
    </div>
  );
};
