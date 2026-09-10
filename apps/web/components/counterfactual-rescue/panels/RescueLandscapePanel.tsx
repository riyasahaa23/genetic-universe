"use client";

import React, { useMemo } from "react";
import { useCounterfactual } from "../interactions/CounterfactualInteractionContext";

export const RescueLandscapePanel: React.FC = () => {
  const { selectedCandidate, activeWorkflowStep, showTooltip, hideTooltip } = useCounterfactual();

  const isStep4Active = activeWorkflowStep === 4;

  const svgWidth = 330;
  const svgHeight = 135;
  const margin = { top: 12, right: 55, bottom: 26, left: 32 };

  const innerWidth = svgWidth - margin.left - margin.right;
  const innerHeight = svgHeight - margin.top - margin.bottom;

  const xScale = (mb: number) => {
    return margin.left + (mb / 200) * innerWidth;
  };

  const yScale = (delta: number) => {
    return margin.top + innerHeight - ((delta + 2.5) / 5.0) * innerHeight;
  };

  // High density scatter points simulating evaluated in-silico landscape
  const points = useMemo(() => {
    const pts = [];
    const seedMb = [
      8, 16, 24, 32, 40, 48, 56, 64, 72.4, 80, 88, 96, 104, 112, 120, 128, 136, 144, 152, 160, 168, 176, 184, 192
    ];
    const deltas = [-2.2, -1.8, -1.4, -1.0, -0.6, -0.2, 0.2, 0.6, 1.0, 1.4, 1.8];

    for (let i = 0; i < seedMb.length; i++) {
      for (let j = 0; j < deltas.length; j++) {
        const mb = seedMb[i] + ((j % 3) - 1) * 2.2;
        const delta = deltas[j] + ((i % 4) - 1.5) * 0.12;

        const distFromTarget = Math.sqrt(
          Math.pow(mb - 72.4, 2) + Math.pow((delta - -1.8) * 35, 2)
        );
        const effectScore = Math.max(0, 1 - distFromTarget / 85);

        let color = "#1e1b4b"; // deep indigo
        if (effectScore > 0.75) color = "#facc15"; // bright gold
        else if (effectScore > 0.55) color = "#f97316"; // orange
        else if (effectScore > 0.35) color = "#ec4899"; // pink
        else if (effectScore > 0.2) color = "#6366f1"; // purple
        else color = "#1e293b"; // slate dark

        pts.push({ mb, delta, effectScore, color });
      }
    }
    return pts;
  }, []);

  return (
    <div
      className={`h-full bg-[#040817]/90 backdrop-blur-md border ${
        isStep4Active ? "border-cyan-500/50 shadow-[0_0_20px_rgba(56,189,248,0.15)]" : "border-slate-800/80"
      } rounded-2xl p-2.5 flex flex-col justify-between shadow-[0_4px_24px_rgba(0,0,0,0.5)] select-none transition-all duration-300`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-0.5">
        <div className="flex items-center gap-1.5">
          <h3 className="text-xs font-bold text-white font-sans tracking-wide">
            Rescue Landscape
          </h3>
          {isStep4Active ? (
            <span className="text-[8px] font-mono px-1.5 py-0.2 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded">
              Active Focus
            </span>
          ) : (
            <span className="text-[8px] font-mono px-1.5 py-0.2 bg-slate-800/80 text-slate-400 border border-slate-700/50 rounded">
              Step 4 Full Scope
            </span>
          )}
        </div>
      </div>

      {/* SVG Scatter Plot + Legend Bar */}
      <div className="relative flex-1 w-full min-h-0 flex items-center justify-center">
        <svg
          className="w-full h-full max-h-[145px]"
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Subtle Grid lines */}
          <line
            x1={margin.left}
            y1={yScale(0)}
            x2={svgWidth - margin.right}
            y2={yScale(0)}
            stroke="#334155"
            strokeWidth={1}
            strokeDasharray="2,2"
          />
          <line
            x1={margin.left}
            y1={margin.top}
            x2={margin.left}
            y2={yScale(-2.5)}
            stroke="#334155"
            strokeWidth={1}
          />
          <line
            x1={margin.left}
            y1={yScale(-2.5)}
            x2={svgWidth - margin.right}
            y2={yScale(-2.5)}
            stroke="#334155"
            strokeWidth={1}
          />

          {/* Y Axis Ticks */}
          {[-2, 0, 2].map((tick) => (
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
          {[0, 50, 100, 150, 200].map((tick) => (
            <g key={tick}>
              <line
                x1={xScale(tick)}
                y1={yScale(-2.5)}
                x2={xScale(tick)}
                y2={yScale(-2.5) + 3}
                stroke="#64748b"
                strokeWidth={1}
              />
              <text
                x={xScale(tick)}
                y={yScale(-2.5) + 12}
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
            Predicted Δ Phenotype
          </text>
          <text
            x={margin.left + innerWidth / 2}
            y={svgHeight - 2}
            fill="#64748b"
            fontSize="7.5"
            textAnchor="middle"
            fontFamily="sans-serif"
          >
            Locus Position (Mb)
          </text>

          {/* Scatter Points */}
          {points.map((pt, idx) => (
            <rect
              key={idx}
              x={xScale(pt.mb) - 1.5}
              y={yScale(pt.delta) - 1.5}
              width={3.2}
              height={3.2}
              rx={0.8}
              fill={pt.color}
              opacity={0.85}
            />
          ))}

          {/* Crosshair guidelines to axes for target locus */}
          <line
            x1={xScale(selectedCandidate.locusMb)}
            y1={yScale(selectedCandidate.predictedDelta)}
            x2={xScale(selectedCandidate.locusMb)}
            y2={yScale(-2.5)}
            stroke="#f6c85f"
            strokeWidth={0.8}
            strokeDasharray="2,2"
            opacity={0.6}
          />
          <line
            x1={margin.left}
            y1={yScale(selectedCandidate.predictedDelta)}
            x2={xScale(selectedCandidate.locusMb)}
            y2={yScale(selectedCandidate.predictedDelta)}
            stroke="#f6c85f"
            strokeWidth={0.8}
            strokeDasharray="2,2"
            opacity={0.6}
          />

          {/* Highlight Target Locus Crosshair and Ring */}
          <g
            className="cursor-pointer"
            onMouseEnter={(e) => {
              showTooltip({
                x: e.clientX,
                y: e.clientY,
                title: `${selectedCandidate.target}: ${selectedCandidate.locusMb} Mb`,
                subtitle: `High sensitivity rescue hotspot (Δ ${selectedCandidate.predictedDelta})`,
                badge: "RESCUE HOTSPOT",
                badgeColor: "bg-amber-950/70 text-amber-300 border-amber-500/40",
                details: [
                  { label: "Position", value: `${selectedCandidate.locusMb} Mb`, color: "#f6c85f" },
                  { label: "Predicted shift", value: `${selectedCandidate.predictedDelta} units`, color: "#38bdf8" },
                  { label: "Rescue potency", value: "Optimal (Top Minimal)", color: "#34d399" },
                ],
              });
            }}
            onMouseLeave={hideTooltip}
          >
            <circle
              cx={xScale(selectedCandidate.locusMb)}
              cy={yScale(selectedCandidate.predictedDelta)}
              r={7.5}
              fill="none"
              stroke="#f6c85f"
              strokeWidth={1.8}
              className="animate-pulse filter drop-shadow-[0_0_6px_#f6c85f]"
            />
            <circle
              cx={xScale(selectedCandidate.locusMb)}
              cy={yScale(selectedCandidate.predictedDelta)}
              r={3}
              fill="#f6c85f"
            />
          </g>

          {/* Vertical Colorbar Legend on Right */}
          <defs>
            <linearGradient id="colorbarGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#facc15" />
              <stop offset="35%" stopColor="#f97316" />
              <stop offset="70%" stopColor="#ec4899" />
              <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>
          </defs>

          <rect
            x={svgWidth - 32}
            y={margin.top + 4}
            width={7}
            height={innerHeight - 8}
            rx={3}
            fill="url(#colorbarGrad)"
            stroke="#475569"
            strokeWidth={0.5}
          />
          <text
            x={svgWidth - 20}
            y={margin.top + 10}
            fill="#94a3b8"
            fontSize="7"
            fontFamily="sans-serif"
          >
            Higher
          </text>
          <text
            x={svgWidth - 20}
            y={margin.top + innerHeight / 2 + 2}
            fill="#94a3b8"
            fontSize="6.5"
            fontFamily="sans-serif"
          >
            Rescue effect
          </text>
          <text
            x={svgWidth - 20}
            y={margin.top + innerHeight - 6}
            fill="#94a3b8"
            fontSize="7"
            fontFamily="sans-serif"
          >
            Lower
          </text>
        </svg>
      </div>
    </div>
  );
};
