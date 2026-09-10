"use client";

import React from "react";
import { useParadoxInteraction } from "../interactions/ParadoxInteractionContext";

export const VariationPathwayPanel: React.FC = () => {
  const {
    hoveredStep,
    setHoveredStep,
    setTooltip,
    isRecombinationActive,
    isParentAActive,
    isParentBActive,
    isOffspringActive,
    selectOrToggleElement,
  } = useParadoxInteraction();

  const steps = [
    {
      id: 1,
      title: "Parental Genomes",
      badge: "STEP 01: ANCESTRAL BASELINE",
      subtitle: "Independent parental chromosomes carrying separate allele variants",
      details: [
        { label: "Parent A", value: "Variant locus L10 present on maternal homolog", color: "#38bdf8" },
        { label: "Parent B", value: "Variant locus L31 present on paternal homolog", color: "#ec4899" },
        { label: "Configuration", value: "Trans arrangement (separate parental lineages)", color: "#94a3b8" },
      ],
      renderGraphic: () => (
        <svg viewBox="0 0 70 75" className="w-14 h-18">
          {/* Parent A Chromosome (Cyan) */}
          <g transform="translate(18, 8)">
            <rect x="0" y="4" width="7" height="48" rx="3.5" fill="#0284c7" stroke="#38bdf8" strokeWidth="1.2" />
            <rect x="0" y="15" width="7" height="3" fill="#38bdf8" opacity="0.9" />
            <rect x="0" y="26" width="7" height="4" fill="#0f172a" />
            <rect x="0" y="38" width="7" height="3" fill="#38bdf8" opacity="0.9" />
          </g>
          {/* Parent B Chromosome (Pink) */}
          <g transform="translate(42, 8)">
            <rect x="0" y="4" width="7" height="48" rx="3.5" fill="#be185d" stroke="#f472b6" strokeWidth="1.2" />
            <rect x="0" y="13" width="7" height="3" fill="#f472b6" opacity="0.9" />
            <rect x="0" y="26" width="7" height="4" fill="#0f172a" />
            <rect x="0" y="40" width="7" height="3" fill="#f472b6" opacity="0.9" />
          </g>
        </svg>
      ),
    },
    {
      id: 2,
      title: "Recombination",
      badge: "STEP 02: CROSSOVER CHIASMA",
      subtitle: "Physical exchange of chromatid segments during meiosis prophase I",
      details: [
        { label: "Event Type", value: "Homologous recombination at hotspot", color: "#fbbf24" },
        { label: "Chiasma Point", value: "Inter-locus region between L10 and L31", color: "#38bdf8" },
        { label: "Recombination Rate", value: "r = 0.08 (8 cM genetic distance)", color: "#94a3b8" },
      ],
      renderGraphic: () => (
        <div className="relative flex flex-col items-center justify-center">
          <svg viewBox="0 0 70 75" className="w-14 h-18">
            {/* Chromosome A (angled) */}
            <g transform="translate(35, 33) rotate(-24) translate(-3.5, -24)">
              <rect x="0" y="0" width="7" height="48" rx="3.5" fill="#0284c7" stroke="#38bdf8" strokeWidth="1.2" />
            </g>
            {/* Chromosome B (angled) */}
            <g transform="translate(35, 33) rotate(24) translate(-3.5, -24)">
              <rect x="0" y="0" width="7" height="48" rx="3.5" fill="#be185d" stroke="#f472b6" strokeWidth="1.2" />
            </g>
            {/* Crossover spark at intersection */}
            <circle cx="35" cy="33" r="5" fill="#fbbf24" opacity="0.4" className="animate-ping" />
            <circle cx="35" cy="33" r="3.2" fill="#fef08a" stroke="#fbbf24" strokeWidth="1.5" />
          </svg>
          {/* Tag "Crossover event" */}
          <div className="absolute top-[44px] bg-slate-900/90 border border-slate-700/80 rounded px-1.5 py-0.5 text-[8px] text-slate-300 whitespace-nowrap shadow-sm">
            Crossover event
          </div>
        </div>
      ),
    },
    {
      id: 3,
      title: "Novel Configuration",
      badge: "STEP 03: CIS RECOMBINANT HAPLOTYPE",
      subtitle: "Both parental loci unified onto a single contiguous chromatid",
      details: [
        { label: "New State", value: "Cis coupling: [L10=1, L31=1] on same strand", color: "#fbbf24" },
        { label: "Ancestral Absence", value: "Neither parent possessed this linked pair", color: "#ec4899" },
        { label: "Structural Status", value: "Mosaic chromatid with dual provenance", color: "#38bdf8" },
      ],
      renderGraphic: () => (
        <svg viewBox="0 0 70 75" className="w-14 h-18">
          <defs>
            <linearGradient id="mosaicGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0284c7" />
              <stop offset="42%" stopColor="#38bdf8" />
              <stop offset="48%" stopColor="#fbbf24" />
              <stop offset="55%" stopColor="#fbbf24" />
              <stop offset="62%" stopColor="#ec4899" />
              <stop offset="100%" stopColor="#be185d" />
            </linearGradient>
          </defs>
          <g transform="translate(29, 8)">
            <rect x="0" y="4" width="9" height="50" rx="4.5" fill="url(#mosaicGrad2)" stroke="#fbbf24" strokeWidth="1.2" />
            {/* Locus bands */}
            <rect x="0" y="13" width="9" height="2" fill="#e0f2fe" />
            <rect x="0" y="25" width="9" height="3.5" fill="#fef08a" />
            <rect x="0" y="42" width="9" height="2" fill="#fdf2f8" />
          </g>
        </svg>
      ),
    },
    {
      id: 4,
      title: "Emergent Phenotype",
      badge: "STEP 04: TRANSGRESSIVE TRAIT",
      subtitle: "Synergistic epistatic interaction triggers phenotype beyond parental bounds",
      details: [
        { label: "Interaction Delta", value: "+31.0 epistatic surplus", color: "#fbbf24" },
        { label: "Phenotypic Expression", value: "Transgressive outlier beyond both parents", color: "#38bdf8" },
        { label: "Biological Role", value: "Quantum jump in functional capacity", color: "#ec4899" },
      ],
      renderGraphic: () => (
        <div className="relative w-14 h-18 flex items-center justify-center">
          <svg viewBox="0 0 70 70" className="w-14 h-14">
            <defs>
              <radialGradient id="burstGrad2" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#fde047" stopOpacity="0.9" />
                <stop offset="40%" stopColor="#ec4899" stopOpacity="0.5" />
                <stop offset="80%" stopColor="#38bdf8" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
              </radialGradient>
            </defs>
            <circle cx="35" cy="35" r="26" fill="url(#burstGrad2)" />
            {/* Particle stars */}
            <circle cx="35" cy="35" r="2.8" fill="#ffffff" />
            <circle cx="27" cy="28" r="1.4" fill="#38bdf8" />
            <circle cx="43" cy="26" r="1.4" fill="#f472b6" />
            <circle cx="25" cy="42" r="1.6" fill="#fbbf24" />
            <circle cx="45" cy="41" r="1.3" fill="#e0f2fe" />
            <circle cx="35" cy="21" r="1.2" fill="#fbbf24" />
            <circle cx="35" cy="49" r="1.2" fill="#38bdf8" />
            <circle cx="20" cy="34" r="1.2" fill="#f472b6" />
            <circle cx="50" cy="36" r="1.2" fill="#fde047" />
          </svg>
        </div>
      ),
    },
  ];

  return (
    <div className="w-full bg-[#070d1d]/85 backdrop-blur-md border border-slate-800/80 rounded-xl p-3.5 shadow-[0_8px_32px_rgba(0,0,0,0.6)] relative group hover:border-slate-700/80 transition-all duration-300">
      {/* Panel Header */}
      <div className="flex items-center justify-between mb-1.5 border-b border-slate-800/50 pb-2">
        <h2 className="text-[12.5px] font-semibold text-slate-100 tracking-wide font-sans">
          From Parental Variation to New Possibilities
        </h2>
        <button
          aria-label="Panel details"
          className="w-5 h-5 rounded-full bg-slate-800/60 border border-slate-700/50 flex items-center justify-center text-slate-400 hover:text-cyan-300 hover:border-cyan-500/50 transition-colors"
        >
          <span className="text-xs leading-none">›</span>
        </button>
      </div>

      {/* 4-Step Pipeline Flow */}
      <div className="flex items-center justify-between gap-1 mt-1">
        {steps.map((step, idx) => {
          const isSelected =
            step.id === 1
              ? hoveredStep === 1 || isParentAActive || isParentBActive
              : step.id === 2
              ? hoveredStep === 2 || isRecombinationActive
              : step.id === 3
              ? hoveredStep === 3
              : hoveredStep === 4 || isOffspringActive;

          return (
            <React.Fragment key={step.id}>
              {/* Step Card */}
              <div
                className={`flex-1 flex flex-col items-center text-center p-1 rounded-lg cursor-pointer transition-all duration-200 border ${
                  isSelected
                    ? "border-cyan-500/80 bg-cyan-950/30 shadow-[0_0_16px_rgba(56,189,248,0.25)] ring-1 ring-cyan-500/40"
                    : "border-transparent hover:border-slate-800 hover:bg-slate-900/40"
                }`}
                onClick={() => {
                  if (step.id === 1) selectOrToggleElement("parent_a");
                  else if (step.id === 2) selectOrToggleElement("recombination");
                  else if (step.id === 3) setHoveredStep(hoveredStep === 3 ? null : 3);
                  else if (step.id === 4) selectOrToggleElement("offspring");
                }}
                onMouseEnter={(e) => {
                  setHoveredStep(step.id);
                  setTooltip({
                    visible: true,
                    x: e.clientX,
                    y: e.clientY,
                    title: step.title,
                    subtitle: step.subtitle,
                    badge: step.badge,
                    badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
                    details: step.details,
                  });
                }}
                onMouseLeave={() => {
                  setHoveredStep(null);
                  setTooltip(null);
                }}
              >
                {/* Visual */}
                <div className="h-18 flex items-center justify-center">
                  {step.renderGraphic()}
                </div>

                {/* Subtitle / Step label */}
                <div className="text-[10px] font-medium text-slate-300 tracking-tight mt-1 whitespace-nowrap">
                  {step.title}
                </div>
              </div>

              {/* Connecting Arrow between steps */}
              {idx < steps.length - 1 && (
                <div className="text-slate-600 px-0.5 select-none text-base">
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
