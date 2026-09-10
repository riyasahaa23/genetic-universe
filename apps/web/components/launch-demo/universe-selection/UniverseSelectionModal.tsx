"use client";

import React, { useState } from "react";
import { useLaunchDemo, UniverseMode } from "../LaunchDemoContext";

export const UniverseSelectionModal: React.FC = () => {
  const { selectUniverse } = useLaunchDemo();
  const [hoveredMode, setHoveredMode] = useState<UniverseMode | null>(null);

  const universes: {
    mode: UniverseMode;
    title: string;
    tag: string;
    badgeColor: string;
    accentColor: string;
    borderGlow: string;
    cardBg: string;
    speciesExamples: string[];
    description: string;
    highlight: string;
    disclaimer: string;
    svgGraphic: React.ReactNode;
  }[] = [
    {
      mode: "plant",
      title: "Plant Universe",
      tag: "AGRONOMIC MODEL",
      badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
      accentColor: "#10b981",
      borderGlow: "hover:border-emerald-400 hover:shadow-[0_0_35px_rgba(16,185,129,0.35)]",
      cardBg: "from-[#021f14]/80 via-[#031510]/90 to-[#030a12]/95",
      speciesExamples: [
        "Arabidopsis thaliana (Thale cress)",
        "Oryza sativa (Rice)",
        "Zea mays (Maize)",
        "Solanum lycopersicum (Tomato)",
      ],
      description:
        "Explore high-recombination polygenic architecture in crop cultivars and botanical models. Investigate hybrid vigor (heterosis) and transgressive yield phenotypes.",
      highlight: "Plant Breeding & Polygenic Architecture",
      disclaimer: "Generic computational meiosis model with plant context metadata",
      svgGraphic: (
        <svg viewBox="0 0 120 120" className="w-24 h-24 mx-auto mb-2 drop-shadow-[0_0_16px_#10b981]">
          {/* Translucent botanical seed / leaf structure with internal glowing chromosomes */}
          <path
            d="M60 15 C85 35, 95 70, 60 105 C25 70, 35 35, 60 15 Z"
            fill="url(#plantGrad)"
            stroke="#10b981"
            strokeWidth="1.8"
            opacity="0.85"
          />
          {/* Central stem / vein */}
          <line x1="60" y1="20" x2="60" y2="100" stroke="#34d399" strokeWidth="1.5" strokeDasharray="3,2" />
          {/* Internal Chromosome Filaments */}
          <path
            d="M50 45 Q60 55 70 45 Q80 35 70 65 Q60 55 50 65"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <path
            d="M48 70 Q60 80 72 70"
            fill="none"
            stroke="#10b981"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* Glowing Loci Nodes */}
          <circle cx="50" cy="45" r="3" fill="#34d399" filter="drop-shadow(0 0 4px #34d399)" />
          <circle cx="70" cy="45" r="3" fill="#38bdf8" filter="drop-shadow(0 0 4px #38bdf8)" />
          <circle cx="60" cy="75" r="3.5" fill="#f6c85f" filter="drop-shadow(0 0 6px #f6c85f)" />
          <defs>
            <linearGradient id="plantGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#065f46" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#022c22" stopOpacity="0.4" />
            </linearGradient>
          </defs>
        </svg>
      ),
    },
    {
      mode: "animal",
      title: "Animal Universe",
      tag: "ZOOLOGICAL MODEL",
      badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
      accentColor: "#06b6d4",
      borderGlow: "hover:border-cyan-400 hover:shadow-[0_0_35px_rgba(6,182,212,0.35)]",
      cardBg: "from-[#032030]/80 via-[#031522]/90 to-[#030a12]/95",
      speciesExamples: [
        "Mus musculus (House mouse)",
        "Drosophila melanogaster (Fruit fly)",
        "Danio rerio (Zebrafish)",
        "Bos taurus (Bovine cattle)",
      ],
      description:
        "Model non-linear epistasis and meiotic crossover in vertebrate lineages and model organisms. Trace complex physiological transgressions back to recombination breakpoints.",
      highlight: "Vertebrate Lineages & Complex Traits",
      disclaimer: "Generic computational meiosis model with animal context metadata",
      svgGraphic: (
        <svg viewBox="0 0 120 120" className="w-24 h-24 mx-auto mb-2 drop-shadow-[0_0_16px_#06b6d4]">
          {/* Abstract animal silhouette / double helix sphere */}
          <circle cx="60" cy="60" r="42" fill="url(#animalGrad)" stroke="#06b6d4" strokeWidth="1.6" opacity="0.6" />
          {/* Double helix curves */}
          <path
            d="M30 40 Q45 20 60 40 T90 40"
            fill="none"
            stroke="#06b6d4"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <path
            d="M30 80 Q45 100 60 80 T90 80"
            fill="none"
            stroke="#ec4899"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <path
            d="M30 60 Q45 40 60 60 T90 60"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* Interconnecting base rungs */}
          <line x1="42" y1="35" x2="42" y2="85" stroke="#94a3b8" strokeWidth="1.2" opacity="0.7" />
          <line x1="60" y1="40" x2="60" y2="80" stroke="#94a3b8" strokeWidth="1.2" opacity="0.7" />
          <line x1="78" y1="35" x2="78" y2="85" stroke="#94a3b8" strokeWidth="1.2" opacity="0.7" />
          {/* Glowing crossover node */}
          <circle cx="60" cy="60" r="4.5" fill="#f472b6" filter="drop-shadow(0 0 6px #ec4899)" />
          <defs>
            <linearGradient id="animalGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#083344" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#1e1b4b" stopOpacity="0.4" />
            </linearGradient>
          </defs>
        </svg>
      ),
    },
    {
      mode: "human",
      title: "Human Universe",
      tag: "BIOMEDICAL RESEARCH MODEL",
      badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/40",
      accentColor: "#8b5cf6",
      borderGlow: "hover:border-purple-400 hover:shadow-[0_0_35px_rgba(139,92,246,0.35)]",
      cardBg: "from-[#1a082e]/80 via-[#100620]/90 to-[#030a12]/95",
      speciesExamples: [
        "Homo sapiens (Phase-resolved trio)",
        "Synthetic 50-100 locus candidate tract",
        "Deterministic multi-seed benchmark",
        "Non-causal ancestry context metadata",
      ],
      description:
        "Simulate phase-resolved homologous chromosomes and complex trait interactions. Prioritize candidate epistatic hypotheses for experimental validation.",
      highlight: "Phase-Resolved Homologs & Pre-screening",
      disclaimer: "Strictly non-causal population context; computational hypothesis prioritization only.",
      svgGraphic: (
        <svg viewBox="0 0 120 120" className="w-24 h-24 mx-auto mb-2 drop-shadow-[0_0_16px_#8b5cf6]">
          {/* Abstract cellular chromosome sphere */}
          <circle cx="60" cy="60" r="44" fill="url(#humanGrad)" stroke="#8b5cf6" strokeWidth="1.6" opacity="0.65" />
          {/* Nucleus perimeter */}
          <circle cx="60" cy="60" r="28" fill="none" stroke="#c084fc" strokeWidth="1.2" strokeDasharray="3,2" />
          {/* Chromosome homologous pair (A1 & A2 crossed in synapsis) */}
          <path
            d="M44 42 C54 52 66 68 76 78"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M76 42 C66 52 54 68 44 78"
            fill="none"
            stroke="#c084fc"
            strokeWidth="3"
            strokeLinecap="round"
          />
          {/* Centromere chiasma */}
          <circle cx="60" cy="60" r="5" fill="#f6c85f" filter="drop-shadow(0 0 8px #f6c85f)" />
          <defs>
            <linearGradient id="humanGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#2e1065" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#0f172a" stopOpacity="0.4" />
            </linearGradient>
          </defs>
        </svg>
      ),
    },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 flex flex-col items-center select-none">
      {/* Top Header */}
      <div className="text-center max-w-3xl mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-[11px] font-mono text-cyan-300 uppercase tracking-widest mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          Interactive Scientific Heart
        </div>
        <h1 className="text-3xl lg:text-4xl font-serif text-white font-normal tracking-tight mb-2.5">
          Choose Your Experimental Universe
        </h1>
        <p className="text-xs lg:text-sm text-slate-300 leading-relaxed max-w-2xl mx-auto">
          Configure a model-relative genomic experiment and watch inheritance, recombination,
          phenotype formation, and counterfactual rescue unfold in real time.
        </p>
      </div>

      {/* 3 Large Universe Selection Cards */}
      <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {universes.map((univ) => {
          const isHovered = hoveredMode === univ.mode;
          return (
            <div
              key={univ.mode}
              onClick={() => selectUniverse(univ.mode)}
              onMouseEnter={() => setHoveredMode(univ.mode)}
              onMouseLeave={() => setHoveredMode(null)}
              className={`relative rounded-2xl p-6 bg-gradient-to-b ${univ.cardBg} border border-slate-800/80 cursor-pointer transition-all duration-300 flex flex-col justify-between group ${univ.borderGlow} ${
                isHovered ? "-translate-y-1.5" : ""
              }`}
            >
              {/* Top Tag Badge */}
              <div className="flex items-center justify-between mb-4">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase border ${univ.badgeColor}`}
                >
                  {univ.tag}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">0{universes.indexOf(univ) + 1}</span>
              </div>

              {/* Central 3D Graphic */}
              <div className="py-3 flex justify-center">{univ.svgGraphic}</div>

              {/* Title & Subtitle */}
              <div className="text-center mb-4">
                <h3 className="text-xl font-serif text-white font-bold tracking-tight mb-1 group-hover:text-cyan-300 transition-colors">
                  {univ.title}
                </h3>
                <div className="text-[11px] text-cyan-400 font-mono font-semibold">
                  {univ.highlight}
                </div>
              </div>

              {/* Description */}
              <p className="text-[11.5px] text-slate-300 leading-relaxed text-center mb-4 min-h-[50px]">
                {univ.description}
              </p>

              {/* Species Context Metadata */}
              <div className="bg-[#040916]/80 rounded-xl p-3 border border-slate-800/60 mb-5 text-[10px] space-y-1 text-left">
                <div className="text-[9px] font-mono uppercase text-slate-400 font-semibold mb-1">
                  Representative Context:
                </div>
                {univ.speciesExamples.slice(0, 2).map((sp, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 text-slate-300 truncate">
                    <span className="text-cyan-400">•</span>
                    <span>{sp}</span>
                  </div>
                ))}
              </div>

              {/* Action Button */}
              <button
                type="button"
                className="w-full py-2.5 rounded-xl font-medium text-xs text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 shadow-md group-hover:shadow-[0_0_20px_rgba(56,189,248,0.5)] group-hover:scale-[1.01] transition-all flex items-center justify-center gap-2"
              >
                <span>Enter {univ.title}</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </button>

              {/* Context Disclaimer */}
              <div className="mt-3 text-center text-[9px] text-slate-500 italic">
                {univ.disclaimer}
              </div>
            </div>
          );
        })}
      </div>

      {/* "Why simulate first?" Scientific Value Proposition Box */}
      <div className="w-full max-w-3xl rounded-2xl bg-[#040817]/90 border border-cyan-500/20 p-5 backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.5)] text-left flex items-start gap-4">
        <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 text-lg flex-shrink-0">
          🔬
        </div>
        <div className="space-y-1 text-[11.5px]">
          <div className="font-bold text-white font-sans tracking-wide flex items-center gap-2">
            <span>Why simulate first?</span>
            <span className="text-[9.5px] font-mono px-2 py-0.5 rounded bg-blue-950/60 text-cyan-300 border border-cyan-500/30">
              PRE-SCREENING RATIONALE
            </span>
          </div>
          <p className="text-slate-300 leading-relaxed">
            Computational experiments can help researchers explore candidate genomic configurations,
            compare alternative mechanisms, and prioritize which hypotheses are worth validating
            experimentally.
          </p>
          <p className="text-cyan-300/90 font-medium text-[11px]">
            Simulation narrows the search space — wet-lab validation remains essential.
          </p>
        </div>
      </div>
    </div>
  );
};
