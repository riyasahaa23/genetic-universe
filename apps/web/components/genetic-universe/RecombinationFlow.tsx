"use client";

import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { ProvenanceParticles } from "./ProvenanceParticles";
import { useInteraction } from "./context/InteractionContext";

export const RecombinationFlow: React.FC = () => {
  const { hoveredCrossover, setHoveredCrossover, setTooltip } = useInteraction();
  const junctionRef = useRef<THREE.Mesh>(null);

  // Spline paths connecting Parent A ([-2.95, 1.45, 0]) and Parent B ([2.95, 1.45, 0]) to Crossover ([0, 0.75, 0]) and into Offspring ([0, 0.40, 0])
  const { curveA, curveB, crossoverPoint } = useMemo(() => {
    const pointsA = [
      new THREE.Vector3(-2.25, 1.35, 0),
      new THREE.Vector3(-1.40, 1.10, 0.15),
      new THREE.Vector3(-0.55, 0.90, 0.08),
      new THREE.Vector3(0, 0.75, 0), // Crossover chiasma
      new THREE.Vector3(0.22, 0.58, -0.08),
      new THREE.Vector3(0, 0.40, 0),
    ];

    const pointsB = [
      new THREE.Vector3(2.25, 1.35, 0),
      new THREE.Vector3(1.40, 1.10, -0.15),
      new THREE.Vector3(0.55, 0.90, -0.08),
      new THREE.Vector3(0, 0.75, 0), // Crossover chiasma
      new THREE.Vector3(-0.22, 0.58, 0.08),
      new THREE.Vector3(0, 0.40, 0),
    ];

    return {
      curveA: new THREE.CatmullRomCurve3(pointsA, false, "centripetal", 0.5),
      curveB: new THREE.CatmullRomCurve3(pointsB, false, "centripetal", 0.5),
      crossoverPoint: new THREE.Vector3(0, 0.75, 0),
    };
  }, []);

  // Tube geometries for glowing DNA lineage backbones
  const tubeGeoA = useMemo(() => new THREE.TubeGeometry(curveA, 50, 0.035, 8, false), [curveA]);
  const tubeGeoB = useMemo(() => new THREE.TubeGeometry(curveB, 50, 0.035, 8, false), [curveB]);

  // Base pair rungs combined into a single lineSegments geometry
  const rungsGeo = useMemo(() => {
    const positions: number[] = [];
    const colors: number[] = [];
    const count = 20;

    const colA = new THREE.Color("#00f0ff");
    const colB = new THREE.Color("#ec4899");
    const colGold = new THREE.Color("#fbbf24");

    for (let i = 1; i < count; i++) {
      const t = i / count;
      const posA = curveA.getPoint(t);
      const posB = curveB.getPoint(t);
      const angle = t * Math.PI * 8;
      const offset = new THREE.Vector3(Math.sin(angle) * 0.08, Math.cos(angle) * 0.08, 0);

      // Rung A
      const p1A = posA.clone().add(offset);
      const p2A = posA.clone().sub(offset);
      positions.push(p1A.x, p1A.y, p1A.z, p2A.x, p2A.y, p2A.z);
      const colorA = t > 0.45 ? colGold : colA;
      colors.push(colorA.r, colorA.g, colorA.b, colorA.r, colorA.g, colorA.b);

      // Rung B
      const p1B = posB.clone().add(offset);
      const p2B = posB.clone().sub(offset);
      positions.push(p1B.x, p1B.y, p1B.z, p2B.x, p2B.y, p2B.z);
      const colorB = t > 0.45 ? colGold : colB;
      colors.push(colorB.r, colorB.g, colorB.b, colorB.r, colorB.g, colorB.b);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    return geo;
  }, [curveA, curveB]);

  useFrame((state, delta) => {
    if (junctionRef.current) {
      const t = state.clock.getElapsedTime();
      junctionRef.current.scale.setScalar(1 + Math.sin(t * 4) * 0.18);
    }
  });

  return (
    <group>
      {/* HTML Center Meiosis Labels */}
      <Html
        position={[0, 2.65, 0]}
        center
        distanceFactor={14}
        className="pointer-events-none select-none"
      >
        <div className="flex flex-col items-center text-center whitespace-nowrap drop-shadow-[0_2px_12px_rgba(0,0,0,0.95)]">
          <div className="text-[14px] font-serif font-semibold tracking-wider text-amber-100 glow-gold-text">
            Meiosis
          </div>
          <div className="text-[8.5px] font-mono tracking-[0.25em] text-cyan-300 uppercase mt-0.5">
            CROSSOVER & RECOMBINATION
          </div>

          {/* Thin vertical guide line */}
          <div className="w-[1px] h-5 bg-gradient-to-b from-cyan-400 via-amber-300 to-transparent my-1 shadow-[0_0_6px_#38bdf8]" />

          {/* Step indicators */}
          <div className="space-y-0.5 text-[7px] font-mono tracking-[0.2em] text-slate-400 uppercase">
            <div>SEGREGATION</div>
            <div className="text-amber-300">RECOMBINATION</div>
            <div>NEW CONFIGURATIONS</div>
          </div>
        </div>
      </Html>

      {/* Parent A Lineage Tube */}
      <mesh geometry={tubeGeoA}>
        <meshStandardMaterial
          color="#00f0ff"
          emissive="#00f0ff"
          emissiveIntensity={0.8}
          roughness={0.2}
          transparent
          opacity={0.7}
        />
      </mesh>

      {/* Parent B Lineage Tube */}
      <mesh geometry={tubeGeoB}>
        <meshStandardMaterial
          color="#ec4899"
          emissive="#ec4899"
          emissiveIntensity={0.8}
          roughness={0.2}
          transparent
          opacity={0.7}
        />
      </mesh>

      {/* DNA Base-Pair Rungs */}
      <primitive
        object={
          new THREE.LineSegments(
            rungsGeo,
            new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.75 })
          )
        }
      />

      {/* Recombination Crossover Junction Spark */}
      <mesh
        ref={junctionRef}
        position={crossoverPoint}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHoveredCrossover(20);
          setTooltip({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            title: "Meiotic Crossover Chiasma",
            subtitle: "Physical breakage and reciprocal reunion of chromatids",
            badge: "RECOMBINATION BREAKPOINT",
            badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/40",
            details: [
              { label: "Locus Coordinate", value: "Pos 20 (cM interval: 18-22)", color: "#fbbf24" },
              { label: "Ancestry Transition", value: "Homolog A1 (Cyan) → Homolog A2 (Pink)", color: "#38bdf8" },
              { label: "Biological Outcome", value: "Assembles L10 and L31 in cis", color: "#f59e0b" },
            ],
          });
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHoveredCrossover(null);
          setTooltip(null);
        }}
      >
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial
          color="#fbbf24"
          emissive="#fbbf24"
          emissiveIntensity={hoveredCrossover ? 2.5 : 1.6}
        />
      </mesh>

      {/* Outer Pulse Ring for Crossover Junction */}
      <mesh position={crossoverPoint}>
        <ringGeometry args={[0.2, 0.26, 24]} />
        <meshBasicMaterial color="#fbbf24" transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>

      {/* Animated Provenance Particle Flow */}
      <ProvenanceParticles curveA={curveA} curveB={curveB} particleCount={150} />
    </group>
  );
};
