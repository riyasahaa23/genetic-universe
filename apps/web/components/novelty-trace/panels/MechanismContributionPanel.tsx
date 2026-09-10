"use client";

import React from "react";
import { useNoveltyTrace } from "../interactions/NoveltyTraceInteractionContext";

export const MechanismContributionPanel: React.FC = () => {
  const {
    activeWorkflowStep,
    selectedCandidate,
    baselineModel,
    searchSpace,
    setTooltip,
  } = useNoveltyTrace();

  // STAGE 1: Baseline model decomposition
  const stage1Items = [
    {
      label: "Additive dosage stream",
      pct: baselineModel.additive,
      color: "bg-pink-500",
      textColor: "text-pink-300",
      desc: "Transmitted linear allele contributions",
    },
    {
      label: "Epistatic network synergy",
      pct: baselineModel.epistasis,
      color: "bg-cyan-400",
      textColor: "text-cyan-300",
      desc: "Configured pairwise non-linear interactions",
    },
    {
      label: "Dominance interactions",
      pct: baselineModel.dominance,
      color: "bg-amber-400",
      textColor: "text-amber-300",
      desc: "Intra-locus heterozygous states",
    },
    {
      label: "Stochastic residual variance",
      pct: baselineModel.other,
      color: "bg-slate-400",
      textColor: "text-slate-300",
      desc: "Micro-environmental background noise",
    },
  ];

  // STAGE 2: Candidate type distribution
  const stage2Items = [
    {
      label: "Single Variant Dosages",
      pct: 50,
      color: "bg-cyan-400",
      textColor: "text-cyan-300",
      desc: "18 candidate SNV loci evaluated for large dosage effects",
    },
    {
      label: "Pairwise Epistatic Interactions",
      pct: 33,
      color: "bg-pink-500",
      textColor: "text-pink-300",
      desc: "12 candidate gene pairs evaluated for supralinear synergy",
    },
    {
      label: "Recombinant Segment Blocks",
      pct: 17,
      color: "bg-purple-400",
      textColor: "text-purple-300",
      desc: "6 crossover-defined ancestral haplotype segments",
    },
  ];

  // STAGE 3: Selected candidate multi-criteria score components
  const stage3Items = [
    {
      label: "Phenotype Effect Component",
      pct: Math.round(selectedCandidate.scoreComponents.effect * 100),
      color: "bg-amber-400",
      textColor: "text-amber-300",
      desc: "Ablation delta (Δy) under in-silico perturbation",
    },
    {
      label: "Provenance Coherence Component",
      pct: Math.round(selectedCandidate.scoreComponents.provenance * 100),
      color: "bg-cyan-400",
      textColor: "text-cyan-300",
      desc: "Direct link to inherited parental homologs & breakpoints",
    },
    {
      label: "Model Stability Component",
      pct: Math.round(selectedCandidate.scoreComponents.stability * 100),
      color: "bg-purple-400",
      textColor: "text-purple-300",
      desc: "Robustness to background polygenic noise",
    },
  ];

  // STAGE 4: Candidate-specific mechanism decomposition
  const contributions = selectedCandidate.contributionBreakdown;
  const stage4Items = [
    {
      label: "Epistatic synergy (A × B)",
      pct: contributions.epistasis,
      color: "bg-cyan-400",
      textColor: "text-cyan-300",
      desc: "Non-linear pairwise synergy driving +1.70 SD overshoot",
    },
    {
      label: "Additive dosage contribution",
      pct: contributions.additive,
      color: "bg-pink-500",
      textColor: "text-pink-300",
      desc: "Transmitted linear variant allele dosages",
    },
    {
      label: "Dominance modifier effects",
      pct: contributions.dominance,
      color: "bg-amber-400",
      textColor: "text-amber-300",
      desc: "Intra-locus heterozygous states",
    },
    {
      label: "Residual model variance",
      pct: contributions.other,
      color: "bg-slate-400",
      textColor: "text-slate-300",
      desc: "Unexplained stochastic polygenic background",
    },
  ];

  const currentItems =
    activeWorkflowStep === 1
      ? stage1Items
      : activeWorkflowStep === 2
      ? stage2Items
      : activeWorkflowStep === 3
      ? stage3Items
      : stage4Items;

  const title =
    activeWorkflowStep === 1
      ? "Phenotype Components (Model Baseline)"
      : activeWorkflowStep === 2
      ? "Candidate Type Breakdown"
      : activeWorkflowStep === 3
      ? "Candidate Evidence Breakdown"
      : `Mechanism Contribution (${selectedCandidate.name})`;

  return (
    <div className="w-full h-full bg-[#070d1d]/85 backdrop-blur-md border border-slate-800/80 rounded-xl p-3 shadow-[0_8px_32px_rgba(0,0,0,0.6)] flex flex-col justify-between group hover:border-slate-700/80 transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/50 pb-1 mb-1">
        <div className="flex items-center gap-1.5">
          <span className="text-cyan-400 font-bold text-xs">|</span>
          <h2 className="text-xs font-semibold text-slate-100 tracking-wide font-sans">
            {title}
          </h2>
        </div>
        <div className="w-4 h-4 rounded-full border border-slate-700 flex items-center justify-center text-[9px] text-slate-400 cursor-pointer">
          ›
        </div>
      </div>

      {/* Horizontal Bars */}
      <div className="space-y-1.5 flex-1 flex flex-col justify-center">
        {currentItems.map((item, idx) => (
          <div
            key={idx}
            onMouseEnter={(e) => {
              setTooltip({
                visible: true,
                x: e.clientX,
                y: e.clientY,
                title: item.label,
                subtitle: item.desc,
                badge:
                  activeWorkflowStep === 1
                    ? "BASELINE MODEL"
                    : activeWorkflowStep === 2
                    ? "CANDIDATE TYPE"
                    : activeWorkflowStep === 3
                    ? "SCORE COMPONENT"
                    : "MECHANISM DECOMPOSITION",
                badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/50",
                details: [
                  { label: "Share of model effect", value: `${item.pct}%`, color: "#fbbf24" },
                  { label: "Stage", value: `Step ${activeWorkflowStep}`, color: "#38bdf8" },
                ],
              });
            }}
            onMouseLeave={() => setTooltip(null)}
            className="p-1 rounded cursor-pointer hover:bg-slate-900/40 transition-colors"
          >
            <div className="flex items-center justify-between text-[9.5px] mb-0.5">
              <span className="text-slate-300 font-medium">{item.label}</span>
              <span className={`font-mono font-bold ${item.textColor}`}>{item.pct}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800/80">
              <div
                className={`h-full ${item.color} transition-all duration-500 rounded-full shadow-[0_0_6px_currentColor]`}
                style={{ width: `${item.pct}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
