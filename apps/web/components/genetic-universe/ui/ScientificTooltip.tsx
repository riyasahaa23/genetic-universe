"use client";

import React from "react";
import { useInteraction } from "../context/InteractionContext";

export const ScientificTooltip: React.FC = () => {
  const { tooltip } = useInteraction();

  if (!tooltip || !tooltip.visible) return null;

  return (
    <div
      className="fixed pointer-events-none z-50 transition-transform duration-75 ease-out"
      style={{
        left: `${Math.min(window.innerWidth - 260, Math.max(20, tooltip.x + 15))}px`,
        top: `${Math.min(window.innerHeight - 180, Math.max(60, tooltip.y + 15))}px`,
      }}
    >
      <div className="w-64 rounded-xl bg-[#040817]/95 border border-sky-400/40 p-3 shadow-[0_10px_30px_rgba(0,0,0,0.9),0_0_15px_rgba(56,189,248,0.25)] backdrop-blur-xl">
        <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-sky-500/20">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <h4 className="text-xs font-semibold text-white tracking-wide">{tooltip.title}</h4>
          </div>
          {tooltip.badge && (
            <span
              className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                tooltip.badgeColor || "bg-sky-500/20 text-sky-300 border-sky-500/40"
              }`}
            >
              {tooltip.badge}
            </span>
          )}
        </div>

        {tooltip.subtitle && (
          <p className="text-[10px] text-slate-400 mb-2 leading-tight">{tooltip.subtitle}</p>
        )}

        <div className="space-y-1">
          {tooltip.details.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between text-[10.5px]">
              <span className="text-slate-400">{item.label}</span>
              <span className="font-mono font-medium" style={{ color: item.color || "#e2e8f0" }}>
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
