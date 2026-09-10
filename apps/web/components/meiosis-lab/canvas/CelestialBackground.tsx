"use client";

import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

export const CelestialBackground: React.FC = () => {
  const planetRef = useRef<THREE.Mesh>(null);
  const atmosphereRef = useRef<THREE.Mesh>(null);
  const haloRef = useRef<THREE.Mesh>(null);
  const nebulaRef = useRef<THREE.Points>(null);

  // Procedural noise bump/roughness for the cellular planet
  useFrame((_, delta) => {
    if (planetRef.current) {
      planetRef.current.rotation.y += delta * 0.02;
    }
    if (atmosphereRef.current) {
      atmosphereRef.current.rotation.y -= delta * 0.01;
    }
  });

  // Soft nebular dust web in the background
  const nebulaGeo = useMemo(() => {
    const count = 350;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    const cCyan = new THREE.Color("#0284c7");
    const cDeepBlue = new THREE.Color("#1e1b4b");
    const cViolet = new THREE.Color("#312e81");

    for (let i = 0; i < count; i++) {
      // Clustered along center and bottom left
      const r = Math.random() * 8;
      const theta = Math.random() * Math.PI * 2;
      positions[i * 3] = -2 + Math.cos(theta) * r;
      positions[i * 3 + 1] = -1 + Math.sin(theta) * r * 0.7;
      positions[i * 3 + 2] = -4.5 - Math.random() * 4;

      const pick = Math.random();
      const col = pick < 0.5 ? cCyan : pick < 0.8 ? cDeepBlue : cViolet;
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return geo;
  }, []);

  return (
    <group>
      {/* Deep Space Nebular Web */}
      <points ref={nebulaRef} geometry={nebulaGeo}>
        <pointsMaterial
          size={0.18}
          vertexColors
          transparent
          opacity={0.35}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Large Glowing Cellular Sphere in Lower-Left Corner */}
      <group position={[-4.5, -3.2, -3.2]} scale={2.8}>
        {/* Main Textured Sphere Body */}
        <mesh ref={planetRef}>
          <sphereGeometry args={[1, 48, 48]} />
          <meshStandardMaterial
            color="#081b3b"
            emissive="#034570"
            emissiveIntensity={0.6}
            roughness={0.7}
            metalness={0.1}
            wireframe={false}
          />
        </mesh>

        {/* Luminous Atmospheric Glow Rim */}
        <mesh ref={atmosphereRef}>
          <sphereGeometry args={[1.02, 40, 40]} />
          <meshStandardMaterial
            color="#00f0ff"
            emissive="#38bdf8"
            emissiveIntensity={0.7}
            roughness={0.2}
            metalness={0.1}
            transparent
            opacity={0.25}
          />
        </mesh>

        {/* Outer Radiant Rim Ring */}
        <mesh ref={haloRef} rotation={[0.4, 0.6, 0]}>
          <ringGeometry args={[1.01, 1.08, 48]} />
          <meshBasicMaterial
            color="#38bdf8"
            transparent
            opacity={0.45}
            blending={THREE.AdditiveBlending}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>
    </group>
  );
};
