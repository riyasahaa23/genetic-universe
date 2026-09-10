"use client";

import React, { useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { Chromosome } from "../../genetic-universe/Chromosome";
import { CelestialBackground } from "../../genetic-universe/CelestialBackground";

export const PhenotypeExplanation: React.FC<{ currentSceneIndex: number; reducedMotion: boolean }> = ({
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

      {/* Scene 0: Genotype Input */}
      {currentSceneIndex === 0 && (
        <group position={[0, -0.2, 0]}>
          <group scale={0.9}>
            <Chromosome type="offspring" />
          </group>
          {[-0.8, -0.4, 0, 0.4, 0.8].map((y, idx) => (
            <group key={`locus-dosage-${idx}`} position={[0.45, y, 0.15]}>
              <mesh>
                <sphereGeometry args={[0.07, 12, 12]} />
                <meshBasicMaterial color="#38bdf8" />
              </mesh>
              <Html position={[0.4, 0, 0]} center distanceFactor={10} className="pointer-events-none select-none">
                <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-slate-900 border border-slate-700 text-cyan-300">
                  x_{idx + 1} = {idx % 2 === 0 ? 1 : 2}
                </span>
              </Html>
            </group>
          ))}
          <Html position={[0, -1.6, 0]} center distanceFactor={10} className="pointer-events-none select-none">
            <div className="px-3 py-0.5 rounded-full bg-slate-900/90 border border-sky-400 text-sky-200 font-mono text-[9.5px] font-bold uppercase shadow-md whitespace-nowrap">
              Genotype Matrix G_off: Locus Dosages x_i ∈ {`{0, 1, 2}`}
            </div>
          </Html>
        </group>
      )}

      {/* Scene 1: Additive Effects */}
      {currentSceneIndex === 1 && (
        <group position={[0, -0.2, 0]}>
          {[-1.8, -0.6, 0.6, 1.8].map((x, idx) => (
            <group key={`add-${idx}`} position={[x, 0, 0]}>
              <mesh position={[0, 0, 0]}>
                <boxGeometry args={[0.08, 2.2, 0.04]} />
                <meshBasicMaterial color="#00f0ff" transparent opacity={0.7} />
              </mesh>
              <mesh position={[0, 1.1, 0]}>
                <sphereGeometry args={[0.1, 16, 16]} />
                <meshBasicMaterial color="#38bdf8" />
              </mesh>
              <Html position={[0, -1.3, 0]} center distanceFactor={10} className="pointer-events-none select-none">
                <span className="text-[8px] font-mono text-cyan-300 whitespace-nowrap">
                  α_{idx + 1} · x_{idx + 1}
                </span>
              </Html>
            </group>
          ))}
          <Html position={[0, 1.6, 0]} center distanceFactor={10} className="pointer-events-none select-none">
            <div className="px-3 py-1 rounded-xl bg-blue-950/90 border border-cyan-400 text-cyan-200 font-mono text-[10px] font-bold shadow-lg whitespace-nowrap">
              Σ αᵢxᵢ = +11.2 (Linear Additive Background)
            </div>
          </Html>
        </group>
      )}

      {/* Scene 2: Dominance */}
      {currentSceneIndex === 2 && (
        <group position={[0, -0.2, 0]}>
          <group position={[-1.2, 0, 0]}>
            <mesh>
              <boxGeometry args={[1.6, 1.2, 0.08]} />
              <meshStandardMaterial color="#8b5cf6" transparent opacity={0.3} emissive="#6d28d9" emissiveIntensity={0.4} />
            </mesh>
            <Html position={[0, -0.9, 0]} center distanceFactor={10} className="pointer-events-none select-none">
              <span className="text-[8.5px] font-mono text-violet-300 whitespace-nowrap">
                Heterozygous Sites (x_j = 1)
              </span>
            </Html>
          </group>
          <group position={[1.2, 0, 0]}>
            <mesh>
              <boxGeometry args={[1.6, 1.2, 0.08]} />
              <meshStandardMaterial color="#ec4899" transparent opacity={0.3} emissive="#be185d" emissiveIntensity={0.4} />
            </mesh>
            <Html position={[0, -0.9, 0]} center distanceFactor={10} className="pointer-events-none select-none">
              <span className="text-[8.5px] font-mono text-pink-300 whitespace-nowrap">
                Dominance Deviations (β_j d_j)
              </span>
            </Html>
          </group>
          <Html position={[0, 1.4, 0]} center distanceFactor={10} className="pointer-events-none select-none">
            <div className="px-3 py-1 rounded-xl bg-purple-950/90 border border-purple-400 text-purple-200 font-mono text-[10px] font-bold shadow-lg whitespace-nowrap">
              Σ βⱼdⱼ = +2.1 (Dominance Non-Additivity)
            </div>
          </Html>
        </group>
      )}

      {/* Scene 3: Epistasis */}
      {currentSceneIndex === 3 && (
        <group position={[0, -0.2, 0]}>
          {/* 3 Interaction nodes */}
          <group position={[-1.5, 0.6, 0]}>
            <mesh><sphereGeometry args={[0.2, 16, 16]} /><meshBasicMaterial color="#38bdf8" /></mesh>
            <Html position={[0, 0.4, 0]} center distanceFactor={10} className="pointer-events-none select-none"><span className="text-[8.5px] font-mono text-cyan-300">Locus 10</span></Html>
          </group>
          <group position={[1.5, 0.6, 0]}>
            <mesh><sphereGeometry args={[0.2, 16, 16]} /><meshBasicMaterial color="#ec4899" /></mesh>
            <Html position={[0, 0.4, 0]} center distanceFactor={10} className="pointer-events-none select-none"><span className="text-[8.5px] font-mono text-pink-300">Locus 31</span></Html>
          </group>
          <group position={[0, -0.8, 0]}>
            <mesh><sphereGeometry args={[0.2, 16, 16]} /><meshBasicMaterial color="#fbbf24" /></mesh>
            <Html position={[0, -0.4, 0]} center distanceFactor={10} className="pointer-events-none select-none"><span className="text-[8.5px] font-mono text-amber-300">Locus 4</span></Html>
          </group>

          {/* Epistatic Beams */}
          <mesh position={[0, 0.6, 0]}>
            <planeGeometry args={[3.0, 0.05]} />
            <meshBasicMaterial color="#fbbf24" transparent opacity={0.9} />
          </mesh>
          <mesh position={[-0.75, -0.1, 0]} rotation={[0, 0, 0.75]}>
            <planeGeometry args={[2.2, 0.03]} />
            <meshBasicMaterial color="#fbbf24" transparent opacity={0.5} />
          </mesh>
          <mesh position={[0.75, -0.1, 0]} rotation={[0, 0, -0.75]}>
            <planeGeometry args={[2.2, 0.03]} />
            <meshBasicMaterial color="#fbbf24" transparent opacity={0.5} />
          </mesh>

          <Html position={[0, 0.85, 0]} center distanceFactor={10} className="pointer-events-none select-none">
            <div className="px-3 py-1 rounded-xl bg-amber-950/90 border border-amber-400 text-amber-300 font-mono text-[10px] font-bold shadow-[0_0_15px_rgba(245,158,11,0.6)] whitespace-nowrap">
              γ_10,31 · x_10 x_31 = +5.4 (Epistatic Synergy)
            </div>
          </Html>
        </group>
      )}

      {/* Scene 4: Phenotype Output */}
      {currentSceneIndex === 4 && (
        <group position={[0, -0.2, 0]}>
          <group position={[-2.4, 0, 0]}>
            <mesh><sphereGeometry args={[0.6, 24, 24]} /><meshStandardMaterial color="#00f0ff" emissive="#0284c7" emissiveIntensity={0.4} /></mesh>
            <Html position={[0, -0.9, 0]} center distanceFactor={10} className="pointer-events-none select-none">
              <span className="text-[8.5px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40 whitespace-nowrap">Parent A: -0.92</span>
            </Html>
          </group>

          {/* Central Phenotype Sphere */}
          <group position={[0, 0, 0]}>
            <mesh><sphereGeometry args={[0.9, 32, 32]} /><meshStandardMaterial color="#fbbf24" emissive="#d97706" emissiveIntensity={0.8} /></mesh>
            <mesh><torusGeometry args={[1.2, 0.02, 16, 64]} /><meshBasicMaterial color="#38bdf8" /></mesh>
            <Html position={[0, -1.3, 0]} center distanceFactor={10} className="pointer-events-none select-none">
              <div className="px-3 py-1 rounded-full bg-emerald-950/90 border border-amber-400 text-amber-300 font-mono text-[10.5px] font-bold shadow-[0_0_15px_rgba(251,191,36,0.5)] whitespace-nowrap">
                Transgressive Offspring: y = +1.48
              </div>
            </Html>
          </group>

          <group position={[2.4, 0, 0]}>
            <mesh><sphereGeometry args={[0.6, 24, 24]} /><meshStandardMaterial color="#ec4899" emissive="#be185d" emissiveIntensity={0.4} /></mesh>
            <Html position={[0, -0.9, 0]} center distanceFactor={10} className="pointer-events-none select-none">
              <span className="text-[8.5px] font-mono px-2 py-0.5 rounded bg-pink-950 text-pink-300 border border-pink-500/40 whitespace-nowrap">Parent B: +0.48</span>
            </Html>
          </group>
        </group>
      )}
    </Canvas>
  );
};
