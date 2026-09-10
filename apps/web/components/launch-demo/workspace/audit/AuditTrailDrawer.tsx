"use client";

import React, { useState } from "react";
import { useLaunchDemo } from "../../LaunchDemoContext";

export const AuditTrailDrawer: React.FC = () => {
  const { auditLogs, isAuditDrawerOpen, setIsAuditDrawerOpen, experimentId, seed, locusCount } =
    useLaunchDemo();
  const [copied, setCopied] = useState(false);

  if (!isAuditDrawerOpen) return null;

  const handleCopyLogs = () => {
    const text = JSON.stringify(
      {
        experimentId,
        seed,
        locusCount,
        exportedAt: new Date().toISOString(),
        events: auditLogs,
      },
      null,
      2
    );
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed bottom-14 left-0 right-0 max-h-[280px] bg-[#030816]/98 border-t border-cyan-500/40 shadow-[0_-10px_40px_rgba(0,0,0,0.8)] backdrop-blur-xl z-40 flex flex-col transition-all duration-300 select-none">
      {/* Drawer Header */}
      <div className="px-6 py-2.5 bg-[#050e24] border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#38bdf8]" />
          <h4 className="text-xs font-bold font-mono tracking-wider text-white uppercase">
            Scientific Audit Trail & Reproducibility Ledger
          </h4>
          <span className="text-[10px] font-mono text-slate-400">
            ({auditLogs.length} events recorded)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyLogs}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-mono text-cyan-300 border border-slate-700 transition-colors"
          >
            {copied ? "✓ Copied JSON" : "Copy Log JSON"}
          </button>
          <button
            onClick={() => setIsAuditDrawerOpen(false)}
            className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-xs"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Log Feed */}
      <div className="p-4 overflow-y-auto space-y-2 flex-1 font-mono text-[11px]">
        {auditLogs.length === 0 ? (
          <div className="text-slate-500 italic py-4 text-center">
            No audit events recorded yet. Initialize an experiment to begin tracking.
          </div>
        ) : (
          auditLogs.map((log) => {
            let badgeBg = "bg-blue-950/60 text-cyan-300 border-cyan-500/30";
            if (log.severity === "success") badgeBg = "bg-emerald-950/60 text-emerald-300 border-emerald-500/30";
            if (log.severity === "warn") badgeBg = "bg-amber-950/60 text-amber-300 border-amber-500/30";
            if (log.severity === "error") badgeBg = "bg-red-950/60 text-red-300 border-red-500/30";

            return (
              <div
                key={log.id}
                className="flex items-start gap-3 p-1.5 rounded bg-slate-900/50 border border-slate-800/60 hover:border-slate-700 transition-colors"
              >
                <span className="text-[9.5px] text-slate-500 whitespace-nowrap">
                  {log.timestamp.split("T")[1]?.slice(0, 8)}
                </span>
                <span
                  className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase border ${badgeBg}`}
                >
                  {log.stageName}
                </span>
                <span className="text-slate-200 flex-1">{log.event}</span>
                {log.details && (
                  <span className="text-[9.5px] text-slate-400 truncate max-w-[280px]">
                    {JSON.stringify(log.details)}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
