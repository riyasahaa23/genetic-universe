"use client";

import React from "react";
import { useValidation } from "./ValidationInteractionContext";

export const ValidationTooltip: React.FC = () => {
  const { tooltip } = useValidation();

  if (!tooltip || !tooltip.visible) return null;

  return (
    <div
      className="fixed z-50 pointer-events-none transition-all duration-75"
      style={{
        left: `${tooltip.x + 14}px`,
        top: `${tooltip.y + 14}px`,
      }}
    >
      <div className="bg-[#050b18]/95 backdrop-blur-md border border-cyan-500/40 rounded-xl p-3 shadow-[0_8px_32px_rgba(0,0,0,0.8)] max-w-xs text-left animate-in fade-in zoom-in-95 duration-100">
        {/* Badge */}
        {tooltip.badge && (
          <div className="mb-1.5">
            <span
              className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded border font-semibold ${
                tooltip.badgeColor || "bg-cyan-950/70 text-cyan-300 border-cyan-500/40"
              }`}
            >
              {tooltip.badge}
            </span>
          </div>
        )}

        {/* Title */}
        <h4 className="text-xs font-bold text-white font-sans tracking-wide">
          {tooltip.title}
        </h4>

        {/* Subtitle */}
        {tooltip.subtitle && (
          <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">
            {tooltip.subtitle}
          </p>
        )}

        {/* Details list */}
        {tooltip.details && tooltip.details.length > 0 && (
          <div className="mt-2 pt-1.5 border-t border-slate-800/80 space-y-1">
            {tooltip.details.map((detail, idx) => (
              <div key={idx} className="flex items-center justify-between text-[9px]">
                <span className="text-slate-400">{detail.label}</span>
                <span
                  className="font-mono font-medium"
                  style={{ color: detail.color || "#e2e8f0" }}
                >
                  {detail.value}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
