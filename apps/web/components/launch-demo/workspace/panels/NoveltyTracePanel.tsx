"use client";

import React from "react";
import { useLaunchDemo } from "../../LaunchDemoContext";

export const NoveltyTracePanel: React.FC = () => {
  const {
    traceCandidates,
    selectedCandidate,
    setSelectedCandidate,
    executeStep7Counterfactual,
    isRunning,
  } = useLaunchDemo();

  return (
    <div className="w-full flex flex-col justify-between h-full space-y-4 p-2 select-none text-left">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#38bdf8]" />
          <span className="text-[10px] font-mono tracking-widest text-cyan-400 uppercase font-semibold">
            Stage 06 • Novelty Trace & Attribution
          </span>
        </div>
        <h3 className="text-lg font-serif text-white font-normal mb-1">
          Candidate Mechanism Ranking
        </h3>
        <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
          Backward causal search identifying candidate interactions and recombinant segments
          ranked by attribution score and counterfactual effect.
        </p>

        {/* Candidate List Table */}
        <div className="bg-[#050e20]/80 rounded-xl border border-slate-800/80 overflow-hidden mb-3">
          <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900/60 border-b border-slate-800 text-[8.5px] font-mono uppercase text-slate-400">
            <span className="w-28">Candidate</span>
            <span className="w-16 text-center">Type</span>
            <span className="w-14 text-right">Delta</span>
            <span className="w-14 text-right">Score</span>
          </div>

          <div className="max-h-52 overflow-y-auto divide-y divide-slate-800/50">
            {traceCandidates.length === 0 ? (
              <div className="p-3 text-center text-xs text-slate-500 italic">
                No candidates identified.
              </div>
            ) : (
              traceCandidates.map((cand, idx) => {
                const isSelected = selectedCandidate?.candidate_id === cand.candidate_id;
                return (
                  <div
                    key={cand.candidate_id}
                    onClick={() => setSelectedCandidate(cand)}
                    className={`flex items-center justify-between px-3 py-2 text-[10px] cursor-pointer transition-all ${
                      isSelected
                        ? "bg-cyan-950/70 border-l-2 border-cyan-400 text-white font-semibold"
                        : "hover:bg-slate-800/40 text-slate-300"
                    }`}
                  >
                    <div className="w-28 truncate font-mono">
                      <span className="text-cyan-400 mr-1.5 font-bold">#{idx + 1}</span>
                      <span>{cand.candidate_name}</span>
                    </div>
                    <div className="w-16 text-center">
                      <span className="px-1.5 py-0.2 rounded text-[8px] font-mono uppercase bg-slate-800 border border-slate-700 text-slate-300">
                        {cand.candidate_type}
                      </span>
                    </div>
                    <div className="w-14 text-right font-mono text-pink-400">
                      {cand.delta > 0 ? `+${cand.delta.toFixed(1)}` : cand.delta.toFixed(1)}
                    </div>
                    <div className="w-14 text-right font-mono text-cyan-300 font-bold">
                      {cand.attribution_score?.toFixed(2) || "1.00"}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Selected Candidate Inspector */}
        {selectedCandidate && (
          <div className="bg-[#040c1c]/90 rounded-xl p-3 border border-cyan-500/30 text-[10px] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white font-mono">
                {selectedCandidate.candidate_name}
              </span>
              <span className="px-2 py-0.2 rounded bg-cyan-500/20 text-cyan-300 text-[9px] font-mono font-semibold">
                Attribution: {selectedCandidate.attribution_score?.toFixed(2) || "1.00"}
              </span>
            </div>
            <p className="text-slate-400 text-[9px] leading-tight">
              {selectedCandidate.provenance_summary ||
                "Recombinant locus configuration formed via homologous crossover."}
            </p>
          </div>
        )}
      </div>

      {/* Primary CTA */}
      <div className="pt-2">
        <button
          onClick={() => executeStep7Counterfactual()}
          disabled={isRunning || !selectedCandidate}
          className="w-full py-3 rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_28px_rgba(168,85,247,0.6)] hover:scale-[1.01] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <span>{isRunning ? "Evaluating Rescue..." : "Test In-Silico Counterfactual Rescue"}</span>
          <span>🛡</span>
        </button>
      </div>
    </div>
  );
};
