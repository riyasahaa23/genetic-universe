"use client";

import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useNoveltyTrace } from "../interactions/NoveltyTraceInteractionContext";

export const TracePaths: React.FC = () => {
  const { activeWorkflowStep, selectedCandidateId } = useNoveltyTrace();
  const groupRef = useRef<THREE.Group>(null);
  const provenanceGroupRef = useRef<THREE.Group>(null);

  // Define multi-strand fiber conduits branching down to candidates
  const strands = useMemo(() => {
    const origin = new THREE.Vector3(0, 1.35, 0);

    // Candidate 1 (Left: x = -2.18) - 3 strands
    const c1_a = new THREE.CubicBezierCurve3(
      origin,
      new THREE.Vector3(-0.6, 0.7, 0.1),
      new THREE.Vector3(-1.6, 0.1, -0.1),
      new THREE.Vector3(-2.18, -0.45, 0)
    );
    const c1_b = new THREE.CubicBezierCurve3(
      origin,
      new THREE.Vector3(-0.4, 0.8, -0.15),
      new THREE.Vector3(-1.4, 0.3, 0.15),
      new THREE.Vector3(-2.18, -0.45, 0)
    );

    // Candidate 2 (Center: x = 0) - 2 strands
    const c2_a = new THREE.CubicBezierCurve3(
      origin,
      new THREE.Vector3(-0.15, 0.6, 0.15),
      new THREE.Vector3(0.12, 0.1, -0.1),
      new THREE.Vector3(0, -0.45, 0)
    );
    const c2_b = new THREE.CubicBezierCurve3(
      origin,
      new THREE.Vector3(0.15, 0.6, -0.15),
      new THREE.Vector3(-0.1, 0.1, 0.1),
      new THREE.Vector3(0, -0.45, 0)
    );

    // Candidate 3 (Right: x = 2.18) - 3 strands
    const c3_a = new THREE.CubicBezierCurve3(
      origin,
      new THREE.Vector3(0.6, 0.7, 0.1),
      new THREE.Vector3(1.6, 0.1, -0.1),
      new THREE.Vector3(2.18, -0.45, 0)
    );
    const c3_b = new THREE.CubicBezierCurve3(
      origin,
      new THREE.Vector3(0.4, 0.8, -0.15),
      new THREE.Vector3(1.4, 0.3, 0.15),
      new THREE.Vector3(2.18, -0.45, 0)
    );

    return [
      { id: "candidate_1", curve: c1_a, color: "#fbbf24", glow: "#38bdf8", isPrimary: true },
      { id: "candidate_1", curve: c1_b, color: "#38bdf8", glow: "#fbbf24", isPrimary: false },
      { id: "candidate_2", curve: c2_a, color: "#38bdf8", glow: "#ec4899", isPrimary: true },
      { id: "candidate_2", curve: c2_b, color: "#ec4899", glow: "#38bdf8", isPrimary: false },
      { id: "candidate_3", curve: c3_a, color: "#a855f7", glow: "#38bdf8", isPrimary: true },
      { id: "candidate_3", curve: c3_b, color: "#ec4899", glow: "#a855f7", isPrimary: false },
    ];
  }, []);

  // Stage 4: Single backward provenance line
  const provenanceCurve = useMemo(() => {
    return new THREE.CubicBezierCurve3(
      new THREE.Vector3(-2.18, -0.45, 0.15), // Selected candidate locus
      new THREE.Vector3(-1.8, 0.2, 0.3),     // Crossover breakpoint
      new THREE.Vector3(-0.8, 0.9, 0.2),     // Homolog transmission
      new THREE.Vector3(0, 1.35, 0)          // Phenotype effect
    );
  }, []);

  // Flowing particles along all strands
  const particlesPerStrand = 22;
  const totalParticles = particlesPerStrand * strands.length;

  const particlePositions = useMemo(() => new Float32Array(totalParticles * 3), [totalParticles]);
  const particleColors = useMemo(() => new Float32Array(totalParticles * 3), [totalParticles]);
  const particleOffsets = useMemo(
    () => Float32Array.from({ length: totalParticles }, () => Math.random()),
    [totalParticles]
  );

  const particlesRef = useRef<THREE.Points>(null);

  useFrame(({ clock }) => {
    if (activeWorkflowStep === 1) {
      if (groupRef.current) {
        groupRef.current.visible = false;
      }
      return;
    }

    if (groupRef.current) {
      groupRef.current.visible = true;
    }

    // Faster search pulses in Stage 2 (SEARCH), steady in Stage 3 & 4
    const speedMultiplier = activeWorkflowStep === 2 ? 0.8 : 0.3;
    const t = clock.getElapsedTime() * speedMultiplier;
    if (!particlesRef.current) return;

    const posAttr = particlesRef.current.geometry.attributes.position;
    const colAttr = particlesRef.current.geometry.attributes.color;

    strands.forEach((s, sIdx) => {
      const isSelected = selectedCandidateId === s.id;
      for (let p = 0; p < particlesPerStrand; p++) {
        const globalIdx = sIdx * particlesPerStrand + p;
        const progress = (t + particleOffsets[globalIdx]) % 1.0;
        const point = s.curve.getPoint(progress);

        posAttr.setXYZ(globalIdx, point.x, point.y, point.z);

        if (activeWorkflowStep === 2) {
          // Stage 2: Dynamic uniform search pulses (electric cyan / violet)
          colAttr.setXYZ(globalIdx, 0.22, 0.74, 0.97);
        } else if (activeWorkflowStep === 3) {
          // Stage 3: Candidate ranking colors
          if (isSelected) {
            colAttr.setXYZ(globalIdx, 0.98, 0.75, 0.15); // gold
          } else if (s.id === "candidate_1") {
            colAttr.setXYZ(globalIdx, 0.22, 0.74, 0.97); // cyan
          } else if (s.id === "candidate_2") {
            colAttr.setXYZ(globalIdx, 0.92, 0.28, 0.6); // magenta
          } else {
            colAttr.setXYZ(globalIdx, 0.65, 0.33, 0.97); // purple
          }
        } else if (activeWorkflowStep === 4) {
          // Stage 4: Dim unselected, gold for selected
          if (isSelected) {
            colAttr.setXYZ(globalIdx, 0.98, 0.75, 0.15); // gold
          } else {
            colAttr.setXYZ(globalIdx, 0.2, 0.3, 0.4); // dim
          }
        }
      }
    });

    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
  });

  return (
    <group ref={groupRef}>
      {/* Fiber Conduit Strands */}
      {strands.map((item, idx) => {
        const isSelected = selectedCandidateId === item.id;
        const isStage2 = activeWorkflowStep === 2;
        const isStage4 = activeWorkflowStep === 4;

        let radius = isSelected ? (item.isPrimary ? 0.018 : 0.01) : item.isPrimary ? 0.012 : 0.007;
        let opacity = isSelected ? 0.85 : 0.4;
        let tubeColor = isSelected ? "#fbbf24" : item.color;

        if (isStage2) {
          tubeColor = "#38bdf8";
          opacity = 0.6;
        } else if (isStage4) {
          opacity = isSelected ? 0.95 : 0.12;
          radius = isSelected ? 0.022 : 0.005;
        }

        return (
          <group key={idx}>
            <mesh>
              <tubeGeometry args={[item.curve, 44, radius, 8, false]} />
              <meshBasicMaterial
                color={tubeColor}
                transparent
                opacity={opacity}
              />
            </mesh>
            {/* Outer soft glow tube */}
            <mesh>
              <tubeGeometry args={[item.curve, 32, radius * 2.5, 6, false]} />
              <meshBasicMaterial
                color={isStage2 ? "#0284c7" : isSelected ? "#f59e0b" : item.glow}
                transparent
                opacity={opacity * 0.3}
              />
            </mesh>
          </group>
        );
      })}

      {/* STAGE 4: Explicit Backward Provenance Chain Line */}
      {activeWorkflowStep === 4 && (
        <group ref={provenanceGroupRef}>
          {/* Glowing provenance ribbon */}
          <mesh>
            <tubeGeometry args={[provenanceCurve, 64, 0.024, 8, false]} />
            <meshStandardMaterial
              color="#fbbf24"
              emissive="#f59e0b"
              emissiveIntensity={0.9}
              roughness={0.1}
            />
          </mesh>
          <mesh>
            <tubeGeometry args={[provenanceCurve, 32, 0.05, 8, false]} />
            <meshBasicMaterial color="#fbbf24" transparent opacity={0.25} />
          </mesh>

          {/* Breakpoint Waypoint Marker on Provenance Line */}
          <mesh position={[-1.8, 0.2, 0.3]}>
            <sphereGeometry args={[0.07, 16, 16]} />
            <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={0.8} />
          </mesh>
        </group>
      )}

      {/* Animated Flowing Particles */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={totalParticles}
            array={particlePositions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            count={totalParticles}
            array={particleColors}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={activeWorkflowStep === 2 ? 0.055 : 0.045}
          vertexColors
          transparent
          opacity={activeWorkflowStep === 4 ? 0.95 : 0.85}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
};
