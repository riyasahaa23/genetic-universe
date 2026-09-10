"use client";

import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { usePhenotypeInteraction } from "../interactions/PhenotypeInteractionContext";

interface EpistasisLayerProps {
  position?: [number, number, number];
}

export const EpistasisLayer: React.FC<EpistasisLayerProps> = ({ position = [0, -0.25, 0] }) => {
  const groupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const {
    activeMode,
    activeComponent,
    activeStage,
    selectedPair,
    setSelectedPair,
    hoveredLocus,
    setHoveredLocus,
    setSelectedLocus,
    setTooltip,
  } = usePhenotypeInteraction();

  const isFocused =
    activeComponent === "epistasis" ||
    activeStage === 4 ||
    (activeMode === "interaction" && activeComponent === "combined") ||
    selectedPair !== null;
  const isDimmed =
    activeMode === "genotype" ||
    (activeComponent !== "epistasis" && activeComponent !== "combined");

  useFrame((state, delta) => {
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * (isFocused ? 0.22 : 0.08);
    }
    if (groupRef.current) {
      const t = state.clock.getElapsedTime();
      groupRef.current.position.y = position[1] + Math.sin(t * 1.5) * 0.015;
      const targetScale = isFocused ? 1.08 : isDimmed ? 0.82 : 0.95;
      groupRef.current.scale.x = THREE.MathUtils.damp(groupRef.current.scale.x, targetScale, 4, delta);
      groupRef.current.scale.y = THREE.MathUtils.damp(groupRef.current.scale.y, targetScale, 4, delta);
      groupRef.current.scale.z = THREE.MathUtils.damp(groupRef.current.scale.z, targetScale, 4, delta);
    }
  });

  // Nodes in epistasis network
  const nodes = useMemo(() => {
    return [
      { x: -0.42, y: 0.12, z: 0.05, color: "#fbbf24", size: 0.075, label: "Locus A" },
      { x: 0.42, y: 0.12, z: -0.05, color: "#ec4899", size: 0.075, label: "Locus B" },
      { x: 0.0, y: 0.32, z: 0.0, color: "#fbbf24", size: 0.065, label: "Locus C" },
      { x: -0.28, y: -0.18, z: 0.02, color: "#38bdf8", size: 0.06, label: "Locus D" },
      { x: 0.28, y: -0.18, z: -0.02, color: "#fbbf24", size: 0.065, label: "Locus E" },
      { x: 0.0, y: -0.28, z: 0.0, color: "#ec4899", size: 0.055, label: "Locus F" },
    ];
  }, []);

  // Edges connecting nodes
  const edgePairs = useMemo(() => {
    return [
      [0, 1], // A <-> B (Primary candidate interaction)
      [0, 2],
      [1, 2],
      [0, 3],
      [1, 4],
      [3, 5],
      [4, 5],
      [2, 4],
    ];
  }, []);

  return (
    <group ref={groupRef} position={position}>
      {/* Outer Ring boundary */}
      <mesh
        ref={ringRef}
        rotation={[-Math.PI / 2.5, 0, 0]}
        onPointerOver={(e) => {
          e.stopPropagation();
          setTooltip({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            title: "Epistatic Network (Σ γ_uv (x_u × x_v))",
            subtitle: "Pairwise non-linear synergistic interactions",
            badge: "MODEL LAYER 3",
            badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/40",
            details: [
              { label: "Active pair", value: "Gene A ↔ Gene B (γ = +0.42)", color: "#fbbf24" },
              { label: "Synergy direction", value: "Synergistic positive excess", color: "#38bdf8" },
            ],
          });
        }}
        onPointerOut={() => setTooltip(null)}
      >
        <ringGeometry args={[0.75, 0.90, 48]} />
        <meshStandardMaterial
          color="#831843"
          emissive="#ec4899"
          emissiveIntensity={isFocused ? 2.0 : isDimmed ? 0.25 : 0.6}
          roughness={0.2}
          metalness={0.3}
          transparent
          opacity={isDimmed ? 0.25 : isFocused ? 0.9 : 0.6}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Network Edges */}
      {edgePairs.map(([fromIdx, toIdx], idx) => {
        const from = nodes[fromIdx];
        const to = nodes[toIdx];
        const isPrimary = fromIdx === 0 && toIdx === 1;

        const curve = new THREE.LineCurve3(
          new THREE.Vector3(from.x, from.y, from.z),
          new THREE.Vector3(to.x, to.y, to.z)
        );
        const geo = new THREE.TubeGeometry(curve, 10, isPrimary ? 0.018 : 0.01, 6, false);

        return (
          <mesh key={idx} geometry={geo}>
            <meshBasicMaterial
              color={isPrimary ? "#fbbf24" : "#ec4899"}
              transparent
              opacity={isPrimary ? 0.95 : 0.55}
            />
          </mesh>
        );
      })}

      {/* Network Nodes */}
      {nodes.map((n, idx) => (
        <group key={idx} position={[n.x, n.y, n.z]}>
          <mesh>
            <sphereGeometry args={[n.size, 16, 16]} />
            <meshStandardMaterial
              color={n.color}
              emissive={n.color}
              emissiveIntensity={isFocused ? 2.2 : 1.2}
            />
          </mesh>
          {/* Subtle outer glow halo */}
          <mesh>
            <sphereGeometry args={[n.size * 1.5, 12, 12]} />
            <meshBasicMaterial
              color={n.color}
              transparent
              opacity={0.3}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
};
