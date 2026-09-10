"use client";

import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { Chromosome } from "@/components/genetic-universe/Chromosome";
import { useParadoxInteraction } from "./interactions/ParadoxInteractionContext";

interface OffspringPotentialProps {
  position: [number, number, number];
}

export const OffspringPotential: React.FC<OffspringPotentialProps> = ({ position }) => {
  const {
    setHoveredElement,
    setTooltip,
    isOffspringActive,
    isParentAActive,
    isParentBActive,
    isEpistasisActive,
    isHiddenVariationActive,
    selectOrToggleElement,
    isExplorationMode,
  } = useParadoxInteraction();

  const groupRef = useRef<THREE.Group>(null);
  const ring1Ref = useRef<THREE.Group>(null);
  const ring2Ref = useRef<THREE.Group>(null);
  const ring3Ref = useRef<THREE.Group>(null);
  const nodesRef = useRef<THREE.Group>(null);

  const isHighlighted = isOffspringActive || isEpistasisActive;

  // Concentric orbital rings scaled for optimal viewport composition
  const ring1Geo = useMemo(() => new THREE.TorusGeometry(0.98, 0.007, 16, 72), []);
  const ring2Geo = useMemo(() => new THREE.TorusGeometry(1.10, 0.006, 16, 72), []);
  const ring3Geo = useMemo(() => new THREE.TorusGeometry(1.22, 0.005, 16, 72), []);

  // Floating locus nodes on orbital rings
  const nodeBeads = useMemo(() => {
    return [
      { angle: 0.6, r: 0.98, color: "#38bdf8" },
      { angle: 2.1, r: 0.98, color: "#fbbf24" },
      { angle: 3.5, r: 1.10, color: "#ec4899" },
      { angle: 4.8, r: 1.10, color: "#fbbf24" },
      { angle: 5.9, r: 1.22, color: "#38bdf8" },
    ];
  }, []);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();

    // Gentle breathing oscillation
    groupRef.current.position.y = position[1] + Math.sin(t * 0.7) * 0.015;
    groupRef.current.rotation.y += delta * 0.06;

    // Orbiting rings
    if (ring1Ref.current) ring1Ref.current.rotation.z += delta * 0.09;
    if (ring2Ref.current) ring2Ref.current.rotation.z -= delta * 0.07;
    if (ring3Ref.current) ring3Ref.current.rotation.z += delta * 0.045;
    if (nodesRef.current) nodesRef.current.rotation.z += delta * 0.09;
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Translucent Glassy Bubble Interior */}
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          selectOrToggleElement("offspring");
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHoveredElement("offspring");
          setTooltip({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            title: "Offspring Transgressive Emergence",
            subtitle: "Recombination-generated cis configuration creates phenotype beyond parental envelope",
            badge: "MODEL-RELATIVE OUTLIER",
            badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/40",
            details: [
              { label: "Phenotypic Value", value: "+1.65 σ (Parental Envelope: [-1.8, +0.9])", color: "#fbbf24" },
              { label: "Mechanism", value: "Synergistic Epistasis between L10 & L31", color: "#38bdf8" },
              { label: "Provenance Ratio", value: "52% Maternal (A) / 48% Paternal (B)", color: "#ec4899" },
            ],
          });
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHoveredElement(null);
          setTooltip(null);
        }}
      >
        <sphereGeometry args={[0.85, 32, 32]} />
        <meshStandardMaterial
          color="#00f0ff"
          transparent
          opacity={0.07}
          roughness={0.05}
          metalness={0.1}
          emissive={isHighlighted ? "#fbbf24" : "#8b5cf6"}
          emissiveIntensity={isHighlighted ? 0.45 : 0.15}
          depthWrite={false}
        />
      </mesh>

      {/* Luminous Sharp Rim Glow Ring - Cyan */}
      <mesh position={[0, 0, 0]}>
        <ringGeometry args={[0.83, 0.87, 80]} />
        <meshBasicMaterial
          color="#00f0ff"
          transparent
          opacity={isHighlighted ? 0.98 : 0.8}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Secondary Warm Golden / Violet Rim Ring */}
      <mesh position={[0, 0, -0.02]}>
        <ringGeometry args={[0.81, 0.90, 80]} />
        <meshBasicMaterial
          color="#fbbf24"
          transparent
          opacity={isHighlighted ? 0.75 : 0.35}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Orbital Ring 1 */}
      <group ref={ring1Ref} rotation={[Math.PI / 3.4, 0.2, 0]}>
        <mesh geometry={ring1Geo}>
          <meshBasicMaterial color="#38bdf8" transparent opacity={isHighlighted ? 0.85 : 0.65} />
        </mesh>
      </group>

      {/* Orbital Ring 2 */}
      <group ref={ring2Ref} rotation={[-Math.PI / 3.8, 0.3, 0]}>
        <mesh geometry={ring2Geo}>
          <meshBasicMaterial color="#ec4899" transparent opacity={isHighlighted ? 0.75 : 0.55} />
        </mesh>
      </group>

      {/* Orbital Ring 3 */}
      <group ref={ring3Ref} rotation={[0.15, 0, -0.2]}>
        <mesh geometry={ring3Geo}>
          <meshBasicMaterial color="#fbbf24" transparent opacity={isHighlighted ? 0.7 : 0.4} />
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
            <sphereGeometry args={[isEpistasisActive || isHiddenVariationActive ? 0.045 : 0.032, 12, 12]} />
            <meshStandardMaterial
              color={bead.color}
              emissive={bead.color}
              emissiveIntensity={isEpistasisActive || isHiddenVariationActive ? 2.8 : 1.5}
            />
          </mesh>
        ))}
      </group>

      {/* Epistatic Interaction Coupling Beam between Locus nodes */}
      {isEpistasisActive && (
        <group rotation={[Math.PI / 3.4, 0.2, 0]}>
          <mesh position={[0, 0, 0.02]} rotation={[0, 0, 1.25]}>
            <planeGeometry args={[1.7, 0.045]} />
            <meshBasicMaterial
              color="#fbbf24"
              transparent
              opacity={0.9}
              blending={THREE.AdditiveBlending}
              side={THREE.DoubleSide}
            />
          </mesh>
          <Html position={[0, 0.35, 0.1]} center distanceFactor={14} className="pointer-events-none select-none">
            <div className="px-2 py-0.5 rounded bg-amber-950/90 border border-amber-400 text-amber-300 font-mono text-[8px] font-bold shadow-[0_0_12px_rgba(245,158,11,0.6)] whitespace-nowrap">
              ✦ Epistatic Synergy: L10 × L31 (+31.0) ✦
            </div>
          </Html>
        </group>
      )}

      {/* Center Radiance Point Lights */}
      <pointLight color="#fbbf24" intensity={isHighlighted ? 2.5 : 1.2} distance={5} />
      <pointLight color="#00f0ff" intensity={1.2} distance={5} />

      {/* Inside: 3D Mosaic Chromosomes showing Recombinant Provenance */}
      <group scale={0.32} position={[0, 0, 0]}>
        <Chromosome
          type="offspring"
          position={[-0.2, 0.03, 0.08]}
          rotation={[0.15, 0.35, 0.12]}
          scale={0.9}
          isHovered={isOffspringActive}
          highlightParent={isParentAActive ? "parent_a" : isParentBActive ? "parent_b" : null}
          highlightLoci={isEpistasisActive || isHiddenVariationActive}
        />
        <Chromosome
          type="offspring"
          position={[0.2, -0.03, -0.08]}
          rotation={[-0.12, -0.4, -0.15]}
          scale={0.88}
          isHovered={isOffspringActive}
          highlightParent={isParentAActive ? "parent_a" : isParentBActive ? "parent_b" : null}
          highlightLoci={isEpistasisActive || isHiddenVariationActive}
        />
      </group>

      {/* Floating HTML Label below sphere */}
      <Html
        position={[0, -0.96, 0]}
        center
        distanceFactor={14}
        className="pointer-events-none select-none z-30"
      >
        <div className="flex flex-col items-center text-center whitespace-nowrap drop-shadow-[0_2px_12px_rgba(0,0,0,0.95)]">
          <div className="text-[13.5px] font-bold tracking-wide text-cyan-300">
            Offspring
          </div>
          <div className="text-[10px] font-medium text-slate-200 tracking-wider mt-0.5">
            A New Phenotypic Possibility
          </div>
          {isExplorationMode && (
            <div className="text-[8px] font-mono tracking-wider mt-0.5">
              {isHighlighted ? (
                <span className="text-amber-300 bg-amber-950/80 px-1.5 py-0.2 rounded border border-amber-500/40">
                  ● TRANSGRESSIVE OUTLIER
                </span>
              ) : (
                <span className="text-cyan-400/80 bg-slate-900/80 px-1.5 py-0.2 rounded border border-slate-700/50">
                  CLICK TO EXAMINE
                </span>
              )}
            </div>
          )}
        </div>
      </Html>
    </group>
  );
};
