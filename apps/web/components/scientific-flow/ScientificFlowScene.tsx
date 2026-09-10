"use client";

import React, { useRef, Suspense } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { FLOW_STAGES } from "./types";
import { CelestialBackground } from "../genetic-universe/CelestialBackground";
import { ParentsStage } from "./stages/ParentsStage";
import { HaplotypesStage } from "./stages/HaplotypesStage";
import { MeiosisStage } from "./stages/MeiosisStage";
import { RecombinationStage } from "./stages/RecombinationStage";
import { OffspringStage } from "./stages/OffspringStage";
import { PhenotypeStage } from "./stages/PhenotypeStage";
import { NoveltyStage } from "./stages/NoveltyStage";
import { TraceStage } from "./stages/TraceStage";
import { RescueStage } from "./stages/RescueStage";
import { SummaryStage } from "./stages/SummaryStage";

interface CameraControllerProps {
  stageIndex: number;
  reducedMotion?: boolean;
}

const CameraController: React.FC<CameraControllerProps> = ({ stageIndex, reducedMotion }) => {
  const currentTarget = useRef(new THREE.Vector3(0, 0, 0));

  useFrame((state) => {
    const config = FLOW_STAGES[stageIndex] || FLOW_STAGES[0];
    const targetPos = new THREE.Vector3(...config.cameraPosition);
    const targetLook = new THREE.Vector3(...config.cameraTarget);

    if (reducedMotion) {
      state.camera.position.copy(targetPos);
      state.camera.lookAt(targetLook);
      return;
    }

    // Cinematic smooth damping
    state.camera.position.lerp(targetPos, 0.045);
    currentTarget.current.lerp(targetLook, 0.045);
    state.camera.lookAt(currentTarget.current);
  });

  return null;
};

interface ScientificFlowSceneProps {
  stageIndex: number;
  reducedMotion?: boolean;
}

export const ScientificFlowScene: React.FC<ScientificFlowSceneProps> = ({
  stageIndex,
  reducedMotion = false,
}) => {
  return (
    <div className="absolute inset-0 w-full h-full pointer-events-auto select-none">
      <Canvas
        camera={{ position: [0, 0.8, 10.5], fov: 42, near: 0.1, far: 100 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          <CameraController stageIndex={stageIndex} reducedMotion={reducedMotion} />

          {/* Environmental Global Lighting */}
          <ambientLight intensity={0.7} color="#0c1836" />
          <directionalLight position={[-6, 8, 6]} intensity={1.8} color="#00e5ff" />
          <directionalLight position={[6, 8, 6]} intensity={1.6} color="#ec4899" />
          <directionalLight position={[0, -3, 5]} intensity={1.4} color="#fbbf24" />
          <pointLight position={[0, 0.5, 3]} intensity={1.5} color="#ffffff" distance={10} />

          {/* Celestial Cosmic Starfield */}
          <CelestialBackground />

          {/* Stage 3D Choreography */}
          {stageIndex === 0 && <ParentsStage />}
          {stageIndex === 1 && <HaplotypesStage />}
          {stageIndex === 2 && <MeiosisStage />}
          {stageIndex === 3 && <RecombinationStage />}
          {stageIndex === 4 && <OffspringStage />}
          {stageIndex === 5 && <PhenotypeStage />}
          {stageIndex === 6 && <NoveltyStage />}
          {stageIndex === 7 && <TraceStage />}
          {stageIndex === 8 && <RescueStage />}
          {stageIndex === 9 && <SummaryStage />}
        </Suspense>
      </Canvas>
    </div>
  );
};
