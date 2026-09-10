"use client";

import React from "react";
import { ArrowRight, ChevronDown } from "lucide-react";

export const JourneyCards: React.FC = () => {
  const cards = [
    {
      number: "01",
      title: "Parental Genomes",
      description: "Explore phased haplotypes, structural variation, and genetic context.",
      href: "/#parental",
      thumbnail: (
        <div className="relative w-16 h-14 rounded-lg bg-[#07112c]/80 border border-sky-500/20 overflow-hidden flex items-center justify-center group-hover:border-sky-400/50 transition-colors">
          {/* Chromosome Mini Art */}
          <svg viewBox="0 0 48 40" className="w-12 h-10">
            {/* Blue Chromosome (Parent A) */}
            <path
              d="M 12 4 Q 18 20 24 20 Q 18 20 12 36 M 24 4 Q 18 20 12 20 Q 18 20 24 36"
              stroke="#38bdf8"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
              filter="drop-shadow(0 0 4px rgba(56,189,248,0.8))"
            />
            {/* Pink Chromosome (Parent B) */}
            <path
              d="M 28 4 Q 34 20 40 20 Q 34 20 28 36 M 40 4 Q 34 20 28 20 Q 34 20 40 36"
              stroke="#ec4899"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
              filter="drop-shadow(0 0 4px rgba(236,72,153,0.8))"
            />
            <circle cx="18" cy="20" r="2" fill="#ffffff" />
            <circle cx="34" cy="20" r="2" fill="#ffffff" />
          </svg>
        </div>
      ),
    },
    {
      number: "02",
      title: "Recombination Flow",
      description: "Visualize meiotic processes, crossover events, and novel genomic configurations.",
      href: "/#meiosis",
      thumbnail: (
        <div className="relative w-16 h-14 rounded-lg bg-[#07112c]/80 border border-sky-500/20 overflow-hidden flex items-center justify-center group-hover:border-sky-400/50 transition-colors">
          {/* DNA Helix Mini Art */}
          <svg viewBox="0 0 48 40" className="w-12 h-10">
            <path
              d="M 6 30 Q 18 6 24 20 T 42 10"
              stroke="#38bdf8"
              strokeWidth="2"
              fill="none"
              filter="drop-shadow(0 0 3px #38bdf8)"
            />
            <path
              d="M 6 10 Q 18 34 24 20 T 42 30"
              stroke="#ec4899"
              strokeWidth="2"
              fill="none"
              filter="drop-shadow(0 0 3px #ec4899)"
            />
            {/* Rungs */}
            <line x1="12" y1="18" x2="12" y2="22" stroke="#fbbf24" strokeWidth="1.2" />
            <line x1="24" y1="19" x2="24" y2="21" stroke="#ffffff" strokeWidth="1.5" />
            <line x1="36" y1="17" x2="36" y2="23" stroke="#fbbf24" strokeWidth="1.2" />
          </svg>
        </div>
      ),
    },
    {
      number: "03",
      title: "Offspring Novelty",
      description: "Discover emergent phenotypes from epistatic interactions.",
      href: "/#phenotype",
      thumbnail: (
        <div className="relative w-16 h-14 rounded-lg bg-[#07112c]/80 border border-sky-500/20 overflow-hidden flex items-center justify-center group-hover:border-sky-400/50 transition-colors">
          {/* Offspring Sphere Mini Art */}
          <svg viewBox="0 0 48 40" className="w-12 h-10">
            <circle cx="24" cy="20" r="11" fill="none" stroke="#38bdf8" strokeWidth="1.5" />
            <ellipse cx="24" cy="20" rx="15" ry="5" fill="none" stroke="#fbbf24" strokeWidth="1" strokeDasharray="2 2" transform="rotate(-15 24 20)" />
            <circle cx="24" cy="20" r="6" fill="#0284c7" fillOpacity="0.5" />
            <circle cx="24" cy="20" r="2.5" fill="#fbbf24" filter="drop-shadow(0 0 4px #fbbf24)" />
          </svg>
        </div>
      ),
    },
  ];

  return (
    <div className="w-full max-w-[1440px] mx-auto px-6">
      {/* 3 Preview Cards Floating Container */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-2.5 rounded-2xl bg-[#050b1f]/85 backdrop-blur-2xl border border-sky-500/20 shadow-[0_15px_40px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.08)]">
        {cards.map((card) => (
          <a
            key={card.number}
            href={card.href}
            className="group flex items-center gap-3.5 p-3 rounded-xl hover:bg-sky-950/40 border border-transparent hover:border-sky-400/30 transition-all duration-300"
          >
            {/* Thumbnail */}
            {card.thumbnail}

            {/* Texts */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-sky-400 font-semibold tracking-wider">
                  {card.number}
                </span>
                <h4 className="text-[13px] font-semibold text-white group-hover:text-sky-300 transition-colors truncate">
                  {card.title}
                </h4>
              </div>
              <p className="text-[10px] text-slate-400 leading-snug mt-0.5 line-clamp-2">
                {card.description}
              </p>
            </div>

            {/* Circular Arrow Button */}
            <div className="w-7 h-7 rounded-full border border-sky-400/20 flex items-center justify-center text-slate-300 group-hover:border-sky-400 group-hover:bg-sky-400/20 group-hover:text-white transition-all flex-shrink-0">
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </a>
        ))}
      </div>

      {/* Sub-Card Status Line */}
      <div className="flex items-center justify-between text-[9px] font-mono text-slate-500 tracking-[0.2em] uppercase pt-4 pb-2 px-3 select-none">
        <div>SAME GENES. NEW WORLDS.</div>
        <div className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer">
          <ChevronDown className="w-3.5 h-3.5 animate-bounce" />
          <span>SCROLL TO EXPLORE A BIGGER BIOLOGICAL TOMORROW</span>
        </div>
        <div>SCIENCE / VISUALIZATION / POSSIBILITIES</div>
      </div>
    </div>
  );
};
