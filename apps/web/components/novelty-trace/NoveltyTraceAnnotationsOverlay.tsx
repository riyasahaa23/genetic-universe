"use client";

import React from "react";
import { useNoveltyTrace } from "./interactions/NoveltyTraceInteractionContext";

export const NoveltyTraceAnnotationsOverlay: React.FC = () => {
  const {
    activeWorkflowStep,
    candidates,
    selectedCandidateId,
    setSelectedCandidateId,
    selectedCandidate,
    hoveredCandidateId,
    setHoveredCandidateId,
    setTooltip,
    parentA,
    parentB,
    parentRange,
    observedPhenotype,
    noveltyMargin,
    searchSpace,
  } = useNoveltyTrace();

  return (
    <div className="absolute inset-0 pointer-events-none z-10 select-none">
      {/* ==================================================== */}
      {/* STAGE 1: PHENOTYPE INPUT OVERLAY                     */}
      {/* ==================================================== */}
      {activeWorkflowStep === 1 && (
        <>
          {/* Center Label below Sphere */}
          <div className="absolute top-[34%] left-1/2 -translate-x-1/2 text-center pointer-events-auto transition-all duration-300">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/50 text-amber-300 text-[10px] font-mono font-bold mb-1 shadow-[0_0_12px_rgba(251,191,36,0.3)]">
              <span>●</span>
              <span>TRANSGRESSIVE PHENOTYPE DETECTED</span>
            </div>
            <h3 className="text-sm font-bold text-white tracking-wide font-sans">
              Observed Offspring Phenotype
            </h3>
            <p className="text-[10px] text-slate-400 font-medium leading-tight">
              Value exceeds upper boundary of parental range [{parentRange.min.toFixed(1)}, +{parentRange.max.toFixed(1)}]
            </p>
          </div>

          {/* Left Reference Card: Parent A & Parent B */}
          <div className="absolute top-[10%] left-[4%] bg-[#070e20]/85 border border-slate-800/80 rounded-xl p-3 shadow-[0_8px_32px_rgba(0,0,0,0.6)] backdrop-blur-md max-w-[170px] text-left pointer-events-auto">
            <span className="text-[8.5px] font-mono uppercase tracking-wider text-slate-400 block border-b border-slate-800/60 pb-1 mb-1.5">
              Parental Baseline
            </span>
            <div className="space-y-1.5 text-[9px]">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-cyan-300">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  {parentA.name}
                </span>
                <span className="font-mono font-bold text-slate-200">{parentA.phenotype.toFixed(1)} SD</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-pink-300">
                  <span className="w-2 h-2 rounded-full bg-pink-400" />
                  {parentB.name}
                </span>
                <span className="font-mono font-bold text-slate-200">+{parentB.phenotype.toFixed(1)} SD</span>
              </div>
              <div className="pt-1 border-t border-slate-800/60 flex items-center justify-between text-slate-400">
                <span>Envelope</span>
                <span className="font-mono text-cyan-400">[{parentRange.min.toFixed(1)}, +{parentRange.max.toFixed(1)}]</span>
              </div>
            </div>
          </div>

          {/* Right Trait Card: Offspring Novelty */}
          <div className="absolute top-[10%] right-[4%] bg-[#070e20]/85 border border-amber-500/50 rounded-xl p-3 shadow-[0_8px_32px_rgba(251,191,36,0.15)] backdrop-blur-md max-w-[185px] text-left pointer-events-auto">
            <span className="text-[9px] text-slate-400 font-medium block">
              Observed Trait Value
            </span>
            <div className="text-2xl font-bold font-mono text-amber-300 my-0.5 tracking-tight drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]">
              +{observedPhenotype.toFixed(1)} SD
            </div>
            <div className="flex items-center justify-between text-[9px] pt-1 border-t border-slate-800/60">
              <span className="text-slate-400">Novelty Margin:</span>
              <span className="font-mono font-bold text-amber-400">+{noveltyMargin.toFixed(1)} SD</span>
            </div>
            <p className="text-[8.5px] text-slate-400 leading-snug mt-1">
              Supralinear deviation requires backward genomic candidate search.
            </p>
          </div>

          {/* Bottom Guidance Banner */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-[#050b18]/90 border border-slate-800/80 rounded-xl px-4 py-2 text-center pointer-events-auto backdrop-blur-md shadow-lg">
            <p className="text-[10px] text-slate-300">
              <span className="text-cyan-400 font-semibold">STAGE 1 QUESTION: </span>
              &ldquo;What unexpected phenotype are we trying to explain?&rdquo;
            </p>
            <span className="text-[8.5px] text-slate-500 block mt-0.5">
              Click &lsquo;Trace Inference&rsquo; above to search genomic state for causal explanations.
            </span>
          </div>
        </>
      )}

      {/* ==================================================== */}
      {/* STAGE 2: TRACE INFERENCE OVERLAY                     */}
      {/* ==================================================== */}
      {activeWorkflowStep === 2 && (
        <>
          {/* Center Label below Sphere */}
          <div className="absolute top-[26%] left-1/2 -translate-x-1/2 text-center pointer-events-auto">
            <h3 className="text-[12px] font-bold text-cyan-300 tracking-wide font-sans flex items-center justify-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              Backward Inference Scanning
            </h3>
            <p className="text-[9.5px] text-slate-400 font-medium leading-tight">
              Tracing backward from phenotype to evaluate {searchSpace.totalEvaluated} candidate configurations
            </p>
          </div>

          {/* Floating Search Status Card */}
          <div className="absolute top-[10%] right-[4%] bg-[#070e20]/85 border border-cyan-500/50 rounded-xl p-3 shadow-[0_8px_32px_rgba(56,189,248,0.2)] backdrop-blur-md max-w-[185px] text-left pointer-events-auto">
            <div className="flex items-center justify-between border-b border-slate-800/60 pb-1 mb-1.5">
              <span className="text-[8.5px] font-mono uppercase tracking-wider text-cyan-300">
                Search Space
              </span>
              <span className="text-[8px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                100% COMPLETE
              </span>
            </div>
            <div className="space-y-1 text-[9px]">
              <div className="flex justify-between">
                <span className="text-slate-400">Variant Loci:</span>
                <span className="font-mono text-slate-200 font-bold">{searchSpace.variantsCount} evaluated</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Segments:</span>
                <span className="font-mono text-slate-200 font-bold">{searchSpace.segmentsCount} blocks</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Epistatic Pairs:</span>
                <span className="font-mono text-cyan-300 font-bold">{searchSpace.interactionsCount} pairs</span>
              </div>
            </div>
          </div>

          {/* Bottom Candidate Discovery Regions */}
          <div className="absolute top-[68%] left-[8%] right-[8%] bottom-2 flex items-start justify-between pointer-events-auto">
            <div className="bg-[#070d1d]/85 border border-cyan-500/40 rounded-lg p-2 text-center w-36 shadow-[0_0_12px_rgba(56,189,248,0.15)]">
              <span className="text-[9px] font-mono text-cyan-400 font-bold block">Region A (Locus 72.4)</span>
              <span className="text-[8px] text-slate-400 block mt-0.5">Scanning Epistatic Interaction</span>
              <div className="mt-1 w-full bg-slate-900 rounded-full h-1 overflow-hidden">
                <div className="bg-cyan-400 h-full w-4/5 animate-pulse" />
              </div>
            </div>
            <div className="bg-[#070d1d]/85 border border-purple-500/40 rounded-lg p-2 text-center w-36 shadow-[0_0_12px_rgba(168,85,247,0.15)]">
              <span className="text-[9px] font-mono text-purple-400 font-bold block">Region B (Segment 66–160)</span>
              <span className="text-[8px] text-slate-400 block mt-0.5">Evaluating Crossover Block</span>
              <div className="mt-1 w-full bg-slate-900 rounded-full h-1 overflow-hidden">
                <div className="bg-purple-400 h-full w-3/4 animate-pulse" />
              </div>
            </div>
            <div className="bg-[#070d1d]/85 border border-pink-500/40 rounded-lg p-2 text-center w-36 shadow-[0_0_12px_rgba(236,72,153,0.15)]">
              <span className="text-[9px] font-mono text-pink-400 font-bold block">Region C (Locus 164.2)</span>
              <span className="text-[8px] text-slate-400 block mt-0.5">Scanning Rare Heterozygous Variant</span>
              <div className="mt-1 w-full bg-slate-900 rounded-full h-1 overflow-hidden">
                <div className="bg-pink-400 h-full w-2/3 animate-pulse" />
              </div>
            </div>
          </div>
        </>
      )}

      {/* ==================================================== */}
      {/* STAGE 3: CANDIDATE CONFIGURATIONS OVERLAY             */}
      {/* ==================================================== */}
      {activeWorkflowStep === 3 && (
        <>
          {/* Center Label below Sphere */}
          <div className="absolute top-[26%] left-1/2 -translate-x-1/2 text-center pointer-events-auto">
            <h3 className="text-[12px] font-bold text-white tracking-wide font-sans">
              Ranked Candidate Configurations
            </h3>
            <p className="text-[9.5px] text-slate-400 font-medium leading-tight">
              Ranked by model attribution score under counterfactual ablation
            </p>
          </div>

          {/* Floating Trait Card */}
          <div className="absolute top-[12%] right-[4%] bg-[#070e20]/85 border border-slate-800/80 rounded-xl p-3 shadow-[0_8px_32px_rgba(0,0,0,0.6)] backdrop-blur-md max-w-[175px] text-left pointer-events-auto">
            <span className="text-[9px] text-slate-400 font-medium block">
              Top Ranked Candidate
            </span>
            <div className="text-lg font-bold font-mono text-amber-300 my-0.5 tracking-tight drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]">
              Candidate 1 (0.82)
            </div>
            <p className="text-[8.5px] text-slate-400 leading-snug">
              Eliminates +1.7 SD novelty upon in-silico ablation
            </p>
          </div>

          {/* Lower: Candidate Cards */}
          <div className="absolute top-[66%] left-[12%] right-[5%] bottom-1 flex items-start justify-between pointer-events-auto">
            {candidates.slice(0, 3).map((candidate, idx) => {
              const isSelected = selectedCandidateId === candidate.id;
              const isHovered = hoveredCandidateId === candidate.id;

              return (
                <div
                  key={candidate.id}
                  onClick={() => setSelectedCandidateId(candidate.id)}
                  onMouseEnter={(e) => {
                    setHoveredCandidateId(candidate.id);
                    setTooltip({
                      visible: true,
                      x: e.clientX,
                      y: e.clientY,
                      title: `${candidate.name}: ${candidate.keyMechanism}`,
                      subtitle: `Attribution Score: ${candidate.score.toFixed(2)}`,
                      badge: isSelected ? "SELECTED EXPLANATION" : "CANDIDATE",
                      badgeColor: isSelected
                        ? "bg-amber-500/20 text-amber-300 border-amber-500/50"
                        : "bg-cyan-500/20 text-cyan-300 border-cyan-500/50",
                      details: [
                        { label: "Primary mechanism", value: candidate.keyMechanism, color: "#38bdf8" },
                        { label: "Counterfactual delta", value: `-${candidate.delta.toFixed(1)}`, color: "#fbbf24" },
                        { label: "Novelty removed", value: candidate.noveltyRemoved ? "Yes" : "Partial", color: candidate.noveltyRemoved ? "#4ade80" : "#94a3b8" },
                      ],
                    });
                  }}
                  onMouseLeave={() => {
                    setHoveredCandidateId(null);
                    setTooltip(null);
                  }}
                  className="flex flex-col items-center cursor-pointer group w-36 transition-transform"
                >
                  <span
                    className={`text-[11.5px] font-semibold tracking-wide transition-colors ${
                      isSelected
                        ? "text-white font-bold"
                        : "text-slate-300 group-hover:text-white"
                    }`}
                  >
                    {candidate.name}
                  </span>

                  <div
                    className={`px-2.5 py-0.5 mt-0.5 rounded text-[9.5px] font-mono font-medium transition-all ${
                      isSelected
                        ? "bg-[#18233c] text-amber-300 border border-amber-500/70 shadow-[0_0_10px_rgba(251,191,36,0.3)]"
                        : "bg-[#0b142c] text-slate-400 border border-slate-700/80 group-hover:border-cyan-500/50"
                    }`}
                  >
                    Score: <span className="font-bold">{candidate.score.toFixed(2)}</span>
                  </div>

                  {/* Mechanism Mini Graph */}
                  <div className="mt-1.5 flex flex-col items-center">
                    {idx === 0 && (
                      <div className="w-12 h-10 flex items-center justify-center relative">
                        <svg viewBox="0 0 48 36" className="w-full h-full">
                          <polygon
                            points="24,6 10,30 38,30"
                            fill="none"
                            stroke="#fbbf24"
                            strokeWidth="1.2"
                            strokeOpacity="0.8"
                          />
                          <line x1="24" y1="6" x2="24" y2="22" stroke="#38bdf8" strokeWidth="1" />
                          <circle cx="24" cy="6" r="3" fill="#fbbf24" filter="drop-shadow(0 0 4px #fbbf24)" />
                          <circle cx="10" cy="30" r="3" fill="#38bdf8" />
                          <circle cx="38" cy="30" r="3" fill="#ec4899" />
                          <circle cx="24" cy="22" r="2.5" fill="#ffffff" />
                        </svg>
                      </div>
                    )}
                    {idx === 1 && (
                      <div className="w-12 h-10 flex items-center justify-center relative">
                        <svg viewBox="0 0 48 36" className="w-full h-full">
                          <line x1="10" y1="18" x2="38" y2="18" stroke="#38bdf8" strokeWidth="1.5" />
                          <line x1="18" y1="8" x2="30" y2="28" stroke="#ec4899" strokeWidth="1.5" />
                          <circle cx="10" cy="18" r="2.5" fill="#38bdf8" />
                          <circle cx="38" cy="18" r="2.5" fill="#38bdf8" />
                          <circle cx="24" cy="18" r="3.5" fill="#38bdf8" filter="drop-shadow(0 0 4px #38bdf8)" />
                          <circle cx="18" cy="8" r="2.5" fill="#ec4899" />
                          <circle cx="30" cy="28" r="2.5" fill="#ec4899" />
                        </svg>
                      </div>
                    )}
                    {idx === 2 && (
                      <div className="w-12 h-10 flex items-center justify-center relative">
                        <svg viewBox="0 0 48 36" className="w-full h-full">
                          <circle cx="24" cy="18" r="3.5" fill="#ec4899" filter="drop-shadow(0 0 4px #ec4899)" />
                          <line x1="24" y1="18" x2="14" y2="10" stroke="#a855f7" strokeWidth="1" />
                          <line x1="24" y1="18" x2="34" y2="10" stroke="#a855f7" strokeWidth="1" />
                          <line x1="24" y1="18" x2="24" y2="30" stroke="#a855f7" strokeWidth="1" />
                          <circle cx="14" cy="10" r="2" fill="#38bdf8" />
                          <circle cx="34" cy="10" r="2" fill="#38bdf8" />
                          <circle cx="24" cy="30" r="2" fill="#fbbf24" />
                        </svg>
                      </div>
                    )}
                    <p className="text-[8.5px] text-slate-400 text-center leading-tight whitespace-pre-line mt-0.5">
                      {candidate.mechanismShort}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ==================================================== */}
      {/* STAGE 4: MECHANISM ANALYSIS OVERLAY                  */}
      {/* ==================================================== */}
      {activeWorkflowStep === 4 && (
        <>
          {/* Center Label below Sphere */}
          <div className="absolute top-[26%] left-1/2 -translate-x-1/2 text-center pointer-events-auto">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 text-[9px] font-mono font-semibold mb-1">
              <span>✓</span>
              <span>NOVELTY RESCUED UNDER COUNTERFACTUAL INTERVENTION</span>
            </div>
            <h3 className="text-sm font-bold text-white tracking-wide font-sans">
              Mechanistic Provenance Chain
            </h3>
            <p className="text-[9.5px] text-slate-300 font-medium leading-tight">
              Traced from {selectedCandidate.parentOrigin} through crossover interval to epistatic driver
            </p>
          </div>

          {/* Floating Mechanism Metrics Card */}
          <div className="absolute top-[10%] right-[4%] bg-[#070e20]/90 border border-amber-500/60 rounded-xl p-3 shadow-[0_8px_32px_rgba(251,191,36,0.2)] backdrop-blur-md max-w-[195px] text-left pointer-events-auto">
            <span className="text-[8.5px] font-mono text-cyan-400 font-bold uppercase block border-b border-slate-800/60 pb-1 mb-1.5">
              Attribution Analysis
            </span>
            <div className="space-y-1 text-[8.5px]">
              <div className="flex justify-between">
                <span className="text-slate-400">Driver Loci:</span>
                <span className="font-mono text-slate-200">72.4 × 118.9 Mb</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Interaction Edge Δ:</span>
                <span className="font-mono text-amber-300 font-bold">-1.70 SD</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Epistatic Excess:</span>
                <span className="font-mono text-emerald-400 font-bold">+0.92 SD</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Synergy Direction:</span>
                <span className="font-mono text-cyan-300">Positive Synergy</span>
              </div>
              <div className="pt-1 border-t border-slate-800/60 flex justify-between text-emerald-400 font-semibold">
                <span>Rescued Trait:</span>
                <span className="font-mono">+{selectedCandidate.counterfactualPhenotype.toFixed(2)} SD</span>
              </div>
            </div>
          </div>

          {/* Bottom Provenance Milestones Trail */}
          <div className="absolute bottom-3 left-[6%] right-[6%] bg-[#040916]/90 border border-slate-800/80 rounded-xl px-3 py-2 flex items-center justify-between pointer-events-auto backdrop-blur-md shadow-lg text-[9px] font-mono">
            <div className="flex items-center gap-1.5 text-cyan-300">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span>Parent A × B Haplotypes</span>
            </div>
            <span className="text-slate-600">→</span>
            <div className="flex items-center gap-1.5 text-pink-300">
              <span className="w-1.5 h-1.5 rounded-full bg-pink-400" />
              <span>Crossover (40–46 Mb)</span>
            </div>
            <span className="text-slate-600">→</span>
            <div className="flex items-center gap-1.5 text-amber-300 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>Cis-Assembly (Locus A × B)</span>
            </div>
            <span className="text-slate-600">→</span>
            <div className="flex items-center gap-1.5 text-emerald-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Phenotype Overshoot (+2.1 SD)</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
