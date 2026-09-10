"use client";

import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import { EvidenceGraphData, EvidenceNode, EvidenceLink } from "@/lib/types";

interface EvidenceGraphProps {
  graphData?: EvidenceGraphData;
  onNodeClick?: (node: EvidenceNode) => void;
}

export const EvidenceGraph: React.FC<EvidenceGraphProps> = ({
  graphData,
  onNodeClick,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !graphData || !graphData.nodes || graphData.nodes.length === 0) {
      return;
    }

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = svgRef.current.clientWidth || 800;
    const height = 480;

    // Zoom container
    const container = svg.append("g");
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 3])
      .on("zoom", (event) => {
        container.attr("transform", event.transform);
      });
    svg.call(zoom);

    // Color mapper by node type
    const getNodeColor = (d: EvidenceNode) => {
      switch (d.type) {
        case "parent":
          return "#3b82f6";
        case "homolog":
          return "#60a5fa";
        case "crossover":
          return "#f59e0b";
        case "segment":
          return "#0284c7";
        case "locus":
          return "#10b981";
        case "interaction":
          return d.is_primary_cause ? "#a855f7" : "#8b5cf6";
        case "phenotype":
          return "#ec4899";
        case "novelty":
          return "#f43f5e";
        default:
          return "#64748b";
      }
    };

    // Deep clone data for D3 mutation
    const nodes: EvidenceNode[] = JSON.parse(JSON.stringify(graphData.nodes));
    const links: EvidenceLink[] = JSON.parse(JSON.stringify(graphData.links));

    // Force simulation
    const simulation = d3
      .forceSimulation<EvidenceNode>(nodes)
      .force(
        "link",
        d3
          .forceLink<EvidenceNode, EvidenceLink>(links)
          .id((d) => d.id)
          .distance(60)
      )
      .force("charge", d3.forceManyBody().strength(-240))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(25));

    // Arrow markers
    svg
      .append("defs")
      .append("marker")
      .attr("id", "arrow")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 20)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#475569");

    // Edges
    const link = container
      .append("g")
      .selectAll("line")
      .data(links)
      .enter()
      .append("line")
      .attr("stroke", "#334155")
      .attr("stroke-width", 1.5)
      .attr("marker-end", "url(#arrow)");

    // Nodes
    const node = container
      .append("g")
      .selectAll("g")
      .data(nodes)
      .enter()
      .append("g")
      .attr("cursor", "pointer")
      .call(
        d3
          .drag<SVGGElement, EvidenceNode>()
          .on("start", (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.x = event.x;
            d.y = event.y;
          })
          .on("drag", (event, d) => {
            d.x = event.x;
            d.y = event.y;
          })
          .on("end", (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
          })
      );

    node
      .append("circle")
      .attr("r", (d) => (d.is_primary_cause || d.type === "novelty" ? 14 : 10))
      .attr("fill", getNodeColor)
      .attr("stroke", (d) => (d.is_primary_cause ? "#facc15" : "#1e293b"))
      .attr("stroke-width", (d) => (d.is_primary_cause ? 3 : 1.5));

    // Labels
    node
      .append("text")
      .attr("dy", 20)
      .attr("text-anchor", "middle")
      .attr("fill", "#cbd5e1")
      .attr("font-size", "10px")
      .attr("font-weight", (d) => (d.is_primary_cause ? "bold" : "normal"))
      .text((d) => d.label || d.id);

    node.on("click", (event, d) => {
      if (onNodeClick) onNodeClick(d);
    });

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  }, [graphData, onNodeClick]);

  return (
    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            NetworkX Evidence DAG (Recombination → Phenotype Novelty)
          </h3>
          <p className="text-[11px] text-slate-400">
            Click and drag nodes to explore causal pathways · Top causal pathway highlighted in purple & gold
          </p>
        </div>
        <div className="flex items-center space-x-2 text-[10px]">
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
            <span className="text-slate-400">Parent/Homolog</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
            <span className="text-slate-400">Crossover</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-purple-500 inline-block" />
            <span className="text-slate-400">Epistasis</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-pink-500 inline-block" />
            <span className="text-slate-400">Novelty</span>
          </span>
        </div>
      </div>

      <div className="w-full h-[480px] bg-slate-950/80 rounded-lg border border-slate-800 overflow-hidden relative">
        <svg ref={svgRef} className="w-full h-full" />
      </div>
    </div>
  );
};
