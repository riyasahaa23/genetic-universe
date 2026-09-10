"use client";

import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { usePhenotypeInteraction } from "../interactions/PhenotypeInteractionContext";

interface GenotypeInputProps {
  position?: [number, number, number];
}

// Organic 3D X-Chromosome
const XChromosome: React.FC<{
  type: "cyan" | "rec1" | "rec2" | "magenta";
  isFocused: boolean;
}> = ({ type, isFocused }) => {
  const groupRef = useRef<THREE.Group>(null);

  const { leftGeo, rightGeo, centromereCol } = useMemo(() => {
    const leftCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.25, 0.65, 0.04),
      new THREE.Vector3(-0.16, 0.3, -0.02),
      new THREE.Vector3(-0.03, 0.0, 0.0),
      new THREE.Vector3(-0.16, -0.3, 0.02),
      new THREE.Vector3(-0.25, -0.65, -0.04),
    ]);

    const rightCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.25, 0.65, -0.04),
      new THREE.Vector3(0.16, 0.3, 0.02),
      new THREE.Vector3(0.03, 0.0, 0.0),
      new THREE.Vector3(0.16, -0.3, -0.02),
      new THREE.Vector3(0.25, -0.65, 0.04),
    ]);

    const lGeo = new THREE.TubeGeometry(leftCurve, 32, 0.075, 12, false);
    const rGeo = new THREE.TubeGeometry(rightCurve, 32, 0.075, 12, false);

    // Apply recombinant vertex colors
    if (type === "rec1" || type === "rec2") {
      const applyColors = (geo: THREE.TubeGeometry, isRec1: boolean) => {
        const count = geo.attributes.position.count;
        const colors = new Float32Array(count * 3);
        const pos = geo.attributes.position;
        const cyan = new THREE.Color("#00f0ff");
        const pink = new THREE.Color("#ec4899");
        const gold = new THREE.Color("#fbbf24");

        for (let i = 0; i < count; i++) {
          const y = pos.getY(i);
          let col = isRec1 ? cyan : pink;
          if (y > -0.05 && y < 0.05) col = gold;
          else if (y <= -0.15) col = isRec1 ? pink : cyan;

          colors[i * 3] = col.r;
          colors[i * 3 + 1] = col.g;
          colors[i * 3 + 2] = col.b;
        }
        geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
      };

      applyColors(lGeo, type === "rec1");
      applyColors(rGeo, type === "rec1");
    }

    const centCol =
      type === "cyan"
        ? "#38bdf8"
        : type === "magenta"
        ? "#f472b6"
        : "#fbbf24";

    return { leftGeo: lGeo, rightGeo: rGeo, centromereCol: centCol };
  }, [type]);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.2;
    }
  });

  const baseCol = type === "cyan" ? "#00f0ff" : type === "magenta" ? "#ec4899" : "#ffffff";
  const emissiveCol = type === "cyan" ? "#0284c7" : type === "magenta" ? "#be185d" : "#0284c7";

  return (
    <group ref={groupRef} scale={0.75}>
      <mesh geometry={leftGeo}>
        <meshStandardMaterial
          vertexColors={type === "rec1" || type === "rec2"}
          color={baseCol}
          emissive={emissiveCol}
          emissiveIntensity={isFocused ? 1.4 : 0.8}
          roughness={0.2}
          metalness={0.25}
        />
      </mesh>
      <mesh geometry={rightGeo}>
        <meshStandardMaterial
          vertexColors={type === "rec1" || type === "rec2"}
          color={baseCol}
          emissive={emissiveCol}
          emissiveIntensity={isFocused ? 1.4 : 0.8}
          roughness={0.2}
          metalness={0.25}
        />
      </mesh>
      {/* Centromere */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.075, 16, 16]} />
        <meshStandardMaterial color="#ffffff" emissive={centromereCol} emissiveIntensity={1.3} />
      </mesh>
    </group>
  );
};

export const GenotypeInput: React.FC<GenotypeInputProps> = ({ position = [0, 2.15, 0] }) => {
  const groupRef = useRef<THREE.Group>(null);
  const {
    activeMode,
    selectedLocus,
    setSelectedLocus,
    hoveredLocus,
    setHoveredLocus,
    isExplorationMode,
    setTooltip,
  } = usePhenotypeInteraction();
  const isFocused = activeMode === "genotype";

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();
    groupRef.current.position.y = position[1] + Math.sin(t * 1.2) * 0.02;

    const targetScale = isFocused ? 1.05 : 0.85;
    groupRef.current.scale.x = THREE.MathUtils.damp(groupRef.current.scale.x, targetScale, 4, delta);
    groupRef.current.scale.y = THREE.MathUtils.damp(groupRef.current.scale.y, targetScale, 4, delta);
    groupRef.current.scale.z = THREE.MathUtils.damp(groupRef.current.scale.z, targetScale, 4, delta);
  });

  const locusMarkers = [
    { name: "Gene A", x: -0.3, y: 0.32, z: 0.12, color: "#38bdf8", parent: "Parent A (Maternal)", state: "Dosage 1.6 (Recombinant)", coeff: "+0.48" },
    { name: "Gene B", x: 0.3, y: -0.28, z: 0.12, color: "#ec4899", parent: "Parent B (Paternal)", state: "Dosage 0.8 (Intact Homolog)", coeff: "+0.38" },
    { name: "Gene C", x: -0.9, y: 0.15, z: 0.1, color: "#a855f7", parent: "Parent A (Maternal)", state: "Heterozygous (d=1)", coeff: "+0.25" },
    { name: "Gene D", x: 0.9, y: -0.12, z: 0.1, color: "#fbbf24", parent: "Parent B (Paternal)", state: "Homozygous (d=0)", coeff: "+0.18" },
  ];

  return (
    <group ref={groupRef} position={position}>
      <group position={[-0.9, 0, 0]}>
        <XChromosome type="cyan" isFocused={isFocused} />
      </group>
      <group position={[-0.3, 0, 0]}>
        <XChromosome type="rec1" isFocused={isFocused} />
      </group>
      <group position={[0.3, 0, 0]}>
        <XChromosome type="rec2" isFocused={isFocused} />
      </group>
      <group position={[0.9, 0, 0]}>
        <XChromosome type="magenta" isFocused={isFocused} />
      </group>

      {/* Locus Markers on Chromosomes */}
      {locusMarkers.map((loc) => {
        const isSelected = selectedLocus === loc.name;
        const isHovered = hoveredLocus === loc.name;
        const isLit = isFocused || isExplorationMode || isSelected || isHovered;

        return (
          <group
            key={loc.name}
            position={[loc.x, loc.y, loc.z]}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedLocus(loc.name);
            }}
            onPointerOver={(e) => {
              e.stopPropagation();
              setHoveredLocus(loc.name);
              setTooltip({
                visible: true,
                x: e.clientX,
                y: e.clientY,
                title: `Genotype Locus: ${loc.name}`,
                subtitle: `${loc.parent} · ${loc.state}`,
                badge: "INHERITED LOCUS",
                badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
                details: [
                  { label: "Parental origin", value: loc.parent, color: loc.color },
                  { label: "Genotype state", value: loc.state, color: "#fbbf24" },
                  { label: "Effect coefficient", value: `α = ${loc.coeff}`, color: "#38bdf8" },
                ],
              });
            }}
            onPointerOut={() => {
              setHoveredLocus(null);
              setTooltip(null);
            }}
          >
            {/* Pulsing Beacon Sphere */}
            <mesh>
              <sphereGeometry args={[isLit ? 0.075 : 0.05, 16, 16]} />
              <meshStandardMaterial
                color={loc.color}
                emissive={loc.color}
                emissiveIntensity={isLit ? 2.5 : 0.8}
                roughness={0.1}
              />
            </mesh>
            {isLit && (
              <mesh>
                <ringGeometry args={[0.08, 0.11, 16]} />
                <meshBasicMaterial color={loc.color} transparent opacity={0.7} side={THREE.DoubleSide} />
              </mesh>
            )}
          </group>
        );
      })}
    </group>
  );
};
