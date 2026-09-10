"use client";

import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

export const CelestialBackground: React.FC = () => {
  const starsRef = useRef<THREE.Points>(null);

  // Starfield particles
  const starCount = 900;
  const starGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);

    const color1 = new THREE.Color("#e0f2fe"); // Icy blue
    const color2 = new THREE.Color("#fef08a"); // Pale gold
    const color3 = new THREE.Color("#fbcfe8"); // Pale pink

    for (let i = 0; i < starCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 40;
      positions[i * 3 + 1] = (Math.random() - 0.1) * 26;
      positions[i * 3 + 2] = -3 - Math.random() * 12;

      const pick = Math.random();
      const col = pick < 0.7 ? color1 : pick < 0.85 ? color2 : color3;
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
    }

    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return geo;
  }, []);

  useFrame((state, delta) => {
    if (starsRef.current) {
      starsRef.current.rotation.y += delta * 0.003;
      starsRef.current.rotation.x += delta * 0.0015;
    }
  });

  return (
    <group>
      {/* Distant Starfield */}
      <points ref={starsRef} geometry={starGeo}>
        <pointsMaterial
          size={0.06}
          vertexColors
          transparent
          opacity={0.85}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Atmospheric Curved Planetary Horizon across bottom */}
      <group position={[0, -29.2, -1]}>
        {/* Bright Electric Cyan Atmospheric Rim Arc Line */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[26, 0.06, 16, 180]} />
          <meshBasicMaterial
            color="#00f0ff"
            transparent
            opacity={0.85}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        {/* Soft Sky Blue Atmospheric Rim Glow */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[26, 0.28, 16, 180]} />
          <meshBasicMaterial
            color="#38bdf8"
            transparent
            opacity={0.45}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        {/* Diffuse Outer Atmospheric Haze */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[26, 0.75, 16, 180]} />
          <meshBasicMaterial
            color="#0284c7"
            transparent
            opacity={0.2}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </group>
    </group>
  );
};
