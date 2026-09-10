"use client";

import React from "react";
import { useMeiosisInteraction } from "./interactions/MeiosisInteractionContext";

export const MeiosisAnnotationsOverlay: React.FC = () => {
  const {
    showLabels,
    showCrossoverPoints,
    selectedHomolog,
    setSelectedHomolog,
    selectedGamete,
    setSelectedGamete,
  } = useMeiosisInteraction();

  if (!showLabels) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-10 select-none">
      {/* Stage 1: Maternal Homolog Label (left of cyan sphere) */}
      <div
        onClick={() => setSelectedHomolog(selectedHomolog === "maternal" ? null : "maternal")}
        className="absolute top-[8%] left-[23%] -translate-x-full text-right pointer-events-auto cursor-pointer group"
      >
        <div className={`text-[11px] font-medium leading-tight transition-colors ${
          selectedHomolog === "maternal" ? "text-cyan-300 font-bold drop-shadow-[0_0_8px_rgba(56,189,248,0.8)]" : "text-slate-300 group-hover:text-cyan-300"
        }`}>
          Maternal
        </div>
        <div className={`text-[10px] leading-tight transition-colors ${
          selectedHomolog === "maternal" ? "text-cyan-400" : "text-slate-400 group-hover:text-slate-300"
        }`}>
          homolog
        </div>
      </div>

      {/* Stage 1: Paternal Homolog Label (right of magenta sphere) */}
      <div
        onClick={() => setSelectedHomolog(selectedHomolog === "paternal" ? null : "paternal")}
        className="absolute top-[8%] right-[23%] translate-x-full text-left pointer-events-auto cursor-pointer group"
      >
        <div className={`text-[11px] font-medium leading-tight transition-colors ${
          selectedHomolog === "paternal" ? "text-pink-300 font-bold drop-shadow-[0_0_8px_rgba(244,114,182,0.8)]" : "text-slate-300 group-hover:text-pink-300"
        }`}>
          Paternal
        </div>
        <div className={`text-[10px] leading-tight transition-colors ${
          selectedHomolog === "paternal" ? "text-pink-400" : "text-slate-400 group-hover:text-slate-300"
        }`}>
          homolog
        </div>
      </div>

      {/* Stage 2: Chiasma Label (right of crossover spark) */}
      {showCrossoverPoints && (
        <div className="absolute top-[34%] left-[62%] text-left pointer-events-auto flex items-start gap-1">
          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              <span className="text-amber-400 font-bold text-xs">→</span>
              <span className="text-xs font-bold text-amber-300 font-sans tracking-wide">
                Chiasma
              </span>
            </div>
            <div className="text-[9.5px] text-slate-300 leading-tight max-w-[130px] mt-0.5">
              Genetic exchange creates new combinations
            </div>
          </div>
        </div>
      )}

      {/* Stage 5: Gamete labels beneath the 4 gametes */}
      <div className="absolute bottom-[2%] left-[16%] right-[16%] flex justify-between text-center pointer-events-auto">
        {(["gamete_1", "gamete_2", "gamete_3", "gamete_4"] as const).map((gid, idx) => {
          const isSel = selectedGamete === gid;
          return (
            <div
              key={gid}
              onClick={() => setSelectedGamete(isSel ? null : gid)}
              className="w-16 cursor-pointer group"
            >
              <span className={`text-[10.5px] font-semibold block transition-all ${
                isSel
                  ? "text-cyan-300 font-bold drop-shadow-[0_0_8px_rgba(56,189,248,0.8)]"
                  : "text-slate-200 group-hover:text-cyan-300"
              }`}>
                Gamete {idx + 1}
              </span>
            </div>
          );
        })}
      </div>

      {/* Dotted annotation line with text: "Four unique gametes. A universe of possibilities." */}
      <div className="absolute bottom-[10%] right-[2%] pointer-events-auto flex items-center gap-1.5 opacity-90">
        <svg width="24" height="12" viewBox="0 0 24 12" className="overflow-visible">
          <line x1="0" y1="6" x2="18" y2="6" stroke="#d4d4d8" strokeWidth="1" strokeDasharray="2 2" />
          <polygon points="18,3 24,6 18,9" fill="#d4d4d8" />
        </svg>
        <div className="text-[10px] italic text-slate-300 leading-tight">
          Four unique gametes.<br />
          <span className="text-slate-400">A universe of possibilities.</span>
        </div>
      </div>
    </div>
  );
};
