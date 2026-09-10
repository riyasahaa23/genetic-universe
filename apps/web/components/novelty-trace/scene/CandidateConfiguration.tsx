"use client";

import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useNoveltyTrace, CandidateConfig } from "../interactions/NoveltyTraceInteractionContext";

interface CandidateConfigurationProps {
  candidate: CandidateConfig;
  position: [number, number, number];
}

export const CandidateConfiguration: React.FC<CandidateConfigurationProps> = ({
  candidate,
  position,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const scanBarRef = useRef<THREE.Mesh>(null);
  const epistaticBeamRef = useRef<THREE.Mesh>(null);

  const {
    activeWorkflowStep,
    selectedCandidateId,
    setSelectedCandidateId,
    hoveredCandidateId,
    setHoveredCandidateId,
    setTooltip,
  } = useNoveltyTrace();

  const isSelected = selectedCandidateId === candidate.id;
  const isHovered = hoveredCandidateId === candidate.id;

  useFrame(({ clock }) => {
    // Stage 1: Completely hide candidate configurations
    if (activeWorkflowStep === 1) {
      if (groupRef.current) groupRef.current.visible = false;
      return;
    }

    if (groupRef.current) groupRef.current.visible = true;

    const t = clock.getElapsedTime();
    if (groupRef.current) {
      // Stage 4: Selected candidate steps forward into the camera
      let targetZ = 0;
      let targetScale = 1.0;
      if (activeWorkflowStep === 4) {
        targetZ = isSelected ? 0.65 : -0.4;
        targetScale = isSelected ? 1.18 : 0.8;
      }

      groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, targetZ, 0.08);
      const curScale = groupRef.current.scale.x;
      const nextScale = THREE.MathUtils.lerp(curScale, targetScale, 0.08);
      groupRef.current.scale.set(nextScale, nextScale, nextScale);

      groupRef.current.position.y = position[1] + Math.sin(t * 1.6 + candidate.num) * 0.035;
      if ((isSelected || isHovered) && activeWorkflowStep >= 3) {
        groupRef.current.rotation.y = Math.sin(t * 0.8) * 0.12;
      } else {
        groupRef.current.rotation.y = 0;
      }
    }

    if (ringRef.current) {
      ringRef.current.rotation.z = t * (activeWorkflowStep === 2 ? 1.2 : 0.4);
    }

    // Stage 2: Scanning laser sweep
    if (scanBarRef.current && activeWorkflowStep === 2) {
      scanBarRef.current.position.y = Math.sin(t * 4.5 + candidate.num * 1.5) * 0.45;
    }

    // Stage 4: Epistatic beam pulsation
    if (epistaticBeamRef.current && activeWorkflowStep === 4) {
      const pulse = 1 + Math.sin(t * 6.0) * 0.2;
      epistaticBeamRef.current.scale.set(pulse, 1, pulse);
    }
  });

  // Create a slender organic chromatid
  const createChromatid = (offsetX: number, angle: number, colorPrimary: string, colorSecondary: string) => {
    const isStage2 = activeWorkflowStep === 2;
    const isStage4 = activeWorkflowStep === 4;

    const emissiveIntensity = isStage2
      ? 0.5
      : isStage4
      ? isSelected
        ? 0.95
        : 0.15
      : isSelected
      ? 0.8
      : 0.35;

    return (
      <group position={[offsetX, 0, 0]} rotation={[0, 0, angle]}>
        {/* Upper Arm */}
        <mesh position={[0, 0.42, 0]}>
          <capsuleGeometry args={[0.065, 0.46, 8, 16]} />
          <meshStandardMaterial
            color={colorPrimary}
            emissive={colorPrimary}
            emissiveIntensity={emissiveIntensity}
            roughness={0.2}
            metalness={0.7}
            transparent={isStage4 && !isSelected}
            opacity={isStage4 && !isSelected ? 0.35 : 1.0}
          />
        </mesh>

        {/* Band on upper arm */}
        <mesh position={[0, 0.52, 0.008]}>
          <cylinderGeometry args={[0.07, 0.07, 0.1, 16]} />
          <meshBasicMaterial color={colorSecondary} />
        </mesh>

        {/* Centromere (Middle pinch) */}
        <mesh position={[0, 0.14, 0]}>
          <sphereGeometry args={[0.058, 16, 16]} />
          <meshStandardMaterial color="#020617" roughness={0.1} />
        </mesh>

        {/* Lower Arm */}
        <mesh position={[0, -0.22, 0]}>
          <capsuleGeometry args={[0.065, 0.5, 8, 16]} />
          <meshStandardMaterial
            color={colorSecondary}
            emissive={colorSecondary}
            emissiveIntensity={emissiveIntensity}
            roughness={0.2}
            metalness={0.7}
            transparent={isStage4 && !isSelected}
            opacity={isStage4 && !isSelected ? 0.35 : 1.0}
          />
        </mesh>

        {/* Lower band */}
        <mesh position={[0, -0.32, 0.008]}>
          <cylinderGeometry args={[0.07, 0.07, 0.1, 16]} />
          <meshBasicMaterial color={colorPrimary} />
        </mesh>
      </group>
    );
  };

  // Determine pedestal styling by stage
  const isStage2 = activeWorkflowStep === 2;
  const isStage4 = activeWorkflowStep === 4;

  const pedestalColor = isStage2
    ? "#38bdf8"
    : isStage4
    ? isSelected
      ? "#fbbf24"
      : "#334155"
    : candidate.num === 1
    ? isSelected
      ? "#fbbf24"
      : "#38bdf8"
    : candidate.num === 2
    ? "#38bdf8"
    : "#a855f7";

  return (
    <group
      ref={groupRef}
      position={position}
      onClick={() => {
        if (activeWorkflowStep >= 2) {
          setSelectedCandidateId(candidate.id);
        }
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        if (activeWorkflowStep === 1) return;
        document.body.style.cursor = "pointer";
        setHoveredCandidateId(candidate.id);

        if (activeWorkflowStep === 2) {
          setTooltip({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            title: `Candidate Search Region ${candidate.num}`,
            subtitle: "Evaluating genomic state for plausible attribution",
            badge: "INFERENCE SCAN",
            badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/50",
            details: [
              { label: "Search status", value: "Candidate region evaluated", color: "#38bdf8" },
              { label: "Target locus", value: candidate.variantDetails.locus, color: "#fbbf24" },
              { label: "Architecture", value: candidate.type, color: "#c084fc" },
            ],
          });
        } else {
          setTooltip({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            title: candidate.name,
            subtitle: candidate.keyMechanism,
            badge: isSelected ? "SELECTED EXPLANATION" : "CANDIDATE SOLUTION",
            badgeColor: isSelected
              ? "bg-amber-500/20 text-amber-300 border-amber-500/50"
              : "bg-cyan-500/20 text-cyan-300 border-cyan-500/50",
            details: [
              { label: "Attribution score", value: `${candidate.score.toFixed(2)}`, color: "#fbbf24" },
              { label: "Counterfactual delta", value: `-${candidate.delta.toFixed(1)}`, color: "#38bdf8" },
              { label: "Novelty removed", value: candidate.noveltyRemoved ? "Yes (Restores Envelope)" : "Partial", color: candidate.noveltyRemoved ? "#4ade80" : "#fbbf24" },
            ],
          });
        }
      }}
      onPointerOut={() => {
        document.body.style.cursor = "auto";
        setHoveredCandidateId(null);
        setTooltip(null);
      }}
    >
      {/* Glowing Pedestal Disc on Platform */}
      <group position={[0, -0.75, 0]}>
        {/* Inner flat circular disc */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.7, 32]} />
          <meshBasicMaterial
            color={pedestalColor}
            transparent
            opacity={isStage2 ? 0.2 : isSelected ? 0.35 : 0.12}
          />
        </mesh>

        {/* Outer glowing ring */}
        <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.68, 0.74, 32]} />
          <meshBasicMaterial
            color={pedestalColor}
            transparent
            opacity={isStage2 ? 0.6 : isSelected ? 0.95 : 0.3}
          />
        </mesh>

        {/* Subtle vertical light cylinder when selected in Stage 3 or 4 */}
        {isSelected && !isStage2 && (
          <mesh position={[0, 0.35, 0]}>
            <cylinderGeometry args={[0.55, 0.68, 0.7, 32, 1, true]} />
            <meshBasicMaterial
              color="#fbbf24"
              transparent
              opacity={0.08}
              side={THREE.DoubleSide}
            />
          </mesh>
        )}
      </group>

      {/* 3D Chromosome Bivalent Pair */}
      <group position={[0, 0, 0]}>
        {candidate.num === 1 && (
          <>
            {createChromatid(-0.18, 0.1, "#38bdf8", "#ec4899")}
            {createChromatid(0.18, -0.1, "#ec4899", "#38bdf8")}
            {/* Locus indicator dot */}
            <mesh position={[0, 0.32, 0.08]}>
              <sphereGeometry args={[0.07, 16, 16]} />
              <meshBasicMaterial color="#fbbf24" />
            </mesh>

            {/* Stage 4: Epistatic Resonance Beam between Locus A and Locus B */}
            {isStage4 && isSelected && (
              <group>
                <mesh position={[0, -0.32, 0.08]}>
                  <sphereGeometry args={[0.07, 16, 16]} />
                  <meshBasicMaterial color="#fbbf24" />
                </mesh>
                <mesh ref={epistaticBeamRef} position={[0, 0, 0.08]}>
                  <cylinderGeometry args={[0.018, 0.018, 0.64, 16]} />
                  <meshStandardMaterial
                    color="#fbbf24"
                    emissive="#f59e0b"
                    emissiveIntensity={1.0}
                  />
                </mesh>
              </group>
            )}
          </>
        )}

        {candidate.num === 2 && (
          <>
            {createChromatid(-0.18, 0.1, "#38bdf8", "#0284c7")}
            {createChromatid(0.18, -0.1, "#ec4899", "#38bdf8")}
          </>
        )}

        {candidate.num === 3 && (
          <>
            {createChromatid(-0.18, 0.1, "#a855f7", "#ec4899")}
            {createChromatid(0.18, -0.1, "#ec4899", "#38bdf8")}
          </>
        )}

        {/* Stage 2: Scanning Laser Bar sweeping along chromosome */}
        {isStage2 && (
          <mesh ref={scanBarRef} position={[0, 0, 0.1]}>
            <boxGeometry args={[0.65, 0.015, 0.015]} />
            <meshBasicMaterial color="#38bdf8" />
          </mesh>
        )}

        {/* Selection Aura */}
        {isSelected && !isStage2 && (
          <pointLight color="#fbbf24" intensity={1.5} distance={2.5} position={[0, 0, 0.4]} />
        )}
      </group>
    </group>
  );
};
