"use client";

import React, { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { Chromosome } from "../../genetic-universe/Chromosome";

export const TraceStage: React.FC<{ opacity?: number }> = ({ opacity = 1 }) => {
  const raysRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!raysRef.current) return;
    const t = state.clock.getElapsedTime();
    raysRef.current.children.forEach((child, i) => {
      const mesh = child as THREE.Mesh;
      const mat = mesh.material as THREE.MeshBasicMaterial;
      if (mat) {
        mat.opacity = 0.4 + Math.sin(t * 4.0 - i * 0.9) * 0.35;
      }
    });
  });

  return (
    <group position={[0, -0.2, 0]}>
      {/* Left: Offspring Chromosome */}
      <group position={[-2.4, 0, 0]} scale={0.85}>
        <Chromosome type="offspring" highlightLocus={10} />
        <Html position={[0, -1.6, 0]} center distanceFactor={11} className="pointer-events-none select-none">
          <span className="text-[8.5px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300">
            Offspring Locus Map
          </span>
        </Html>
      </group>

      {/* Center: Backward Attribution Rays */}
      <group ref={raysRef} position={[-0.4, 0.1, 0]}>
        <mesh position={[-0.3, 0.5, 0]} rotation={[0, 0, 0.22]}>
          <planeGeometry args={[1.8, 0.035]} />
          <meshBasicMaterial color="#fbbf24" transparent opacity={0.8} blending={THREE.AdditiveBlending} />
        </mesh>
        <mesh position={[-0.3, 0.0, 0]}>
          <planeGeometry args={[1.8, 0.02]} />
          <meshBasicMaterial color="#94a3b8" transparent opacity={0.4} blending={THREE.AdditiveBlending} />
        </mesh>
        <mesh position={[-0.3, -0.5, 0]} rotation={[0, 0, -0.22]}>
          <planeGeometry args={[1.8, 0.015]} />
          <meshBasicMaterial color="#64748b" transparent opacity={0.3} blending={THREE.AdditiveBlending} />
        </mesh>
      </group>

      {/* Right: 3 Candidate Configurations */}
      <group position={[1.8, 0.1, 0]}>
        {/* Candidate 1 - Top Ranked */}
        <Html position={[0, 0.65, 0]} center distanceFactor={11} className="pointer-events-none select-none">
          <div className="w-56 p-2 rounded-xl bg-[#140f03]/90 border-2 border-amber-400/90 shadow-[0_0_20px_rgba(245,158,11,0.5)]">
            <div className="flex items-center justify-between">
              <span className="text-[9.5px] font-mono font-bold text-amber-300 uppercase">★ Candidate 1 (Top Rank)</span>
              <span className="text-[8.5px] font-mono px-1 rounded bg-amber-500/20 text-amber-300 font-bold">+4.82</span>
            </div>
            <div className="text-[8.5px] font-mono text-slate-200 mt-0.5">
              Loci 10 × 31 Epistatic Coupling
            </div>
            <div className="text-[7.5px] font-mono text-amber-200/80 mt-0.5">
              Recombinant Segment Chr1 @ 42.8 cM · Shapley: 81.4%
            </div>
          </div>
        </Html>

        {/* Candidate 2 */}
        <Html position={[0, 0.0, 0]} center distanceFactor={11} className="pointer-events-none select-none">
          <div className="w-56 p-1.5 rounded-xl bg-slate-900/80 border border-slate-700/80 opacity-75">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-mono text-slate-300 uppercase">Candidate 2 (Secondary)</span>
              <span className="text-[8px] font-mono text-slate-400">+1.15</span>
            </div>
            <div className="text-[8px] font-mono text-slate-400">
              Loci 4 × 18 Additive Interaction
            </div>
          </div>
        </Html>

        {/* Candidate 3 */}
        <Html position={[0, -0.6, 0]} center distanceFactor={11} className="pointer-events-none select-none">
          <div className="w-56 p-1.5 rounded-xl bg-slate-900/80 border border-slate-800 opacity-55">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-mono text-slate-400 uppercase">Candidate 3</span>
              <span className="text-[8px] font-mono text-slate-500">+0.45</span>
            </div>
            <div className="text-[8px] font-mono text-slate-500">
              Locus 22 Dominance Shift
            </div>
          </div>
        </Html>
      </group>
    </group>
  );
};
