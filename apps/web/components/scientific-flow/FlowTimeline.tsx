"use client";

import React from "react";
import { FLOW_STAGES } from "./types";
import { Check } from "lucide-react";

interface FlowTimelineProps {
  currentStageIndex: number;
  stageProgress: number; // 0 to 1 progress within current stage
  onSelectStage: (index: number) => void;
  totalElapsed: number;
  totalDuration: number;
}

export const FlowTimeline: React.FC<FlowTimelineProps> = ({
  currentStageIndex,
  stageProgress,
  onSelectStage,
  totalElapsed,
  totalDuration,
}) => {
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="absolute bottom-5 left-4 sm:left-8 right-4 sm:right-8 z-30 pointer-events-auto select-none">
      <div className="max-w-5xl mx-auto p-3 sm:p-4 rounded-2xl bg-[#030712]/80 border border-sky-500/20 backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.8)]">
        {/* Top bar: Stage status & Time */}
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-2 px-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-slate-200 font-semibold">
              Stage {currentStageIndex + 1} of {FLOW_STAGES.length}:
            </span>
            <span className="text-sky-300">{FLOW_STAGES[currentStageIndex].title}</span>
          </div>
          <div className="text-slate-400 font-mono text-xs">
            <span className="text-slate-200">{formatTime(totalElapsed)}</span>
            <span className="mx-1 text-slate-600">/</span>
            <span>{formatTime(totalDuration)}</span>
          </div>
        </div>

        {/* Timeline connected nodes */}
        <div className="relative flex items-center justify-between">
          {/* Background connect line */}
          <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-[2px] bg-slate-800" />

          {/* Active progress track up to current stage */}
          <div
            className="absolute left-4 top-1/2 -translate-y-1/2 h-[2px] bg-gradient-to-r from-sky-500 via-cyan-400 to-amber-300 transition-all duration-300"
            style={{
              width: `${((currentStageIndex + stageProgress) / (FLOW_STAGES.length - 1)) * 96}%`,
            }}
          />

          {FLOW_STAGES.map((stage, idx) => {
            const isCurrent = idx === currentStageIndex;
            const isCompleted = idx < currentStageIndex;

            return (
              <button
                key={stage.id}
                type="button"
                onClick={() => onSelectStage(idx)}
                className="relative group z-10 flex flex-col items-center focus:outline-none"
                title={`${stage.chapterNumber}. ${stage.title}`}
              >
                {/* Node dot */}
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isCurrent
                      ? "bg-cyan-500 text-slate-950 font-bold border-2 border-cyan-200 shadow-[0_0_18px_rgba(6,182,212,0.85)] scale-110"
                      : isCompleted
                      ? "bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 hover:scale-105"
                      : "bg-slate-900 border border-slate-700/80 text-slate-400 hover:border-slate-500 hover:text-slate-200"
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  ) : (
                    <span className="text-[10px] font-mono font-semibold">{stage.chapterNumber}</span>
                  )}
                </div>

                {/* Micro label below */}
                <span
                  className={`hidden md:block text-[9px] font-mono mt-1.5 whitespace-nowrap transition-colors ${
                    isCurrent
                      ? "text-cyan-300 font-bold"
                      : isCompleted
                      ? "text-slate-400"
                      : "text-slate-500 group-hover:text-slate-300"
                  }`}
                >
                  {stage.title}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
