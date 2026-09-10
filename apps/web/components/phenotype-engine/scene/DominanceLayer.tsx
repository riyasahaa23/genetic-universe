"use client";

import React, { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { usePhenotypeInteraction } from "../interactions/PhenotypeInteractionContext";

interface DominanceLayerProps {
  position?: [number, number, number];
}

export const DominanceLayer: React.FC<DominanceLayerProps> = ({ position = [0, 0.35, 0] }) => {
  const groupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const {
    activeMode,
    activeComponent,
    activeStage,
    setSelectedLocus,
    setTooltip,
  } = usePhenotypeInteraction();

  const isFocused =
    activeComponent === "dominance" ||
    activeStage === 3 ||
    (activeMode === "interaction" && activeComponent === "combined");
  const isDimmed =
    activeMode === "genotype" ||
    (activeComponent !== "dominance" && activeComponent !== "combined");

  useFrame((_, delta) => {
    if (ringRef.current) {
      ringRef.current.rotation.z -= delta * (isFocused ? 0.16 : 0.06);
    }
    if (groupRef.current) {
      const targetScale = isFocused ? 1.05 : isDimmed ? 0.85 : 0.95;
      groupRef.current.scale.x = THREE.MathUtils.damp(groupRef.current.scale.x, targetScale, 4, delta);
      groupRef.current.scale.y = THREE.MathUtils.damp(groupRef.current.scale.y, targetScale, 4, delta);
      groupRef.current.scale.z = THREE.MathUtils.damp(groupRef.current.scale.z, targetScale, 4, delta);
    }
  });

  // 6 paired dominance nodes along the ring
  const nodeCount = 6;
  const radius = 1.05;
  const nodes = Array.from({ length: nodeCount }).map((_, i) => {
    const angle = (i / nodeCount) * Math.PI * 2;
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * (radius * 0.38),
      id: i,
    };
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Elliptical Computational Ring */}
      <mesh
        ref={ringRef}
        rotation={[-Math.PI / 2.5, 0, 0]}
        onPointerOver={(e) => {
          e.stopPropagation();
          setTooltip({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            title: "Dominance Layer (Σ β_j · d_j)",
            subtitle: "Intra-locus allelic non-additivity",
            badge: "MODEL LAYER 2",
            badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/40",
            details: [
              { label: "Heterozygous loci", value: "3 state pairs", color: "#c084fc" },
              { label: "Net dominance shift", value: "+0.32 model units", color: "#fbbf24" },
            ],
          });
        }}
        onPointerOut={() => setTooltip(null)}
      >
        <ringGeometry args={[0.95, 1.15, 48]} />
        <meshStandardMaterial
          color="#6b21a8"
          emissive="#a855f7"
          emissiveIntensity={isFocused ? 1.8 : isDimmed ? 0.25 : 0.6}
          roughness={0.2}
          metalness={0.3}
          transparent
          opacity={isDimmed ? 0.25 : isFocused ? 0.9 : 0.6}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Grid Mesh disc */}
      <mesh rotation={[-Math.PI / 2.5, 0, 0]}>
        <ringGeometry args={[0.08, 0.95, 32]} />
        <meshBasicMaterial
          color="#581c87"
          wireframe
          transparent
          opacity={isFocused ? 0.35 : 0.15}
        />
      </mesh>

      {/* Dominance Allele Pair Nodes */}
      {nodes.map((n) => (
        <group key={n.id} position={[n.x, n.y, 0]}>
          <mesh>
            <sphereGeometry args={[0.055, 16, 16]} />
            <meshStandardMaterial
              color="#c084fc"
              emissive="#a855f7"
              emissiveIntensity={isFocused ? 2.0 : 1.0}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
};
