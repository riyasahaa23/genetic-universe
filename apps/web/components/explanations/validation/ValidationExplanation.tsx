"use client";

import React, { useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { CelestialBackground } from "../../genetic-universe/CelestialBackground";

export const ValidationExplanation: React.FC<{ currentSceneIndex: number; reducedMotion: boolean }> = ({
  currentSceneIndex,
  reducedMotion,
}) => {
  return (
    <Canvas
      camera={{ position: [0, 0.5, 9.5], fov: 42 }}
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={0.7} color="#0c1836" />
      <directionalLight position={[-5, 7, 5]} intensity={1.8} color="#00e5ff" />
      <directionalLight position={[5, 7, 5]} intensity={1.6} color="#ec4899" />
      <directionalLight position={[0, -3, 4]} intensity={1.4} color="#fbbf24" />
      <CelestialBackground />

      {/* Scene 0: Blind Inference (3 Compartments) */}
      {currentSceneIndex === 0 && (
        <group position={[0, -0.2, 0]}>
          {[
            { name: "SIMULATOR", role: "Plants ground truth", col: "border-cyan-400 text-cyan-300", x: -2.4 },
            { name: "ATTRIBUTION ENGINE", role: "Locked & blind during inference", col: "border-amber-400 text-amber-300", x: 0 },
            { name: "EVALUATOR", role: "Scores recovery after inference", col: "border-emerald-400 text-emerald-300", x: 2.4 },
          ].map((c) => (
            <group key={c.name} position={[c.x, 0, 0]}>
              <mesh>
                <boxGeometry args={[2.0, 1.4, 0.1]} />
                <meshStandardMaterial color="#0f172a" transparent opacity={0.8} />
              </mesh>
              <Html position={[0, 0, 0.1]} center distanceFactor={10} className="pointer-events-none select-none">
                <div className={`w-44 p-2.5 rounded-xl bg-slate-900/90 border-2 ${c.col} text-center shadow-lg`}>
                  <div className="text-[10px] font-mono font-bold uppercase">{c.name}</div>
                  <div className="text-[8px] font-mono text-slate-400 mt-1">{c.role}</div>
                </div>
              </Html>
            </group>
          ))}
        </group>
      )}

      {/* Scene 1: Many Independent Worlds */}
      {currentSceneIndex === 1 && (
        <group position={[0, -0.2, 0]}>
          {[-2.5, -1.5, -0.5, 0.5, 1.5, 2.5].map((x, idx) => {
            const col = idx % 3 === 0 ? "#38bdf8" : idx % 3 === 1 ? "#ec4899" : "#f6c85f";
            const regime = idx % 3 === 0 ? "Easy (Cyan)" : idx % 3 === 1 ? "Medium (Magenta)" : "Hard (Gold)";
            return (
              <group key={`world-${idx}`} position={[x, Math.sin(idx) * 0.4, 0]}>
                <mesh>
                  <sphereGeometry args={[0.35, 16, 16]} />
                  <meshStandardMaterial color={col} emissive={col} emissiveIntensity={0.5} />
                </mesh>
                <Html position={[0, -0.6, 0]} center distanceFactor={10} className="pointer-events-none select-none">
                  <span className="text-[7.5px] font-mono px-1 rounded bg-black/70 text-slate-300">Seed {1000 + idx * 42}</span>
                </Html>
              </group>
            );
          })}
          <Html position={[0, 1.2, 0]} center distanceFactor={10} className="pointer-events-none select-none">
            <div className="px-3 py-1 rounded-xl bg-slate-900/90 border border-sky-400 text-sky-200 font-mono text-[9.5px] font-bold shadow-lg whitespace-nowrap">
              Independent Seeded Worlds (Easy · Medium · Hard Regimes)
            </div>
          </Html>
        </group>
      )}

      {/* Scene 2: Recovery (Top-Ranked Candidates vs Planted Truth) */}
      {currentSceneIndex === 2 && (
        <group position={[0, -0.2, 0]}>
          <Html position={[0, 0, 0]} center distanceFactor={10} className="pointer-events-none select-none">
            <div className="w-96 p-3.5 rounded-2xl bg-slate-900/95 border border-cyan-400 shadow-2xl">
              <div className="text-[10px] font-mono uppercase text-cyan-300 font-bold mb-2 text-center">
                Blind Candidate Attribution Recovery
              </div>
              <div className="grid grid-cols-2 gap-2 text-[9px] font-mono">
                <div className="p-2 rounded-xl bg-black/40 border border-slate-800">
                  <div className="text-slate-400 text-[8px]">Top-3 Recovery</div>
                  <div className="text-xl font-bold text-cyan-400">100.0%</div>
                  <div className="text-[7.5px] text-slate-500">True locus in top 3</div>
                </div>
                <div className="p-2 rounded-xl bg-black/40 border border-slate-800">
                  <div className="text-slate-400 text-[8px]">Mean Reciprocal Rank</div>
                  <div className="text-xl font-bold text-amber-300">0.82</div>
                  <div className="text-[7.5px] text-slate-500">Rapid attribution rise</div>
                </div>
                <div className="p-2 rounded-xl bg-black/40 border border-slate-800">
                  <div className="text-slate-400 text-[8px]">Candidate Recall</div>
                  <div className="text-xl font-bold text-emerald-400">98.0%</div>
                  <div className="text-[7.5px] text-slate-500">Coverage across worlds</div>
                </div>
                <div className="p-2 rounded-xl bg-black/40 border border-slate-800">
                  <div className="text-slate-400 text-[8px]">Candidate Precision</div>
                  <div className="text-xl font-bold text-purple-300">67.0%</div>
                  <div className="text-[7.5px] text-slate-500">High causal specificity</div>
                </div>
              </div>
            </div>
          </Html>
        </group>
      )}

      {/* Scene 3: Exact vs Functional Recovery */}
      {currentSceneIndex === 3 && (
        <group position={[0, -0.2, 0]}>
          <group position={[-1.8, 0, 0]}>
            <Html position={[0, 0, 0]} center distanceFactor={10} className="pointer-events-none select-none">
              <div className="w-52 p-3 rounded-2xl bg-slate-900/90 border border-cyan-400 text-center shadow-lg">
                <div className="text-[9.5px] font-mono text-cyan-400 uppercase font-bold">Exact Mechanism</div>
                <div className="text-3xl font-mono font-bold text-white mt-1">91.2%</div>
                <div className="text-[8px] font-mono text-slate-400 mt-1">True planted loci matched</div>
              </div>
            </Html>
          </group>

          <group position={[1.8, 0, 0]}>
            <Html position={[0, 0, 0]} center distanceFactor={10} className="pointer-events-none select-none">
              <div className="w-52 p-3 rounded-2xl bg-slate-900/90 border-2 border-emerald-400 text-center shadow-[0_0_20px_rgba(16,185,129,0.4)]">
                <div className="text-[9.5px] font-mono text-emerald-400 uppercase font-bold">Rescue Equivalence</div>
                <div className="text-3xl font-mono font-bold text-emerald-200 mt-1">97.4%</div>
                <div className="text-[8px] font-mono text-slate-400 mt-1">Sufficient functional rescue</div>
              </div>
            </Html>
          </group>
        </group>
      )}

      {/* Scene 4: Causal vs Null Separation */}
      {currentSceneIndex === 4 && (
        <group position={[0, -0.2, 0]}>
          <group position={[-1.8, 0, 0]}>
            <Html position={[0, 0, 0]} center distanceFactor={10} className="pointer-events-none select-none">
              <div className="w-52 p-3 rounded-2xl bg-amber-950/90 border border-amber-400 text-center shadow-lg">
                <div className="text-[9.5px] font-mono text-amber-300 uppercase font-bold">Causal Phenotype Δ</div>
                <div className="text-2xl font-mono font-bold text-amber-200 mt-1">+4.82</div>
                <div className="text-[8px] font-mono text-amber-200/80 mt-1">High explanatory leverage</div>
              </div>
            </Html>
          </group>

          <group position={[1.8, 0, 0]}>
            <Html position={[0, 0, 0]} center distanceFactor={10} className="pointer-events-none select-none">
              <div className="w-52 p-3 rounded-2xl bg-slate-900/90 border border-slate-700 text-center shadow-md">
                <div className="text-[9.5px] font-mono text-slate-400 uppercase font-bold">Null Phenotype Δ</div>
                <div className="text-2xl font-mono font-bold text-slate-400 mt-1">+0.31</div>
                <div className="text-[8px] font-mono text-slate-500 mt-1">Background permutation noise</div>
              </div>
            </Html>
          </group>

          <Html position={[0, 1.2, 0]} center distanceFactor={10} className="pointer-events-none select-none">
            <div className="px-3 py-1 rounded-xl bg-slate-900/90 border border-amber-500 text-amber-300 font-mono text-[9.5px] font-bold shadow-md whitespace-nowrap">
              Faithfulness Ratio: 15.5× Causal-to-Null Separation
            </div>
          </Html>
        </group>
      )}

      {/* Scene 5: Negative Controls */}
      {currentSceneIndex === 5 && (
        <group position={[0, -0.2, 0]}>
          <Html position={[0, 0, 0]} center distanceFactor={10} className="pointer-events-none select-none">
            <div className="w-96 p-3 rounded-2xl bg-slate-900/95 border border-sky-400 shadow-2xl">
              <div className="text-[10px] font-mono uppercase text-sky-300 font-bold mb-2 text-center">
                Negative Control Benchmarks
              </div>
              <div className="space-y-1.5 text-[9px] font-mono">
                <div className="flex justify-between p-1.5 rounded bg-black/40 border border-slate-800">
                  <span className="text-slate-300">Pure Additive World</span>
                  <span className="text-emerald-400 font-bold">0.0% False Epistasis</span>
                </div>
                <div className="flex justify-between p-1.5 rounded bg-black/40 border border-slate-800">
                  <span className="text-slate-300">Non-Transgressive World</span>
                  <span className="text-emerald-400 font-bold">0 False Rescues</span>
                </div>
                <div className="flex justify-between p-1.5 rounded bg-black/40 border border-slate-800">
                  <span className="text-slate-300">Unrelated Crossover Segment</span>
                  <span className="text-emerald-400 font-bold">0 Provenance Credit</span>
                </div>
              </div>
            </div>
          </Html>
        </group>
      )}

      {/* Scene 6: Confidence & Limitations */}
      {currentSceneIndex === 6 && (
        <group position={[0, -0.2, 0]}>
          <Html position={[0, 0, 0]} center distanceFactor={10} className="pointer-events-none select-none">
            <div className="w-96 p-4 rounded-2xl bg-slate-900/95 border border-sky-400 shadow-2xl space-y-2.5">
              <div className="text-center">
                <div className="text-[10.5px] font-mono font-bold text-emerald-300 uppercase">
                  Bootstrap 95% Confidence Interval: [0.88 – 0.94]
                </div>
                <div className="text-[8.5px] font-mono text-slate-400 mt-0.5">
                  Evaluated across 1,000 bootstrap resamples
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-[8.5px] font-mono text-amber-200 leading-relaxed text-center">
                ⚠️ SCIENTIFIC SCOPE: Synthetic benchmark calibration. Results do not constitute clinical predictions or replace wet-lab validation.
              </div>
            </div>
          </Html>
        </group>
      )}
    </Canvas>
  );
};
