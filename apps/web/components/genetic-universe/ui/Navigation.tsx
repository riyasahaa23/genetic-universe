"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface NavigationProps {
  onLaunchDemo?: () => void;
  activeTab?: string;
}

export const Navigation: React.FC<NavigationProps> = ({
  onLaunchDemo,
  activeTab = "Home",
}) => {
  const [currentTab, setCurrentTab] = useState(activeTab);

  const navItems = [
    { name: "Home", href: "/" },
    { name: "Inheritance Paradox", href: "/inheritance-paradox" },
    { name: "Meiosis Lab", href: "/meiosis-lab" },
    { name: "Phenotype Engine", href: "/phenotype-engine" },
    { name: "Novelty Trace", href: "/novelty-trace" },
    { name: "Counterfactual Rescue", href: "/counterfactual-rescue" },
    { name: "Validation", href: "/validation" },
  ];

  const isMeiosis = currentTab === "Meiosis Lab" || activeTab === "Meiosis Lab";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-6 lg:px-12 py-3.5 backdrop-blur-md bg-[#030712]/60 border-b border-sky-500/10 transition-all">
      <div className="max-w-[1720px] mx-auto flex items-center justify-between">
        {/* Brand / Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-8 h-8 flex items-center justify-center">
            {/* Orbital Rings SVG */}
            <svg
              viewBox="0 0 36 36"
              className="w-8 h-8 text-sky-400 group-hover:rotate-12 transition-transform duration-500"
              fill="none"
            >
              <ellipse
                cx="18"
                cy="18"
                rx="14"
                ry="6"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeOpacity="0.8"
                transform="rotate(-25 18 18)"
              />
              <ellipse
                cx="18"
                cy="18"
                rx="14"
                ry="6"
                stroke="#ec4899"
                strokeWidth="1.2"
                strokeOpacity="0.8"
                transform="rotate(35 18 18)"
              />
              <circle cx="18" cy="18" r="2.2" fill="#38bdf8" />
              <circle cx="18" cy="18" r="4" stroke="#fbbf24" strokeWidth="0.8" strokeDasharray="1 2" />
            </svg>
            <div className="absolute inset-0 bg-sky-500/20 blur-md rounded-full -z-10" />
          </div>

          <div className="flex flex-col">
            <span className="text-[13px] font-semibold tracking-wide text-slate-100 group-hover:text-white flex items-center gap-1.5 transition-colors uppercase">
              Genetic Universe <span className="text-sky-400 text-xs">→</span> Offspring Universe
            </span>
            <span className="text-[8.5px] font-mono tracking-[0.25em] text-slate-400/80 uppercase">
              GENOMES CONNECT WORLDS
            </span>
          </div>
        </Link>

        {/* Center Nav Links */}
        <nav className="hidden xl:flex items-center space-x-1 lg:space-x-6 text-[13px] text-slate-300">
          {navItems.map((item) => {
            const isActive = currentTab === item.name;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setCurrentTab(item.name)}
                className={`relative py-1.5 px-2 font-normal transition-all hover:text-white ${
                  isActive ? "text-white font-medium" : "text-slate-300/80"
                }`}
              >
                {item.name}
                {isActive && (
                  <span className="absolute bottom-0 left-2 right-2 h-[2px] bg-gradient-to-r from-sky-400 to-cyan-300 rounded-full shadow-[0_0_8px_rgba(56,189,248,0.8)]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Far Right: Search + Launch Demo Button + Avatar */}
        <div className="flex items-center gap-3">
          {isMeiosis && (
            <div className="hidden 2xl:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/70 border border-slate-800 text-slate-400 text-xs w-52">
              <svg viewBox="0 0 20 20" className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor">
                <circle cx="8.5" cy="8.5" r="5.5" strokeWidth="1.5" />
                <path d="M12.5 12.5L16.5 16.5" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <input
                type="text"
                placeholder="Search genes, traits..."
                className="bg-transparent text-slate-200 placeholder-slate-500 text-xs focus:outline-none w-full"
                readOnly
              />
            </div>
          )}

          <button
            type="button"
            onClick={onLaunchDemo || (() => { window.location.href = "/experiment"; })}
            className="relative group overflow-hidden px-5 py-2 rounded-full text-xs font-semibold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-sky-500 shadow-[0_0_25px_rgba(56,189,248,0.4)] hover:shadow-[0_0_35px_rgba(56,189,248,0.7)] transition-all flex items-center gap-2"
          >
            <span className="relative z-10 flex items-center gap-1.5">
              Launch Demo
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </span>
            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>

          {isMeiosis && (
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500/40 to-cyan-500/40 border border-cyan-500/30 flex items-center justify-center shadow-[0_0_12px_rgba(168,85,247,0.3)]">
              <div className="w-5 h-5 rounded-full bg-slate-900 flex items-center justify-center text-[10px] text-cyan-300 font-mono">
                ✦
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
