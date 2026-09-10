"use client";

import React from "react";
import { useValidation } from "../ValidationInteractionContext";

export const BenchmarkRegimesPanel: React.FC = () => {
  const {
    activeStage,
    selectedRegime,
    setSelectedRegime,
    selectedMetric,
    setSelectedMetric,
    showTooltip,
    hideTooltip,
  } = useValidation();

  const isStage1 = activeStage === 1;

  // Stage 1: Regime Composition
  const regimeComposition = [
    {
      name: "Easy Regime",
      col1: "0.80",
      col2: "3 cand / 2 dist",
      barColor: "bg-cyan-400",
      pct: "80%",
      desc: "Isolated loci with high phenotypic signal",
    },
    {
      name: "Medium Regime",
      col1: "0.67",
      col2: "6 cand / 4 dist",
      barColor: "bg-cyan-400",
      pct: "67%",
      desc: "Moderate recombination density and distractor ratio",
    },
    {
      name: "Hard Regime",
      col1: "0.58",
      col2: "12 cand / 8 dist",
      barColor: "bg-pink-400",
      pct: "58%",
      desc: "Dense crossovers with subtle interaction shifts",
    },
    {
      name: "Additive Control",
      col1: "1.00",
      col2: "10 null seeds",
      barColor: "bg-emerald-400",
      pct: "100%",
      desc: "Linear baseline simulation — epistatic excess ≈ 0",
    },
    {
      name: "Distractor Pool",
      col1: "0.45",
      col2: "Zero causal shift",
      barColor: "bg-purple-400",
      pct: "45%",
      desc: "Background genomic variants without phenotypic contribution",
    },
    {
      name: "Dense Crossover",
      col1: "0.75",
      col2: "Complex breakpts",
      barColor: "bg-[#f6c85f]",
      pct: "75%",
      desc: "Multi-point recombination across epistatic loci",
    },
  ];

  // Stages 2-5: Scientific Evaluation Benchmarks
  const benchmarkRecovery = [
    {
      name: "Top-1 Recovery",
      col1: "0.94",
      col2: "0.06",
      barColor: "bg-cyan-400",
      pct: "94%",
      desc: "Primary rank-1 candidate matches true planted causal locus",
    },
    {
      name: "Top-3 Recovery",
      col1: "1.00",
      col2: "0.00",
      barColor: "bg-cyan-400",
      pct: "100%",
      desc: "True causal interaction consistently ranked in top 3",
    },
    {
      name: "Exact Interaction",
      col1: "0.95",
      col2: "0.05",
      barColor: "bg-pink-400",
      pct: "95%",
      desc: "Exact generative interaction pair identified by blind attribution",
    },
    {
      name: "Rescue Equivalent",
      col1: "0.96",
      col2: "0.04",
      barColor: "bg-purple-400",
      pct: "96%",
      desc: "Candidate produces phenotype shift within rescue envelope",
    },
    {
      name: "Mean Recip. Rank",
      col1: "0.82",
      col2: "0.18",
      barColor: "bg-purple-400",
      pct: "82%",
      desc: "Inverse ranking position of true mechanism (MRR = 0.82)",
    },
    {
      name: "Provenance Spec.",
      col1: "1.00",
      col2: "0.00",
      barColor: "bg-[#f6c85f]",
      pct: "100%",
      desc: "Attribution strictly bounded to crossover breakpoint windows",
    },
  ];

  const currentRows = isStage1 ? regimeComposition : benchmarkRecovery;

  return (
    <div className="h-full bg-[#040817]/90 backdrop-blur-md border border-slate-800/80 rounded-2xl p-2.5 flex flex-col justify-between shadow-[0_4px_24px_rgba(0,0,0,0.5)] select-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-xs font-bold text-white font-sans tracking-wide">
          {isStage1 ? "Regime Composition" : "Benchmark Recovery"}
        </h3>
        <select
          aria-label="Benchmark Regime Filter"
          value={selectedRegime}
          onChange={(e) => setSelectedRegime(e.target.value as any)}
          className="bg-slate-900/80 border border-slate-700/80 rounded-lg px-2 py-0.5 text-[9px] font-mono text-cyan-300 outline-none cursor-pointer hover:border-cyan-500/50 transition-colors"
        >
          <option value="all">All Regimes ⌵</option>
          <option value="easy">Easy Regime</option>
          <option value="medium">Medium Regime</option>
          <option value="hard">Hard Regime</option>
        </select>
      </div>

      {/* Table Header */}
      <div className="flex items-center justify-between text-[8px] font-mono uppercase text-slate-400 pb-0.5 border-b border-slate-800/60 px-1">
        <span className="w-24">{isStage1 ? "Regime" : "Metric"}</span>
        <span className="flex-1 text-center">{isStage1 ? "Signal" : "Recovery"}</span>
        <span className="w-8 text-right font-semibold">{isStage1 ? "Score" : "Rec."}</span>
        <span className="w-12 text-right font-semibold">{isStage1 ? "Config" : "Err."}</span>
      </div>

      {/* Table Rows */}
      <div className="space-y-1 flex-1 flex flex-col justify-between py-0.5">
        {currentRows.map((row, idx) => {
          const isSelected = selectedMetric === row.name;
          return (
            <div
              key={idx}
              onClick={() => setSelectedMetric(isSelected ? null : row.name)}
              className={`flex items-center justify-between text-[9px] px-1 py-0.5 rounded cursor-pointer transition-colors ${
                isSelected
                  ? "bg-cyan-950/60 border border-cyan-500/40 text-white"
                  : "hover:bg-slate-800/40 text-slate-300"
              }`}
              onMouseEnter={(e) => {
                showTooltip({
                  x: e.clientX,
                  y: e.clientY,
                  title: row.name,
                  subtitle: row.desc,
                  badge: isStage1 ? "SYNTHETIC BENCHMARK" : "EVALUATOR BENCHMARK",
                  badgeColor: "bg-cyan-950/70 text-cyan-300 border-cyan-500/40",
                  details: [
                    { label: isStage1 ? "Signal Ratio" : "Recovery Rate", value: row.col1, color: "#38bdf8" },
                    { label: isStage1 ? "Configuration" : "Normalized Error", value: row.col2, color: "#94a3b8" },
                  ],
                });
              }}
              onMouseLeave={hideTooltip}
            >
              <span className="w-24 text-slate-300 truncate font-medium">
                {row.name}
              </span>
              <div className="flex-1 h-1.5 bg-slate-800/80 rounded-full overflow-hidden mx-2">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${row.barColor}`}
                  style={{ width: row.pct }}
                />
              </div>
              <span className="w-8 text-right font-mono text-cyan-300 font-medium">
                {row.col1}
              </span>
              <span className="w-12 text-right font-mono text-slate-400 truncate">
                {row.col2}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
