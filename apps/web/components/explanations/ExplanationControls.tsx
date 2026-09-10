"use client";

import React from "react";
import {
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  X,
  Sliders,
} from "lucide-react";

interface ExplanationControlsProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  onPrevScene: () => void;
  onNextScene: () => void;
  onReplay: () => void;
  onClose: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  speed: number;
  onChangeSpeed: (speed: number) => void;
  reducedMotion: boolean;
  onToggleReducedMotion: () => void;
}

export const ExplanationControls: React.FC<ExplanationControlsProps> = ({
  isPlaying,
  onTogglePlay,
  onPrevScene,
  onNextScene,
  onReplay,
  onClose,
  isMuted,
  onToggleMute,
  speed,
  onChangeSpeed,
  reducedMotion,
  onToggleReducedMotion,
}) => {
  return (
    <div className="fixed top-4 right-4 sm:right-8 z-50 flex items-center gap-2 select-none">
      {/* Control Pills */}
      <div className="flex items-center gap-1 p-1.5 rounded-full bg-[#030712]/85 border border-sky-500/25 backdrop-blur-xl shadow-2xl">
        <button
          type="button"
          onClick={onPrevScene}
          className="w-8 h-8 rounded-full flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          title="Previous Scene (Left Arrow)"
        >
          <SkipBack className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={onTogglePlay}
          className="w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-r from-sky-500 to-blue-600 text-white font-bold shadow-[0_0_12px_rgba(14,165,233,0.5)] hover:shadow-[0_0_18px_rgba(14,165,233,0.8)] transition-all"
          title={isPlaying ? "Pause (Space)" : "Play (Space)"}
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
        </button>

        <button
          type="button"
          onClick={onNextScene}
          className="w-8 h-8 rounded-full flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          title="Next Scene (Right Arrow)"
        >
          <SkipForward className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={onReplay}
          className="w-8 h-8 rounded-full flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          title="Replay from Start (R)"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        <div className="h-4 w-[1px] bg-slate-700 mx-1" />

        {/* Audio Mute/Unmute */}
        <button
          type="button"
          onClick={onToggleMute}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
            isMuted ? "text-slate-400 hover:text-white hover:bg-white/10" : "text-cyan-300 bg-cyan-950/60 border border-cyan-500/40"
          }`}
          title={isMuted ? "Unmute Sound (M)" : "Mute Sound (M)"}
        >
          {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
        </button>

        {/* Playback speed toggle */}
        <button
          type="button"
          onClick={() => {
            const speeds = [1, 1.5, 2];
            const next = speeds[(speeds.indexOf(speed) + 1) % speeds.length];
            onChangeSpeed(next);
          }}
          className="px-2 py-0.5 rounded-full text-[10px] font-mono text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          title="Playback Speed"
        >
          {speed}x
        </button>

        {/* Reduced Motion Toggle */}
        <button
          type="button"
          onClick={onToggleReducedMotion}
          className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-mono transition-colors ${
            reducedMotion ? "text-amber-300 bg-amber-950/60 border border-amber-500/40" : "text-slate-400 hover:text-white hover:bg-white/10"
          }`}
          title={reducedMotion ? "Reduced Motion Enabled" : "Enable Reduced Motion"}
        >
          <Sliders className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Close / Return to Page */}
      <button
        type="button"
        onClick={onClose}
        className="w-8 h-8 rounded-full bg-[#030712]/85 border border-white/20 text-slate-300 hover:text-white hover:bg-white/15 transition-all flex items-center justify-center shadow-lg"
        title="Close Explanation (Esc)"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
