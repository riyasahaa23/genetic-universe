"use client";

import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useMeiosisInteraction } from "../interactions/MeiosisInteractionContext";

interface SegregationFlow3DProps {
  topY?: number;
  bottomY?: number;
}

export const SegregationFlow3D: React.FC<SegregationFlow3DProps> = ({
  topY = -0.5,
  bottomY = -1.35,
}) => {
  const particlesRef = useRef<THREE.Points>(null);
  const {
    animateProgression,
    selectedChromatid,
    selectedGamete,
    selectedHomolog,
    hoveredElement,
  } = useMeiosisInteraction();

  // Create 4 curved paths
  const paths = useMemo(() => {
    return [
      // 1: from -0.78 to -1.2
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.78, topY, 0),
        new THREE.Vector3(-0.95, (topY + bottomY) / 2, 0.05),
        new THREE.Vector3(-1.20, bottomY, 0),
      ]),
      // 2: from -0.26 to -0.4
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.26, topY, 0),
        new THREE.Vector3(-0.32, (topY + bottomY) / 2, 0.02),
        new THREE.Vector3(-0.40, bottomY, 0),
      ]),
      // 3: from 0.26 to 0.4
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.26, topY, 0),
        new THREE.Vector3(0.32, (topY + bottomY) / 2, 0.02),
        new THREE.Vector3(0.40, bottomY, 0),
      ]),
      // 4: from 0.78 to 1.2
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.78, topY, 0),
        new THREE.Vector3(0.95, (topY + bottomY) / 2, 0.05),
        new THREE.Vector3(1.20, bottomY, 0),
      ]),
    ];
  }, [topY, bottomY]);

  // Check which path is active
  const isPathActive = (idx: number) => {
    if (idx === 0 && (selectedChromatid === "chromatid_1" || selectedGamete === "gamete_1" || hoveredElement === "chromatid_1" || hoveredElement === "gamete_1" || selectedHomolog === "maternal")) return true;
    if (idx === 1 && (selectedChromatid === "chromatid_3" || selectedGamete === "gamete_2" || hoveredElement === "chromatid_3" || hoveredElement === "gamete_2" || selectedHomolog === "maternal")) return true;
    if (idx === 2 && (selectedChromatid === "chromatid_4" || selectedGamete === "gamete_3" || hoveredElement === "chromatid_4" || hoveredElement === "gamete_3" || selectedHomolog === "paternal")) return true;
    if (idx === 3 && (selectedChromatid === "chromatid_2" || selectedGamete === "gamete_4" || hoveredElement === "chromatid_2" || hoveredElement === "gamete_4" || selectedHomolog === "paternal")) return true;
    return false;
  };

  // Static tube meshes for the curved guide lines
  const lineGeos = useMemo(() => {
    return paths.map((p) => new THREE.TubeGeometry(p, 24, 0.014, 6, false));
  }, [paths]);

  // Animated flow particles along the 4 paths
  const particleCount = 48;
  const particlePositions = useMemo(() => new Float32Array(particleCount * 3), [particleCount]);
  const particleColors = useMemo(() => {
    const cols = new Float32Array(particleCount * 3);
    const cCyan = new THREE.Color("#00f0ff");
    const cPurple = new THREE.Color("#818cf8");
    const cPink = new THREE.Color("#ec4899");

    for (let i = 0; i < particleCount; i++) {
      const pathIdx = i % 4;
      const c = pathIdx === 0 ? cCyan : pathIdx === 1 || pathIdx === 2 ? cPurple : cPink;
      cols[i * 3] = c.r;
      cols[i * 3 + 1] = c.g;
      cols[i * 3 + 2] = c.b;
    }
    return cols;
  }, [particleCount]);

  useFrame((state) => {
    if (!particlesRef.current) return;
    const t = state.clock.getElapsedTime();
    const baseSpeed = animateProgression ? 0.35 : 0.08;
    const posAttr = particlesRef.current.geometry.attributes.position;

    for (let i = 0; i < particleCount; i++) {
      const pathIdx = i % 4;
      const speed = isPathActive(pathIdx) ? baseSpeed * 1.6 : baseSpeed;
      const offset = (Math.floor(i / 4) / (particleCount / 4) + t * speed) % 1.0;
      const pt = paths[pathIdx].getPoint(offset);
      posAttr.setXYZ(i, pt.x, pt.y, pt.z);
    }
    posAttr.needsUpdate = true;
  });

  return (
    <group>
      {/* 4 Flow line tubes */}
      {lineGeos.map((geo, idx) => {
        const active = isPathActive(idx);
        return (
          <mesh key={idx} geometry={geo}>
            <meshBasicMaterial
              color={
                idx === 0
                  ? active ? "#00f0ff" : "#0284c7"
                  : idx === 3
                  ? active ? "#f43f5e" : "#be185d"
                  : active ? "#c084fc" : "#6366f1"
              }
              transparent
              opacity={active ? 0.9 : 0.35}
            />
          </mesh>
        );
      })}

      {/* Downward moving particles */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[particlePositions, 3]}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[particleColors, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.04}
          vertexColors
          transparent
          opacity={0.95}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
};
