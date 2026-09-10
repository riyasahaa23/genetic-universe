"use client";

import React from "react";
import { FlowStageConfig } from "./types";
import { BookOpen } from "lucide-react";

interface FlowNarrationProps {
  stage: FlowStageConfig;
  onOpenTechnical: () => void;
  isTechnicalOpen: boolean;
}

export const FlowNarration: React.FC<FlowNarrationProps> = ({
  stage,
  onOpenTechnical,
  isTechnicalOpen,
}) => {
  return (
    <div className="absolute top-6 sm:top-8 left-6 sm:left-12 right-6 sm:right-12 z-20 pointer-events-none flex flex-col items-center select-none">
      <div className="max-w-3xl w-full flex flex-col items-center text-center space-y-2.5">
        {/* Stage & Chapter Eyebrow */}
        <div className="flex items-center gap-2.5 animate-fadeIn">
          <span className="px-2.5 py-0.5 rounded-full text-[9.5px] font-mono font-semibold tracking-widest uppercase bg-sky-950/80 border border-sky-400/40 text-sky-300 shadow-[0_0_12px_rgba(56,189,248,0.25)]">
            CHAPTER 0{stage.chapterNumber} · {stage.title.toUpperCase()}
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-[8.5px] font-mono tracking-wider uppercase bg-slate-900/80 border border-slate-700/60 text-slate-300">
            {stage.annotationBadge}
          </span>
        </div>

        {/* LEVEL 1 — SIMPLE (Large Bold Elegant Explanation, max 8-12 words) */}
        <h2 className="text-xl sm:text-2xl md:text-3xl font-serif font-medium tracking-tight text-white leading-tight drop-shadow-[0_2px_15px_rgba(0,0,0,0.8)] animate-fadeIn">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-sky-200">
            {stage.simpleText}
          </span>
        </h2>

        {/* LEVEL 2 — SCIENTIFIC (Smaller technical line using precise terminology) */}
        <div className="max-w-2xl px-4 py-2 rounded-xl bg-[#03091e]/75 border border-sky-500/20 backdrop-blur-md shadow-lg pointer-events-auto flex flex-col sm:flex-row items-center justify-between gap-3 animate-fadeIn">
          <p className="text-xs sm:text-[13px] font-sans text-slate-300/95 leading-relaxed text-center sm:text-left">
            {stage.scientificText}
          </p>

          <button
            type="button"
            onClick={onOpenTechnical}
            className={`flex-shrink-0 px-2.5 py-1 rounded-lg text-[10.5px] font-mono font-medium transition-all flex items-center gap-1.5 border ${
              isTechnicalOpen
                ? "bg-sky-500/20 border-sky-400 text-sky-200 shadow-[0_0_10px_rgba(56,189,248,0.4)]"
                : "bg-white/5 border-white/15 text-slate-300 hover:text-white hover:bg-white/10 hover:border-white/30"
            }`}
          >
            <BookOpen className="w-3 h-3 text-sky-400" />
            <span>Technical Detail</span>
          </button>
        </div>
      </div>
    </div>
  );
};
