"use client";

import React, { useState } from "react";
import { GlassPanel } from "../ui/GlassPanel";
import { useInteraction } from "../context/InteractionContext";

export const HaplotypePanel: React.FC = () => {
  const {
    hoveredChromosome,
    setHoveredChromosome,
    setHoveredLocus,
    setTooltip,
  } = useInteraction();

  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  // SVG Wave path generator
  const createSineWave = (width: number, height: number, cycles: number, phase = 0, amplitude = 5.5) => {
    const points: string[] = [];
    const steps = 70;
    for (let i = 0; i <= steps; i++) {
      const x = (i / steps) * width;
      const angle = (i / steps) * Math.PI * 2 * cycles + phase;
      const y = height / 2 + Math.sin(angle) * amplitude;
      points.push(`${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`);
    }
    return points.join(" ");
  };

  const trackWidth = 160;
  const trackHeight = 16;

  return (
    <GlassPanel
      title="Phase-Resolved Haplotypes"
      subtitle="Haplotype phasing across parental genomes."
      className="w-[250px] lg:w-[265px]"
      isActive={hoveredChromosome === "parent_a" || hoveredRow !== null}
    >
      <div className="space-y-2 py-1">
        {/* Parent A Track */}
        <div
          className="group/row cursor-pointer transition-all p-1 -mx-1 rounded-lg hover:bg-sky-950/40"
          onMouseEnter={(e) => {
            setHoveredRow("Parent A");
            setHoveredChromosome("parent_a");
            setTooltip({
              visible: true,
              x: e.clientX,
              y: e.clientY,
              title: "Parent A Haplotypes",
              subtitle: "Homologs A1 & A2 (23 chromosome pairs)",
              badge: "CYAN ANCESTRY",
              badgeColor: "bg-sky-500/20 text-sky-300 border-sky-500/40",
              details: [
                { label: "Homolog A1", value: "Carrying L10=1, L31=0", color: "#38bdf8" },
                { label: "Homolog A2", value: "Carrying L10=0, L31=1", color: "#0284c7" },
                { label: "Phase State", value: "Trans configuration (repulsion)", color: "#94a3b8" },
              ],
            });
          }}
          onMouseLeave={() => {
            setHoveredRow(null);
            setHoveredChromosome(null);
            setTooltip(null);
          }}
        >
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-medium text-slate-300 w-14 flex-shrink-0 group-hover/row:text-sky-300 transition-colors">
              Parent A
            </span>
            <svg width={trackWidth} height={trackHeight} className="overflow-visible flex-1">
              <defs>
                <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="1.2" result="glow" />
                  <feMerge>
                    <feMergeNode in="glow" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <path
                d={createSineWave(trackWidth, trackHeight, 3.2, 0, 4.5)}
                fill="none"
                stroke="#38bdf8"
                strokeWidth="1.8"
                filter="url(#glow-cyan)"
              />
              <path
                d={createSineWave(trackWidth, trackHeight, 3.2, Math.PI / 3, 3.5)}
                fill="none"
                stroke="#0ea5e9"
                strokeWidth="1"
                strokeOpacity="0.55"
              />
            </svg>
          </div>
        </div>

        {/* Parent B Track */}
        <div
          className="group/row cursor-pointer transition-all p-1 -mx-1 rounded-lg hover:bg-pink-950/40"
          onMouseEnter={(e) => {
            setHoveredRow("Parent B");
            setHoveredChromosome("parent_b");
            setTooltip({
              visible: true,
              x: e.clientX,
              y: e.clientY,
              title: "Parent B Haplotypes",
              subtitle: "Homologs B1 & B2 (23 chromosome pairs)",
              badge: "MAGENTA ANCESTRY",
              badgeColor: "bg-pink-500/20 text-pink-300 border-pink-500/40",
              details: [
                { label: "Homolog B1", value: "Carrying L10=0, L31=1", color: "#ec4899" },
                { label: "Homolog B2", value: "Carrying L10=0, L31=1", color: "#d946ef" },
                { label: "Phenotype", value: "Baseline = 18.0", color: "#f472b6" },
              ],
            });
          }}
          onMouseLeave={() => {
            setHoveredRow(null);
            setHoveredChromosome(null);
            setTooltip(null);
          }}
        >
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-medium text-slate-300 w-14 flex-shrink-0 group-hover/row:text-pink-300 transition-colors">
              Parent B
            </span>
            <svg width={trackWidth} height={trackHeight} className="overflow-visible flex-1">
              <defs>
                <filter id="glow-magenta" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="1.2" result="glow" />
                  <feMerge>
                    <feMergeNode in="glow" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <path
                d={createSineWave(trackWidth, trackHeight, 3.2, 0.8, 4.5)}
                fill="none"
                stroke="#ec4899"
                strokeWidth="1.8"
                filter="url(#glow-magenta)"
              />
              <path
                d={createSineWave(trackWidth, trackHeight, 3.2, 0.8 + Math.PI / 3, 3.5)}
                fill="none"
                stroke="#f43f5e"
                strokeWidth="1"
                strokeOpacity="0.55"
              />
            </svg>
          </div>
        </div>

        {/* Offspring Track (Mosaic) */}
        <div
          className="group/row cursor-pointer transition-all p-1 -mx-1 rounded-lg hover:bg-amber-950/30"
          onMouseEnter={(e) => {
            setHoveredRow("Offspring");
            setHoveredChromosome("offspring");
            setHoveredLocus(10);
            setTooltip({
              visible: true,
              x: e.clientX,
              y: e.clientY,
              title: "Offspring Mosaic Haplotype",
              subtitle: "Recombinant Gamete gA ⊕ Gamete gB",
              badge: "TRANSGRESSIVE CONFIGURATION",
              badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/40",
              details: [
                { label: "Segment [0-20]", value: "Homolog A1 (Cyan)", color: "#38bdf8" },
                { label: "Crossover @ L20", value: "Swapped to Homolog A2", color: "#fbbf24" },
                { label: "Segment [20-50]", value: "Homolog A2 (Pink)", color: "#ec4899" },
                { label: "Cis Epistasis", value: "Co-assembly: L10 × L31", color: "#f59e0b" },
              ],
            });
          }}
          onMouseLeave={() => {
            setHoveredRow(null);
            setHoveredChromosome(null);
            setHoveredLocus(null);
            setTooltip(null);
          }}
        >
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-medium text-slate-300 w-14 flex-shrink-0 group-hover/row:text-amber-300 transition-colors">
              Offspring
            </span>
            <svg width={trackWidth} height={trackHeight} className="overflow-visible flex-1">
              <defs>
                <linearGradient id="mosaicGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="38%" stopColor="#38bdf8" />
                  <stop offset="42%" stopColor="#fbbf24" />
                  <stop offset="46%" stopColor="#ec4899" />
                  <stop offset="100%" stopColor="#ec4899" />
                </linearGradient>
              </defs>
              <path
                d={createSineWave(trackWidth, trackHeight, 3.2, 0, 4.5)}
                fill="none"
                stroke="url(#mosaicGradient)"
                strokeWidth="2.2"
              />
              {/* Locus markers */}
              <circle cx={trackWidth * 0.22} cy={trackHeight / 2 - 3.5} r="2.8" fill="#38bdf8" />
              <circle cx={trackWidth * 0.42} cy={trackHeight / 2} r="3.2" fill="#fbbf24" stroke="#ffffff" strokeWidth="0.8" />
              <circle cx={trackWidth * 0.65} cy={trackHeight / 2 + 3.5} r="2.8" fill="#ec4899" />
            </svg>
          </div>
        </div>
      </div>
    </GlassPanel>
  );
};
