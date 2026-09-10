"use client";

import React from "react";
import { useLaunchDemo, UniverseMode } from "../LaunchDemoContext";

export const LaunchDemoHeader: React.FC = () => {
  const {
    universeMode,
    organismMeta,
    experimentId,
    seed,
    locusCount,
    isRunning,
    auditLogs,
    isAuditDrawerOpen,
    setIsAuditDrawerOpen,
    clearUniverse,
    applyPreset,
    executeCompletePipeline,
    resetExperiment,
  } = useLaunchDemo();

  const getUniverseTheme = (mode: UniverseMode | null) => {
    switch (mode) {
      case "plant":
        return {
          label: "Plant Universe",
          icon: "🌿",
          color: "text-emerald-400",
          border: "border-emerald-500/40",
          bg: "bg-emerald-950/40",
        };
      case "animal":
        return {
          label: "Animal Universe",
          icon: "🐾",
          color: "text-cyan-400",
          border: "border-cyan-500/40",
          bg: "bg-cyan-950/40",
        };
      case "human":
        return {
          label: "Human Universe",
          icon: "🧬",
          color: "text-purple-400",
          border: "border-purple-500/40",
          bg: "bg-purple-950/40",
        };
      default:
        return {
          label: "Laboratory",
          icon: "🔬",
          color: "text-cyan-400",
          border: "border-cyan-500/40",
          bg: "bg-cyan-950/40",
        };
    }
  };

  const theme = getUniverseTheme(universeMode);

  return (
    <div className="w-full bg-[#040817]/95 border-b border-slate-800/80 px-4 py-2.5 flex items-center justify-between backdrop-blur-md z-30 select-none">
      {/* Left: Universe Mode & Species Context */}
      <div className="flex items-center gap-3">
        <div
          className={`flex items-center gap-2 px-3 py-1 rounded-xl border ${theme.border} ${theme.bg}`}
        >
          <span className="text-base">{theme.icon}</span>
          <div className="flex flex-col text-left leading-tight">
            <span className={`text-[11px] font-bold tracking-wide uppercase ${theme.color}`}>
              {theme.label}
            </span>
            <span className="text-[9px] text-slate-300 font-serif italic truncate max-w-[170px]">
              {organismMeta.species}
            </span>
          </div>
        </div>

        <button
          onClick={clearUniverse}
          className="text-[10px] text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors"
          title="Switch Universe Mode"
        >
          ⟲ Switch Universe
        </button>

        {experimentId && (
          <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/80 border border-slate-800 text-[10px] font-mono text-slate-300">
            <span className="text-slate-500">ID:</span>
            <span className="text-cyan-300 font-semibold">{experimentId}</span>
          </div>
        )}
      </div>

      {/* Center: Presets & Parameters */}
      <div className="hidden lg:flex items-center gap-2">
        <span className="text-[9.5px] font-mono uppercase text-slate-400 font-semibold mr-1">
          Presets:
        </span>
        <button
          onClick={() => applyPreset("quick")}
          disabled={isRunning}
          className="px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 text-[9.5px] font-mono text-slate-300 hover:text-cyan-300 transition-colors"
        >
          Quick Demo (50 Loci)
        </button>
        <button
          onClick={() => applyPreset("high_recomb")}
          disabled={isRunning}
          className="px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-800 hover:border-amber-500/50 text-[9.5px] font-mono text-slate-300 hover:text-amber-300 transition-colors"
        >
          High Recomb (80 Loci)
        </button>
        <button
          onClick={() => applyPreset("novelty_epistasis")}
          disabled={isRunning}
          className="px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-800 hover:border-pink-500/50 text-[9.5px] font-mono text-slate-300 hover:text-pink-300 transition-colors"
        >
          Epistasis Novelty (60 Loci)
        </button>

        <div className="flex items-center gap-2 ml-2 pl-2 border-l border-slate-800 text-[10px] font-mono text-slate-400">
          <span>Seed: <strong className="text-slate-200">{seed}</strong></span>
          <span>Loci: <strong className="text-slate-200">{locusCount}</strong></span>
        </div>
      </div>

      {/* Right: Pipeline Runner, Reset, and Audit Trail Toggle */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={executeCompletePipeline}
          disabled={isRunning}
          className="px-3 py-1.5 rounded-xl font-semibold text-[11px] text-white bg-gradient-to-r from-blue-600 to-cyan-500 shadow-[0_0_15px_rgba(56,189,248,0.4)] hover:shadow-[0_0_22px_rgba(56,189,248,0.6)] hover:scale-[1.02] transition-all flex items-center gap-1.5 disabled:opacity-50"
        >
          <span>{isRunning ? "Running..." : "Run Complete Pipeline"}</span>
          <span>▷</span>
        </button>

        <button
          onClick={resetExperiment}
          disabled={isRunning}
          className="px-2.5 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-[10.5px] text-slate-400 hover:text-slate-200 hover:border-slate-700 transition-colors"
          title="Reset Experiment Chamber"
        >
          Reset
        </button>

        <button
          onClick={() => setIsAuditDrawerOpen(!isAuditDrawerOpen)}
          className={`px-3 py-1.5 rounded-xl border text-[10.5px] font-mono transition-all flex items-center gap-1.5 ${
            isAuditDrawerOpen
              ? "bg-cyan-950/70 border-cyan-500/50 text-cyan-300"
              : "bg-slate-900/90 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
          }`}
        >
          <span>Audit Trail</span>
          <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[9px] text-slate-300">
            {auditLogs.length}
          </span>
          <span>{isAuditDrawerOpen ? "▴" : "▾"}</span>
        </button>
      </div>
    </div>
  );
};
