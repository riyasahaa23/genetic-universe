"use client";

import React, { useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { Chromosome } from "../../genetic-universe/Chromosome";
import { CelestialBackground } from "../../genetic-universe/CelestialBackground";

export const NoveltyTraceExplanation: React.FC<{ currentSceneIndex: number; reducedMotion: boolean }> = ({
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

      {/* Scene 0: Start from Phenotype */}
      {currentSceneIndex === 0 && (
        <group position={[0, -0.2, 0]}>
          <group position={[0, 0.2, 0]}>
            <mesh><sphereGeometry args={[1.0, 32, 32]} /><meshStandardMaterial color="#fbbf24" emissive="#d97706" emissiveIntensity={0.8} /></mesh>
            <mesh><ringGeometry args={[1.2, 1.3, 32]} /><meshBasicMaterial color="#fbbf24" side={THREE.DoubleSide} transparent opacity={0.8} /></mesh>
            <Html position={[0, -1.5, 0]} center distanceFactor={10} className="pointer-events-none select-none">
              <div className="px-3 py-1 rounded-xl bg-amber-950/90 border border-amber-400 text-amber-300 font-mono text-[10px] font-bold shadow-lg whitespace-nowrap">
                Observed Novelty: y = 18.7 (Outside [12.4 – 14.1])
              </div>
            </Html>
          </group>
        </group>
      )}

      {/* Scene 1: Candidate Generation */}
      {currentSceneIndex === 1 && (
        <group position={[0, -0.2, 0]}>
          <group position={[-2.2, 0, 0]}>
            <mesh><sphereGeometry args={[0.5, 20, 20]} /><meshBasicMaterial color="#fbbf24" /></mesh>
            <Html position={[0, -0.8, 0]} center distanceFactor={10} className="pointer-events-none select-none">
              <span className="text-[8.5px] font-mono text-amber-300">Phenotype Core</span>
            </Html>
          </group>

          {/* Reverse rays radiating to candidates */}
          {[-0.6, 0, 0.6].map((y, idx) => (
            <mesh key={`ray-${idx}`} position={[-0.2, y * 1.5, 0]} rotation={[0, 0, -y * 0.4]}>
              <planeGeometry args={[2.5, 0.03]} />
              <meshBasicMaterial color="#38bdf8" transparent opacity={0.65} />
            </mesh>
          ))}

          <group position={[2.0, 0, 0]}>
            {["Single Variants", "Crossover Segments", "Epistatic Pairs"].map((label, idx) => (
              <Html key={label} position={[0, (1 - idx) * 0.8, 0]} center distanceFactor={10} className="pointer-events-none select-none">
                <div className="px-3 py-1 rounded-lg bg-slate-900/90 border border-slate-700 text-slate-200 font-mono text-[9px] whitespace-nowrap shadow-md">
                  Candidate Class: {label}
                </div>
              </Html>
            ))}
          </group>
        </group>
      )}

      {/* Scene 2: Counterfactual Evidence */}
      {currentSceneIndex === 2 && (
        <group position={[0, -0.2, 0]}>
          <group position={[-2.4, 0, 0]} scale={0.85}>
            <Chromosome type="offspring" highlightLocus={10} />
          </group>
          <group position={[1.4, 0, 0]}>
            {[
              { name: "Candidate 1 (L10 × L31)", delta: "+4.82", rank: "Rank #1", active: true },
              { name: "Candidate 2 (L4 × L18)", delta: "+1.15", rank: "Rank #2", active: false },
              { name: "Candidate 3 (Locus 22)", delta: "+0.45", rank: "Rank #3", active: false },
            ].map((c, idx) => (
              <Html key={c.name} position={[0, (1 - idx) * 0.9, 0]} center distanceFactor={10} className="pointer-events-none select-none">
                <div className={`w-56 p-2 rounded-xl border ${c.active ? "bg-amber-950/90 border-amber-400 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.5)]" : "bg-slate-900/80 border-slate-700 text-slate-300"}`}>
                  <div className="flex justify-between items-center text-[9px] font-mono font-bold">
                    <span>{c.name}</span>
                    <span className="px-1 rounded bg-black/40 text-amber-300">Δ = {c.delta}</span>
                  </div>
                </div>
              </Html>
            ))}
          </group>
        </group>
      )}

      {/* Scene 3: Provenance Trace */}
      {currentSceneIndex === 3 && (
        <group position={[0, -0.2, 0]}>
          <Html position={[0, 0, 0]} center distanceFactor={10} className="pointer-events-none select-none">
            <div className="flex items-center gap-2 p-3 rounded-2xl bg-slate-900/90 border border-sky-400/40 shadow-2xl backdrop-blur-xl">
              {[
                { title: "Parent A/B", col: "text-cyan-400" },
                { title: "Homolog", col: "text-sky-400" },
                { title: "Crossover Interval", col: "text-amber-400" },
                { title: "Segment", col: "text-pink-400" },
                { title: "Candidate", col: "text-yellow-300 font-bold" },
              ].map((step, idx) => (
                <React.Fragment key={step.title}>
                  <div className="px-2.5 py-1 rounded bg-black/50 border border-slate-800 text-center">
                    <div className={`text-[9px] font-mono ${step.col}`}>{step.title}</div>
                  </div>
                  {idx < 4 && <span className="text-slate-500 font-mono text-xs">→</span>}
                </React.Fragment>
              ))}
            </div>
          </Html>
        </group>
      )}

      {/* Scene 4: Ranked Explanation */}
      {currentSceneIndex === 4 && (
        <group position={[0, -0.2, 0]}>
          <group position={[-1.8, 0, 0]} scale={0.9}>
            <Chromosome type="offspring" highlightLocus={10} />
          </group>
          <group position={[1.4, 0, 0]}>
            <Html position={[0, 0, 0]} center distanceFactor={10} className="pointer-events-none select-none">
              <div className="w-64 p-3.5 rounded-2xl bg-amber-950/90 border-2 border-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.6)]">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-mono font-bold text-amber-300 uppercase">★ Top-Ranked Driver</span>
                  <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[9px] font-bold">81.4% Shapley</span>
                </div>
                <div className="text-sm font-mono font-bold text-white mt-1">
                  Loci 10 × 31 Epistatic Coupling
                </div>
                <div className="text-[8.5px] font-mono text-amber-200 mt-1 border-t border-amber-500/30 pt-1">
                  Provenance: Chr1 @ 42.8 cM Crossover · Δz = +4.82
                </div>
              </div>
            </Html>
          </group>
        </group>
      )}
    </Canvas>
  );
};
