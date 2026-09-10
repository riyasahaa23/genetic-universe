"use client";

import React from "react";
import { usePhenotypeInteraction } from "../interactions/PhenotypeInteractionContext";

export const ContributionBreakdownPanel: React.FC = () => {
  const {
    activeMode,
    contributions,
    activeComponent,
    setActiveComponent,
    setTooltip,
  } = usePhenotypeInteraction();

  const isGenotypeStage = activeMode === "genotype";

  if (isGenotypeStage) {
    const configuredTerms = [
      { id: "additive", label: "Additive Main Loci", count: "8 Loci", formula: "Σ αᵢxᵢ", color: "bg-cyan-400", textColor: "text-cyan-300", desc: "Configured additive main-effect terms" },
      { id: "dominance", label: "Dominance Deviation Loci", count: "3 Heterozygotes", formula: "Σ βⱼdⱼ", color: "bg-purple-400", textColor: "text-purple-300", desc: "Intra-locus state terms" },
      { id: "epistasis", label: "Interaction-Linked Loci", count: "2 Candidate Pairs", formula: "Σ γᵤᵥxᵤxᵥ", color: "bg-pink-400", textColor: "text-pink-300", desc: "Pairwise epistatic terms" },
      { id: "combined", label: "Residual / Baseline Terms", count: "1 Baseline Term", formula: "y₀ + ε", color: "bg-slate-400", textColor: "text-slate-300", desc: "Constant and stochastic variance" },
    ];

    return (
      <div className="w-full bg-[#070d1d]/85 backdrop-blur-md border border-slate-800/80 rounded-xl p-3.5 shadow-[0_8px_32px_rgba(0,0,0,0.6)] flex flex-col justify-between group hover:border-slate-700/80 transition-all duration-300">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/50 pb-2 mb-1">
          <div className="flex items-center gap-1.5">
            <span className="text-cyan-400 font-bold text-xs">|</span>
            <h2 className="text-xs font-semibold text-slate-100 tracking-wide font-sans">
              Configured Genetic Terms
            </h2>
          </div>
          <span className="text-[8px] font-mono text-cyan-400 uppercase bg-cyan-950/60 px-1 py-0.2 rounded border border-cyan-800/50">
            Model Setup
          </span>
        </div>

        {/* 4 Configured Terms (Restrained, awaiting evaluation) */}
        <div className="space-y-1.5 my-1">
          {configuredTerms.map((term) => (
            <div
              key={term.id}
              className="p-1.5 rounded-lg bg-[#060c1c]/70 border border-slate-800/70 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between text-[9.5px]">
                <span className="text-slate-300 font-medium">{term.label}</span>
                <span className={`font-mono font-semibold ${term.textColor}`}>{term.count}</span>
              </div>
              <div className="flex items-center justify-between text-[8px] text-slate-500 font-mono mt-0.5">
                <span>{term.formula}</span>
                <span className="text-slate-400">Configured</span>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-1 border-t border-slate-800/50 text-[8px] text-slate-500 font-mono text-center">
          Awaiting evaluation in Interaction Network →
        </div>
      </div>
    );
  }

  const items = [
    {
      id: "additive" as const,
      label: "Genetic Variants (Additive)",
      pct: contributions.additivePct,
      color: "bg-cyan-400",
      textColor: "text-cyan-300",
      desc: "Direct additive contributions (Σ α_i x_i)",
    },
    {
      id: "epistasis" as const,
      label: "Epistatic Interactions",
      pct: contributions.epistasisPct,
      color: "bg-pink-500",
      textColor: "text-pink-300",
      desc: "Non-linear interaction terms (Σ γ_uv (x_u × x_v))",
    },
    {
      id: "dominance" as const,
      label: "Dominance Deviations",
      pct: contributions.dominancePct,
      color: "bg-amber-400",
      textColor: "text-amber-300",
      desc: "Heterozygous intra-locus dominance (Σ β_j d_j)",
    },
    {
      id: "combined" as const,
      label: "Residual / Other Factors",
      pct: contributions.residualPct,
      color: "bg-slate-400",
      textColor: "text-slate-300",
      desc: "Unmodelled variance & stochastic residual",
    },
  ];

  return (
    <div className="w-full bg-[#070d1d]/85 backdrop-blur-md border border-slate-800/80 rounded-xl p-3.5 shadow-[0_8px_32px_rgba(0,0,0,0.6)] flex flex-col justify-between group hover:border-slate-700/80 transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/50 pb-2 mb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-cyan-400 font-bold text-xs">|</span>
          <h2 className="text-xs font-semibold text-slate-100 tracking-wide font-sans">
            Trait Contribution Breakdown
          </h2>
        </div>
      </div>

      {/* 4 Horizontal Contribution Bars */}
      <div className="space-y-2 my-1">
        {items.map((item) => {
          const isSelected = activeComponent === item.id;
          return (
            <div
              key={item.id}
              onClick={() => setActiveComponent(item.id)}
              onMouseEnter={(e) => {
                setTooltip({
                  visible: true,
                  x: e.clientX,
                  y: e.clientY,
                  title: item.label,
                  subtitle: item.desc,
                  badge: "MODEL DECOMPOSITION",
                  badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
                  details: [
                    { label: "Proportion", value: `${item.pct}% of total effect`, color: "#38bdf8" },
                    { label: "Status", value: isSelected ? "Highlighted in 3D" : "Click to isolate", color: "#fbbf24" },
                  ],
                });
              }}
              onMouseLeave={() => setTooltip(null)}
              className={`p-1.5 rounded-lg cursor-pointer transition-all border ${
                isSelected
                  ? "border-cyan-500/60 bg-cyan-950/20"
                  : "border-transparent hover:bg-slate-900/40"
              }`}
            >
              <div className="flex items-center justify-between text-[10px] mb-1">
                <span className="text-slate-300 font-medium">{item.label}</span>
                <span className={`font-mono font-bold ${item.textColor}`}>{item.pct}%</span>
              </div>
              <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800/80">
                <div
                  className={`h-full ${item.color} transition-all duration-500 rounded-full shadow-[0_0_8px_currentColor]`}
                  style={{ width: `${Math.max(4, item.pct)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
