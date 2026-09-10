"use client";

import React, { useRef, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { Chromosome } from "../../genetic-universe/Chromosome";

export const MeiosisStage: React.FC<{ opacity?: number }> = ({ opacity = 1 }) => {
  const groupRef = useRef<THREE.Group>(null);
  const rungsRef = useRef<THREE.Group>(null);

  const rungs = useMemo(() => [-0.9, -0.6, -0.3, 0.0, 0.3, 0.6, 0.9], []);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();
    groupRef.current.position.y = -0.2 + Math.sin(t * 0.9) * 0.03;

    if (rungsRef.current) {
      rungsRef.current.children.forEach((child, i) => {
        const mesh = child as THREE.Mesh;
        const mat = mesh.material as THREE.MeshBasicMaterial;
        if (mat) {
          mat.opacity = 0.5 + Math.sin(t * 3.0 + i * 0.8) * 0.35;
        }
      });
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.2, 0]}>
      {/* Maternal Homolog (Cyan) */}
      <group position={[-0.85, 0, 0]}>
        <Chromosome type="parent_a" scale={1.02} rotation={[0, 0.1, 0.03]} />
      </group>

      {/* Synaptonemal Central Element (Transverse Protein Rungs) */}
      <group ref={rungsRef}>
        {rungs.map((y, idx) => (
          <mesh key={`rung-${idx}`} position={[0, y, 0]}>
            <boxGeometry args={[0.7, 0.025, 0.025]} />
            <meshBasicMaterial color="#38bdf8" transparent opacity={0.7} blending={THREE.AdditiveBlending} />
          </mesh>
        ))}
      </group>

      {/* Central Synapsis Ribbon Glow */}
      <mesh position={[0, 0, -0.05]}>
        <planeGeometry args={[0.8, 2.2]} />
        <meshBasicMaterial color="#0284c7" transparent opacity={0.12} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
      </mesh>

      {/* Paternal Homolog (Magenta) */}
      <group position={[0.85, 0, 0]}>
        <Chromosome type="parent_b" scale={1.02} rotation={[0, -0.1, -0.03]} />
      </group>

      {/* Synapsis Label below */}
      <Html position={[0, -1.6, 0]} center distanceFactor={11} className="pointer-events-none select-none">
        <div className="flex flex-col items-center whitespace-nowrap bg-[#061026]/90 px-3 py-1 rounded-full border border-sky-400/40 shadow-lg">
          <span className="text-sky-300 font-mono text-[10px] font-bold tracking-widest uppercase">
            SYNAPTONEMAL COMPLEX (BIVALENT ALIGNMENT)
          </span>
        </div>
      </Html>
    </group>
  );
};
