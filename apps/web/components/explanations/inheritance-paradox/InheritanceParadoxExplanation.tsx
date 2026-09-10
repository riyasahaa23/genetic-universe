"use client";

import React, { useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { Chromosome } from "../../genetic-universe/Chromosome";
import { CelestialBackground } from "../../genetic-universe/CelestialBackground";

// Dynamic Camera Controller for smooth cinematic viewpoint interpolation
const ExplanationCameraController: React.FC<{ sceneIndex: number; reducedMotion: boolean }> = ({
  sceneIndex,
  reducedMotion,
}) => {
  useFrame(({ camera }) => {
    if (reducedMotion) return;
    const targetPositions: [number, number, number][] = [
      [0, 0.4, 9.4],   // Scene 0: Parental envelope wide
      [0, 0.2, 8.2],   // Scene 1: Recombinant mosaic configuration
      [0, -0.15, 6.8], // Scene 2: Deep focus on epistatic interaction
      [0.6, 0.1, 8.6], // Scene 3: Transgressive breakout
    ];
    const target = targetPositions[sceneIndex] || targetPositions[0];
    camera.position.lerp(new THREE.Vector3(...target), 0.05);
  });
  return null;
};

// Animated Recombination Crossover Component for Scene 1
const RecombinationAnimation: React.FC<{ reducedMotion: boolean }> = ({ reducedMotion }) => {
  const sparkRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (reducedMotion) return;
    const t = state.clock.getElapsedTime();
    if (sparkRef.current) {
      sparkRef.current.scale.setScalar(1 + Math.sin(t * 4) * 0.25);
    }
    if (ringRef.current) {
      ringRef.current.scale.setScalar(1 + Math.cos(t * 3) * 0.2);
    }
  });

  return (
    <group position={[0, 0.2, 0]}>
      {/* Recombination Crossover Spark */}
      <mesh ref={sparkRef} position={[0, 0.25, 0.2]}>
        <sphereGeometry args={[0.09, 16, 16]} />
        <meshBasicMaterial color="#fbbf24" />
      </mesh>
      <mesh ref={ringRef} position={[0, 0.25, 0.2]}>
        <ringGeometry args={[0.14, 0.22, 32]} />
        <meshBasicMaterial color="#fbbf24" transparent opacity={0.75} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};

// Animated Epistatic Beam for Scene 2
const EpistaticBeamAnimation: React.FC<{ reducedMotion: boolean }> = ({ reducedMotion }) => {
  const beamRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (reducedMotion) return;
    const t = state.clock.getElapsedTime();
    if (beamRef.current) {
      const mat = beamRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.65 + Math.sin(t * 5) * 0.3;
    }
  });

  return (
    <mesh ref={beamRef} position={[0, 0, 0.15]} rotation={[0, 0, -0.98]}>
      <planeGeometry args={[1.5, 0.06]} />
      <meshBasicMaterial color="#fbbf24" transparent opacity={0.85} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
    </mesh>
  );
};

// Animated Transgressive Marker for Scene 3
const TransgressivePointAnimation: React.FC<{ reducedMotion: boolean }> = ({ reducedMotion }) => {
  const groupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    if (reducedMotion) {
      groupRef.current.position.x = 2.2;
      return;
    }
    const t = state.clock.getElapsedTime();
    // Glide from within envelope (0.2) to outside (+2.2) over 2.5 seconds cycle
    const progress = Math.min(1, (t % 5) / 2.5);
    const easeProgress = 1 - Math.pow(1 - progress, 3); // Cubic ease-out
    groupRef.current.position.x = 0.2 + easeProgress * 2.0;

    if (ringRef.current) {
      ringRef.current.scale.setScalar(1 + Math.sin(t * 4) * 0.25);
    }
  });

  return (
    <group ref={groupRef} position={[2.2, 0.25, 0]}>
      <mesh>
        <sphereGeometry args={[0.18, 24, 24]} />
        <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={0.9} />
      </mesh>
      <mesh ref={ringRef}>
        <ringGeometry args={[0.32, 0.44, 32]} />
        <meshBasicMaterial color="#fbbf24" side={THREE.DoubleSide} transparent opacity={0.8} blending={THREE.AdditiveBlending} />
      </mesh>
      <Html position={[0, 0.65, 0]} center distanceFactor={10} className="pointer-events-none select-none">
        <div className="px-3 py-1 rounded-xl bg-amber-950/90 border border-amber-400 text-amber-300 font-mono text-[9.5px] font-bold shadow-[0_0_15px_rgba(245,158,11,0.6)] whitespace-nowrap">
          Offspring: 18.7 (Novel)
        </div>
      </Html>
    </group>
  );
};

export const InheritanceParadoxExplanation: React.FC<{ currentSceneIndex: number; reducedMotion: boolean }> = ({
  currentSceneIndex,
  reducedMotion,
}) => {
  return (
    <Canvas
      camera={{ position: [0, 0.5, 9.5], fov: 42 }}
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={0.7} color="#0c1836" />
      <directionalLight position={[-5, 7, 5]} intensity={1.8} color="#00e5ff" />
      <directionalLight position={[5, 7, 5]} intensity={1.6} color="#ec4899" />
      <directionalLight position={[0, -3, 4]} intensity={1.4} color="#fbbf24" />
      <CelestialBackground />

      <ExplanationCameraController sceneIndex={currentSceneIndex} reducedMotion={reducedMotion} />

      {/* Scene 0: Parental Range */}
      {currentSceneIndex === 0 && (
        <group position={[0, -0.2, 0]}>
          {/* Parent A Phenotype Zone */}
          <group position={[-2.4, 0, 0]}>
            <mesh>
              <sphereGeometry args={[1.2, 32, 32]} />
              <meshStandardMaterial color="#00f0ff" transparent opacity={0.12} emissive="#0284c7" emissiveIntensity={0.3} />
            </mesh>
            <mesh>
              <ringGeometry args={[1.18, 1.24, 64]} />
              <meshBasicMaterial color="#00f0ff" side={THREE.DoubleSide} transparent opacity={0.7} />
            </mesh>
            <Html position={[0, -1.6, 0]} center distanceFactor={10} className="pointer-events-none select-none">
              <div className="px-2.5 py-0.5 rounded-full bg-cyan-950/90 border border-cyan-500/40 text-cyan-300 font-mono text-[10.5px] font-bold whitespace-nowrap shadow-md">
                Parent A Phenotype: 12.4
              </div>
            </Html>
          </group>

          {/* Parental Envelope Range Bar */}
          <group position={[0, 0, 0]}>
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[4.2, 0.08, 0.06]} />
              <meshBasicMaterial color="#0369a1" transparent opacity={0.5} />
            </mesh>
            <Html position={[0, 0.5, 0]} center distanceFactor={10} className="pointer-events-none select-none">
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300 whitespace-nowrap">
                Parental Range [12.4 – 14.1]
              </span>
            </Html>
          </group>

          {/* Parent B Phenotype Zone */}
          <group position={[2.4, 0, 0]}>
            <mesh>
              <sphereGeometry args={[1.2, 32, 32]} />
              <meshStandardMaterial color="#ec4899" transparent opacity={0.12} emissive="#be185d" emissiveIntensity={0.3} />
            </mesh>
            <mesh>
              <ringGeometry args={[1.18, 1.24, 64]} />
              <meshBasicMaterial color="#ec4899" side={THREE.DoubleSide} transparent opacity={0.7} />
            </mesh>
            <Html position={[0, -1.6, 0]} center distanceFactor={10} className="pointer-events-none select-none">
              <div className="px-2.5 py-0.5 rounded-full bg-pink-950/90 border border-pink-500/40 text-pink-300 font-mono text-[10.5px] font-bold whitespace-nowrap shadow-md">
                Parent B Phenotype: 14.1
              </div>
            </Html>
          </group>
        </group>
      )}

      {/* Scene 1: New Genomic Configuration */}
      {currentSceneIndex === 1 && (
        <group position={[0, -0.2, 0]}>
          <group position={[-2.4, 0, 0]} scale={0.75}>
            <Chromosome type="parent_a" />
            <Html position={[0, -1.6, 0]} center distanceFactor={10} className="pointer-events-none select-none">
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-cyan-950/90 border border-cyan-500/40 text-cyan-300 whitespace-nowrap">
                Parent A Genome
              </span>
            </Html>
          </group>

          <group position={[0, 0, 0]} scale={0.95}>
            <Chromosome type="offspring" highlightLoci />
            <Html position={[0, -1.7, 0]} center distanceFactor={10} className="pointer-events-none select-none">
              <div className="px-3 py-1 rounded-xl bg-slate-900/95 border border-sky-400 text-sky-200 font-mono text-[10px] font-bold whitespace-nowrap shadow-lg">
                Recombinant Mosaic Chromosome
              </div>
            </Html>
          </group>

          <RecombinationAnimation reducedMotion={reducedMotion} />

          <group position={[2.4, 0, 0]} scale={0.75}>
            <Chromosome type="parent_b" />
            <Html position={[0, -1.6, 0]} center distanceFactor={10} className="pointer-events-none select-none">
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-pink-950/90 border border-pink-500/40 text-pink-300 whitespace-nowrap">
                Parent B Genome
              </span>
            </Html>
          </group>
        </group>
      )}

      {/* Scene 2: Non-Additive Interaction */}
      {currentSceneIndex === 2 && (
        <group position={[0, -0.2, 0]}>
          <group scale={0.9}>
            <Chromosome type="offspring" highlightLoci />
          </group>

          {/* Locus A marker */}
          <mesh position={[-0.4, 0.6, 0.15]}>
            <sphereGeometry args={[0.09, 16, 16]} />
            <meshBasicMaterial color="#38bdf8" />
          </mesh>
          <Html position={[-0.9, 0.6, 0]} center distanceFactor={10} className="pointer-events-none select-none">
            <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40 whitespace-nowrap">
              Locus A
            </span>
          </Html>

          {/* Locus B marker */}
          <mesh position={[0.4, -0.6, 0.15]}>
            <sphereGeometry args={[0.09, 16, 16]} />
            <meshBasicMaterial color="#ec4899" />
          </mesh>
          <Html position={[0.9, -0.6, 0]} center distanceFactor={10} className="pointer-events-none select-none">
            <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-pink-950 text-pink-300 border border-pink-500/40 whitespace-nowrap">
              Locus B
            </span>
          </Html>

          {/* Glowing Epistatic Interaction Beam between A and B */}
          <EpistaticBeamAnimation reducedMotion={reducedMotion} />

          <Html position={[0, 0, 0]} center distanceFactor={10} className="pointer-events-none select-none">
            <div className="px-3 py-1 rounded-xl bg-amber-950/90 border border-amber-400 text-amber-300 font-mono text-[10px] font-bold shadow-[0_0_15px_rgba(245,158,11,0.6)] whitespace-nowrap">
              ✦ Epistatic Synergy: γ_AB = +5.4 ✦
            </div>
          </Html>
        </group>
      )}

      {/* Scene 3: Transgressive Phenotype */}
      {currentSceneIndex === 3 && (
        <group position={[0, -0.25, 0]}>
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[6.2, 0.08, 0.06]} />
            <meshBasicMaterial color="#1e293b" />
          </mesh>

          {/* Envelope Zone [12.4 - 14.1] */}
          <mesh position={[-0.8, 0, 0.02]}>
            <boxGeometry args={[1.6, 0.18, 0.08]} />
            <meshBasicMaterial color="#0369a1" transparent opacity={0.65} />
          </mesh>

          <mesh position={[-1.6, 0.25, 0]}>
            <sphereGeometry args={[0.1, 16, 16]} />
            <meshBasicMaterial color="#00f0ff" />
          </mesh>
          <Html position={[-1.6, 0.55, 0]} center distanceFactor={10} className="pointer-events-none select-none">
            <span className="text-[8.5px] font-mono px-2 py-0.5 rounded bg-cyan-950/90 text-cyan-300 border border-cyan-500/40 whitespace-nowrap">
              Parent A: 12.4
            </span>
          </Html>

          <mesh position={[0.0, 0.25, 0]}>
            <sphereGeometry args={[0.1, 16, 16]} />
            <meshBasicMaterial color="#ec4899" />
          </mesh>
          <Html position={[0.0, 0.55, 0]} center distanceFactor={10} className="pointer-events-none select-none">
            <span className="text-[8.5px] font-mono px-2 py-0.5 rounded bg-pink-950/90 text-pink-300 border border-pink-500/40 whitespace-nowrap">
              Parent B: 14.1
            </span>
          </Html>

          {/* Offspring Transgressive Pin dynamically animated */}
          <TransgressivePointAnimation reducedMotion={reducedMotion} />

          <Html position={[1.1, -0.6, 0]} center distanceFactor={10} className="pointer-events-none select-none">
            <div className="text-[8.5px] font-mono text-amber-300 bg-amber-950/90 px-3 py-0.5 rounded border border-amber-500/40 whitespace-nowrap shadow-md">
              Transgressive Margin: Δ = +4.6 beyond parental ceiling
            </div>
          </Html>
        </group>
      )}
    </Canvas>
  );
};
