"use client";

import React from "react";
import { useValidation } from "../ValidationInteractionContext";

export const RecoveryMetricsPanel: React.FC = () => {
  const {
    activeStage,
    metrics,
    selectedMetricFamily,
    setSelectedMetricFamily,
    selectedMetric,
    setSelectedMetric,
    showTooltip,
    hideTooltip,
  } = useValidation();

  // Stage 1: Benchmark Summary
  const benchmarkSummaryTiles = [
    {
      label: "Independent Worlds",
      value: "24",
      sub: "8 Easy · 8 Med · 8 Hard",
      barColor: "bg-cyan-400 shadow-[0_0_8px_#38bdf8]",
      textColor: "text-cyan-400",
      pct: "100%",
    },
    {
      label: "Regimes Evaluated",
      value: "3",
      sub: "Controlled difficulty",
      barColor: "bg-pink-400 shadow-[0_0_8px_#f472b6]",
      textColor: "text-pink-400",
      pct: "100%",
    },
    {
      label: "Null Simulations",
      value: "100",
      sub: "Permuted genotypes",
      barColor: "bg-purple-400 shadow-[0_0_8px_#c084fc]",
      textColor: "text-purple-400",
      pct: "100%",
    },
    {
      label: "Bootstrap Replicates",
      value: "1,000",
      sub: "95% BCa confidence limits",
      barColor: "bg-[#f6c85f] shadow-[0_0_8px_#f6c85f]",
      textColor: "text-[#f6c85f]",
      pct: "100%",
    },
  ];

  // Stages 2-5: Metric family tiles based on selectedMetricFamily
  const getFamilyTiles = () => {
    switch (selectedMetricFamily) {
      case "Ranking":
        return [
          {
            label: "Top-1 Recovery",
            value: `${(metrics.top1Recovery * 100).toFixed(0)}%`,
            sub: "Rank 1 primary candidate",
            barColor: "bg-cyan-400 shadow-[0_0_8px_#38bdf8]",
            textColor: "text-cyan-400",
            pct: `${metrics.top1Recovery * 100}%`,
          },
          {
            label: "Top-3 Recovery",
            value: `${(metrics.top3Recovery * 100).toFixed(0)}%`,
            sub: "Rank 1-3 candidate pool",
            barColor: "bg-pink-400 shadow-[0_0_8px_#f472b6]",
            textColor: "text-pink-400",
            pct: `${metrics.top3Recovery * 100}%`,
          },
          {
            label: "Mean Reciprocal Rank",
            value: metrics.meanReciprocalRank.toFixed(2),
            sub: `95% CI [${metrics.mrrCI[0].toFixed(2)}, ${metrics.mrrCI[1].toFixed(2)}]`,
            barColor: "bg-purple-400 shadow-[0_0_8px_#c084fc]",
            textColor: "text-purple-400",
            pct: `${metrics.meanReciprocalRank * 100}%`,
          },
          {
            label: "Attribution Recall",
            value: `${(metrics.recall * 100).toFixed(0)}%`,
            sub: `95% CI [${metrics.recallCI[0].toFixed(2)}, ${metrics.recallCI[1].toFixed(2)}]`,
            barColor: "bg-[#f6c85f] shadow-[0_0_8px_#f6c85f]",
            textColor: "text-[#f6c85f]",
            pct: `${metrics.recall * 100}%`,
          },
        ];
      case "Mechanism":
        return [
          {
            label: "Exact Interaction",
            value: metrics.exactInteractionRecovery.toFixed(2),
            sub: "Generative pair identity",
            barColor: "bg-cyan-400 shadow-[0_0_8px_#38bdf8]",
            textColor: "text-cyan-400",
            pct: `${metrics.exactInteractionRecovery * 100}%`,
          },
          {
            label: "Provenance Recovery",
            value: `${(metrics.provenanceRecovery * 100).toFixed(0)}%`,
            sub: "Breakpoint-bound specificity",
            barColor: "bg-emerald-400 shadow-[0_0_8px_#34d399]",
            textColor: "text-emerald-400",
            pct: `${metrics.provenanceRecovery * 100}%`,
          },
          {
            label: "Causal / Null Ratio",
            value: `${metrics.causalVsNullRatio.toFixed(2)}×`,
            sub: "Faithfulness separation",
            barColor: "bg-pink-400 shadow-[0_0_8px_#f472b6]",
            textColor: "text-pink-400",
            pct: "88%",
          },
          {
            label: "Precision (Pool)",
            value: `${(metrics.precision * 100).toFixed(0)}%`,
            sub: `95% CI [${metrics.precisionCI[0].toFixed(2)}, ${metrics.precisionCI[1].toFixed(2)}]`,
            barColor: "bg-[#f6c85f] shadow-[0_0_8px_#f6c85f]",
            textColor: "text-[#f6c85f]",
            pct: `${metrics.precision * 100}%`,
          },
        ];
      case "Rescue":
        return [
          {
            label: "Rescue-Equivalent",
            value: metrics.rescueEquivalenceRecovery.toFixed(2),
            sub: "Functionally sufficient",
            barColor: "bg-pink-400 shadow-[0_0_8px_#f472b6]",
            textColor: "text-pink-400",
            pct: `${metrics.rescueEquivalenceRecovery * 100}%`,
          },
          {
            label: "Causal / Null Ratio",
            value: `${metrics.causalVsNullRatio.toFixed(2)}×`,
            sub: `95% CI [${metrics.causalVsNullCI[0].toFixed(2)}, ${metrics.causalVsNullCI[1].toFixed(2)}]`,
            barColor: "bg-cyan-400 shadow-[0_0_8px_#38bdf8]",
            textColor: "text-cyan-400",
            pct: "88%",
          },
          {
            label: "Exact Recovery",
            value: metrics.exactInteractionRecovery.toFixed(2),
            sub: "Exact locus match",
            barColor: "bg-purple-400 shadow-[0_0_8px_#c084fc]",
            textColor: "text-purple-400",
            pct: `${metrics.exactInteractionRecovery * 100}%`,
          },
          {
            label: "Top-3 Recovery",
            value: `${(metrics.top3Recovery * 100).toFixed(0)}%`,
            sub: "Included in top 3 rescues",
            barColor: "bg-[#f6c85f] shadow-[0_0_8px_#f6c85f]",
            textColor: "text-[#f6c85f]",
            pct: `${metrics.top3Recovery * 100}%`,
          },
        ];
      case "Overview":
      default:
        return [
          {
            label: "Exact Recovery",
            value: metrics.exactInteractionRecovery.toFixed(2),
            sub: `95% CI [${metrics.recallCI[0].toFixed(2)}, ${metrics.recallCI[1].toFixed(2)}]`,
            barColor: "bg-cyan-400 shadow-[0_0_8px_#38bdf8]",
            textColor: "text-cyan-400",
            pct: `${metrics.exactInteractionRecovery * 100}%`,
          },
          {
            label: "Rescue-Equivalent",
            value: metrics.rescueEquivalenceRecovery.toFixed(2),
            sub: "Functionally sufficient",
            barColor: "bg-pink-400 shadow-[0_0_8px_#f472b6]",
            textColor: "text-pink-400",
            pct: `${metrics.rescueEquivalenceRecovery * 100}%`,
          },
          {
            label: "Top-3 Recovery",
            value: `${(metrics.top3Recovery * 100).toFixed(0)}%`,
            sub: "Rank 1-3 guarantee",
            barColor: "bg-purple-400 shadow-[0_0_8px_#c084fc]",
            textColor: "text-purple-400",
            pct: `${metrics.top3Recovery * 100}%`,
          },
          {
            label: "Mean Reciprocal Rank",
            value: metrics.meanReciprocalRank.toFixed(2),
            sub: `95% CI [${metrics.mrrCI[0].toFixed(2)}, ${metrics.mrrCI[1].toFixed(2)}]`,
            barColor: "bg-[#f6c85f] shadow-[0_0_8px_#f6c85f]",
            textColor: "text-[#f6c85f]",
            pct: `${metrics.meanReciprocalRank * 100}%`,
          },
        ];
    }
  };

  const isStage1 = activeStage === 1;
  const currentTiles = isStage1 ? benchmarkSummaryTiles : getFamilyTiles();

  return (
    <div className="h-full bg-[#040817]/90 backdrop-blur-md border border-slate-800/80 rounded-2xl p-2.5 flex flex-col justify-between shadow-[0_4px_24px_rgba(0,0,0,0.5)] select-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-xs font-bold text-white font-sans tracking-wide">
          {isStage1 ? "Benchmark Summary" : "Performance Metrics"}
        </h3>
        {isStage1 ? (
          <span className="text-[9px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded">
            24 WORLDS
          </span>
        ) : (
          <select
            aria-label="Metric Family Selector"
            value={selectedMetricFamily}
            onChange={(e) => setSelectedMetricFamily(e.target.value as any)}
            className="bg-slate-900/80 border border-slate-700/80 rounded-lg px-2 py-0.5 text-[9px] font-mono text-cyan-300 outline-none cursor-pointer hover:border-cyan-500/50 transition-colors"
          >
            <option value="Overview">Overview ⌵</option>
            <option value="Ranking">Ranking Metrics</option>
            <option value="Mechanism">Mechanism Recovery</option>
            <option value="Rescue">Rescue Equivalence</option>
          </select>
        )}
      </div>

      {/* 2x2 Metric Tiles Grid */}
      <div className="grid grid-cols-2 gap-2 flex-1 items-center">
        {currentTiles.map((tile, idx) => {
          const isSelected = selectedMetric === tile.label;
          return (
            <div
              key={idx}
              onClick={() => setSelectedMetric(isSelected ? null : tile.label)}
              className={`border rounded-xl p-2 flex flex-col justify-between h-full cursor-pointer transition-all duration-200 ${
                isSelected
                  ? "bg-[#061833]/90 border-cyan-400 shadow-[0_0_14px_rgba(56,189,248,0.3)] scale-[1.02]"
                  : "bg-[#050e20]/60 border-slate-800/70 hover:border-slate-700"
              }`}
              onMouseEnter={(e) => {
                showTooltip({
                  x: e.clientX,
                  y: e.clientY,
                  title: tile.label,
                  subtitle: tile.sub,
                  badge: isStage1 ? "BENCHMARK METADATA" : "BENCHMARK METRIC",
                  badgeColor: "bg-cyan-950/70 text-cyan-300 border-cyan-500/40",
                  details: [
                    { label: "Value", value: tile.value, color: tile.textColor.replace("text-", "#") },
                    { label: "Basis", value: isStage1 ? "Evaluator ground-truth design" : "Multi-seed blind evaluation", color: "#94a3b8" },
                  ],
                });
              }}
              onMouseLeave={hideTooltip}
            >
              <div className="text-[9px] text-slate-400 font-medium truncate">
                {tile.label}
              </div>
              <div className={`text-xl font-bold font-mono my-0.5 ${tile.textColor}`}>
                {tile.value}
              </div>
              <div className="w-full h-1.5 bg-slate-800/80 rounded-full overflow-hidden mt-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${tile.barColor}`}
                  style={{ width: tile.pct }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
