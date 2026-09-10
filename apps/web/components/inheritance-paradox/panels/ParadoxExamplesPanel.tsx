"use client";

import React from "react";
import { useParadoxInteraction } from "../interactions/ParadoxInteractionContext";

export const ParadoxExamplesPanel: React.FC = () => {
  const { setTooltip } = useParadoxInteraction();

  const examples = [
    {
      id: "height",
      title: "Height Beyond Parental Range",
      subtitle: "Child taller than both parents due to novel variant combination and epistasis.",
      badge: "QUANTITATIVE TRAIT",
      badgeColor: "bg-sky-500/20 text-sky-300 border-sky-500/40",
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" strokeWidth="2">
          {/* Bone Icon */}
          <path d="M17 10c.7-.7 1.69-1 2.5-1a2.5 2.5 0 1 0-2.5-2.5c0 .81-.3 1.8-1 2.5l-7 7c-.7.7-1.69 1-2.5 1a2.5 2.5 0 1 0 2.5 2.5c0-.81.3-1.8 1-2.5l7-7z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      iconBg: "bg-slate-800/80 border-slate-700/80 text-slate-200 shadow-[0_0_12px_rgba(148,163,184,0.15)]",
      details: [
        { label: "Observed Phenotype", value: "+1.9 σ (Parents: +0.4 σ & +0.6 σ)", color: "#38bdf8" },
        { label: "Loci Interacting", value: "HMGA2 × GDF5 cis-linkage", color: "#fbbf24" },
        { label: "Mechanism", value: "Non-additive polygenic accumulation", color: "#94a3b8" },
      ],
    },
    {
      id: "resistance",
      title: "Disease Resistance",
      subtitle: "Offspring shows resistance not present in either parent (indirect epistatic effect).",
      badge: "IMMUNE RESISTANCE",
      badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5 text-cyan-300" fill="none" stroke="currentColor" strokeWidth="2">
          {/* Shield with check */}
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      iconBg: "bg-cyan-950/60 border-cyan-500/40 text-cyan-300 shadow-[0_0_12px_rgba(56,189,248,0.2)]",
      details: [
        { label: "Conferred Trait", value: "Novel receptor sterics block viral docking", color: "#38bdf8" },
        { label: "Parental Vulnerability", value: "Both parents susceptible (lacked cis allele)", color: "#ec4899" },
        { label: "Haplotype", value: "HLA class II recombinant heterodimer", color: "#fbbf24" },
      ],
    },
    {
      id: "emergent",
      title: "Emergent Traits",
      subtitle: "Complex traits (e.g., behavior, metabolism) can emerge from new genetic configurations.",
      badge: "COMPLEX EMERGENCE",
      badgeColor: "bg-pink-500/20 text-pink-300 border-pink-500/40",
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5 text-pink-300" fill="none" stroke="currentColor" strokeWidth="1.8">
          {/* Anatomical Brain Icon */}
          <path d="M9.5 4a3.5 3.5 0 0 0-3.5 3.5c0 .34.05.67.14.98A3.5 3.5 0 0 0 4 11.5c0 1.5 1 2.76 2.37 3.23A3.5 3.5 0 0 0 9.5 19h.5V4h-.5z" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M14.5 4a3.5 3.5 0 0 1 3.5 3.5c0 .34-.05.67-.14.98A3.5 3.5 0 0 1 20 11.5c0 1.5-1 2.76-2.37 3.23A3.5 3.5 0 0 1 14.5 19H14V4h.5z" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M10 9a2 2 0 0 0 2 2 2 2 0 0 0 2-2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M10 14a2 2 0 0 0 2 2 2 2 0 0 0 2-2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      iconBg: "bg-pink-950/60 border-pink-500/40 text-pink-300 shadow-[0_0_12px_rgba(236,72,153,0.2)]",
      details: [
        { label: "Pathway", value: "Novel metabolic enzyme isomer complex", color: "#ec4899" },
        { label: "Emergence Mode", value: "Multi-gene allosteric synergy", color: "#fbbf24" },
        { label: "Transgression Class", value: "Type III non-linear phenotypic leap", color: "#38bdf8" },
      ],
    },
  ];

  return (
    <div className="w-full bg-[#070d1d]/85 backdrop-blur-md border border-slate-800/80 rounded-xl p-3.5 shadow-[0_8px_32px_rgba(0,0,0,0.6)] relative group hover:border-slate-700/80 transition-all duration-300">
      {/* Panel Header */}
      <div className="flex items-center justify-between mb-1.5 border-b border-slate-800/50 pb-2">
        <h2 className="text-[12.5px] font-semibold text-slate-100 tracking-wide font-sans">
          Examples of the Inheritance Paradox
        </h2>
        <button
          aria-label="Panel details"
          className="w-5 h-5 rounded-full bg-slate-800/60 border border-slate-700/50 flex items-center justify-center text-slate-400 hover:text-cyan-300 hover:border-cyan-500/50 transition-colors"
        >
          <span className="text-xs leading-none">›</span>
        </button>
      </div>

      {/* 3 Interactive Rows */}
      <div className="flex flex-col gap-1.5 mt-1">
        {examples.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-2.5 p-2 rounded-lg bg-[#091124]/90 border border-slate-800/80 hover:border-slate-700/90 hover:bg-slate-900/60 cursor-pointer transition-all duration-200 group/row"
            onMouseEnter={(e) => {
              setTooltip({
                visible: true,
                x: e.clientX,
                y: e.clientY,
                title: item.title,
                subtitle: item.subtitle,
                badge: item.badge,
                badgeColor: item.badgeColor,
                details: item.details,
              });
            }}
            onMouseLeave={() => setTooltip(null)}
          >
            {/* Icon Container */}
            <div className={`w-8 h-8 rounded-lg border flex items-center justify-center flex-shrink-0 ${item.iconBg}`}>
              {item.icon}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className="text-xs font-semibold text-white tracking-tight group-hover/row:text-cyan-300 transition-colors">
                {item.title}
              </h3>
              <p className="text-[9.5px] text-slate-400 leading-tight truncate">
                {item.subtitle}
              </p>
            </div>

            {/* Right Chevron */}
            <div className="text-slate-500 group-hover/row:text-slate-300 group-hover/row:translate-x-0.5 transition-all text-xs">
              ›
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
