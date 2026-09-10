"use client";

import React, { useState, useEffect, useCallback } from "react";
import { PageExplanationConfig } from "./types";
import { ExplanationControls } from "./ExplanationControls";
import { ExplanationNarration } from "./ExplanationNarration";
import { ExplanationProgress } from "./ExplanationProgress";
import { ExplanationTechnicalModal } from "./ExplanationTechnicalModal";
import { flowAudio } from "../scientific-flow/audio/FlowAudioEngine";
import { RotateCcw, ArrowRight, Compass } from "lucide-react";

interface ScientificExplanationOverlayProps {
  config: PageExplanationConfig;
  isOpen: boolean;
  onClose: () => void;
  renderScene: (currentSceneIndex: number, reducedMotion: boolean) => React.ReactNode;
}

export const ScientificExplanationOverlay: React.FC<ScientificExplanationOverlayProps> = ({
  config,
  isOpen,
  onClose,
  renderScene,
}) => {
  const [currentSceneIndex, setCurrentSceneIndex] = useState<number>(0);
  const [sceneElapsed, setSceneElapsed] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [speed, setSpeed] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [isTechnicalOpen, setIsTechnicalOpen] = useState<boolean>(false);
  const [reducedMotion, setReducedMotion] = useState<boolean>(false);
  const [isFinished, setIsFinished] = useState<boolean>(false);

  // Prefers-reduced-motion check
  useEffect(() => {
    if (typeof window !== "undefined") {
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      setReducedMotion(mediaQuery.matches);
      const listener = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
      mediaQuery.addEventListener("change", listener);
      return () => mediaQuery.removeEventListener("change", listener);
    }
  }, []);

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setCurrentSceneIndex(0);
      setSceneElapsed(0);
      setIsPlaying(true);
      setIsFinished(false);
      flowAudio.playTransitionChime(0);
    }
  }, [isOpen]);

  const currentScene = config.scenes[currentSceneIndex] || config.scenes[0];

  const jumpToScene = useCallback((idx: number) => {
    const clamped = Math.max(0, Math.min(config.scenes.length - 1, idx));
    setCurrentSceneIndex(clamped);
    setSceneElapsed(0);
    setIsFinished(false);
    flowAudio.playTransitionChime(clamped);
  }, [config.scenes.length]);

  const nextScene = useCallback(() => {
    if (currentSceneIndex < config.scenes.length - 1) {
      jumpToScene(currentSceneIndex + 1);
    } else {
      setIsFinished(true);
      setIsPlaying(false);
    }
  }, [currentSceneIndex, config.scenes.length, jumpToScene]);

  const prevScene = useCallback(() => {
    if (currentSceneIndex > 0) {
      jumpToScene(currentSceneIndex - 1);
    }
  }, [currentSceneIndex, jumpToScene]);

  const replay = useCallback(() => {
    jumpToScene(0);
    setIsPlaying(true);
    setIsFinished(false);
  }, [jumpToScene]);

  const toggleMute = useCallback(() => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    flowAudio.setMuted(nextMuted);
  }, [isMuted]);

  // Autoplay ticker (50ms interval)
  useEffect(() => {
    if (!isOpen || !isPlaying || isFinished) return;

    const intervalMs = 50;
    const intervalSec = (intervalMs / 1000) * speed;

    const timer = setInterval(() => {
      setSceneElapsed((prev) => {
        const next = prev + intervalSec;
        if (next >= currentScene.duration) {
          if (currentSceneIndex < config.scenes.length - 1) {
            setCurrentSceneIndex((idx) => {
              const nextIdx = idx + 1;
              flowAudio.playTransitionChime(nextIdx);
              return nextIdx;
            });
            return 0;
          } else {
            setIsFinished(true);
            setIsPlaying(false);
            return currentScene.duration;
          }
        }
        return next;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isOpen, isPlaying, isFinished, speed, currentScene.duration, currentSceneIndex, config.scenes.length]);

  // Hotkeys
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        setIsPlaying((p) => !p);
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        nextScene();
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        prevScene();
      } else if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        replay();
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
          onClose();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, nextScene, prevScene, replay, toggleMute, isTechnicalOpen, onClose]);

  if (!isOpen) return null;

  const pastScenesDuration = config.scenes.slice(0, currentSceneIndex).reduce((acc, s) => acc + s.duration, 0);
  const totalElapsed = pastScenesDuration + sceneElapsed;
  const sceneProgress = Math.min(1, sceneElapsed / currentScene.duration);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Scientific Explanation Overlay"
      className="fixed inset-0 z-50 bg-[#030712]/95 backdrop-blur-xl select-none animate-fadeIn"
    >
      {/* 3D Biological & Scientific Scene provided by specific page */}
      <div className="absolute inset-0 z-10 pointer-events-auto">
        {renderScene(currentSceneIndex, reducedMotion)}
      </div>

      {/* Top Branding Pill */}
      <div className="fixed top-4 left-4 sm:left-8 z-50 flex items-center gap-2 pointer-events-auto">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#030712]/85 border border-sky-500/25 backdrop-blur-md shadow-lg">
          <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-500 flex items-center justify-center text-[10px] text-white font-bold">
            ✦
          </div>
          <div className="flex flex-col">
            <span className="text-[10.5px] font-mono font-bold tracking-wider text-slate-200 uppercase">
              {config.pageTitle}
            </span>
            <span className="text-[8px] font-mono text-sky-400">Scientific Explanation</span>
          </div>
        </div>
      </div>

      {/* Controls HUD */}
      <ExplanationControls
        isPlaying={isPlaying}
        onTogglePlay={() => setIsPlaying((p) => !p)}
        onPrevScene={prevScene}
        onNextScene={nextScene}
        onReplay={replay}
        onClose={onClose}
        isMuted={isMuted}
        onToggleMute={toggleMute}
        speed={speed}
        onChangeSpeed={setSpeed}
        reducedMotion={reducedMotion}
        onToggleReducedMotion={() => setReducedMotion((r) => !r)}
      />

      {/* Synchronized Narration */}
      <ExplanationNarration
        pageTitle={config.pageTitle}
        scene={currentScene}
        totalScenes={config.scenes.length}
        onOpenTechnical={() => setIsTechnicalOpen(true)}
        isTechnicalOpen={isTechnicalOpen}
      />

      {/* End-of-Explanation Overlay Box */}
      {isFinished && (
        <div className="absolute inset-x-0 bottom-24 z-40 pointer-events-auto flex flex-col items-center animate-fadeIn">
          <div className="p-4 sm:p-5 rounded-2xl bg-[#03081e]/90 border border-sky-500/40 backdrop-blur-xl shadow-[0_0_45px_rgba(14,165,233,0.35)] max-w-lg text-center space-y-3">
            <div className="text-[9.5px] font-mono uppercase tracking-[0.25em] text-sky-400 font-bold">
              EXPLANATION COMPLETE
            </div>
            <h3 className="text-lg font-serif text-white">
              {config.finalThesis}
            </h3>
            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-full text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 shadow-md transition-all flex items-center gap-1.5"
              >
                <span>Return to Page</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={replay}
                className="px-3.5 py-2 rounded-full text-xs font-semibold text-slate-300 hover:text-white bg-slate-900/80 border border-slate-700 hover:bg-slate-800 transition-all flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                <span>Replay</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Progress Timeline */}
      <ExplanationProgress
        scenes={config.scenes}
        currentSceneIndex={currentSceneIndex}
        sceneProgress={sceneProgress}
        onSelectScene={jumpToScene}
        totalElapsed={totalElapsed}
        totalDuration={config.totalDuration}
      />

      {/* Deep Technical Modal */}
      <ExplanationTechnicalModal
        pageTitle={config.pageTitle}
        detail={config.technicalDetail}
        isOpen={isTechnicalOpen}
        onClose={() => setIsTechnicalOpen(false)}
      />
    </div>
  );
};
