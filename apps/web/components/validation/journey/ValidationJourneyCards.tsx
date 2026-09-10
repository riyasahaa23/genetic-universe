"use client";

import React from "react";
import { useValidation, ValidationStage } from "../ValidationInteractionContext";

export const ValidationJourneyCards: React.FC = () => {
  const { activeStage, setActiveStage } = useValidation();

  const cards = [
    {
      id: 1,
      num: "01",
      title: "Evaluate Performance",
      desc: "How well does the model predict?",
      stage: 2 as ValidationStage,
      isActive: false,
      renderGraphic: () => (
        <svg viewBox="0 0 44 44" className="w-10 h-10">
          {/* 3 Distribution bars */}
          <rect
            x="10"
            y="18"
            width="5"
            height="18"
            rx="2.5"
            fill="#ec4899"
            opacity="0.85"
          />
          <rect
            x="19"
            y="10"
            width="5"
            height="26"
            rx="2.5"
            fill="#38bdf8"
            className="filter drop-shadow-[0_0_4px_#38bdf8]"
          />
          <rect
            x="28"
            y="15"
            width="5"
            height="21"
            rx="2.5"
            fill="#f6c85f"
            opacity="0.85"
          />
          <line x1="6" y1="38" x2="38" y2="38" stroke="#475569" strokeWidth="1" />
        </svg>
      ),
    },
    {
      id: 2,
      num: "02",
      title: "Test Generalization",
      desc: "Does it work for novel configurations?",
      stage: 3 as ValidationStage,
      isActive: true, // Prominently active as in reference image
      renderGraphic: () => (
        <svg viewBox="0 0 44 44" className="w-10 h-10">
          {/* Triangular network of nodes */}
          <line x1="22" y1="11" x2="11" y2="31" stroke="#38bdf8" strokeWidth="1.5" />
          <line x1="11" y1="31" x2="33" y2="31" stroke="#ec4899" strokeWidth="1.5" />
          <line x1="33" y1="31" x2="22" y2="11" stroke="#f6c85f" strokeWidth="1.5" />
          <circle cx="22" cy="11" r="3.5" fill="#38bdf8" filter="drop-shadow(0 0 4px #38bdf8)" />
          <circle cx="11" cy="31" r="3.5" fill="#ec4899" filter="drop-shadow(0 0 4px #ec4899)" />
          <circle cx="33" cy="31" r="3.5" fill="#f6c85f" filter="drop-shadow(0 0 4px #f6c85f)" />
          <circle cx="22" cy="24" r="2" fill="#ffffff" />
        </svg>
      ),
    },
    {
      id: 3,
      num: "03",
      title: "Build Confidence",
      desc: "Understand strengths and limitations.",
      stage: 5 as ValidationStage,
      isActive: false,
      renderGraphic: () => (
        <svg viewBox="0 0 44 44" className="w-10 h-10">
          {/* Glowing Shield Icon */}
          <path
            d="M22 8 L32 13 V23 C32 29 27 34 22 36 C17 34 12 29 12 23 V13 Z"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="2"
            className="filter drop-shadow-[0_0_6px_rgba(56,189,248,0.5)]"
          />
          <path
            d="M22 12 L29 16 V23 C29 27 25.5 31 22 32.5 C18.5 31 15 27 15 23 V16 Z"
            fill="rgba(56,189,248,0.15)"
            stroke="#a855f7"
            strokeWidth="1.2"
          />
          <polyline
            points="18,22 21,25 26,19"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
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
              onClick={() => setActiveStage(card.stage)}
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
          <span>SCROLL TO EXPLORE VALIDATION</span>
        </span>
        <span>SCIENCE / VISUALIZATION / POSSIBILITIES</span>
      </div>
    </div>
  );
};
