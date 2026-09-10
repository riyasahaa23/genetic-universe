"use client";

import React from "react";
import { useParadoxInteraction } from "../interactions/ParadoxInteractionContext";

export const KeyFactorsPanel: React.FC = () => {
  const {
    isRecombinationActive,
    isEpistasisActive,
    isHiddenVariationActive,
    selectOrToggleFactor,
    setHoveredFactor,
    setTooltip,
  } = useParadoxInteraction();

  const factors = [
    {
      id: "recombination" as const,
      title: "Recombination",
      subtitle: "Creates novel variant combinations",
      icon: (
        <svg viewBox="0 0 40 40" className="w-8 h-8">
          {/* Crossing curved arrows */}
          <path
            d="M 8 12 C 16 12, 24 28, 32 28"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M 28 24 L 32 28 L 28 32"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M 8 28 C 16 28, 24 12, 32 12"
            fill="none"
            stroke="#ec4899"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M 28 8 L 32 12 L 28 16"
            fill="none"
            stroke="#ec4899"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
      glow: "hover:border-cyan-500/50 hover:shadow-[0_0_20px_rgba(56,189,248,0.2)]",
      activeGlow: "border-cyan-500/80 shadow-[0_0_24px_rgba(56,189,248,0.3)] bg-cyan-950/30",
      tooltipTitle: "Meiotic Recombination & Cross-Overs",
      tooltipSubtitle: "Novel linkage breakdown and cis-haplotype formation",
      badge: "GENETIC RESHUFFLING",
      badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
      details: [
        { label: "Mechanism", value: "Homologous crossover at meiotic hotspots", color: "#38bdf8" },
        { label: "Linkage", value: "Decouples ancestral haplotypes into novel cis sets", color: "#94a3b8" },
        { label: "Phenotypic Impact", value: "Generates unprecedented allele combinations", color: "#fbbf24" },
      ],
    },
    {
      id: "epistasis" as const,
      title: "Epistatic Interactions",
      subtitle: "Genes interact in non-linear ways",
      icon: (
        <svg viewBox="0 0 40 40" className="w-8 h-8">
          {/* Triangular network nodes */}
          <line x1="20" y1="8" x2="10" y2="28" stroke="#38bdf8" strokeWidth="1.8" strokeDasharray="2 2" />
          <line x1="20" y1="8" x2="30" y2="28" stroke="#38bdf8" strokeWidth="1.8" strokeDasharray="2 2" />
          <line x1="10" y1="28" x2="30" y2="28" stroke="#38bdf8" strokeWidth="1.8" />
          <circle cx="20" cy="8" r="4" fill="#0284c7" stroke="#38bdf8" strokeWidth="2" />
          <circle cx="10" cy="28" r="4" fill="#0284c7" stroke="#38bdf8" strokeWidth="2" />
          <circle cx="30" cy="28" r="4" fill="#0284c7" stroke="#38bdf8" strokeWidth="2" />
        </svg>
      ),
      glow: "hover:border-purple-500/50 hover:shadow-[0_0_20px_rgba(168,85,247,0.2)]",
      activeGlow: "border-purple-500/80 shadow-[0_0_24px_rgba(168,85,247,0.3)] bg-purple-950/30",
      tooltipTitle: "Epistatic (Non-Linear) Gene Networks",
      tooltipSubtitle: "Synergistic effects not predictable from additive sum",
      badge: "NON-ADDITIVE EMERGENCE",
      badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/40",
      details: [
        { label: "Model Architecture", value: "Multi-locus interaction tensor", color: "#a855f7" },
        { label: "Interaction Delta", value: "+31.0 arbitrary units (L10 × L31)", color: "#fbbf24" },
        { label: "Transgression Cause", value: "Coupling triggers epistatic enhancement", color: "#ec4899" },
      ],
    },
    {
      id: "hidden_variation" as const,
      title: "Hidden Variation",
      subtitle: "Rare or recessive variants can become expressive",
      icon: (
        <svg viewBox="0 0 40 40" className="w-8 h-8">
          {/* Three overlapping rings */}
          <circle cx="20" cy="14" r="9" fill="none" stroke="#fbbf24" strokeWidth="1.8" opacity="0.85" />
          <circle cx="14" cy="24" r="9" fill="none" stroke="#f59e0b" strokeWidth="1.8" opacity="0.85" />
          <circle cx="26" cy="24" r="9" fill="none" stroke="#d97706" strokeWidth="1.8" opacity="0.85" />
        </svg>
      ),
      glow: "hover:border-amber-500/50 hover:shadow-[0_0_20px_rgba(245,158,11,0.2)]",
      activeGlow: "border-amber-500/80 shadow-[0_0_24px_rgba(245,158,11,0.3)] bg-amber-950/30",
      tooltipTitle: "Cryptic & Recessive Genetic Variation",
      tooltipSubtitle: "Unexpressed parental variants exposed in offspring",
      badge: "CRYPTIC UNMASKING",
      badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/40",
      details: [
        { label: "Mechanism", value: "Homozygosity unmasking & regulatory release", color: "#fbbf24" },
        { label: "Phenotypic Buffer", value: "Breakdown of parental canalization", color: "#94a3b8" },
        { label: "Evolutionary Scope", value: "Fuel for adaptive leaps", color: "#38bdf8" },
      ],
    },
  ];

  return (
    <div className="w-full bg-[#070d1d]/85 backdrop-blur-md border border-slate-800/80 rounded-xl p-3.5 shadow-[0_8px_32px_rgba(0,0,0,0.6)] relative group hover:border-slate-700/80 transition-all duration-300">
      {/* Panel Header */}
      <div className="flex items-center justify-between mb-2.5 border-b border-slate-800/50 pb-2">
        <h2 className="text-[13px] font-semibold text-slate-100 tracking-wide font-sans">
          Key Factors Behind the Paradox
        </h2>
        <button
          aria-label="Panel details"
          className="w-5 h-5 rounded-full bg-slate-800/60 border border-slate-700/50 flex items-center justify-center text-slate-400 hover:text-cyan-300 hover:border-cyan-500/50 transition-colors"
        >
          <span className="text-xs leading-none">›</span>
        </button>
      </div>

      {/* 3 Horizontal Factor Cards */}
      <div className="grid grid-cols-3 gap-2.5">
        {factors.map((factor) => {
          const isActive =
            factor.id === "recombination"
              ? isRecombinationActive
              : factor.id === "epistasis"
              ? isEpistasisActive
              : isHiddenVariationActive;

          return (
            <div
              key={factor.id}
              onClick={() => selectOrToggleFactor(factor.id)}
              className={`rounded-lg p-2.5 flex flex-col items-center text-center cursor-pointer transition-all duration-200 border bg-[#091124]/90 ${
                isActive ? factor.activeGlow : `border-slate-800/80 ${factor.glow}`
              }`}
              onMouseEnter={(e) => {
                setHoveredFactor(factor.id);
                setTooltip({
                  visible: true,
                  x: e.clientX,
                  y: e.clientY,
                  title: factor.tooltipTitle,
                  subtitle: factor.tooltipSubtitle,
                  badge: factor.badge,
                  badgeColor: factor.badgeColor,
                  details: factor.details,
                });
              }}
              onMouseLeave={() => {
                setHoveredFactor(null);
                setTooltip(null);
              }}
            >
              {/* Icon */}
              <div className="mb-1.5 flex items-center justify-center h-8">
                {factor.icon}
              </div>

              {/* Title */}
              <h3 className="text-xs font-semibold text-white tracking-tight mb-0.5">
                {factor.title}
              </h3>

              {/* Subtext */}
              <p className="text-[10px] text-slate-400 leading-tight">
                {factor.subtitle}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
