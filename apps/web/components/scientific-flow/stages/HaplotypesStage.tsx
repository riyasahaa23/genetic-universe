"use client";

import React, { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { Chromosome } from "../../genetic-universe/Chromosome";

export const HaplotypesStage: React.FC<{ opacity?: number }> = ({ opacity = 1 }) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();
    groupRef.current.position.y = -0.2 + Math.sin(t * 0.8) * 0.03;
  });

  const locusYs = [0.8, 0.4, -0.2, -0.7];

  return (
    <group ref={groupRef} position={[0, -0.2, 0]}>
      {/* Parent A Homologs */}
      <group position={[-2.2, 0, 0]}>
        {/* Homolog A1 */}
        <group position={[-0.55, 0, 0]}>
          <Html position={[0, -1.6, 0]} center distanceFactor={12} className="pointer-events-none select-none">
            <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-cyan-950/90 border border-cyan-500/40 text-cyan-200 font-semibold shadow-md">
              Homolog A1 (Phase α)
            </span>
          </Html>
          <Chromosome type="parent_a" scale={0.9} />
          {locusYs.map((y, idx) => (
            <mesh key={`a1-${idx}`} position={[0.2, y, 0.15]}>
              <sphereGeometry args={[0.045, 12, 12]} />
              <meshBasicMaterial color="#38bdf8" />
            </mesh>
          ))}
        </group>

        {/* Homolog A2 */}
        <group position={[0.55, 0, 0]}>
          <Html position={[0, -1.6, 0]} center distanceFactor={12} className="pointer-events-none select-none">
            <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-cyan-950/90 border border-cyan-500/40 text-cyan-200 font-semibold shadow-md">
              Homolog A2 (Phase β)
            </span>
          </Html>
          <Chromosome type="parent_a" scale={0.9} />
          {locusYs.map((y, idx) => (
            <mesh key={`a2-${idx}`} position={[-0.2, y, 0.15]}>
              <sphereGeometry args={[0.045, 12, 12]} />
              <meshBasicMaterial color="#06b6d4" />
            </mesh>
          ))}
        </group>
      </group>

      {/* Parent B Homologs */}
      <group position={[2.2, 0, 0]}>
        {/* Homolog B1 */}
        <group position={[-0.55, 0, 0]}>
          <Html position={[0, -1.6, 0]} center distanceFactor={12} className="pointer-events-none select-none">
            <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-pink-950/90 border border-pink-500/40 text-pink-200 font-semibold shadow-md">
              Homolog B1 (Phase α)
            </span>
          </Html>
          <Chromosome type="parent_b" scale={0.9} />
          {locusYs.map((y, idx) => (
            <mesh key={`b1-${idx}`} position={[0.2, y, 0.15]}>
              <sphereGeometry args={[0.045, 12, 12]} />
              <meshBasicMaterial color="#ec4899" />
            </mesh>
          ))}
        </group>

        {/* Homolog B2 */}
        <group position={[0.55, 0, 0]}>
          <Html position={[0, -1.6, 0]} center distanceFactor={12} className="pointer-events-none select-none">
            <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-pink-950/90 border border-pink-500/40 text-pink-200 font-semibold shadow-md">
              Homolog B2 (Phase β)
            </span>
          </Html>
          <Chromosome type="parent_b" scale={0.9} />
          {locusYs.map((y, idx) => (
            <mesh key={`b2-${idx}`} position={[-0.2, y, 0.15]}>
              <sphereGeometry args={[0.045, 12, 12]} />
              <meshBasicMaterial color="#f43f5e" />
            </mesh>
          ))}
        </group>
      </group>
    </group>
  );
};
