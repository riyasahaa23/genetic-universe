"use client";

import React from "react";
import { usePhenotypeInteraction, ModelMode } from "./interactions/PhenotypeInteractionContext";

export const PhenotypeAnnotationsOverlay: React.FC = () => {
  const { activeMode, setActiveMode } = usePhenotypeInteraction();

  const modeTabs: { id: ModelMode; label: string }[] = [
    { id: "genotype", label: "Genotype Input" },
    { id: "interaction", label: "Interaction Network" },
    { id: "phenotype", label: "Phenotype Output" },
  ];

  return (
    <div className="absolute inset-0 pointer-events-none z-10 select-none">
      {/* Top Center Mode Tabs */}
      <div
        role="tablist"
        aria-label="Phenotype Engine Scientific Stages"
        className="absolute top-2 left-1/2 -translate-x-1/2 pointer-events-auto flex items-center p-1 rounded-full bg-[#050b18]/90 border border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.6)] backdrop-blur-md"
      >
        {modeTabs.map((tab) => {
          const isActive = activeMode === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              tabIndex={0}
              onClick={() => setActiveMode(tab.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setActiveMode(tab.id);
                }
              }}
              className={`px-3 py-1 rounded-full text-[10px] font-medium transition-all cursor-pointer focus:outline-none focus:ring-1 focus:ring-cyan-400 ${
                isActive
                  ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-[0_0_12px_rgba(56,189,248,0.5)] font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Top Right Legend / Color Key */}
      <div className="absolute top-8 right-3 flex flex-col gap-1 text-[9px] text-slate-300 pointer-events-auto bg-[#070e22]/70 p-2 rounded-lg border border-slate-800/60 backdrop-blur-sm">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          <span>Gene variants</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-purple-400" />
          <span>Regulatory regions</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-pink-400" />
          <span>Epistatic interactions</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span>Model parameters</span>
        </div>
      </div>

      {/* Left Annotation Labels alongside the 3D Funnel */}
      <div className={`absolute top-[32%] left-[23%] text-right pointer-events-auto transition-all duration-300 ${activeMode === "genotype" ? "opacity-100 scale-105" : "opacity-60"}`}>
        <div className={`text-[10.5px] font-semibold leading-tight ${activeMode === "genotype" ? "text-cyan-300 font-bold" : "text-slate-200"}`}>
          Genetic
        </div>
        <div className={`text-[9.5px] leading-tight ${activeMode === "genotype" ? "text-cyan-400" : "text-slate-400"}`}>
          Variants
        </div>
      </div>

      <div className={`absolute top-[42%] left-[24%] text-right pointer-events-auto transition-all duration-300 ${activeMode === "interaction" ? "opacity-100 scale-105" : "opacity-60"}`}>
        <div className={`text-[10.5px] font-semibold leading-tight ${activeMode === "interaction" ? "text-pink-300 font-bold" : "text-slate-200"}`}>
          Epistatic
        </div>
        <div className={`text-[9.5px] leading-tight ${activeMode === "interaction" ? "text-pink-400" : "text-slate-400"}`}>
          Network
        </div>
      </div>

      <div className={`absolute top-[52%] left-[21%] text-right pointer-events-auto transition-all duration-300 ${activeMode === "interaction" ? "opacity-100 scale-105" : "opacity-60"}`}>
        <div className={`text-[10.5px] font-semibold leading-tight ${activeMode === "interaction" ? "text-purple-300 font-bold" : "text-slate-200"}`}>
          Epistatic
        </div>
        <div className={`text-[9.5px] leading-tight ${activeMode === "interaction" ? "text-purple-400" : "text-slate-400"}`}>
          Modifiers
        </div>
      </div>

      <div className={`absolute top-[62%] left-[23%] text-right pointer-events-auto transition-all duration-300 ${activeMode === "interaction" ? "opacity-100 scale-105" : "opacity-60"}`}>
        <div className={`text-[10.5px] font-semibold leading-tight ${activeMode === "interaction" ? "text-indigo-300 font-bold" : "text-slate-200"}`}>
          Non-linear
        </div>
        <div className={`text-[9.5px] leading-tight ${activeMode === "interaction" ? "text-indigo-400" : "text-slate-400"}`}>
          Modeling
        </div>
      </div>

      {/* Floating Trait Icons around the Emergent Phenotype Sphere */}
      {/* Top Left Icon: Vitality/Leaf */}
      <div className={`absolute bottom-[23%] left-[38%] pointer-events-auto w-6 h-6 rounded-full bg-[#07132a]/90 border border-slate-700/80 flex items-center justify-center text-[10px] text-emerald-400 transition-all duration-300 ${activeMode === "phenotype" ? "shadow-[0_0_14px_rgba(16,185,129,0.7)] scale-110 border-emerald-500/60" : "shadow-none opacity-50"}`}>
        🌿
      </div>

      {/* Top Right Icon: Cognition/Brain */}
      <div className={`absolute bottom-[23%] right-[38%] pointer-events-auto w-6 h-6 rounded-full bg-[#07132a]/90 border border-slate-700/80 flex items-center justify-center text-[10px] text-pink-400 transition-all duration-300 ${activeMode === "phenotype" ? "shadow-[0_0_14px_rgba(244,114,182,0.7)] scale-110 border-pink-500/60" : "shadow-none opacity-50"}`}>
        🧠
      </div>

      {/* Bottom Left Icon: Strength/Dumbbell */}
      <div className={`absolute bottom-[13%] left-[36%] pointer-events-auto w-6 h-6 rounded-full bg-[#07132a]/90 border border-slate-700/80 flex items-center justify-center text-[10px] text-cyan-400 transition-all duration-300 ${activeMode === "phenotype" ? "shadow-[0_0_14px_rgba(56,189,248,0.7)] scale-110 border-cyan-500/60" : "shadow-none opacity-50"}`}>
        ⚡
      </div>

      {/* Bottom Right Icon: Heart */}
      <div className={`absolute bottom-[13%] right-[36%] pointer-events-auto w-6 h-6 rounded-full bg-[#07132a]/90 border border-slate-700/80 flex items-center justify-center text-[10px] text-rose-400 transition-all duration-300 ${activeMode === "phenotype" ? "shadow-[0_0_14px_rgba(244,63,94,0.7)] scale-110 border-rose-500/60" : "shadow-none opacity-50"}`}>
        🤍
      </div>

      {/* Bottom Label beneath Phenotype Sphere */}
      <div className={`absolute bottom-[3%] left-1/2 -translate-x-1/2 text-center pointer-events-auto transition-all duration-300 ${activeMode === "phenotype" ? "scale-105" : "opacity-70"}`}>
        <h3 className={`text-[12px] font-bold tracking-wide font-sans transition-colors ${activeMode === "phenotype" ? "text-amber-300 font-extrabold" : "text-white"}`}>
          Emergent Phenotype
        </h3>
        <p className="text-[9.5px] text-slate-400 leading-tight mt-0.5">
          {activeMode === "phenotype" ? "Model-relative transgressive outcome" : "A product of non-linear interactions"}
        </p>
      </div>
    </div>
  );
};
