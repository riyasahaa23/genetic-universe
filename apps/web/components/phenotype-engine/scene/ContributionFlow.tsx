"use client";

import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { usePhenotypeInteraction } from "../interactions/PhenotypeInteractionContext";

interface ContributionFlowProps {
  fromY?: number;
  toY?: number;
}

export const ContributionFlow: React.FC<ContributionFlowProps> = ({
  fromY = 1.5,
  toY = 1.0,
}) => {
  const particlesRef = useRef<THREE.Points>(null);
  const { activeComponent } = usePhenotypeInteraction();

  // 6 descending spline paths from chromosomes to Layer 1
  const paths = useMemo(() => {
    return [
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.85, fromY, 0),
        new THREE.Vector3(-0.95, (fromY + toY) / 2, 0.1),
        new THREE.Vector3(-1.05, toY, 0),
      ]),
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.55, fromY, 0),
        new THREE.Vector3(-0.5, (fromY + toY) / 2, -0.05),
        new THREE.Vector3(-0.45, toY, 0),
      ]),
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.15, fromY, 0),
        new THREE.Vector3(-0.1, (fromY + toY) / 2, 0.05),
        new THREE.Vector3(0.0, toY, 0),
      ]),
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.15, fromY, 0),
        new THREE.Vector3(0.1, (fromY + toY) / 2, -0.05),
        new THREE.Vector3(0.0, toY, 0),
      ]),
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.55, fromY, 0),
        new THREE.Vector3(0.5, (fromY + toY) / 2, 0.05),
        new THREE.Vector3(0.45, toY, 0),
      ]),
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.85, fromY, 0),
        new THREE.Vector3(0.95, (fromY + toY) / 2, -0.1),
        new THREE.Vector3(1.05, toY, 0),
      ]),
    ];
  }, [fromY, toY]);

  // Static tube meshes for the flow lines
  const lineGeos = useMemo(() => {
    return paths.map((p) => new THREE.TubeGeometry(p, 20, 0.012, 6, false));
  }, [paths]);

  // Animated particles along the flow lines
  const particleCount = 42;
  const particlePositions = useMemo(() => new Float32Array(particleCount * 3), [particleCount]);
  const particleColors = useMemo(() => {
    const cols = new Float32Array(particleCount * 3);
    const cCyan = new THREE.Color("#00f0ff");
    const cPurple = new THREE.Color("#c084fc");
    const cPink = new THREE.Color("#ec4899");

    for (let i = 0; i < particleCount; i++) {
      const pIdx = i % 6;
      const c = pIdx < 2 ? cCyan : pIdx < 4 ? cPurple : cPink;
      cols[i * 3] = c.r;
      cols[i * 3 + 1] = c.g;
      cols[i * 3 + 2] = c.b;
    }
    return cols;
  }, [particleCount]);

  useFrame((state) => {
    if (!particlesRef.current) return;
    const t = state.clock.getElapsedTime();
    const speed = 0.45;
    const posAttr = particlesRef.current.geometry.attributes.position;

    for (let i = 0; i < particleCount; i++) {
      const pIdx = i % 6;
      const offset = (Math.floor(i / 6) / (particleCount / 6) + t * speed) % 1.0;
      const pt = paths[pIdx].getPoint(offset);
      posAttr.setXYZ(i, pt.x, pt.y, pt.z);
    }
    posAttr.needsUpdate = true;
  });

  return (
    <group>
      {lineGeos.map((geo, idx) => (
        <mesh key={idx} geometry={geo}>
          <meshBasicMaterial
            color={idx < 2 ? "#38bdf8" : idx < 4 ? "#c084fc" : "#f472b6"}
            transparent
            opacity={activeComponent === "dominance" || activeComponent === "epistasis" ? 0.25 : 0.6}
          />
        </mesh>
      ))}

      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[particlePositions, 3]} />
          <bufferAttribute attach="attributes-color" args={[particleColors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.038}
          vertexColors
          transparent
          opacity={0.9}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
};
