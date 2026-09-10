"use client";

import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import { useNoveltyTrace } from "../interactions/NoveltyTraceInteractionContext";

export const PhenotypeComparisonPanel: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const {
    activeWorkflowStep,
    selectedCandidate,
    parentA,
    parentB,
    parentRange,
    observedPhenotype,
    searchSpace,
  } = useNoveltyTrace();

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

    // Helper Gaussian generator
    const gaussian = (x: number, mean: number, sigma: number) => {
      return (1 / (sigma * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((x - mean) / sigma, 2));
    };

    if (activeWorkflowStep === 1) {
      // ==========================================
      // STAGE 1: PARENTAL ENVELOPE VS OFFSPRING
      // ==========================================
      const xScale = d3.scaleLinear().domain([-3, 3]).range([0, innerWidth]);
      const yScale = d3.scaleLinear().domain([0, 0.45]).range([innerHeight, 0]);

      const pointsCount = 60;
      const xVals = d3.range(-3, 3.1, 6 / pointsCount);
      const parentAData = xVals.map((x) => ({ x, y: gaussian(x, -1.8, 0.7) }));
      const parentBData = xVals.map((x) => ({ x, y: gaussian(x, 0.4, 0.7) }));

      const lineGen = d3
        .line<{ x: number; y: number }>()
        .x((d) => xScale(d.x))
        .y((d) => yScale(d.y))
        .curve(d3.curveBasis);

      // Shaded Parental Envelope [-1.5, +1.0]
      g.append("rect")
        .attr("x", xScale(parentRange.min))
        .attr("y", 0)
        .attr("width", xScale(parentRange.max) - xScale(parentRange.min))
        .attr("height", innerHeight)
        .attr("fill", "#0284c7")
        .attr("fill-opacity", 0.08)
        .attr("stroke", "#38bdf8")
        .attr("stroke-opacity", 0.3)
        .attr("stroke-dasharray", "3 3");

      // Axes
      g.append("g")
        .attr("transform", `translate(0,${innerHeight})`)
        .call(d3.axisBottom(xScale).tickValues([-3, -2, -1, 0, 1, 2, 3]).tickSize(-3))
        .call((ga) => ga.select(".domain").attr("stroke", "#334155"))
        .call((ga) => ga.selectAll(".tick text").attr("fill", "#64748b").attr("font-size", "7px").attr("dy", "6px"))
        .call((ga) => ga.selectAll(".tick line").attr("stroke", "#334155"));

      // Parent A Curve (Cyan)
      g.append("path").datum(parentAData).attr("fill", "none").attr("stroke", "#38bdf8").attr("stroke-width", 1.6).attr("d", lineGen);
      // Parent B Curve (Magenta)
      g.append("path").datum(parentBData).attr("fill", "none").attr("stroke", "#ec4899").attr("stroke-width", 1.6).attr("d", lineGen);

      // Offspring Phenotype Marker (+2.1 SD)
      const offX = xScale(observedPhenotype);
      g.append("line")
        .attr("x1", offX)
        .attr("x2", offX)
        .attr("y1", 0)
        .attr("y2", innerHeight)
        .attr("stroke", "#fbbf24")
        .attr("stroke-width", 1.8)
        .attr("stroke-dasharray", "2 2");

      g.append("circle")
        .attr("cx", offX)
        .attr("cy", yScale(0.28))
        .attr("r", 4)
        .attr("fill", "#fbbf24")
        .attr("stroke", "#ffffff")
        .attr("stroke-width", 1.2)
        .attr("filter", "drop-shadow(0 0 6px #fbbf24)");

      g.append("text")
        .attr("x", offX + 4)
        .attr("y", yScale(0.35))
        .attr("fill", "#fbbf24")
        .attr("font-size", "7.5px")
        .attr("font-weight", "bold")
        .text("+2.1 SD (Transgressive)");
    } else if (activeWorkflowStep === 2) {
      // ==========================================
      // STAGE 2: SEARCH EVIDENCE CATEGORIES
      // ==========================================
      const categories = searchSpace.evidenceCategories;
      const yScale = d3.scaleBand().domain(categories.map((c) => c.category)).range([0, innerHeight]).padding(0.3);
      const xScale = d3.scaleLinear().domain([0, 50]).range([0, innerWidth]);

      // Category Bars
      g.selectAll(".evidence-bar")
        .data(categories)
        .enter()
        .append("rect")
        .attr("y", (d) => yScale(d.category)!)
        .attr("x", 0)
        .attr("height", yScale.bandwidth())
        .attr("width", (d) => xScale(d.weight))
        .attr("rx", 3)
        .attr("fill", (_, i) => (i === 0 ? "#38bdf8" : i === 1 ? "#c084fc" : i === 2 ? "#ec4899" : "#fbbf24"))
        .attr("fill-opacity", 0.85);

      // Labels
      g.selectAll(".evidence-label")
        .data(categories)
        .enter()
        .append("text")
        .attr("y", (d) => yScale(d.category)! + yScale.bandwidth() / 2 + 3)
        .attr("x", 6)
        .attr("fill", "#ffffff")
        .attr("font-size", "7.5px")
        .attr("font-weight", "500")
        .text((d) => `${d.category} (${d.weight}%)`);

      // Baseline line
      g.append("line").attr("x1", 0).attr("x2", innerWidth).attr("y1", innerHeight).attr("y2", innerHeight).attr("stroke", "#334155");
    } else if (activeWorkflowStep === 3) {
      // ==========================================
      // STAGE 3: CANDIDATE PHENOTYPE COUNTERFACTUALS
      // ==========================================
      const xScale = d3.scaleLinear().domain([-3, 3]).range([0, innerWidth]);
      const yScale = d3.scaleLinear().domain([0, 0.45]).range([innerHeight, 0]);

      const pointsCount = 60;
      const xVals = d3.range(-3, 3.1, 6 / pointsCount);
      const observedData = xVals.map((x) => ({ x, y: gaussian(x, 2.1, 0.65) }));
      const c1Data = xVals.map((x) => ({ x, y: gaussian(x, 0.4, 0.65) }));
      const c2Data = xVals.map((x) => ({ x, y: gaussian(x, 0.7, 0.65) }));

      const lineGen = d3.line<{ x: number; y: number }>().x((d) => xScale(d.x)).y((d) => yScale(d.y)).curve(d3.curveBasis);

      // Shaded Parental Envelope
      g.append("rect")
        .attr("x", xScale(parentRange.min))
        .attr("y", 0)
        .attr("width", xScale(parentRange.max) - xScale(parentRange.min))
        .attr("height", innerHeight)
        .attr("fill", "#0284c7")
        .attr("fill-opacity", 0.08)
        .attr("stroke", "#38bdf8")
        .attr("stroke-opacity", 0.3)
        .attr("stroke-dasharray", "3 3");

      // Axes
      g.append("g")
        .attr("transform", `translate(0,${innerHeight})`)
        .call(d3.axisBottom(xScale).tickValues([-3, -2, -1, 0, 1, 2, 3]).tickSize(-3))
        .call((ga) => ga.select(".domain").attr("stroke", "#334155"))
        .call((ga) => ga.selectAll(".tick text").attr("fill", "#64748b").attr("font-size", "7px").attr("dy", "6px"))
        .call((ga) => ga.selectAll(".tick line").attr("stroke", "#334155"));

      // Observed (Gold)
      g.append("path").datum(observedData).attr("fill", "none").attr("stroke", "#fbbf24").attr("stroke-width", 2.0).attr("d", lineGen);
      // Candidate 1 Counterfactual (Cyan - Restores envelope)
      g.append("path").datum(c1Data).attr("fill", "none").attr("stroke", "#38bdf8").attr("stroke-width", 1.8).attr("d", lineGen);
      // Candidate 2 Counterfactual (Purple)
      g.append("path").datum(c2Data).attr("fill", "none").attr("stroke", "#c084fc").attr("stroke-width", 1.4).attr("d", lineGen);
    } else if (activeWorkflowStep === 4) {
      // ==========================================
      // STAGE 4: SINGLE VS JOINT INTERVENTION CONTRAST
      // ==========================================
      const contrasts = [
        { label: "Baseline", value: 2.10, color: "#fbbf24" },
        { label: "Revert A", value: 1.80, color: "#38bdf8" },
        { label: "Revert B", value: 1.60, color: "#ec4899" },
        { label: "Joint (A+B)", value: 0.40, color: "#10b981", isRescued: true },
      ];

      const xScale = d3.scaleBand().domain(contrasts.map((d) => d.label)).range([0, innerWidth]).padding(0.35);
      const yScale = d3.scaleLinear().domain([0, 2.5]).range([innerHeight, 0]);

      // Envelope line at 1.0 SD
      const envY = yScale(parentRange.max);
      g.append("line")
        .attr("x1", 0)
        .attr("x2", innerWidth)
        .attr("y1", envY)
        .attr("y2", envY)
        .attr("stroke", "#38bdf8")
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "3 3");

      g.append("text")
        .attr("x", innerWidth - 2)
        .attr("y", envY - 3)
        .attr("text-anchor", "end")
        .attr("fill", "#38bdf8")
        .attr("font-size", "6.5px")
        .text("Parental max (+1.0 SD)");

      // Bars
      g.selectAll(".contrast-bar")
        .data(contrasts)
        .enter()
        .append("rect")
        .attr("x", (d) => xScale(d.label)!)
        .attr("y", (d) => yScale(d.value))
        .attr("width", xScale.bandwidth())
        .attr("height", (d) => innerHeight - yScale(d.value))
        .attr("rx", 3)
        .attr("fill", (d) => d.color)
        .attr("filter", (d) => (d.isRescued ? "drop-shadow(0 0 6px rgba(16,185,129,0.5))" : "none"));

      // Value text
      g.selectAll(".contrast-val")
        .data(contrasts)
        .enter()
        .append("text")
        .attr("x", (d) => xScale(d.label)! + xScale.bandwidth() / 2)
        .attr("y", (d) => yScale(d.value) - 3)
        .attr("text-anchor", "middle")
        .attr("fill", (d) => d.color)
        .attr("font-size", "7px")
        .attr("font-weight", "bold")
        .text((d) => `+${d.value.toFixed(2)}`);

      // X Axis
      g.append("g")
        .attr("transform", `translate(0,${innerHeight})`)
        .call(d3.axisBottom(xScale).tickSize(0))
        .call((ga) => ga.select(".domain").attr("stroke", "#334155"))
        .call((ga) => ga.selectAll(".tick text").attr("fill", "#94a3b8").attr("font-size", "7px").attr("dy", "5px"));
    }
  }, [activeWorkflowStep, selectedCandidate, parentRange, observedPhenotype, searchSpace]);

  return (
    <div className="w-full h-full bg-[#070d1d]/85 backdrop-blur-md border border-slate-800/80 rounded-xl p-3 shadow-[0_8px_32px_rgba(0,0,0,0.6)] flex flex-col justify-between group hover:border-slate-700/80 transition-all duration-300 relative">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/50 pb-1 mb-1">
        <div className="flex items-center gap-1.5">
          <span className="text-cyan-400 font-bold text-xs">|</span>
          <h2 className="text-xs font-semibold text-slate-100 tracking-wide font-sans">
            {activeWorkflowStep === 1 && "Parental vs. Offspring"}
            {activeWorkflowStep === 2 && "Search Evidence Evaluation"}
            {activeWorkflowStep === 3 && "Candidate Phenotype Effects"}
            {activeWorkflowStep === 4 && "Single vs Joint Contrast"}
          </h2>
        </div>
        <div className="w-4 h-4 rounded-full border border-slate-700 flex items-center justify-center text-[9px] text-slate-400 cursor-pointer">
          ›
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-2 text-[7.5px] text-slate-400 pr-1">
        {activeWorkflowStep === 1 && (
          <>
            <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-cyan-400" /><span>Parent A</span></div>
            <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-pink-400" /><span>Parent B</span></div>
            <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" /><span>Offspring</span></div>
          </>
        )}
        {activeWorkflowStep === 2 && (
          <span className="text-[7px] text-cyan-300 font-mono">WEIGHTED MULTI-CRITERIA SCORING</span>
        )}
        {activeWorkflowStep === 3 && (
          <>
            <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" /><span>Observed</span></div>
            <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-cyan-400" /><span>Cand 1 CF</span></div>
            <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-purple-400" /><span>Cand 2 CF</span></div>
          </>
        )}
        {activeWorkflowStep === 4 && (
          <span className="text-[7px] text-emerald-400 font-mono">EXCESS = +0.92 SD (POSITIVE SYNERGY)</span>
        )}
      </div>

      {/* Chart SVG */}
      <div className="relative flex justify-center items-center">
        <svg ref={svgRef} viewBox="0 0 280 135" className="w-full h-[115px]" />

        {/* Pinned Callout Box */}
        <div className="absolute right-1 top-2 bg-[#0c1630]/95 border border-slate-700/60 rounded-md p-1.5 shadow-[0_4px_16px_rgba(0,0,0,0.4)] max-w-[115px] text-left pointer-events-none">
          <p className="text-[7.5px] text-slate-300 leading-tight">
            {activeWorkflowStep === 1 && "Offspring trait (+2.1 SD) exceeds parental envelope."}
            {activeWorkflowStep === 2 && "Ablation delta (Δy) carries 45% of total score weight."}
            {activeWorkflowStep === 3 && "Candidate 1 intervention fully restores parental bounds."}
            {activeWorkflowStep === 4 && "Joint intervention restores trait to +0.40 SD."}
          </p>
        </div>
      </div>
    </div>
  );
};
