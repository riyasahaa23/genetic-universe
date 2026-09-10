"use client";

import React, { useRef, Suspense } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { ParentGenome } from "./ParentGenome";
import { OffspringGenome } from "./OffspringGenome";
import { RecombinationFlow } from "./RecombinationFlow";
import { CelestialBackground } from "./CelestialBackground";
import { useInteraction } from "./context/InteractionContext";

const CameraRig: React.FC = () => {
  const { reducedMotion } = useInteraction();

  useFrame((state) => {
    if (reducedMotion) return;

    // Smooth subtle mouse parallax
    const targetX = state.pointer.x * 0.35;
    const targetY = state.pointer.y * 0.22;

    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, targetX, 0.04);
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, targetY, 0.04);

    // Subtle camera breathing
    const t = state.clock.getElapsedTime();
    state.camera.position.z = 11.0 + Math.sin(t * 0.4) * 0.04;
    state.camera.lookAt(0, 0, 0);
  });

  return null;
};

export const GenomeScene: React.FC = () => {
  return (
    <div className="absolute inset-0 w-full h-full pointer-events-auto">
      <Canvas
        camera={{ position: [0, 0, 11], fov: 42, near: 0.1, far: 100 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          <CameraRig />

          {/* Global Environmental Lighting */}
          <ambientLight intensity={0.75} color="#0c1836" />
          <directionalLight position={[-6, 8, 6]} intensity={1.8} color="#00e5ff" />
          <directionalLight position={[6, 8, 6]} intensity={1.6} color="#ec4899" />
          <directionalLight position={[0, -3, 5]} intensity={1.4} color="#fbbf24" />
          <pointLight position={[0, 0.5, 3]} intensity={1.5} color="#ffffff" distance={10} />

          {/* Soft Localized Volumetric Point Glows (seamlessly integrates with starfield) */}
          <pointLight position={[-2.95, 1.45, 1]} intensity={1.8} color="#00f0ff" distance={7} />
          <pointLight position={[2.95, 1.45, 1]} intensity={1.8} color="#ec4899" distance={7} />
          <pointLight position={[0, 0.10, 1.2]} intensity={2.2} color="#fbbf24" distance={7} />

          {/* Cosmic Starfield & Planetary Horizon */}
          <CelestialBackground />

          {/* Parent A (Upper Left) */}
          <ParentGenome parentId="A" position={[-2.95, 1.45, 0]} />

          {/* Parent B (Upper Right) */}
          <ParentGenome parentId="B" position={[2.95, 1.45, 0]} />

          {/* Meiosis & Recombination DNA Flow */}
          <RecombinationFlow />

          {/* Offspring Genome (Center Hero Object, elevated cleanly above bottom cards) */}
          <OffspringGenome position={[0, 0.10, 0]} />
        </Suspense>
      </Canvas>
    </div>
  );
};
