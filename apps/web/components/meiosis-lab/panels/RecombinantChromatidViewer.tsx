"use client";

import React from "react";
import { useMeiosisInteraction } from "../interactions/MeiosisInteractionContext";

export const RecombinantChromatidViewer: React.FC = () => {
  const {
    hoveredElement,
    setHoveredElement,
    selectedChromatid,
    setSelectedChromatid,
    selectedHomolog,
    setTooltip,
  } = useMeiosisInteraction();

  const chromatids = [
    {
      id: "chromatid_1" as const,
      label: "Parental (Maternal)",
      badge: "NON-RECOMBINANT",
      badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
      details: [
        { label: "Provenance", value: "100% Maternal Homolog", color: "#38bdf8" },
        { label: "Crossover Status", value: "Flanking non-exchange strand", color: "#94a3b8" },
      ],
      renderGraphic: () => (
        <svg viewBox="0 0 24 72" className="w-5 h-16">
          <defs>
            <linearGradient id="maternalCyl" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#0284c7" />
              <stop offset="35%" stopColor="#38bdf8" />
              <stop offset="70%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#0369a1" />
            </linearGradient>
          </defs>
          {/* Upper Arm */}
          <rect x="7" y="3" width="10" height="28" rx="4" fill="url(#maternalCyl)" stroke="#38bdf8" strokeWidth="0.8" />
          <rect x="7" y="10" width="10" height="2" fill="#e0f2fe" opacity="0.6" />
          <rect x="7" y="20" width="10" height="2" fill="#e0f2fe" opacity="0.6" />
          {/* Centromere Constriction */}
          <circle cx="12" cy="33" r="3.2" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" />
          {/* Lower Arm */}
          <rect x="7" y="35" width="10" height="34" rx="4" fill="url(#maternalCyl)" stroke="#38bdf8" strokeWidth="0.8" />
          <rect x="7" y="44" width="10" height="2" fill="#e0f2fe" opacity="0.6" />
          <rect x="7" y="56" width="10" height="2" fill="#e0f2fe" opacity="0.6" />
        </svg>
      ),
    },
    {
      id: "chromatid_2" as const,
      label: "Parental (Paternal)",
      badge: "NON-RECOMBINANT",
      badgeColor: "bg-pink-500/20 text-pink-300 border-pink-500/40",
      details: [
        { label: "Provenance", value: "100% Paternal Homolog", color: "#ec4899" },
        { label: "Crossover Status", value: "Flanking non-exchange strand", color: "#94a3b8" },
      ],
      renderGraphic: () => (
        <svg viewBox="0 0 24 72" className="w-5 h-16">
          <defs>
            <linearGradient id="paternalCyl" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#be185d" />
              <stop offset="35%" stopColor="#f472b6" />
              <stop offset="70%" stopColor="#be185d" />
              <stop offset="100%" stopColor="#9d174d" />
            </linearGradient>
          </defs>
          {/* Upper Arm */}
          <rect x="7" y="3" width="10" height="28" rx="4" fill="url(#paternalCyl)" stroke="#f472b6" strokeWidth="0.8" />
          <rect x="7" y="10" width="10" height="2" fill="#fce7f3" opacity="0.6" />
          <rect x="7" y="20" width="10" height="2" fill="#fce7f3" opacity="0.6" />
          {/* Centromere Constriction */}
          <circle cx="12" cy="33" r="3.2" fill="#0f172a" stroke="#f472b6" strokeWidth="1" />
          {/* Lower Arm */}
          <rect x="7" y="35" width="10" height="34" rx="4" fill="url(#paternalCyl)" stroke="#f472b6" strokeWidth="0.8" />
          <rect x="7" y="44" width="10" height="2" fill="#fce7f3" opacity="0.6" />
          <rect x="7" y="56" width="10" height="2" fill="#fce7f3" opacity="0.6" />
        </svg>
      ),
    },
    {
      id: "chromatid_3" as const,
      label: "Recombinant Chromatid 1",
      badge: "RECOMBINANT MOSAIC",
      badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/40",
      details: [
        { label: "Provenance", value: "62% Maternal / 38% Paternal", color: "#fbbf24" },
        { label: "Exchange Point", value: "Hotspot at 18.2 Mb", color: "#38bdf8" },
      ],
      renderGraphic: () => (
        <svg viewBox="0 0 24 72" className="w-5 h-16">
          <defs>
            <linearGradient id="recArm1" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="60%" stopColor="#0284c7" />
              <stop offset="70%" stopColor="#fbbf24" />
              <stop offset="78%" stopColor="#ec4899" />
              <stop offset="100%" stopColor="#be185d" />
            </linearGradient>
          </defs>
          {/* Upper Arm: Maternal Cyan */}
          <rect x="7" y="3" width="10" height="28" rx="4" fill="#0284c7" stroke="#38bdf8" strokeWidth="0.8" />
          <rect x="7" y="10" width="10" height="2" fill="#e0f2fe" opacity="0.6" />
          <rect x="7" y="20" width="10" height="2" fill="#e0f2fe" opacity="0.6" />
          {/* Centromere */}
          <circle cx="12" cy="33" r="3.2" fill="#0f172a" stroke="#fbbf24" strokeWidth="1" />
          {/* Lower Arm: Mosaic Recombinant */}
          <rect x="7" y="35" width="10" height="34" rx="4" fill="url(#recArm1)" stroke="#fbbf24" strokeWidth="1" />
          <rect x="7" y="52" width="10" height="2" fill="#fbbf24" />
        </svg>
      ),
    },
    {
      id: "chromatid_4" as const,
      label: "Recombinant Chromatid 2",
      badge: "RECOMBINANT MOSAIC",
      badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/40",
      details: [
        { label: "Provenance", value: "62% Paternal / 38% Maternal", color: "#fbbf24" },
        { label: "Exchange Point", value: "Hotspot at 18.2 Mb", color: "#ec4899" },
      ],
      renderGraphic: () => (
        <svg viewBox="0 0 24 72" className="w-5 h-16">
          <defs>
            <linearGradient id="recArm2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f472b6" />
              <stop offset="60%" stopColor="#be185d" />
              <stop offset="70%" stopColor="#fbbf24" />
              <stop offset="78%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>
          </defs>
          {/* Upper Arm: Paternal Pink */}
          <rect x="7" y="3" width="10" height="28" rx="4" fill="#be185d" stroke="#f472b6" strokeWidth="0.8" />
          <rect x="7" y="10" width="10" height="2" fill="#fce7f3" opacity="0.6" />
          <rect x="7" y="20" width="10" height="2" fill="#fce7f3" opacity="0.6" />
          {/* Centromere */}
          <circle cx="12" cy="33" r="3.2" fill="#0f172a" stroke="#fbbf24" strokeWidth="1" />
          {/* Lower Arm: Mosaic Recombinant */}
          <rect x="7" y="35" width="10" height="34" rx="4" fill="url(#recArm2)" stroke="#fbbf24" strokeWidth="1" />
          <rect x="7" y="52" width="10" height="2" fill="#fbbf24" />
        </svg>
      ),
    },
  ];

  return (
    <div className="w-full h-full bg-[#070d1d]/85 backdrop-blur-md border border-slate-800/80 rounded-xl p-3 shadow-[0_8px_32px_rgba(0,0,0,0.6)] flex flex-col justify-between group hover:border-slate-700/80 transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/50 pb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-cyan-400 font-bold text-xs">|</span>
          <h2 className="text-xs font-semibold text-slate-100 tracking-wide font-sans">
            Recombinant Chromatid Viewer
          </h2>
        </div>
      </div>

      {/* 4 Chromatid Columns */}
      <div className="grid grid-cols-4 gap-1.5 my-1.5">
        {chromatids.map((c) => {
          const isDirectlySelected = selectedChromatid === c.id || hoveredElement === c.id;
          const isHomologLinked =
            (selectedHomolog === "maternal" && (c.id === "chromatid_1" || c.id === "chromatid_3")) ||
            (selectedHomolog === "paternal" && (c.id === "chromatid_2" || c.id === "chromatid_4"));
          const isSelected = isDirectlySelected || isHomologLinked;

          return (
            <div
              key={c.id}
              onClick={() => {
                const next = selectedChromatid === c.id ? null : c.id;
                setSelectedChromatid(next);
                setHoveredElement(next);
              }}
              onMouseEnter={(e) => {
                setHoveredElement(c.id);
                setTooltip({
                  visible: true,
                  x: e.clientX,
                  y: e.clientY,
                  title: c.label,
                  subtitle: "Meiotic Chromatid Segment Analysis",
                  badge: c.badge,
                  badgeColor: c.badgeColor,
                  details: c.details,
                });
              }}
              onMouseLeave={() => {
                setHoveredElement(null);
                setTooltip(null);
              }}
              className={`flex flex-col items-center text-center p-1 rounded-lg cursor-pointer transition-all duration-200 border ${
                isSelected
                  ? "border-cyan-500/80 bg-cyan-950/40 shadow-[0_0_14px_rgba(56,189,248,0.35)] scale-105"
                  : "border-transparent hover:border-slate-800 hover:bg-slate-900/40"
              }`}
            >
              <div className="h-16 flex items-center justify-center">
                {c.renderGraphic()}
              </div>
              <div className="text-[7.5px] text-slate-300 font-medium leading-[1.15] mt-1 text-center whitespace-normal">
                {c.label.includes("(") ? (
                  <>
                    <span>{c.label.split("(")[0]}</span>
                    <br />
                    <span className="text-slate-400">({c.label.split("(")[1]}</span>
                  </>
                ) : c.label.includes("Chromatid") ? (
                  <>
                    <span>{c.label.split("Chromatid")[0]}</span>
                    <br />
                    <span className="text-slate-400">Chromatid {c.label.split("Chromatid")[1]}</span>
                  </>
                ) : (
                  c.label
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
