"use client";

import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { Chromosome } from "@/components/genetic-universe/Chromosome";
import { useParadoxInteraction } from "./interactions/ParadoxInteractionContext";

interface ParentPotentialProps {
  parentId: "A" | "B";
  position: [number, number, number];
}

export const ParentPotential: React.FC<ParentPotentialProps> = ({ parentId, position }) => {
  const {
    setHoveredElement,
    setTooltip,
    isParentAActive,
    isParentBActive,
    selectOrToggleElement,
    isExplorationMode,
    isHiddenVariationActive,
  } = useParadoxInteraction();

  const groupRef = useRef<THREE.Group>(null);
  const sphereRef = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Points>(null);

  const isParentA = parentId === "A";
  const isTargetActive = isParentA ? isParentAActive : isParentBActive;

  const primaryColor = isParentA ? "#00f0ff" : "#ec4899";
  const glowColor = isParentA ? "#38bdf8" : "#f472b6";

  // Fine nucleoplasm particles
  const particleCount = 40;
  const particleGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = Math.cbrt(Math.random()) * 0.65;
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
    groupRef.current.position.y =
      position[1] + Math.sin(t * 0.75 + (isParentA ? 0 : Math.PI)) * 0.016;
    groupRef.current.rotation.y += delta * (isParentA ? 0.04 : -0.035);

    if (particlesRef.current) {
      particlesRef.current.rotation.y += delta * 0.03;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Floating HTML Header Label directly above sphere */}
      <Html
        position={[0, 0.88, 0]}
        center
        distanceFactor={14}
        className="pointer-events-none select-none z-30"
      >
        <div className="flex flex-col items-center text-center whitespace-nowrap drop-shadow-[0_2px_12px_rgba(0,0,0,0.95)]">
          <div
            className={`text-[13px] font-semibold tracking-wide ${
              isParentA ? "text-cyan-300" : "text-pink-300"
            }`}
          >
            Parent {parentId}
          </div>
          <div className="text-[10px] font-medium text-slate-300">
            Genetic Potential
          </div>
          {isExplorationMode && (
            <div className="text-[8px] font-mono tracking-wider mt-0.5">
              {isTargetActive ? (
                <span className="text-amber-300 bg-amber-950/80 px-1.5 py-0.2 rounded border border-amber-500/40">
                  ● ACTIVE ENVELOPE
                </span>
              ) : (
                <span className="text-cyan-400/80 bg-slate-900/80 px-1.5 py-0.2 rounded border border-slate-700/50">
                  CLICK TO FOCUS
                </span>
              )}
            </div>
          )}
        </div>
      </Html>

      {/* Translucent Glassy Bubble Sphere Interior */}
      <mesh
        ref={sphereRef}
        onClick={(e) => {
          e.stopPropagation();
          selectOrToggleElement(isParentA ? "parent_a" : "parent_b");
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHoveredElement(isParentA ? "parent_a" : "parent_b");
          setTooltip({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            title: `Parent ${parentId} Genetic Potential`,
            subtitle: isParentA
              ? "Carries loci L10=1 in trans configuration (bounded envelope)"
              : "Carries loci L31=1 in trans configuration (bounded envelope)",
            badge: isParentA ? "PARENT A DISTRIBUTION" : "PARENT B DISTRIBUTION",
            badgeColor: isParentA
              ? "bg-sky-500/20 text-sky-300 border-sky-500/40"
              : "bg-pink-500/20 text-pink-300 border-pink-500/40",
            details: [
              { label: "Mean Trait Value", value: isParentA ? "-0.45 σ" : "-0.28 σ", color: primaryColor },
              { label: "Phenotypic Range", value: isParentA ? "[-1.8, +0.7]" : "[-1.5, +0.9]", color: "#94a3b8" },
              { label: "Envelope Bound", value: "Within parental limits", color: "#38bdf8" },
            ],
          });
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHoveredElement(null);
          setTooltip(null);
        }}
      >
        <sphereGeometry args={[0.74, 32, 32]} />
        <meshStandardMaterial
          color={primaryColor}
          transparent
          opacity={0.06}
          roughness={0.05}
          metalness={0.1}
          emissive={glowColor}
          emissiveIntensity={isTargetActive ? 0.45 : 0.1}
          depthWrite={false}
        />
      </mesh>

      {/* Luminous Sharp Rim Glow Ring */}
      <mesh position={[0, 0, 0]}>
        <ringGeometry args={[0.72, 0.76, 72]} />
        <meshBasicMaterial
          color={primaryColor}
          transparent
          opacity={isTargetActive ? 0.98 : 0.75}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Soft Outer Halo Ring */}
      <mesh position={[0, 0, -0.05]}>
        <ringGeometry args={[0.70, 0.80, 72]} />
        <meshBasicMaterial
          color={primaryColor}
          transparent
          opacity={isTargetActive ? 0.6 : 0.22}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Nucleoplasm Floating Particles */}
      <points ref={particlesRef} geometry={particleGeo}>
        <pointsMaterial
          size={isTargetActive ? 0.03 : 0.024}
          color={isParentA ? "#38bdf8" : "#f472b6"}
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Paired 3D Chromosomes */}
      <group scale={0.38}>
        <Chromosome
          type={isParentA ? "parent_a" : "parent_b"}
          position={[-0.26, 0, 0.08]}
          rotation={[0.1, isParentA ? 0.35 : -0.35, 0.15]}
          scale={0.92}
          isHovered={isTargetActive}
          highlightLoci={isHiddenVariationActive}
        />
        <Chromosome
          type={isParentA ? "parent_a" : "parent_b"}
          position={[0.26, 0, -0.08]}
          rotation={[-0.1, isParentA ? -0.35 : 0.35, -0.12]}
          scale={0.9}
          isHovered={isTargetActive}
          highlightLoci={isHiddenVariationActive}
        />
      </group>
    </group>
  );
};
