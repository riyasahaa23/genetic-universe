"use client";

import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import { useNoveltyTrace } from "../interactions/NoveltyTraceInteractionContext";

interface NodeDatum extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  isDriver?: boolean;
  active?: boolean;
  color?: string;
  size?: number;
}

interface LinkDatum extends d3.SimulationLinkDatum<NodeDatum> {
  source: string | NodeDatum;
  target: string | NodeDatum;
  strength: "Strong" | "Moderate" | "Weak";
}

export const InteractionNetworkPanel: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const {
    activeWorkflowStep,
    selectedCandidate,
    setHoveredLocus,
    setTooltip,
  } = useNoveltyTrace();

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 230;
    const height = 135;

    // Node data adapt by stage
    const nodesData: NodeDatum[] = selectedCandidate.networkNodes.map((n) => {
      let isDriver = n.isDriver;
      let active = n.active;
      let color = n.isDriver ? "#38bdf8" : n.active ? "#ec4899" : "#64748b";
      let size = n.isDriver ? 9 : 7;

      if (activeWorkflowStep === 1) {
        // Stage 1: Neutral baseline topology
        color = "#0284c7";
        isDriver = false;
        active = true;
        size = 7;
      } else if (activeWorkflowStep === 2) {
        // Stage 2: Scanning search topology
        color = n.id === "Gene A" || n.id === "Gene B" || n.id === "Gene E" ? "#38bdf8" : "#64748b";
        size = 8;
      } else if (activeWorkflowStep === 4) {
        // Stage 4: Highlighting epistatic driver pair
        if (n.id === "Gene A" || n.id === "Gene B") {
          color = "#fbbf24";
          size = 10;
          isDriver = true;
          active = true;
        } else {
          color = "#334155";
          size = 6;
          isDriver = false;
          active = false;
        }
      }

      return {
        id: n.id,
        name: n.name,
        isDriver,
        active,
        color,
        size,
      };
    });

    const linksData: LinkDatum[] = selectedCandidate.networkLinks.map((l) => ({
      source: l.source,
      target: l.target,
      strength: l.strength,
    }));

    const g = svg.append("g").attr("transform", `translate(${width / 2},${height / 2})`);

    const simulation = d3
      .forceSimulation<NodeDatum>(nodesData)
      .force(
        "link",
        d3
          .forceLink<NodeDatum, LinkDatum>(linksData)
          .id((d) => d.id)
          .distance(40)
      )
      .force("charge", d3.forceManyBody().strength(-100))
      .force("center", d3.forceCenter(0, 0))
      .force("collision", d3.forceCollide().radius(18));

    // Links
    const link = g
      .append("g")
      .selectAll("line")
      .data(linksData)
      .enter()
      .append("line")
      .attr("stroke", (d) => {
        const s = typeof d.source === "object" ? d.source.id : d.source;
        const t = typeof d.target === "object" ? d.target.id : d.target;
        const isSelectedPair = (s === "Gene A" && t === "Gene B") || (s === "Gene B" && t === "Gene A");

        if (activeWorkflowStep === 1) return "#334155";
        if (activeWorkflowStep === 2) return "#38bdf8";
        if (activeWorkflowStep === 4) return isSelectedPair ? "#fbbf24" : "#1e293b";

        if (d.strength === "Strong") return "#ec4899";
        if (d.strength === "Moderate") return "#38bdf8";
        return "#475569";
      })
      .attr("stroke-width", (d) => {
        const s = typeof d.source === "object" ? d.source.id : d.source;
        const t = typeof d.target === "object" ? d.target.id : d.target;
        const isSelectedPair = (s === "Gene A" && t === "Gene B") || (s === "Gene B" && t === "Gene A");

        if (activeWorkflowStep === 4 && isSelectedPair) return 3.0;
        return d.strength === "Strong" ? 2.0 : d.strength === "Moderate" ? 1.4 : 0.9;
      })
      .attr("stroke-dasharray", activeWorkflowStep === 2 ? "3 2" : "none")
      .attr("stroke-opacity", (d) => {
        if (activeWorkflowStep === 4) {
          const s = typeof d.source === "object" ? d.source.id : d.source;
          const t = typeof d.target === "object" ? d.target.id : d.target;
          return (s === "Gene A" && t === "Gene B") || (s === "Gene B" && t === "Gene A") ? 1.0 : 0.25;
        }
        return 0.8;
      });

    // Nodes
    const node = g
      .append("g")
      .selectAll("g")
      .data(nodesData)
      .enter()
      .append("g")
      .attr("cursor", "pointer")
      .on("mouseenter", (e, d) => {
        setHoveredLocus(d.name);
        setTooltip({
          visible: true,
          x: e.clientX,
          y: e.clientY,
          title: `Interacting Locus: ${d.name}`,
          subtitle: d.isDriver ? "Key Epistatic Driver" : "Network Interactor",
          badge: d.isDriver ? "DRIVER LOCUS" : "NETWORK NODE",
          badgeColor: d.isDriver
            ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50"
            : "bg-slate-800 text-slate-300 border-slate-700",
          details: [
            { label: "Role", value: d.isDriver ? "Synergistic driver" : "Modulator", color: "#38bdf8" },
            { label: "Configuration", value: selectedCandidate.name, color: "#fbbf24" },
          ],
        });
      })
      .on("mouseleave", () => {
        setHoveredLocus(null);
        setTooltip(null);
      });

    // Node Outer Glow
    node
      .append("circle")
      .attr("r", (d) => (d.size || 8) + 3)
      .attr("fill", (d) => d.color || "#38bdf8")
      .attr("fill-opacity", (d) => (activeWorkflowStep === 4 && !d.isDriver ? 0.05 : 0.25))
      .attr("stroke", (d) => d.color || "#38bdf8")
      .attr("stroke-width", 0.5)
      .attr("stroke-dasharray", "2 2");

    // Node Core
    node
      .append("circle")
      .attr("r", (d) => d.size || 8)
      .attr("fill", (d) => d.color || "#38bdf8")
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 1.2)
      .attr("filter", (d) => (d.isDriver ? "drop-shadow(0 0 5px rgba(56,189,248,0.8))" : "none"));

    // Labels
    node
      .append("text")
      .attr("dy", (d) => -(d.size || 8) - 2.5)
      .attr("text-anchor", "middle")
      .attr("fill", (d) => (activeWorkflowStep === 4 && !d.isDriver ? "#64748b" : "#e2e8f0"))
      .attr("font-size", "7.5px")
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
  }, [activeWorkflowStep, selectedCandidate, setHoveredLocus, setTooltip]);

  const title =
    activeWorkflowStep === 1
      ? "Configured Network (Baseline)"
      : activeWorkflowStep === 2
      ? "Candidate Interaction Search"
      : activeWorkflowStep === 3
      ? `Interaction Network (${selectedCandidate.name})`
      : "Mechanistic Epistatic Circuit";

  return (
    <div className="w-full h-full bg-[#070d1d]/85 backdrop-blur-md border border-slate-800/80 rounded-xl p-3 shadow-[0_8px_32px_rgba(0,0,0,0.6)] flex flex-col justify-between group hover:border-slate-700/80 transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/50 pb-1 mb-1">
        <div className="flex items-center gap-1.5">
          <span className="text-cyan-400 font-bold text-xs">|</span>
          <h2 className="text-xs font-semibold text-slate-100 tracking-wide font-sans">
            {title}
          </h2>
        </div>
      </div>

      {/* Main Content: Force Graph (Left) + Legend (Right) */}
      <div className="grid grid-cols-12 gap-2 items-center flex-1 min-h-0">
        {/* Force Graph (Col 8) */}
        <div className="col-span-8 h-[120px] flex items-center justify-center relative overflow-hidden bg-[#040916]/40 rounded-lg border border-slate-800/60">
          <svg ref={svgRef} viewBox="0 0 230 135" className="w-full h-full" />
        </div>

        {/* Legend (Col 4) */}
        <div className="col-span-4 flex flex-col justify-center space-y-1.5 text-left pl-1">
          {activeWorkflowStep === 1 && (
            <>
              <span className="text-[8.5px] text-slate-400 font-medium block border-b border-slate-800/60 pb-1">
                Topology
              </span>
              <div className="space-y-1 text-[8px] text-slate-300">
                <div>5 Polygenic Loci</div>
                <div>6 Epistatic Edges</div>
                <div className="text-cyan-400">Neutral State</div>
              </div>
            </>
          )}

          {activeWorkflowStep === 2 && (
            <>
              <span className="text-[8.5px] text-cyan-300 font-medium block border-b border-slate-800/60 pb-1">
                Pair Scanning
              </span>
              <div className="space-y-1 text-[8px]">
                <div className="text-cyan-300">12 Pairs Tested</div>
                <div className="text-slate-400">Pulsing Edges</div>
                <div className="text-pink-400">Synergy Search</div>
              </div>
            </>
          )}

          {activeWorkflowStep === 3 && (
            <>
              <span className="text-[8.5px] text-slate-400 font-medium block border-b border-slate-800/60 pb-1">
                Strength
              </span>
              <div className="space-y-1 text-[8px]">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-1 rounded bg-pink-500 shadow-[0_0_4px_#ec4899]" />
                  <span className="text-slate-300">Strong</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-1 rounded bg-cyan-400 shadow-[0_0_4px_#38bdf8]" />
                  <span className="text-slate-300">Moderate</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 rounded bg-slate-500" />
                  <span className="text-slate-400">Weak</span>
                </div>
              </div>
            </>
          )}

          {activeWorkflowStep === 4 && (
            <>
              <span className="text-[8.5px] text-amber-300 font-medium block border-b border-slate-800/60 pb-1">
                A × B Synergy
              </span>
              <div className="space-y-1 text-[8px]">
                <div className="text-amber-300 font-bold">Gene A × Gene B</div>
                <div className="text-emerald-400 font-mono">Excess: +0.92 SD</div>
                <div className="text-slate-400 text-[7.5px]">Positive Synergy</div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
