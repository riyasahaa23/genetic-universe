"use client";

import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import { usePhenotypeInteraction } from "../interactions/PhenotypeInteractionContext";

export const PhenotypeDistributionPanel: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const { activeMode, contributions, setTooltip } = usePhenotypeInteraction();
  const isDominant = activeMode === "phenotype";

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 280;
    const height = 135;
    const margin = { top: 14, right: 14, bottom: 22, left: 30 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // X Scale: Trait Value (-3 to +3)
    const xScale = d3.scaleLinear().domain([-3, 3]).range([0, innerWidth]);

    // Y Scale: Probability Density
    const yScale = d3.scaleLinear().domain([0, 0.45]).range([innerHeight, 0]);

    // Gaussian generator
    const gaussian = (x: number, mean: number, sigma: number) => {
      return (1 / (sigma * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((x - mean) / sigma, 2));
    };

    const pointsCount = 60;
    const xVals = d3.range(-3, 3.1, 6 / pointsCount);

    // Parent A: mean -1.1, sigma 0.65 (Cyan)
    const parentAData = xVals.map((x) => ({ x, y: gaussian(x, -1.1, 0.7) }));
    // Parent B: mean 0.5, sigma 0.65 (Magenta)
    const parentBData = xVals.map((x) => ({ x, y: gaussian(x, 0.5, 0.7) }));
    // Offspring: mean driven by dynamic model output (contributions.offspring), sigma 0.62 (Gold)
    const offspringMean = Math.min(2.4, Math.max(-2.4, contributions.offspring + 0.4));
    const offspringData = xVals.map((x) => ({ x, y: gaussian(x, offspringMean, 0.68) }));

    const lineGenerator = d3
      .line<{ x: number; y: number }>()
      .x((d) => xScale(d.x))
      .y((d) => yScale(d.y))
      .curve(d3.curveBasis);

    // Parental Range Envelope Rect Shading
    const minParent = -1.1;
    const maxParent = 0.5;
    g.append("rect")
      .attr("x", xScale(minParent))
      .attr("y", 0)
      .attr("width", Math.max(0, xScale(maxParent) - xScale(minParent)))
      .attr("height", innerHeight)
      .attr("fill", "#0284c7")
      .attr("fill-opacity", 0.08);

    // Parental Range Boundary Dashed Lines
    g.append("line")
      .attr("x1", xScale(minParent))
      .attr("x2", xScale(minParent))
      .attr("y1", 0)
      .attr("y2", innerHeight)
      .attr("stroke", "#38bdf8")
      .attr("stroke-dasharray", "2 2")
      .attr("stroke-opacity", 0.5);

    g.append("line")
      .attr("x1", xScale(maxParent))
      .attr("x2", xScale(maxParent))
      .attr("y1", 0)
      .attr("y2", innerHeight)
      .attr("stroke", "#ec4899")
      .attr("stroke-dasharray", "2 2")
      .attr("stroke-opacity", 0.5);

    // Axes
    const xAxis = d3
      .axisBottom(xScale)
      .tickValues([-3, -2, -1, 0, 1, 2, 3])
      .tickSize(-3);

    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(xAxis)
      .call((gAxis) => gAxis.select(".domain").attr("stroke", "#334155"))
      .call((gAxis) => gAxis.selectAll(".tick text").attr("fill", "#64748b").attr("font-size", "7.5px").attr("dy", "6px"))
      .call((gAxis) => gAxis.selectAll(".tick line").attr("stroke", "#334155"));

    // Y Axis label
    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -20)
      .attr("x", -innerHeight / 2)
      .attr("text-anchor", "middle")
      .attr("fill", "#64748b")
      .attr("font-size", "7px")
      .text("Probability Density");

    // X Axis label
    g.append("text")
      .attr("x", innerWidth / 2)
      .attr("y", innerHeight + 18)
      .attr("text-anchor", "middle")
      .attr("fill", "#64748b")
      .attr("font-size", "7px")
      .text("Trait Value (normalized)");

    // Density Curves
    // Parent A Curve (Cyan)
    g.append("path")
      .datum(parentAData)
      .attr("fill", "none")
      .attr("stroke", "#38bdf8")
      .attr("stroke-width", 1.8)
      .attr("d", lineGenerator);

    // Parent B Curve (Magenta)
    g.append("path")
      .datum(parentBData)
      .attr("fill", "none")
      .attr("stroke", "#ec4899")
      .attr("stroke-width", 1.8)
      .attr("d", lineGenerator);

    // Offspring Curve (Gold)
    g.append("path")
      .datum(offspringData)
      .attr("fill", "none")
      .attr("stroke", "#fbbf24")
      .attr("stroke-width", isDominant ? 2.8 : 2.2)
      .attr("d", lineGenerator)
      .attr("filter", "drop-shadow(0 0 6px rgba(251,191,36,0.6))");

    // Offspring Peak Point
    const peakY = gaussian(offspringMean, offspringMean, 0.68);
    g.append("circle")
      .attr("cx", xScale(offspringMean))
      .attr("cy", yScale(peakY))
      .attr("r", isDominant ? 4.5 : 3.5)
      .attr("fill", "#fbbf24")
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 1);
  }, [contributions.offspring, isDominant]);

  return (
    <div className={`w-full h-full bg-[#070d1d]/85 backdrop-blur-md border rounded-xl p-3 shadow-[0_8px_32px_rgba(0,0,0,0.6)] flex flex-col justify-between group transition-all duration-300 relative ${
      isDominant
        ? "border-amber-500/60 shadow-[0_0_24px_rgba(251,191,36,0.25)]"
        : "border-slate-800/80 hover:border-slate-700/80"
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/50 pb-1.5 mb-1">
        <div className="flex items-center gap-1.5">
          <span className="text-cyan-400 font-bold text-xs">|</span>
          <h2 className="text-xs font-semibold text-slate-100 tracking-wide font-sans">
            Phenotype Distribution
          </h2>
        </div>
        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-800/60 border border-slate-700/60 text-[9px] text-slate-300 cursor-pointer hover:border-cyan-500/50">
          <span>Simulation Results</span>
          <span className="text-[7.5px] text-slate-400">⌄</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-2.5 text-[7.5px] text-slate-400 pr-1">
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          <span>Parent A</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-pink-400" />
          <span>Parent B</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          <span>Simulated Offspring</span>
        </div>
      </div>

      {/* Chart SVG */}
      <div className="relative flex justify-center items-center">
        <svg ref={svgRef} viewBox="0 0 280 135" className="w-full h-[115px]" />

        {/* Pinned Callout Box */}
        {contributions.isTransgressive && (
          <div className="absolute right-1 top-2 bg-[#0c1630]/95 border border-amber-500/60 rounded-md p-1.5 shadow-[0_4px_16px_rgba(251,191,36,0.25)] max-w-[120px] text-left pointer-events-none">
            <p className="text-[8px] text-amber-200 leading-tight">
              Offspring shows a novel phenotype beyond parental range
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
