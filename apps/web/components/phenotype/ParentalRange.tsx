"use client";

import React from "react";

interface ParentalRangeProps {
  parentA: number;
  parentB: number;
  offspring: number;
  isTransgressive: boolean;
  noveltyMargin: number;
}

export const ParentalRange: React.FC<ParentalRangeProps> = ({
  parentA = 12.0,
  parentB = 18.0,
  offspring = 31.0,
  isTransgressive = true,
  noveltyMargin = 13.0,
}) => {
  const pMin = Math.min(parentA, parentB);
  const pMax = Math.max(parentA, parentB);
  const maxScale = Math.max(pMax, offspring) + 5;

  const getPercent = (val: number) => {
    return Math.min(Math.max((val / maxScale) * 100, 0), 100);
  };

  const minPct = getPercent(pMin);
  const maxPct = getPercent(pMax);
  const offPct = getPercent(offspring);

  return (
    <div className="space-y-3 p-4 rounded-xl bg-slate-950 border border-slate-800">
      <div className="flex justify-between text-xs text-slate-400">
        <span>0</span>
        <span className="text-amber-400 font-semibold">
          Parental Range: [{pMin.toFixed(1)} ── {pMax.toFixed(1)}]
        </span>
        <span>{maxScale.toFixed(0)}</span>
      </div>

      {/* Visual Range Bar */}
      <div className="relative w-full h-8 bg-slate-900 rounded-lg overflow-hidden border border-slate-800">
        {/* Shaded Parental Range */}
        <div
          style={{ left: `${minPct}%`, width: `${maxPct - minPct}%` }}
          className="absolute top-0 bottom-0 bg-blue-500/20 border-x border-blue-400/50"
        />

        {/* Parent A Marker */}
        <div
          style={{ left: `${getPercent(parentA)}%` }}
          className="absolute top-0 bottom-0 w-1 bg-blue-500 z-10"
          title={`Parent A: ${parentA}`}
        />

        {/* Parent B Marker */}
        <div
          style={{ left: `${getPercent(parentB)}%` }}
          className="absolute top-0 bottom-0 w-1 bg-emerald-500 z-10"
          title={`Parent B: ${parentB}`}
        />

        {/* Transgressive Offspring Marker */}
        <div
          style={{ left: `${offPct}%` }}
          className={`absolute top-0 bottom-0 w-1.5 z-20 ${
            isTransgressive ? "bg-pink-500 ring-4 ring-pink-500/30" : "bg-white"
          }`}
          title={`Offspring: ${offspring}`}
        />
      </div>

      <div className="flex justify-between text-[11px]">
        <div className="flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-500" />
          <span className="text-slate-300">Parent A: <strong className="text-white">{parentA.toFixed(1)}</strong></span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-slate-300">Parent B: <strong className="text-white">{parentB.toFixed(1)}</strong></span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-pink-500" />
          <span className="text-slate-300">
            Offspring: <strong className="text-pink-400 font-bold">{offspring.toFixed(1)}</strong>
          </span>
        </div>
      </div>
    </div>
  );
};
