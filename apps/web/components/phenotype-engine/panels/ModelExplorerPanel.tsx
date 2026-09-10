"use client";

import React from "react";
import { usePhenotypeInteraction } from "../interactions/PhenotypeInteractionContext";

export const ModelExplorerPanel: React.FC = () => {
  const {
    activeMode,
    selectedLocus,
    setSelectedLocus,
    locusADosage,
    setLocusADosage,
    locusBDosage,
    setLocusBDosage,
    dominanceEnabled,
    setDominanceEnabled,
    selectedTrait,
    setSelectedTrait,
    setTooltip,
  } = usePhenotypeInteraction();

  const isGenotypeStage = activeMode === "genotype";

  const traits = [
    "Trait Expression (Model)",
    "Simulated Quantitative Trait",
    "Growth & Morphology Index",
    "Metabolic Flux Potential",
  ];

  if (isGenotypeStage) {
    return (
      <div className="w-full h-full bg-[#070d1d]/85 backdrop-blur-md border border-slate-800/80 rounded-xl p-3 shadow-[0_8px_32px_rgba(0,0,0,0.6)] flex flex-col justify-between group hover:border-slate-700/80 transition-all duration-300">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/50 pb-1.5 mb-1">
          <div className="flex items-center gap-1.5">
            <span className="text-cyan-400 font-bold text-xs">|</span>
            <h2 className="text-xs font-semibold text-slate-100 tracking-wide font-sans">
              Genotype Summary
            </h2>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-600/40">
              G_off Matrix
            </span>
          </div>
        </div>

        {/* Available Genotype Data Metrics */}
        <div className="space-y-1.5 flex-1 flex flex-col justify-around py-0.5">
          <div className="flex items-center justify-between text-[10px] bg-[#091228]/80 px-2 py-1 rounded border border-slate-800/80">
            <span className="text-slate-400">Modeled Loci</span>
            <span className="font-mono text-cyan-300 font-bold">8 loci / 4 homologs</span>
          </div>

          <div className="flex items-center justify-between text-[10px] bg-[#091228]/80 px-2 py-1 rounded border border-slate-800/80">
            <span className="text-slate-400">Selected Focus</span>
            <div className="flex items-center gap-1">
              {(["Gene A", "Gene B"] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => setSelectedLocus(g)}
                  className={`px-1.5 py-0.2 rounded text-[9px] font-mono transition-colors ${
                    selectedLocus === g
                      ? "bg-cyan-500/30 text-cyan-200 border border-cyan-400/60 font-bold"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] bg-[#091228]/80 px-2 py-1 rounded border border-slate-800/80">
            <span className="text-slate-400">Genotype Dosage</span>
            <span className="font-mono text-amber-300 font-semibold">
              {selectedLocus === "Gene B" ? `x_B = ${locusBDosage.toFixed(1)}` : `x_A = ${locusADosage.toFixed(1)}`}
            </span>
          </div>

          <div className="flex items-center justify-between text-[10px] bg-[#091228]/80 px-2 py-1 rounded border border-slate-800/80">
            <span className="text-slate-400">Parental Origin</span>
            <span className="font-mono text-cyan-300 text-[9px]">
              {selectedLocus === "Gene B" ? "Parent B (Paternal)" : "Parent A (Maternal)"}
            </span>
          </div>

          <div className="flex items-center justify-between text-[10px] bg-[#091228]/80 px-2 py-1 rounded border border-slate-800/80">
            <span className="text-slate-400">Recombinant Status</span>
            <span className="font-mono text-emerald-400 text-[9px] font-semibold">
              {selectedLocus === "Gene B" ? "Intact Homolog" : "Recombinant Segment"}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-[#070d1d]/85 backdrop-blur-md border border-slate-800/80 rounded-xl p-3 shadow-[0_8px_32px_rgba(0,0,0,0.6)] flex flex-col justify-between group hover:border-slate-700/80 transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/50 pb-1.5 mb-1.5">
        <div className="flex items-center gap-1.5">
          <span className="text-cyan-400 font-bold text-xs">|</span>
          <h2 className="text-xs font-semibold text-slate-100 tracking-wide font-sans">
            Trait Simulation
          </h2>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-sky-950/70 text-sky-300 border border-sky-600/40">
            Demo model
          </span>
          <div className="w-4 h-4 rounded-full border border-slate-700 flex items-center justify-center text-[9px] text-slate-400">
            ›
          </div>
        </div>
      </div>

      {/* Select Trait Dropdown */}
      <div className="mb-2">
        <label className="text-[9.5px] text-slate-400 block mb-0.5">Select Trait</label>
        <div className="relative">
          <select
            value={selectedTrait}
            onChange={(e) => setSelectedTrait(e.target.value)}
            className="w-full bg-[#0b142c] border border-slate-700/80 rounded-lg px-2 py-1 text-[11px] text-slate-200 focus:outline-none focus:border-cyan-500/60 appearance-none cursor-pointer"
          >
            {traits.map((t) => (
              <option key={t} value={t} className="bg-[#0b142c] text-slate-200">
                {t}
              </option>
            ))}
          </select>
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] text-slate-400 pointer-events-none">
            ⌄
          </div>
        </div>
      </div>

      {/* Interactive Controls matching reference sliders with value pills */}
      <div className="space-y-1.5">
        {/* Gene A Expression / Dosage */}
        <div
          onMouseEnter={(e) => {
            setTooltip({
              visible: true,
              x: e.clientX,
              y: e.clientY,
              title: "Locus A Main Effect",
              subtitle: "Additive genetic dosage contribution (α_A · x_A)",
              badge: "ADDITIVE TERM",
              badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
              details: [
                { label: "Dosage value", value: `${locusADosage.toFixed(1)} copies`, color: "#38bdf8" },
                { label: "Effect coefficient", value: "α_A = +0.48", color: "#94a3b8" },
              ],
            });
          }}
          onMouseLeave={() => setTooltip(null)}
        >
          <div className="flex items-center justify-between text-[10.5px] mb-1">
            <span className="text-slate-300">Gene A Expression</span>
            <span className="px-2 py-0.5 rounded bg-[#0b142c] border border-slate-700/80 text-[10px] font-mono text-cyan-300">
              {locusADosage.toFixed(1)}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={locusADosage}
            onChange={(e) => setLocusADosage(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
        </div>

        {/* Gene B Expression / Dosage */}
        <div
          onMouseEnter={(e) => {
            setTooltip({
              visible: true,
              x: e.clientX,
              y: e.clientY,
              title: "Locus B Main Effect",
              subtitle: "Additive genetic dosage contribution (α_B · x_B)",
              badge: "ADDITIVE TERM",
              badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
              details: [
                { label: "Dosage value", value: `${locusBDosage.toFixed(1)} copies`, color: "#38bdf8" },
                { label: "Effect coefficient", value: "α_B = +0.38", color: "#94a3b8" },
              ],
            });
          }}
          onMouseLeave={() => setTooltip(null)}
        >
          <div className="flex items-center justify-between text-[10.5px] mb-1">
            <span className="text-slate-300">Gene B Expression</span>
            <span className="px-2 py-0.5 rounded bg-[#0b142c] border border-slate-700/80 text-[10px] font-mono text-cyan-300">
              {locusBDosage.toFixed(1)}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={locusBDosage}
            onChange={(e) => setLocusBDosage(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
        </div>

        {/* Dominance Deviation Modifier */}
        <div
          onMouseEnter={(e) => {
            setTooltip({
              visible: true,
              x: e.clientX,
              y: e.clientY,
              title: "Dominance Deviation (Σ β_j d_j)",
              subtitle: "Non-additive heterozygous state contribution",
              badge: "DOMINANCE TERM",
              badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/40",
              details: [
                { label: "Status", value: dominanceEnabled ? "Active (On)" : "Disabled (Off)", color: "#c084fc" },
                { label: "Interaction term", value: "β_d = +0.25", color: "#94a3b8" },
              ],
            });
          }}
          onMouseLeave={() => setTooltip(null)}
        >
          <div className="flex items-center justify-between text-[10.5px] mb-1">
            <span className="text-slate-300">Dominance Effect</span>
            <button
              onClick={() => setDominanceEnabled(!dominanceEnabled)}
              className={`px-2 py-0.5 rounded border text-[10px] font-mono transition-colors ${
                dominanceEnabled
                  ? "bg-purple-950/70 border-purple-500/50 text-purple-300"
                  : "bg-slate-900 border-slate-700 text-slate-500"
              }`}
            >
              {dominanceEnabled ? "0.6 (On)" : "Off"}
            </button>
          </div>
          <div
            onClick={() => setDominanceEnabled(!dominanceEnabled)}
            className="w-full h-1.5 bg-slate-800 rounded-lg overflow-hidden cursor-pointer"
          >
            <div
              className={`h-full transition-all ${
                dominanceEnabled ? "w-3/5 bg-gradient-to-r from-purple-500 to-indigo-400" : "w-0"
              }`}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
