"use client";

import React from "react";
import { useCounterfactual } from "../interactions/CounterfactualInteractionContext";

export const InteractionNetworkPanel: React.FC = () => {
  const { selectedCandidate, activeWorkflowStep, showTooltip, hideTooltip } = useCounterfactual();

  const links = selectedCandidate.networkLinks;

  // Optimized node coordinates for centered viewBox
  const nodeCoords: { [key: string]: { x: number; y: number; label: string; color: string } } = {
    A: { x: 45, y: 65, label: "Gene A", color: "#38bdf8" },
    B: { x: 125, y: 35, label: "Gene B", color: "#f472b6" },
    D: { x: 200, y: 70, label: "Gene D", color: "#94a3b8" },
    E1: { x: 60, y: 125, label: "Gene E", color: "#38bdf8" },
    E2: { x: 175, y: 130, label: "Gene E", color: "#38bdf8" },
  };

  return (
    <div className="h-full bg-[#040817]/90 backdrop-blur-md border border-slate-800/80 rounded-2xl p-2.5 flex flex-col justify-between shadow-[0_4px_24px_rgba(0,0,0,0.5)] select-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-0.5">
        <div className="flex items-center gap-1.5">
          <h3 className="text-xs font-bold text-white font-sans tracking-wide">
            {activeWorkflowStep === 1 ? "Interaction Network (Original)" : "Interaction Network (Before vs After)"}
          </h3>
          {activeWorkflowStep === 1 && (
            <span className="text-[8px] font-mono px-1.5 py-0.2 bg-pink-500/20 text-pink-300 border border-pink-500/30 rounded">
              Original Offspring
            </span>
          )}
        </div>
        <button
          className="w-4 h-4 rounded-full bg-slate-800/60 border border-slate-700/60 flex items-center justify-center text-[10px] text-slate-400 hover:text-cyan-300 hover:border-cyan-500/50 transition-colors"
          title="Network view"
        >
          &gt;
        </button>
      </div>

      {/* Network Graph & Legend Grid */}
      <div className="grid grid-cols-12 gap-1.5 flex-1 items-center min-h-0">
        {/* Left: SVG Network Graph */}
        <div className="col-span-7 h-full flex items-center justify-center relative">
          <svg
            className="w-full h-full max-h-[110px]"
            viewBox="0 0 240 160"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Links */}
            {links.map((link, idx) => {
              const src = nodeCoords[link.source] || { x: 50, y: 50 };
              const tgt = nodeCoords[link.target] || { x: 100, y: 100 };

              let stroke = "#ec4899";
              let strokeDasharray = undefined;
              let opacity = 0.9;
              let strokeWidth = 2;

              if (activeWorkflowStep >= 2) {
                if (link.type === "modified") {
                  stroke = "#38bdf8";
                  strokeWidth = 2.2;
                } else if (link.type === "reduced") {
                  stroke = "#38bdf8";
                  strokeDasharray = "4,3";
                  opacity = 0.65;
                } else if (link.type === "removed") {
                  stroke = "#64748b";
                  strokeDasharray = "2,3";
                  opacity = 0.45;
                }
              }

              return (
                <line
                  key={idx}
                  x1={src.x}
                  y1={src.y}
                  x2={tgt.x}
                  y2={tgt.y}
                  stroke={stroke}
                  strokeWidth={strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeOpacity={opacity}
                />
              );
            })}

            {/* Nodes */}
            {Object.entries(nodeCoords).map(([key, node]) => (
              <g
                key={key}
                className="cursor-pointer group"
                onMouseEnter={(e) => {
                  showTooltip({
                    x: e.clientX,
                    y: e.clientY,
                    title: node.label,
                    subtitle: `Regulatory interaction locus ${key}`,
                    badge: "NETWORK NODE",
                    badgeColor: "bg-cyan-950/70 text-cyan-300 border-cyan-500/40",
                    details: [
                      { label: "Connectivity", value: "Epistatic modifier", color: node.color },
                      { label: "Target intervention", value: selectedCandidate.target, color: "#f6c85f" },
                    ],
                  });
                }}
                onMouseLeave={hideTooltip}
              >
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={8.5}
                  fill="#030712"
                  stroke={node.color}
                  strokeWidth={1.8}
                  className="filter drop-shadow-[0_0_6px_rgba(56,189,248,0.5)] transition-transform group-hover:scale-110"
                />
                <circle cx={node.x} cy={node.y} r={3.5} fill={node.color} />
                <text
                  x={node.x + 11}
                  y={node.y + 3}
                  fill="#cbd5e1"
                  fontSize="8.5"
                  fontFamily="sans-serif"
                  fontWeight="500"
                >
                  {node.label}
                </text>
              </g>
            ))}
          </svg>
        </div>

        {/* Right: Legend */}
        <div className="col-span-5 flex flex-col justify-center space-y-1 pl-1 border-l border-slate-800/60 text-[8.5px]">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-0.5 bg-pink-500 rounded flex-shrink-0" />
            <span className="text-slate-300 truncate">Original interaction</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-0.5 bg-cyan-400 rounded flex-shrink-0" />
            <span className="text-slate-300 truncate">Modified interaction</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-0 border-b border-dashed border-cyan-400 flex-shrink-0" />
            <span className="text-slate-300 truncate">Reduced strength</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-0 border-b border-dotted border-slate-400 flex-shrink-0" />
            <span className="text-slate-300 truncate">Removed interaction</span>
          </div>
        </div>
      </div>
    </div>
  );
};
