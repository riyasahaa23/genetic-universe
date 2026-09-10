"use client";

import React, { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";

export const PhenotypeStage: React.FC<{ opacity?: number }> = ({ opacity = 1 }) => {
  const coreRef = useRef<THREE.Mesh>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    if (coreRef.current) {
      const s = 1.0 + Math.sin(t * 3.5) * 0.08;
      coreRef.current.scale.set(s, s, s);
    }
    if (ring1Ref.current) {
      ring1Ref.current.rotation.x += delta * 0.6;
      ring1Ref.current.rotation.y += delta * 0.8;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.y -= delta * 0.7;
      ring2Ref.current.rotation.z += delta * 0.5;
    }
  });

  return (
    <group position={[0, -0.2, 0]}>
      {/* Comparative Trait Metric Cards on flanks */}
      <Html position={[-2.6, 0.1, 0]} center distanceFactor={11} className="pointer-events-none select-none">
        <div className="px-3 py-2 rounded-xl bg-[#030d22]/90 border border-cyan-500/40 text-center shadow-lg">
          <div className="text-[9px] font-mono text-cyan-400 uppercase">Parent A Trait</div>
          <div className="text-lg font-mono font-bold text-cyan-200">12.4</div>
          <div className="text-[8px] font-mono text-slate-400">Baseline Diploid</div>
        </div>
      </Html>

      <Html position={[2.6, 0.1, 0]} center distanceFactor={11} className="pointer-events-none select-none">
        <div className="px-3 py-2 rounded-xl bg-[#1f0515]/90 border border-pink-500/40 text-center shadow-lg">
          <div className="text-[9px] font-mono text-pink-400 uppercase">Parent B Trait</div>
          <div className="text-lg font-mono font-bold text-pink-200">14.1</div>
          <div className="text-[8px] font-mono text-slate-400">Baseline Diploid</div>
        </div>
      </Html>

      {/* Central Phenotype Energy Core */}
      <group position={[0, 0.1, 0]}>
        <pointLight color="#fbbf24" intensity={2.5} distance={7} />
        <mesh ref={coreRef}>
          <sphereGeometry args={[0.7, 32, 32]} />
          <meshStandardMaterial
            color="#fbbf24"
            emissive="#d97706"
            emissiveIntensity={0.8}
            roughness={0.2}
            metalness={0.4}
            transparent
            opacity={0.85 * opacity}
          />
        </mesh>

        <mesh ref={ring1Ref}>
          <torusGeometry args={[1.1, 0.02, 16, 64]} />
          <meshBasicMaterial color="#38bdf8" transparent opacity={0.7} />
        </mesh>

        <mesh ref={ring2Ref}>
          <torusGeometry args={[1.3, 0.02, 16, 64]} />
          <meshBasicMaterial color="#ec4899" transparent opacity={0.7} />
        </mesh>

        {/* Offspring Phenotype Value below core */}
        <Html position={[0, -1.2, 0]} center distanceFactor={11} className="pointer-events-none select-none">
          <div className="px-3 py-1 rounded-full bg-emerald-950/90 border border-emerald-500/60 text-emerald-300 font-mono text-[10.5px] font-bold shadow-lg">
            Offspring Phenotype: y = 18.7
          </div>
        </Html>
      </group>
    </group>
  );
};
