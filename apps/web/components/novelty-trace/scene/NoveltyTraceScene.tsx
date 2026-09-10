"use client";

import React, { useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { ObservedPhenotype } from "./ObservedPhenotype";
import { TracePaths } from "./TracePaths";
import { CandidateConfiguration } from "./CandidateConfiguration";
import { useNoveltyTrace } from "../interactions/NoveltyTraceInteractionContext";

const BackgroundStars: React.FC = () => {
  const count = 300;
  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 22;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 16;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 10 - 4;

      const rand = Math.random();
      if (rand < 0.4) {
        col[i * 3] = 0.22;
        col[i * 3 + 1] = 0.74;
        col[i * 3 + 2] = 0.97;
      } else if (rand < 0.7) {
        col[i * 3] = 0.92;
        col[i * 3 + 1] = 0.28;
        col[i * 3 + 2] = 0.6;
      } else {
        col[i * 3] = 0.98;
        col[i * 3 + 1] = 0.85;
        col[i * 3 + 2] = 0.4;
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

export const NoveltyTraceScene: React.FC = () => {
  const { candidates } = useNoveltyTrace();

  return (
    <div className="w-full h-full relative">
      <Canvas
        camera={{ position: [0, 0.45, 6.7], fov: 46 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.45} />
        <pointLight position={[0, 4, 3]} intensity={1.5} />
        <pointLight position={[-4, -1, 2]} intensity={1.0} color="#38bdf8" />
        <pointLight position={[4, -1, 2]} intensity={1.0} color="#ec4899" />
        <directionalLight position={[0, 5, 5]} intensity={0.6} />

        {/* Ambient background particles */}
        <BackgroundStars />

        {/* Top Observed Phenotype Sphere */}
        <ObservedPhenotype />

        {/* Descending Trace Conduit Paths */}
        <TracePaths />

        {/* 3 Candidate Genomic Configurations */}
        {candidates.slice(0, 3).map((candidate, idx) => {
          const xPos = (idx - 1) * 2.18;
          return (
            <CandidateConfiguration
              key={candidate.id}
              candidate={candidate}
              position={[xPos, -0.45, 0]}
            />
          );
        })}
      </Canvas>
    </div>
  );
};
