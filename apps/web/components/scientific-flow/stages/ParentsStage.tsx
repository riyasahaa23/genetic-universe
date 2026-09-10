"use client";

import React, { useRef, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { Chromosome } from "../../genetic-universe/Chromosome";

export const ParentsStage: React.FC<{ opacity?: number }> = ({ opacity = 1 }) => {
  const groupRef = useRef<THREE.Group>(null);
  const sphereARef = useRef<THREE.Mesh>(null);
  const sphereBRef = useRef<THREE.Mesh>(null);

  const particleGeoA = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(50 * 3);
    for (let i = 0; i < 50; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = Math.cbrt(Math.random()) * 1.3;
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
    }
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return geo;
  }, []);

  const particleGeoB = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(50 * 3);
    for (let i = 0; i < 50; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = Math.cbrt(Math.random()) * 1.3;
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
    }
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return geo;
  }, []);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();

    if (sphereARef.current) {
      sphereARef.current.rotation.y += delta * 0.15;
      sphereARef.current.position.y = -0.1 + Math.sin(t * 1.2) * 0.04;
    }
    if (sphereBRef.current) {
      sphereBRef.current.rotation.y -= delta * 0.15;
      sphereBRef.current.position.y = -0.1 + Math.sin(t * 1.2 + Math.PI) * 0.04;
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.2, 0]}>
      {/* Parent A (Left, Cyan) */}
      <group position={[-2.8, 0, 0]}>
        {/* Label positioned neatly below sphere */}
        <Html position={[0, -1.9, 0]} center distanceFactor={14} className="pointer-events-none select-none">
          <div className="flex flex-col items-center whitespace-nowrap drop-shadow-[0_2px_12px_rgba(0,0,0,0.95)]">
            <div className="px-3 py-0.5 rounded-full bg-cyan-950/90 border border-cyan-400/50 text-cyan-300 font-mono text-[11px] font-bold tracking-wider uppercase shadow-[0_0_12px_rgba(6,182,212,0.3)]">
              Parent A [2n = 46]
            </div>
            <div className="text-[9px] font-mono text-cyan-400/80 mt-0.5">Maternal Diploid Line</div>
          </div>
        </Html>

        {/* Sphere envelope */}
        <mesh ref={sphereARef}>
          <sphereGeometry args={[1.5, 32, 32]} />
          <meshStandardMaterial
            color="#00f0ff"
            transparent
            opacity={0.08 * opacity}
            roughness={0.1}
            metalness={0.2}
            emissive="#0284c7"
            emissiveIntensity={0.25 * opacity}
            depthWrite={false}
          />
        </mesh>

        {/* Outer glowing rim */}
        <mesh>
          <ringGeometry args={[1.48, 1.54, 64]} />
          <meshBasicMaterial color="#00e5ff" transparent opacity={0.65 * opacity} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
        </mesh>

        {/* Nucleoplasm points */}
        <points geometry={particleGeoA}>
          <pointsMaterial size={0.035} color="#38bdf8" transparent opacity={0.8 * opacity} blending={THREE.AdditiveBlending} />
        </points>

        {/* Homologous pair A */}
        <group scale={0.78}>
          <Chromosome type="parent_a" position={[-0.38, 0, 0.1]} rotation={[0.1, 0.35, 0.15]} />
          <Chromosome type="parent_a" position={[0.38, 0, -0.1]} rotation={[-0.1, -0.35, -0.12]} />
        </group>
      </group>

      {/* Parent B (Right, Magenta) */}
      <group position={[2.8, 0, 0]}>
        {/* Label positioned neatly below sphere */}
        <Html position={[0, -1.9, 0]} center distanceFactor={14} className="pointer-events-none select-none">
          <div className="flex flex-col items-center whitespace-nowrap drop-shadow-[0_2px_12px_rgba(0,0,0,0.95)]">
            <div className="px-3 py-0.5 rounded-full bg-pink-950/90 border border-pink-400/50 text-pink-300 font-mono text-[11px] font-bold tracking-wider uppercase shadow-[0_0_12px_rgba(236,72,153,0.3)]">
              Parent B [2n = 46]
            </div>
            <div className="text-[9px] font-mono text-pink-400/80 mt-0.5">Paternal Diploid Line</div>
          </div>
        </Html>

        {/* Sphere envelope */}
        <mesh ref={sphereBRef}>
          <sphereGeometry args={[1.5, 32, 32]} />
          <meshStandardMaterial
            color="#ec4899"
            transparent
            opacity={0.08 * opacity}
            roughness={0.1}
            metalness={0.2}
            emissive="#be185d"
            emissiveIntensity={0.25 * opacity}
            depthWrite={false}
          />
        </mesh>

        {/* Outer glowing rim */}
        <mesh>
          <ringGeometry args={[1.48, 1.54, 64]} />
          <meshBasicMaterial color="#ec4899" transparent opacity={0.65 * opacity} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
        </mesh>

        {/* Nucleoplasm points */}
        <points geometry={particleGeoB}>
          <pointsMaterial size={0.035} color="#f472b6" transparent opacity={0.8 * opacity} blending={THREE.AdditiveBlending} />
        </points>

        {/* Homologous pair B */}
        <group scale={0.78}>
          <Chromosome type="parent_b" position={[-0.38, 0, 0.1]} rotation={[0.1, -0.35, 0.15]} />
          <Chromosome type="parent_b" position={[0.38, 0, -0.1]} rotation={[-0.1, 0.35, -0.12]} />
        </group>
      </group>
    </group>
  );
};
