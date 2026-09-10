"use client";

import React, { useState } from "react";
import { useMeiosisInteraction } from "../interactions/MeiosisInteractionContext";

export const CrossoverInspector: React.FC = () => {
  const { hoveredElement, setHoveredElement, setTooltip, activeStage } = useMeiosisInteraction();
  const [selectedChr, setSelectedChr] = useState("Chr 1");

  const isChiasmaActive = hoveredElement === "chiasma" || activeStage === 2;

  return (
    <div className={`w-full h-full bg-[#070d1d]/85 backdrop-blur-md border rounded-xl p-3 shadow-[0_8px_32px_rgba(0,0,0,0.6)] flex flex-col justify-between group transition-all duration-300 ${
      isChiasmaActive ? "border-amber-500/80 shadow-[0_0_20px_rgba(251,191,36,0.25)]" : "border-slate-800/80 hover:border-slate-700/80"
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/50 pb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-cyan-400 font-bold text-xs">|</span>
          <h2 className="text-xs font-semibold text-slate-100 tracking-wide font-sans">
            Crossover Inspector
          </h2>
        </div>
        <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800/60 border border-slate-700/60 text-[10px] text-slate-300 cursor-pointer hover:border-cyan-500/50">
          <span>{selectedChr}</span>
          <span className="text-[8px] text-slate-400">⌄</span>
        </div>
      </div>

      {/* Interactive Chromosome Track & Callout */}
      <div className="relative my-1">
        {/* Pinned Callout Box with Downward Brackets */}
        <div className="flex flex-col items-center mb-0.5">
          <div className={`rounded-md py-0.5 px-3 transition-all flex flex-col items-center text-center ${
            isChiasmaActive
              ? "bg-[#14234b] border border-amber-400 shadow-[0_0_18px_rgba(251,191,36,0.7)]"
              : "bg-[#0b142c]/95 border border-amber-500/60 shadow-[0_0_14px_rgba(251,191,36,0.3)]"
          }`}>
            <span className="text-[9.5px] font-medium text-slate-200 leading-tight">
              Crossover interval
            </span>
            <span className="text-[9px] font-mono text-amber-300 font-semibold leading-tight">
              (12.4 – 28.7 Mb)
            </span>
          </div>

          {/* Downward Bracket Lines */}
          <svg width="60" height="8" viewBox="0 0 60 8" className="overflow-visible">
            <line x1="30" y1="0" x2="30" y2="4" stroke="#fbbf24" strokeWidth="1" />
            <line x1="12" y1="4" x2="48" y2="4" stroke="#fbbf24" strokeWidth="1" />
            <line x1="12" y1="4" x2="12" y2="8" stroke="#fbbf24" strokeWidth="1" />
            <line x1="48" y1="4" x2="48" y2="8" stroke="#fbbf24" strokeWidth="1" />
          </svg>
        </div>

        {/* Horizontal Chromosome Track Graphic */}
        <div
          className="relative w-full h-6 rounded-full overflow-hidden border border-slate-700/60 flex cursor-pointer shadow-inner"
          onClick={() => setHoveredElement(hoveredElement === "chiasma" ? null : "chiasma")}
          onMouseEnter={(e) => {
            setHoveredElement("chiasma");
            setTooltip({
              visible: true,
              x: e.clientX,
              y: e.clientY,
              title: "Meiotic Crossover Interval (Chr 1)",
              subtitle: "Region of reciprocal homologous exchange",
              badge: "RECOMBINATION HOTSPOT",
              badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/40",
              details: [
                { label: "Interval Span", value: "12.4 Mb – 28.7 Mb (16.3 Mb)", color: "#fbbf24" },
                { label: "Recombination Rate", value: "2.8 cM/Mb (Elevated)", color: "#38bdf8" },
                { label: "DSB Machinery", value: "SPO11-mediated break repair", color: "#ec4899" },
              ],
            });
          }}
          onMouseLeave={() => {
            setHoveredElement(null);
            setTooltip(null);
          }}
        >
          {/* Segment 1: Maternal (Cyan) */}
          <div className="w-[36%] h-full bg-gradient-to-r from-sky-600 via-cyan-400 to-cyan-300 relative">
            <div className="absolute inset-0 bg-white/10 opacity-30" />
          </div>

          {/* Segment 2: Crossover Interval (Gold) */}
          <div className={`w-[28%] h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 relative border-x border-yellow-200 ${
            isChiasmaActive ? "animate-pulse shadow-[0_0_18px_rgba(251,191,36,0.9)]" : "shadow-[0_0_12px_rgba(251,191,36,0.8)]"
          }`}>
            <div className="absolute inset-0 bg-white/20" />
          </div>

          {/* Segment 3: Paternal (Pink) */}
          <div className="w-[36%] h-full bg-gradient-to-r from-pink-400 via-rose-500 to-pink-600 relative">
            <div className="absolute inset-0 bg-white/10 opacity-30" />
          </div>
        </div>

        {/* Coordinate labels */}
        <div className="flex justify-between items-center text-[8.5px] font-mono text-slate-400 mt-1 px-1">
          <span>0 Mb</span>
          <span>250 Mb</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-800/40 text-[8.5px] text-slate-400">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          <span>Maternal origin</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-pink-400" />
          <span>Paternal origin</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span>Crossover region</span>
        </div>
      </div>
    </div>
  );
};
