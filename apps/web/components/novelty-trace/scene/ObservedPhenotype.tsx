"use client";

import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useNoveltyTrace } from "../interactions/NoveltyTraceInteractionContext";

export const ObservedPhenotype: React.FC = () => {
  const outerSphereRef = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const coronaRef = useRef<THREE.Points>(null);
  const mainGroupRef = useRef<THREE.Group>(null);
  const parentAGroupRef = useRef<THREE.Group>(null);
  const parentBGroupRef = useRef<THREE.Group>(null);
  const envelopeGroupRef = useRef<THREE.Group>(null);
  const counterfactualGroupRef = useRef<THREE.Group>(null);

  const { activeWorkflowStep, selectedCandidate } = useNoveltyTrace();

  // Generate dense cosmic sparks & energetic particles inside and around sphere
  const particleCount = 280;
  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const col = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 0.45 + Math.random() * 0.45;

      const sinPhi = Math.sin(phi);
      pos[i * 3] = r * sinPhi * Math.cos(theta);
      pos[i * 3 + 1] = r * sinPhi * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);

      const rand = Math.random();
      if (rand < 0.35) {
        col[i * 3] = 0.22; // cyan
        col[i * 3 + 1] = 0.74;
        col[i * 3 + 2] = 0.97;
      } else if (rand < 0.7) {
        col[i * 3] = 0.92; // magenta
        col[i * 3 + 1] = 0.28;
        col[i * 3 + 2] = 0.6;
      } else {
        col[i * 3] = 0.98; // gold
        col[i * 3 + 1] = 0.78;
        col[i * 3 + 2] = 0.25;
      }
    }
    return [pos, col];
  }, [particleCount]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (outerSphereRef.current) {
      outerSphereRef.current.rotation.y = t * 0.35;
      outerSphereRef.current.rotation.x = Math.sin(t * 0.25) * 0.12;
    }
    if (coreRef.current) {
      const pulse = 1 + Math.sin(t * 3.0) * 0.05;
      coreRef.current.scale.set(pulse, pulse, pulse);
      coreRef.current.rotation.y = -t * 0.5;
    }
    if (coronaRef.current) {
      coronaRef.current.rotation.y = t * 0.2;
      coronaRef.current.rotation.z = Math.sin(t * 0.15) * 0.15;
    }

    // Smooth stage transitions using lerp
    if (mainGroupRef.current) {
      const targetY = activeWorkflowStep === 1 ? 1.05 : 1.95;
      const targetScale = activeWorkflowStep === 1 ? 1.15 : 1.0;
      mainGroupRef.current.position.y = THREE.MathUtils.lerp(mainGroupRef.current.position.y, targetY, 0.08);
      const currentScale = mainGroupRef.current.scale.x;
      const nextScale = THREE.MathUtils.lerp(currentScale, targetScale, 0.08);
      mainGroupRef.current.scale.set(nextScale, nextScale, nextScale);
    }

    // Parent A reference orb opacity/scale in Stage 1
    if (parentAGroupRef.current) {
      const targetOpacity = activeWorkflowStep === 1 ? 1.0 : 0.0;
      parentAGroupRef.current.position.y = THREE.MathUtils.lerp(parentAGroupRef.current.position.y, activeWorkflowStep === 1 ? -0.1 : -2, 0.08);
      parentAGroupRef.current.scale.setScalar(THREE.MathUtils.lerp(parentAGroupRef.current.scale.x, targetOpacity, 0.08));
      parentAGroupRef.current.visible = parentAGroupRef.current.scale.x > 0.02;
    }

    // Parent B reference orb opacity/scale in Stage 1
    if (parentBGroupRef.current) {
      const targetOpacity = activeWorkflowStep === 1 ? 1.0 : 0.0;
      parentBGroupRef.current.position.y = THREE.MathUtils.lerp(parentBGroupRef.current.position.y, activeWorkflowStep === 1 ? 0.25 : -2, 0.08);
      parentBGroupRef.current.scale.setScalar(THREE.MathUtils.lerp(parentBGroupRef.current.scale.x, targetOpacity, 0.08));
      parentBGroupRef.current.visible = parentBGroupRef.current.scale.x > 0.02;
    }

    // Parental Envelope in Stage 1
    if (envelopeGroupRef.current) {
      const targetOpacity = activeWorkflowStep === 1 ? 1.0 : 0.0;
      envelopeGroupRef.current.scale.setScalar(THREE.MathUtils.lerp(envelopeGroupRef.current.scale.x, targetOpacity, 0.08));
      envelopeGroupRef.current.visible = envelopeGroupRef.current.scale.x > 0.02;
    }

    // Counterfactual Rescued Sphere in Stage 4
    if (counterfactualGroupRef.current) {
      const targetOpacity = activeWorkflowStep === 4 ? 1.0 : 0.0;
      counterfactualGroupRef.current.scale.setScalar(THREE.MathUtils.lerp(counterfactualGroupRef.current.scale.x, targetOpacity, 0.08));
      counterfactualGroupRef.current.visible = counterfactualGroupRef.current.scale.x > 0.02;
    }
  });

  return (
    <>
      {/* ==================================================== */}
      {/* CENTRAL OBSERVED PHENOTYPE SPHERE                    */}
      {/* ==================================================== */}
      <group ref={mainGroupRef} position={[0, 1.95, 0]}>
        {/* Outer Glow Atmosphere */}
        <mesh>
          <sphereGeometry args={[0.95, 32, 32]} />
          <meshBasicMaterial
            color="#38bdf8"
            transparent
            opacity={0.08}
            side={THREE.BackSide}
          />
        </mesh>

        {/* Outer Delicate Wireframe Cage */}
        <mesh ref={outerSphereRef}>
          <sphereGeometry args={[0.75, 24, 24]} />
          <meshStandardMaterial
            color="#a855f7"
            emissive="#38bdf8"
            emissiveIntensity={0.5}
            wireframe
            transparent
            opacity={0.35}
          />
        </mesh>

        {/* Dark Cosmic Core with Pulsating Warm Luster */}
        <mesh ref={coreRef}>
          <sphereGeometry args={[0.62, 32, 32]} />
          <meshStandardMaterial
            color="#070b19"
            emissive="#fbbf24"
            emissiveIntensity={0.55}
            roughness={0.2}
            metalness={0.9}
          />
        </mesh>

        {/* Swirling Sparks & Nebula Particles */}
        <points ref={coronaRef}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={particleCount}
              array={positions}
              itemSize={3}
            />
            <bufferAttribute
              attach="attributes-color"
              count={particleCount}
              array={colors}
              itemSize={3}
            />
          </bufferGeometry>
          <pointsMaterial
            size={0.04}
            vertexColors
            transparent
            opacity={0.9}
            blending={THREE.AdditiveBlending}
          />
        </points>

        {/* Point Lights inside sphere */}
        <pointLight color="#fbbf24" intensity={1.8} distance={4.5} />
        <pointLight color="#38bdf8" intensity={1.4} distance={5} position={[0, 0, 0.8]} />
      </group>

      {/* ==================================================== */}
      {/* STAGE 1: PARENTAL REFERENCES & PHENOTYPE ENVELOPE    */}
      {/* ==================================================== */}
      {/* Parent A Reference Sphere (Cyan, Left, -1.8 SD) */}
      <group ref={parentAGroupRef} position={[-2.3, -0.1, 0]}>
        <mesh>
          <sphereGeometry args={[0.32, 24, 24]} />
          <meshStandardMaterial
            color="#05142b"
            emissive="#0284c7"
            emissiveIntensity={0.65}
            roughness={0.2}
            metalness={0.8}
          />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.42, 16, 16]} />
          <meshBasicMaterial color="#38bdf8" transparent opacity={0.12} wireframe />
        </mesh>
        {/* Orbit ring */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.45, 0.48, 32]} />
          <meshBasicMaterial color="#38bdf8" transparent opacity={0.4} />
        </mesh>
      </group>

      {/* Parent B Reference Sphere (Magenta, Right, +0.4 SD) */}
      <group ref={parentBGroupRef} position={[2.1, 0.25, 0]}>
        <mesh>
          <sphereGeometry args={[0.32, 24, 24]} />
          <meshStandardMaterial
            color="#1f071e"
            emissive="#db2777"
            emissiveIntensity={0.65}
            roughness={0.2}
            metalness={0.8}
          />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.42, 16, 16]} />
          <meshBasicMaterial color="#ec4899" transparent opacity={0.12} wireframe />
        </mesh>
        {/* Orbit ring */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.45, 0.48, 32]} />
          <meshBasicMaterial color="#ec4899" transparent opacity={0.4} />
        </mesh>
      </group>

      {/* Parental Range Envelope Visual in 3D (Spanning Parent A to Parent B) */}
      <group ref={envelopeGroupRef} position={[0, -0.05, 0]}>
        {/* Envelope bracket beam */}
        <mesh position={[-0.1, 0, 0]}>
          <boxGeometry args={[4.4, 0.03, 0.03]} />
          <meshBasicMaterial color="#38bdf8" transparent opacity={0.5} />
        </mesh>
        {/* Left bound marker (Parent A lower bound) */}
        <mesh position={[-2.3, 0.1, 0]}>
          <boxGeometry args={[0.04, 0.35, 0.04]} />
          <meshBasicMaterial color="#38bdf8" transparent opacity={0.7} />
        </mesh>
        {/* Right bound marker (Parent B upper bound) */}
        <mesh position={[2.1, 0.1, 0]}>
          <boxGeometry args={[0.04, 0.35, 0.04]} />
          <meshBasicMaterial color="#ec4899" transparent opacity={0.7} />
        </mesh>
        {/* Subtle horizontal shaded band */}
        <mesh position={[-0.1, 0, -0.02]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[4.4, 0.8]} />
          <meshBasicMaterial color="#0284c7" transparent opacity={0.07} side={THREE.DoubleSide} />
        </mesh>
        {/* Vertical Transgression Delta Beam from Envelope up to Offspring */}
        <mesh position={[0, 0.55, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 1.0, 16]} />
          <meshBasicMaterial color="#fbbf24" transparent opacity={0.8} />
        </mesh>
        {/* Transgression pulsing ring at envelope intercept */}
        <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.18, 0.22, 24]} />
          <meshBasicMaterial color="#fbbf24" transparent opacity={0.85} />
        </mesh>
      </group>

      {/* ==================================================== */}
      {/* STAGE 4: COUNTERFACTUAL RESCUED SPHERE               */}
      {/* ==================================================== */}
      <group ref={counterfactualGroupRef} position={[0, 0.35, 0]}>
        {/* Rescued sphere inside parental range */}
        <mesh>
          <sphereGeometry args={[0.38, 24, 24]} />
          <meshStandardMaterial
            color="#06201b"
            emissive="#10b981"
            emissiveIntensity={0.7}
            roughness={0.2}
            metalness={0.7}
            transparent
            opacity={0.85}
          />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.48, 16, 16]} />
          <meshBasicMaterial color="#34d399" transparent opacity={0.25} wireframe />
        </mesh>
        {/* Dashed connector line from Offspring down to Counterfactual */}
        <mesh position={[0, 0.8, 0]}>
          <cylinderGeometry args={[0.012, 0.012, 1.4, 8]} />
          <meshBasicMaterial color="#34d399" transparent opacity={0.65} />
        </mesh>
      </group>
    </>
  );
};
