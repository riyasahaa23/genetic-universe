"use client";

import React, { Suspense } from "react";
import * as THREE from "three";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { MeiosisStarfield } from "@/components/meiosis-lab/canvas/MeiosisStarfield";
import { usePhenotypeInteraction } from "../interactions/PhenotypeInteractionContext";
import { GenotypeInput } from "./GenotypeInput";
import { ContributionFlow } from "./ContributionFlow";
import { AdditiveLayer } from "./AdditiveLayer";
import { DominanceLayer } from "./DominanceLayer";
import { EpistasisLayer } from "./EpistasisLayer";
import { ModelConvergence } from "./ModelConvergence";
import { PhenotypeSphere } from "./PhenotypeSphere";

const SceneCameraController: React.FC = () => {
  const { activeMode } = usePhenotypeInteraction();
  const { camera } = useThree();

  useFrame((_, delta) => {
    let targetY = 0.22;
    let targetZ = 8.6;
    if (activeMode === "genotype") {
      targetY = 0.92;
      targetZ = 7.8;
    } else if (activeMode === "interaction") {
      targetY = 0.32;
      targetZ = 8.2;
    } else if (activeMode === "phenotype") {
      targetY = -0.52;
      targetZ = 7.6;
    }

    camera.position.y = THREE.MathUtils.damp(camera.position.y, targetY, 3.5, delta);
    camera.position.z = THREE.MathUtils.damp(camera.position.z, targetZ, 3.5, delta);
  });

  return null;
};

export const PhenotypeEngineScene: React.FC = () => {
  return (
    <div className="absolute inset-0 w-full h-full pointer-events-auto">
      <Canvas
        camera={{ position: [0, 0.22, 8.6], fov: 42 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        dpr={[1, 2]}
      >
        <SceneCameraController />
        {/* Cinematic Ambient & Directional Lights */}
        <ambientLight intensity={0.45} />
        <directionalLight position={[6, 8, 5]} intensity={1.2} color="#ffffff" />
        <directionalLight position={[-6, -4, 4]} intensity={0.6} color="#38bdf8" />
        <directionalLight position={[6, -4, 4]} intensity={0.6} color="#ec4899" />

        {/* Layer Point Lights */}
        <pointLight position={[0, 2.1, 2]} intensity={1.4} color="#00f0ff" distance={6} />
        <pointLight position={[0, 0.95, 2]} intensity={1.5} color="#38bdf8" distance={6} />
        <pointLight position={[0, 0.35, 2]} intensity={1.5} color="#c084fc" distance={6} />
        <pointLight position={[0, -0.25, 2]} intensity={2.0} color="#fbbf24" distance={7} />
        <pointLight position={[0, -1.5, 2.2]} intensity={2.2} color="#38bdf8" distance={7} />

        <Suspense fallback={null}>
          <MeiosisStarfield />

          {/* Top: Genotype Input Chromosomes */}
          <GenotypeInput position={[0, 2.15, 0]} />

          {/* Locus information flow to Layer 1 */}
          <ContributionFlow fromY={1.45} toY={0.95} />

          {/* Layer 1: Additive Effects */}
          <AdditiveLayer position={[0, 0.95, 0]} />

          {/* Layer 2: Dominance Effects */}
          <DominanceLayer position={[0, 0.35, 0]} />

          {/* Layer 3: Epistatic Network */}
          <EpistasisLayer position={[0, -0.25, 0]} />

          {/* Non-linear Funnel Convergence */}
          <ModelConvergence topY={-0.35} bottomY={-1.25} />

          {/* Bottom: Emergent Phenotype Sphere */}
          <PhenotypeSphere position={[0, -1.52, 0]} />
        </Suspense>
      </Canvas>
    </div>
  );
};
