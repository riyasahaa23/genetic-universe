"use client";

import React from "react";
import Link from "next/link";

export const ParadoxJourneyCards: React.FC = () => {
  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-3">
      {/* Step 01: Parental Genomes (Links to Page 1) */}
      <Link
        href="/"
        className="group relative flex items-center gap-3 p-2.5 rounded-xl bg-[#080e1f]/80 backdrop-blur-md border border-slate-800/80 hover:border-cyan-500/40 hover:bg-[#0c152e]/80 transition-all duration-300"
      >
        {/* Icon Thumbnail */}
        <div className="w-10 h-10 rounded-lg bg-[#050a16] border border-slate-800 flex items-center justify-center flex-shrink-0 group-hover:border-slate-700 transition-colors">
          <svg viewBox="0 0 28 28" className="w-5 h-5">
            <rect x="7" y="4" width="4" height="20" rx="2" fill="#0284c7" stroke="#38bdf8" strokeWidth="0.8" />
            <rect x="17" y="4" width="4" height="20" rx="2" fill="#be185d" stroke="#f472b6" strokeWidth="0.8" />
          </svg>
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[10.5px] font-mono text-cyan-400 font-medium">01</span>
            <h3 className="text-xs font-semibold text-slate-100 group-hover:text-cyan-300 transition-colors">
              Parental Genomes
            </h3>
          </div>
          <p className="text-[9.5px] text-slate-400 leading-tight mt-0.5 truncate">
            Explore phased haplotypes, structural variation, and genetic context.
          </p>
        </div>

        {/* Circular Arrow Button */}
        <div className="w-6 h-6 rounded-full bg-slate-900 border border-slate-700/60 flex items-center justify-center text-slate-400 group-hover:text-cyan-300 group-hover:border-cyan-500/60 transition-all flex-shrink-0">
          <span className="text-[11px] leading-none">→</span>
        </div>
      </Link>

      {/* Step 02: Inheritance Paradox (ACTIVE!) */}
      <div className="relative flex items-center gap-3 p-2.5 rounded-xl bg-gradient-to-r from-cyan-950/40 to-[#080e1f]/90 backdrop-blur-md border border-cyan-500/60 shadow-[0_0_20px_rgba(56,189,248,0.15)] ring-1 ring-cyan-500/30">
        {/* Icon Thumbnail */}
        <div className="w-10 h-10 rounded-lg bg-[#050f24] border border-cyan-500/50 flex items-center justify-center flex-shrink-0 shadow-[0_0_12px_rgba(56,189,248,0.25)]">
          <svg viewBox="0 0 28 28" className="w-5 h-5">
            <circle cx="14" cy="14" r="8" fill="none" stroke="#38bdf8" strokeWidth="1.2" strokeDasharray="3 2" />
            <circle cx="14" cy="14" r="3.5" fill="#fbbf24" opacity="0.9" />
            <circle cx="14" cy="14" r="10" fill="none" stroke="#f472b6" strokeWidth="0.8" opacity="0.6" />
          </svg>
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[10.5px] font-mono text-cyan-300 font-bold">02</span>
            <h3 className="text-xs font-semibold text-white">
              Inheritance Paradox
            </h3>
          </div>
          <p className="text-[9.5px] text-slate-300 leading-tight mt-0.5 truncate">
            Understand why offspring can exhibit phenotypes beyond parental expectations.
          </p>
        </div>

        {/* Circular Arrow Button */}
        <div className="w-6 h-6 rounded-full bg-cyan-950 border border-cyan-500 flex items-center justify-center text-cyan-300 shadow-[0_0_8px_rgba(56,189,248,0.4)] flex-shrink-0">
          <span className="text-[11px] leading-none">→</span>
        </div>
      </div>

      {/* Step 03: Meiosis Lab */}
      <div className="group relative flex items-center gap-3 p-2.5 rounded-xl bg-[#080e1f]/80 backdrop-blur-md border border-slate-800/80 hover:border-purple-500/40 hover:bg-[#0c152e]/80 transition-all duration-300 cursor-pointer">
        {/* Icon Thumbnail */}
        <div className="w-10 h-10 rounded-lg bg-[#050a16] border border-slate-800 flex items-center justify-center flex-shrink-0 group-hover:border-slate-700 transition-colors">
          <svg viewBox="0 0 28 28" className="w-5 h-5">
            <path d="M7 7 L21 21" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M21 7 L7 21" stroke="#ec4899" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="14" cy="14" r="2.5" fill="#fbbf24" />
          </svg>
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[10.5px] font-mono text-slate-400 font-medium">03</span>
            <h3 className="text-xs font-semibold text-slate-100 group-hover:text-purple-300 transition-colors">
              Meiosis Lab
            </h3>
          </div>
          <p className="text-[9.5px] text-slate-400 leading-tight mt-0.5 truncate">
            Visualize meiosis, crossover events, and gamete formation.
          </p>
        </div>

        {/* Circular Arrow Button */}
        <div className="w-6 h-6 rounded-full bg-slate-900 border border-slate-700/60 flex items-center justify-center text-slate-400 group-hover:text-purple-300 group-hover:border-purple-500/60 transition-all flex-shrink-0">
          <span className="text-[11px] leading-none">→</span>
        </div>
      </div>
    </div>
  );
};
