"use client";

import React, { useRef, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { usePhenotypeInteraction } from "../interactions/PhenotypeInteractionContext";

interface PhenotypeSphereProps {
  position?: [number, number, number];
}

export const PhenotypeSphere: React.FC<PhenotypeSphereProps> = ({ position = [0, -1.5, 0] }) => {
  const groupRef = useRef<THREE.Group>(null);
  const outerSphereRef = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const { activeMode, activeStage, contributions, setTooltip } = usePhenotypeInteraction();

  const isFocused = activeMode === "phenotype" || activeStage === 5;
  const isDimmed = activeMode === "genotype";

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();
    groupRef.current.position.y = position[1] + Math.sin(t * 1.2) * 0.02;

    const targetScale = isFocused ? 1.28 : isDimmed ? 0.75 : 0.95;
    groupRef.current.scale.x = THREE.MathUtils.damp(groupRef.current.scale.x, targetScale, 4, delta);
    groupRef.current.scale.y = THREE.MathUtils.damp(groupRef.current.scale.y, targetScale, 4, delta);
    groupRef.current.scale.z = THREE.MathUtils.damp(groupRef.current.scale.z, targetScale, 4, delta);

    if (outerSphereRef.current) {
      outerSphereRef.current.rotation.y += delta * (isFocused ? 0.35 : 0.15);
    }
    if (coreRef.current) {
      coreRef.current.rotation.y -= delta * (isFocused ? 0.45 : 0.2);
      const s = 1.0 + Math.sin(t * 3) * (isFocused ? 0.12 : 0.05);
      coreRef.current.scale.set(s, s, s);
    }
    if (lightRef.current) {
      lightRef.current.intensity = isFocused
        ? 3.2 + Math.sin(t * 4) * 0.6
        : isDimmed
        ? 0.8
        : 1.8;
    }
  });

  return (
    <group
      ref={groupRef}
      position={position}
      onPointerOver={(e) => {
        e.stopPropagation();
        setTooltip({
          visible: true,
          x: e.clientX,
          y: e.clientY,
          title: "Emergent Phenotype Sphere",
          subtitle: "Model-relative quantitative outcome",
          badge: contributions.isTransgressive ? "TRANSGRESSIVE NOVELTY" : "NON-LINEAR OUTCOME",
          badgeColor: contributions.isTransgressive
            ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
            : "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
          details: [
            { label: "Total score", value: `${contributions.total} model units`, color: "#fbbf24" },
            { label: "Parental envelope", value: `[${contributions.parentA.toFixed(2)}, +${contributions.parentB.toFixed(2)}]`, color: "#94a3b8" },
            { label: "Offspring phenotype", value: `${contributions.offspring > 0 ? "+" : ""}${contributions.offspring.toFixed(2)}`, color: "#fbbf24" },
            { label: "Transgressive", value: contributions.isTransgressive ? "Yes (outside parental envelope)" : "No", color: "#38bdf8" },
            { label: "Epistatic contribution", value: `+${contributions.epistasis.toFixed(2)} (${contributions.epistasisPct}%)`, color: "#ec4899" },
          ],
        });
      }}
      onPointerOut={() => setTooltip(null)}
    >
      {/* Radiant Point Light */}
      <pointLight ref={lightRef} color={contributions.isTransgressive ? "#fbbf24" : "#38bdf8"} intensity={2.0} distance={6} />

      {/* Outer Luminous Cellular Membrane */}
      <mesh ref={outerSphereRef}>
        <sphereGeometry args={[0.54, 36, 36]} />
        <meshStandardMaterial
          color={contributions.isTransgressive ? "#d97706" : "#0369a1"}
          emissive={contributions.isTransgressive ? "#fbbf24" : "#38bdf8"}
          emissiveIntensity={isFocused ? 1.4 : isDimmed ? 0.2 : 0.6}
          roughness={0.15}
          metalness={0.1}
          transparent
          opacity={isDimmed ? 0.2 : isFocused ? 0.6 : 0.4}
        />
      </mesh>

      {/* Outer Atmosphere Glow Ring */}
      <mesh rotation={[Math.PI / 4, 0, 0]}>
        <ringGeometry args={[0.52, 0.58, 44]} />
        <meshBasicMaterial
          color={contributions.isTransgressive ? "#fbbf24" : "#38bdf8"}
          transparent
          opacity={isFocused ? 0.9 : isDimmed ? 0.2 : 0.5}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Transgressive Restrained Gold Halo Ring */}
      {contributions.isTransgressive && isFocused && (
        <mesh rotation={[-Math.PI / 3, 0, 0]}>
          <ringGeometry args={[0.62, 0.67, 48]} />
          <meshBasicMaterial color="#fbbf24" transparent opacity={0.75} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Internal Sparkling Core (Multicolor mosaic) */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[0.32, 24, 24]} />
        <meshStandardMaterial
          color="#be185d"
          emissive={contributions.isTransgressive ? "#fbbf24" : "#f472b6"}
          emissiveIntensity={isFocused ? 1.6 : isDimmed ? 0.3 : 1.0}
          roughness={0.2}
          metalness={0.3}
          wireframe
        />
      </mesh>
    </group>
  );
};
