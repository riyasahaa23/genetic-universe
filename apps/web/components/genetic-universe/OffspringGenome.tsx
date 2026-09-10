"use client";

import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { Chromosome } from "./Chromosome";
import { useInteraction } from "./context/InteractionContext";

interface OffspringGenomeProps {
  position: [number, number, number];
}

export const OffspringGenome: React.FC<OffspringGenomeProps> = ({ position }) => {
  const {
    hoveredChromosome,
    setHoveredChromosome,
    hoveredLocus,
    hoveredCandidate,
  } = useInteraction();

  const groupRef = useRef<THREE.Group>(null);
  const ring1Ref = useRef<THREE.Group>(null);
  const ring2Ref = useRef<THREE.Group>(null);
  const ring3Ref = useRef<THREE.Group>(null);
  const nodesRef = useRef<THREE.Group>(null);

  const isHighlighted =
    hoveredChromosome === "offspring" ||
    hoveredLocus !== null ||
    hoveredCandidate !== null;

  // Concentric orbital rings geometries
  const ring1Geo = useMemo(() => new THREE.TorusGeometry(1.95, 0.012, 16, 80), []);
  const ring2Geo = useMemo(() => new THREE.TorusGeometry(2.15, 0.01, 16, 80), []);
  const ring3Geo = useMemo(() => new THREE.TorusGeometry(2.35, 0.008, 16, 80), []);

  // Floating locus nodes on the orbital rings
  const nodeBeads = useMemo(() => {
    return [
      { angle: 0.5, r: 1.95, color: "#38bdf8" },
      { angle: 1.9, r: 1.95, color: "#fbbf24" },
      { angle: 3.3, r: 2.15, color: "#ec4899" },
      { angle: 4.6, r: 2.15, color: "#fbbf24" },
      { angle: 5.7, r: 2.35, color: "#38bdf8" },
    ];
  }, []);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();

    // Gentle breathing
    groupRef.current.position.y = position[1] + Math.sin(t * 0.7) * 0.035;
    groupRef.current.rotation.y += delta * 0.08;

    // Orbiting provenance rings rotation
    if (ring1Ref.current) ring1Ref.current.rotation.z += delta * 0.12;
    if (ring2Ref.current) ring2Ref.current.rotation.z -= delta * 0.09;
    if (ring3Ref.current) ring3Ref.current.rotation.z += delta * 0.06;
    if (nodesRef.current) nodesRef.current.rotation.z += delta * 0.12;
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Translucent Glassy Bubble Interior */}
      <mesh
        onPointerOver={(e) => {
          e.stopPropagation();
          setHoveredChromosome("offspring");
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHoveredChromosome(null);
        }}
      >
        <sphereGeometry args={[1.72, 36, 36]} />
        <meshStandardMaterial
          color="#00f0ff"
          transparent
          opacity={0.06}
          roughness={0.05}
          metalness={0.1}
          emissive={isHighlighted ? "#fbbf24" : "#0284c7"}
          emissiveIntensity={isHighlighted ? 0.35 : 0.15}
          depthWrite={false}
        />
      </mesh>

      {/* Luminous Sharp Rim Glow Ring (facing camera) - Cyan */}
      <mesh position={[0, 0, 0]}>
        <ringGeometry args={[1.70, 1.75, 90]} />
        <meshBasicMaterial
          color="#00f0ff"
          transparent
          opacity={isHighlighted ? 0.95 : 0.75}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Secondary Warm Golden Rim Ring */}
      <mesh position={[0, 0, -0.02]}>
        <ringGeometry args={[1.67, 1.78, 90]} />
        <meshBasicMaterial
          color="#fbbf24"
          transparent
          opacity={isHighlighted ? 0.55 : 0.3}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Orbital Provenance Ring 1 */}
      <group ref={ring1Ref} rotation={[Math.PI / 3.4, 0.2, 0]}>
        <mesh geometry={ring1Geo}>
          <meshBasicMaterial color="#38bdf8" transparent opacity={0.65} />
        </mesh>
      </group>

      {/* Orbital Provenance Ring 2 */}
      <group ref={ring2Ref} rotation={[-Math.PI / 3.8, 0.3, 0]}>
        <mesh geometry={ring2Geo}>
          <meshBasicMaterial color="#ec4899" transparent opacity={0.55} />
        </mesh>
      </group>

      {/* Orbital Provenance Ring 3 */}
      <group ref={ring3Ref} rotation={[0.15, 0, -0.2]}>
        <mesh geometry={ring3Geo}>
          <meshBasicMaterial color="#fbbf24" transparent opacity={0.4} />
        </mesh>
      </group>

      {/* Orbiting Locus Nodes */}
      <group ref={nodesRef} rotation={[Math.PI / 3.4, 0.2, 0]}>
        {nodeBeads.map((bead, i) => (
          <mesh
            key={i}
            position={[
              bead.r * Math.cos(bead.angle),
              bead.r * Math.sin(bead.angle),
              0,
            ]}
          >
            <sphereGeometry args={[0.055, 12, 12]} />
            <meshStandardMaterial
              color={bead.color}
              emissive={bead.color}
              emissiveIntensity={1.4}
            />
          </mesh>
        ))}
      </group>

      {/* Center Radiance Point Lights */}
      <pointLight color="#fbbf24" intensity={isHighlighted ? 2.2 : 1.2} distance={5} />
      <pointLight color="#00f0ff" intensity={1.4} distance={5} />

      {/* Inside: 3D Mosaic Chromosomes perfectly enclosed within the sphere */}
      <group scale={0.7} position={[0, 0, 0]}>
        {/* Recombinant Chromosome 1 */}
        <Chromosome
          type="offspring"
          position={[-0.32, 0.05, 0.08]}
          rotation={[0.15, 0.35, 0.12]}
          scale={0.9}
          isHovered={isHighlighted}
          highlightLocus={hoveredLocus}
        />

        {/* Recombinant Chromosome 2 */}
        <Chromosome
          type="offspring"
          position={[0.32, -0.05, -0.08]}
          rotation={[-0.12, -0.4, -0.15]}
          scale={0.88}
          isHovered={isHighlighted}
          highlightLocus={hoveredLocus}
        />
      </group>

      {/* Floating HTML Label below sphere */}
      <Html
        position={[0, -1.95, 0]}
        center
        distanceFactor={14}
        className="pointer-events-none select-none"
      >
        <div className="flex flex-col items-center text-center whitespace-nowrap drop-shadow-[0_2px_12px_rgba(0,0,0,0.95)]">
          <div className="text-[14px] font-bold tracking-wide text-white flex items-center gap-1.5 glow-gold-text">
            Offspring Genome
          </div>
          <div className="text-[8.5px] font-mono tracking-[0.25em] text-amber-300/90 uppercase mt-0.5">
            A NEW GENETIC UNIVERSE
          </div>
        </div>
      </Html>
    </group>
  );
};
