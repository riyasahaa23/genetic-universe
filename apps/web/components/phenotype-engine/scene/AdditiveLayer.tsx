"use client";

import React, { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { usePhenotypeInteraction } from "../interactions/PhenotypeInteractionContext";

interface AdditiveLayerProps {
  position?: [number, number, number];
}

export const AdditiveLayer: React.FC<AdditiveLayerProps> = ({ position = [0, 0.95, 0] }) => {
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
    activeComponent === "additive" ||
    activeStage === 2 ||
    (activeMode === "interaction" && activeComponent === "combined");
  const isDimmed =
    activeMode === "genotype" ||
    (activeComponent !== "additive" && activeComponent !== "combined");

  useFrame((_, delta) => {
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * (isFocused ? 0.2 : 0.08);
    }
    if (groupRef.current) {
      const targetScale = isFocused ? 1.05 : isDimmed ? 0.85 : 0.95;
      groupRef.current.scale.x = THREE.MathUtils.damp(groupRef.current.scale.x, targetScale, 4, delta);
      groupRef.current.scale.y = THREE.MathUtils.damp(groupRef.current.scale.y, targetScale, 4, delta);
      groupRef.current.scale.z = THREE.MathUtils.damp(groupRef.current.scale.z, targetScale, 4, delta);
    }
  });

  // 8 nodes distributed along the ring
  const nodeCount = 8;
  const radius = 1.35;
  const nodes = Array.from({ length: nodeCount }).map((_, i) => {
    const angle = (i / nodeCount) * Math.PI * 2;
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * (radius * 0.38), // elliptical perspective
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
            title: "Additive Effects Layer (Σ α_i · x_i)",
            subtitle: "Main linear genetic variant contributions",
            badge: "MODEL LAYER 1",
            badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
            details: [
              { label: "Active loci", value: "8 evaluated variants", color: "#38bdf8" },
              { label: "Linear sum", value: "+0.86 model units", color: "#fbbf24" },
            ],
          });
        }}
        onPointerOut={() => setTooltip(null)}
      >
        <ringGeometry args={[1.25, 1.45, 48]} />
        <meshStandardMaterial
          color="#0284c7"
          emissive="#00f0ff"
          emissiveIntensity={isFocused ? 1.8 : isDimmed ? 0.3 : 0.6}
          roughness={0.2}
          metalness={0.3}
          transparent
          opacity={isDimmed ? 0.25 : isFocused ? 0.9 : 0.6}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Grid Mesh disc inside */}
      <mesh rotation={[-Math.PI / 2.5, 0, 0]}>
        <ringGeometry args={[0.1, 1.25, 32]} />
        <meshBasicMaterial
          color="#0369a1"
          wireframe
          transparent
          opacity={isFocused ? 0.35 : 0.15}
        />
      </mesh>

      {/* Locus Nodes along the ring */}
      {nodes.map((n) => (
        <group key={n.id} position={[n.x, n.y, 0]}>
          <mesh>
            <sphereGeometry args={[0.06, 16, 16]} />
            <meshStandardMaterial
              color="#38bdf8"
              emissive="#00f0ff"
              emissiveIntensity={isFocused ? 2.0 : 1.0}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
};
