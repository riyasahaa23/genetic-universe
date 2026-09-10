"use client";

import React, { useState } from "react";
import { GlassPanel } from "../ui/GlassPanel";
import { useInteraction } from "../context/InteractionContext";

interface Node {
  id: string;
  label: string;
  x: number;
  y: number;
  color: string;
  isRescueCandidate?: boolean;
}

export const MinimalRescuePanel: React.FC = () => {
  const { setHoveredCandidate, setHoveredLocus, setTooltip, setHoveredChromosome } = useInteraction();
  const [activeNode, setActiveNode] = useState<string | null>(null);

  const nodes: Node[] = [
    { id: "X1", label: "Gene X1", x: 68, y: 18, color: "#38bdf8" },
    { id: "Y3", label: "Gene Y3", x: 30, y: 55, color: "#60a5fa" },
    { id: "Z7", label: "Gene Z7", x: 92, y: 58, color: "#fbbf24", isRescueCandidate: true },
    { id: "RZ", label: "Regulatory Z", x: 45, y: 92, color: "#94a3b8" },
    { id: "RZ2", label: "Locus 31", x: 86, y: 106, color: "#38bdf8" },
  ];

  const edges = [
    { from: "X1", to: "Y3" },
    { from: "X1", to: "Z7" },
    { from: "Y3", to: "Z7" },
    { from: "Y3", to: "RZ" },
    { from: "Z7", to: "RZ" },
    { from: "Z7", to: "RZ2" },
    { from: "RZ", to: "RZ2" },
  ];

  const getNode = (id: string) => nodes.find((n) => n.id === id);

  return (
    <GlassPanel
      title="Minimal Rescue Set"
      subtitle="Minimal changes with maximal phenotypic rescue."
      className="w-[260px] lg:w-[285px]"
      isActive={activeNode !== null}
    >
      <div className="flex items-center justify-between py-1">
        {/* Network Graph (SVG) */}
        <div className="relative w-[130px] h-[120px] flex-shrink-0">
          <svg viewBox="0 0 120 120" className="w-full h-full overflow-visible">
            {/* Edges */}
            {edges.map((edge, idx) => {
              const n1 = getNode(edge.from);
              const n2 = getNode(edge.to);
              if (!n1 || !n2) return null;
              const isHighlight =
                (activeNode === edge.from || activeNode === edge.to) ||
                (edge.from === "Z7" || edge.to === "Z7");

              return (
                <line
                  key={idx}
                  x1={n1.x}
                  y1={n1.y}
                  x2={n2.x}
                  y2={n2.y}
                  stroke={isHighlight ? "#fbbf24" : "#334155"}
                  strokeWidth={isHighlight ? 1.5 : 1}
                  strokeOpacity={isHighlight ? 0.9 : 0.45}
                  className="transition-all duration-300"
                />
              );
            })}

            {/* Nodes */}
            {nodes.map((node) => {
              const isHovered = activeNode === node.id;
              return (
                <g
                  key={node.id}
                  className="cursor-pointer group/node"
                  onMouseEnter={(e) => {
                    setActiveNode(node.id);
                    setHoveredCandidate(node.label);
                    if (node.isRescueCandidate) {
                      setHoveredLocus(10);
                      setHoveredChromosome("offspring");
                    }
                    setTooltip({
                      visible: true,
                      x: e.clientX,
                      y: e.clientY,
                      title: `${node.label} ${node.isRescueCandidate ? "(Optimal Rescue)" : ""}`,
                      subtitle: "Model-relative candidate in causal evidence DAG",
                      badge: node.isRescueCandidate ? "MINIMAL RESCUE TARGET" : "CO-SEGREGATING LOCUS",
                      badgeColor: node.isRescueCandidate
                        ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                        : "bg-sky-500/20 text-sky-300 border-sky-500/40",
                      details: [
                        {
                          label: "Counterfactual Action",
                          value: node.isRescueCandidate ? "Break Interaction [L10 × L31]" : "Single variant reversion",
                          color: node.color,
                        },
                        {
                          label: "Phenotype Delta (Δ)",
                          value: node.isRescueCandidate ? "31.0 → 15.0 (Δ = -16.0)" : "31.0 → 29.5 (Δ = -1.5)",
                          color: node.isRescueCandidate ? "#fbbf24" : "#94a3b8",
                        },
                        {
                          label: "Novelty Status",
                          value: node.isRescueCandidate ? "Ablated (Returns to Parental Range)" : "Novelty Remains",
                          color: node.isRescueCandidate ? "#34d399" : "#f43f5e",
                        },
                      ],
                    });
                  }}
                  onMouseLeave={() => {
                    setActiveNode(null);
                    setHoveredCandidate(null);
                    setHoveredLocus(null);
                    setHoveredChromosome(null);
                    setTooltip(null);
                  }}
                >
                  {/* Outer Pulsing Halo for Gene Z7 */}
                  {node.isRescueCandidate && (
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r="9"
                      fill="none"
                      stroke="#fbbf24"
                      strokeWidth="1.2"
                      strokeOpacity="0.8"
                      className="animate-ping"
                      style={{ animationDuration: "2.5s" }}
                    />
                  )}

                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={node.isRescueCandidate ? 5.5 : 4}
                    fill={node.color}
                    className="transition-transform group-hover/node:scale-125"
                    filter="drop-shadow(0 0 5px rgba(251,191,36,0.6))"
                  />
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={node.isRescueCandidate ? 2 : 1.5}
                    fill="#ffffff"
                  />
                </g>
              );
            })}
          </svg>
        </div>

        {/* Legend on Right Side */}
        <div className="space-y-1.5 pl-2 text-[10.5px]">
          <div
            className={`flex items-center gap-2 cursor-pointer transition-colors ${
              activeNode === "X1" ? "text-sky-300 font-semibold" : "text-slate-300 hover:text-white"
            }`}
            onMouseEnter={() => setActiveNode("X1")}
            onMouseLeave={() => setActiveNode(null)}
          >
            <span className="w-2 h-2 rounded-full bg-sky-400" />
            <span>Gene X1</span>
          </div>

          <div
            className={`flex items-center gap-2 cursor-pointer transition-colors ${
              activeNode === "Y3" ? "text-blue-300 font-semibold" : "text-slate-300 hover:text-white"
            }`}
            onMouseEnter={() => setActiveNode("Y3")}
            onMouseLeave={() => setActiveNode(null)}
          >
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            <span>Gene Y3</span>
          </div>

          <div
            className={`flex items-center gap-2 cursor-pointer transition-colors ${
              activeNode === "Z7" ? "text-amber-300 font-bold" : "text-amber-400/90 font-medium hover:text-amber-300"
            }`}
            onMouseEnter={() => setActiveNode("Z7")}
            onMouseLeave={() => setActiveNode(null)}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_#fbbf24]" />
            <span>Gene Z7</span>
          </div>

          <div
            className={`flex items-center gap-2 cursor-pointer transition-colors ${
              activeNode === "RZ" ? "text-slate-200 font-semibold" : "text-slate-400 hover:text-slate-200"
            }`}
            onMouseEnter={() => setActiveNode("RZ")}
            onMouseLeave={() => setActiveNode(null)}
          >
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            <span>Regulatory Z</span>
          </div>
        </div>
      </div>
    </GlassPanel>
  );
};
