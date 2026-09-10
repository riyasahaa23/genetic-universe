"use client";

import React from "react";
import { useLaunchDemo } from "../LaunchDemoContext";

export const StageProgressArc: React.FC = () => {
  const { currentStage, maxCompletedStage, setCurrentStage } = useLaunchDemo();

  const stages = [
    { id: 1, name: "Configure", sub: "Setup Parameters", icon: "⚙" },
    { id: 2, name: "Parental Genomes", sub: "Phased Haplotypes", icon: "🧬" },
    { id: 3, name: "Meiosis", sub: "Crossover & Chiasmata", icon: "🔀" },
    { id: 4, name: "Offspring", sub: "Mosaic Fertilization", icon: "🐣" },
    { id: 5, name: "Phenotype", sub: "Epistatic Model", icon: "📊" },
    { id: 6, name: "Novelty Trace", sub: "Attribution Search", icon: "🔍" },
    { id: 7, name: "Counterfactual Rescue", sub: "In-Silico Intervention", icon: "🛡" },
    { id: 8, name: "Research Summary", sub: "Executive Report", icon: "📜" },
  ];

  return (
    <div className="w-full bg-[#030713]/90 border-t border-slate-800/80 px-6 py-2.5 backdrop-blur-md z-30 select-none">
      <div className="max-w-6xl mx-auto flex items-center justify-between relative">
        {/* Background Connecting Arc Line */}
        <div className="absolute left-8 right-8 top-1/2 -translate-y-1/2 h-[2px] bg-slate-800 z-0">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-cyan-400 transition-all duration-500"
            style={{
              width: `${((Math.min(currentStage, maxCompletedStage) - 1) / (stages.length - 1)) * 100}%`,
            }}
          />
        </div>

        {/* Stage Nodes */}
        {stages.map((st) => {
          const isActive = currentStage === st.id;
          const isCompleted = st.id <= maxCompletedStage;
          const isAccessible = st.id <= maxCompletedStage + 1;

          return (
            <div
              key={st.id}
              onClick={() => {
                if (isAccessible) {
                  setCurrentStage(st.id);
                }
              }}
              className={`relative z-10 flex flex-col items-center group ${
                isAccessible ? "cursor-pointer" : "cursor-not-allowed opacity-40"
              }`}
            >
              {/* Node Circle */}
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-mono font-bold transition-all duration-300 relative ${
                  isActive
                    ? "bg-cyan-400 text-slate-950 shadow-[0_0_20px_rgba(56,189,248,0.9)] scale-110 ring-4 ring-cyan-500/30"
                    : isCompleted
                    ? "bg-indigo-950 border border-cyan-400/70 text-cyan-300 hover:scale-105"
                    : "bg-[#070e20] border border-slate-700/60 text-slate-500"
                }`}
              >
                <span>{st.icon}</span>

                {/* Completed Badge Indicator */}
                {isCompleted && !isActive && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 text-slate-950 text-[8px] flex items-center justify-center font-bold">
                    ✓
                  </span>
                )}
              </div>

              {/* Title & Stage Number */}
              <div className="text-center mt-1.5 leading-none">
                <span
                  className={`text-[10px] font-semibold tracking-tight block ${
                    isActive
                      ? "text-white font-bold"
                      : isCompleted
                      ? "text-slate-200 group-hover:text-cyan-300 transition-colors"
                      : "text-slate-400"
                  }`}
                >
                  {st.name}
                </span>
                <span
                  className={`text-[8.5px] font-mono mt-0.5 block ${
                    isActive ? "text-cyan-300" : "text-slate-400"
                  }`}
                >
                  Stage 0{st.id}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
