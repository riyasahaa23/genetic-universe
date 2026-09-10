"use client";

import React, { useState } from "react";
import { useMeiosisInteraction } from "../interactions/MeiosisInteractionContext";

export const MeiosisControlsPanel: React.FC = () => {
  const {
    showLabels,
    setShowLabels,
    showCrossoverPoints,
    setShowCrossoverPoints,
    animateProgression,
    setAnimateProgression,
    compareGametes,
    setCompareGametes,
    selectedOrganism,
    setSelectedOrganism,
  } = useMeiosisInteraction();

  const [dropdownOpen, setDropdownOpen] = useState(false);

  const organisms = [
    { id: "human", name: "Human", icon: "👤" },
    { id: "drosophila", name: "D. melanogaster", icon: "🪰" },
    { id: "yeast", name: "S. cerevisiae", icon: "🍄" },
    { id: "arabidopsis", name: "A. thaliana", icon: "🌱" },
  ];

  const currentOrg = organisms.find((o) => o.id === selectedOrganism) || organisms[0];

  return (
    <div className="w-full h-full bg-[#070d1d]/85 backdrop-blur-md border border-slate-800/80 rounded-xl p-3 shadow-[0_8px_32px_rgba(0,0,0,0.6)] flex flex-col justify-between group hover:border-slate-700/80 transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/50 pb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-cyan-400 font-bold text-xs">|</span>
          <h2 className="text-xs font-semibold text-slate-100 tracking-wide font-sans">
            Interactive Controls
          </h2>
        </div>
      </div>

      {/* Toggles */}
      <div className="flex flex-col gap-2 my-2">
        {/* Toggle 1: Show labels */}
        <div className="flex items-center justify-between cursor-pointer" onClick={() => setShowLabels(!showLabels)}>
          <span className="text-[11px] text-slate-300 font-medium select-none">Show labels</span>
          <div
            className={`w-8 h-4 rounded-full transition-colors relative p-0.5 ${
              showLabels ? "bg-cyan-500" : "bg-slate-700"
            }`}
          >
            <div
              className={`w-3 h-3 rounded-full bg-white transition-transform ${
                showLabels ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </div>
        </div>

        {/* Toggle 2: Show crossover points */}
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setShowCrossoverPoints(!showCrossoverPoints)}
        >
          <span className="text-[11px] text-slate-300 font-medium select-none">Show crossover points</span>
          <div
            className={`w-8 h-4 rounded-full transition-colors relative p-0.5 ${
              showCrossoverPoints ? "bg-cyan-500" : "bg-slate-700"
            }`}
          >
            <div
              className={`w-3 h-3 rounded-full bg-white transition-transform ${
                showCrossoverPoints ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </div>
        </div>

        {/* Toggle 3: Animate progression */}
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setAnimateProgression(!animateProgression)}
        >
          <span className="text-[11px] text-slate-300 font-medium select-none">Animate progression</span>
          <div
            className={`w-8 h-4 rounded-full transition-colors relative p-0.5 ${
              animateProgression ? "bg-cyan-500" : "bg-slate-700"
            }`}
          >
            <div
              className={`w-3 h-3 rounded-full bg-white transition-transform ${
                animateProgression ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </div>
        </div>

        {/* Toggle 4: Compare gametes */}
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setCompareGametes(!compareGametes)}
        >
          <span className="text-[11px] text-slate-300 font-medium select-none">Compare gametes</span>
          <div
            className={`w-8 h-4 rounded-full transition-colors relative p-0.5 ${
              compareGametes ? "bg-cyan-500" : "bg-slate-700"
            }`}
          >
            <div
              className={`w-3 h-3 rounded-full bg-white transition-transform ${
                compareGametes ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </div>
        </div>
      </div>

      {/* Organism Selector Dropdown */}
      <div className="relative pt-2 border-t border-slate-800/50 flex items-center justify-between">
        <span className="text-[11px] text-slate-400 font-medium">Organism</span>
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#0b142c] border border-slate-700/80 text-[10.5px] text-slate-200 hover:border-cyan-500/60 transition-colors"
          >
            <span>{currentOrg.icon}</span>
            <span>{currentOrg.name}</span>
            <span className="text-[9px] text-slate-400">⌄</span>
          </button>

          {dropdownOpen && (
            <div className="absolute bottom-full right-0 mb-1 w-36 bg-[#091024] border border-slate-700 rounded-lg shadow-xl py-1 z-50">
              {organisms.map((org) => (
                <button
                  key={org.id}
                  onClick={() => {
                    setSelectedOrganism(org.id);
                    setDropdownOpen(false);
                  }}
                  className="w-full px-2.5 py-1.5 text-left text-[10px] text-slate-200 hover:bg-cyan-950/60 hover:text-cyan-300 flex items-center gap-1.5"
                >
                  <span>{org.icon}</span>
                  <span>{org.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
