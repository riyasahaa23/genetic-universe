"use client";

import React from "react";
import { useLaunchDemo } from "../../LaunchDemoContext";
import { PhenotypeEnvelopeD3 } from "../d3/PhenotypeEnvelopeD3";
import { MeioticNullDistributionD3 } from "../d3/MeioticNullDistributionD3";

export const PhenotypeEnginePanel: React.FC = () => {
  const {
    phenotypes,
    novelty,
    meioticNullResult,
    executeStep7MeioticNull,
    executeStep6Trace,
    isRunning,
  } = useLaunchDemo();

  return (
    <div className="w-full flex flex-col justify-between h-full space-y-4 p-2 select-none text-left">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#38bdf8]" />
          <span className="text-[10px] font-mono tracking-widest text-cyan-400 uppercase font-semibold">
            Stage 05 • Phenotype Engine & Novelty
          </span>
        </div>
        <h3 className="text-lg font-serif text-white font-normal mb-1">
          Phenotypic Transgression Analysis
        </h3>
        <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
          Decomposing genetic effects into additive, dominance, and higher-order epistatic
          interactions relative to the parental phenotypic envelope.
        </p>

        {/* Parental Envelope Visual */}
        <div className="mb-3">
          <PhenotypeEnvelopeD3 phenotypes={phenotypes} novelty={novelty} />
        </div>

        {/* Empirical Meiotic Null Distribution */}
        <MeioticNullDistributionD3
          nullResult={meioticNullResult}
          onSimulateMore={() => executeStep7MeioticNull(200)}
          isLoading={isRunning}
        />
      </div>

      {/* Primary CTA */}
      <div className="pt-2">
        <button
          onClick={executeStep6Trace}
          disabled={isRunning}
          className="w-full py-3 rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-pink-500 via-purple-600 to-cyan-500 shadow-[0_0_20px_rgba(236,72,153,0.4)] hover:shadow-[0_0_28px_rgba(236,72,153,0.6)] hover:scale-[1.01] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <span>{isRunning ? "Executing Trace..." : "Trace Novelty to Candidate Mechanisms"}</span>
          <span>🔍</span>
        </button>
      </div>
    </div>
  );
};
