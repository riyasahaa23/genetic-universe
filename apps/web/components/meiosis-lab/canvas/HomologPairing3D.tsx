"use client";

import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useMeiosisInteraction } from "../interactions/MeiosisInteractionContext";

interface HomologPairing3DProps {
  position?: [number, number, number];
}

// 3D Homolog Chromosome Pair with rich organic chromatids
const HomologChromosome: React.FC<{ type: "maternal" | "paternal"; isHighlighted: boolean }> = ({
  type,
  isHighlighted,
}) => {
  const groupRef = useRef<THREE.Group>(null);

  const isMaternal = type === "maternal";
  const baseColor = isMaternal ? "#00f0ff" : "#f43f5e";
  const emissiveColor = isMaternal ? "#0284c7" : "#be123c";

  // Twin chromatids forming organic X-shape
  const { leftArm, rightArm } = useMemo(() => {
    const leftCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.38, 0.80, 0.06),
      new THREE.Vector3(-0.24, 0.38, -0.03),
      new THREE.Vector3(-0.05, 0.0, 0.0),
      new THREE.Vector3(-0.24, -0.38, 0.03),
      new THREE.Vector3(-0.38, -0.80, -0.06),
    ]);

    const rightCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.38, 0.80, -0.06),
      new THREE.Vector3(0.24, 0.38, 0.03),
      new THREE.Vector3(0.05, 0.0, 0.0),
      new THREE.Vector3(0.24, -0.38, -0.03),
      new THREE.Vector3(0.38, -0.80, 0.06),
    ]);

    return {
      leftArm: new THREE.TubeGeometry(leftCurve, 36, 0.105, 14, false),
      rightArm: new THREE.TubeGeometry(rightCurve, 36, 0.105, 14, false),
    };
  }, []);

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * (isMaternal ? 0.25 : -0.25);
    }
  });

  return (
    <group ref={groupRef} scale={0.62}>
      <mesh geometry={leftArm}>
        <meshStandardMaterial
          color={baseColor}
          emissive={emissiveColor}
          emissiveIntensity={isHighlighted ? 1.5 : 0.9}
          roughness={0.18}
          metalness={0.25}
        />
      </mesh>
      <mesh geometry={rightArm}>
        <meshStandardMaterial
          color={baseColor}
          emissive={emissiveColor}
          emissiveIntensity={isHighlighted ? 1.5 : 0.9}
          roughness={0.18}
          metalness={0.25}
        />
      </mesh>
      {/* Centromere Node */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.11, 16, 16]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive={isMaternal ? "#38bdf8" : "#fb7185"}
          emissiveIntensity={1.3}
          roughness={0.1}
        />
      </mesh>
    </group>
  );
};

export const HomologPairing3D: React.FC<HomologPairing3DProps> = ({ position = [0, 1.95, 0] }) => {
  const groupRef = useRef<THREE.Group>(null);
  const maternalRef = useRef<THREE.Group>(null);
  const paternalRef = useRef<THREE.Group>(null);

  const {
    activeStage,
    activePhase,
    selectedHomolog,
    setSelectedHomolog,
    hoveredElement,
    setHoveredElement,
    setTooltip,
    reducedMotion,
  } = useMeiosisInteraction();

  const isMaternalActive =
    selectedHomolog === "maternal" ||
    hoveredElement === "maternal_homolog" ||
    hoveredElement === "homolog_maternal";

  const isPaternalActive =
    selectedHomolog === "paternal" ||
    hoveredElement === "paternal_homolog" ||
    hoveredElement === "homolog_paternal";

  const isStageHighlighted = activeStage === 1 || activePhase === 0;

  // Calculate target X positions based on phase
  // Phase 0: Synapsis pairing (~1.12)
  // Phase 1: Metaphase alignment (~0.62)
  // Phase 2: Anaphase reductional separation (~1.85)
  // Phase 3: Telophase pole separation (~2.2)
  const targetMatX =
    activePhase === 0 ? -1.12 : activePhase === 1 ? -0.62 : activePhase === 2 ? -1.85 : -2.2;
  const targetPatX =
    activePhase === 0 ? 1.12 : activePhase === 1 ? 0.62 : activePhase === 2 ? 1.85 : 2.2;

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();
    groupRef.current.position.y = position[1] + Math.sin(t * 1.2) * 0.02;

    const lerpFactor = reducedMotion ? 1 : Math.min(1, delta * 3.5);
    if (maternalRef.current) {
      maternalRef.current.position.x = THREE.MathUtils.lerp(
        maternalRef.current.position.x,
        targetMatX,
        lerpFactor
      );
    }
    if (paternalRef.current) {
      paternalRef.current.position.x = THREE.MathUtils.lerp(
        paternalRef.current.position.x,
        targetPatX,
        lerpFactor
      );
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Maternal Homolog (Cyan) */}
      <group
        ref={maternalRef}
        position={[-1.12, 0, 0]}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedHomolog(selectedHomolog === "maternal" ? null : "maternal");
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHoveredElement("maternal_homolog");
          setTooltip({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            title: "Maternal Homolog (Synapsis)",
            subtitle: "Diploid parental chromosome A",
            badge: "2n HOMOLOGOUS PAIR",
            badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
            details: [
              { label: "Origin", value: "Maternal inherited chromatin", color: "#38bdf8" },
              {
                label: "Synapsis state",
                value: activePhase === 1 ? "Equatorial metaphase alignment" : activePhase === 2 ? "Separating toward pole A" : "Aligned alongside paternal bivalent",
                color: "#94a3b8",
              },
            ],
          });
        }}
        onPointerOut={() => {
          setHoveredElement(null);
          setTooltip(null);
        }}
        scale={isMaternalActive ? 1.08 : 1.0}
      >
        {/* Soft internal cellular point light */}
        <pointLight color="#00f0ff" intensity={isMaternalActive ? 2.5 : 1.2} distance={3.5} />

        {/* Cellular Membrane Bubble */}
        <mesh>
          <sphereGeometry args={[0.78, 36, 36]} />
          <meshStandardMaterial
            color="#0284c7"
            emissive="#00f0ff"
            emissiveIntensity={isMaternalActive ? 1.2 : isStageHighlighted ? 0.75 : 0.4}
            roughness={0.12}
            metalness={0.1}
            transparent
            opacity={isMaternalActive ? 0.48 : 0.34}
          />
        </mesh>
        {/* Outer glowing rim */}
        <mesh rotation={[Math.PI / 4, 0, 0]}>
          <ringGeometry args={[0.76, 0.79, 44]} />
          <meshBasicMaterial
            color="#38bdf8"
            transparent
            opacity={isMaternalActive ? 0.95 : 0.65}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Chromosome inside */}
        <HomologChromosome type="maternal" isHighlighted={isMaternalActive || isStageHighlighted} />
      </group>

      {/* Paternal Homolog (Magenta) */}
      <group
        ref={paternalRef}
        position={[1.12, 0, 0]}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedHomolog(selectedHomolog === "paternal" ? null : "paternal");
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHoveredElement("paternal_homolog");
          setTooltip({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            title: "Paternal Homolog (Synapsis)",
            subtitle: "Diploid parental chromosome B",
            badge: "2n HOMOLOGOUS PAIR",
            badgeColor: "bg-pink-500/20 text-pink-300 border-pink-500/40",
            details: [
              { label: "Origin", value: "Paternal inherited chromatin", color: "#ec4899" },
              {
                label: "Synapsis state",
                value: activePhase === 1 ? "Equatorial metaphase alignment" : activePhase === 2 ? "Separating toward pole B" : "Aligned alongside maternal bivalent",
                color: "#94a3b8",
              },
            ],
          });
        }}
        onPointerOut={() => {
          setHoveredElement(null);
          setTooltip(null);
        }}
        scale={isPaternalActive ? 1.08 : 1.0}
      >
        {/* Soft internal cellular point light */}
        <pointLight color="#ec4899" intensity={isPaternalActive ? 2.5 : 1.2} distance={3.5} />

        {/* Cellular Membrane Bubble */}
        <mesh>
          <sphereGeometry args={[0.78, 36, 36]} />
          <meshStandardMaterial
            color="#be185d"
            emissive="#ec4899"
            emissiveIntensity={isPaternalActive ? 1.2 : isStageHighlighted ? 0.75 : 0.4}
            roughness={0.12}
            metalness={0.1}
            transparent
            opacity={isPaternalActive ? 0.48 : 0.34}
          />
        </mesh>
        {/* Outer glowing rim */}
        <mesh rotation={[-Math.PI / 4, 0, 0]}>
          <ringGeometry args={[0.76, 0.79, 44]} />
          <meshBasicMaterial
            color="#f472b6"
            transparent
            opacity={isPaternalActive ? 0.95 : 0.65}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Chromosome inside */}
        <HomologChromosome type="paternal" isHighlighted={isPaternalActive || isStageHighlighted} />
      </group>

      {/* Downward light arrows to crossover */}
      {activePhase <= 1 && (
        <>
          <group position={[-0.4, -0.65, 0]} rotation={[0, 0, -Math.PI / 6]}>
            <mesh>
              <cylinderGeometry args={[0.015, 0.015, 0.35, 8]} />
              <meshBasicMaterial color="#38bdf8" transparent opacity={0.7} />
            </mesh>
          </group>
          <group position={[0.4, -0.65, 0]} rotation={[0, 0, Math.PI / 6]}>
            <mesh>
              <cylinderGeometry args={[0.015, 0.015, 0.35, 8]} />
              <meshBasicMaterial color="#ec4899" transparent opacity={0.7} />
            </mesh>
          </group>
        </>
      )}
    </group>
  );
};
