"use client";

import React from "react";
import { useMeiosisInteraction } from "./interactions/MeiosisInteractionContext";

export const MeiosisStageTimeline: React.FC = () => {
  const { activeStage, setActiveStage, setHoveredElement } = useMeiosisInteraction();

  const stages = [
    {
      id: 1,
      num: "1",
      title: "Homolog",
      subtitle: "Pairing",
      sub2: "(Synapsis)",
    },
    {
      id: 2,
      num: "2",
      title: "Crossover",
      subtitle: "(Chiasma)",
      sub2: "",
    },
    {
      id: 3,
      num: "3",
      title: "Recombinant",
      subtitle: "Chromatids",
      sub2: "",
    },
    {
      id: 4,
      num: "4",
      title: "Segregation",
      subtitle: "(Meiosis I & II)",
      sub2: "",
    },
    {
      id: 5,
      num: "5",
      title: "Haploid",
      subtitle: "Gametes",
      sub2: "",
    },
  ];

  return (
    <div className="absolute left-3 top-10 bottom-12 w-36 pointer-events-none flex flex-col justify-between z-10 select-none">
      {/* Vertical connecting line */}
      <div className="absolute left-3 top-3 bottom-3 w-[1px] bg-gradient-to-b from-cyan-500/70 via-cyan-400/50 to-cyan-500/70 shadow-[0_0_8px_rgba(56,189,248,0.5)]" />

      {stages.map((st) => {
        const isActive = activeStage === st.id;
        return (
          <div
            key={st.id}
            onClick={() => setActiveStage(st.id)}
            onMouseEnter={() => setHoveredElement(`stage_${st.id}`)}
            onMouseLeave={() => setHoveredElement(null)}
            className="flex items-start gap-2.5 pointer-events-auto cursor-pointer group"
          >
            {/* Numbered Node */}
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-mono font-bold transition-all z-10 ${
                isActive
                  ? "bg-cyan-400 text-slate-950 ring-4 ring-cyan-500/30 shadow-[0_0_14px_rgba(56,189,248,0.9)]"
                  : "bg-[#0b142c] text-cyan-300 border border-cyan-500/50 group-hover:border-cyan-400 group-hover:bg-cyan-950/40"
              }`}
            >
              {st.num}
            </div>

            {/* Stage Label */}
            <div className="flex flex-col text-left leading-tight pt-0.5">
              <span
                className={`text-[11.5px] font-medium tracking-tight transition-colors ${
                  isActive ? "text-cyan-200 font-semibold" : "text-slate-300 group-hover:text-cyan-300"
                }`}
              >
                {st.title}
              </span>
              <span
                className={`text-[10.5px] transition-colors ${
                  isActive ? "text-cyan-300" : "text-slate-400 group-hover:text-slate-300"
                }`}
              >
                {st.subtitle}
              </span>
              {st.sub2 && (
                <span className="text-[9.5px] text-slate-500 group-hover:text-slate-400">
                  {st.sub2}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
