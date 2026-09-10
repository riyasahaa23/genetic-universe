"use client";

import React from "react";
import { useLaunchDemo } from "../../LaunchDemoContext";

export const ConfigurationPanel: React.FC = () => {
  const {
    universeMode,
    organismMeta,
    setOrganismMeta,
    seed,
    setSeed,
    locusCount,
    setLocusCount,
    initExperiment,
    isRunning,
  } = useLaunchDemo();

  const plantSpecies = [
    "Arabidopsis thaliana",
    "Oryza sativa",
    "Zea mays",
    "Solanum lycopersicum",
  ];

  const animalSpecies = [
    "Mus musculus",
    "Drosophila melanogaster",
    "Danio rerio",
    "Bos taurus",
  ];

  const speciesOptions =
    universeMode === "plant"
      ? plantSpecies
      : universeMode === "animal"
      ? animalSpecies
      : ["Homo sapiens (Synthetic Research Trio)"];

  return (
    <div className="w-full flex flex-col justify-between h-full space-y-4 p-2 select-none text-left">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#38bdf8]" />
          <span className="text-[10px] font-mono tracking-widest text-cyan-400 uppercase font-semibold">
            Stage 01 • Experiment Configuration
          </span>
        </div>
        <h3 className="text-lg font-serif text-white font-normal mb-1">
          Configure Computational Genome Chamber
        </h3>
        <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
          Establish deterministic parameters for homologous chromosome synthesis, recombination
          frequency, and epistatic trait architecture.
        </p>

        {/* Form Controls */}
        <div className="space-y-3.5 bg-[#040916]/80 p-3.5 rounded-xl border border-slate-800/80">
          {/* Species Selector */}
          <div>
            <label className="block text-[10px] font-mono text-slate-400 mb-1 uppercase">
              Species Context
            </label>
            <select
              value={organismMeta.species}
              onChange={(e) => setOrganismMeta({ species: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-cyan-300 font-sans focus:outline-none focus:border-cyan-500 transition-colors"
            >
              {speciesOptions.map((sp) => (
                <option key={sp} value={sp}>
                  {sp}
                </option>
              ))}
            </select>
          </div>

          {/* Variety / Strain / Population Context */}
          <div>
            <label className="block text-[10px] font-mono text-slate-400 mb-1 uppercase">
              {universeMode === "human"
                ? "Population / Ancestry Context (Optional Metadata)"
                : universeMode === "plant"
                ? "Cultivar / Variety Lineage"
                : "Breed / Strain Lineage"}
            </label>
            <input
              type="text"
              value={organismMeta.variety}
              onChange={(e) => setOrganismMeta({ variety: e.target.value })}
              placeholder="e.g. Col-0 x Ler or Inbred Cross"
              className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-sans"
            />
            {universeMode === "human" && (
              <span className="text-[8.5px] text-slate-500 italic block mt-0.5">
                Descriptive metadata only. Non-causal; ancestry does not predict traits.
              </span>
            )}
          </div>

          {/* Seed Stepper & Locus Count Slider */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-mono text-slate-400 mb-1 uppercase">
                RNG Seed
              </label>
              <input
                type="number"
                value={seed}
                onChange={(e) => setSeed(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-cyan-300 font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[10px] font-mono text-slate-400 uppercase">
                  Loci: <strong className="text-white">{locusCount}</strong>
                </label>
              </div>
              <input
                type="range"
                min={20}
                max={100}
                step={5}
                value={locusCount}
                onChange={(e) => setLocusCount(parseInt(e.target.value))}
                className="w-full accent-cyan-400 h-1 bg-slate-800 rounded cursor-pointer mt-2"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Primary Action Button */}
      <div className="pt-2">
        <button
          onClick={initExperiment}
          disabled={isRunning}
          className="w-full py-3 rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 shadow-[0_0_20px_rgba(56,189,248,0.4)] hover:shadow-[0_0_28px_rgba(56,189,248,0.6)] hover:scale-[1.01] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <span>{isRunning ? "Synthesizing Genomes..." : "Initialize Experiment"}</span>
          <span>→</span>
        </button>
      </div>
    </div>
  );
};
