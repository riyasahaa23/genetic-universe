"use client";

import React from "react";
import { useValidation, NEGATIVE_CONTROLS } from "../ValidationInteractionContext";

export const BiologicalPlausibilityPanel: React.FC = () => {
  const {
    activeStage,
    selectedControl,
    setSelectedControl,
    showTooltip,
    hideTooltip,
  } = useValidation();

  const isStage4 = activeStage === 4;

  return (
    <div
      className={`h-full bg-[#040817]/90 backdrop-blur-md border rounded-2xl p-2.5 flex flex-col justify-between select-none transition-all duration-300 ${
        isStage4
          ? "border-emerald-500/60 shadow-[0_0_24px_rgba(16,185,129,0.2)] ring-1 ring-emerald-500/30"
          : "border-slate-800/80 shadow-[0_4px_24px_rgba(0,0,0,0.5)]"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-0.5">
        <h3 className="text-xs font-bold text-white font-sans tracking-wide">
          Biological Plausibility Checks
        </h3>
        {isStage4 && (
          <span className="text-[8.5px] font-mono text-emerald-300 bg-emerald-950/70 border border-emerald-500/40 px-1.5 py-0.2 rounded animate-pulse">
            5 CONTROLS PASS
          </span>
        )}
      </div>

      {/* 5 Negative Control Rows (scrollable/compact to fit 195px height) */}
      <div className="space-y-1 flex-1 flex flex-col justify-between py-0.5 overflow-hidden">
        {NEGATIVE_CONTROLS.map((chk) => {
          const isSelected = selectedControl === chk.id;
          return (
            <div
              key={chk.id}
              onClick={() => setSelectedControl(chk.id)}
              className={`flex items-center justify-between gap-2 px-2 py-1 rounded-xl transition-all duration-200 cursor-pointer ${
                isSelected
                  ? "bg-[#062016]/90 border border-emerald-400/80 shadow-[0_0_12px_rgba(16,185,129,0.25)]"
                  : "bg-[#050e20]/60 border border-slate-800/70 hover:border-slate-700"
              }`}
              onMouseEnter={(e) => {
                showTooltip({
                  x: e.clientX,
                  y: e.clientY,
                  title: chk.name,
                  subtitle: chk.desc,
                  badge: chk.badge,
                  badgeColor: chk.badgeColor,
                  details: [
                    { label: "Expected", value: chk.expected, color: "#94a3b8" },
                    { label: "Observed", value: chk.observed, color: "#34d399" },
                    { label: "Status", value: "Expected behavior observed", color: "#38bdf8" },
                  ],
                });
              }}
              onMouseLeave={hideTooltip}
            >
              <div className="flex items-center gap-2 min-w-0">
                {/* Status Icon */}
                <div
                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${chk.iconBg}`}
                >
                  {chk.icon}
                </div>

                {/* Label and Description */}
                <div className="flex flex-col text-left leading-tight min-w-0">
                  <span className="text-[9px] font-bold text-white truncate">
                    {chk.name}
                  </span>
                  <span className="text-[7.5px] text-slate-400 truncate">
                    {chk.desc}
                  </span>
                </div>
              </div>

              {/* Status Badge */}
              <span
                className={`text-[7.5px] font-mono uppercase px-1.5 py-0.2 rounded border font-semibold flex-shrink-0 ${chk.badgeColor}`}
              >
                {chk.status}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
