"use client";

import React from "react";
import { ExplanationSceneConfig } from "./types";
import { Check } from "lucide-react";

interface ExplanationProgressProps {
  scenes: ExplanationSceneConfig[];
  currentSceneIndex: number;
  sceneProgress: number;
  onSelectScene: (index: number) => void;
  totalElapsed: number;
  totalDuration: number;
}

export const ExplanationProgress: React.FC<ExplanationProgressProps> = ({
  scenes,
  currentSceneIndex,
  sceneProgress,
  onSelectScene,
  totalElapsed,
  totalDuration,
}) => {
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="absolute bottom-5 left-4 sm:left-8 right-4 sm:right-8 z-40 pointer-events-auto select-none">
      <div className="max-w-3xl mx-auto p-2.5 sm:p-3 rounded-2xl bg-[#030712]/80 border border-sky-500/20 backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.8)]">
        {/* Top micro line: Status & Time */}
        <div className="flex items-center justify-between text-[10.5px] font-mono text-slate-400 mb-1.5 px-1">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-slate-200 font-semibold">
              Scene {currentSceneIndex + 1} of {scenes.length}:
            </span>
            <span className="text-sky-300">{scenes[currentSceneIndex].title}</span>
          </div>
          <div className="text-slate-400 font-mono text-[11px]">
            <span className="text-slate-200">{formatTime(totalElapsed)}</span>
            <span className="mx-1 text-slate-600">/</span>
            <span>{formatTime(totalDuration)}</span>
          </div>
        </div>

        {/* Nodes Track */}
        <div className="relative flex items-center justify-between">
          <div className="absolute left-3 right-3 top-1/2 -translate-y-1/2 h-[2px] bg-slate-800" />
          <div
            className="absolute left-3 top-1/2 -translate-y-1/2 h-[2px] bg-gradient-to-r from-sky-500 via-cyan-400 to-amber-300 transition-all duration-300"
            style={{
              width: `${((currentSceneIndex + sceneProgress) / Math.max(1, scenes.length - 1)) * 96}%`,
            }}
          />

          {scenes.map((scene, idx) => {
            const isCurrent = idx === currentSceneIndex;
            const isCompleted = idx < currentSceneIndex;

            return (
              <button
                key={scene.id}
                type="button"
                onClick={() => onSelectScene(idx)}
                className="relative z-10 flex flex-col items-center focus:outline-none group"
                title={`${scene.index + 1}. ${scene.title}`}
              >
                <div
                  className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isCurrent
                      ? "bg-cyan-500 text-slate-950 font-bold border-2 border-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.85)] scale-110"
                      : isCompleted
                      ? "bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 hover:scale-105"
                      : "bg-slate-900 border border-slate-700 text-slate-400 hover:border-slate-500"
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-3 h-3 stroke-[2.5]" />
                  ) : (
                    <span className="text-[9.5px] font-mono font-semibold">{scene.index + 1}</span>
                  )}
                </div>

                <span
                  className={`hidden sm:block text-[8.5px] font-mono mt-1 whitespace-nowrap transition-colors ${
                    isCurrent
                      ? "text-cyan-300 font-bold"
                      : isCompleted
                      ? "text-slate-400"
                      : "text-slate-500 group-hover:text-slate-300"
                  }`}
                >
                  {scene.title}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
