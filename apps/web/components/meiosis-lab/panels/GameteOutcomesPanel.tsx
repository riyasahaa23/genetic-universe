"use client";

import React from "react";
import { useMeiosisInteraction } from "../interactions/MeiosisInteractionContext";

export const GameteOutcomesPanel: React.FC = () => {
  const {
    hoveredElement,
    setHoveredElement,
    selectedGamete,
    setSelectedGamete,
    selectedHomolog,
    setTooltip,
  } = useMeiosisInteraction();

  const gametes = [
    {
      id: "gamete_1" as const,
      num: "Gamete 1",
      desc: "Mostly maternal",
      badge: "NON-RECOMBINANT HAPLOID",
      badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
      details: [
        { label: "Maternal Genome", value: "98.4%", color: "#38bdf8" },
        { label: "Paternal Genome", value: "1.6%", color: "#ec4899" },
        { label: "Allele Assortment", value: "Conserved parental haplotype", color: "#94a3b8" },
      ],
      renderOrb: () => (
        <svg viewBox="0 0 54 54" className="w-12 h-12">
          <defs>
            <radialGradient id="gameteGlow1" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#0284c7" stopOpacity="0.4" />
              <stop offset="70%" stopColor="#08142c" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#020617" stopOpacity="0.9" />
            </radialGradient>
          </defs>
          <circle cx="27" cy="27" r="24" fill="url(#gameteGlow1)" stroke="#38bdf8" strokeWidth="1.2" strokeOpacity="0.7" />
          <circle cx="27" cy="27" r="21" fill="none" stroke="#38bdf8" strokeWidth="0.5" strokeDasharray="3 2" strokeOpacity="0.4" />
          {/* Vertical chromatid inside */}
          <path d="M27 12 C25 18, 29 24, 27 27 C25 30, 29 36, 27 42" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" fill="none" />
          <circle cx="27" cy="27" r="2" fill="#e0f2fe" />
        </svg>
      ),
    },
    {
      id: "gamete_2" as const,
      num: "Gamete 2",
      desc: "Recombinant",
      badge: "CROSSOVER GAMETE",
      badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/40",
      details: [
        { label: "Maternal Genome", value: "62.5%", color: "#38bdf8" },
        { label: "Paternal Genome", value: "37.5%", color: "#ec4899" },
        { label: "Novel Haplotype", value: "Unique trans-generational mosaic", color: "#fbbf24" },
      ],
      renderOrb: () => (
        <svg viewBox="0 0 54 54" className="w-12 h-12">
          <defs>
            <radialGradient id="gameteGlow2" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.35" />
              <stop offset="70%" stopColor="#08142c" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#020617" stopOpacity="0.9" />
            </radialGradient>
            <linearGradient id="recRod1" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ec4899" />
              <stop offset="45%" stopColor="#fbbf24" />
              <stop offset="55%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>
          </defs>
          <circle cx="27" cy="27" r="24" fill="url(#gameteGlow2)" stroke="#818cf8" strokeWidth="1.2" strokeOpacity="0.7" />
          <circle cx="27" cy="27" r="21" fill="none" stroke="#818cf8" strokeWidth="0.5" strokeDasharray="3 2" strokeOpacity="0.4" />
          {/* Recombinant chromatid */}
          <path d="M27 12 C25 18, 29 24, 27 27 C25 30, 29 36, 27 42" stroke="url(#recRod1)" strokeWidth="3" strokeLinecap="round" fill="none" />
          <circle cx="27" cy="27" r="2" fill="#fbbf24" />
        </svg>
      ),
    },
    {
      id: "gamete_3" as const,
      num: "Gamete 3",
      desc: "Recombinant",
      badge: "CROSSOVER GAMETE",
      badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/40",
      details: [
        { label: "Maternal Genome", value: "37.5%", color: "#38bdf8" },
        { label: "Paternal Genome", value: "62.5%", color: "#ec4899" },
        { label: "Novel Haplotype", value: "Unique reciprocal mosaic", color: "#fbbf24" },
      ],
      renderOrb: () => (
        <svg viewBox="0 0 54 54" className="w-12 h-12">
          <defs>
            <radialGradient id="gameteGlow3" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#a855f7" stopOpacity="0.35" />
              <stop offset="70%" stopColor="#08142c" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#020617" stopOpacity="0.9" />
            </radialGradient>
            <linearGradient id="recRod2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0284c7" />
              <stop offset="45%" stopColor="#38bdf8" />
              <stop offset="55%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
          </defs>
          <circle cx="27" cy="27" r="24" fill="url(#gameteGlow3)" stroke="#c084fc" strokeWidth="1.2" strokeOpacity="0.7" />
          <circle cx="27" cy="27" r="21" fill="none" stroke="#c084fc" strokeWidth="0.5" strokeDasharray="3 2" strokeOpacity="0.4" />
          {/* Recombinant chromatid */}
          <path d="M27 12 C25 18, 29 24, 27 27 C25 30, 29 36, 27 42" stroke="url(#recRod2)" strokeWidth="3" strokeLinecap="round" fill="none" />
          <circle cx="27" cy="27" r="2" fill="#fbbf24" />
        </svg>
      ),
    },
    {
      id: "gamete_4" as const,
      num: "Gamete 4",
      desc: "Mostly paternal",
      badge: "NON-RECOMBINANT HAPLOID",
      badgeColor: "bg-pink-500/20 text-pink-300 border-pink-500/40",
      details: [
        { label: "Maternal Genome", value: "1.2%", color: "#38bdf8" },
        { label: "Paternal Genome", value: "98.8%", color: "#ec4899" },
        { label: "Allele Assortment", value: "Conserved parental haplotype", color: "#94a3b8" },
      ],
      renderOrb: () => (
        <svg viewBox="0 0 54 54" className="w-12 h-12">
          <defs>
            <radialGradient id="gameteGlow4" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#be185d" stopOpacity="0.4" />
              <stop offset="70%" stopColor="#08142c" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#020617" stopOpacity="0.9" />
            </radialGradient>
          </defs>
          <circle cx="27" cy="27" r="24" fill="url(#gameteGlow4)" stroke="#f472b6" strokeWidth="1.2" strokeOpacity="0.7" />
          <circle cx="27" cy="27" r="21" fill="none" stroke="#f472b6" strokeWidth="0.5" strokeDasharray="3 2" strokeOpacity="0.4" />
          {/* Vertical chromatid inside */}
          <path d="M27 12 C25 18, 29 24, 27 27 C25 30, 29 36, 27 42" stroke="#f472b6" strokeWidth="3" strokeLinecap="round" fill="none" />
          <circle cx="27" cy="27" r="2" fill="#fce7f3" />
        </svg>
      ),
    },
  ];

  return (
    <div className="w-full h-full bg-[#070d1d]/85 backdrop-blur-md border border-slate-800/80 rounded-xl p-3 shadow-[0_8px_32px_rgba(0,0,0,0.6)] flex flex-col justify-between group hover:border-slate-700/80 transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/50 pb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-cyan-400 font-bold text-xs">|</span>
          <h2 className="text-xs font-semibold text-slate-100 tracking-wide font-sans">
            Gamete Outcomes
          </h2>
        </div>
        <button className="text-[10px] text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1 transition-colors">
          <span>View Details</span>
          <span className="text-xs">→</span>
        </button>
      </div>

      {/* 4 Gamete Bubbles */}
      <div className="grid grid-cols-4 gap-2 my-2">
        {gametes.map((g) => {
          const isDirectlySelected = selectedGamete === g.id || hoveredElement === g.id;
          const isHomologLinked =
            (selectedHomolog === "maternal" && (g.id === "gamete_1" || g.id === "gamete_2")) ||
            (selectedHomolog === "paternal" && (g.id === "gamete_3" || g.id === "gamete_4"));
          const isSelected = isDirectlySelected || isHomologLinked;

          return (
            <div
              key={g.id}
              onClick={() => {
                const next = selectedGamete === g.id ? null : g.id;
                setSelectedGamete(next);
                setHoveredElement(next);
              }}
              onMouseEnter={(e) => {
                setHoveredElement(g.id);
                setTooltip({
                  visible: true,
                  x: e.clientX,
                  y: e.clientY,
                  title: g.num,
                  subtitle: g.desc,
                  badge: g.badge,
                  badgeColor: g.badgeColor,
                  details: g.details,
                });
              }}
              onMouseLeave={() => {
                setHoveredElement(null);
                setTooltip(null);
              }}
              className={`flex flex-col items-center text-center p-1 rounded-lg cursor-pointer transition-all duration-200 border ${
                isSelected
                  ? "border-cyan-500/80 bg-cyan-950/40 shadow-[0_0_14px_rgba(56,189,248,0.35)] scale-105"
                  : "border-transparent hover:border-slate-800 hover:bg-slate-900/40"
              }`}
            >
              <div className="transition-transform group-hover:scale-105 mb-1">
                {g.renderOrb()}
              </div>
              <span className="text-[10px] font-semibold text-slate-100 leading-tight">
                {g.num}
              </span>
              <span className="text-[8.5px] text-slate-400 leading-tight mt-0.5">
                {g.desc}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
