"use client";

import React from "react";
import { useMeiosisInteraction } from "./MeiosisInteractionContext";

export const MeiosisTooltip: React.FC = () => {
  const { tooltip } = useMeiosisInteraction();

  if (!tooltip || !tooltip.visible) return null;

  const safeX = Math.min(Math.max(16, tooltip.x + 14), typeof window !== "undefined" ? window.innerWidth - 320 : 1200);
  const safeY = Math.min(Math.max(70, tooltip.y - 12), typeof window !== "undefined" ? window.innerHeight - 240 : 800);

  return (
    <div
      className="fixed z-50 pointer-events-none transition-all duration-75 ease-out"
      style={{
        left: `${safeX}px`,
        top: `${safeY}px`,
      }}
    >
      <div className="w-72 bg-[#050b18]/95 backdrop-blur-xl border border-cyan-500/40 rounded-xl p-3.5 shadow-[0_12px_40px_rgba(0,0,0,0.85)] ring-1 ring-white/10">
        {/* Badge & Title */}
        {tooltip.badge && (
          <div className="mb-1.5 flex items-center justify-between">
            <span
              className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                tooltip.badgeColor || "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
              }`}
            >
              {tooltip.badge}
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
          </div>
        )}

        <h4 className="text-xs font-semibold text-white tracking-wide">
          {tooltip.title}
        </h4>

        {tooltip.subtitle && (
          <p className="text-[10px] text-slate-300 mt-0.5 leading-tight">
            {tooltip.subtitle}
          </p>
        )}

        {/* Key Metrics / Attributes */}
        {tooltip.details && tooltip.details.length > 0 && (
          <div className="mt-2.5 pt-2 border-t border-slate-800/80 space-y-1.5">
            {tooltip.details.map((d, i) => (
              <div key={i} className="flex items-center justify-between text-[10px]">
                <span className="text-slate-400">{d.label}</span>
                <span
                  className="font-mono font-medium truncate max-w-[140px] text-right"
                  style={{ color: d.color || "#e2e8f0" }}
                >
                  {d.value}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
