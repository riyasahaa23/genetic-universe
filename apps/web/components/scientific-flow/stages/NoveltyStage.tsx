"use client";

import React, { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";

export const NoveltyStage: React.FC<{ opacity?: number }> = ({ opacity = 1 }) => {
  const haloRef = useRef<THREE.Mesh>(null);
  const pulseLightRef = useRef<THREE.PointLight>(null);

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    if (haloRef.current) {
      haloRef.current.rotation.z += delta * 0.4;
      const s = 1.0 + Math.sin(t * 4.0) * 0.08;
      haloRef.current.scale.set(s, s, s);
    }
    if (pulseLightRef.current) {
      pulseLightRef.current.intensity = 2.5 + Math.sin(t * 5.0) * 1.0;
    }
  });

  return (
    <group position={[0, -0.3, 0]}>
      <pointLight ref={pulseLightRef} color="#fbbf24" intensity={3.0} distance={8} />

      {/* 3D Phenotype Envelope Bar */}
      <group position={[0, 0, 0]}>
        {/* Background track */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[6.5, 0.08, 0.06]} />
          <meshBasicMaterial color="#1e293b" />
        </mesh>

        {/* Parental Envelope Zone [12.4 to 14.1] mapped in local space [-1.5 to 0.0] */}
        <mesh position={[-0.75, 0, 0.02]}>
          <boxGeometry args={[1.5, 0.18, 0.08]} />
          <meshBasicMaterial color="#0369a1" transparent opacity={0.65} />
        </mesh>

        {/* Parent A Pin */}
        <mesh position={[-1.5, 0.25, 0]}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshBasicMaterial color="#00f0ff" />
        </mesh>
        <Html position={[-1.5, 0.55, 0]} center distanceFactor={10} className="pointer-events-none select-none">
          <span className="text-[8.5px] font-mono px-2 py-0.5 rounded bg-cyan-950/90 text-cyan-300 border border-cyan-500/40 whitespace-nowrap shadow-md">
            Parent A: 12.4
          </span>
        </Html>

        {/* Parent B Pin */}
        <mesh position={[0.0, 0.25, 0]}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshBasicMaterial color="#ec4899" />
        </mesh>
        <Html position={[0.0, 0.55, 0]} center distanceFactor={10} className="pointer-events-none select-none">
          <span className="text-[8.5px] font-mono px-2 py-0.5 rounded bg-pink-950/90 text-pink-300 border border-pink-500/40 whitespace-nowrap shadow-md">
            Parent B: 14.1
          </span>
        </Html>

        {/* Transgressive Offspring Pin - PUSHED FAR RIGHT */}
        <mesh position={[2.2, 0.25, 0]}>
          <sphereGeometry args={[0.18, 24, 24]} />
          <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={0.9} />
        </mesh>
        <Html position={[2.2, 0.75, 0]} center distanceFactor={10} className="pointer-events-none select-none">
          <div className="px-3 py-1 rounded-xl bg-amber-950/90 border border-amber-400 text-amber-300 font-mono text-[9.5px] font-bold shadow-[0_0_15px_rgba(245,158,11,0.6)] whitespace-nowrap">
            Offspring: 18.7 (Novel)
          </div>
        </Html>

        {/* Novelty Delta Arrow */}
        <mesh position={[1.1, 0.25, 0]}>
          <boxGeometry args={[2.0, 0.03, 0.03]} />
          <meshBasicMaterial color="#fbbf24" />
        </mesh>
      </group>

      {/* Pulsing Gold Halo Ring */}
      <mesh ref={haloRef} position={[2.2, 0.25, 0]}>
        <ringGeometry args={[0.35, 0.45, 32]} />
        <meshBasicMaterial color="#fbbf24" side={THREE.DoubleSide} transparent opacity={0.8} blending={THREE.AdditiveBlending} />
      </mesh>

      {/* Delta Callout below */}
      <Html position={[1.1, -0.6, 0]} center distanceFactor={10} className="pointer-events-none select-none">
        <div className="text-[8.5px] font-mono text-amber-300 bg-amber-950/90 px-3 py-0.5 rounded border border-amber-500/40 whitespace-nowrap shadow-md">
          Transgressive Margin: Δ = +4.6 beyond parental ceiling
        </div>
      </Html>
    </group>
  );
};
