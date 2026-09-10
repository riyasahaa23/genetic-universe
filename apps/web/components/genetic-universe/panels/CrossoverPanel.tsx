"use client";

import React, { useState } from "react";
import { GlassPanel } from "../ui/GlassPanel";
import { useInteraction } from "../context/InteractionContext";

export const CrossoverPanel: React.FC = () => {
  const {
    hoveredCrossover,
    setHoveredCrossover,
    setTooltip,
  } = useInteraction();

  const [activeSegment, setActiveSegment] = useState<string | null>(null);

  return (
    <GlassPanel
      title="Crossover Provenance"
      subtitle="Locate and characterize recombination events across the genome."
      className="w-[260px] lg:w-[285px]"
      isActive={hoveredCrossover !== null}
    >
      <div className="py-2 space-y-3">
        {/* Segmented Chromosome Bar */}
        <div className="relative pt-3 pb-2">
          {/* Base Bar */}
          <div className="h-4 w-full rounded-full overflow-hidden flex shadow-inner bg-slate-900 border border-slate-700/60">
            {/* Segment 1: Cyan (Homolog A1, loci 0-20) */}
            <div
              className="h-full bg-gradient-to-r from-sky-400 to-blue-500 transition-all cursor-pointer hover:brightness-125"
              style={{ width: "40%" }}
              onMouseEnter={(e) => {
                setActiveSegment("Seg 0-20 (A1)");
                setTooltip({
                  visible: true,
                  x: e.clientX,
                  y: e.clientY,
                  title: "Inherited Segment [0-20]",
                  subtitle: "Transmitted via Gamete gA from Homolog A1",
                  badge: "PARENT A ORIGIN",
                  badgeColor: "bg-sky-500/20 text-sky-300 border-sky-500/40",
                  details: [
                    { label: "Homolog Source", value: "Parent A [A1]", color: "#38bdf8" },
                    { label: "Loci Carried", value: "L00 - L20 (includes L10)", color: "#94a3b8" },
                    { label: "Contribution", value: "+20.0 units", color: "#38bdf8" },
                  ],
                });
              }}
              onMouseLeave={() => {
                setActiveSegment(null);
                setTooltip(null);
              }}
            />

            {/* Segment 2: Purple / Violet (Homolog A2, loci 20-35) */}
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all cursor-pointer hover:brightness-125"
              style={{ width: "30%" }}
              onMouseEnter={(e) => {
                setActiveSegment("Seg 20-35 (A2)");
                setTooltip({
                  visible: true,
                  x: e.clientX,
                  y: e.clientY,
                  title: "Recombinant Segment [20-35]",
                  subtitle: "Transmitted via Gamete gA from Homolog A2",
                  badge: "RECOMBINANT HOMOLOG",
                  badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/40",
                  details: [
                    { label: "Homolog Source", value: "Parent A [A2]", color: "#c084fc" },
                    { label: "Loci Carried", value: "L20 - L35 (includes L31)", color: "#94a3b8" },
                    { label: "Co-assembly", value: "Brings L31 into cis with L10", color: "#fbbf24" },
                  ],
                });
              }}
              onMouseLeave={() => {
                setActiveSegment(null);
                setTooltip(null);
              }}
            />

            {/* Segment 3: Magenta (Gamete B contribution, loci 35-50) */}
            <div
              className="h-full bg-gradient-to-r from-pink-500 to-rose-500 transition-all cursor-pointer hover:brightness-125"
              style={{ width: "30%" }}
              onMouseEnter={(e) => {
                setActiveSegment("Seg 35-50 (B)");
                setTooltip({
                  visible: true,
                  x: e.clientX,
                  y: e.clientY,
                  title: "Inherited Segment [35-50]",
                  subtitle: "Transmitted via Gamete gB from Parent B",
                  badge: "PARENT B ORIGIN",
                  badgeColor: "bg-pink-500/20 text-pink-300 border-pink-500/40",
                  details: [
                    { label: "Homolog Source", value: "Parent B [B2]", color: "#ec4899" },
                    { label: "Loci Carried", value: "L35 - L50", color: "#94a3b8" },
                    { label: "Effect", value: "Additive baseline", color: "#f472b6" },
                  ],
                });
              }}
              onMouseLeave={() => {
                setActiveSegment(null);
                setTooltip(null);
              }}
            />
          </div>

          {/* Crossover Pin 1 (at 40% / Locus 20) */}
          <div
            className="absolute top-0 flex flex-col items-center group/pin cursor-pointer transition-transform hover:scale-110"
            style={{ left: "40%", transform: "translateX(-50%)" }}
            onMouseEnter={(e) => {
              setHoveredCrossover(20);
              setTooltip({
                visible: true,
                x: e.clientX,
                y: e.clientY,
                title: "Meiotic Crossover Event: A_XO_00",
                subtitle: "Inferred Breakpoint Interval [18 - 22 cM]",
                badge: "CRITICAL RECOMBINATION",
                badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/40",
                details: [
                  { label: "Gamete", value: "Gamete gA (Maternal)", color: "#38bdf8" },
                  { label: "Homolog Swap", value: "Homolog A1 → Homolog A2", color: "#fbbf24" },
                  { label: "Epistatic Consequence", value: "Creates novel cis-haplotype (L10 × L31)", color: "#f59e0b" },
                ],
              });
            }}
            onMouseLeave={() => {
              setHoveredCrossover(null);
              setTooltip(null);
            }}
          >
            {/* Amber Pin Head */}
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400 border border-white shadow-[0_0_8px_#f59e0b] group-hover/pin:scale-125 transition-transform" />
            <div className="w-[1.5px] h-5 bg-amber-400/80 shadow-[0_0_6px_#f59e0b]" />
          </div>

          {/* Crossover Pin 2 (at 70% / Locus 35) */}
          <div
            className="absolute top-0 flex flex-col items-center group/pin cursor-pointer transition-transform hover:scale-110"
            style={{ left: "70%", transform: "translateX(-50%)" }}
            onMouseEnter={(e) => {
              setHoveredCrossover(35);
              setTooltip({
                visible: true,
                x: e.clientX,
                y: e.clientY,
                title: "Meiotic Crossover Event: B_XO_01",
                subtitle: "Inferred Breakpoint Interval [34 - 36 cM]",
                badge: "SECONDARY CROSSOVER",
                badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/40",
                details: [
                  { label: "Gamete", value: "Gamete gB (Paternal)", color: "#ec4899" },
                  { label: "Homolog Swap", value: "Homolog B1 → Homolog B2", color: "#fbbf24" },
                  { label: "Phenotype Shift", value: "Neutral baseline shift (Δ = +2.0)", color: "#94a3b8" },
                ],
              });
            }}
            onMouseLeave={() => {
              setHoveredCrossover(null);
              setTooltip(null);
            }}
          >
            {/* Amber Pin Head */}
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400 border border-white shadow-[0_0_8px_#f59e0b] group-hover/pin:scale-125 transition-transform" />
            <div className="w-[1.5px] h-5 bg-amber-400/80 shadow-[0_0_6px_#f59e0b]" />
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between text-[9.5px] text-slate-300 pt-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_5px_#f59e0b]" />
            <span>Crossover event</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-400" />
            <span>Inherited segment</span>
          </div>
        </div>
      </div>
    </GlassPanel>
  );
};
