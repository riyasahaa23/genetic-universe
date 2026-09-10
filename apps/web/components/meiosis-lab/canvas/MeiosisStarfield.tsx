"use client";

import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

export const MeiosisStarfield: React.FC = () => {
  const starRef = useRef<THREE.Points>(null);

  const starGeo = useMemo(() => {
    const count = 650;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    const cCyan = new THREE.Color("#38bdf8");
    const cMagenta = new THREE.Color("#f472b6");
    const cGold = new THREE.Color("#fde047");
    const cWhite = new THREE.Color("#f8fafc");

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 32;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 22;
      positions[i * 3 + 2] = -2.5 - Math.random() * 7;

      const pick = Math.random();
      const col = pick < 0.45 ? cWhite : pick < 0.7 ? cCyan : pick < 0.88 ? cMagenta : cGold;
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return geo;
  }, []);

  useFrame((_, delta) => {
    if (starRef.current) {
      starRef.current.rotation.y += delta * 0.003;
    }
  });

  return (
    <points ref={starRef} geometry={starGeo}>
      <pointsMaterial
        size={0.038}
        vertexColors
        transparent
        opacity={0.65}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};
