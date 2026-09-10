"use client";

import React from "react";
import { FlowStageConfig } from "./types";
import { X, Dna, Cpu, Lightbulb } from "lucide-react";

interface TechnicalDetailModalProps {
  stage: FlowStageConfig;
  isOpen: boolean;
  onClose: () => void;
}

export const TechnicalDetailModal: React.FC<TechnicalDetailModalProps> = ({
  stage,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const { technicalDetail } = stage;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn select-none pointer-events-auto">
      <div className="relative w-full max-w-xl rounded-2xl bg-[#060e24] border border-sky-500/30 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.9)] text-slate-200">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-sky-500/20 pb-3 mb-4">
          <div>
            <div className="text-[10px] font-mono tracking-widest text-sky-400 uppercase">
              CHAPTER 0{stage.chapterNumber} · TECHNICAL COMPREHENSION
            </div>
            <h3 className="text-lg font-serif font-bold text-white mt-0.5">
              {technicalDetail.title}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="space-y-4 text-xs font-sans leading-relaxed">
          {/* Biological Mechanism */}
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center gap-1.5 text-cyan-300 font-mono text-[10.5px] font-semibold mb-1">
              <Dna className="w-3.5 h-3.5" />
              <span>Biological Mechanism</span>
            </div>
            <p className="text-slate-300">{technicalDetail.biologicalContext}</p>
          </div>

          {/* Computational Role */}
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center gap-1.5 text-indigo-300 font-mono text-[10.5px] font-semibold mb-1">
              <Cpu className="w-3.5 h-3.5" />
              <span>Computational Engine Role</span>
            </div>
            <p className="text-slate-300">{technicalDetail.computationalRole}</p>
          </div>

          {/* Mathematical Formulation (if present) */}
          {technicalDetail.formula && (
            <div className="p-3 rounded-xl bg-blue-950/40 border border-sky-500/30 font-mono text-center">
              <div className="text-[9.5px] text-sky-400 uppercase tracking-widest mb-1 font-semibold">
                Model Formulation
              </div>
              <div className="text-sm text-amber-300 font-bold">
                {technicalDetail.formula}
              </div>
            </div>
          )}

          {/* Key Scientific Takeaway */}
          <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30">
            <div className="flex items-center gap-1.5 text-emerald-300 font-mono text-[10.5px] font-semibold mb-1">
              <Lightbulb className="w-3.5 h-3.5" />
              <span>Key Scientific Principle</span>
            </div>
            <p className="text-emerald-200/90 font-medium">{technicalDetail.keyTakeaway}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-full text-xs font-mono font-medium bg-sky-600 hover:bg-sky-500 text-white transition-colors shadow-[0_0_12px_rgba(14,165,233,0.4)]"
          >
            Close Detail
          </button>
        </div>
      </div>
    </div>
  );
};
