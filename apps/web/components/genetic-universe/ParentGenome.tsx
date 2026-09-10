"use client";

import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { Chromosome } from "./Chromosome";
import { useInteraction } from "./context/InteractionContext";

interface ParentGenomeProps {
  parentId: "A" | "B";
  position: [number, number, number];
}

export const ParentGenome: React.FC<ParentGenomeProps> = ({ parentId, position }) => {
  const {
    hoveredChromosome,
    setHoveredChromosome,
    hoveredTrack,
  } = useInteraction();

  const groupRef = useRef<THREE.Group>(null);
  const sphereRef = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Points>(null);

  const isParentA = parentId === "A";
  const isHovered =
    hoveredChromosome === (isParentA ? "parent_a" : "parent_b") ||
    hoveredTrack === (isParentA ? "parent_a" : "parent_b");

  const primaryColor = isParentA ? "#00f0ff" : "#ec4899";
  const glowColor = isParentA ? "#38bdf8" : "#f472b6";

  // Fine nucleoplasm particles
  const particleCount = 70;
  const particleGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = Math.cbrt(Math.random()) * 1.35;
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geo;
  }, []);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();

    // Gentle floating oscillation
    groupRef.current.position.y = position[1] + Math.sin(t * 0.8 + (isParentA ? 0 : Math.PI)) * 0.04;
    groupRef.current.rotation.y += delta * (isParentA ? 0.06 : -0.05);

    if (particlesRef.current) {
      particlesRef.current.rotation.y += delta * 0.04;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Floating HTML Header Label directly above sphere */}
      <Html
        position={[0, 1.95, 0]}
        center
        distanceFactor={14}
        className="pointer-events-none select-none"
      >
        <div className="flex flex-col items-center text-center whitespace-nowrap drop-shadow-[0_2px_10px_rgba(0,0,0,0.95)]">
          <div
            className={`text-[13px] font-semibold tracking-wide flex items-center gap-1.5 ${
              isParentA ? "text-cyan-300 glow-cyan-text" : "text-pink-300 glow-magenta-text"
            }`}
          >
            Parent {parentId}
          </div>
          <div className="text-[10px] font-medium text-slate-200">
            Genomic Universe
          </div>
          <div className="text-[8.5px] font-mono text-slate-400 tracking-wider uppercase">
            23 chromosome pairs
          </div>
        </div>
      </Html>

      {/* Translucent Glassy Bubble Sphere Interior */}
      <mesh
        ref={sphereRef}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHoveredChromosome(isParentA ? "parent_a" : "parent_b");
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHoveredChromosome(null);
        }}
      >
        <sphereGeometry args={[1.52, 36, 36]} />
        <meshStandardMaterial
          color={primaryColor}
          transparent
          opacity={0.06}
          roughness={0.05}
          metalness={0.1}
          emissive={glowColor}
          emissiveIntensity={isHovered ? 0.35 : 0.12}
          depthWrite={false}
        />
      </mesh>

      {/* Luminous Sharp Rim Glow Ring (facing camera) */}
      <mesh position={[0, 0, 0]}>
        <ringGeometry args={[1.50, 1.54, 80]} />
        <meshBasicMaterial
          color={primaryColor}
          transparent
          opacity={isHovered ? 0.95 : 0.75}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Soft Outer Halo Ring */}
      <mesh position={[0, 0, -0.05]}>
        <ringGeometry args={[1.47, 1.62, 80]} />
        <meshBasicMaterial
          color={primaryColor}
          transparent
          opacity={isHovered ? 0.45 : 0.25}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Nucleoplasm Floating Particles */}
      <points ref={particlesRef} geometry={particleGeo}>
        <pointsMaterial
          size={0.04}
          color={isParentA ? "#38bdf8" : "#f472b6"}
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Inside: Paired 3D Chromosomes with organic curvature */}
      <group scale={0.76}>
        {/* Homolog 1 */}
        <Chromosome
          type={isParentA ? "parent_a" : "parent_b"}
          position={[-0.38, 0, 0.1]}
          rotation={[0.1, isParentA ? 0.35 : -0.35, 0.15]}
          scale={0.92}
          isHovered={isHovered}
        />

        {/* Homolog 2 (Paired sister) */}
        <Chromosome
          type={isParentA ? "parent_a" : "parent_b"}
          position={[0.38, 0, -0.1]}
          rotation={[-0.1, isParentA ? -0.35 : 0.35, -0.12]}
          scale={0.9}
          isHovered={isHovered}
        />
      </group>
    </group>
  );
};
