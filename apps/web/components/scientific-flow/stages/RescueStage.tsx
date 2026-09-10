"use client";

import React, { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";

export const RescueStage: React.FC<{ opacity?: number }> = ({ opacity = 1 }) => {
  const beamRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (beamRef.current) {
      beamRef.current.rotation.z += delta * 0.8;
    }
  });

  return (
    <group position={[0, -0.2, 0]}>
      {/* Left: Original Offspring */}
      <group position={[-2.2, 0, 0]}>
        <Html position={[0, 0.75, 0]} center distanceFactor={11} className="pointer-events-none select-none">
          <div className="p-2.5 rounded-xl bg-amber-950/80 border border-amber-500/50 text-center w-44">
            <div className="text-[9.5px] font-mono text-amber-300 font-bold uppercase">Original Offspring</div>
            <div className="text-xl font-mono font-extrabold text-amber-200 mt-0.5">y = 18.7</div>
            <div className="text-[8px] font-mono text-red-300 mt-0.5 px-1.5 py-0.5 rounded bg-red-950/80 border border-red-500/40">
              Outside Envelope
            </div>
          </div>
        </Html>
        <mesh position={[0, -0.5, 0]}>
          <sphereGeometry args={[0.45, 24, 24]} />
          <meshStandardMaterial color="#fbbf24" emissive="#d97706" emissiveIntensity={0.6} />
        </mesh>
      </group>

      {/* Center: In-Silico Intervention Ring */}
      <group position={[0, 0, 0]}>
        <mesh ref={beamRef}>
          <ringGeometry args={[0.45, 0.58, 32]} />
          <meshBasicMaterial color="#10b981" side={THREE.DoubleSide} transparent opacity={0.7} blending={THREE.AdditiveBlending} />
        </mesh>
        <Html position={[0, -0.85, 0]} center distanceFactor={11} className="pointer-events-none select-none">
          <div className="px-2 py-0.5 rounded bg-slate-900 border border-emerald-500/50 text-emerald-300 font-mono text-[8.5px] whitespace-nowrap">
            Ablation: x₁₀ ← x₁₀(ref)
          </div>
        </Html>
      </group>

      {/* Right: Counterfactual Rescued State */}
      <group position={[2.2, 0, 0]}>
        <Html position={[0, 0.75, 0]} center distanceFactor={11} className="pointer-events-none select-none">
          <div className="p-2.5 rounded-xl bg-emerald-950/80 border-2 border-emerald-400 text-center w-44 shadow-[0_0_20px_rgba(16,185,129,0.5)]">
            <div className="text-[9.5px] font-mono text-emerald-300 font-bold uppercase">Counterfactual Rescue</div>
            <div className="text-xl font-mono font-extrabold text-emerald-200 mt-0.5">y′ = 13.5</div>
            <div className="text-[8px] font-mono text-emerald-300 mt-0.5 px-1.5 py-0.5 rounded bg-emerald-900/80 border border-emerald-400 font-bold">
              ✓ Novelty Rescued
            </div>
          </div>
        </Html>
        <mesh position={[0, -0.5, 0]}>
          <sphereGeometry args={[0.45, 24, 24]} />
          <meshStandardMaterial color="#10b981" emissive="#059669" emissiveIntensity={0.6} />
        </mesh>
      </group>
    </group>
  );
};
