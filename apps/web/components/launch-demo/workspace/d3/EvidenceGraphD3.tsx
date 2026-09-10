"use client";

import React, { useMemo } from "react";
import { EvidenceGraphData } from "@/lib/types";

interface EvidenceGraphProps {
  data: EvidenceGraphData | null;
}

export const EvidenceGraphD3: React.FC<EvidenceGraphProps> = ({ data }) => {
  if (!data || !data.nodes || data.nodes.length === 0) {
    return (
      <div className="p-4 rounded-xl bg-[#050e22]/50 border border-slate-800 text-center text-xs text-slate-500 italic">
        Awaiting causal evidence graph synthesis...
      </div>
    );
  }

  // Assign clean layout positions by node type tier
  const tieredNodes = useMemo(() => {
    const tierMap: Record<string, number> = {
      parent: 30,
      homolog: 85,
      crossover: 140,
      segment: 195,
      candidate: 250,
      interaction: 305,
      phenotype: 360,
    };

    const typeCounts: Record<string, number> = {};
    const typeIndices: Record<string, number> = {};

    data.nodes.forEach((n) => {
      typeCounts[n.type] = (typeCounts[n.type] || 0) + 1;
    });

    return data.nodes.map((node) => {
      const type = node.type || "other";
      const count = typeCounts[type] || 1;
      const idx = typeIndices[type] || 0;
      typeIndices[type] = idx + 1;

      // X distributed across width
      const x = 30 + ((idx + 0.5) / count) * 360;
      // Y determined by tier
      const y = tierMap[type] || 200;

      let color = "#38bdf8";
      if (type === "parent") color = node.id.includes("B") ? "#ec4899" : "#38bdf8";
      if (type === "crossover") color = "#f6c85f";
      if (type === "candidate" || type === "interaction") color = "#a855f7";
      if (type === "phenotype") color = "#34d399";

      return {
        ...node,
        x,
        y,
        color,
      };
    });
  }, [data]);

  const nodePosMap = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    tieredNodes.forEach((n) => map.set(n.id, { x: n.x, y: n.y }));
    return map;
  }, [tieredNodes]);

  return (
    <div className="w-full bg-[#050e20]/80 rounded-xl border border-slate-800/80 p-3 select-none">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold">
          Mechanistic Evidence Graph ({data.nodes.length} Nodes, {data.links.length} Links)
        </span>
        <span className="text-[9px] font-mono text-cyan-300">
          Parent → Homolog → Crossover → Phenotype
        </span>
      </div>

      <div className="w-full h-56 relative bg-slate-950/60 rounded-lg overflow-hidden border border-slate-800/60">
        <svg viewBox="0 0 420 390" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
          {/* Connecting Links */}
          {data.links.map((link, idx) => {
            const sId = typeof link.source === "string" ? link.source : (link.source as any).id;
            const tId = typeof link.target === "string" ? link.target : (link.target as any).id;
            const sPos = nodePosMap.get(sId);
            const tPos = nodePosMap.get(tId);

            if (!sPos || !tPos) return null;

            return (
              <line
                key={idx}
                x1={sPos.x}
                y1={sPos.y}
                x2={tPos.x}
                y2={tPos.y}
                stroke="#334155"
                strokeWidth={1.2}
                strokeDasharray="2,2"
                opacity={0.65}
              />
            );
          })}

          {/* Nodes */}
          {tieredNodes.map((n) => (
            <g key={n.id} className="cursor-pointer group">
              <circle
                cx={n.x}
                cy={n.y}
                r={n.is_primary_cause ? 7 : 5}
                fill={n.color}
                stroke="#ffffff"
                strokeWidth={n.is_primary_cause ? 1.8 : 0.8}
                className="filter drop-shadow-[0_0_6px_currentColor]"
              />
              <text
                x={n.x}
                y={n.y - 8}
                fill="#cbd5e1"
                fontSize="7"
                textAnchor="middle"
                fontFamily="monospace"
                fontWeight="bold"
              >
                {n.label}
              </text>
            </g>
          ))}
        </svg>
      </div>

      <div className="flex items-center justify-between text-[8px] font-mono text-slate-400 mt-2 pt-1 border-t border-slate-800/60">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-cyan-400" /> Parents
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-400" /> Crossovers
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-purple-400" /> Interactions
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400" /> Phenotype
        </span>
      </div>
    </div>
  );
};
