"use client";

import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

interface ModelConvergenceProps {
  topY?: number;
  bottomY?: number;
}

export const ModelConvergence: React.FC<ModelConvergenceProps> = ({
  topY = -0.35,
  bottomY = -1.25,
}) => {
  const coneRef = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Points>(null);

  useFrame((state, delta) => {
    if (coneRef.current) {
      coneRef.current.rotation.y += delta * 0.25;
    }
  });

  // Funnel Cone geometry
  const height = topY - bottomY;
  const midY = (topY + bottomY) / 2;

  // Swirling funnel particles
  const particleCount = 60;
  const particlePositions = useMemo(() => new Float32Array(particleCount * 3), [particleCount]);
  const particleColors = useMemo(() => {
    const cols = new Float32Array(particleCount * 3);
    const cCyan = new THREE.Color("#00f0ff");
    const cPurple = new THREE.Color("#a855f7");
    const cGold = new THREE.Color("#fbbf24");

    for (let i = 0; i < particleCount; i++) {
      const pick = Math.random();
      const c = pick < 0.45 ? cCyan : pick < 0.8 ? cPurple : cGold;
      cols[i * 3] = c.r;
      cols[i * 3 + 1] = c.g;
      cols[i * 3 + 2] = c.b;
    }
    return cols;
  }, [particleCount]);

  useFrame((state) => {
    if (!particlesRef.current) return;
    const t = state.clock.getElapsedTime();
    const posAttr = particlesRef.current.geometry.attributes.position;

    for (let i = 0; i < particleCount; i++) {
      const progress = ((i / particleCount) + t * 0.35) % 1.0;
      const y = topY - progress * height;
      // Radius tapers from 0.75 at top to 0.12 at bottom
      const r = 0.75 * (1 - progress) + 0.12 * progress;
      const theta = progress * Math.PI * 8 + (i * 0.4);

      const x = Math.cos(theta) * r;
      const z = Math.sin(theta) * (r * 0.45);
      posAttr.setXYZ(i, x, y, z);
    }
    posAttr.needsUpdate = true;
  });

  return (
    <group>
      {/* Translucent Funnel Cone */}
      <mesh ref={coneRef} position={[0, midY, 0]}>
        <cylinderGeometry args={[0.12, 0.78, height, 32, 1, true]} />
        <meshStandardMaterial
          color="#312e81"
          emissive="#6366f1"
          emissiveIntensity={0.6}
          roughness={0.2}
          metalness={0.2}
          transparent
          opacity={0.35}
          side={THREE.DoubleSide}
          wireframe
        />
      </mesh>

      {/* Swirling funnel particles */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[particlePositions, 3]} />
          <bufferAttribute attach="attributes-color" args={[particleColors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.035}
          vertexColors
          transparent
          opacity={0.85}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
};
