"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { fetchBenchmark } from "@/lib/api";
import { BenchmarkResult } from "@/lib/types";

export default function BenchmarkResults() {
  const [benchmark, setBenchmark] = useState<BenchmarkResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchBenchmark(50, 42)
      .then((data) => {
        setBenchmark(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white uppercase tracking-wider">
            Quantitative Research Benchmark & Faithfulness Evaluation
          </h2>
          <p className="text-xs text-slate-400">
            Ground-truth validation across precision, recall, counterfactual faithfulness, and runtime.
          </p>
        </div>
        <Link href="/" className="px-3 py-1.5 rounded bg-slate-800 text-xs text-slate-200 hover:bg-slate-700">
          ← Back to Main Dashboard
        </Link>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-400 text-sm animate-pulse">
          Computing synthetic benchmark evaluation metrics...
        </div>
      ) : benchmark ? (
        <div className="space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-xs text-slate-400">Top-k Recovery</span>
              <div className="text-xl font-bold text-emerald-400 mt-1">
                {benchmark.metrics.top_k_recovery ? "100%" : "0%"}
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Primary planted causal pair recovered</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-xs text-slate-400">Faithfulness Ratio</span>
              <div className="text-xl font-bold text-sky-400 mt-1">
                {benchmark.metrics.faithfulness_ratio}x
              </div>
              <p className="text-[10px] text-slate-500 mt-1">|Δ causal| / |Δ null|</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-xs text-slate-400">Recombination Provenance</span>
              <div className="text-xl font-bold text-amber-400 mt-1">
                {benchmark.metrics.recombination_interval_recovered ? "Verified" : "Missed"}
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Crossover interval recovered</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-xs text-slate-400">Execution Speed</span>
              <div className="text-xl font-bold text-white mt-1">
                {benchmark.performance.duration_ms} ms
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Peak: {benchmark.performance.peak_memory_kb} KB</p>
            </div>
          </div>

          {/* Details Table */}
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Quantitative Attribution Comparison
            </h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded bg-slate-950 border border-slate-800">
                <span className="text-slate-400">Mean Causal Intervention Effect:</span>
                <div className="text-base font-bold text-pink-400 mt-1">
                  |Δ causal| = {benchmark.metrics.mean_delta_causal} units
                </div>
              </div>
              <div className="p-3 rounded bg-slate-950 border border-slate-800">
                <span className="text-slate-400">Mean Null Background Effect:</span>
                <div className="text-base font-bold text-slate-400 mt-1">
                  |Δ null| = {benchmark.metrics.mean_delta_null} units
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-red-400 text-xs">Failed to load benchmark results.</div>
      )}
    </div>
  );
}
