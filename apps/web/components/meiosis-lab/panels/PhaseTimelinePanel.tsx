"use client";

import React from "react";
import { useMeiosisInteraction } from "../interactions/MeiosisInteractionContext";

export const PhaseTimelinePanel: React.FC = () => {
  const { activePhase, setActivePhase, setTooltip } = useMeiosisInteraction();

  const phases = [
    {
      id: 0,
      title: "Prophase I",
      subtitle: "Pairing & Crossover",
      badge: "SYNAPSIS & RECOMBINATION",
      badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
      details: [
        { label: "Synaptonemal Complex", value: "Fully assembled", color: "#38bdf8" },
        { label: "Chiasma Formation", value: "Recombination hotspots active", color: "#fbbf24" },
        { label: "Exchanged Provenance", value: "Maternal/Paternal swap", color: "#ec4899" },
      ],
      renderIcon: () => (
        <svg viewBox="0 0 44 44" className="w-10 h-10">
          <circle cx="22" cy="22" r="19" fill="#081026" stroke="#38bdf8" strokeWidth="1.2" strokeDasharray="3 2" />
          {/* Chromosome pair touching */}
          <path d="M17 12 C17 18, 22 22, 22 22 C22 22, 17 26, 17 32" stroke="#38bdf8" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M27 12 C27 18, 22 22, 22 22 C22 22, 27 26, 27 32" stroke="#ec4899" strokeWidth="2" fill="none" strokeLinecap="round" />
          <circle cx="22" cy="22" r="2.5" fill="#fbbf24" />
        </svg>
      ),
    },
    {
      id: 1,
      title: "Metaphase I",
      subtitle: "Aligned Homologs",
      badge: "EQUATORIAL ORIENTATION",
      badgeColor: "bg-blue-500/20 text-blue-300 border-blue-500/40",
      details: [
        { label: "Alignment", value: "Bivalents at metaphase plate", color: "#38bdf8" },
        { label: "Spindle Attachment", value: "Bipolar kinetochores engaged", color: "#94a3b8" },
        { label: "Independent Assortment", value: "Random maternal/paternal tilt", color: "#fbbf24" },
      ],
      renderIcon: () => (
        <svg viewBox="0 0 44 44" className="w-10 h-10">
          <circle cx="22" cy="22" r="19" fill="#081026" stroke="#6366f1" strokeWidth="1.2" strokeDasharray="3 2" />
          {/* Equatorial line */}
          <line x1="8" y1="22" x2="36" y2="22" stroke="#1e293b" strokeWidth="1" strokeDasharray="2 2" />
          <rect x="15" y="11" width="4" height="22" rx="2" fill="#38bdf8" />
          <rect x="25" y="11" width="4" height="22" rx="2" fill="#ec4899" />
        </svg>
      ),
    },
    {
      id: 2,
      title: "Anaphase I",
      subtitle: "Homolog Separation",
      badge: "REDUCTIONAL SEGREGATION",
      badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/40",
      details: [
        { label: "Homolog Dissociation", value: "Chiasmata resolve", color: "#a855f7" },
        { label: "Sister Chromatids", value: "Remain conjoined at centromere", color: "#38bdf8" },
        { label: "Ploidy Shift", value: "2n → n reduction initiated", color: "#ec4899" },
      ],
      renderIcon: () => (
        <svg viewBox="0 0 44 44" className="w-10 h-10">
          <circle cx="22" cy="22" r="19" fill="#081026" stroke="#a855f7" strokeWidth="1.2" strokeDasharray="3 2" />
          {/* Moving to opposite poles */}
          <path d="M14 14 C18 18, 18 26, 14 30" stroke="#38bdf8" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M30 14 C26 18, 26 26, 30 30" stroke="#ec4899" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      id: 3,
      title: "Telophase I & Meiosis II",
      subtitle: "Gamete Formation",
      badge: "4 HAPLOID CELLS",
      badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
      details: [
        { label: "Equational Division", value: "Sister chromatids segregate", color: "#10b981" },
        { label: "End Result", value: "4 non-identical haploid gametes", color: "#fbbf24" },
        { label: "Diversity Index", value: "Maximum recombinant novelty", color: "#38bdf8" },
      ],
      renderIcon: () => (
        <svg viewBox="0 0 44 44" className="w-10 h-10">
          <circle cx="22" cy="22" r="19" fill="#081026" stroke="#10b981" strokeWidth="1.2" strokeDasharray="3 2" />
          {/* 4 miniature circles */}
          <circle cx="16" cy="16" r="4.5" fill="#0284c7" opacity="0.8" />
          <circle cx="28" cy="16" r="4.5" fill="#38bdf8" opacity="0.8" />
          <circle cx="16" cy="28" r="4.5" fill="#ec4899" opacity="0.8" />
          <circle cx="28" cy="28" r="4.5" fill="#be185d" opacity="0.8" />
        </svg>
      ),
    },
  ];

  return (
    <div className="w-full bg-[#070d1d]/85 backdrop-blur-md border border-slate-800/80 rounded-xl p-3.5 shadow-[0_8px_32px_rgba(0,0,0,0.6)] relative group hover:border-slate-700/80 transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-2.5 border-b border-slate-800/50 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-cyan-400 font-bold text-sm">|</span>
          <h2 className="text-[13px] font-semibold text-slate-100 tracking-wide font-sans">
            Phase Timeline
          </h2>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-[9.5px] text-emerald-300 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Live</span>
          <span className="text-[8px] text-emerald-500">⌄</span>
        </div>
      </div>

      {/* 4 Stages Progression */}
      <div className="flex items-center justify-between gap-1" role="tablist" aria-label="Meiosis Phases">
        {phases.map((p, idx) => {
          const isActive = activePhase === p.id;
          return (
            <React.Fragment key={p.id}>
              <div
                role="tab"
                tabIndex={0}
                aria-selected={isActive}
                onClick={() => setActivePhase(p.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setActivePhase(p.id);
                  }
                }}
                onMouseEnter={(e) => {
                  setTooltip({
                    visible: true,
                    x: e.clientX,
                    y: e.clientY,
                    title: p.title,
                    subtitle: p.subtitle,
                    badge: p.badge,
                    badgeColor: p.badgeColor,
                    details: p.details,
                  });
                }}
                onMouseLeave={() => setTooltip(null)}
                className={`flex-1 flex flex-col items-center text-center p-2 rounded-lg cursor-pointer transition-all duration-200 border outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                  isActive
                    ? "border-cyan-500/80 bg-cyan-950/30 shadow-[0_0_16px_rgba(56,189,248,0.25)]"
                    : "border-transparent hover:border-slate-800 hover:bg-slate-900/40"
                }`}
              >
                {/* Thumbnail */}
                <div className="mb-1.5 transition-transform group-hover:scale-105">
                  {p.renderIcon()}
                </div>

                {/* Title */}
                <h3 className={`text-[11px] font-semibold tracking-tight ${isActive ? "text-cyan-300" : "text-white"}`}>
                  {p.title}
                </h3>

                {/* Subtitle */}
                <p className="text-[9px] text-slate-400 leading-tight mt-0.5">
                  {p.subtitle}
                </p>
              </div>

              {idx < phases.length - 1 && (
                <div className="text-slate-600 px-0.5 select-none text-xs">
                  →
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
