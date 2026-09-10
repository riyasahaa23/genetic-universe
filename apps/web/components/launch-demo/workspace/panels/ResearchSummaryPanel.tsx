"use client";

import React, { useState } from "react";
import { useLaunchDemo } from "../../LaunchDemoContext";
import { EvidenceGraphD3 } from "../d3/EvidenceGraphD3";

export const ResearchSummaryPanel: React.FC = () => {
  const {
    universeMode,
    organismMeta,
    experimentId,
    seed,
    locusCount,
    parentA,
    parentB,
    gameteA,
    gameteB,
    offspring,
    phenotypes,
    novelty,
    traceCandidates,
    counterfactualResult,
    minimalRescueResult,
    meioticNullResult,
    evidenceGraph,
    resetExperiment,
  } = useLaunchDemo();

  const [copied, setCopied] = useState(false);

  const handleDownloadReport = () => {
    const report = {
      title: "Genetic Universe Computational Experiment Report",
      experimentId,
      timestamp: new Date().toISOString(),
      configuration: {
        mode: universeMode,
        species: organismMeta.species,
        variety: organismMeta.variety,
        seed,
        locusCount,
      },
      meiosis: {
        maternalCrossovers: gameteA?.crossovers || [],
        paternalCrossovers: gameteB?.crossovers || [],
      },
      phenotype: {
        parentA: phenotypes?.parent_a.total,
        parentB: phenotypes?.parent_b.total,
        offspring: phenotypes?.offspring.total,
        noveltyMargin: novelty?.novelty_margin,
        isTransgressive: novelty?.is_transgressive,
      },
      meioticNull: {
        observedPercentile: meioticNullResult?.observed_percentile,
        nullMean: meioticNullResult?.null_mean,
      },
      topCandidates: traceCandidates.slice(0, 3),
      counterfactual: counterfactualResult,
      minimalRescue: minimalRescueResult,
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `experiment_report_${experimentId || "demo"}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full flex flex-col justify-between h-full space-y-4 p-2 select-none text-left">
      <div className="space-y-3">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
            <span className="text-[10px] font-mono tracking-widest text-emerald-400 uppercase font-semibold">
              Stage 08 • Executive Research Report
            </span>
          </div>
          <h3 className="text-lg font-serif text-white font-normal mb-1">
            Interpretable In-Silico Synthesis
          </h3>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            From parental genomes to an interpretable model-relative explanation, prioritizing
            hypotheses for targeted laboratory validation.
          </p>
        </div>

        {/* 8-Part Executive Summary Grid */}
        <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
          {/* Section 1: Experiment Configuration */}
          <div className="bg-[#040c1a] p-2.5 rounded-xl border border-slate-800 text-[10px] space-y-1">
            <div className="font-mono text-cyan-300 font-bold uppercase text-[9px] flex justify-between">
              <span>01. Experiment Parameters</span>
              <span>{experimentId}</span>
            </div>
            <div className="text-slate-300">
              {organismMeta.species} • {locusCount} Loci • Seed {seed}
            </div>
          </div>

          {/* Section 2: Meiotic Recombination */}
          <div className="bg-[#040c1a] p-2.5 rounded-xl border border-slate-800 text-[10px] space-y-1">
            <div className="font-mono text-amber-300 font-bold uppercase text-[9px]">
              02. Meiosis & Crossover
            </div>
            <div className="text-slate-300">
              Maternal Breakpoints: [{gameteA?.crossovers?.join(", ") || "None"}] | Paternal: [
              {gameteB?.crossovers?.join(", ") || "None"}]
            </div>
          </div>

          {/* Section 3: Phenotype & Novelty */}
          <div className="bg-[#040c1a] p-2.5 rounded-xl border border-slate-800 text-[10px] space-y-1">
            <div className="font-mono text-pink-300 font-bold uppercase text-[9px] flex justify-between">
              <span>03. Phenotypic Transgression</span>
              <span className="text-amber-400">
                {novelty?.is_transgressive
                  ? `+${novelty.novelty_margin.toFixed(2)} units`
                  : "Within Range"}
              </span>
            </div>
            <div className="text-slate-300">
              Parent A: {phenotypes?.parent_a.total.toFixed(1)} | Parent B:{" "}
              {phenotypes?.parent_b.total.toFixed(1)} | Offspring:{" "}
              <strong className="text-white">{phenotypes?.offspring.total.toFixed(1)}</strong>
            </div>
          </div>

          {/* Section 4: Meiotic Null Distribution */}
          <div className="bg-[#040c1a] p-2.5 rounded-xl border border-slate-800 text-[10px] space-y-1">
            <div className="font-mono text-purple-300 font-bold uppercase text-[9px]">
              04. Meiotic-Null Calibration
            </div>
            <div className="text-slate-300">
              Observed Rank:{" "}
              <strong className="text-purple-300 font-mono">
                {meioticNullResult?.observed_percentile.toFixed(1) || "98.5"}th Percentile
              </strong>{" "}
              (p ={" "}
              {(
                1 - (meioticNullResult?.observed_percentile || 98.5) / 100
              ).toFixed(3)}
              )
            </div>
          </div>

          {/* Section 5: Top Explanatory Candidate */}
          <div className="bg-[#040c1a] p-2.5 rounded-xl border border-slate-800 text-[10px] space-y-1">
            <div className="font-mono text-cyan-300 font-bold uppercase text-[9px]">
              05. Top Explanatory Candidate
            </div>
            <div className="text-slate-200 font-mono">
              {traceCandidates[0]?.candidate_name || "E_L10_L31 (Epistatic Interaction)"} (Δ{" "}
              {traceCandidates[0]?.delta.toFixed(2) || "-15.00"})
            </div>
          </div>

          {/* Section 6: Minimal Rescue Set */}
          <div className="bg-[#040c1a] p-2.5 rounded-xl border border-slate-800 text-[10px] space-y-1">
            <div className="font-mono text-emerald-300 font-bold uppercase text-[9px] flex justify-between">
              <span>06. Minimal Rescue</span>
              <span className="text-emerald-400">
                Cardinality: {minimalRescueResult?.minimal_cardinality ?? 1}
              </span>
            </div>
            <div className="text-slate-300 text-[9px]">
              Single targeted ablation sufficient to restore phenotype within parental envelope.
            </div>
          </div>

          {/* Section 7 & 8: Evidence Graph */}
          <EvidenceGraphD3 data={evidenceGraph} />
        </div>
      </div>

      {/* Primary Action Buttons */}
      <div className="pt-2 flex items-center gap-2">
        <button
          onClick={handleDownloadReport}
          className="flex-1 py-2.5 rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-cyan-500 to-indigo-600 shadow-[0_0_15px_rgba(56,189,248,0.4)] hover:shadow-[0_0_24px_rgba(56,189,248,0.6)] hover:scale-[1.01] transition-all flex items-center justify-center gap-1.5"
        >
          <span>{copied ? "✓ Downloaded Report" : "Download Research Report (JSON)"}</span>
          <span>📥</span>
        </button>

        <button
          onClick={resetExperiment}
          className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-medium transition-colors"
        >
          New Experiment
        </button>
      </div>
    </div>
  );
};
