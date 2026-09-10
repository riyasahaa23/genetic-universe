"use client";

import React from "react";
import Link from "next/link";
import {
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Home,
  Sliders,
} from "lucide-react";

interface FlowControlsProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  onPrevStage: () => void;
  onNextStage: () => void;
  onReplay: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  speed: number;
  onChangeSpeed: (speed: number) => void;
  reducedMotion: boolean;
  onToggleReducedMotion: () => void;
}

export const FlowControls: React.FC<FlowControlsProps> = ({
  isPlaying,
  onTogglePlay,
  onPrevStage,
  onNextStage,
  onReplay,
  isMuted,
  onToggleMute,
  speed,
  onChangeSpeed,
  reducedMotion,
  onToggleReducedMotion,
}) => {
  return (
    <div className="fixed top-4 right-4 sm:right-8 z-40 flex items-center gap-2 select-none">
      {/* Play / Pause / Replay Bar */}
      <div className="flex items-center gap-1 p-1.5 rounded-full bg-[#030712]/80 border border-sky-500/20 backdrop-blur-md shadow-xl">
        <button
          type="button"
          onClick={onPrevStage}
          className="w-8 h-8 rounded-full flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          title="Previous Chapter (Left Arrow)"
        >
          <SkipBack className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={onTogglePlay}
          className="w-9 h-9 rounded-full flex items-center justify-center bg-gradient-to-r from-sky-500 to-blue-600 text-white font-bold shadow-[0_0_15px_rgba(14,165,233,0.5)] hover:shadow-[0_0_20px_rgba(14,165,233,0.8)] transition-all"
          title={isPlaying ? "Pause (Space)" : "Play (Space)"}
        >
          {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
        </button>

        <button
          type="button"
          onClick={onNextStage}
          className="w-8 h-8 rounded-full flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          title="Next Chapter (Right Arrow)"
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
          title={isMuted ? "Unmute Ambient Sound (M)" : "Mute Ambient Sound (M)"}
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
          className="px-2 py-1 rounded-full text-[10px] font-mono text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
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

      {/* Exit / Back to Home Button */}
      <Link
        href="/"
        className="px-3 py-1.5 rounded-full bg-[#030712]/80 border border-white/20 text-slate-300 hover:text-white hover:bg-white/10 transition-all flex items-center gap-1.5 text-xs font-mono shadow-lg"
        title="Return to Home Page (Esc)"
      >
        <Home className="w-3 h-3" />
        <span className="hidden sm:inline">Exit</span>
      </Link>
    </div>
  );
};
