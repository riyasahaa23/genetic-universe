"use client";

import React, { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ParentPotential } from "./ParentPotential";
import { RecombinationBridge } from "./RecombinationBridge";
import { OffspringPotential } from "./OffspringPotential";
import { Chromosome } from "@/components/genetic-universe/Chromosome";

// Soft blurred background chromosomes to create cinematic depth of field
const BokehBackgroundChromosomes: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);

  const bokehChroms = useMemo(() => {
    return [
      // Top right behind Parent B
      { pos: [4.2, 2.5, -5.5] as [number, number, number], rot: [0.3, 0.4, 0.6] as [number, number, number], scale: 0.65, type: "parent_b" as const },
      // Top left behind Parent A
      { pos: [-4.2, 2.7, -5.5] as [number, number, number], rot: [-0.2, -0.3, -0.4] as [number, number, number], scale: 0.6, type: "parent_a" as const },
      // Mid right
      { pos: [4.6, 0.2, -5.0] as [number, number, number], rot: [0.5, -0.2, 0.8] as [number, number, number], scale: 0.7, type: "parent_a" as const },
      // Mid left (subtle behind hero text)
      { pos: [-4.5, 0.1, -5.5] as [number, number, number], rot: [-0.4, 0.5, -0.6] as [number, number, number], scale: 0.6, type: "parent_b" as const },
    ];
  }, []);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.01;
    }
  });

  return (
    <group ref={groupRef}>
      {bokehChroms.map((c, i) => (
        <group key={i} position={c.pos} rotation={c.rot} scale={c.scale}>
          <Chromosome
            type={c.type}
            position={[0, 0, 0]}
            rotation={[0, 0, 0]}
            scale={1}
            isHovered={false}
          />
        </group>
      ))}
    </group>
  );
};

// Distant cosmic starfield
const CosmicStarfield: React.FC = () => {
  const starRef = useRef<THREE.Points>(null);

  const starGeo = useMemo(() => {
    const count = 750;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    const cCyan = new THREE.Color("#38bdf8");
    const cMagenta = new THREE.Color("#f472b6");
    const cGold = new THREE.Color("#fde047");
    const cWhite = new THREE.Color("#f8fafc");

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 36;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 24;
      positions[i * 3 + 2] = -3 - Math.random() * 8;

      const pick = Math.random();
      const col = pick < 0.5 ? cWhite : pick < 0.75 ? cCyan : pick < 0.9 ? cMagenta : cGold;
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
        size={0.04}
        vertexColors
        transparent
        opacity={0.65}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

import { useParadoxInteraction } from "./interactions/ParadoxInteractionContext";

export const ParadoxScene: React.FC = () => {
  const { isExplorationMode } = useParadoxInteraction();

  const posA: [number, number, number] = [-1.30, 1.70, 0];
  const posB: [number, number, number] = [1.30, 1.70, 0];
  const posOffspring: [number, number, number] = [0, 0.72, 0];

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-auto">
      <Canvas
        camera={{ position: [0, 0, 8.8], fov: 42 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        dpr={[1, 2]}
      >
        {/* Soft Ambient Lighting for deep dark scientific mood */}
        <ambientLight intensity={isExplorationMode ? 0.55 : 0.45} />

        {/* Directional Key Lights */}
        <directionalLight position={[6, 8, 5]} intensity={isExplorationMode ? 1.4 : 1.2} color="#ffffff" />
        <directionalLight position={[-6, -4, 4]} intensity={isExplorationMode ? 0.8 : 0.6} color="#38bdf8" />
        <directionalLight position={[6, -4, 4]} intensity={isExplorationMode ? 0.8 : 0.6} color="#f472b6" />

        {/* Deep space accents */}
        <pointLight position={[-1.30, 1.70, 2]} intensity={isExplorationMode ? 1.8 : 1.2} color="#00f0ff" distance={8} />
        <pointLight position={[1.30, 1.70, 2]} intensity={isExplorationMode ? 1.8 : 1.2} color="#ec4899" distance={8} />
        <pointLight position={[0, 0.72, 2.5]} intensity={isExplorationMode ? 2.4 : 1.8} color="#fbbf24" distance={9} />

        <Suspense fallback={null}>
          <CosmicStarfield />
          <BokehBackgroundChromosomes />
          <ParentPotential parentId="A" position={posA} />
          <ParentPotential parentId="B" position={posB} />
          <RecombinationBridge posA={posA} posB={posB} posOffspring={posOffspring} />
          <OffspringPotential position={posOffspring} />
        </Suspense>
      </Canvas>
    </div>
  );
};
