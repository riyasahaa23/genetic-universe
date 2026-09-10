"use client";

import React, { useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { OriginalChromosome } from "./OriginalChromosome";
import { ModifiedChromosome } from "./ModifiedChromosome";
import { InterventionStream } from "./InterventionStream";

const AmbientParticleField: React.FC = () => {
  const count = 300;
  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 22;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 14;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 8 - 3;

      const rand = Math.random();
      if (rand < 0.45) {
        col[i * 3] = 0.22; // cyan
        col[i * 3 + 1] = 0.74;
        col[i * 3 + 2] = 0.97;
      } else if (rand < 0.75) {
        col[i * 3] = 0.95; // pink/magenta
        col[i * 3 + 1] = 0.28;
        col[i * 3 + 2] = 0.65;
      } else {
        col[i * 3] = 0.96; // gold
        col[i * 3 + 1] = 0.78;
        col[i * 3 + 2] = 0.37;
      }
    }
    return [pos, col];
  }, [count]);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={count}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.035}
        vertexColors
        transparent
        opacity={0.5}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

import { useCounterfactual } from "../interactions/CounterfactualInteractionContext";

export const CounterfactualScene: React.FC = () => {
  const { activeWorkflowStep } = useCounterfactual();
  const showCounterfactual = activeWorkflowStep >= 2;

  return (
    <div className="w-full h-full relative">
      <Canvas
        camera={{ position: [0, 0, 5.8], fov: 44 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.65} />
        <pointLight position={[0, 3, 3]} intensity={1.6} />
        <pointLight position={[-3.5, 0.5, 2]} intensity={1.5} color="#ec4899" />
        <pointLight position={[3.5, 0.5, 2]} intensity={1.5} color="#38bdf8" />
        <pointLight position={[0, -1.5, 2]} intensity={1.2} color="#f6c85f" />
        <directionalLight position={[0, 4, 5]} intensity={0.7} />

        {/* Ambient starry backdrop */}
        <AmbientParticleField />

        {/* Dynamic Energy Stream connecting Original to Modified */}
        {showCounterfactual && <InterventionStream />}

        {/* Left: Original Chromosome Configuration */}
        <OriginalChromosome position={[-2.65, 0.05, 0]} scale={1.32} />

        {/* Right: Modified Chromosome Configuration (revealed in Steps 2-4) */}
        {showCounterfactual && (
          <ModifiedChromosome position={[1.15, 0.05, 0]} scale={1.32} />
        )}
      </Canvas>
    </div>
  );
};
