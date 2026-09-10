"use client";

import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { SegmentProvenance } from "@/lib/types";

interface GenomeTrackProps {
  locusCount?: number;
  segmentsA?: SegmentProvenance[];
  crossoversA?: number[];
  onSelectSegment?: (segment: SegmentProvenance) => void;
}

export const GenomeTrack: React.FC<GenomeTrackProps> = ({
  locusCount = 50,
  segmentsA = [
    { start: 0, end: 20, source_homolog: "A1", parent_id: "A" },
    { start: 20, end: 50, source_homolog: "A2", parent_id: "A" },
  ],
  crossoversA = [20],
  onSelectSegment,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selected, setSelected] = useState<SegmentProvenance | null>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = svgRef.current.clientWidth || 700;
    const height = 120;
    const margin = { top: 25, right: 20, bottom: 25, left: 30 };
    const innerWidth = width - margin.left - margin.right;

    const g = svg.append("g").attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Scale
    const xScale = d3.scaleLinear().domain([0, locusCount]).range([0, innerWidth]);

    // Axis
    const xAxis = d3.axisBottom(xScale).ticks(10).tickFormat((d) => `L${d}`);
    g.append("g")
      .attr("transform", `translate(0, 45)`)
      .call(xAxis)
      .selectAll("text")
      .attr("fill", "#94a3b8")
      .attr("font-size", "10px");

    g.selectAll(".domain, .tick line").attr("stroke", "#334155");

    // Recombinant Segments
    segmentsA.forEach((seg, idx) => {
      const segWidth = xScale(seg.end) - xScale(seg.start);
      const isA1 = seg.source_homolog === "A1";

      const rect = g
        .append("rect")
        .attr("x", xScale(seg.start))
        .attr("y", 15)
        .attr("width", Math.max(segWidth - 2, 2))
        .attr("height", 24)
        .attr("rx", 3)
        .attr("fill", isA1 ? "#2563eb" : "#38bdf8")
        .attr("opacity", 0.9)
        .attr("cursor", "pointer")
        .attr("stroke", selected?.start === seg.start ? "#facc15" : "none")
        .attr("stroke-width", 2);

      rect.on("click", () => {
        setSelected(seg);
        if (onSelectSegment) onSelectSegment(seg);
      });

      // Label on segment
      if (segWidth > 40) {
        g.append("text")
          .attr("x", xScale(seg.start) + segWidth / 2)
          .attr("y", 31)
          .attr("text-anchor", "middle")
          .attr("fill", isA1 ? "#ffffff" : "#0f172a")
          .attr("font-size", "11px")
          .attr("font-weight", "bold")
          .attr("pointer-events", "none")
          .text(seg.source_homolog);
      }
    });

    // Crossover Breakpoint Markers
    crossoversA.forEach((xo, idx) => {
      const xPos = xScale(xo);

      // Vertical dashed marker line
      g.append("line")
        .attr("x1", xPos)
        .attr("x2", xPos)
        .attr("y1", 0)
        .attr("y2", 50)
        .attr("stroke", "#f59e0b")
        .attr("stroke-width", 1.5)
        .attr("stroke-dasharray", "3 2");

      // Triangle pointer
      g.append("polygon")
        .attr("points", `${xPos - 5},0 ${xPos + 5},0 ${xPos},8`)
        .attr("fill", "#f59e0b");

      // Label
      g.append("text")
        .attr("x", xPos)
        .attr("y", -5)
        .attr("text-anchor", "middle")
        .attr("fill", "#fbbf24")
        .attr("font-size", "10px")
        .attr("font-weight", "bold")
        .text(`XO-${idx + 1} @ ${xo}`);
    });
  }, [locusCount, segmentsA, crossoversA, selected, onSelectSegment]);

  return (
    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
          D3 Recombination Genome Track (Gamete gA)
        </h3>
        <span className="text-[11px] text-slate-400">
          Click a segment block to inspect meiotic provenance
        </span>
      </div>

      <div className="w-full overflow-x-auto bg-slate-950/70 p-2 rounded-lg border border-slate-800">
        <svg ref={svgRef} className="w-full h-[120px]" />
      </div>

      {selected && (
        <div className="p-2.5 rounded bg-slate-800/80 border border-slate-700 text-xs flex justify-between items-center text-slate-200">
          <div>
            <span className="font-semibold text-sky-400">Selected Segment: </span>
            Homolog {selected.source_homolog} (Loci L{selected.start.toString().padStart(2, "0")} to L{selected.end.toString().padStart(2, "0")})
          </div>
          <div className="text-[11px] text-slate-400">
            Source Parent: <span className="font-bold text-white">Parent {selected.parent_id}</span>
          </div>
        </div>
      )}
    </div>
  );
};
