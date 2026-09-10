"use client";

import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useMeiosisInteraction } from "../interactions/MeiosisInteractionContext";

interface ChiasmaCrossover3DProps {
  position?: [number, number, number];
}

export const ChiasmaCrossover3D: React.FC<ChiasmaCrossover3DProps> = ({ position = [0, 0.82, 0] }) => {
  const groupRef = useRef<THREE.Group>(null);
  const sparkRef = useRef<THREE.Mesh>(null);
  const flareRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);

  const {
    activeStage,
    hoveredElement,
    setHoveredElement,
    setTooltip,
    showCrossoverPoints,
  } = useMeiosisInteraction();
  const isSelected = activeStage === 2 || hoveredElement === "chiasma";

  // Build crossover chromatids
  const { cyanOuter, cyanCrossing, pinkOuter, pinkCrossing } = useMemo(() => {
    // Cyan Outer Chromatid (Left flank)
    const cOut = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.72, 0.62, 0.03),
      new THREE.Vector3(-0.45, 0.28, 0.0),
      new THREE.Vector3(-0.28, 0.0, 0.0),
      new THREE.Vector3(-0.45, -0.28, 0.0),
      new THREE.Vector3(-0.72, -0.62, 0.03),
    ]);

    // Cyan Inner Crossing Chromatid (Crosses over to pink side)
    const cCross = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.35, 0.58, -0.04),
      new THREE.Vector3(-0.16, 0.25, -0.02),
      new THREE.Vector3(0.0, 0.0, 0.0), // Chiasma crossover junction
      new THREE.Vector3(0.16, -0.25, 0.02),
      new THREE.Vector3(0.35, -0.58, 0.04),
    ]);

    // Pink Outer Chromatid (Right flank)
    const pOut = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.72, 0.62, 0.03),
      new THREE.Vector3(0.45, 0.28, 0.0),
      new THREE.Vector3(0.28, 0.0, 0.0),
      new THREE.Vector3(0.45, -0.28, 0.0),
      new THREE.Vector3(0.72, -0.62, 0.03),
    ]);

    // Pink Inner Crossing Chromatid (Crosses over to cyan side)
    const pCross = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.35, 0.58, -0.04),
      new THREE.Vector3(0.16, 0.25, -0.02),
      new THREE.Vector3(0.0, 0.0, -0.03), // Chiasma crossover junction
      new THREE.Vector3(-0.16, -0.25, 0.02),
      new THREE.Vector3(-0.35, -0.58, 0.04),
    ]);

    return {
      cyanOuter: new THREE.TubeGeometry(cOut, 32, 0.08, 12, false),
      cyanCrossing: new THREE.TubeGeometry(cCross, 32, 0.08, 12, false),
      pinkOuter: new THREE.TubeGeometry(pOut, 32, 0.08, 12, false),
      pinkCrossing: new THREE.TubeGeometry(pCross, 32, 0.08, 12, false),
    };
  }, []);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();
    groupRef.current.position.y = position[1] + Math.sin(t * 1.5 + 1) * 0.015;

    if (sparkRef.current) {
      sparkRef.current.rotation.z += delta * 1.2;
      const s = 1.0 + Math.sin(t * 5) * 0.25;
      sparkRef.current.scale.set(s, s, s);
    }
    if (flareRef.current) {
      flareRef.current.rotation.z -= delta * 0.8;
    }
    if (lightRef.current) {
      lightRef.current.intensity = 2.2 + Math.sin(t * 6) * 0.7;
    }
  });

  return (
    <group
      ref={groupRef}
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        setHoveredElement(hoveredElement === "chiasma" ? null : "chiasma");
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHoveredElement("chiasma");
        setTooltip({
          visible: true,
          x: e.clientX,
          y: e.clientY,
          title: "Chiasma (Crossover Recombination)",
          subtitle: "Maternal Chr 1A × Paternal Chr 1B Synapsis",
          badge: "RECOMBINANT JUNCTION",
          badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/40",
          details: [
            { label: "Crossover Interval", value: "12.4 – 28.7 Mb (Chr 1)", color: "#fbbf24" },
            { label: "Homolog Bivalent", value: "Maternal / Paternal exchange", color: "#38bdf8" },
            { label: "Resulting Segments", value: "Rec 1 (62% Mat / 38% Pat) & Rec 2 (38% Mat / 62% Pat)", color: "#ec4899" },
          ],
        });
      }}
      onPointerOut={() => {
        setHoveredElement(null);
        setTooltip(null);
      }}
    >
      {/* Cyan arms */}
      <mesh geometry={cyanOuter}>
        <meshStandardMaterial
          color="#00f0ff"
          emissive="#0284c7"
          emissiveIntensity={isSelected ? 1.4 : 0.8}
          roughness={0.2}
          metalness={0.2}
        />
      </mesh>
      <mesh geometry={cyanCrossing}>
        <meshStandardMaterial
          color="#38bdf8"
          emissive="#00f0ff"
          emissiveIntensity={isSelected ? 1.6 : 1.0}
          roughness={0.15}
          metalness={0.2}
        />
      </mesh>

      {/* Pink arms */}
      <mesh geometry={pinkOuter}>
        <meshStandardMaterial
          color="#ec4899"
          emissive="#be185d"
          emissiveIntensity={isSelected ? 1.4 : 0.8}
          roughness={0.2}
          metalness={0.2}
        />
      </mesh>
      <mesh geometry={pinkCrossing}>
        <meshStandardMaterial
          color="#f472b6"
          emissive="#ec4899"
          emissiveIntensity={isSelected ? 1.6 : 1.0}
          roughness={0.15}
          metalness={0.2}
        />
      </mesh>

      {/* Centromeres */}
      <mesh position={[-0.28, 0, 0]}>
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshStandardMaterial color="#ffffff" emissive="#38bdf8" emissiveIntensity={1.2} />
      </mesh>
      <mesh position={[0.28, 0, 0]}>
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshStandardMaterial color="#ffffff" emissive="#f472b6" emissiveIntensity={1.2} />
      </mesh>

      {/* Central Golden Chiasma Spark & Flare */}
      {showCrossoverPoints && (
        <group position={[0, 0, 0.06]}>
          <pointLight ref={lightRef} intensity={isSelected ? 4.5 : 2.5} color="#fbbf24" distance={6} />

          {/* Golden Core Sphere */}
          <mesh scale={isSelected ? [1.4, 1.4, 1.4] : [1, 1, 1]}>
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>

          {/* Outer Glow Halo */}
          <mesh ref={sparkRef} scale={isSelected ? [1.35, 1.35, 1.35] : [1, 1, 1]}>
            <ringGeometry args={[0.06, 0.28, 24]} />
            <meshBasicMaterial
              color="#fbbf24"
              transparent
              opacity={isSelected ? 1.0 : 0.85}
              blending={THREE.AdditiveBlending}
              side={THREE.DoubleSide}
            />
          </mesh>

          {/* Rotating Star Flare */}
          <mesh ref={flareRef} rotation={[0, 0, Math.PI / 4]} scale={isSelected ? [1.4, 1.4, 1.4] : [1, 1, 1]}>
            <planeGeometry args={[0.55, 0.55]} />
            <meshBasicMaterial
              color="#fef08a"
              transparent
              opacity={isSelected ? 0.95 : 0.75}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        </group>
      )}

      {/* Downward light arrow to Stage 3 */}
      <group position={[0, -0.62, 0]}>
        <mesh>
          <cylinderGeometry args={[0.015, 0.015, 0.28, 8]} />
          <meshBasicMaterial color="#fbbf24" transparent opacity={0.7} />
        </mesh>
      </group>
    </group>
  );
};
