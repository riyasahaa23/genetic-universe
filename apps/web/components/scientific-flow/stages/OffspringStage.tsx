"use client";

import React, { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { Chromosome } from "../../genetic-universe/Chromosome";

export const OffspringStage: React.FC<{ opacity?: number }> = ({ opacity = 1 }) => {
  const sphereRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    if (sphereRef.current) {
      sphereRef.current.rotation.y += delta * 0.1;
      sphereRef.current.position.y = -0.1 + Math.sin(t * 1.5) * 0.04;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * 0.2;
    }
  });

  return (
    <group position={[0, -0.2, 0]}>
      {/* Provenance Guide Lines from Parents */}
      <group position={[0, 0, -0.2]}>
        <mesh position={[-1.6, 1.1, 0]} rotation={[0, 0, -0.45]}>
          <planeGeometry args={[2.5, 0.03]} />
          <meshBasicMaterial color="#00f0ff" transparent opacity={0.4} blending={THREE.AdditiveBlending} />
        </mesh>
        <mesh position={[1.6, 1.1, 0]} rotation={[0, 0, 0.45]}>
          <planeGeometry args={[2.5, 0.03]} />
          <meshBasicMaterial color="#ec4899" transparent opacity={0.4} blending={THREE.AdditiveBlending} />
        </mesh>
      </group>

      {/* Offspring Translucent Sphere */}
      <mesh ref={sphereRef} position={[0, 0, 0]}>
        <sphereGeometry args={[1.6, 36, 36]} />
        <meshStandardMaterial
          color="#38bdf8"
          transparent
          opacity={0.08 * opacity}
          roughness={0.05}
          metalness={0.2}
          emissive="#0284c7"
          emissiveIntensity={0.3 * opacity}
          depthWrite={false}
        />
      </mesh>

      {/* Luminous Orbital Rim Ring */}
      <mesh ref={ringRef} position={[0, 0, 0]}>
        <ringGeometry args={[1.58, 1.64, 80]} />
        <meshBasicMaterial color="#38bdf8" side={THREE.DoubleSide} transparent opacity={0.8 * opacity} blending={THREE.AdditiveBlending} />
      </mesh>

      {/* Inside: Mosaic Offspring Chromosomes */}
      <group position={[0, 0, 0]} scale={0.85}>
        <Chromosome type="offspring" position={[-0.38, 0, 0.1]} rotation={[0.1, 0.35, 0.15]} />
        <Chromosome type="offspring" position={[0.38, 0, -0.1]} rotation={[-0.1, -0.35, -0.12]} />
      </group>

      {/* Label below sphere */}
      <Html position={[0, -1.9, 0]} center distanceFactor={12} className="pointer-events-none select-none">
        <div className="flex flex-col items-center whitespace-nowrap drop-shadow-[0_2px_15px_rgba(56,189,248,0.5)]">
          <div className="px-3 py-0.5 rounded-full bg-slate-900/90 border border-sky-400/60 text-sky-200 font-mono text-[10.5px] font-bold tracking-widest uppercase shadow-md">
            OFFSPRING MOSAIC GENOME [2n = 46]
          </div>
          <div className="text-[8.5px] font-mono text-slate-300 mt-0.5 bg-black/60 px-2 py-0.5 rounded border border-slate-700">
            52% Maternal (Cyan) + 48% Paternal (Magenta) Mosaic Linkages
          </div>
        </div>
      </Html>
    </group>
  );
};
