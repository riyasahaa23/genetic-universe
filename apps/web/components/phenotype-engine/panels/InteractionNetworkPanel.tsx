"use client";

import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import { usePhenotypeInteraction, InteractionPair, defaultInteractionPair } from "../interactions/PhenotypeInteractionContext";

interface NodeDatum extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  color: string;
  size: number;
}

interface LinkDatum extends d3.SimulationLinkDatum<NodeDatum> {
  source: string | NodeDatum;
  target: string | NodeDatum;
  strength: number;
  isSynergistic: boolean;
}

export const InteractionNetworkPanel: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const {
    networkFilter,
    setNetworkFilter,
    selectedPair,
    setSelectedPair,
    hoveredLocus,
    setHoveredLocus,
    setTooltip,
  } = usePhenotypeInteraction();

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 290;
    const height = 175;

    const nodesData: NodeDatum[] = [
      { id: "Gene A", name: "Gene A", color: "#38bdf8", size: 11 },
      { id: "Gene B", name: "Gene B", color: "#ec4899", size: 11 },
      { id: "Gene C", name: "Gene C", color: "#a855f7", size: 9 },
      { id: "Gene D", name: "Gene D", color: "#818cf8", size: 8 },
      { id: "Gene E", name: "Gene E", color: "#38bdf8", size: 8 },
      { id: "Gene F", name: "Gene F", color: "#0284c7", size: 8 },
    ];

    const linksData: LinkDatum[] = [
      { source: "Gene A", target: "Gene B", strength: 0.9, isSynergistic: true },
      { source: "Gene A", target: "Gene C", strength: 0.6, isSynergistic: true },
      { source: "Gene B", target: "Gene C", strength: 0.7, isSynergistic: true },
      { source: "Gene B", target: "Gene E", strength: 0.5, isSynergistic: false },
      { source: "Gene C", target: "Gene D", strength: 0.4, isSynergistic: false },
      { source: "Gene E", target: "Gene A", strength: 0.4, isSynergistic: true },
      { source: "Gene B", target: "Gene F", strength: 0.6, isSynergistic: true },
      { source: "Gene D", target: "Gene F", strength: 0.5, isSynergistic: false },
    ];

    // Filter links based on networkFilter
    const filteredLinks = linksData.filter((l) => {
      if (networkFilter === "active") return l.strength >= 0.6;
      if (networkFilter === "strongest") return l.strength >= 0.7;
      if (networkFilter === "selected") {
        const src = typeof l.source === "string" ? l.source : l.source.id;
        const tgt = typeof l.target === "string" ? l.target : l.target.id;
        return (src === "Gene A" && tgt === "Gene B") || (src === "Gene B" && tgt === "Gene A");
      }
      return true;
    });

    const g = svg.append("g").attr("transform", `translate(${width / 2},${height / 2})`);

    const simulation = d3
      .forceSimulation<NodeDatum>(nodesData)
      .force(
        "link",
        d3
          .forceLink<NodeDatum, LinkDatum>(filteredLinks)
          .id((d) => d.id)
          .distance(55)
      )
      .force("charge", d3.forceManyBody().strength(-140))
      .force("center", d3.forceCenter(0, 0))
      .force("collision", d3.forceCollide().radius(20));

    // Links
    const link = g
      .append("g")
      .selectAll("line")
      .data(filteredLinks)
      .enter()
      .append("line")
      .attr("stroke", (d) => {
        const src = typeof d.source === "object" ? d.source.id : d.source;
        const tgt = typeof d.target === "object" ? d.target.id : d.target;
        const isSelected =
          (src === "Gene A" && tgt === "Gene B") || (src === "Gene B" && tgt === "Gene A");
        return isSelected ? "#fbbf24" : d.isSynergistic ? "#a855f7" : "#475569";
      })
      .attr("stroke-width", (d) => {
        const src = typeof d.source === "object" ? d.source.id : d.source;
        const tgt = typeof d.target === "object" ? d.target.id : d.target;
        const isSelected =
          (src === "Gene A" && tgt === "Gene B") || (src === "Gene B" && tgt === "Gene A");
        return isSelected ? 2.5 : 1.2;
      })
      .attr("stroke-opacity", 0.75)
      .attr("cursor", "pointer")
      .on("click", () => {
        setSelectedPair(defaultInteractionPair);
      });

    // Nodes
    const node = g
      .append("g")
      .selectAll("g")
      .data(nodesData)
      .enter()
      .append("g")
      .attr("cursor", "pointer")
      .on("click", (_, d) => {
        setHoveredLocus(d.id);
        if (d.id === "Gene A" || d.id === "Gene B") {
          setSelectedPair(defaultInteractionPair);
        }
      })
      .on("mouseenter", (e, d) => {
        setHoveredLocus(d.id);
        setTooltip({
          visible: true,
          x: e.clientX,
          y: e.clientY,
          title: `Locus Node: ${d.name}`,
          subtitle: "Epistatic Network Interactor",
          badge: "NETWORK LOCUS",
          badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
          details: [
            { label: "Interactions", value: "3 candidate pairs", color: "#38bdf8" },
            { label: "Mean epistatic weight", value: "+0.34", color: "#fbbf24" },
          ],
        });
      })
      .on("mouseleave", () => {
        setHoveredLocus(null);
        setTooltip(null);
      });

    // Node Outer Glow Ring
    node
      .append("circle")
      .attr("r", (d) => d.size + 4)
      .attr("fill", (d) => d.color)
      .attr("fill-opacity", 0.2)
      .attr("stroke", (d) => d.color)
      .attr("stroke-width", 0.5)
      .attr("stroke-dasharray", "2 2");

    // Node Core
    node
      .append("circle")
      .attr("r", (d) => d.size)
      .attr("fill", (d) => d.color)
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 1.2)
      .attr("filter", (d) => (d.id === "Gene A" || d.id === "Gene B" ? "drop-shadow(0 0 6px rgba(251,191,36,0.8))" : "none"));

    // Labels
    node
      .append("text")
      .attr("dy", (d) => -d.size - 3)
      .attr("text-anchor", "middle")
      .attr("fill", "#e2e8f0")
      .attr("font-size", "8.5px")
      .attr("font-weight", "500")
      .text((d) => d.name);

    simulation.on("tick", () => {
      link
        .attr("x1", (d) => (d.source as NodeDatum).x!)
        .attr("y1", (d) => (d.source as NodeDatum).y!)
        .attr("x2", (d) => (d.target as NodeDatum).x!)
        .attr("y2", (d) => (d.target as NodeDatum).y!);

      node.attr("transform", (d) => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  }, [networkFilter, setHoveredLocus, setSelectedPair, setTooltip]);

  const pair = selectedPair || defaultInteractionPair;
  const {
    activeMode,
    selectedLocus,
    setSelectedLocus,
    contributions,
  } = usePhenotypeInteraction();

  // Stage 1: Locus Context View
  if (activeMode === "genotype") {
    const lociData = [
      { id: "Gene A", name: "Locus A", chr: "Chr 1: 14.2 Mb", parent: "Parent A", origin: "Maternal", dosage: 1.6, state: "Recombinant", color: "#38bdf8", role: "Primary Additive & Epistatic Anchor" },
      { id: "Gene B", name: "Locus B", chr: "Chr 2: 38.6 Mb", parent: "Parent B", origin: "Paternal", dosage: 0.8, state: "Intact Homolog", color: "#ec4899", role: "Synergistic Epistatic Partner" },
      { id: "Gene C", name: "Locus C", chr: "Chr 1: 52.1 Mb", parent: "Parent A", origin: "Maternal", dosage: 1.0, state: "Heterozygous", color: "#a855f7", role: "Dominance Modifier" },
      { id: "Gene D", name: "Locus D", chr: "Chr 3: 08.4 Mb", parent: "Parent B", origin: "Paternal", dosage: 0.0, state: "Homozygous Reference", color: "#64748b", role: "Linear Background" },
    ];

    const currentLocus = lociData.find((l) => l.id === selectedLocus) || lociData[0];

    return (
      <div className="w-full h-full bg-[#070d1d]/85 backdrop-blur-md border border-slate-800/80 rounded-xl p-3 shadow-[0_8px_32px_rgba(0,0,0,0.6)] flex flex-col justify-between group hover:border-slate-700/80 transition-all duration-300">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/50 pb-1.5 mb-1.5">
          <div className="flex items-center gap-1.5">
            <span className="text-cyan-400 font-bold text-xs">|</span>
            <h2 className="text-xs font-semibold text-slate-100 tracking-wide font-sans">
              Locus Context
            </h2>
          </div>
          <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-cyan-950/70 text-cyan-300 border border-cyan-600/40">
            Chromosome Loci
          </span>
        </div>

        {/* Locus Context Layout */}
        <div className="grid grid-cols-12 gap-2 flex-1 min-h-0 items-center">
          {/* Loci Selector List (Col 6) */}
          <div className="col-span-6 flex flex-col gap-1 h-36 justify-between overflow-hidden">
            {lociData.map((locus) => {
              const isSelected = currentLocus.id === locus.id;
              return (
                <div
                  key={locus.id}
                  onClick={() => setSelectedLocus(locus.id)}
                  className={`px-2 py-1 rounded cursor-pointer transition-all border flex items-center justify-between text-[9.5px] ${
                    isSelected
                      ? "bg-[#0c1836] border-cyan-500/60 text-white shadow-[0_0_10px_rgba(56,189,248,0.2)]"
                      : "bg-[#060b18]/60 border-slate-800/60 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: locus.color }} />
                    <span className="font-semibold">{locus.name}</span>
                    <span className="text-[8px] text-slate-500 font-mono">{locus.chr.split(":")[0]}</span>
                  </div>
                  <span className="font-mono text-[8.5px] text-cyan-300">{locus.state}</span>
                </div>
              );
            })}
          </div>

          {/* Selected Locus Detail Card (Col 6) */}
          <div className="col-span-6 bg-[#091126]/90 border border-slate-800/90 rounded-lg p-2 flex flex-col justify-between h-36 text-left">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800/60 pb-1 mb-1">
                <span className="text-[10px] text-slate-400 font-medium">Genotype State</span>
                <span className="text-[8.5px] font-mono text-cyan-300 font-bold">{currentLocus.chr}</span>
              </div>

              <div className="text-xs font-bold text-white mb-1">
                {currentLocus.name} ({currentLocus.id})
              </div>

              <div className="space-y-1 text-[8.5px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Ancestry:</span>
                  <span className="font-mono text-cyan-300">{currentLocus.parent} ({currentLocus.origin})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Dosage State:</span>
                  <span className="font-mono text-amber-300 font-bold">x = {currentLocus.dosage.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Recombination:</span>
                  <span className="font-mono text-emerald-400">{currentLocus.state}</span>
                </div>
                <div className="pt-0.5 border-t border-slate-800/50">
                  <span className="text-slate-500 block">Model Role:</span>
                  <span className="text-slate-300 font-sans leading-tight block text-[8px]">{currentLocus.role}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Stage 3: Phenotype Summary View
  if (activeMode === "phenotype") {
    return (
      <div className="w-full h-full bg-[#070d1d]/85 backdrop-blur-md border border-slate-800/80 rounded-xl p-3 shadow-[0_8px_32px_rgba(0,0,0,0.6)] flex flex-col justify-between group hover:border-slate-700/80 transition-all duration-300">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/50 pb-1.5 mb-1.5">
          <div className="flex items-center gap-1.5">
            <span className="text-cyan-400 font-bold text-xs">|</span>
            <h2 className="text-xs font-semibold text-slate-100 tracking-wide font-sans">
              Phenotype Summary
            </h2>
          </div>
          <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-600/40">
            Model Outcome
          </span>
        </div>

        {/* Content: Parental Range vs Offspring + Decomposition */}
        <div className="grid grid-cols-12 gap-2 flex-1 min-h-0 items-center">
          {/* Values Grid (Col 6) */}
          <div className="col-span-6 bg-[#040916]/50 rounded-lg border border-slate-800/60 p-2 flex flex-col justify-between h-36">
            <div>
              <span className="text-[9px] text-slate-400 font-medium block border-b border-slate-800/60 pb-0.5 mb-1">
                Parental Range & Novelty
              </span>
              <div className="space-y-1 text-[8.5px] font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Parent A phenotype:</span>
                  <span className="text-cyan-400 font-bold">{contributions.parentA.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Parent B phenotype:</span>
                  <span className="text-pink-400 font-bold">+{contributions.parentB.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between border-t border-slate-800/60 pt-0.5">
                  <span className="text-slate-300">Parental envelope:</span>
                  <span className="text-slate-300">[{contributions.parentA.toFixed(2)}, +{contributions.parentB.toFixed(2)}]</span>
                </div>
                <div className="flex items-center justify-between bg-amber-950/30 px-1 py-0.5 rounded border border-amber-500/30">
                  <span className="text-amber-200">Offspring phenotype:</span>
                  <span className="text-amber-300 font-bold">+{contributions.offspring.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-[8px] pt-1 border-t border-slate-800/50">
              <span className="text-slate-400">Novelty status:</span>
              <span className="font-mono text-emerald-400 font-bold">
                {contributions.isTransgressive ? "Transgressive Segregation" : "Within Envelope"}
              </span>
            </div>
          </div>

          {/* Model Decomposition Summary (Col 6) */}
          <div className="col-span-6 bg-[#091126]/90 border border-slate-800/90 rounded-lg p-2 flex flex-col justify-between h-36 text-left">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800/60 pb-0.5 mb-1">
                <span className="text-[9px] text-slate-400 font-medium">Model Decomposition</span>
                <span className="text-amber-400 text-[10px]">Σ</span>
              </div>

              <div className="space-y-1 text-[8.5px]">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Additive:</span>
                  <span className="font-mono text-cyan-300 font-bold">+{contributions.additive.toFixed(2)} ({contributions.additivePct}%)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Dominance:</span>
                  <span className="font-mono text-purple-300 font-bold">+{contributions.dominance.toFixed(2)} ({contributions.dominancePct}%)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Epistatic:</span>
                  <span className="font-mono text-pink-300 font-bold">+{contributions.epistasis.toFixed(2)} ({contributions.epistasisPct}%)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Residual:</span>
                  <span className="font-mono text-slate-400">+{contributions.residual.toFixed(2)} ({contributions.residualPct}%)</span>
                </div>
              </div>
            </div>

            <div className="pt-1 border-t border-slate-800/60 flex items-center justify-between text-[8px]">
              <span className="text-slate-400">Emergent Total:</span>
              <span className="font-mono text-amber-300 font-extrabold">{contributions.total.toFixed(2)} units</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Stage 2: Interaction Network View (Default)
  return (
    <div className="w-full h-full bg-[#070d1d]/85 backdrop-blur-md border border-slate-800/80 rounded-xl p-3 shadow-[0_8px_32px_rgba(0,0,0,0.6)] flex flex-col justify-between group hover:border-slate-700/80 transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/50 pb-1.5 mb-1.5">
        <div className="flex items-center gap-1.5">
          <span className="text-cyan-400 font-bold text-xs">|</span>
          <h2 className="text-xs font-semibold text-slate-100 tracking-wide font-sans">
            Gene Interaction Network
          </h2>
        </div>
        <div className="w-4 h-4 rounded-full border border-slate-700 flex items-center justify-center text-[9px] text-slate-400 cursor-pointer">
          ›
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 mb-1.5">
        {(["all", "active", "strongest", "selected"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setNetworkFilter(tab)}
            className={`px-2 py-0.5 rounded text-[9px] font-medium transition-all capitalize ${
              networkFilter === tab
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_8px_rgba(56,189,248,0.3)]"
                : "bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-slate-200"
            }`}
          >
            {tab === "selected" ? "Key Drivers" : tab}
          </button>
        ))}
      </div>

      {/* Main Content: Force Graph + Interaction Details Card */}
      <div className="grid grid-cols-12 gap-2 items-center flex-1 min-h-0">
        {/* Force Graph (Col 7) */}
        <div className="col-span-7 h-36 flex items-center justify-center relative overflow-hidden bg-[#040916]/50 rounded-lg border border-slate-800/60">
          <svg ref={svgRef} viewBox="0 0 290 175" className="w-full h-full" />
        </div>

        {/* Interaction Details Side Card (Col 5) */}
        <div className="col-span-5 bg-[#091126]/90 border border-slate-800/90 rounded-lg p-2 flex flex-col justify-between h-36 text-left">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800/60 pb-1 mb-1.5">
              <span className="text-[10px] text-slate-400 font-medium">Interaction Details</span>
              <div className="text-cyan-400 text-xs">⚝</div>
            </div>

            <div className="text-xs font-bold text-white mb-1 tracking-wide">
              {pair.source} ↔ {pair.target}
            </div>

            <div className="space-y-1 text-[8.5px]">
              <div className="flex items-center justify-between font-mono">
                <span className="text-slate-400">interaction_edge_delta:</span>
                <span className="text-emerald-400 font-medium">+{pair.edgeDelta.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between font-mono">
                <span className="text-slate-400">interaction_contrast:</span>
                <span className="text-amber-300 font-medium">+{pair.contrast.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between font-mono">
                <span className="text-slate-400">epistatic_excess:</span>
                <span className="text-amber-300 font-medium">+{pair.epistaticExcess.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between font-mono">
                <span className="text-slate-400">synergy_direction:</span>
                <span className="text-cyan-300 font-medium capitalize">{pair.synergyDirection}</span>
              </div>
            </div>
          </div>

          <div className="pt-1 border-t border-slate-800/60 flex items-center justify-between text-[8px]">
            <span className="text-slate-500">Confidence (model):</span>
            <span className="font-mono text-cyan-300 font-bold">{pair.confidence}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
