"use client";

import React, { useMemo } from "react";
import { useCounterfactual } from "../interactions/CounterfactualInteractionContext";

export const PhenotypeComparisonPanel: React.FC = () => {
  const {
    selectedCandidate,
    selectedTrait,
    setSelectedTrait,
    activeWorkflowStep,
    showTooltip,
    hideTooltip,
  } = useCounterfactual();

  // Generate Gaussian curve path points
  // x-domain: [-3.2, 3.2], mapped to SVG [35, 340]
  // y-domain: [0, 7], mapped to SVG [120, 15]
  const svgWidth = 350;
  const svgHeight = 135;
  const margin = { top: 15, right: 15, bottom: 25, left: 32 };

  const innerWidth = svgWidth - margin.left - margin.right;
  const innerHeight = svgHeight - margin.top - margin.bottom;

  const xScale = (val: number) => {
    return margin.left + ((val + 3.2) / 6.4) * innerWidth;
  };

  const yScale = (val: number) => {
    return margin.top + innerHeight - (val / 7.0) * innerHeight;
  };

  const generateGaussianPath = (mean: number, std: number, amplitude: number) => {
    const points: [string, string][] = [];
    const steps = 60;
    for (let i = 0; i <= steps; i++) {
      const xVal = -3.2 + (i / steps) * 6.4;
      const exponent = -0.5 * Math.pow((xVal - mean) / std, 2);
      const yVal = amplitude * Math.exp(exponent);
      points.push([xScale(xVal).toFixed(2), yScale(yVal).toFixed(2)]);
    }
    return points.reduce((acc, pt, idx) => {
      return idx === 0 ? `M ${pt[0]},${pt[1]}` : `${acc} L ${pt[0]},${pt[1]}`;
    }, "");
  };

  const parentAPath = useMemo(() => generateGaussianPath(-1.3, 0.7, 4.8), []);
  const parentBPath = useMemo(() => generateGaussianPath(0.1, 0.65, 5.8), []);
  const originalPath = useMemo(() => generateGaussianPath(2.1, 0.6, 4.6), []);
  const modifiedPath = useMemo(
    () => generateGaussianPath(selectedCandidate.newPhenotype, 0.6, 5.2),
    [selectedCandidate.newPhenotype]
  );

  return (
    <div className="h-full bg-[#040817]/90 backdrop-blur-md border border-slate-800/80 rounded-2xl p-2.5 flex flex-col justify-between shadow-[0_4px_24px_rgba(0,0,0,0.5)] select-none">
      {/* Header with Selector */}
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-xs font-bold text-white font-sans tracking-wide">
          Phenotype Comparison
        </h3>
        <select
          value={selectedTrait}
          onChange={(e) => setSelectedTrait(e.target.value)}
          className="bg-slate-900/80 border border-slate-700/80 rounded-lg px-2 py-0.5 text-[9.5px] font-mono text-cyan-300 outline-none cursor-pointer hover:border-cyan-500/50 transition-colors"
        >
          <option value="Trait Value">Trait Value ⌵</option>
          <option value="Metabolic Efficiency">Metabolic Efficiency</option>
          <option value="Growth Velocity">Growth Velocity</option>
        </select>
      </div>

      {/* Legend Row */}
      <div className="flex items-center justify-between px-2 text-[9px] text-slate-400 mb-0.5">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          <span>Parent A</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-pink-500" />
          <span>Parent B</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#f6c85f]" />
          <span>Original</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>Modified</span>
        </div>
      </div>

      {/* SVG Chart */}
      <div className="relative flex-1 w-full min-h-0 flex items-center justify-center">
        <svg
          className="w-full h-full max-h-[145px]"
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Parental Envelope Background Shading */}
          <rect
            x={xScale(-2.0)}
            y={margin.top}
            width={xScale(0.8) - xScale(-2.0)}
            height={innerHeight}
            fill="#38bdf8"
            fillOpacity={0.06}
            stroke="#38bdf8"
            strokeOpacity={0.15}
            strokeDasharray="2,2"
          />

          {/* Grid lines & Axes */}
          <line
            x1={margin.left}
            y1={yScale(0)}
            x2={svgWidth - margin.right}
            y2={yScale(0)}
            stroke="#334155"
            strokeWidth={1}
          />
          <line
            x1={margin.left}
            y1={margin.top}
            x2={margin.left}
            y2={yScale(0)}
            stroke="#334155"
            strokeWidth={1}
          />

          {/* Y Axis Ticks */}
          {[0, 3, 6].map((tick) => (
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
                x={margin.left - 6}
                y={yScale(tick) + 3}
                fill="#64748b"
                fontSize="8"
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
                x1={xScale(tick)}
                y1={yScale(0)}
                x2={xScale(tick)}
                y2={yScale(0) + 3}
                stroke="#64748b"
                strokeWidth={1}
              />
              <text
                x={xScale(tick)}
                y={yScale(0) + 12}
                fill="#64748b"
                fontSize="8"
                textAnchor="middle"
                fontFamily="monospace"
              >
                {tick}
              </text>
            </g>
          ))}

          {/* Axis Labels */}
          <text
            x={10}
            y={margin.top + innerHeight / 2}
            fill="#64748b"
            fontSize="7.5"
            textAnchor="middle"
            transform={`rotate(-90 10 ${margin.top + innerHeight / 2})`}
            fontFamily="sans-serif"
          >
            Probability Density
          </text>
          <text
            x={margin.left + innerWidth / 2}
            y={svgHeight - 2}
            fill="#64748b"
            fontSize="7.5"
            textAnchor="middle"
            fontFamily="sans-serif"
          >
            Trait Value (normalized)
          </text>

          {/* Density Curves */}
          {/* Parent A (Cyan) */}
          <path
            d={parentAPath}
            fill="none"
            stroke="#0ea5e9"
            strokeWidth={1.8}
            strokeOpacity={0.8}
          />
          {/* Parent B (Magenta) */}
          <path
            d={parentBPath}
            fill="none"
            stroke="#ec4899"
            strokeWidth={1.8}
            strokeOpacity={0.8}
          />
          {/* Original (Gold) */}
          <path
            d={originalPath}
            fill="none"
            stroke="#f6c85f"
            strokeWidth={2.2}
          />
          {/* Modified (Emerald/Cyan) - Dimmed in Step 1, animated in Step 2+ */}
          {activeWorkflowStep >= 2 ? (
            <>
              {/* Trajectory arc from original to modified */}
              <path
                d={`M ${xScale(2.1)} ${yScale(4.6)} C ${xScale(2.1)} ${yScale(6.2)}, ${xScale(selectedCandidate.newPhenotype)} ${yScale(6.2)}, ${xScale(selectedCandidate.newPhenotype)} ${yScale(5.2)}`}
                fill="none"
                stroke="#34d399"
                strokeWidth={1.5}
                strokeDasharray="3,3"
                opacity={0.85}
              />
              <path
                d={modifiedPath}
                fill="none"
                stroke="#10b981"
                strokeWidth={2.4}
                className="filter drop-shadow-[0_0_6px_rgba(16,185,129,0.6)]"
              />
            </>
          ) : (
            <path
              d={modifiedPath}
              fill="none"
              stroke="#64748b"
              strokeWidth={1.2}
              strokeDasharray="2,2"
              opacity={0.2}
            />
          )}

          {/* Callout Pointer Dots */}
          <circle
            cx={xScale(2.1)}
            cy={yScale(4.6)}
            r={3.5}
            fill="#f6c85f"
            className="cursor-pointer"
            onMouseEnter={(e) => {
              showTooltip({
                x: e.clientX,
                y: e.clientY,
                title: "Original Observed Trait",
                subtitle: "Exceeds parental envelope (+2.1 normalized)",
                badge: "ORIGINAL PHENOTYPE",
                badgeColor: "bg-amber-950/70 text-amber-300 border-amber-500/40",
                details: [
                  { label: "Phenotype value", value: "+2.1", color: "#f6c85f" },
                  { label: "Parental range", value: "[-2.0, +0.8]", color: "#94a3b8" },
                  { label: "Envelope deviation", value: "+1.3 excess", color: "#f472b6" },
                ],
              });
            }}
            onMouseLeave={hideTooltip}
          />
          {activeWorkflowStep >= 2 && (
            <circle
              cx={xScale(selectedCandidate.newPhenotype)}
              cy={yScale(5.2)}
              r={3.5}
              fill="#10b981"
              className="cursor-pointer animate-pulse"
              onMouseEnter={(e) => {
                showTooltip({
                  x: e.clientX,
                  y: e.clientY,
                  title: "Counterfactual Trait",
                  subtitle: selectedCandidate.status === "Rescue" ? "Restored to parental envelope" : "Partial phenotype attenuation",
                  badge: "RESCUED PHENOTYPE",
                  badgeColor: "bg-emerald-950/70 text-emerald-300 border-emerald-500/40",
                  details: [
                    { label: "Rescued value", value: `${selectedCandidate.newPhenotype > 0 ? "+" : ""}${selectedCandidate.newPhenotype.toFixed(1)}`, color: "#10b981" },
                    { label: "Envelope status", value: selectedCandidate.status === "Rescue" ? "Within bounds [-2.0, +0.8]" : "Outside bounds (+0.9)", color: "#38bdf8" },
                    { label: "Shift magnitude", value: `${selectedCandidate.predictedDelta.toFixed(1)}`, color: "#38bdf8" },
                    { label: "Novelty removed", value: selectedCandidate.noveltyRemoved ? "True" : "False", color: "#f6c85f" },
                  ],
                });
              }}
              onMouseLeave={hideTooltip}
            />
          )}
        </svg>

        {/* Floating Callout Boxes Overlay matching reference image */}
        {/* Left callout */}
        <div className={`absolute left-[18%] top-[4%] pointer-events-none bg-[#030914]/90 border ${activeWorkflowStep === 1 ? "border-slate-700/60" : "border-emerald-500/50"} rounded-lg px-2 py-1 shadow-lg max-w-[140px] text-left transition-opacity duration-300`}>
          <p className={`text-[8px] leading-tight ${activeWorkflowStep === 1 ? "text-slate-400" : "text-emerald-300"}`}>
            {activeWorkflowStep === 1
              ? "Simulate intervention in Step 2 to evaluate phenotype change"
              : selectedCandidate.status === "Rescue"
              ? "Modified configuration restores phenotype to parental range"
              : "Partial shift: phenotype shifts toward parental range (+0.9)"}
          </p>
        </div>

        {/* Right callout: Original produces phenotype beyond range */}
        <div className="absolute right-[5%] top-[8%] pointer-events-none bg-[#030914]/90 border border-amber-500/50 rounded-lg px-2 py-1 shadow-lg max-w-[130px] text-left">
          <p className="text-[8px] text-amber-300 leading-tight">
            Original configuration produces phenotype beyond parental range (+2.1)
          </p>
        </div>
      </div>
    </div>
  );
};
