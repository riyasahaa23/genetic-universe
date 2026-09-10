"use client";

import React from "react";
import { usePhenotypeInteraction } from "../interactions/PhenotypeInteractionContext";

export const PhenotypeJourneyCards: React.FC = () => {
  const { setActiveMode } = usePhenotypeInteraction();

  const cards = [
    {
      id: 1,
      num: "01",
      title: "Genotype Input",
      desc: "Inspect the inherited genomic configuration.",
      isActive: false,
      mode: "genotype" as const,
      renderGraphic: () => (
        <svg viewBox="0 0 44 44" className="w-9 h-9">
          {/* DNA Helix / Chromosome icon */}
          <path d="M14 8 C18 16, 26 16, 30 8" stroke="#38bdf8" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M14 36 C18 28, 26 28, 30 36" stroke="#38bdf8" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M14 22 C18 22, 26 22, 30 22" stroke="#ec4899" strokeWidth="2" strokeLinecap="round" />
          <circle cx="14" cy="8" r="2.5" fill="#38bdf8" />
          <circle cx="30" cy="8" r="2.5" fill="#ec4899" />
          <circle cx="14" cy="36" r="2.5" fill="#38bdf8" />
          <circle cx="30" cy="36" r="2.5" fill="#ec4899" />
          <circle cx="22" cy="22" r="2" fill="#fbbf24" />
        </svg>
      ),
    },
    {
      id: 2,
      num: "02",
      title: "Interaction Modeling",
      desc: "Explore additive, dominance and non-linear epistatic effects.",
      isActive: true, // ACTIVE IN REFERENCE IMAGE
      mode: "interaction" as const,
      renderGraphic: () => (
        <svg viewBox="0 0 44 44" className="w-9 h-9">
          {/* Network triangle */}
          <polygon points="22,10 11,32 33,32" fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeOpacity="0.8" />
          <circle cx="22" cy="10" r="3.5" fill="#fbbf24" filter="drop-shadow(0 0 4px #fbbf24)" />
          <circle cx="11" cy="32" r="3.5" fill="#38bdf8" />
          <circle cx="33" cy="32" r="3.5" fill="#ec4899" />
          <circle cx="22" cy="24" r="2.5" fill="#ffffff" />
          <line x1="22" y1="10" x2="22" y2="24" stroke="#e0f2fe" strokeWidth="1" strokeDasharray="1 1" />
          <line x1="11" y1="32" x2="22" y2="24" stroke="#e0f2fe" strokeWidth="1" strokeDasharray="1 1" />
          <line x1="33" y1="32" x2="22" y2="24" stroke="#e0f2fe" strokeWidth="1" strokeDasharray="1 1" />
        </svg>
      ),
    },
    {
      id: 3,
      num: "03",
      title: "Phenotype Output",
      desc: "Observe the resulting model-relative phenotype.",
      isActive: false,
      mode: "phenotype" as const,
      renderGraphic: () => (
        <svg viewBox="0 0 44 44" className="w-9 h-9">
          {/* Glowing phenotype sphere */}
          <circle cx="22" cy="22" r="14" fill="#034570" fillOpacity="0.5" stroke="#38bdf8" strokeWidth="1.2" />
          <circle cx="22" cy="22" r="8" fill="#fbbf24" fillOpacity="0.6" filter="drop-shadow(0 0 6px #fbbf24)" />
          <circle cx="22" cy="22" r="3" fill="#ffffff" />
          <circle cx="22" cy="22" r="18" fill="none" stroke="#38bdf8" strokeWidth="0.8" strokeDasharray="2 2" opacity="0.6" />
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
              onClick={() => setActiveMode(card.mode)}
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
                <p className="text-[9.5px] text-slate-400 leading-snug line-clamp-1">
                  {card.desc}
                </p>
              </div>

              {/* Arrow Button */}
              <div className="flex-shrink-0">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all ${
                    card.isActive
                      ? "border-cyan-400/80 bg-cyan-950/60 text-cyan-300 shadow-[0_0_8px_rgba(56,189,248,0.4)]"
                      : "border-slate-700/80 bg-slate-900/60 text-slate-400 hover:text-white"
                  }`}
                >
                  <span className="text-xs">→</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sub-Footer Tracking Labels matching Page 1, 2 & 3 */}
      <div className="w-full flex items-center justify-between text-[8px] font-mono tracking-widest text-slate-500 uppercase px-2 pt-1">
        <div>SAME GENES. NEW WORLDS.</div>
        <div className="flex items-center gap-1 text-slate-400">
          <span>⌄</span>
          <span>SCROLL TO EXPLORE THE ENGINE</span>
        </div>
        <div>SCIENCE / VISUALIZATION / POSSIBILITIES</div>
      </div>
    </div>
  );
};
