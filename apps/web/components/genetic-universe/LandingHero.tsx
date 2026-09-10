"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { ArrowRight, Play } from "lucide-react";
import { Navigation } from "./ui/Navigation";
import { ScientificTooltip } from "./ui/ScientificTooltip";
import { HaplotypePanel } from "./panels/HaplotypePanel";
import { CrossoverPanel } from "./panels/CrossoverPanel";
import { PhenotypeDeltaPanel } from "./panels/PhenotypeDeltaPanel";
import { MinimalRescuePanel } from "./panels/MinimalRescuePanel";
import { JourneyCards } from "./journey/JourneyCards";
import { InteractionProvider } from "./context/InteractionContext";

const GenomeScene = dynamic(
  () => import("./GenomeScene").then((mod) => mod.GenomeScene),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 bg-[#030712] flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-2 border-sky-400/20 border-t-sky-400 animate-spin" />
      </div>
    ),
  }
);

export const LandingHero: React.FC = () => {
  const router = useRouter();
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleStartFlow = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      router.push("/scientific-flow");
    }, 380);
  };
  return (
    <InteractionProvider>
      <div className="relative w-full h-screen min-h-[900px] max-h-[1200px] bg-[#030712] text-slate-100 overflow-hidden select-none">
        {/* Top Fixed Navigation */}
        <Navigation onLaunchDemo={() => (window.location.href = "/experiment")} />

        {/* Full-bleed 3D Biological Scene (React Three Fiber) */}
        <div className="absolute inset-0 z-0">
          <GenomeScene />
        </div>

        {/* Global Scientific Tooltip */}
        <ScientificTooltip />

        {/* Left Hero Typography and CTAs */}
        <div
          className={`absolute left-8 lg:left-14 top-[17%] max-w-[540px] xl:max-w-[600px] 2xl:max-w-[660px] z-20 pointer-events-auto space-y-5 transition-opacity duration-500 ${
            isTransitioning ? "opacity-0 pointer-events-none" : "opacity-100"
          }`}
        >
          {/* Eyebrow */}
          <div className="text-[10.5px] font-mono tracking-[0.25em] text-sky-400/90 uppercase font-medium">
            FROM VARIATION TO POSSIBILITIES
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl sm:text-[44px] md:text-[48px] xl:text-[54px] 2xl:text-[58px] font-serif tracking-tight leading-[1.08] text-white">
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-sky-200 drop-shadow-[0_2px_12px_rgba(56,189,248,0.25)]">
              Genetic Universe
            </span>
            <span className="block whitespace-nowrap text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-yellow-100 to-amber-200 drop-shadow-[0_2px_14px_rgba(251,191,36,0.3)] mt-1">
              → Offspring Universe
            </span>
          </h1>

          {/* Supporting Copy */}
          <p className="text-xs sm:text-[13px] text-slate-300/85 leading-relaxed font-sans pr-4">
            Tracing offspring phenotypic novelty to recombination-generated genomic
            configurations and epistatic interactions.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Link
              href="/experiment"
              className="px-6 py-2.5 rounded-full text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 shadow-[0_0_25px_rgba(14,165,233,0.45)] hover:shadow-[0_0_35px_rgba(14,165,233,0.7)] transition-all flex items-center gap-2 group"
            >
              <span>Start Exploration</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            <button
              type="button"
              onClick={handleStartFlow}
              className="px-5 py-2.5 rounded-full text-xs font-semibold text-slate-200 hover:text-white bg-white/5 border border-white/20 hover:bg-white/10 hover:border-white/30 backdrop-blur-md transition-all flex items-center gap-2 group"
            >
              <Play className="w-3 h-3 fill-current text-sky-400 group-hover:scale-110 transition-transform" />
              <span>View Scientific Flow</span>
            </button>
          </div>

          {/* Under-CTA Badges */}
          <div className="text-[9px] font-mono tracking-[0.25em] text-slate-500 uppercase pt-1">
            BIOLOGY &nbsp;/&nbsp; AI VISUALIZATION &nbsp;/&nbsp; A BRIGHTER TOMORROW
          </div>

          {/* Lower-left Scientific Quote */}
          <div className="pt-4 border-t border-sky-500/10 max-w-sm">
            <blockquote className="text-xs sm:text-[13px] font-serif italic text-slate-300">
              “New phenotypes emerge when genomes converse.”
            </blockquote>
            <div className="text-[8.5px] font-mono tracking-[0.2em] text-slate-400 uppercase mt-1">
              — A LARGER BIOLOGICAL TOMORROW
            </div>
          </div>
        </div>

        {/* 4 Floating Scientific Panels (Positioned cleanly in empty cosmic space) */}
        <div
          className={`hidden lg:block transition-opacity duration-500 ${
            isTransitioning ? "opacity-0 pointer-events-none" : "opacity-100"
          }`}
        >
          {/* Card 1: Phase-Resolved Haplotypes (Empty space under Parent A, clear of quote & Offspring) */}
          <div className="absolute left-[24.5%] top-[56%] z-20 pointer-events-auto transition-transform hover:-translate-y-1">
            <HaplotypePanel />
          </div>

          {/* Card 2: Crossover Provenance (Empty space to the right of Parent B) */}
          <div className="absolute right-[4%] top-[18%] z-20 pointer-events-auto transition-transform hover:-translate-y-1">
            <CrossoverPanel />
          </div>

          {/* Card 4: Minimal Rescue Set (Empty space to the right of Offspring) */}
          <div className="absolute right-[4%] top-[39%] z-20 pointer-events-auto transition-transform hover:-translate-y-1">
            <MinimalRescuePanel />
          </div>

          {/* Card 3: Phenotype Delta (Empty space to the lower-right of Offspring, completely above Journey Cards) */}
          <div className="absolute right-[4%] top-[60%] z-20 pointer-events-auto transition-transform hover:-translate-y-1">
            <PhenotypeDeltaPanel />
          </div>
        </div>

        {/* Bottom Journey Cards & Planetary Horizon Section */}
        <div
          id="journey-section"
          className={`absolute bottom-2 left-0 right-0 z-20 pointer-events-auto transition-opacity duration-500 ${
            isTransitioning ? "opacity-0 pointer-events-none" : "opacity-100"
          }`}
        >
          <JourneyCards />
        </div>
      </div>
    </InteractionProvider>
  );
};
