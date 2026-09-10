"use client";

import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import { useNoveltyTrace } from "../interactions/NoveltyTraceInteractionContext";

export const CandidateComparisonPanel: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const {
    activeWorkflowStep,
    selectedCandidateId,
    setSelectedCandidateId,
    setTooltip,
    parentRange,
    parentA,
    parentB,
    observedPhenotype,
    selectedCandidate,
  } = useNoveltyTrace();

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 450;
    const height = 135;
    const margin = { top: 18, right: 20, bottom: 24, left: 32 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Y Scale: -3 to +3
    const yScale = d3.scaleLinear().domain([-3, 3]).range([innerHeight, 0]);

    // Shaded Parental Range Band: from -1.5 to +1.0
    const parentalMinY = yScale(parentRange.min);
    const parentalMaxY = yScale(parentRange.max);
    g.append("rect")
      .attr("x", 0)
      .attr("y", parentalMaxY)
      .attr("width", innerWidth)
      .attr("height", parentalMinY - parentalMaxY)
      .attr("fill", "#0284c7")
      .attr("fill-opacity", 0.08)
      .attr("stroke", "#38bdf8")
      .attr("stroke-opacity", 0.25)
      .attr("stroke-dasharray", "3 3");

    // Parental Range Label
    g.append("text")
      .attr("x", 8)
      .attr("y", parentalMaxY + 13)
      .attr("fill", "#94a3b8")
      .attr("font-size", "7.5px")
      .attr("font-weight", "500")
      .text(`Parental range [${parentRange.min.toFixed(1)}, +${parentRange.max.toFixed(1)}]`);

    // Y Axis Grid / Baseline at 0
    g.append("line")
      .attr("x1", 0)
      .attr("x2", innerWidth)
      .attr("y1", yScale(0))
      .attr("y2", yScale(0))
      .attr("stroke", "#475569")
      .attr("stroke-width", 1);

    // Y Axis
    const yAxis = d3
      .axisLeft(yScale)
      .tickValues([-3, -2, -1, 0, 1, 2, 3])
      .tickSize(-3);

    g.append("g")
      .call(yAxis)
      .call((gAxis) => gAxis.select(".domain").attr("stroke", "#334155"))
      .call((gAxis) => gAxis.selectAll(".tick text").attr("fill", "#64748b").attr("font-size", "7px").attr("dx", "-2px"))
      .call((gAxis) => gAxis.selectAll(".tick line").attr("stroke", "#334155"));

    // Y Axis Label
    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -22)
      .attr("x", -innerHeight / 2)
      .attr("text-anchor", "middle")
      .attr("fill", "#64748b")
      .attr("font-size", "7px")
      .text("Trait Value (SD)");

    // =========================================================================
    // STAGE 1: Phenotype Baseline vs Offspring (Observe Phase - No Candidates)
    // =========================================================================
    if (activeWorkflowStep === 1) {
      const stage1Data = [
        { name: "Parent A", id: "parent_a", value: parentA.phenotype, color: "#38bdf8", isNovel: false, role: "Maternal Line" },
        { name: "Parent B", id: "parent_b", value: parentB.phenotype, color: "#ec4899", isNovel: false, role: "Paternal Line" },
        { name: "Offspring", id: "offspring", value: observedPhenotype, color: "#fbbf24", isNovel: true, role: "Observed Novelty" },
      ];

      const xScale = d3
        .scaleBand()
        .domain(stage1Data.map((d) => d.name))
        .range([0, innerWidth])
        .padding(0.48);

      // Bars
      g.selectAll(".bar-stage1")
        .data(stage1Data)
        .enter()
        .append("rect")
        .attr("class", "bar-stage1")
        .attr("x", (d) => xScale(d.name)!)
        .attr("y", (d) => (d.value >= 0 ? yScale(d.value) : yScale(0)))
        .attr("width", xScale.bandwidth())
        .attr("height", (d) => Math.abs(yScale(d.value) - yScale(0)))
        .attr("rx", 3)
        .attr("fill", (d) => d.color)
        .attr("filter", (d) => (d.isNovel ? "drop-shadow(0 0 8px rgba(251,191,36,0.7))" : "none"))
        .attr("cursor", "pointer")
        .on("mouseenter", (e, d) => {
          setTooltip({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            title: d.name,
            subtitle: `${d.role}: ${d.value > 0 ? "+" : ""}${d.value.toFixed(1)} SD`,
            badge: d.isNovel ? "OUTSIDE ENVELOPE (+1.1 SD)" : "PARENTAL BASELINE",
            badgeColor: d.isNovel
              ? "bg-amber-500/20 text-amber-300 border-amber-500/50"
              : "bg-cyan-500/20 text-cyan-300 border-cyan-500/50",
            details: [
              { label: "Phenotype", value: `${d.value > 0 ? "+" : ""}${d.value.toFixed(2)} SD`, color: d.color },
              { label: "Envelope status", value: d.isNovel ? "Novel transgression" : "Within parent envelope", color: "#94a3b8" },
              { label: "Parent A offset", value: `${(d.value - parentA.phenotype).toFixed(2)} SD`, color: "#38bdf8" },
              { label: "Parent B offset", value: `${(d.value - parentB.phenotype).toFixed(2)} SD`, color: "#ec4899" },
            ],
          });
        })
        .on("mouseleave", () => setTooltip(null));

      // Transgression delta line and label on Offspring
      const offX = xScale("Offspring")! + xScale.bandwidth() / 2;
      const offY = yScale(observedPhenotype);
      const envMaxY = yScale(parentRange.max);

      // Bracket indicator from envelope max (+1.0) to offspring (+2.1)
      g.append("line")
        .attr("x1", offX + xScale.bandwidth() / 2 + 5)
        .attr("x2", offX + xScale.bandwidth() / 2 + 5)
        .attr("y1", envMaxY)
        .attr("y2", offY)
        .attr("stroke", "#fbbf24")
        .attr("stroke-width", 1.5)
        .attr("stroke-dasharray", "2 2");

      g.append("text")
        .attr("x", offX + xScale.bandwidth() / 2 + 8)
        .attr("y", (envMaxY + offY) / 2 + 3)
        .attr("fill", "#fbbf24")
        .attr("font-size", "7.5px")
        .attr("font-weight", "bold")
        .text("+1.1 SD Novelty");

      // Offspring peak badge
      g.append("circle")
        .attr("cx", offX)
        .attr("cy", offY)
        .attr("r", 4)
        .attr("fill", "#fbbf24")
        .attr("stroke", "#ffffff")
        .attr("stroke-width", 1.5)
        .attr("filter", "drop-shadow(0 0 6px #fbbf24)");

      // X Axis
      g.append("g")
        .attr("transform", `translate(0,${innerHeight})`)
        .call(d3.axisBottom(xScale).tickSize(0))
        .call((gAxis) => gAxis.select(".domain").attr("stroke", "#334155"))
        .call((gAxis) =>
          gAxis
            .selectAll(".tick text")
            .attr("fill", (d) => (d === "Offspring" ? "#fbbf24" : "#94a3b8"))
            .attr("font-size", "8px")
            .attr("font-weight", (d) => (d === "Offspring" ? "bold" : "500"))
            .attr("dy", "8px")
        );
    }

    // =========================================================================
    // STAGE 2: Search Space Effect Distribution (Search Phase)
    // =========================================================================
    else if (activeWorkflowStep === 2) {
      const stage2Data = [
        { name: "Single Variants", id: "variants", count: 18, maxDelta: 0.45, color: "#38bdf8", role: "18 locus dosages" },
        { name: "Crossover Seg.", id: "segments", count: 6, maxDelta: 1.15, color: "#c084fc", role: "6 haplotype blocks" },
        { name: "Epistatic Pairs", id: "pairs", count: 12, maxDelta: 1.70, color: "#fbbf24", role: "12 gene-gene pairs" },
        { name: "Observed Target", id: "target", count: 1, maxDelta: 2.10, color: "#f59e0b", role: "Offspring phenotype" },
      ];

      const xScale = d3
        .scaleBand()
        .domain(stage2Data.map((d) => d.name))
        .range([0, innerWidth])
        .padding(0.42);

      g.selectAll(".bar-stage2")
        .data(stage2Data)
        .enter()
        .append("rect")
        .attr("class", "bar-stage2")
        .attr("x", (d) => xScale(d.name)!)
        .attr("y", (d) => yScale(d.maxDelta))
        .attr("width", xScale.bandwidth())
        .attr("height", (d) => Math.abs(yScale(d.maxDelta) - yScale(0)))
        .attr("rx", 3)
        .attr("fill", (d) => d.color)
        .attr("filter", (d) => (d.id === "pairs" ? "drop-shadow(0 0 8px rgba(251,191,36,0.6))" : "none"))
        .attr("cursor", "pointer")
        .on("mouseenter", (e, d) => {
          setTooltip({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            title: d.name,
            subtitle: `${d.role} · Max Effect: +${d.maxDelta.toFixed(2)} SD`,
            badge: `${d.count} EVALUATED`,
            badgeColor: d.id === "pairs"
              ? "bg-amber-500/20 text-amber-300 border-amber-500/50"
              : "bg-sky-500/20 text-sky-300 border-sky-500/50",
            details: [
              { label: "Category count", value: `${d.count} candidates`, color: d.color },
              { label: "Max Trait Delta", value: `+${d.maxDelta.toFixed(2)} SD`, color: "#ffffff" },
              { label: "Envelope threshold", value: d.maxDelta > 1.0 ? "Exceeds envelope" : "Within envelope", color: d.maxDelta > 1.0 ? "#fbbf24" : "#94a3b8" },
              { label: "Search status", value: "Candidate generation active", color: "#38bdf8" },
            ],
          });
        })
        .on("mouseleave", () => setTooltip(null));

      // Threshold line for envelope breach (+1.0 SD)
      g.append("line")
        .attr("x1", 0)
        .attr("x2", innerWidth)
        .attr("y1", yScale(1.0))
        .attr("y2", yScale(1.0))
        .attr("stroke", "#f59e0b")
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "4 4");

      g.append("text")
        .attr("x", innerWidth - 85)
        .attr("y", yScale(1.0) - 4)
        .attr("fill", "#f59e0b")
        .attr("font-size", "7px")
        .text("Transgression Threshold (+1.0)");

      // X Axis
      g.append("g")
        .attr("transform", `translate(0,${innerHeight})`)
        .call(d3.axisBottom(xScale).tickSize(0))
        .call((gAxis) => gAxis.select(".domain").attr("stroke", "#334155"))
        .call((gAxis) =>
          gAxis
            .selectAll(".tick text")
            .attr("fill", (d) => (d === "Epistatic Pairs" ? "#fbbf24" : "#94a3b8"))
            .attr("font-size", "7.5px")
            .attr("font-weight", (d) => (d === "Epistatic Pairs" ? "bold" : "500"))
            .attr("dy", "8px")
        );
    }

    // =========================================================================
    // STAGE 3: Top Candidate Configurations (Rank Phase)
    // =========================================================================
    else if (activeWorkflowStep === 3) {
      const stage3Data = [
        { name: "Parent A", id: "parent_a", value: parentA.phenotype, color: "#38bdf8" },
        { name: "Parent B", id: "parent_b", value: parentB.phenotype, color: "#ec4899" },
        { name: "Candidate 1", id: "candidate_1", value: 2.1, color: "#fbbf24", isNovel: true, rank: "#1", score: 0.82 },
        { name: "Candidate 2", id: "candidate_2", value: 1.4, color: "#a855f7", rank: "#2", score: 0.67 },
        { name: "Candidate 3", id: "candidate_3", value: 0.8, color: "#38bdf8", rank: "#3", score: 0.54 },
      ];

      const xScale = d3
        .scaleBand()
        .domain(stage3Data.map((d) => d.name))
        .range([0, innerWidth])
        .padding(0.45);

      // Bars
      g.selectAll(".bar-stage3")
        .data(stage3Data)
        .enter()
        .append("rect")
        .attr("class", "bar-stage3")
        .attr("x", (d) => xScale(d.name)!)
        .attr("y", (d) => (d.value >= 0 ? yScale(d.value) : yScale(0)))
        .attr("width", xScale.bandwidth())
        .attr("height", (d) => Math.abs(yScale(d.value) - yScale(0)))
        .attr("rx", 3)
        .attr("fill", (d) => d.color)
        .attr("filter", (d) => (d.id === selectedCandidateId ? "drop-shadow(0 0 7px rgba(251,191,36,0.7))" : "none"))
        .attr("cursor", "pointer")
        .on("click", (_, d) => {
          if (d.id.startsWith("candidate")) {
            setSelectedCandidateId(d.id);
          }
        })
        .on("mouseenter", (e, d) => {
          setTooltip({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            title: d.name,
            subtitle: `Simulated Trait Value: ${d.value > 0 ? "+" : ""}${d.value.toFixed(1)} SD`,
            badge: d.rank ? `RANK ${d.rank} · SCORE ${d.score}` : "BASELINE",
            badgeColor: d.isNovel
              ? "bg-amber-500/20 text-amber-300 border-amber-500/50"
              : "bg-cyan-500/20 text-cyan-300 border-cyan-500/50",
            details: [
              { label: "Trait metric", value: `${d.value > 0 ? "+" : ""}${d.value.toFixed(1)} SD`, color: d.color },
              { label: "Status", value: d.isNovel ? "Novel Transgression" : "Within Parent Bounds", color: "#94a3b8" },
              { label: "Selection", value: d.id === selectedCandidateId ? "Active Selection" : "Click to inspect", color: "#fbbf24" },
            ],
          });
        })
        .on("mouseleave", () => setTooltip(null));

      // Peak circle indicator on selected candidate
      const selData = stage3Data.find((d) => d.id === selectedCandidateId) || stage3Data[2];
      const selX = xScale(selData.name)! + xScale.bandwidth() / 2;
      const selY = yScale(selData.value);
      g.append("circle")
        .attr("cx", selX)
        .attr("cy", selY)
        .attr("r", 3.5)
        .attr("fill", "#fbbf24")
        .attr("stroke", "#ffffff")
        .attr("stroke-width", 1.2)
        .attr("filter", "drop-shadow(0 0 5px #fbbf24)");

      // X Axis
      g.append("g")
        .attr("transform", `translate(0,${innerHeight})`)
        .call(d3.axisBottom(xScale).tickSize(0))
        .call((gAxis) => gAxis.select(".domain").attr("stroke", "#334155"))
        .call((gAxis) =>
          gAxis
            .selectAll(".tick text")
            .attr("fill", (d) => (d === "Candidate 1" ? "#fbbf24" : "#94a3b8"))
            .attr("font-size", "7.5px")
            .attr("font-weight", (d) => (d === "Candidate 1" ? "bold" : "normal"))
            .attr("dy", "8px")
        );
    }

    // =========================================================================
    // STAGE 4: Mechanistic Phenotype Intervention Waterfall (Explain Phase)
    // =========================================================================
    else if (activeWorkflowStep === 4) {
      // Stepped counterfactual rescue waterfall
      const waterfallData = [
        { step: "Observed", label: "Observed", startVal: 0, endVal: 2.10, delta: "+2.10", color: "#fbbf24", role: "Transgressive Phenotype" },
        { step: "- Epistasis", label: "- Epistasis", startVal: 2.10, endVal: 1.10, delta: "-1.00", color: "#f43f5e", role: "Ablating A × B synergy" },
        { step: "- Additive", label: "- Additive", startVal: 1.10, endVal: 0.70, delta: "-0.40", color: "#38bdf8", role: "Dosage adjustment" },
        { step: "- Dominance", label: "- Dominance", startVal: 0.70, endVal: 0.40, delta: "-0.30", color: "#c084fc", role: "Heterozygous correction" },
        { step: "Rescued", label: "Rescued", startVal: 0, endVal: 0.40, delta: "+0.40", color: "#10b981", role: "Parent B Envelope Concordance" },
      ];

      const xScale = d3
        .scaleBand()
        .domain(waterfallData.map((d) => d.step))
        .range([0, innerWidth])
        .padding(0.42);

      // Waterfall Bars
      g.selectAll(".bar-waterfall")
        .data(waterfallData)
        .enter()
        .append("rect")
        .attr("class", "bar-waterfall")
        .attr("x", (d) => xScale(d.step)!)
        .attr("y", (d) => yScale(Math.max(d.startVal, d.endVal)))
        .attr("width", xScale.bandwidth())
        .attr("height", (d) => Math.max(2, Math.abs(yScale(d.startVal) - yScale(d.endVal))))
        .attr("rx", 3)
        .attr("fill", (d) => d.color)
        .attr("filter", (d) => (d.step === "Rescued" ? "drop-shadow(0 0 8px rgba(16,185,129,0.7))" : "none"))
        .attr("cursor", "pointer")
        .on("mouseenter", (e, d) => {
          setTooltip({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            title: `Intervention Step: ${d.label}`,
            subtitle: `${d.role} (Delta: ${d.delta} SD)`,
            badge: d.step === "Rescued" ? "IN ENVELOPE (RESCUED)" : "STEPWISE DECOMPOSITION",
            badgeColor: d.step === "Rescued"
              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50"
              : "bg-rose-500/20 text-rose-300 border-rose-500/50",
            details: [
              { label: "Step Delta", value: `${d.delta} SD`, color: d.color },
              { label: "Cumulative Trait", value: `+${d.endVal.toFixed(2)} SD`, color: "#ffffff" },
              { label: "Envelope Bound", value: "[-1.5, +1.0] SD", color: "#38bdf8" },
              { label: "Novelty status", value: d.endVal <= 1.0 ? "Rescued within envelope" : "Outside envelope", color: d.endVal <= 1.0 ? "#10b981" : "#fbbf24" },
            ],
          });
        })
        .on("mouseleave", () => setTooltip(null));

      // Connecting dashed steps
      for (let i = 0; i < waterfallData.length - 2; i++) {
        const curr = waterfallData[i];
        const next = waterfallData[i + 1];
        const x1 = xScale(curr.step)! + xScale.bandwidth();
        const x2 = xScale(next.step)!;
        const yConnect = yScale(curr.endVal);

        g.append("line")
          .attr("x1", x1)
          .attr("x2", x2)
          .attr("y1", yConnect)
          .attr("y2", yConnect)
          .attr("stroke", "#64748b")
          .attr("stroke-width", 1)
          .attr("stroke-dasharray", "2 2");
      }

      // Indicator on Rescued (+0.40 SD)
      const resX = xScale("Rescued")! + xScale.bandwidth() / 2;
      const resY = yScale(0.40);
      g.append("circle")
        .attr("cx", resX)
        .attr("cy", resY)
        .attr("r", 3.5)
        .attr("fill", "#10b981")
        .attr("stroke", "#ffffff")
        .attr("stroke-width", 1.2)
        .attr("filter", "drop-shadow(0 0 6px #10b981)");

      // Rescued checkmark label
      g.append("text")
        .attr("x", resX)
        .attr("y", resY - 6)
        .attr("text-anchor", "middle")
        .attr("fill", "#10b981")
        .attr("font-size", "7.5px")
        .attr("font-weight", "bold")
        .text("✓ Rescued");

      // X Axis
      g.append("g")
        .attr("transform", `translate(0,${innerHeight})`)
        .call(d3.axisBottom(xScale).tickSize(0))
        .call((gAxis) => gAxis.select(".domain").attr("stroke", "#334155"))
        .call((gAxis) =>
          gAxis
            .selectAll(".tick text")
            .attr("fill", (d) => (d === "Rescued" ? "#10b981" : d === "Observed" ? "#fbbf24" : "#94a3b8"))
            .attr("font-size", "7.5px")
            .attr("font-weight", (d) => (d === "Rescued" || d === "Observed" ? "bold" : "normal"))
            .attr("dy", "8px")
        );
    }
  }, [
    activeWorkflowStep,
    selectedCandidateId,
    parentRange.min,
    parentRange.max,
    parentA.phenotype,
    parentB.phenotype,
    observedPhenotype,
    setSelectedCandidateId,
    setTooltip,
  ]);

  // Dynamic titles and right badges based on stage
  const stageHeaderConfig = {
    1: {
      title: "Phenotype Baseline vs Offspring",
      pillLabel: "Envelope: [-1.5, +1.0]",
      pillColor: "border-cyan-500/40 text-cyan-300",
    },
    2: {
      title: "Search Space Effect Distribution",
      pillLabel: "36 Configurations Evaluated",
      pillColor: "border-sky-500/40 text-sky-300",
    },
    3: {
      title: "Top Candidate Configurations",
      pillLabel: "Ranked Solutions",
      pillColor: "border-amber-500/40 text-amber-300",
    },
    4: {
      title: "Mechanistic Phenotype Intervention",
      pillLabel: "Rescued to +0.40 SD",
      pillColor: "border-emerald-500/40 text-emerald-300",
    },
  }[activeWorkflowStep] || {
    title: "Configuration Comparison",
    pillLabel: "Trait Value",
    pillColor: "border-slate-700/60 text-slate-300",
  };

  return (
    <div className="w-full h-full bg-[#070d1d]/85 backdrop-blur-md border border-slate-800/80 rounded-xl p-3 shadow-[0_8px_32px_rgba(0,0,0,0.6)] flex flex-col justify-between group hover:border-slate-700/80 transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/50 pb-1.5 mb-1">
        <div className="flex items-center gap-1.5">
          <span className="text-cyan-400 font-bold text-xs">|</span>
          <h2 className="text-xs font-semibold text-slate-100 tracking-wide font-sans">
            {stageHeaderConfig.title}
          </h2>
        </div>
        <div
          className={`flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-800/60 border text-[8.5px] font-mono cursor-pointer transition-colors ${stageHeaderConfig.pillColor}`}
        >
          <span>{stageHeaderConfig.pillLabel}</span>
          <span className="text-[7.5px] opacity-60">⌄</span>
        </div>
      </div>

      {/* D3 Bar / Waterfall Chart */}
      <div className="relative flex justify-center items-center flex-1 min-h-0">
        <svg ref={svgRef} viewBox="0 0 450 135" className="w-full h-[120px]" />
      </div>
    </div>
  );
};
