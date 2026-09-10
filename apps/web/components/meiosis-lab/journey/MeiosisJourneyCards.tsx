"use client";

import React from "react";
import Link from "next/link";
import { useMeiosisInteraction } from "../interactions/MeiosisInteractionContext";

export const MeiosisJourneyCards: React.FC = () => {
  const { activeStage, setActiveStage } = useMeiosisInteraction();

  const cards = [
    {
      id: 1,
      num: "01",
      title: "Pairing",
      desc: "Homologous chromosomes find each other and align, forming a synaptonemal complex.",
      isActive: false,
      renderGraphic: () => (
        <svg viewBox="0 0 64 64" className="w-12 h-12">
          {/* Blue Homolog */}
          <path d="M22 10 C26 22, 30 28, 26 32 C22 36, 18 42, 22 54" stroke="#38bdf8" strokeWidth="4" strokeLinecap="round" fill="none" />
          <path d="M30 10 C26 22, 22 28, 26 32 C30 36, 34 42, 30 54" stroke="#38bdf8" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.6" />
          {/* Pink Homolog aligned right next to it */}
          <path d="M36 10 C40 22, 44 28, 40 32 C36 36, 32 42, 36 54" stroke="#ec4899" strokeWidth="4" strokeLinecap="round" fill="none" />
          <path d="M44 10 C40 22, 36 28, 40 32 C44 36, 48 42, 44 54" stroke="#ec4899" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.6" />
          {/* Synaptonemal rungs */}
          <line x1="28" y1="20" x2="38" y2="20" stroke="#94a3b8" strokeWidth="1" strokeDasharray="1 1" />
          <line x1="26" y1="32" x2="40" y2="32" stroke="#94a3b8" strokeWidth="1" strokeDasharray="1 1" />
          <line x1="28" y1="44" x2="38" y2="44" stroke="#94a3b8" strokeWidth="1" strokeDasharray="1 1" />
        </svg>
      ),
    },
    {
      id: 2,
      num: "02",
      title: "Crossover",
      desc: "Exchange of genetic material creates recombinant chromatids with new allele combinations.",
      isActive: false,
      renderGraphic: () => (
        <svg viewBox="0 0 64 64" className="w-12 h-12">
          {/* Cyan arm crossing */}
          <path d="M12 12 Q32 32 52 52" stroke="#38bdf8" strokeWidth="4" strokeLinecap="round" />
          {/* Pink arm crossing */}
          <path d="M52 12 Q32 32 12 52" stroke="#ec4899" strokeWidth="4" strokeLinecap="round" />
          {/* Golden Spark Chiasma */}
          <circle cx="32" cy="32" r="6" fill="#fbbf24" filter="drop-shadow(0 0 8px rgba(251,191,36,0.9))" />
          <circle cx="32" cy="32" r="2.5" fill="#ffffff" />
          <path d="M32 20 L32 44 M20 32 L44 32" stroke="#fef08a" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      id: 3,
      num: "03",
      title: "Gamete Formation",
      desc: "Chromatids segregate through Meiosis I & II to produce four genetically unique gametes.",
      isActive: true, // ACTIVE IN REFERENCE IMAGE
      renderGraphic: () => (
        <svg viewBox="0 0 64 64" className="w-12 h-12">
          {/* 4 Gamete cluster */}
          <circle cx="22" cy="22" r="10" fill="#0284c7" fillOpacity="0.4" stroke="#38bdf8" strokeWidth="1.2" />
          <circle cx="42" cy="22" r="10" fill="#6366f1" fillOpacity="0.4" stroke="#818cf8" strokeWidth="1.2" />
          <circle cx="22" cy="42" r="10" fill="#a855f7" fillOpacity="0.4" stroke="#c084fc" strokeWidth="1.2" />
          <circle cx="42" cy="42" r="10" fill="#ec4899" fillOpacity="0.4" stroke="#f472b6" strokeWidth="1.2" />
          {/* Central glow */}
          <circle cx="32" cy="32" r="4" fill="#38bdf8" opacity="0.6" filter="drop-shadow(0 0 6px #38bdf8)" />
        </svg>
      ),
    },
  ];

  return (
    <div className="w-full flex items-center justify-between gap-4 mt-3">
      {/* 3 Cards */}
      <div className="flex-1 grid grid-cols-3 gap-3">
        {cards.map((card) => {
          return (
            <div
              key={card.id}
              onClick={() => setActiveStage(card.id)}
              className={`rounded-xl p-3.5 flex items-center justify-between gap-3 cursor-pointer transition-all duration-300 relative ${
                card.isActive
                  ? "bg-[#0a1329]/95 border-2 border-cyan-400 shadow-[0_0_24px_rgba(56,189,248,0.35)]"
                  : "bg-[#060b18]/80 border border-slate-800/80 hover:border-slate-700/80 hover:bg-[#080f20]/90"
              }`}
            >
              {/* Left text column */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-[12px] font-mono font-bold text-slate-400">
                    {card.num}
                  </span>
                  <h4 className="text-[13px] font-semibold text-white tracking-wide">
                    {card.title}
                  </h4>
                </div>
                <p className="text-[10px] text-slate-400 leading-snug line-clamp-2">
                  {card.desc}
                </p>
              </div>

              {/* Graphic thumbnail */}
              <div className="flex-shrink-0 flex items-center justify-center p-1">
                {card.renderGraphic()}
              </div>

              {/* Arrow Button */}
              <div className="flex-shrink-0">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center border transition-all ${
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

      {/* Far Right Tag */}
      <div className="flex-shrink-0 pl-2 hidden 2xl:block text-right">
        <div className="text-[9px] font-mono tracking-widest text-slate-500 uppercase leading-tight">
          Same<br />
          biological process.<br />
          <span className="text-slate-400">infinite futures.</span>
        </div>
      </div>
    </div>
  );
};
