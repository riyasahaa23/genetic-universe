"use client";

import React, { useMemo } from "react";
import { useValidation } from "../ValidationInteractionContext";

export const ResidualAnalysisPanel: React.FC = () => {
  const { activeStage, showTooltip, hideTooltip } = useValidation();

  const svgWidth = 260;
  const svgHeight = 110;
  const margin = { top: 10, right: 10, bottom: 22, left: 28 };
  const innerWidth = svgWidth - margin.left - margin.right;
  const innerHeight = svgHeight - margin.top - margin.bottom;

  const xScale = (val: number) => {
    return margin.left + ((val + 3) / 6) * innerWidth;
  };

  const yScale = (res: number) => {
    return margin.top + innerHeight - ((res + 3) / 6) * innerHeight;
  };

  // Generate 120 deterministic candidate error scatter points
  const points = useMemo(() => {
    const pts = [];
    for (let i = 0; i < 120; i++) {
      const pred = (i / 120) * 5.6 - 2.8;
      // Dispersion clustered around zero
      const res = (Math.sin(i * 9.1) * 0.45 + Math.cos(i * 14.3) * 0.35) * (0.8 + Math.abs(pred) * 0.15);

      let color = "#38bdf8"; // Validated Causal
      if (i % 3 === 1) color = "#ec4899"; // Rescue Equivalent
      if (i % 6 === 2) color = "#f6c85f"; // Distractor Null

      pts.push({ pred, res, color });
    }
    return pts;
  }, []);

  const isStage4 = activeStage === 4;

  return (
    <div
      className={`h-full bg-[#040817]/90 backdrop-blur-md border rounded-2xl p-2.5 flex flex-col justify-between select-none transition-all duration-300 ${
        isStage4
          ? "border-pink-500/60 shadow-[0_0_24px_rgba(244,114,182,0.2)] ring-1 ring-pink-500/30"
          : "border-slate-800/80 shadow-[0_4px_24px_rgba(0,0,0,0.5)]"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-0.5">
        <h3 className="text-xs font-bold text-white font-sans tracking-wide">
          Candidate Error / Failure Analysis
        </h3>
        {isStage4 && (
          <span className="text-[8px] font-mono text-pink-300 bg-pink-950/70 border border-pink-500/40 px-1.5 py-0.2 rounded">
            FAILURE MODES
          </span>
        )}
      </div>

      {/* Main Content: SVG Scatter Plot + Right Callout */}
      <div className="grid grid-cols-12 gap-2 flex-1 items-center min-h-0">
        {/* Left: SVG Residual / Error Plot */}
        <div className="col-span-8 h-full flex items-center justify-center relative">
          <svg
            className="w-full h-full max-h-[105px]"
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Zero Error Reference Line */}
            <line
              x1={margin.left}
              y1={Number(yScale(0).toFixed(2))}
              x2={svgWidth - margin.right}
              y2={Number(yScale(0).toFixed(2))}
              stroke="#38bdf8"
              strokeWidth={0.8}
              strokeDasharray="2,2"
              opacity={0.8}
            />

            {/* Y Axis Line */}
            <line
              x1={margin.left}
              y1={margin.top}
              x2={margin.left}
              y2={Number(yScale(-3).toFixed(2))}
              stroke="#334155"
              strokeWidth={1}
            />

            {/* Y Axis Ticks */}
            {[-3, 0, 3].map((tick) => (
              <g key={tick}>
                <line
                  x1={margin.left - 3}
                  y1={Number(yScale(tick).toFixed(2))}
                  x2={margin.left}
                  y2={Number(yScale(tick).toFixed(2))}
                  stroke="#64748b"
                  strokeWidth={1}
                />
                <text
                  x={margin.left - 5}
                  y={Number((yScale(tick) + 2.5).toFixed(2))}
                  fill="#64748b"
                  fontSize="7"
                  textAnchor="end"
                  fontFamily="monospace"
                >
                  {tick}
                </text>
              </g>
            ))}

            {/* X Axis Ticks */}
            {[-3, -2, -1, 0, 1, 2, 3].map((tick) => (
              <g key={tick}>
                <line
                  x1={Number(xScale(tick).toFixed(2))}
                  y1={Number(yScale(-3).toFixed(2))}
                  x2={Number(xScale(tick).toFixed(2))}
                  y2={Number((yScale(-3) + 2.5).toFixed(2))}
                  stroke="#64748b"
                  strokeWidth={1}
                />
                <text
                  x={Number(xScale(tick).toFixed(2))}
                  y={Number((yScale(-3) + 9).toFixed(2))}
                  fill="#64748b"
                  fontSize="7"
                  textAnchor="middle"
                  fontFamily="monospace"
                >
                  {tick}
                </text>
              </g>
            ))}

            {/* Labels */}
            <text
              x={9}
              y={Number((margin.top + innerHeight / 2).toFixed(2))}
              fill="#64748b"
              fontSize="7"
              textAnchor="middle"
              transform={`rotate(-90 9 ${Number((margin.top + innerHeight / 2).toFixed(2))})`}
              fontFamily="sans-serif"
            >
              Residuals
            </text>
            <text
              x={Number((margin.left + innerWidth / 2).toFixed(2))}
              y={svgHeight - 1}
              fill="#64748b"
              fontSize="7"
              textAnchor="middle"
              fontFamily="sans-serif"
            >
              Predicted Delta
            </text>

            {/* Scatter Points */}
            {points.map((pt, idx) => (
              <circle
                key={idx}
                cx={Number(xScale(pt.pred).toFixed(2))}
                cy={Number(yScale(pt.res).toFixed(2))}
                r={1.8}
                fill={pt.color}
                opacity={0.8}
              />
            ))}
          </svg>
        </div>

        {/* Right: Candidate Error Breakdown & Callout */}
        <div className="col-span-4 flex flex-col justify-between h-full py-0.5 text-[8.5px]">
          {/* Failure metrics */}
          <div className="space-y-0.5 text-slate-300">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">False Positives</span>
              <span className="font-mono text-amber-400 font-bold">4</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Exact Misses</span>
              <span className="font-mono text-pink-400 font-bold">2</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Rescue-Equiv Alts</span>
              <span className="font-mono text-cyan-400 font-bold">18</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Redundancy</span>
              <span className="font-mono text-slate-300">1.4×</span>
            </div>
          </div>

          {/* Callout Box */}
          <div className="bg-[#050e20]/80 border border-slate-800/80 rounded-lg p-1.5 text-[8px] text-slate-300 leading-tight">
            Exact misses still identify functionally equivalent rescue alleles.
          </div>
        </div>
      </div>
    </div>
  );
};
