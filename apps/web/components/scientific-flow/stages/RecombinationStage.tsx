"use client";

import React, { useRef, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";

export const RecombinationStage: React.FC<{ opacity?: number }> = ({ opacity = 1 }) => {
  const groupRef = useRef<THREE.Group>(null);
  const chiasmaGlowRef = useRef<THREE.PointLight>(null);
  const ringRef = useRef<THREE.Mesh>(null);

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

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();

    if (chiasmaGlowRef.current) {
      chiasmaGlowRef.current.intensity = 2.8 + Math.sin(t * 6.0) * 1.2;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * 1.5;
      const s = 1.0 + Math.sin(t * 4.0) * 0.15;
      ringRef.current.scale.set(s, s, s);
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.15, 0]}>
      {/* Chromatids */}
      <mesh geometry={curveCyanArm}>
        <meshStandardMaterial color="#00f0ff" roughness={0.2} metalness={0.1} emissive="#0284c7" emissiveIntensity={0.4} />
      </mesh>
      <mesh geometry={curveCyanCross}>
        <meshStandardMaterial color="#00f0ff" roughness={0.2} metalness={0.1} emissive="#0284c7" emissiveIntensity={0.5} />
      </mesh>
      <mesh geometry={curvePinkCross}>
        <meshStandardMaterial color="#ec4899" roughness={0.2} metalness={0.1} emissive="#be185d" emissiveIntensity={0.5} />
      </mesh>
      <mesh geometry={curvePinkArm}>
        <meshStandardMaterial color="#ec4899" roughness={0.2} metalness={0.1} emissive="#be185d" emissiveIntensity={0.4} />
      </mesh>

      {/* Gold Chiasma Junction */}
      <group position={[0, 0, 0]}>
        <pointLight ref={chiasmaGlowRef} color="#fbbf24" intensity={3.5} distance={5} />
        <mesh>
          <sphereGeometry args={[0.16, 16, 16]} />
          <meshBasicMaterial color="#fffbeb" />
        </mesh>
        <mesh ref={ringRef}>
          <ringGeometry args={[0.22, 0.32, 32]} />
          <meshBasicMaterial color="#fbbf24" side={THREE.DoubleSide} transparent opacity={0.85} blending={THREE.AdditiveBlending} />
        </mesh>
      </group>

      {/* Callout Annotation positioned neatly between chiasma and tips */}
      <Html position={[0, -0.55, 0]} center distanceFactor={10} className="pointer-events-none select-none">
        <div className="flex flex-col items-center whitespace-nowrap drop-shadow-[0_2px_15px_rgba(251,191,36,0.5)]">
          <div className="px-3 py-0.5 rounded-full bg-amber-950/90 border border-amber-400/80 text-amber-300 font-mono text-[10px] font-bold tracking-widest uppercase shadow-[0_0_15px_rgba(245,158,11,0.5)]">
            ✦ CHIASMA JUNCTION DETECTED ✦
          </div>
          <div className="text-[8px] font-mono text-amber-200/90 mt-0.5 bg-black/70 px-2 py-0.5 rounded border border-amber-500/30">
            Breakpoint: Chr1 @ 42.8 cM · Reciprocal Segment Swap
          </div>
        </div>
      </Html>
    </group>
  );
};
