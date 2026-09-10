"use client";

import React, { useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { Chromosome } from "../../genetic-universe/Chromosome";
import { CelestialBackground } from "../../genetic-universe/CelestialBackground";

export const CounterfactualExplanation: React.FC<{ currentSceneIndex: number; reducedMotion: boolean }> = ({
  currentSceneIndex,
  reducedMotion,
}) => {
  return (
    <Canvas
      camera={{ position: [0, 0.5, 9.5], fov: 42 }}
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={0.85} color="#ffffff" />
      <directionalLight position={[-5, 7, 5]} intensity={2.0} color="#00e5ff" />
      <directionalLight position={[5, 7, 5]} intensity={1.8} color="#ec4899" />
      <directionalLight position={[0, -3, 4]} intensity={1.5} color="#fbbf24" />
      <CelestialBackground />

      {/* Prominent subtle label: IN-SILICO ONLY */}
      <Html position={[0, 2.3, 0]} center distanceFactor={10} className="pointer-events-none select-none">
        <div className="px-3.5 py-1 rounded-full bg-cyan-950/90 border border-cyan-400/50 text-cyan-300 font-mono text-[9px] font-bold tracking-[0.2em] uppercase shadow-[0_0_15px_rgba(56,189,248,0.45)]">
          ✦ IN-SILICO ONLY · COMPUTATIONAL COUNTERFACTUAL
        </div>
      </Html>

      {/* Scene 0: Select Candidate / Original Configuration */}
      {currentSceneIndex === 0 && (
        <group position={[0, -0.2, 0]}>
          <group scale={0.9}>
            <Chromosome type="offspring" highlightLocus={10} />
          </group>
          <Html position={[0, -1.6, 0]} center distanceFactor={10} className="pointer-events-none select-none">
            <div className="px-3 py-1 rounded-xl bg-amber-950/90 border border-amber-400 text-amber-300 font-mono text-[10px] font-bold shadow-md whitespace-nowrap">
              Target Candidate: Locus 3 (72.4 Mb) · Original Phenotype y = +2.1
            </div>
          </Html>
        </group>
      )}

      {/* Scene 1: In-Silico Intervention */}
      {currentSceneIndex === 1 && (
        <group position={[0, -0.2, 0]}>
          <group position={[-2.0, 0, 0]} scale={0.85}>
            <Chromosome type="offspring" highlightLocus={10} />
          </group>
          <group position={[1.4, 0, 0]}>
            {[
              { label: "Variant Reversion", desc: "A → G (restore reference)", active: true },
              { label: "Segment Swap", desc: "Hap-A → Hap-P (parental alternative)", active: false },
              { label: "Interaction Ablation", desc: "Disable epistatic edge γ_3,7 = 0", active: false },
            ].map((op, idx) => (
              <Html key={op.label} position={[0, (1 - idx) * 0.9, 0]} center distanceFactor={10} className="pointer-events-none select-none">
                <div className={`w-60 p-2.5 rounded-xl border ${op.active ? "bg-emerald-950/90 border-emerald-400 text-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.5)]" : "bg-slate-900/80 border-slate-700 text-slate-400"}`}>
                  <div className="text-[10px] font-mono font-bold">{op.label}</div>
                  <div className="text-[8.5px] font-mono mt-0.5 text-slate-300">{op.desc}</div>
                </div>
              </Html>
            ))}
          </group>
        </group>
      )}

      {/* Scene 2: Recompute Phenotype */}
      {currentSceneIndex === 2 && (
        <group position={[0, -0.2, 0]}>
          <mesh>
            <ringGeometry args={[1.5, 1.7, 48]} />
            <meshBasicMaterial color="#10b981" side={THREE.DoubleSide} transparent opacity={0.7} />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.8, 32, 32]} />
            <meshStandardMaterial color="#059669" emissive="#10b981" emissiveIntensity={0.6} />
          </mesh>
          <Html position={[0, -1.5, 0]} center distanceFactor={10} className="pointer-events-none select-none">
            <div className="px-3 py-1 rounded-xl bg-slate-900/90 border border-emerald-400 text-emerald-300 font-mono text-[10px] font-bold shadow-lg whitespace-nowrap">
              In-Silico Evaluation: y(x&apos;) = Σ αᵢxᵢ&apos; + Σ βⱼdⱼ&apos; + Σ γᵤᵥxᵤ&apos;xᵥ&apos;
            </div>
          </Html>
        </group>
      )}

      {/* Scene 3: Rescue Test */}
      {currentSceneIndex === 3 && (
        <group position={[0, -0.2, 0]}>
          <group position={[-2.2, 0, 0]}>
            <Html position={[0, 0.7, 0]} center distanceFactor={10} className="pointer-events-none select-none">
              <div className="p-2.5 rounded-xl bg-amber-950/90 border border-amber-500/50 text-center w-44 shadow-md">
                <div className="text-[9px] font-mono text-amber-300 font-bold uppercase">Original</div>
                <div className="text-xl font-mono font-bold text-amber-200 mt-0.5">y = +2.1</div>
                <div className="text-[8px] font-mono text-red-300 mt-0.5 px-1 py-0.5 rounded bg-red-950">Outside Envelope</div>
              </div>
            </Html>
            <mesh position={[0, -0.5, 0]}><sphereGeometry args={[0.4, 20, 20]} /><meshStandardMaterial color="#fbbf24" emissive="#d97706" emissiveIntensity={0.6} /></mesh>
          </group>

          <group position={[2.2, 0, 0]}>
            <Html position={[0, 0.7, 0]} center distanceFactor={10} className="pointer-events-none select-none">
              <div className="p-2.5 rounded-xl bg-emerald-950/90 border-2 border-emerald-400 text-center w-44 shadow-[0_0_20px_rgba(16,185,129,0.5)]">
                <div className="text-[9px] font-mono text-emerald-300 font-bold uppercase">Counterfactual</div>
                <div className="text-xl font-mono font-bold text-emerald-200 mt-0.5">y′ = +0.3</div>
                <div className="text-[8px] font-mono text-emerald-300 mt-0.5 px-1.5 py-0.5 rounded bg-emerald-900 font-bold">✓ novelty_removed: true</div>
              </div>
            </Html>
            <mesh position={[0, -0.5, 0]}><sphereGeometry args={[0.4, 20, 20]} /><meshStandardMaterial color="#10b981" emissive="#059669" emissiveIntensity={0.6} /></mesh>
          </group>
        </group>
      )}

      {/* Scene 4: Minimal Rescue */}
      {currentSceneIndex === 4 && (
        <group position={[0, -0.2, 0]}>
          <Html position={[0, 0, 0]} center distanceFactor={10} className="pointer-events-none select-none">
            <div className="w-84 p-4 rounded-2xl bg-[#06140e]/95 border-2 border-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.5)]">
              <div className="text-[10px] font-mono uppercase tracking-widest text-emerald-300 font-bold mb-2.5 text-center">
                Minimal Rescue Search
              </div>
              <div className="space-y-2 text-[9.5px] font-mono">
                <div className="flex justify-between items-center p-1.5 rounded bg-black/50 text-slate-400">
                  <span>Candidate A alone</span>
                  <span className="text-red-400 font-semibold">y = +1.5 (Fails)</span>
                </div>
                <div className="flex justify-between items-center p-1.5 rounded bg-black/50 text-slate-400">
                  <span>Candidate B alone</span>
                  <span className="text-red-400 font-semibold">y = +1.1 (Fails)</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded bg-emerald-950/90 border border-emerald-400 text-emerald-200 font-bold shadow-md">
                  <span>Joint A + B (Candidate Set)</span>
                  <span className="text-emerald-300 font-black">y = +0.3 (SUCCEEDS!)</span>
                </div>
              </div>
              <div className="mt-2.5 text-[8px] font-mono text-slate-400 text-center uppercase tracking-wider">
                Minimal within evaluated candidate pool
              </div>
            </div>
          </Html>
        </group>
      )}
    </Canvas>
  );
};
