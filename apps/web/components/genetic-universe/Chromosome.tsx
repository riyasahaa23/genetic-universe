"use client";

import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

interface ChromosomeProps {
  type: "parent_a" | "parent_b" | "offspring";
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  isHovered?: boolean;
  highlightLocus?: number | null;
  highlightParent?: "parent_a" | "parent_b" | null;
  highlightLoci?: boolean;
  onPointerOver?: () => void;
  onPointerOut?: () => void;
}

export const Chromosome: React.FC<ChromosomeProps> = ({
  type,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  isHovered = false,
  highlightLocus = null,
  highlightParent = null,
  highlightLoci = false,
  onPointerOver,
  onPointerOut,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Mesh>(null);
  const rightArmRef = useRef<THREE.Mesh>(null);

  // Generate organic 3D spline curves for the sister chromatids
  const { leftCurve, rightCurve } = useMemo(() => {
    // Subtle asymmetry and organic curvature
    const leftPoints = [
      new THREE.Vector3(-0.48, 1.25, 0.08),
      new THREE.Vector3(-0.35, 0.65, -0.06),
      new THREE.Vector3(-0.06, 0.02, 0.02), // Centromere constriction
      new THREE.Vector3(-0.38, -0.65, 0.08),
      new THREE.Vector3(-0.52, -1.25, -0.05),
    ];

    const rightPoints = [
      new THREE.Vector3(0.48, 1.25, -0.08),
      new THREE.Vector3(0.35, 0.65, 0.06),
      new THREE.Vector3(0.06, 0.02, -0.02), // Centromere constriction
      new THREE.Vector3(0.38, -0.65, -0.08),
      new THREE.Vector3(0.52, -1.25, 0.05),
    ];

    return {
      leftCurve: new THREE.CatmullRomCurve3(leftPoints, false, "centripetal", 0.5),
      rightCurve: new THREE.CatmullRomCurve3(rightPoints, false, "centripetal", 0.5),
    };
  }, []);

  // Geometries for tubular chromatids
  const leftTubeGeo = useMemo(() => new THREE.TubeGeometry(leftCurve, 40, 0.13, 12, false), [leftCurve]);
  const rightTubeGeo = useMemo(() => new THREE.TubeGeometry(rightCurve, 40, 0.13, 12, false), [rightCurve]);

  // Constriction centromere geometry
  const centromereGeo = useMemo(() => new THREE.SphereGeometry(0.12, 16, 16), []);

  // Material setup based on type
  const baseColor = useMemo(() => {
    if (type === "parent_a") return new THREE.Color("#00f0ff");
    if (type === "parent_b") return new THREE.Color("#ec4899");
    return new THREE.Color("#38bdf8"); // Offspring baseline
  }, [type]);

  const emissiveColor = useMemo(() => {
    if (highlightLocus !== null || highlightLoci) return new THREE.Color("#fbbf24");
    if (highlightParent === "parent_a") return new THREE.Color("#0284c7");
    if (highlightParent === "parent_b") return new THREE.Color("#be185d");
    if (isHovered) return new THREE.Color("#fbbf24");
    if (type === "parent_a") return new THREE.Color("#0284c7");
    if (type === "parent_b") return new THREE.Color("#be185d");
    return new THREE.Color("#000000");
  }, [type, isHovered, highlightLocus, highlightLoci, highlightParent]);

  // Mosaic vertex colors for Offspring chromosome
  const mosaicLeftGeo = useMemo(() => {
    if (type !== "offspring") return leftTubeGeo;
    const geo = leftTubeGeo.clone();
    const count = geo.attributes.position.count;
    const colors = new Float32Array(count * 3);
    const pos = geo.attributes.position;

    const cyan = highlightParent === "parent_a" ? new THREE.Color("#38bdf8") : highlightParent === "parent_b" ? new THREE.Color("#0c4a6e") : new THREE.Color("#00e5ff");
    const pink = highlightParent === "parent_b" ? new THREE.Color("#f472b6") : highlightParent === "parent_a" ? new THREE.Color("#701a75") : new THREE.Color("#ec4899");
    const gold = highlightLoci ? new THREE.Color("#fef08a") : new THREE.Color("#fbbf24");

    for (let i = 0; i < count; i++) {
      const y = pos.getY(i);
      let col = cyan;
      // Recombinant mosaic segments:
      // Upper arm: Parent A (Cyan)
      // Mid-lower arm: Recombinant Parent B (Pink)
      // Locus 10 & 31: Emergent Novelty (Gold)
      if (y > 0.4 && y < 0.75) {
        col = gold; // Locus 10 region
      } else if (y <= 0.05 && y > -0.6) {
        col = pink; // Swapped meiotic segment
      } else if (y <= -0.6 && y > -0.9) {
        col = gold; // Locus 31 region
      } else if (y <= -0.9) {
        col = pink;
      }

      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
    }

    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return geo;
  }, [leftTubeGeo, type, highlightParent, highlightLoci]);

  const mosaicRightGeo = useMemo(() => {
    if (type !== "offspring") return rightTubeGeo;
    const geo = rightTubeGeo.clone();
    const count = geo.attributes.position.count;
    const colors = new Float32Array(count * 3);
    const pos = geo.attributes.position;

    const cyan = highlightParent === "parent_a" ? new THREE.Color("#38bdf8") : highlightParent === "parent_b" ? new THREE.Color("#0c4a6e") : new THREE.Color("#00e5ff");
    const pink = highlightParent === "parent_b" ? new THREE.Color("#f472b6") : highlightParent === "parent_a" ? new THREE.Color("#701a75") : new THREE.Color("#ec4899");
    const gold = highlightLoci ? new THREE.Color("#fef08a") : new THREE.Color("#fbbf24");

    for (let i = 0; i < count; i++) {
      const y = pos.getY(i);
      let col = pink;
      if (y > 0.4 && y < 0.75) {
        col = gold;
      } else if (y <= 0.1 && y > -0.5) {
        col = cyan;
      } else if (y <= -0.5 && y > -0.85) {
        col = gold;
      }

      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
    }

    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return geo;
  }, [rightTubeGeo, type, highlightParent, highlightLoci]);

  // Subtle organic movement
  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();

    // Natural Brownian drift and slow rotation
    groupRef.current.rotation.y += delta * 0.25;
    groupRef.current.rotation.z = Math.sin(t * 0.6 + position[0]) * 0.08;
    groupRef.current.position.y = position[1] + Math.sin(t * 1.2 + position[0] * 2) * 0.06;
  });

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={rotation}
      scale={scale}
      onPointerOver={(e) => {
        e.stopPropagation();
        onPointerOver?.();
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        onPointerOut?.();
      }}
    >
      {/* Left Sister Chromatid */}
      <mesh ref={leftArmRef} geometry={type === "offspring" ? mosaicLeftGeo : leftTubeGeo}>
        <meshStandardMaterial
          vertexColors={type === "offspring"}
          color={type === "offspring" ? "#ffffff" : baseColor}
          emissive={emissiveColor}
          emissiveIntensity={isHovered ? 1.4 : 0.6}
          roughness={0.25}
          metalness={0.2}
          transparent
          opacity={0.92}
        />
      </mesh>

      {/* Right Sister Chromatid */}
      <mesh ref={rightArmRef} geometry={type === "offspring" ? mosaicRightGeo : rightTubeGeo}>
        <meshStandardMaterial
          vertexColors={type === "offspring"}
          color={type === "offspring" ? "#ffffff" : baseColor}
          emissive={emissiveColor}
          emissiveIntensity={isHovered ? 1.4 : 0.6}
          roughness={0.25}
          metalness={0.2}
          transparent
          opacity={0.92}
        />
      </mesh>

      {/* Centromere Node */}
      <mesh geometry={centromereGeo} position={[0, 0.02, 0]}>
        <meshStandardMaterial
          color={type === "offspring" ? "#fbbf24" : "#ffffff"}
          emissive={type === "offspring" ? "#fbbf24" : emissiveColor}
          emissiveIntensity={1.2}
          roughness={0.1}
          metalness={0.5}
        />
      </mesh>
    </group>
  );
};
