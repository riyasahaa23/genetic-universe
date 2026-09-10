"use client";

import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { useCounterfactual } from "../interactions/CounterfactualInteractionContext";

export const InterventionStream: React.FC = () => {
  const { selectedCandidateType, activeWorkflowStep } = useCounterfactual();
  const pointsRef = useRef<THREE.Points>(null);

  const isStep2 = activeWorkflowStep === 2;
  const isStep3 = activeWorkflowStep === 3;
  const streamOpacity = isStep2 ? 0.9 : isStep3 ? 0.35 : 0.6;

  // Stream colors based on candidate type
  const primaryColor =
    selectedCandidateType === "interaction"
      ? "#818cf8"
      : selectedCandidateType === "segment"
      ? "#f43f5e"
      : "#38bdf8";

  const secondaryColor =
    selectedCandidateType === "interaction"
      ? "#c084fc"
      : selectedCandidateType === "segment"
      ? "#fb7185"
      : "#f6c85f";

  // Define the central flow spline
  const curve = useMemo(() => {
    return new THREE.CatmullRomCurve3([
      new THREE.Vector3(-1.8, 0.25, 0),
      new THREE.Vector3(-0.9, -0.1, 0.3),
      new THREE.Vector3(0, -0.4, 0.45),
      new THREE.Vector3(0.9, -0.1, 0.3),
      new THREE.Vector3(1.8, 0.25, 0),
    ]);
  }, []);

  // Generate particle positions along curve
  const particleCount = 140;
  const { positions, offsets } = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const offs = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      offs[i] = i / particleCount;
      const pt = curve.getPoint(offs[i]);
      // Small lateral jitter
      pos[i * 3] = pt.x + (Math.random() - 0.5) * 0.18;
      pos[i * 3 + 1] = pt.y + (Math.random() - 0.5) * 0.18;
      pos[i * 3 + 2] = pt.z + (Math.random() - 0.5) * 0.18;
    }

    return { positions: pos, offsets: offs };
  }, [curve]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * 0.35;
    if (pointsRef.current) {
      const positionAttr = pointsRef.current.geometry.attributes.position;
      for (let i = 0; i < particleCount; i++) {
        const u = (offsets[i] + t) % 1;
        const pt = curve.getPoint(u);
        const spread = Math.sin(u * Math.PI) * 0.25;
        const angle = i * 0.4 + t * 4;
        positionAttr.setXYZ(
          i,
          pt.x + Math.cos(angle) * spread * 0.4,
          pt.y + Math.sin(angle) * spread * 0.4,
          pt.z + Math.sin(angle * 1.5) * spread * 0.3
        );
      }
      positionAttr.needsUpdate = true;
    }
  });

  return (
    <group>
      {/* Volumetric Glowing Guide Tube */}
      <mesh>
        <tubeGeometry args={[curve, 60, 0.018, 8, false]} />
        <meshBasicMaterial
          color={primaryColor}
          transparent
          opacity={streamOpacity * 0.5}
        />
      </mesh>

      {/* Outer Soft Glow Tube */}
      <mesh>
        <tubeGeometry args={[curve, 40, 0.05, 8, false]} />
        <meshBasicMaterial
          color={secondaryColor}
          transparent
          opacity={streamOpacity * 0.18}
        />
      </mesh>

      {/* Floating Energy Particles */}
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={particleCount}
            array={positions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.055}
          color={primaryColor}
          transparent
          opacity={streamOpacity}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Secondary Sparkles */}
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={Math.floor(particleCount / 2)}
            array={positions.slice(0, Math.floor(particleCount / 2) * 3)}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.04}
          color={secondaryColor}
          transparent
          opacity={streamOpacity * 0.85}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  );
};
