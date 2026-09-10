"use client";

import React, { useRef, useMemo } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { Chromosome } from "../../genetic-universe/Chromosome";
import { CelestialBackground } from "../../genetic-universe/CelestialBackground";

export const MeiosisExplanation: React.FC<{ currentSceneIndex: number; reducedMotion: boolean }> = ({
  currentSceneIndex,
  reducedMotion,
}) => {
  // Curves for crossing chromatids
  const { curveCyanArm, curvePinkArm, curveCyanCross, curvePinkCross } = useMemo(() => {
    const c1 = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.9, 1.2, 0),
      new THREE.Vector3(-0.6, 0.6, 0),
      new THREE.Vector3(-0.5, 0, 0),
      new THREE.Vector3(-0.6, -0.6, 0),
      new THREE.Vector3(-0.9, -1.2, 0),
    ]);

    const c2 = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.35, 1.15, -0.02),
      new THREE.Vector3(-0.15, 0.5, -0.01),
      new THREE.Vector3(0.0, 0.0, 0.0),
      new THREE.Vector3(0.25, -0.55, 0.02),
      new THREE.Vector3(0.55, -1.15, 0.04),
    ]);

    const c3 = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.35, 1.15, 0.02),
      new THREE.Vector3(0.15, 0.5, 0.01),
      new THREE.Vector3(0.0, 0.0, 0.0),
      new THREE.Vector3(-0.25, -0.55, -0.02),
      new THREE.Vector3(-0.55, -1.15, -0.04),
    ]);

    const c4 = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.9, 1.2, 0),
      new THREE.Vector3(0.6, 0.6, 0),
      new THREE.Vector3(0.5, 0, 0),
      new THREE.Vector3(0.6, -0.6, 0),
      new THREE.Vector3(0.9, -1.2, 0),
    ]);

    return {
      curveCyanArm: new THREE.TubeGeometry(c1, 32, 0.09, 12, false),
      curveCyanCross: new THREE.TubeGeometry(c2, 40, 0.09, 12, false),
      curvePinkCross: new THREE.TubeGeometry(c3, 40, 0.09, 12, false),
      curvePinkArm: new THREE.TubeGeometry(c4, 32, 0.09, 12, false),
    };
  }, []);

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

      {/* Scene 0: Homolog Pairing (Synapsis) */}
      {currentSceneIndex === 0 && (
        <group position={[0, -0.2, 0]}>
          <group position={[-0.8, 0, 0]}>
            <Chromosome type="parent_a" scale={1.0} rotation={[0, 0.1, 0.03]} />
          </group>
          {/* Synaptonemal Protein Ladder Rungs */}
          {[-0.8, -0.4, 0, 0.4, 0.8].map((y, idx) => (
            <mesh key={`rung-${idx}`} position={[0, y, 0]}>
              <boxGeometry args={[0.7, 0.03, 0.03]} />
              <meshBasicMaterial color="#38bdf8" transparent opacity={0.75} />
            </mesh>
          ))}
          <group position={[0.8, 0, 0]}>
            <Chromosome type="parent_b" scale={1.0} rotation={[0, -0.1, -0.03]} />
          </group>
          <Html position={[0, -1.6, 0]} center distanceFactor={10} className="pointer-events-none select-none">
            <div className="px-3 py-0.5 rounded-full bg-[#061026]/90 border border-sky-400/40 text-sky-300 font-mono text-[10px] font-bold uppercase shadow-md whitespace-nowrap">
              Prophase I: Synaptonemal Bivalent Alignment
            </div>
          </Html>
        </group>
      )}

      {/* Scene 1: Chiasma / Crossover */}
      {currentSceneIndex === 1 && (
        <group position={[0, -0.15, 0]}>
          <mesh geometry={curveCyanArm}>
            <meshStandardMaterial color="#00f0ff" roughness={0.2} emissive="#0284c7" emissiveIntensity={0.4} />
          </mesh>
          <mesh geometry={curveCyanCross}>
            <meshStandardMaterial color="#00f0ff" roughness={0.2} emissive="#0284c7" emissiveIntensity={0.5} />
          </mesh>
          <mesh geometry={curvePinkCross}>
            <meshStandardMaterial color="#ec4899" roughness={0.2} emissive="#be185d" emissiveIntensity={0.5} />
          </mesh>
          <mesh geometry={curvePinkArm}>
            <meshStandardMaterial color="#ec4899" roughness={0.2} emissive="#be185d" emissiveIntensity={0.4} />
          </mesh>
          {/* Gold Chiasma Junction */}
          <group position={[0, 0, 0]}>
            <mesh>
              <sphereGeometry args={[0.16, 16, 16]} />
              <meshBasicMaterial color="#fffbeb" />
            </mesh>
            <mesh>
              <ringGeometry args={[0.22, 0.32, 32]} />
              <meshBasicMaterial color="#fbbf24" side={THREE.DoubleSide} transparent opacity={0.85} blending={THREE.AdditiveBlending} />
            </mesh>
          </group>
          <Html position={[0, -0.6, 0]} center distanceFactor={10} className="pointer-events-none select-none">
            <div className="px-3 py-0.5 rounded-full bg-amber-950/90 border border-amber-400 text-amber-300 font-mono text-[10px] font-bold uppercase shadow-lg whitespace-nowrap">
              ✦ Chiasma Crossover Junction (Reciprocal Swap) ✦
            </div>
          </Html>
        </group>
      )}

      {/* Scene 2: Four Recombinant Chromatids */}
      {currentSceneIndex === 2 && (
        <group position={[0, -0.2, 0]}>
          <group position={[-2.4, 0, 0]} scale={0.78}>
            <Chromosome type="parent_a" />
            <Html position={[0, -1.6, 0]} center distanceFactor={10} className="pointer-events-none select-none">
              <span className="text-[8.5px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40 whitespace-nowrap">
                Parental A1
              </span>
            </Html>
          </group>

          <group position={[-0.8, 0, 0]} scale={0.78}>
            <Chromosome type="offspring" />
            <Html position={[0, -1.6, 0]} center distanceFactor={10} className="pointer-events-none select-none">
              <span className="text-[8.5px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/40 whitespace-nowrap">
                Recombinant 1
              </span>
            </Html>
          </group>

          <group position={[0.8, 0, 0]} scale={0.78}>
            <Chromosome type="offspring" />
            <Html position={[0, -1.6, 0]} center distanceFactor={10} className="pointer-events-none select-none">
              <span className="text-[8.5px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/40 whitespace-nowrap">
                Recombinant 2
              </span>
            </Html>
          </group>

          <group position={[2.4, 0, 0]} scale={0.78}>
            <Chromosome type="parent_b" />
            <Html position={[0, -1.6, 0]} center distanceFactor={10} className="pointer-events-none select-none">
              <span className="text-[8.5px] font-mono px-2 py-0.5 rounded bg-pink-950 text-pink-300 border border-pink-500/40 whitespace-nowrap">
                Parental B2
              </span>
            </Html>
          </group>
        </group>
      )}

      {/* Scene 3: Segregation (Meiosis I & II) */}
      {currentSceneIndex === 3 && (
        <group position={[0, -0.2, 0]}>
          {/* Spindle Division Line */}
          <mesh position={[0, 0, 0]}>
            <planeGeometry args={[0.04, 3.5]} />
            <meshBasicMaterial color="#38bdf8" transparent opacity={0.4} />
          </mesh>

          {/* Left Pole (Maternal origin) */}
          <group position={[-2.0, 0, 0]} scale={0.75}>
            <Chromosome type="parent_a" />
            <Html position={[0, -1.6, 0]} center distanceFactor={10} className="pointer-events-none select-none">
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40 whitespace-nowrap">
                Pole A (Meiotic Segregation)
              </span>
            </Html>
          </group>

          {/* Right Pole (Paternal origin) */}
          <group position={[2.0, 0, 0]} scale={0.75}>
            <Chromosome type="parent_b" />
            <Html position={[0, -1.6, 0]} center distanceFactor={10} className="pointer-events-none select-none">
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-pink-950 text-pink-300 border border-pink-500/40 whitespace-nowrap">
                Pole B (Meiotic Segregation)
              </span>
            </Html>
          </group>
        </group>
      )}

      {/* Scene 4: Four Haploid Gametes */}
      {currentSceneIndex === 4 && (
        <group position={[0, -0.2, 0]}>
          {[-3.0, -1.0, 1.0, 3.0].map((x, idx) => {
            const isRecomb = idx === 1 || idx === 2;
            const col = isRecomb ? "#fbbf24" : idx === 0 ? "#00f0ff" : "#ec4899";
            return (
              <group key={`gamete-${idx}`} position={[x, 0, 0]}>
                <mesh>
                  <sphereGeometry args={[0.7, 24, 24]} />
                  <meshStandardMaterial color={col} transparent opacity={0.15} emissive={col} emissiveIntensity={0.3} />
                </mesh>
                <mesh>
                  <ringGeometry args={[0.68, 0.72, 48]} />
                  <meshBasicMaterial color={col} side={THREE.DoubleSide} transparent opacity={0.7} />
                </mesh>
                <Html position={[0, -1.1, 0]} center distanceFactor={10} className="pointer-events-none select-none">
                  <div className="px-2 py-0.5 rounded bg-slate-900/90 border border-slate-700 text-slate-200 font-mono text-[8px] whitespace-nowrap">
                    Gamete {idx + 1} {isRecomb ? "(Recombinant)" : "(Parental)"}
                  </div>
                </Html>
              </group>
            );
          })}
        </group>
      )}
    </Canvas>
  );
};
