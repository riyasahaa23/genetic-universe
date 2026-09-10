"use client";

import React from "react";
import { GameteData } from "@/lib/types";

interface MeiosisAnimationProps {
  gameteA?: GameteData;
  gameteB?: GameteData;
  isSimulating?: boolean;
}

export const MeiosisAnimation: React.FC<MeiosisAnimationProps> = ({
  gameteA,
  gameteB,
  isSimulating = false,
}) => {
  return (
    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Meiotic Recombination & Gamete Assembly
          </h3>
        </div>
        {isSimulating && (
          <span className="text-[11px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 animate-pulse border border-amber-500/40">
            Simulating Meiosis...
          </span>
        )}
      </div>

      {/* Gamete A (Maternal) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-blue-400">Gamete gA (from Parent A)</span>
          <span className="text-slate-400 text-[11px]">
            Crossover Breakpoints: {gameteA?.crossovers.map((c) => `@ pos ${c}`).join(", ") || "None"}
          </span>
        </div>

        {gameteA && (
          <div className="space-y-1">
            <div className="flex w-full gap-[1px] h-6 bg-slate-950 p-0.5 rounded overflow-x-auto border border-slate-800">
              {gameteA.segments.map((seg, sIdx) => {
                const isA1 = seg.source_homolog === "A1";
                return (
                  <div
                    key={sIdx}
                    style={{ flexGrow: seg.end - seg.start }}
                    className={`relative flex items-center justify-center text-[10px] font-bold rounded-xs px-1 ${
                      isA1 ? "bg-blue-600 text-blue-100" : "bg-blue-400 text-slate-900"
                    }`}
                    title={`Transmitted segment [${seg.start}-${seg.end}] from Homolog ${seg.source_homolog}`}
                  >
                    <span>{seg.source_homolog} [{seg.start}–{seg.end}]</span>
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] text-slate-400">
              Recombination assembled Homolog A1 (L10) and Homolog A2 (L31) into a single transmitted gamete.
            </p>
          </div>
        )}
      </div>

      {/* Gamete B (Paternal) */}
      <div className="space-y-2 pt-2 border-t border-slate-800/60">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-emerald-400">Gamete gB (from Parent B)</span>
          <span className="text-slate-400 text-[11px]">
            Crossover Breakpoints: {gameteB?.crossovers.map((c) => `@ pos ${c}`).join(", ") || "None"}
          </span>
        </div>

        {gameteB && (
          <div className="space-y-1">
            <div className="flex w-full gap-[1px] h-6 bg-slate-950 p-0.5 rounded overflow-x-auto border border-slate-800">
              {gameteB.segments.map((seg, sIdx) => {
                const isB1 = seg.source_homolog === "B1";
                return (
                  <div
                    key={sIdx}
                    style={{ flexGrow: seg.end - seg.start }}
                    className={`relative flex items-center justify-center text-[10px] font-bold rounded-xs px-1 ${
                      isB1 ? "bg-emerald-600 text-emerald-100" : "bg-emerald-400 text-slate-900"
                    }`}
                    title={`Transmitted segment [${seg.start}-${seg.end}] from Homolog ${seg.source_homolog}`}
                  >
                    <span>{seg.source_homolog} [{seg.start}–{seg.end}]</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
