"use client";

import React, { useState } from "react";
import { ParentGenomeData } from "@/lib/types";

interface HaplotypeTrackProps {
  parentA: ParentGenomeData | null;
  parentB: ParentGenomeData | null;
}

export const HaplotypeTrackD3: React.FC<HaplotypeTrackProps> = ({ parentA, parentB }) => {
  const [hoveredLocus, setHoveredLocus] = useState<{
    idx: number;
    parent: string;
    homolog: string;
    allele: number;
  } | null>(null);

  if (!parentA || !parentB) {
    return (
      <div className="p-4 rounded-xl bg-[#050e22]/50 border border-slate-800 text-center text-xs text-slate-500 italic">
        Awaiting parental genome synthesis...
      </div>
    );
  }

  const locusCount = parentA.locus_count || 50;
  const a1 = parentA.haplotypes?.A1 || [];
  const a2 = parentA.haplotypes?.A2 || [];
  const b1 = parentB.haplotypes?.B1 || [];
  const b2 = parentB.haplotypes?.B2 || [];

  const tracks = [
    { parent: "Parent A", homolog: "A1", alleles: a1, baseColor: "#38bdf8", activeColor: "#0284c7" },
    { parent: "Parent A", homolog: "A2", alleles: a2, baseColor: "#38bdf8", activeColor: "#0284c7" },
    { parent: "Parent B", homolog: "B1", alleles: b1, baseColor: "#ec4899", activeColor: "#be185d" },
    { parent: "Parent B", homolog: "B2", alleles: b2, baseColor: "#ec4899", activeColor: "#be185d" },
  ];

  return (
    <div className="w-full bg-[#050e20]/80 rounded-xl border border-slate-800/80 p-3 select-none">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold">
          Phase-Resolved Homolog Tracks ({locusCount} Loci)
        </span>
        {hoveredLocus && (
          <span className="text-[9.5px] font-mono text-cyan-300">
            Locus {hoveredLocus.idx}: {hoveredLocus.parent} [{hoveredLocus.homolog}] = {hoveredLocus.allele}
          </span>
        )}
      </div>

      <div className="space-y-1.5">
        {tracks.map((track, tIdx) => (
          <div key={tIdx} className="flex items-center gap-2">
            <span className="w-8 text-[9px] font-mono text-slate-400">{track.homolog}</span>
            <div className="flex-1 flex gap-[1px] h-3 bg-slate-900 rounded overflow-hidden p-[1px]">
              {Array.from({ length: locusCount }).map((_, idx) => {
                const allele = track.alleles[idx] ?? 0;
                const isVariant = allele === 1;
                return (
                  <div
                    key={idx}
                    onMouseEnter={() =>
                      setHoveredLocus({
                        idx,
                        parent: track.parent,
                        homolog: track.homolog,
                        allele,
                      })
                    }
                    onMouseLeave={() => setHoveredLocus(null)}
                    className={`flex-1 h-full rounded-[1px] cursor-pointer transition-colors ${
                      isVariant
                        ? track.parent === "Parent A"
                          ? "bg-cyan-400 shadow-[0_0_4px_#38bdf8]"
                          : "bg-pink-500 shadow-[0_0_4px_#ec4899]"
                        : "bg-slate-800/40 hover:bg-slate-700"
                    }`}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between text-[8px] font-mono text-slate-500 mt-2 pt-1 border-t border-slate-800/60">
        <span>Locus 00</span>
        <span className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" /> Parent A Variant
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-pink-500" /> Parent B Variant
          </span>
        </span>
        <span>Locus {locusCount - 1}</span>
      </div>
    </div>
  );
};
