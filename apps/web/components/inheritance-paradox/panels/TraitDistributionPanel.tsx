"use client";

import React, { useMemo } from "react";
import { useParadoxInteraction } from "../interactions/ParadoxInteractionContext";

export const TraitDistributionPanel: React.FC = () => {
  const {
    hoveredDataCluster,
    setHoveredDataCluster,
    setTooltip,
    isParentAActive,
    isParentBActive,
    isOffspringActive,
    selectOrToggleElement,
  } = useParadoxInteraction();

  const anyActive = isParentAActive || isParentBActive || isOffspringActive;

  // Generate deterministic clusters of points
  const clusterA = useMemo(() => {
    const pts = [];
    // Parent A cluster (cyan)
    for (let i = 0; i < 35; i++) {
      const angle = (i * 137.5 * Math.PI) / 180;
      const r = 8 + (i % 7) * 3.8;
      pts.push({
        x: 172 + Math.cos(angle) * r * 1.45,
        y: 118 + Math.sin(angle) * r * 0.75,
        r: 1.4 + (i % 3) * 0.4,
      });
    }
    return pts;
  }, []);

  const clusterB = useMemo(() => {
    const pts = [];
    // Parent B cluster (magenta)
    for (let i = 0; i < 35; i++) {
      const angle = (i * 137.5 * Math.PI) / 180;
      const r = 8 + (i % 7) * 3.8;
      pts.push({
        x: 298 + Math.cos(angle) * r * 1.45,
        y: 128 + Math.sin(angle) * r * 0.75,
        r: 1.4 + (i % 3) * 0.4,
      });
    }
    return pts;
  }, []);

  // Offspring outlier point coordinates (elevated above clusters)
  const offspringPt = { x: 298, y: 104 };

  return (
    <div className="w-full bg-[#070d1d]/85 backdrop-blur-md border border-slate-800/80 rounded-xl p-3.5 shadow-[0_8px_32px_rgba(0,0,0,0.6)] relative group hover:border-slate-700/80 transition-all duration-300">
      {/* Panel Header */}
      <div className="flex items-center justify-between mb-1.5 border-b border-slate-800/50 pb-2">
        <h2 className="text-[12.5px] font-semibold text-slate-100 tracking-wide font-sans">
          Interactive Trait Distribution
        </h2>
        <button
          aria-label="Panel details"
          className="w-5 h-5 rounded-full bg-slate-800/60 border border-slate-700/50 flex items-center justify-center text-slate-400 hover:text-cyan-300 hover:border-cyan-500/50 transition-colors"
        >
          <span className="text-xs leading-none">›</span>
        </button>
      </div>

      {/* Trait Coordinate Space SVG */}
      <div className="relative w-full h-[142px]">
        <svg
          viewBox="0 0 520 150"
          className="w-full h-full overflow-visible select-none"
        >
          <defs>
            {/* Perspective ground plane grid pattern */}
            <linearGradient id="gridFade" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.0" />
            </linearGradient>

            {/* Glowing gold filter */}
            <filter id="goldGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Perspective 3D Grid Floor Lines */}
          <g opacity={0.35}>
            {/* Iso Transverse lines */}
            <line x1={80} y1={132} x2={440} y2={132} stroke="#1e293b" strokeWidth="1" />
            <line x1={110} y1={118} x2={410} y2={118} stroke="#1e293b" strokeWidth="0.8" />
            <line x1={140} y1={105} x2={380} y2={105} stroke="#1e293b" strokeWidth="0.6" />
            <line x1={165} y1={94} x2={355} y2={94} stroke="#1e293b" strokeWidth="0.5" />

            {/* Iso Receding lines to vanishing point */}
            <line x1={80} y1={132} x2={260} y2={82} stroke="#0ea5e9" strokeWidth="0.7" opacity={0.4} />
            <line x1={150} y1={132} x2={260} y2={82} stroke="#0ea5e9" strokeWidth="0.6" opacity={0.3} />
            <line x1={220} y1={132} x2={260} y2={82} stroke="#0ea5e9" strokeWidth="0.6" opacity={0.3} />
            <line x1={290} y1={132} x2={260} y2={82} stroke="#0ea5e9" strokeWidth="0.6" opacity={0.3} />
            <line x1={360} y1={132} x2={260} y2={82} stroke="#0ea5e9" strokeWidth="0.6" opacity={0.3} />
            <line x1={440} y1={132} x2={260} y2={82} stroke="#0ea5e9" strokeWidth="0.7" opacity={0.4} />
          </g>

          {/* Vertical Y Axis: Trait 2 */}
          <line x1={80} y1={132} x2={80} y2={28} stroke="#475569" strokeWidth="1.2" />
          <path d="M 77 32 L 80 26 L 83 32" fill="none" stroke="#475569" strokeWidth="1.2" />
          <text
            x={68}
            y={80}
            textAnchor="middle"
            className="text-[9.5px] fill-slate-400 font-sans"
            transform="rotate(-90 68 80)"
          >
            Trait 2
          </text>

          {/* Left Sloping Axis: Trait 1 */}
          <line x1={80} y1={132} x2={160} y2={142} stroke="#475569" strokeWidth="1.2" />
          <text
            x={100}
            y={148}
            className="text-[9.5px] fill-slate-400 font-sans"
          >
            Trait 1
          </text>

          {/* Right Receding Axis: Trait 3 */}
          <line x1={330} y1={132} x2={430} y2={138} stroke="#475569" strokeWidth="1.2" />
          <text
            x={365}
            y={148}
            className="text-[9.5px] fill-slate-400 font-sans"
          >
            Trait 3
          </text>

          {/* Cluster A: Parent A (Cyan) */}
          <g
            className="cursor-pointer transition-opacity duration-200"
            style={{
              opacity: anyActive ? (isParentAActive ? 1 : 0.3) : 1,
            }}
            onClick={() => selectOrToggleElement("parent_a")}
            onMouseEnter={(e) => {
              setHoveredDataCluster("parent_a");
              setTooltip({
                visible: true,
                x: e.clientX,
                y: e.clientY,
                title: "Parent A Cluster (Maternal)",
                subtitle: "Phenotypic space centered at Trait 1: -0.6, Trait 2: +0.2, Trait 3: -0.4",
                badge: "HOMOLOG COHORT A",
                badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
                details: [
                  { label: "Sample Density", value: "35 gametes simulated", color: "#38bdf8" },
                  { label: "Centroid", value: "[-0.62, +0.18, -0.41]", color: "#94a3b8" },
                  { label: "Dispersion Radius", value: "0.55 σ", color: "#e2e8f0" },
                ],
              });
            }}
            onMouseLeave={() => {
              setHoveredDataCluster(null);
              setTooltip(null);
            }}
          >
            {clusterA.map((pt, i) => (
              <circle
                key={i}
                cx={pt.x}
                cy={pt.y}
                r={isParentAActive ? pt.r + 0.6 : pt.r}
                fill="#38bdf8"
                opacity={isParentAActive ? 0.95 : 0.75}
              />
            ))}
          </g>

          {/* Cluster B: Parent B (Magenta) */}
          <g
            className="cursor-pointer transition-opacity duration-200"
            style={{
              opacity: anyActive ? (isParentBActive ? 1 : 0.3) : 1,
            }}
            onClick={() => selectOrToggleElement("parent_b")}
            onMouseEnter={(e) => {
              setHoveredDataCluster("parent_b");
              setTooltip({
                visible: true,
                x: e.clientX,
                y: e.clientY,
                title: "Parent B Cluster (Paternal)",
                subtitle: "Phenotypic space centered at Trait 1: +0.8, Trait 2: -0.3, Trait 3: +0.5",
                badge: "HOMOLOG COHORT B",
                badgeColor: "bg-pink-500/20 text-pink-300 border-pink-500/40",
                details: [
                  { label: "Sample Density", value: "35 gametes simulated", color: "#ec4899" },
                  { label: "Centroid", value: "[+0.78, -0.31, +0.52]", color: "#94a3b8" },
                  { label: "Dispersion Radius", value: "0.62 σ", color: "#e2e8f0" },
                ],
              });
            }}
            onMouseLeave={() => {
              setHoveredDataCluster(null);
              setTooltip(null);
            }}
          >
            {clusterB.map((pt, i) => (
              <circle
                key={i}
                cx={pt.x}
                cy={pt.y}
                r={isParentBActive ? pt.r + 0.6 : pt.r}
                fill="#ec4899"
                opacity={isParentBActive ? 0.95 : 0.75}
              />
            ))}
          </g>

          {/* Outlier: Offspring (Gold Beacon Dot) */}
          <g
            className="cursor-pointer transition-opacity duration-200"
            style={{
              opacity: anyActive ? (isOffspringActive ? 1 : 0.4) : 1,
            }}
            onClick={() => selectOrToggleElement("offspring")}
            onMouseEnter={(e) => {
              setHoveredDataCluster("offspring");
              setTooltip({
                visible: true,
                x: e.clientX,
                y: e.clientY,
                title: "Offspring Transgressive Outlier",
                subtitle: "Coordinate space beyond convex hull of both parental clusters",
                badge: "PHENOTYPIC BREAKOUT",
                badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/40",
                details: [
                  { label: "Coordinates", value: "Trait 1: +0.8, Trait 2: +1.65, Trait 3: +0.9", color: "#fbbf24" },
                  { label: "Parental Hull Distance", value: "+0.92 σ outside combined hull", color: "#38bdf8" },
                  { label: "Synergy Origin", value: "Cis coupling of L10 and L31", color: "#ec4899" },
                ],
              });
            }}
            onMouseLeave={() => {
              setHoveredDataCluster(null);
              setTooltip(null);
            }}
          >
            {/* Animated Halo */}
            <circle
              cx={offspringPt.x}
              cy={offspringPt.y}
              r={isOffspringActive ? 15 : 11}
              fill="#fbbf24"
              opacity={isOffspringActive ? 0.45 : 0.25}
              className="animate-ping"
              style={{ transformOrigin: `${offspringPt.x}px ${offspringPt.y}px` }}
            />
            {/* Outlier Core */}
            <circle
              cx={offspringPt.x}
              cy={offspringPt.y}
              r={isOffspringActive ? 6.2 : 4.8}
              fill="#fef08a"
              stroke="#fbbf24"
              strokeWidth={isOffspringActive ? 2.5 : 2}
              filter="url(#goldGlow)"
            />
          </g>
        </svg>

        {/* Pinned Callout Speech Bubble */}
        <div
          className={`absolute top-[22px] left-[265px] bg-[#0c142b]/95 border rounded-lg py-1.5 px-3 transition-all duration-300 pointer-events-none ${
            isOffspringActive
              ? "border-amber-400 shadow-[0_0_24px_rgba(251,191,36,0.6)] ring-1 ring-amber-400/50"
              : "border-slate-700/80 shadow-[0_4px_16px_rgba(0,0,0,0.8)]"
          }`}
        >
          <div className="text-[9.5px] text-slate-200 whitespace-nowrap leading-tight">
            A novel combination leads
            <br />
            to an <span className={isOffspringActive ? "text-amber-300 font-semibold" : ""}>unexpected phenotype</span>.
          </div>
        </div>

        {/* Legend in top-right corner */}
        <div className="absolute top-1 right-2 flex flex-col gap-1 bg-[#091124]/90 border border-slate-800/80 rounded-md p-1.5 text-[9px]">
          <div
            className={`flex items-center gap-1.5 cursor-pointer transition-colors ${
              isParentAActive ? "text-cyan-300 font-bold" : "text-slate-300 hover:text-cyan-300"
            }`}
            onClick={() => selectOrToggleElement("parent_a")}
            onMouseEnter={() => setHoveredDataCluster("parent_a")}
            onMouseLeave={() => setHoveredDataCluster(null)}
          >
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span>Parent A</span>
          </div>
          <div
            className={`flex items-center gap-1.5 cursor-pointer transition-colors ${
              isParentBActive ? "text-pink-300 font-bold" : "text-slate-300 hover:text-pink-300"
            }`}
            onClick={() => selectOrToggleElement("parent_b")}
            onMouseEnter={() => setHoveredDataCluster("parent_b")}
            onMouseLeave={() => setHoveredDataCluster(null)}
          >
            <span className="w-2 h-2 rounded-full bg-pink-400" />
            <span>Parent B</span>
          </div>
          <div
            className={`flex items-center gap-1.5 cursor-pointer transition-colors ${
              isOffspringActive ? "text-amber-300 font-bold" : "text-slate-300 hover:text-amber-300"
            }`}
            onClick={() => selectOrToggleElement("offspring")}
            onMouseEnter={() => setHoveredDataCluster("offspring")}
            onMouseLeave={() => setHoveredDataCluster(null)}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>Offspring</span>
          </div>
        </div>
      </div>
    </div>
  );
};
