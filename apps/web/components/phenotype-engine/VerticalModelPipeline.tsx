"use client";

import React from "react";
import { usePhenotypeInteraction } from "./interactions/PhenotypeInteractionContext";

export const VerticalModelPipeline: React.FC = () => {
  const { activeStage, setActiveStage, setTooltip } = usePhenotypeInteraction();

  const stages = [
    {
      id: 1,
      title: "Genotype",
      desc: "Inherited alleles",
      icon: "🧬",
      badge: "INPUT CHROMOSOMES",
      badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
      details: [
        { label: "Ancestry source", value: "Biparental recombined genome", color: "#38bdf8" },
        { label: "Representation", value: "4 chromosome bivalents", color: "#94a3b8" },
      ],
    },
    {
      id: 2,
      title: "Additive",
      desc: "Main effects",
      icon: "⚡",
      badge: "LINEAR MODEL LAYER",
      badgeColor: "bg-blue-500/20 text-blue-300 border-blue-500/40",
      details: [
        { label: "Formula", value: "Σ α_i · x_i", color: "#38bdf8" },
        { label: "Assumption", value: "Independent dosage contributions", color: "#94a3b8" },
      ],
    },
    {
      id: 3,
      title: "Dominance",
      desc: "Allelic state effects",
      icon: "⚖️",
      badge: "INTRA-LOCUS DEVIATION",
      badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/40",
      details: [
        { label: "Formula", value: "Σ β_j · d_j", color: "#c084fc" },
        { label: "Mechanism", value: "Heterozygous non-additivity", color: "#94a3b8" },
      ],
    },
    {
      id: 4,
      title: "Epistasis",
      desc: "Non-linear interactions",
      icon: "🕸️",
      badge: "INTER-LOCUS NETWORK",
      badgeColor: "bg-pink-500/20 text-pink-300 border-pink-500/40",
      details: [
        { label: "Formula", value: "Σ γ_uv (x_u × x_v)", color: "#ec4899" },
        { label: "Mechanism", value: "Pairwise synergistic combinations", color: "#fbbf24" },
      ],
    },
    {
      id: 5,
      title: "Phenotype",
      desc: "Model output",
      icon: "✨",
      badge: "QUANTITATIVE TRAIT",
      badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/40",
      details: [
        { label: "Status", value: "Emergent non-linear outcome", color: "#fbbf24" },
        { label: "Novelty test", value: "Evaluated against parental envelope", color: "#38bdf8" },
      ],
    },
  ];

  return (
    <div className="absolute left-1.5 top-2 w-32 flex flex-col gap-1 z-20 pointer-events-auto select-none">
      {stages.map((st, idx) => {
        const isActive = activeStage === st.id;
        return (
          <React.Fragment key={st.id}>
            <div
              role="button"
              tabIndex={0}
              onClick={() => setActiveStage(st.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setActiveStage(st.id);
                }
              }}
              onMouseEnter={(e) => {
                setTooltip({
                  visible: true,
                  x: e.clientX,
                  y: e.clientY,
                  title: `${st.title} Stage`,
                  subtitle: st.desc,
                  badge: st.badge,
                  badgeColor: st.badgeColor,
                  details: st.details,
                });
              }}
              onMouseLeave={() => setTooltip(null)}
              className={`w-full py-1 px-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer transition-all duration-300 border focus:outline-none focus:ring-1 focus:ring-cyan-400 ${
                isActive
                  ? "bg-[#0b1b38]/95 border-cyan-400 shadow-[0_0_16px_rgba(56,189,248,0.4)]"
                  : "bg-[#070e22]/80 border-slate-800/80 hover:border-slate-700/80 hover:bg-[#091430]"
              }`}
            >
              {/* Icon Circle */}
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] transition-transform flex-shrink-0 ${
                  isActive ? "bg-cyan-500/30 text-cyan-200 scale-105" : "bg-slate-900 text-slate-400"
                }`}
              >
                {st.icon}
              </div>

              {/* Text */}
              <div className="flex flex-col text-left leading-tight min-w-0">
                <span className={`text-[10px] font-semibold tracking-wide ${isActive ? "text-white font-bold" : "text-slate-300"}`}>
                  {st.title}
                </span>
                <span className={`text-[8px] truncate ${isActive ? "text-cyan-300" : "text-slate-500"}`}>
                  {st.desc}
                </span>
              </div>
            </div>

            {/* Downward Arrow */}
            {idx < stages.length - 1 && (
              <div className="text-slate-600 text-[9px] select-none leading-none mx-auto my-0">
                ↓
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
