"use client";

import React from "react";
import { LocusProvenance } from "@/lib/types";

interface ProvenanceTrackProps {
  provenanceList: LocusProvenance[];
  highlightLoci?: string[]; // e.g. ["L10", "L31"]
}

export const ProvenanceTrack: React.FC<ProvenanceTrackProps> = ({
  provenanceList = [],
  highlightLoci = ["L10", "L31"],
}) => {
  const filtered = provenanceList.filter((p) => highlightLoci.includes(p.locus_id));

  return (
    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
          Strict Locus Provenance Audit Chain
        </h3>
        <span className="text-[11px] text-amber-400 font-mono">Core Design Principle: Zero Provenance Loss</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.map((prov) => (
          <div
            key={prov.locus_id}
            className="p-3 rounded-lg bg-slate-950 border border-amber-500/30 space-y-2 text-xs"
          >
            <div className="flex justify-between items-center font-bold text-slate-200">
              <span className="text-amber-400 font-mono text-sm">{prov.locus_id}</span>
              <span className="text-slate-400 font-normal">Genomic Position: {prov.position}</span>
            </div>

            <div className="space-y-1 text-[11px] text-slate-300 font-mono bg-slate-900/60 p-2 rounded border border-slate-800">
              <div className="flex justify-between">
                <span className="text-slate-500">Transmitted Allele:</span>
                <span className="text-white font-bold">{prov.allele_a}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Source Parent:</span>
                <span className="text-blue-400">Parent {prov.source_parent_a}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Source Homolog:</span>
                <span className="text-sky-300 font-bold">{prov.source_homolog_a}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Crossover Interval:</span>
                <span className="text-amber-400">{prov.crossover_interval_a}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
