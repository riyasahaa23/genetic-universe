"use client";

import React, { ReactNode } from "react";
import { ChevronRight } from "lucide-react";

interface GlassPanelProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  onActionClick?: () => void;
  isActive?: boolean;
  actionHref?: string;
}

export const GlassPanel: React.FC<GlassPanelProps> = ({
  title,
  subtitle,
  children,
  className = "",
  onActionClick,
  isActive = false,
  actionHref,
}) => {
  return (
    <div
      className={`relative rounded-2xl transition-all duration-300 pointer-events-auto select-none ${
        isActive
          ? "border-sky-400/60 shadow-[0_0_30px_rgba(56,189,248,0.25),inset_0_1px_0_rgba(255,255,255,0.2)]"
          : "border-sky-500/20 hover:border-sky-400/40 hover:shadow-[0_12px_35px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.15),0_0_20px_rgba(56,189,248,0.1)]"
      } border bg-[#060e26]/80 backdrop-blur-xl shadow-[0_10px_30px_-5px_rgba(0,0,0,0.7)] ${className}`}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between px-4 pt-3.5 pb-2">
        <h3 className="text-[13px] font-medium tracking-wide text-slate-100 flex items-center gap-1.5">
          {title}
        </h3>
        {actionHref ? (
          <a
            href={actionHref}
            className="w-5 h-5 rounded-full border border-sky-400/30 flex items-center justify-center text-sky-400/90 hover:text-white hover:border-sky-400 hover:bg-sky-400/20 transition-all"
            aria-label={`Open ${title}`}
          >
            <ChevronRight className="w-3 h-3" />
          </a>
        ) : (
          <button
            type="button"
            onClick={onActionClick}
            className="w-5 h-5 rounded-full border border-sky-400/30 flex items-center justify-center text-sky-400/90 hover:text-white hover:border-sky-400 hover:bg-sky-400/20 transition-all"
            aria-label={`View details for ${title}`}
          >
            <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Main Content */}
      <div className="px-4 pb-3 pt-1">{children}</div>

      {/* Subtitle / Footer if present */}
      {subtitle && (
        <div className="px-4 pb-3.5 pt-0 text-[10px] text-slate-400/80 leading-tight">
          {subtitle}
        </div>
      )}
    </div>
  );
};
