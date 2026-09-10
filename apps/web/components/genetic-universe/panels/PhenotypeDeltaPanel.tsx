"use client";

import React, { useMemo, useState } from "react";
import { GlassPanel } from "../ui/GlassPanel";
import { useInteraction } from "../context/InteractionContext";

interface DataPoint {
  x: number; // log allele frequency (0 to 1)
  y: number; // phenotypic effect (-2.5 to 2.5)
  category: "increased" | "decreased" | "unchanged";
  isNovel?: boolean;
}

export const PhenotypeDeltaPanel: React.FC = () => {
  const { setHoveredLocus, setTooltip, setHoveredChromosome } = useInteraction();
  const [hoveredPoint, setHoveredPoint] = useState<DataPoint | null>(null);

  // Generate deterministic scientific scatter data
  const dataPoints: DataPoint[] = useMemo(() => {
    const points: DataPoint[] = [];

    // Dense cloud around baseline (Unchanged)
    for (let i = 0; i < 45; i++) {
      const u = (i + 1) / 46;
      const x = 0.05 + u * 0.85;
      const noise = Math.sin(i * 997) * 0.45;
      points.push({ x, y: noise, category: "unchanged" });
    }

    // Decreased (Cyan dots in negative quadrant)
    for (let i = 0; i < 28; i++) {
      const u = (i + 1) / 29;
      const x = 0.08 + u * 0.75;
      const y = -0.6 - Math.abs(Math.cos(i * 613)) * 1.1;
      points.push({ x, y, category: "decreased" });
    }

    // Increased (Gold dots rising sharply into novelty region)
    for (let i = 0; i < 24; i++) {
      const u = (i + 1) / 25;
      const x = 0.55 + u * 0.42;
      const y = 0.5 + u * 1.7 + (Math.sin(i * 123) * 0.2);
      points.push({ x, y, category: "increased", isNovel: y > 1.4 });
    }

    return points;
  }, []);

  // Dimensions
  const plotWidth = 220;
  const plotHeight = 90;
  const paddingLeft = 32;
  const paddingBottom = 22;
  const paddingTop = 8;
  const paddingRight = 10;

  const innerW = plotWidth - paddingLeft - paddingRight;
  const innerH = plotHeight - paddingTop - paddingBottom;

  // Scale functions
  const scaleX = (val: number) => paddingLeft + val * innerW;
  const scaleY = (val: number) => paddingTop + ((2.5 - val) / 5) * innerH;

  return (
    <GlassPanel
      title="Phenotype Delta"
      subtitle=""
      className="w-[260px] lg:w-[285px]"
    >
      <div className="pt-1 pb-1">
        <div className="relative">
          {/* SVG Scientific Plot */}
          <svg width={plotWidth} height={plotHeight} className="overflow-visible select-none">
            {/* Gridlines */}
            <line
              x1={paddingLeft}
              y1={scaleY(2)}
              x2={plotWidth - paddingRight}
              y2={scaleY(2)}
              stroke="#1e293b"
              strokeWidth="0.8"
              strokeDasharray="2 2"
            />
            <line
              x1={paddingLeft}
              y1={scaleY(0)}
              x2={plotWidth - paddingRight}
              y2={scaleY(0)}
              stroke="#334155"
              strokeWidth="1"
            />
            <line
              x1={paddingLeft}
              y1={scaleY(-2)}
              x2={plotWidth - paddingRight}
              y2={scaleY(-2)}
              stroke="#1e293b"
              strokeWidth="0.8"
              strokeDasharray="2 2"
            />

            {/* Y Axis Line */}
            <line
              x1={paddingLeft}
              y1={paddingTop}
              x2={paddingLeft}
              y2={plotHeight - paddingBottom}
              stroke="#475569"
              strokeWidth="1"
            />

            {/* X Axis Line */}
            <line
              x1={paddingLeft}
              y1={plotHeight - paddingBottom}
              x2={plotWidth - paddingRight}
              y2={plotHeight - paddingBottom}
              stroke="#475569"
              strokeWidth="1"
            />

            {/* Y Ticks & Labels */}
            <text x={paddingLeft - 6} y={scaleY(2) + 3} textAnchor="end" className="fill-slate-400 text-[8.5px] font-mono">
              2
            </text>
            <text x={paddingLeft - 6} y={scaleY(0) + 3} textAnchor="end" className="fill-slate-400 text-[8.5px] font-mono">
              0
            </text>
            <text x={paddingLeft - 6} y={scaleY(-2) + 3} textAnchor="end" className="fill-slate-400 text-[8.5px] font-mono">
              -2
            </text>

            {/* Y Axis Label (Vertical) */}
            <text
              transform={`rotate(-90) translate(-${plotHeight / 2 + 5}, 10)`}
              textAnchor="middle"
              className="fill-slate-400 text-[8px] tracking-wider uppercase font-sans"
            >
              Phenotypic effect
            </text>

            {/* X Ticks & Labels */}
            <text x={scaleX(0.05)} y={plotHeight - 8} textAnchor="middle" className="fill-slate-400 text-[8.5px] font-mono">
              10⁻³
            </text>
            <text x={scaleX(0.35)} y={plotHeight - 8} textAnchor="middle" className="fill-slate-400 text-[8.5px] font-mono">
              10⁻²
            </text>
            <text x={scaleX(0.68)} y={plotHeight - 8} textAnchor="middle" className="fill-slate-400 text-[8.5px] font-mono">
              10⁻¹
            </text>
            <text x={scaleX(0.95)} y={plotHeight - 8} textAnchor="middle" className="fill-slate-400 text-[8.5px] font-mono">
              10⁰
            </text>

            {/* Parental Envelope Upper Bound Line */}
            <line
              x1={paddingLeft}
              y1={scaleY(1.3)}
              x2={plotWidth - paddingRight}
              y2={scaleY(1.3)}
              stroke="#f59e0b"
              strokeWidth="0.8"
              strokeDasharray="3 3"
              strokeOpacity="0.4"
            />

            {/* Data Points */}
            {dataPoints.map((pt, i) => {
              const cx = scaleX(pt.x);
              const cy = scaleY(pt.y);

              let fill = "#64748b";
              let r = 2;
              if (pt.category === "decreased") {
                fill = "#38bdf8";
              } else if (pt.category === "increased") {
                fill = "#fbbf24";
                r = pt.isNovel ? 2.8 : 2.2;
              }

              return (
                <circle
                  key={i}
                  cx={cx}
                  cy={cy}
                  r={r}
                  fill={fill}
                  fillOpacity={pt.category === "unchanged" ? 0.6 : 0.85}
                  className="cursor-pointer transition-all hover:scale-150 hover:fill-white"
                  onMouseEnter={(e) => {
                    setHoveredPoint(pt);
                    if (pt.isNovel) {
                      setHoveredLocus(10);
                      setHoveredChromosome("offspring");
                    }
                    setTooltip({
                      visible: true,
                      x: e.clientX,
                      y: e.clientY,
                      title: pt.isNovel
                        ? "Transgressive Epistatic Novelty"
                        : pt.category === "increased"
                        ? "Positive Additive Allele"
                        : pt.category === "decreased"
                        ? "Negative Additive Effect"
                        : "Neutral Baseline Locus",
                      subtitle: pt.isNovel
                        ? "Offspring value (+31.0) exceeds Parental Bound (18.0)"
                        : undefined,
                      badge: pt.isNovel ? "OUTSIDE PARENTAL ENVELOPE" : "MODEL-RELATIVE",
                      badgeColor: pt.isNovel
                        ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                        : "bg-slate-500/20 text-slate-300 border-slate-500/40",
                      details: [
                        { label: "Phenotypic Effect (Y)", value: `${pt.y > 0 ? "+" : ""}${pt.y.toFixed(2)} σ`, color: fill },
                        { label: "Allele Frequency (X)", value: `10^${(-3 + pt.x * 3).toFixed(1)}`, color: "#94a3b8" },
                        { label: "Attribution", value: pt.isNovel ? "Co-assembly: L10 × L31 in cis" : "Standard meiotic transmission", color: "#38bdf8" },
                      ],
                    });
                  }}
                  onMouseLeave={() => {
                    setHoveredPoint(null);
                    setHoveredLocus(null);
                    setHoveredChromosome(null);
                    setTooltip(null);
                  }}
                />
              );
            })}
          </svg>

          {/* Allele Frequency X-label centered */}
          <div className="text-center text-[9px] font-sans tracking-wide text-slate-400 mt-0.5">
            Allele frequency
          </div>

          {/* Legend */}
          <div className="flex items-center justify-end gap-3 text-[9px] text-slate-300 mt-1">
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_4px_#f59e0b]" />
              <span>Increased</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
              <span>Decreased</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
              <span>Unchanged</span>
            </div>
          </div>
        </div>
      </div>
    </GlassPanel>
  );
};
