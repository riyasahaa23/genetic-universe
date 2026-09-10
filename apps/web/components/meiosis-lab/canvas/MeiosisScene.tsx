"use client";

import React, { Suspense, useEffect, useRef } from "react";
import * as THREE from "three";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { useMeiosisInteraction } from "../interactions/MeiosisInteractionContext";
import { MeiosisStarfield } from "./MeiosisStarfield";
import { CelestialBackground } from "./CelestialBackground";
import { HomologPairing3D } from "./HomologPairing3D";
import { ChiasmaCrossover3D } from "./ChiasmaCrossover3D";
import { RecombinantChromatids3D } from "./RecombinantChromatids3D";
import { SegregationFlow3D } from "./SegregationFlow3D";
import { HaploidGametes3D } from "./HaploidGametes3D";

const MeiosisCameraController: React.FC = () => {
  const { camera } = useThree();
  const {
    activePhase,
    compareGametes,
    isExplorationMode,
    reducedMotion,
  } = useMeiosisInteraction();

  const targetPos = useRef(new THREE.Vector3(0, 0.12, 8.5));
  const targetLookAt = useRef(new THREE.Vector3(0, 0.12, 0));

  useEffect(() => {
    if (compareGametes) {
      targetPos.current.set(0, -1.8, 6.2);
      targetLookAt.current.set(0, -1.8, 0);
    } else if (isExplorationMode || activePhase !== 0) {
      if (activePhase === 0) {
        // Prophase I: Homolog pairing + crossover
        targetPos.current.set(0, 1.4, 7.6);
        targetLookAt.current.set(0, 1.4, 0);
      } else if (activePhase === 1) {
        // Metaphase I: Equatorial alignment
        targetPos.current.set(0, 1.0, 7.6);
        targetLookAt.current.set(0, 1.0, 0);
      } else if (activePhase === 2) {
        // Anaphase I: Reductional separation
        targetPos.current.set(0, 0.4, 8.0);
        targetLookAt.current.set(0, 0.4, 0);
      } else if (activePhase === 3) {
        // Telophase I & Meiosis II: 4 Gametes
        targetPos.current.set(0, -1.2, 7.6);
        targetLookAt.current.set(0, -1.2, 0);
      }
    } else {
      // Default overview
      targetPos.current.set(0, 0.12, 8.5);
      targetLookAt.current.set(0, 0.12, 0);
    }
  }, [activePhase, compareGametes, isExplorationMode]);

  useFrame((_, delta) => {
    if (reducedMotion) {
      camera.position.copy(targetPos.current);
      camera.lookAt(targetLookAt.current);
      return;
    }
    const factor = Math.min(1, delta * 3.2);
    camera.position.lerp(targetPos.current, factor);
    camera.lookAt(targetLookAt.current);
  });

  return null;
};

export const MeiosisScene: React.FC = () => {
  return (
    <div className="absolute inset-0 w-full h-full pointer-events-auto">
      <Canvas
        camera={{ position: [0, 0.12, 8.5], fov: 42 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        dpr={[1, 2]}
      >
        <MeiosisCameraController />
        {/* Ambient & Key Lights */}
        <ambientLight intensity={0.45} />
        <directionalLight position={[6, 8, 5]} intensity={1.2} color="#ffffff" />
        <directionalLight position={[-6, -4, 4]} intensity={0.6} color="#38bdf8" />
        <directionalLight position={[6, -4, 4]} intensity={0.6} color="#ec4899" />

        {/* Stage specific focal lights */}
        <pointLight position={[-1.15, 1.95, 2]} intensity={1.4} color="#00f0ff" distance={6} />
        <pointLight position={[1.15, 1.95, 2]} intensity={1.4} color="#ec4899" distance={6} />
        <pointLight position={[0, 0.82, 2.2]} intensity={2.0} color="#fbbf24" distance={7} />
        <pointLight position={[0, -0.22, 2]} intensity={1.2} color="#38bdf8" distance={6} />
        <pointLight position={[0, -1.82, 2.2]} intensity={1.5} color="#818cf8" distance={7} />

        <Suspense fallback={null}>
          <MeiosisStarfield />
          <CelestialBackground />

          {/* Stage 1: Homolog Pairing (Synapsis) */}
          <HomologPairing3D position={[0, 1.95, 0]} />

          {/* Stage 2: Crossover (Chiasma) */}
          <ChiasmaCrossover3D position={[0, 0.82, 0]} />

          {/* Stage 3: Recombinant Chromatids */}
          <RecombinantChromatids3D position={[0, -0.22, 0]} />

          {/* Stage 4: Segregation Flow Conduits */}
          <SegregationFlow3D topY={-0.55} bottomY={-1.45} />

          {/* Stage 5: Haploid Gametes */}
          <HaploidGametes3D position={[0, -1.82, 0]} />
        </Suspense>
      </Canvas>
    </div>
  );
};
