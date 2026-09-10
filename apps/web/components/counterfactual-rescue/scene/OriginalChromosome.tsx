"use client";

import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useCounterfactual } from "../interactions/CounterfactualInteractionContext";

interface OriginalChromosomeProps {
  position: [number, number, number];
  scale?: number;
}

export const OriginalChromosome: React.FC<OriginalChromosomeProps> = ({
  position,
  scale = 1.3,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const locusRef = useRef<THREE.Mesh>(null);
  const locusRingRef = useRef<THREE.Mesh>(null);
  const { selectedCandidate, showTooltip, hideTooltip } = useCounterfactual();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.position.y = position[1] + Math.sin(t * 1.2) * 0.04;
      groupRef.current.rotation.y = Math.sin(t * 0.5) * 0.12;
      groupRef.current.rotation.z = Math.cos(t * 0.4) * 0.04;
    }
    if (locusRingRef.current) {
      locusRingRef.current.rotation.z = t * 1.5;
      const s = 1 + Math.sin(t * 3.5) * 0.2;
      locusRingRef.current.scale.set(s, s, s);
    }
  });

  return (
    <group
      ref={groupRef}
      position={position}
      scale={[scale, scale, scale]}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = "pointer";
        showTooltip({
          x: e.clientX,
          y: e.clientY,
          title: "Original Configuration",
          subtitle: "Parental crossover chromosome harboring novelty driver",
          badge: "ORIGINAL CONFIGURATION",
          badgeColor: "bg-pink-950/70 text-pink-300 border-pink-500/40",
          details: [
            { label: "Target locus", value: `${selectedCandidate.target}: ${selectedCandidate.locusMb} Mb`, color: "#f6c85f" },
            { label: "Observed allele", value: `${selectedCandidate.originalAllele} (inherited)`, color: "#f472b6" },
            { label: "Predicted phenotype", value: "+2.1 (Outside parental range)", color: "#f6c85f" },
          ],
        });
      }}
      onPointerOut={() => {
        document.body.style.cursor = "default";
        hideTooltip();
      }}
    >
      {/* Centromere Core */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.18, 24, 24]} />
        <meshStandardMaterial
          color="#090d16"
          roughness={0.2}
          metalness={0.9}
        />
      </mesh>

      {/* Arm 1: Top-Left (Parent A origin - Cyan dominant) */}
      <group position={[-0.26, 0.48, 0]} rotation={[0, 0, 0.26]}>
        <mesh position={[0, 0, 0]}>
          <capsuleGeometry args={[0.135, 0.72, 16, 24]} />
          <meshStandardMaterial
            color="#0284c7"
            emissive="#0369a1"
            emissiveIntensity={0.65}
            roughness={0.2}
            metalness={0.6}
          />
        </mesh>
        {/* Bands */}
        <mesh position={[0, 0.18, 0.01]}>
          <cylinderGeometry args={[0.14, 0.14, 0.1, 24]} />
          <meshBasicMaterial color="#38bdf8" />
        </mesh>
        <mesh position={[0, -0.15, 0.01]}>
          <cylinderGeometry args={[0.14, 0.14, 0.07, 24]} />
          <meshBasicMaterial color="#7dd3fc" />
        </mesh>
      </group>

      {/* Arm 2: Bottom-Left (Parent A origin - Cyan dominant) */}
      <group position={[-0.26, -0.48, 0]} rotation={[0, 0, -0.26]}>
        <mesh position={[0, 0, 0]}>
          <capsuleGeometry args={[0.135, 0.72, 16, 24]} />
          <meshStandardMaterial
            color="#0284c7"
            emissive="#0369a1"
            emissiveIntensity={0.65}
            roughness={0.2}
            metalness={0.6}
          />
        </mesh>
        {/* Bands */}
        <mesh position={[0, -0.18, 0.01]}>
          <cylinderGeometry args={[0.14, 0.14, 0.1, 24]} />
          <meshBasicMaterial color="#38bdf8" />
        </mesh>
        <mesh position={[0, 0.15, 0.01]}>
          <cylinderGeometry args={[0.14, 0.14, 0.07, 24]} />
          <meshBasicMaterial color="#7dd3fc" />
        </mesh>
      </group>

      {/* Arm 3: Top-Right (Parent B origin - Magenta dominant) */}
      <group position={[0.26, 0.48, 0]} rotation={[0, 0, -0.26]}>
        <mesh position={[0, 0, 0]}>
          <capsuleGeometry args={[0.135, 0.72, 16, 24]} />
          <meshStandardMaterial
            color="#be185d"
            emissive="#9d174d"
            emissiveIntensity={0.7}
            roughness={0.2}
            metalness={0.6}
          />
        </mesh>
        {/* Bands */}
        <mesh position={[0, 0.18, 0.01]}>
          <cylinderGeometry args={[0.14, 0.14, 0.1, 24]} />
          <meshBasicMaterial color="#f472b6" />
        </mesh>
        <mesh position={[0, -0.15, 0.01]}>
          <cylinderGeometry args={[0.14, 0.14, 0.07, 24]} />
          <meshBasicMaterial color="#fb7185" />
        </mesh>

        {/* TARGET LOCUS PIN (Gold Marker at 72.4 Mb) */}
        <group position={[0.16, 0.18, 0.1]}>
          <mesh ref={locusRef}>
            <sphereGeometry args={[0.085, 16, 16]} />
            <meshStandardMaterial
              color="#f6c85f"
              emissive="#f59e0b"
              emissiveIntensity={2.2}
              roughness={0.1}
            />
          </mesh>
          <mesh ref={locusRingRef} rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.1, 0.15, 24]} />
            <meshBasicMaterial
              color="#f6c85f"
              side={THREE.DoubleSide}
              transparent
              opacity={0.9}
            />
          </mesh>
        </group>
      </group>

      {/* Arm 4: Bottom-Right (Parent B origin - Magenta dominant) */}
      <group position={[0.26, -0.48, 0]} rotation={[0, 0, 0.26]}>
        <mesh position={[0, 0, 0]}>
          <capsuleGeometry args={[0.135, 0.72, 16, 24]} />
          <meshStandardMaterial
            color="#be185d"
            emissive="#9d174d"
            emissiveIntensity={0.7}
            roughness={0.2}
            metalness={0.6}
          />
        </mesh>
        {/* Bands */}
        <mesh position={[0, -0.18, 0.01]}>
          <cylinderGeometry args={[0.14, 0.14, 0.1, 24]} />
          <meshBasicMaterial color="#f472b6" />
        </mesh>
      </group>

      {/* Floating Base Glow / Pedestal Ring */}
      <mesh position={[0, -1.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.45, 0.7, 32]} />
        <meshBasicMaterial
          color="#f472b6"
          transparent
          opacity={0.35}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
};
