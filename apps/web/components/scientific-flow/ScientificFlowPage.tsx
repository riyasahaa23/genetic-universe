"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { FLOW_STAGES, FlowStageConfig } from "./types";
import { FlowNarration } from "./FlowNarration";
import { FlowTimeline } from "./FlowTimeline";
import { FlowControls } from "./FlowControls";
import { TechnicalDetailModal } from "./TechnicalDetailModal";
import { flowAudio } from "./audio/FlowAudioEngine";
import { ArrowRight, Play, RotateCcw, FlaskConical, Sparkles } from "lucide-react";

// Dynamic import for R3F Scene to prevent SSR hydration mismatches
const ScientificFlowScene = dynamic(
  () => import("./ScientificFlowScene").then((m) => m.ScientificFlowScene),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 bg-[#030712] flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-2 border-cyan-400/20 border-t-cyan-400 animate-spin" />
      </div>
    ),
  }
);

export const ScientificFlowPage: React.FC = () => {
  const [currentStageIndex, setCurrentStageIndex] = useState<number>(0);
  const [stageElapsed, setStageElapsed] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [speed, setSpeed] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [isTechnicalOpen, setIsTechnicalOpen] = useState<boolean>(false);
  const [reducedMotion, setReducedMotion] = useState<boolean>(false);

  // Total runtime calculations
  const totalDuration = FLOW_STAGES.reduce((acc, s) => acc + s.duration, 0);
  const currentStage: FlowStageConfig = FLOW_STAGES[currentStageIndex];

  // Detect user prefers-reduced-motion
  useEffect(() => {
    if (typeof window !== "undefined") {
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      setReducedMotion(mediaQuery.matches);
      const listener = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
      mediaQuery.addEventListener("change", listener);
      return () => mediaQuery.removeEventListener("change", listener);
    }
  }, []);

  // Play transition sounds when stage changes
  const triggerStageAudio = useCallback((nextIndex: number) => {
    flowAudio.playTransitionChime(nextIndex);
    if (nextIndex === 3) {
      // Recombination
      flowAudio.playCrossoverShimmer();
    } else if (nextIndex === 6) {
      // Novelty
      flowAudio.playNoveltyChord();
    } else if (nextIndex === 8) {
      // Rescue
      flowAudio.playRescueChord();
    }
  }, []);

  // Jump to specific stage
  const jumpToStage = useCallback((index: number) => {
    const clamped = Math.max(0, Math.min(FLOW_STAGES.length - 1, index));
    setCurrentStageIndex(clamped);
    setStageElapsed(0);
    triggerStageAudio(clamped);
  }, [triggerStageAudio]);

  // Next / Previous Chapter navigation
  const nextStage = useCallback(() => {
    if (currentStageIndex < FLOW_STAGES.length - 1) {
      jumpToStage(currentStageIndex + 1);
    }
  }, [currentStageIndex, jumpToStage]);

  const prevStage = useCallback(() => {
    if (currentStageIndex > 0) {
      jumpToStage(currentStageIndex - 1);
    }
  }, [currentStageIndex, jumpToStage]);

  const replayFlow = useCallback(() => {
    jumpToStage(0);
    setIsPlaying(true);
  }, [jumpToStage]);

  // Toggle Audio Mute
  const toggleMute = useCallback(() => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    flowAudio.setMuted(nextMuted);
  }, [isMuted]);

  // Main automatic playback ticker (runs smoothly every 50ms)
  useEffect(() => {
    if (!isPlaying) return;

    const intervalMs = 50;
    const intervalSec = (intervalMs / 1000) * speed;

    const timer = setInterval(() => {
      setStageElapsed((prev) => {
        const next = prev + intervalSec;
        if (next >= currentStage.duration) {
          // Check if we can advance to next stage
          if (currentStageIndex < FLOW_STAGES.length - 1) {
            setCurrentStageIndex((idx) => {
              const nextIdx = idx + 1;
              triggerStageAudio(nextIdx);
              return nextIdx;
            });
            return 0;
          } else {
            // Reached the end (Summary stage) -> pause ticker and let user explore CTAs
            setIsPlaying(false);
            return currentStage.duration;
          }
        }
        return next;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlaying, speed, currentStage.duration, currentStageIndex, triggerStageAudio]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger hotkeys if user is in an input or modal is open
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === "Space") {
        e.preventDefault();
        setIsPlaying((p) => !p);
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        nextStage();
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        prevStage();
      } else if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        replayFlow();
      } else if (e.key === "m" || e.key === "M") {
        e.preventDefault();
        toggleMute();
      } else if (e.key === "t" || e.key === "T") {
        e.preventDefault();
        setIsTechnicalOpen((o) => !o);
      } else if (e.code === "Escape") {
        if (isTechnicalOpen) {
          setIsTechnicalOpen(false);
        } else {
          window.location.href = "/";
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextStage, prevStage, replayFlow, toggleMute, isTechnicalOpen]);

  // Compute total elapsed time across past stages + current
  const pastStagesDuration = FLOW_STAGES.slice(0, currentStageIndex).reduce(
    (acc, s) => acc + s.duration,
    0
  );
  const totalElapsed = pastStagesDuration + stageElapsed;
  const stageProgress = Math.min(1, stageElapsed / currentStage.duration);

  return (
    <div className="relative w-full h-screen min-h-[700px] bg-[#030712] text-slate-100 overflow-hidden select-none">
      {/* 3D Biological Scene (Persistent R3F Canvas) */}
      <ScientificFlowScene stageIndex={currentStageIndex} reducedMotion={reducedMotion} />

      {/* Top Left Branding Pill */}
      <div className="fixed top-4 left-4 sm:left-8 z-40 flex items-center gap-2 pointer-events-auto">
        <Link
          href="/"
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-[#030712]/80 border border-sky-500/20 backdrop-blur-md hover:border-sky-500/40 transition-all group"
        >
          <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-cyan-500 to-pink-500 flex items-center justify-center text-[10px] text-white font-bold">
            ✦
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-mono font-bold tracking-wider text-slate-200 group-hover:text-white uppercase">
              Scientific Flow
            </span>
            <span className="text-[8px] font-mono text-sky-400/80">Guided 3D Story</span>
          </div>
        </Link>
      </div>

      {/* Top Right Controls HUD */}
      <FlowControls
        isPlaying={isPlaying}
        onTogglePlay={() => setIsPlaying((p) => !p)}
        onPrevStage={prevStage}
        onNextStage={nextStage}
        onReplay={replayFlow}
        isMuted={isMuted}
        onToggleMute={toggleMute}
        speed={speed}
        onChangeSpeed={setSpeed}
        reducedMotion={reducedMotion}
        onToggleReducedMotion={() => setReducedMotion((r) => !r)}
      />

      {/* Stage Narration Subtitle Overlay */}
      <FlowNarration
        stage={currentStage}
        onOpenTechnical={() => setIsTechnicalOpen(true)}
        isTechnicalOpen={isTechnicalOpen}
      />

      {/* Final Summary CTAs Overlay (when on Chapter 10 Summary Stage) */}
      {currentStageIndex === FLOW_STAGES.length - 1 && (
        <div className="absolute inset-x-0 bottom-28 z-30 pointer-events-auto flex flex-col items-center animate-fadeIn">
          <div className="p-5 rounded-2xl bg-[#03081e]/90 border border-sky-500/40 backdrop-blur-xl shadow-[0_0_50px_rgba(14,165,233,0.35)] max-w-xl text-center space-y-4">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-sky-400 font-bold">
                SCIENTIFIC TOUR COMPLETE
              </div>
              <h3 className="text-xl font-serif text-white mt-1">
                Ready to explore or run your own experiment?
              </h3>
              <p className="text-xs text-slate-300 mt-1 font-sans">
                Proceed into the full interactive chapters or configure your own in-silico breeding run in the Launch Demo laboratory.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
              <Link
                href="/experiment"
                className="px-5 py-2.5 rounded-full text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 shadow-[0_0_20px_rgba(14,165,233,0.5)] transition-all flex items-center gap-2"
              >
                <FlaskConical className="w-3.5 h-3.5 text-sky-200" />
                <span>Launch Experiment</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>

              <Link
                href="/inheritance-paradox"
                className="px-4 py-2.5 rounded-full text-xs font-semibold text-slate-200 hover:text-white bg-white/5 border border-white/20 hover:bg-white/10 hover:border-white/30 backdrop-blur-md transition-all flex items-center gap-2"
              >
                <span>Explore Models (Page 2)</span>
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              </Link>

              <button
                type="button"
                onClick={replayFlow}
                className="px-4 py-2.5 rounded-full text-xs font-semibold text-slate-300 hover:text-white bg-slate-900/80 border border-slate-700 hover:bg-slate-800 transition-all flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                <span>Replay Flow</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Timeline Progress Bar */}
      <FlowTimeline
        currentStageIndex={currentStageIndex}
        stageProgress={stageProgress}
        onSelectStage={jumpToStage}
        totalElapsed={totalElapsed}
        totalDuration={totalDuration}
      />

      {/* Technical Detail Modal */}
      <TechnicalDetailModal
        stage={currentStage}
        isOpen={isTechnicalOpen}
        onClose={() => setIsTechnicalOpen(false)}
      />
    </div>
  );
};
