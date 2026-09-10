"use client";

import React, { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";

export const SummaryStage: React.FC<{ opacity?: number }> = ({ opacity = 1 }) => {
  const centralSphereRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    if (centralSphereRef.current) {
      centralSphereRef.current.rotation.y += delta * 0.15;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * 0.2;
      ringRef.current.rotation.x = Math.sin(t * 0.5) * 0.2;
    }
  });

  const steps = [
    { title: "PARENTS", sub: "Diploid", col: "text-cyan-400" },
    { title: "HAPLOTYPES", sub: "Phase", col: "text-sky-400" },
    { title: "MEIOSIS", sub: "Synapsis", col: "text-blue-400" },
    { title: "CROSSOVER", sub: "Chiasma", col: "text-amber-400" },
    { title: "OFFSPRING", sub: "Mosaic", col: "text-cyan-300" },
    { title: "PHENOTYPE", sub: "Epistasis", col: "text-indigo-400" },
    { title: "NOVELTY", sub: "Transgression", col: "text-yellow-300" },
    { title: "TRACE", sub: "Attribution", col: "text-violet-400" },
    { title: "RESCUE", sub: "Minimal Set", col: "text-emerald-400" },
  ];

  return (
    <group position={[0, -0.15, 0]}>
      {/* Executive Provenance Pipeline Ribbon positioned safely at y = 1.0 */}
      <Html position={[0, 1.0, 0]} center distanceFactor={12} className="pointer-events-none select-none">
        <div className="flex flex-col items-center whitespace-nowrap">
          <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-[#03091e]/90 border border-sky-500/30 backdrop-blur-xl shadow-2xl">
            {steps.map((s, idx) => (
              <React.Fragment key={s.title}>
                <div className="flex flex-col items-center px-2 py-0.5 rounded-lg bg-slate-900/70 border border-slate-800 text-center">
                  <span className={`text-[8.5px] font-mono font-bold uppercase ${s.col}`}>{s.title}</span>
                  <span className="text-[6.5px] font-mono text-slate-400">{s.sub}</span>
                </div>
                {idx < steps.length - 1 && (
                  <span className="text-slate-600 text-[9px] font-mono font-bold">→</span>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </Html>

      {/* Central Offspring Globe */}
      <group position={[0, -0.4, 0]}>
        <pointLight color="#38bdf8" intensity={2.2} distance={8} />
        <mesh ref={centralSphereRef}>
          <sphereGeometry args={[1.0, 32, 32]} />
          <meshStandardMaterial
            color="#0284c7"
            emissive="#0369a1"
            emissiveIntensity={0.5}
            roughness={0.1}
            metalness={0.2}
            transparent
            opacity={0.3 * opacity}
          />
        </mesh>

        <mesh ref={ringRef}>
          <ringGeometry args={[1.3, 1.38, 64]} />
          <meshBasicMaterial color="#fbbf24" side={THREE.DoubleSide} transparent opacity={0.6 * opacity} blending={THREE.AdditiveBlending} />
        </mesh>
      </group>
    </group>
  );
};
