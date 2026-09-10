"use client";

import React from "react";
import { useValidation, GeneralizationTab, BenchmarkRegime } from "../ValidationInteractionContext";

export const GeneralizationPanel: React.FC = () => {
  const {
    activeStage,
    activeGeneralizationTab,
    setActiveGeneralizationTab,
    selectedRegime,
    setSelectedRegime,
    metrics,
    selectedTrait,
    setSelectedTrait,
    showTooltip,
    hideTooltip,
  } = useValidation();

  const tabs: { id: GeneralizationTab; label: string; regime: BenchmarkRegime }[] = [
    { id: "known", label: "Known Variants", regime: "easy" },
    { id: "novel", label: "Novel Recomb.", regime: "medium" },
    { id: "unseen", label: "Unseen Combinations", regime: "hard" },
  ];

  // Box plot dimensions
  const svgWidth = 320;
  const svgHeight = 150;
  const margin = { top: 15, right: 15, bottom: 28, left: 32 };
  const innerWidth = svgWidth - margin.left - margin.right;
  const innerHeight = svgHeight - margin.top - margin.bottom;

  const yScale = (val: number) => {
    // Domain -3 to 3 mapped to innerHeight
    return margin.top + innerHeight - ((val + 3) / 6) * innerHeight;
  };

  // Dynamic box plots adapting to active tab
  const getBoxPlots = () => {
    switch (activeGeneralizationTab) {
      case "known":
        return [
          {
            label: "Parental-like",
            color: "#38bdf8",
            fillColor: "rgba(56,189,248,0.25)",
            x: margin.left + innerWidth * 0.2,
            q1: -0.28,
            median: 0.02,
            q3: 0.31,
            min: -0.85,
            max: 0.8,
          },
          {
            label: "Recombinant",
            subLabel: "(known)",
            color: "#ec4899",
            fillColor: "rgba(236,72,153,0.25)",
            x: margin.left + innerWidth * 0.52,
            q1: -0.32,
            median: 0.04,
            q3: 0.36,
            min: -0.95,
            max: 0.9,
          },
          {
            label: "Transgressive",
            subLabel: "(mild)",
            color: "#f6c85f",
            fillColor: "rgba(246,200,95,0.25)",
            x: margin.left + innerWidth * 0.84,
            q1: -0.38,
            median: 0.08,
            q3: 0.44,
            min: -1.05,
            max: 1.1,
          },
        ];
      case "unseen":
        return [
          {
            label: "Parental-like",
            color: "#38bdf8",
            fillColor: "rgba(56,189,248,0.25)",
            x: margin.left + innerWidth * 0.2,
            q1: -0.55,
            median: -0.1,
            q3: 0.58,
            min: -1.5,
            max: 1.45,
          },
          {
            label: "Recombinant",
            subLabel: "(unseen)",
            color: "#ec4899",
            fillColor: "rgba(236,72,153,0.25)",
            x: margin.left + innerWidth * 0.52,
            q1: -0.52,
            median: 0.14,
            q3: 0.62,
            min: -1.65,
            max: 1.6,
          },
          {
            label: "Transgressive",
            subLabel: "(novel)",
            color: "#f6c85f",
            fillColor: "rgba(246,200,95,0.25)",
            x: margin.left + innerWidth * 0.84,
            q1: -0.42,
            median: 0.22,
            q3: 0.74,
            min: -1.6,
            max: 1.85,
          },
        ];
      case "novel":
      default:
        return [
          {
            label: "Parental-like",
            color: "#38bdf8",
            fillColor: "rgba(56,189,248,0.25)",
            x: margin.left + innerWidth * 0.2,
            q1: -0.45,
            median: -0.05,
            q3: 0.45,
            min: -1.2,
            max: 1.15,
          },
          {
            label: "Recombinant",
            subLabel: "(configured)",
            color: "#ec4899",
            fillColor: "rgba(236,72,153,0.25)",
            x: margin.left + innerWidth * 0.52,
            q1: -0.4,
            median: 0.1,
            q3: 0.5,
            min: -1.35,
            max: 1.3,
          },
          {
            label: "Transgressive",
            subLabel: "(novel)",
            color: "#f6c85f",
            fillColor: "rgba(246,200,95,0.25)",
            x: margin.left + innerWidth * 0.84,
            q1: -0.35,
            median: 0.18,
            q3: 0.62,
            min: -1.25,
            max: 1.55,
          },
        ];
    }
  };

  const boxPlots = getBoxPlots();
  const isStage3 = activeStage === 3;

  return (
    <div
      className={`h-full bg-[#040817]/90 backdrop-blur-md border rounded-2xl p-3 flex flex-col justify-between select-none transition-all duration-300 ${
        isStage3
          ? "border-cyan-500/60 shadow-[0_0_24px_rgba(56,189,248,0.25)] ring-1 ring-cyan-500/30"
          : "border-slate-800/80 shadow-[0_4px_24px_rgba(0,0,0,0.5)]"
      }`}
    >
      {/* Header with Tabs and Dropdown */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-bold text-white font-sans tracking-wide">
            Generalization to Novel Configurations
          </h3>
          {isStage3 && (
            <span className="text-[9px] font-mono text-cyan-300 bg-cyan-950/70 border border-cyan-500/40 px-1.5 py-0.2 rounded animate-pulse">
              ACTIVE STAGE
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* 3 Tabs */}
          <div className="flex items-center bg-slate-900/90 border border-slate-800/80 rounded-lg p-0.5 text-[9px]">
            {tabs.map((tab) => {
              const isActive = activeGeneralizationTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveGeneralizationTab(tab.id);
                    setSelectedRegime(tab.regime);
                  }}
                  className={`px-2 py-0.5 rounded transition-all font-medium ${
                    isActive
                      ? "bg-cyan-500 text-slate-950 font-bold shadow-[0_0_10px_rgba(56,189,248,0.5)]"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Evaluation Perspective Selector */}
          <select
            aria-label="Evaluation Perspective"
            value={selectedTrait}
            onChange={(e) => setSelectedTrait(e.target.value)}
            className="bg-slate-900/80 border border-slate-700/80 rounded-lg px-2 py-0.5 text-[9px] font-mono text-cyan-300 outline-none cursor-pointer hover:border-cyan-500/50 transition-colors"
          >
            <option value="All Traits">All Traits ⌵</option>
            <option value="Epistatic Excess">Epistatic Excess</option>
            <option value="Transgressive Shift">Transgressive Shift</option>
          </select>
        </div>
      </div>

      {/* Main Content: Left D3 Box Plots + Right Summary Card */}
      <div className="grid grid-cols-12 gap-3 flex-1 items-center min-h-0">
        {/* Left: Box Plots SVG */}
        <div className="col-span-8 h-full flex items-center justify-center relative">
          <svg
            className="w-full h-full max-h-[145px]"
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Zero Error Reference Line */}
            <line
              x1={margin.left}
              y1={yScale(0)}
              x2={svgWidth - margin.right}
              y2={yScale(0)}
              stroke="#334155"
              strokeWidth={1}
              strokeDasharray="2,2"
            />

            {/* Y Axis Line */}
            <line
              x1={margin.left}
              y1={margin.top}
              x2={margin.left}
              y2={yScale(-3)}
              stroke="#334155"
              strokeWidth={1}
            />

            {/* Y Axis Ticks */}
            {[-3, -2, -1, 0, 1, 2, 3].map((tick) => (
              <g key={tick}>
                <line
                  x1={margin.left - 3}
                  y1={yScale(tick)}
                  x2={margin.left}
                  y2={yScale(tick)}
                  stroke="#64748b"
                  strokeWidth={1}
                />
                <text
                  x={margin.left - 5}
                  y={yScale(tick) + 2.5}
                  fill="#64748b"
                  fontSize="7.5"
                  textAnchor="end"
                  fontFamily="monospace"
                >
                  {tick}
                </text>
              </g>
            ))}

            {/* Y Axis Label */}
            <text
              x={10}
              y={margin.top + innerHeight / 2}
              fill="#64748b"
              fontSize="7.5"
              textAnchor="middle"
              transform={`rotate(-90 10 ${margin.top + innerHeight / 2})`}
              fontFamily="sans-serif"
            >
              Prediction Error
            </text>

            {/* Box Plots */}
            {boxPlots.map((bp, idx) => {
              const boxW = 28;
              const yMin = yScale(bp.min);
              const yMax = yScale(bp.max);
              const yQ1 = yScale(bp.q1);
              const yQ3 = yScale(bp.q3);
              const yMed = yScale(bp.median);

              return (
                <g
                  key={idx}
                  className="cursor-pointer group"
                  onMouseEnter={(e) => {
                    showTooltip({
                      x: e.clientX,
                      y: e.clientY,
                      title: `${bp.label} ${bp.subLabel || ""}`,
                      subtitle: "Generalization error distribution",
                      badge: "OUT-OF-DISTRIBUTION",
                      badgeColor: "bg-cyan-950/70 text-cyan-300 border-cyan-500/40",
                      details: [
                        { label: "Median Error", value: bp.median.toFixed(2), color: bp.color },
                        { label: "IQR Bounds", value: `[${bp.q1.toFixed(2)}, ${bp.q3.toFixed(2)}]`, color: "#94a3b8" },
                        { label: "Extrema", value: `[${bp.min.toFixed(2)}, ${bp.max.toFixed(2)}]`, color: "#94a3b8" },
                      ],
                    });
                  }}
                  onMouseLeave={hideTooltip}
                >
                  {/* Whiskers Vertical Line */}
                  <line
                    x1={bp.x}
                    y1={yMin}
                    x2={bp.x}
                    y2={yMax}
                    stroke={bp.color}
                    strokeWidth={1.4}
                  />

                  {/* Whisker Caps */}
                  <line
                    x1={bp.x - 6}
                    y1={yMin}
                    x2={bp.x + 6}
                    y2={yMin}
                    stroke={bp.color}
                    strokeWidth={1.4}
                  />
                  <line
                    x1={bp.x - 6}
                    y1={yMax}
                    x2={bp.x + 6}
                    y2={yMax}
                    stroke={bp.color}
                    strokeWidth={1.4}
                  />

                  {/* Box Rectangle */}
                  <rect
                    x={bp.x - boxW / 2}
                    y={yQ3}
                    width={boxW}
                    height={Math.max(4, yQ1 - yQ3)}
                    fill={bp.fillColor}
                    stroke={bp.color}
                    strokeWidth={1.5}
                    rx={2}
                    className="filter drop-shadow-[0_0_6px_rgba(56,189,248,0.2)]"
                  />

                  {/* Median Horizontal Line */}
                  <line
                    x1={bp.x - boxW / 2}
                    y1={yMed}
                    x2={bp.x + boxW / 2}
                    y2={yMed}
                    stroke="#ffffff"
                    strokeWidth={1.8}
                  />

                  {/* Category X Labels */}
                  <text
                    x={bp.x}
                    y={svgHeight - 12}
                    fill="#cbd5e1"
                    fontSize="8"
                    textAnchor="middle"
                    fontFamily="sans-serif"
                    fontWeight="500"
                  >
                    {bp.label}
                  </text>
                  {bp.subLabel && (
                    <text
                      x={bp.x}
                      y={svgHeight - 3}
                      fill="#64748b"
                      fontSize="7"
                      textAnchor="middle"
                      fontFamily="sans-serif"
                    >
                      {bp.subLabel}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Right: Robustness Summary Card */}
        <div className="col-span-4 bg-[#050e20]/60 border border-slate-800/70 rounded-xl p-2.5 flex flex-col justify-between h-full text-[9.5px]">
          <div>
            <div className="text-[10px] font-bold text-white mb-1.5 border-b border-slate-800/60 pb-1 flex items-center justify-between">
              <span>Robustness Summary</span>
              <span className="font-mono text-[8.5px] text-cyan-400 uppercase">{selectedRegime}</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Top-3 Recovery</span>
                <span className="font-mono text-cyan-400 font-bold">
                  {(metrics.top3Recovery * 100).toFixed(0)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Precision (Pool)</span>
                <span className="font-mono text-cyan-300 font-bold">
                  {(metrics.precision * 100).toFixed(0)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Causal / Null</span>
                <span className="font-mono text-pink-400 font-bold">
                  {metrics.causalVsNullRatio.toFixed(2)}×
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Exact Recovery</span>
                <span className="font-mono text-purple-300 font-bold">
                  {(metrics.exactInteractionRecovery * 100).toFixed(0)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Evaluated Worlds</span>
                <span className="font-mono text-slate-200">24 seeds</span>
              </div>
            </div>
          </div>

          <p className="text-[8.5px] text-slate-400 leading-tight pt-1.5 border-t border-slate-800/50">
            Attribution engine maintains 100% Top-3 recovery across all unseen recombinant regimes.
          </p>
        </div>
      </div>
    </div>
  );
};
