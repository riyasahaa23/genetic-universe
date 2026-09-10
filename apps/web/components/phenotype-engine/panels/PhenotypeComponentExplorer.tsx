"use client";

import React from "react";
import { usePhenotypeInteraction, ComponentType } from "../interactions/PhenotypeInteractionContext";

export const PhenotypeComponentExplorer: React.FC = () => {
  const {
    activeMode,
    activeComponent,
    setActiveComponent,
    setTooltip,
  } = usePhenotypeInteraction();

  const isGenotypeStage = activeMode === "genotype";

  const cards: {
    id: ComponentType;
    title: string;
    subtitle: string;
    icon: () => JSX.Element;
    color: string;
    border: string;
    glow: string;
  }[] = [
    {
      id: "additive",
      title: "Additive",
      subtitle: "Main allele effects",
      color: "text-cyan-400",
      border: "border-cyan-500/60",
      glow: "shadow-[0_0_16px_rgba(56,189,248,0.3)]",
      icon: () => (
        <svg viewBox="0 0 24 24" className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
          <circle cx="9" cy="6" r="2" fill="#38bdf8" />
          <circle cx="15" cy="12" r="2" fill="#38bdf8" />
          <circle cx="8" cy="18" r="2" fill="#38bdf8" />
        </svg>
      ),
    },
    {
      id: "dominance",
      title: "Dominance",
      subtitle: "Allelic state effects",
      color: "text-purple-400",
      border: "border-purple-500/60",
      glow: "shadow-[0_0_16px_rgba(168,85,247,0.3)]",
      icon: () => (
        <svg viewBox="0 0 24 24" className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="8" cy="12" r="5" strokeLinecap="round" />
          <circle cx="16" cy="12" r="5" strokeLinecap="round" />
          <path d="M12 7v10" stroke="#c084fc" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      id: "epistasis",
      title: "Epistasis",
      subtitle: "Non-linear pairs",
      color: "text-pink-400",
      border: "border-pink-500/60",
      glow: "shadow-[0_0_16px_rgba(244,114,182,0.3)]",
      icon: () => (
        <svg viewBox="0 0 24 24" className="w-5 h-5 text-pink-400" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="6" cy="6" r="3" fill="#ec4899" />
          <circle cx="18" cy="6" r="3" fill="#ec4899" />
          <circle cx="12" cy="18" r="3" fill="#ec4899" />
          <line x1="8" y1="8" x2="16" y2="8" stroke="#f472b6" />
          <line x1="7" y1="9" x2="11" y2="16" stroke="#f472b6" />
          <line x1="17" y1="9" x2="13" y2="16" stroke="#f472b6" />
        </svg>
      ),
    },
    {
      id: "combined",
      title: "Combined",
      subtitle: "Full phenotype model",
      color: "text-amber-400",
      border: "border-amber-500/60",
      glow: "shadow-[0_0_16px_rgba(251,191,36,0.3)]",
      icon: () => (
        <svg viewBox="0 0 24 24" className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="12" r="8" strokeLinecap="round" />
          <circle cx="12" cy="12" r="4" fill="#fbbf24" fillOpacity="0.4" />
          <line x1="12" y1="2" x2="12" y2="6" stroke="#fbbf24" strokeLinecap="round" />
          <line x1="12" y1="18" x2="12" y2="22" stroke="#fbbf24" strokeLinecap="round" />
          <line x1="2" y1="12" x2="6" y2="12" stroke="#fbbf24" strokeLinecap="round" />
          <line x1="18" y1="12" x2="22" y2="12" stroke="#fbbf24" strokeLinecap="round" />
        </svg>
      ),
    },
  ];

  return (
    <div className="w-full h-full bg-[#070d1d]/85 backdrop-blur-md border border-slate-800/80 rounded-xl p-3 shadow-[0_8px_32px_rgba(0,0,0,0.6)] flex flex-col justify-between group hover:border-slate-700/80 transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/50 pb-1.5 mb-1.5">
        <div className="flex items-center gap-1.5">
          <span className="text-cyan-400 font-bold text-xs">|</span>
          <h2 className="text-xs font-semibold text-slate-100 tracking-wide font-sans">
            Phenotype Component Explorer
          </h2>
        </div>
        <div className="flex items-center gap-1">
          {(["Standard", "Full Model"] as const).map((tab, idx) => (
            <button
              key={tab}
              className={`px-2 py-0.5 rounded text-[8.5px] font-medium transition-all ${
                idx === 0
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/50"
                  : "bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-slate-200"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Subtitle */}
      <p className="text-[9px] text-slate-400 leading-snug mb-1.5">
        {isGenotypeStage
          ? "Configured genetic model layers. Isolate components once model analysis begins in Stage 2."
          : "Isolate genetic model components to evaluate how each term drives the emergent phenotype."}
      </p>

      {/* 4 Cards */}
      <div className="grid grid-cols-4 gap-2 flex-1 min-h-0">
        {cards.map((card) => {
          const isSelected = activeComponent === card.id;
          return (
            <div
              key={card.id}
              onClick={() => setActiveComponent(card.id)}
              onMouseEnter={(e) => {
                setTooltip({
                  visible: true,
                  x: e.clientX,
                  y: e.clientY,
                  title: `${card.title} View Isolation`,
                  subtitle: card.subtitle,
                  badge: "COMPONENT FOCUS",
                  badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
                  details: [
                    { label: "3D Effect", value: `Isolates ${card.title} in funnel`, color: "#38bdf8" },
                    { label: "Status", value: isSelected ? "Active" : "Click to select", color: "#fbbf24" },
                  ],
                });
              }}
              onMouseLeave={() => setTooltip(null)}
              className={`rounded-lg p-2 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 border ${
                isSelected
                  ? `bg-[#0c1630] ${card.border} ${card.glow}`
                  : isGenotypeStage
                  ? "bg-[#050c1e]/40 border-slate-800/60 opacity-70 hover:opacity-100"
                  : "bg-[#050c1e]/60 border-slate-800/80 hover:border-slate-700/80 hover:bg-[#071126]"
              }`}
            >
              <div className="mb-1 transition-transform group-hover:scale-105">
                {card.icon()}
              </div>
              <span className={`text-[10px] font-semibold leading-tight ${isSelected ? card.color : "text-slate-200"}`}>
                {card.title}
              </span>
              <span className="text-[8px] text-slate-500 mt-0.5">
                {card.subtitle}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
