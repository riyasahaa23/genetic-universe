"use client";

import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useMeiosisInteraction } from "../interactions/MeiosisInteractionContext";

interface HaploidGametes3DProps {
  position?: [number, number, number];
}

export const HaploidGametes3D: React.FC<HaploidGametes3DProps> = ({ position = [0, -1.8, 0] }) => {
  const groupRef = useRef<THREE.Group>(null);
  const {
    activeStage,
    activePhase,
    hoveredElement,
    setHoveredElement,
    selectedGamete,
    setSelectedGamete,
    selectedHomolog,
    compareGametes,
    setTooltip,
  } = useMeiosisInteraction();

  const isStageHighlighted = activeStage === 5 || activePhase === 3;

  const gametes = [
    {
      id: "gamete_1" as const,
      x: -1.2,
      name: "Gamete 1",
      desc: "Mostly maternal (98.4%)",
      badge: "HAPLOID PRODUCT 1",
      badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
      bubbleColor: "#0284c7",
      emissive: "#00f0ff",
      chromColor: "#00f0ff",
      isRecomb: false,
      details: [
        { label: "Maternal Genome", value: "98.4%", color: "#38bdf8" },
        { label: "Ploidy", value: "1n (23 chromosomes)", color: "#94a3b8" },
        { label: "Transmission", value: "Conserved parental haplotype", color: "#38bdf8" },
      ],
    },
    {
      id: "gamete_2" as const,
      x: -0.4,
      name: "Gamete 2",
      desc: "Recombinant (62.5% Mat / 37.5% Pat)",
      badge: "HAPLOID PRODUCT 2",
      badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/40",
      bubbleColor: "#4f46e5",
      emissive: "#818cf8",
      chromColor: "#818cf8",
      isRecomb: true,
      recType: 1,
      details: [
        { label: "Maternal / Paternal", value: "62.5% / 37.5%", color: "#fbbf24" },
        { label: "Ploidy", value: "1n (23 chromosomes)", color: "#94a3b8" },
        { label: "Transmission", value: "Trans-generational recombinant mosaic", color: "#fbbf24" },
      ],
    },
    {
      id: "gamete_3" as const,
      x: 0.4,
      name: "Gamete 3",
      desc: "Recombinant (37.5% Mat / 62.5% Pat)",
      badge: "HAPLOID PRODUCT 3",
      badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/40",
      bubbleColor: "#9333ea",
      emissive: "#c084fc",
      chromColor: "#c084fc",
      isRecomb: true,
      recType: 2,
      details: [
        { label: "Maternal / Paternal", value: "37.5% / 62.5%", color: "#fbbf24" },
        { label: "Ploidy", value: "1n (23 chromosomes)", color: "#94a3b8" },
        { label: "Transmission", value: "Reciprocal recombinant mosaic", color: "#fbbf24" },
      ],
    },
    {
      id: "gamete_4" as const,
      x: 1.2,
      name: "Gamete 4",
      desc: "Mostly paternal (98.8%)",
      badge: "HAPLOID PRODUCT 4",
      badgeColor: "bg-pink-500/20 text-pink-300 border-pink-500/40",
      bubbleColor: "#be185d",
      emissive: "#ec4899",
      chromColor: "#ec4899",
      isRecomb: false,
      details: [
        { label: "Paternal Genome", value: "98.8%", color: "#ec4899" },
        { label: "Ploidy", value: "1n (23 chromosomes)", color: "#94a3b8" },
        { label: "Transmission", value: "Conserved parental haplotype", color: "#ec4899" },
      ],
    },
  ];

  // Miniature chromatid geometry
  const miniChromGeo = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.22, 0),
      new THREE.Vector3(-0.02, 0.1, 0.01),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.02, -0.1, -0.01),
      new THREE.Vector3(0, -0.22, 0),
    ]);
    return new THREE.TubeGeometry(curve, 20, 0.038, 8, false);
  }, []);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();
    const yBase = compareGametes ? position[1] + 0.35 : position[1];
    groupRef.current.position.y = yBase + Math.sin(t * 1.1) * 0.02;
  });

  return (
    <group ref={groupRef} position={position}>
      {gametes.map((g) => {
        const isDirectlySelected = selectedGamete === g.id || hoveredElement === g.id;
        const isHomologLinked =
          (selectedHomolog === "maternal" && (g.id === "gamete_1" || g.id === "gamete_2")) ||
          (selectedHomolog === "paternal" && (g.id === "gamete_3" || g.id === "gamete_4"));
        const isSelected = isDirectlySelected || isHomologLinked;

        const scaleVal = isDirectlySelected ? 1.3 : compareGametes ? 1.15 : isHomologLinked ? 1.12 : 1.0;

        return (
          <group
            key={g.id}
            position={[g.x, 0, 0]}
            scale={[scaleVal, scaleVal, scaleVal]}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedGamete(selectedGamete === g.id ? null : g.id);
            }}
            onPointerOver={(e) => {
              e.stopPropagation();
              setHoveredElement(g.id);
              setTooltip({
                visible: true,
                x: e.clientX,
                y: e.clientY,
                title: g.name,
                subtitle: g.desc,
                badge: g.badge,
                badgeColor: g.badgeColor,
                details: g.details,
              });
            }}
            onPointerOut={() => {
              setHoveredElement(null);
              setTooltip(null);
            }}
          >
            {/* Cellular Membrane Sphere */}
            <mesh>
              <sphereGeometry args={[0.36, 28, 28]} />
              <meshStandardMaterial
                color={g.bubbleColor}
                emissive={g.emissive}
                emissiveIntensity={isSelected ? 1.6 : isStageHighlighted ? 0.8 : 0.4}
                roughness={0.2}
                metalness={0.15}
                transparent
                opacity={isSelected ? 0.55 : 0.36}
              />
            </mesh>

            {/* Glowing Membrane Rim Ring */}
            <mesh rotation={[Math.PI / 4, 0, 0]}>
              <ringGeometry args={[0.33, 0.35, 32]} />
              <meshBasicMaterial
                color={g.emissive}
                transparent
                opacity={isSelected ? 0.95 : 0.5}
                side={THREE.DoubleSide}
              />
            </mesh>

            {/* Chromatid inside */}
            <mesh geometry={miniChromGeo}>
              <meshStandardMaterial
                color={g.chromColor}
                emissive={g.emissive}
                emissiveIntensity={isSelected ? 1.5 : 0.8}
                roughness={0.25}
                metalness={0.2}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};
