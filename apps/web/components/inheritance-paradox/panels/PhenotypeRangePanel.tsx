"use client";

import React, { useMemo } from "react";
import { useParadoxInteraction } from "../interactions/ParadoxInteractionContext";

export const PhenotypeRangePanel: React.FC = () => {
  const {
    hoveredDataCluster,
    setHoveredDataCluster,
    setTooltip,
    isParentAActive,
    isParentBActive,
    isOffspringActive,
    selectOrToggleElement,
  } = useParadoxInteraction();

  // SVG coordinate system: viewBox 0 0 420 180
  // X range: -3 to +3 maps to x: 70 to 400 (width = 330, step = 55 per unit)
  // 0 is at x = 70 + 3 * 55 = 235
  const toX = (val: number) => 235 + val * 55;

  // Scatter dots for Parent A (mean ~ -0.4)
  const dotsA = useMemo(() => [
    { x: -1.4, y: 34 }, { x: -1.1, y: 37 }, { x: -0.8, y: 31 }, { x: -0.6, y: 40 },
    { x: -0.4, y: 35 }, { x: -0.2, y: 38 }, { x: 0.1, y: 33 }, { x: 0.4, y: 36 }
  ], []);

  // Scatter dots for Parent B (mean ~ -0.3)
  const dotsB = useMemo(() => [
    { x: -1.2, y: 78 }, { x: -0.9, y: 82 }, { x: -0.6, y: 76 }, { x: -0.3, y: 85 },
    { x: -0.1, y: 79 }, { x: 0.2, y: 83 }, { x: 0.5, y: 77 }, { x: 0.8, y: 80 }
  ], []);

  const anyActive = isParentAActive || isParentBActive || isOffspringActive;

  return (
    <div className="w-full bg-[#070d1d]/85 backdrop-blur-md border border-slate-800/80 rounded-xl p-3.5 shadow-[0_8px_32px_rgba(0,0,0,0.6)] relative group hover:border-slate-700/80 transition-all duration-300">
      {/* Panel Header */}
      <div className="flex items-center justify-between mb-2 border-b border-slate-800/50 pb-2">
        <h2 className="text-[13px] font-semibold text-slate-100 tracking-wide font-sans">
          Parental vs Offspring Phenotype Range
        </h2>
        <button
          aria-label="Panel details"
          className="w-5 h-5 rounded-full bg-slate-800/60 border border-slate-700/50 flex items-center justify-center text-slate-400 hover:text-cyan-300 hover:border-cyan-500/50 transition-colors"
        >
          <span className="text-xs leading-none">›</span>
        </button>
      </div>

      {/* Interactive Range Visualization */}
      <div className="relative w-full h-[165px]">
        <svg
          viewBox="0 0 420 170"
          className="w-full h-full overflow-visible select-none"
        >
          <defs>
            {/* Gradient for Parent A density */}
            <linearGradient id="gradParentA" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0284c7" stopOpacity="0.1" />
              <stop offset="40%" stopColor="#38bdf8" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.1" />
            </linearGradient>

            {/* Gradient for Parent B density */}
            <linearGradient id="gradParentB" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#9d174d" stopOpacity="0.1" />
              <stop offset="45%" stopColor="#ec4899" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#9d174d" stopOpacity="0.1" />
            </linearGradient>

            {/* Gradient for Offspring distribution */}
            <linearGradient id="gradOffspring" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.1" />
              <stop offset="60%" stopColor="#fbbf24" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#fde047" stopOpacity="0.9" />
            </linearGradient>

            {/* Glowing filter */}
            <filter id="glowGold" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Grid lines vertical */}
          {[-3, -2, -1, 0, 1, 2, 3].map((val) => {
            const x = toX(val);
            return (
              <g key={val}>
                <line
                  x1={x}
                  y1={14}
                  x2={x}
                  y2={130}
                  stroke="#1e293b"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                />
                <text
                  x={x}
                  y={145}
                  textAnchor="middle"
                  className="text-[9.5px] fill-slate-400 font-mono"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* X Axis Bottom Baseline */}
          <line
            x1={70}
            y1={132}
            x2={400}
            y2={132}
            stroke="#334155"
            strokeWidth="1"
          />

          {/* X Axis Title */}
          <text
            x={235}
            y={162}
            textAnchor="middle"
            className="text-[9.5px] fill-slate-400 font-medium tracking-wide"
          >
            Trait Value (normalized)
          </text>

          {/* Row 1: Parent A */}
          <g
            className="cursor-pointer transition-opacity duration-200"
            style={{
              opacity: anyActive ? (isParentAActive ? 1 : 0.35) : 1,
            }}
            onClick={() => selectOrToggleElement("parent_a")}
            onMouseEnter={(e) => {
              setHoveredDataCluster("parent_a");
              setTooltip({
                visible: true,
                x: e.clientX,
                y: e.clientY,
                title: "Parent A Phenotypic Density",
                subtitle: "Normalized trait distribution [-1.8, +0.7]",
                badge: "MATERNAL ENVELOPE",
                badgeColor: "bg-sky-500/20 text-sky-300 border-sky-500/40",
                details: [
                  { label: "Mean (μ)", value: "-0.45 σ", color: "#38bdf8" },
                  { label: "Variance (σ²)", value: "0.42", color: "#94a3b8" },
                  { label: "Range Max", value: "+0.68 σ", color: "#e2e8f0" },
                ],
              });
            }}
            onMouseLeave={() => {
              setHoveredDataCluster(null);
              setTooltip(null);
            }}
          >
            <text
              x={12}
              y={36}
              className={`text-[10.5px] font-medium tracking-tight transition-colors ${
                isParentAActive ? "fill-cyan-300 font-bold" : "fill-slate-300"
              }`}
            >
              Parent A
            </text>
            <line
              x1={70}
              y1={33}
              x2={400}
              y2={33}
              stroke={isParentAActive ? "#0284c7" : "#1e293b"}
              strokeWidth={isParentAActive ? 1.5 : 1}
            />
            {/* Symmetrical Violin Shape */}
            <path
              d={`
                M ${toX(-1.8)} 33
                C ${toX(-1.2)} 18, ${toX(-0.5)} 14, ${toX(-0.3)} 16
                C ${toX(0.1)} 18, ${toX(0.5)} 27, ${toX(0.7)} 33
                C ${toX(0.5)} 39, ${toX(0.1)} 48, ${toX(-0.3)} 50
                C ${toX(-0.5)} 52, ${toX(-1.2)} 48, ${toX(-1.8)} 33
                Z
              `}
              fill="url(#gradParentA)"
              stroke="#38bdf8"
              strokeWidth={isParentAActive ? 2 : 1.2}
            />
            {/* Scatter Dots */}
            {dotsA.map((d, i) => (
              <circle
                key={i}
                cx={toX(d.x)}
                cy={d.y - 2}
                r={isParentAActive ? 2.2 : 1.7}
                fill={isParentAActive ? "#38bdf8" : "#e0f2fe"}
                opacity={0.9}
              />
            ))}
          </g>

          {/* Row 2: Parent B */}
          <g
            className="cursor-pointer transition-opacity duration-200"
            style={{
              opacity: anyActive ? (isParentBActive ? 1 : 0.35) : 1,
            }}
            onClick={() => selectOrToggleElement("parent_b")}
            onMouseEnter={(e) => {
              setHoveredDataCluster("parent_b");
              setTooltip({
                visible: true,
                x: e.clientX,
                y: e.clientY,
                title: "Parent B Phenotypic Density",
                subtitle: "Normalized trait distribution [-1.5, +0.9]",
                badge: "PATERNAL ENVELOPE",
                badgeColor: "bg-pink-500/20 text-pink-300 border-pink-500/40",
                details: [
                  { label: "Mean (μ)", value: "-0.28 σ", color: "#ec4899" },
                  { label: "Variance (σ²)", value: "0.48", color: "#94a3b8" },
                  { label: "Range Max", value: "+0.88 σ", color: "#e2e8f0" },
                ],
              });
            }}
            onMouseLeave={() => {
              setHoveredDataCluster(null);
              setTooltip(null);
            }}
          >
            <text
              x={12}
              y={76}
              className={`text-[10.5px] font-medium tracking-tight transition-colors ${
                isParentBActive ? "fill-pink-300 font-bold" : "fill-slate-300"
              }`}
            >
              Parent B
            </text>
            <line
              x1={70}
              y1={73}
              x2={400}
              y2={73}
              stroke={isParentBActive ? "#be185d" : "#1e293b"}
              strokeWidth={isParentBActive ? 1.5 : 1}
            />
            {/* Symmetrical Violin Shape */}
            <path
              d={`
                M ${toX(-1.5)} 73
                C ${toX(-1.0)} 58, ${toX(-0.4)} 54, ${toX(-0.1)} 56
                C ${toX(0.3)} 58, ${toX(0.7)} 67, ${toX(0.9)} 73
                C ${toX(0.7)} 79, ${toX(0.3)} 88, ${toX(-0.1)} 90
                C ${toX(-0.4)} 92, ${toX(-1.0)} 88, ${toX(-1.5)} 73
                Z
              `}
              fill="url(#gradParentB)"
              stroke="#f472b6"
              strokeWidth={isParentBActive ? 2 : 1.2}
            />
            {/* Scatter Dots */}
            {dotsB.map((d, i) => (
              <circle
                key={i}
                cx={toX(d.x)}
                cy={d.y - 5}
                r={isParentBActive ? 2.2 : 1.7}
                fill={isParentBActive ? "#f472b6" : "#fdf2f8"}
                opacity={0.9}
              />
            ))}
          </g>

          {/* Row 3: Offspring */}
          <g
            className="cursor-pointer transition-opacity duration-200"
            style={{
              opacity: anyActive ? (isOffspringActive ? 1 : 0.35) : 1,
            }}
            onClick={() => selectOrToggleElement("offspring")}
            onMouseEnter={(e) => {
              setHoveredDataCluster("offspring");
              setTooltip({
                visible: true,
                x: e.clientX,
                y: e.clientY,
                title: "Offspring Transgressive Outlier",
                subtitle: "Offspring phenotype situated outside parental limits",
                badge: "TRANSGRESSIVE OUTLIER",
                badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/40",
                details: [
                  { label: "Observed Value", value: "+1.65 σ", color: "#fbbf24" },
                  { label: "Parental Max", value: "+0.88 σ (Parent B)", color: "#ec4899" },
                  { label: "Surplus (Delta)", value: "+0.77 σ above range", color: "#38bdf8" },
                ],
              });
            }}
            onMouseLeave={() => {
              setHoveredDataCluster(null);
              setTooltip(null);
            }}
          >
            <text
              x={12}
              y={116}
              className={`text-[10.5px] font-medium tracking-tight transition-colors ${
                isOffspringActive ? "fill-amber-300 font-bold" : "fill-slate-300"
              }`}
            >
              Offspring
            </text>
            <line
              x1={70}
              y1={113}
              x2={400}
              y2={113}
              stroke={isOffspringActive ? "#d97706" : "#1e293b"}
              strokeWidth={isOffspringActive ? 1.5 : 1}
            />

            {/* Asymmetrical ridge curve extending to the right */}
            <path
              d={`
                M ${toX(-0.5)} 113
                C ${toX(0.0)} 113, ${toX(0.4)} 110, ${toX(0.8)} 108
                C ${toX(1.1)} 105, ${toX(1.4)} 104, ${toX(1.65)} 113
                C ${toX(1.4)} 117, ${toX(1.1)} 118, ${toX(0.8)} 116
                C ${toX(0.4)} 115, ${toX(0.0)} 113, ${toX(-0.5)} 113
                Z
              `}
              fill="url(#gradOffspring)"
              stroke="#fbbf24"
              strokeWidth={isOffspringActive ? 2.2 : 1.2}
            />

            {/* Luminous beacon dot at outlier position ~ +1.65 sigma */}
            <circle
              cx={toX(1.65)}
              cy={113}
              r={isOffspringActive ? 12 : 9}
              fill="#fbbf24"
              opacity={isOffspringActive ? 0.45 : 0.3}
              className="animate-ping"
              style={{ transformOrigin: `${toX(1.65)}px 113px` }}
            />
            <circle
              cx={toX(1.65)}
              cy={113}
              r={isOffspringActive ? 6.5 : 5.5}
              fill="#fef08a"
              stroke="#fbbf24"
              strokeWidth={isOffspringActive ? 2.5 : 2}
              filter="url(#glowGold)"
            />
          </g>
        </svg>

        {/* Pinned Callout Box matching the reference image */}
        <div
          className={`absolute right-1 top-[52px] bg-[#0c142b]/95 border rounded-lg py-1.5 px-2.5 transition-all duration-300 pointer-events-none flex items-center gap-2 ${
            isOffspringActive
              ? "border-amber-400 shadow-[0_0_24px_rgba(251,191,36,0.6)] ring-1 ring-amber-400/60"
              : "border-amber-500/50 shadow-[0_4px_20px_rgba(251,191,36,0.25)]"
          }`}
        >
          <div className={`w-2 h-2 rounded-full bg-amber-400 ${isOffspringActive ? "shadow-[0_0_12px_#fbbf24] animate-pulse" : "shadow-[0_0_8px_#fbbf24]"}`} />
          <div className="text-[10px] leading-tight text-slate-200">
            <div>Offspring phenotype</div>
            <div>
              lies outside the{" "}
              <span className="text-amber-300 font-semibold">parental range</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
