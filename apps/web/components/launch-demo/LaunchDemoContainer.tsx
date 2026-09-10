"use client";

import React from "react";
import { useLaunchDemo } from "./LaunchDemoContext";
import { UniverseSelectionModal } from "./universe-selection/UniverseSelectionModal";
import { LaunchDemoHeader } from "./workspace/LaunchDemoHeader";
import { StageProgressArc } from "./workspace/StageProgressArc";
import { ExperimentScene3D } from "./workspace/scene/ExperimentScene3D";
import { AuditTrailDrawer } from "./workspace/audit/AuditTrailDrawer";

// Left & Right Panels
import { ConfigurationPanel } from "./workspace/panels/ConfigurationPanel";
import { ParentalGenomesPanel } from "./workspace/panels/ParentalGenomesPanel";
import { MeiosisMetricsPanel } from "./workspace/panels/MeiosisMetricsPanel";
import { OffspringGenomicsPanel } from "./workspace/panels/OffspringGenomicsPanel";
import { PhenotypeEnginePanel } from "./workspace/panels/PhenotypeEnginePanel";
import { NoveltyTracePanel } from "./workspace/panels/NoveltyTracePanel";
import { CounterfactualRescuePanel } from "./workspace/panels/CounterfactualRescuePanel";
import { ResearchSummaryPanel } from "./workspace/panels/ResearchSummaryPanel";

// D3 visual components
import { HaplotypeTrackD3 } from "./workspace/d3/HaplotypeTrackD3";
import { PhenotypeEnvelopeD3 } from "./workspace/d3/PhenotypeEnvelopeD3";
import { MeioticNullDistributionD3 } from "./workspace/d3/MeioticNullDistributionD3";
import { EvidenceGraphD3 } from "./workspace/d3/EvidenceGraphD3";

export const LaunchDemoContainer: React.FC = () => {
  const {
    universeMode,
    currentStage,
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
    executeStep7MeioticNull,
    isRunning,
  } = useLaunchDemo();

  // If no universe is selected, show Entry Screen
  if (!universeMode) {
    return (
      <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col justify-center items-center relative overflow-hidden">
        {/* Ambient Cosmic Background Lighting */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-[15%] left-[25%] w-[550px] h-[550px] bg-cyan-600/10 rounded-full blur-[140px]" />
          <div className="absolute top-[35%] right-[20%] w-[600px] h-[600px] bg-pink-600/10 rounded-full blur-[150px]" />
          <div className="absolute bottom-[15%] left-[35%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[130px]" />
        </div>
        <div className="relative z-10 w-full">
          <UniverseSelectionModal />
        </div>
      </div>
    );
  }

  // Right column dynamic scientific view
  const renderRightPanel = () => {
    switch (currentStage) {
      case 1:
        return (
          <div className="space-y-3 select-none text-left p-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#38bdf8]" />
              <span className="text-[10px] font-mono text-cyan-400 uppercase font-semibold">
                Pre-Screening Laboratory Protocol
              </span>
            </div>
            <h4 className="text-sm font-bold text-white font-sans">
              Computational Hypothesis Prioritization
            </h4>
            <div className="bg-[#050e20]/80 p-3 rounded-xl border border-slate-800 space-y-2 text-[10.5px] text-slate-300">
              <p className="leading-relaxed">
                This environment enables researchers to model meiosis and epistasis in-silico before
                committing resources to empirical validation.
              </p>
              <ul className="space-y-1 text-slate-400 text-[10px]">
                <li className="flex items-center gap-1.5">
                  <span className="text-cyan-400">✓</span>
                  <span>Deterministic seed tracking for exact multi-seed reproducibility</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-cyan-400">✓</span>
                  <span>Evaluator-separated blind attribution framework</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-cyan-400">✓</span>
                  <span>In-silico minimal rescue search across candidate sets</span>
                </li>
              </ul>
            </div>
            <div className="bg-[#030d1a]/80 p-3 rounded-xl border border-cyan-500/20 text-[9.5px] text-slate-400">
              <strong className="text-cyan-300 font-mono block mb-0.5">WET-LAB FIREWALL:</strong>
              Computational experiments narrow candidate search spaces. Final mechanistic proof
              requires empirical molecular assay.
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-3 select-none text-left p-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#38bdf8]" />
              <span className="text-[10px] font-mono text-cyan-400 uppercase font-semibold">
                Parental Allelic Composition
              </span>
            </div>
            <HaplotypeTrackD3 parentA={parentA} parentB={parentB} />
            <div className="bg-[#050e20]/80 p-3 rounded-xl border border-slate-800 text-[10px] text-slate-300 space-y-1">
              <div className="font-mono text-white font-bold uppercase text-[9px]">
                Phase Verification
              </div>
              <p className="leading-tight text-slate-400">
                Haplotypes A1/A2 and B1/B2 represent maternal and paternal phase-resolved homologous
                strands ready for meiotic synapsis.
              </p>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-3 select-none text-left p-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b]" />
              <span className="text-[10px] font-mono text-amber-300 uppercase font-semibold">
                Recombination Segments
              </span>
            </div>
            <div className="bg-[#050e20]/80 p-3 rounded-xl border border-slate-800 space-y-2 text-[10.5px]">
              <div className="flex justify-between border-b border-slate-800 pb-1 text-[9px] font-mono text-slate-400 uppercase">
                <span>Gamete</span>
                <span>Breakpoints</span>
                <span>Segments</span>
              </div>
              <div className="flex justify-between font-mono text-slate-200">
                <span className="text-cyan-300">gA (Maternal)</span>
                <span>[{gameteA?.crossovers?.join(", ") || "None"}]</span>
                <span>{gameteA?.segments?.length || 1}</span>
              </div>
              <div className="flex justify-between font-mono text-slate-200">
                <span className="text-pink-300">gB (Paternal)</span>
                <span>[{gameteB?.crossovers?.join(", ") || "None"}]</span>
                <span>{gameteB?.segments?.length || 1}</span>
              </div>
            </div>
            <div className="bg-[#030d1a]/80 p-3 rounded-xl border border-amber-500/20 text-[9.5px] text-slate-400">
              <strong className="text-amber-300 font-mono block mb-0.5">CHIASMA ARCHITECTURE:</strong>
              Crossed strands exchange physical segments. Each breakpoint creates a novel junction
              that was absent in parental haplotypes.
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-3 select-none text-left p-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" />
              <span className="text-[10px] font-mono text-emerald-300 uppercase font-semibold">
                Offspring Genomic Architecture
              </span>
            </div>
            <div className="bg-[#050e20]/80 p-3 rounded-xl border border-slate-800 space-y-2 text-[10px]">
              <div className="font-mono text-white font-bold uppercase text-[9px]">
                Provenance Tracking
              </div>
              <p className="text-slate-300 leading-tight">
                Every single locus in Offspring {offspring?.offspring_id || "O1"} is indexed with
                parental origin, source homolog, and crossover interval.
              </p>
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800 text-[9px] font-mono">
                <div>Maternal: <strong className="text-cyan-300">50% Dosage</strong></div>
                <div>Paternal: <strong className="text-pink-300">50% Dosage</strong></div>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-3 select-none text-left p-2">
            <PhenotypeEnvelopeD3 phenotypes={phenotypes} novelty={novelty} />
            <MeioticNullDistributionD3
              nullResult={meioticNullResult}
              onSimulateMore={() => executeStep7MeioticNull(200)}
              isLoading={isRunning}
            />
          </div>
        );

      case 6:
        return (
          <div className="space-y-3 select-none text-left p-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_8px_#a855f7]" />
              <span className="text-[10px] font-mono text-purple-300 uppercase font-semibold">
                Attribution Score Distribution
              </span>
            </div>
            <div className="bg-[#050e20]/80 p-3 rounded-xl border border-slate-800 space-y-2 text-[10px]">
              <div className="font-mono text-white font-bold uppercase text-[9px]">
                Top Ranked Hypothesis
              </div>
              <div className="text-cyan-300 font-mono font-semibold">
                {traceCandidates[0]?.candidate_name || "Epistatic Interaction"}
              </div>
              <div className="text-slate-400 text-[9px]">
                Score: {traceCandidates[0]?.attribution_score?.toFixed(2) || "1.00"} • Counterfactual
                Effect: Δ {traceCandidates[0]?.delta.toFixed(2) || "0.00"}
              </div>
            </div>
          </div>
        );

      case 7:
        return (
          <div className="space-y-3 select-none text-left p-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#38bdf8]" />
              <span className="text-[10px] font-mono text-cyan-400 uppercase font-semibold">
                Counterfactual State Delta
              </span>
            </div>
            <PhenotypeEnvelopeD3 phenotypes={phenotypes} novelty={novelty} />
            <div className="bg-[#050e20]/80 p-3 rounded-xl border border-slate-800 text-[10px] space-y-1.5">
              <div className="font-mono text-white font-bold uppercase text-[9px]">
                Minimal Rescue Verification
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Minimal Interventions:</span>
                <strong className="text-cyan-300 font-mono">
                  {minimalRescueResult?.minimal_cardinality ?? 1}
                </strong>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Search Exhaustiveness:</span>
                <span className="font-mono text-amber-300">
                  {minimalRescueResult?.search_is_globally_exhaustive
                    ? "Globally Exhaustive"
                    : "Evaluated Subset"}
                </span>
              </div>
            </div>
          </div>
        );

      case 8:
      default:
        return (
          <div className="space-y-3 select-none text-left p-2">
            <EvidenceGraphD3 data={evidenceGraph} />
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col justify-between relative overflow-hidden select-none">
      {/* Ambient Cosmic Background Lighting */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[10%] left-[20%] w-[550px] h-[550px] bg-cyan-600/10 rounded-full blur-[140px]" />
        <div className="absolute top-[35%] right-[15%] w-[600px] h-[600px] bg-pink-600/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-[10%] left-[40%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[130px]" />
      </div>

      {/* Top Laboratory HUD Header */}
      <LaunchDemoHeader />

      {/* Main 3-Column Laboratory Workspace */}
      <div className="flex-1 w-full max-w-[1720px] mx-auto px-4 py-2 grid grid-cols-12 gap-3 items-stretch relative z-10 min-h-[580px]">
        {/* Left Column: Stage Controls Deck */}
        <div className="col-span-12 lg:col-span-3 bg-[#040817]/90 border border-slate-800/80 rounded-2xl p-3 backdrop-blur-md flex flex-col justify-between shadow-[0_4px_24px_rgba(0,0,0,0.5)] overflow-hidden">
          {currentStage === 1 && <ConfigurationPanel />}
          {currentStage === 2 && <ParentalGenomesPanel />}
          {currentStage === 3 && <MeiosisMetricsPanel />}
          {currentStage === 4 && <OffspringGenomicsPanel />}
          {currentStage === 5 && <PhenotypeEnginePanel />}
          {currentStage === 6 && <NoveltyTracePanel />}
          {currentStage === 7 && <CounterfactualRescuePanel />}
          {currentStage === 8 && <ResearchSummaryPanel />}
        </div>

        {/* Center Column: Dominant 3D Scientific Chamber Visualization */}
        <div className="col-span-12 lg:col-span-6 bg-[#040817]/90 border border-slate-800/80 rounded-2xl p-2 backdrop-blur-md relative overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.5)] min-h-[440px] flex items-center justify-center">
          <ExperimentScene3D />
        </div>

        {/* Right Column: Live Scientific Data / Metrics */}
        <div className="col-span-12 lg:col-span-3 bg-[#040817]/90 border border-slate-800/80 rounded-2xl p-3 backdrop-blur-md flex flex-col justify-between shadow-[0_4px_24px_rgba(0,0,0,0.5)] overflow-hidden">
          {renderRightPanel()}
        </div>
      </div>

      {/* Bottom Connected 8-Stage Progress Arc */}
      <StageProgressArc />

      {/* Collapsible Scientific Audit Trail Drawer */}
      <AuditTrailDrawer />
    </div>
  );
};
