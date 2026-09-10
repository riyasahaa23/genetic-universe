"use client";

import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { ProvenanceParticles } from "@/components/genetic-universe/ProvenanceParticles";
import { useParadoxInteraction } from "./interactions/ParadoxInteractionContext";

interface RecombinationBridgeProps {
  posA: [number, number, number];
  posB: [number, number, number];
  posOffspring: [number, number, number];
}

export const RecombinationBridge: React.FC<RecombinationBridgeProps> = ({
  posA,
  posB,
  posOffspring,
}) => {
  const {
    setHoveredElement,
    setTooltip,
    isRecombinationActive,
    selectOrToggleElement,
    isExplorationMode,
  } = useParadoxInteraction();

  const junctionRef = useRef<THREE.Mesh>(null);
  const isHighlighted = isRecombinationActive;

  // Spline paths connecting Parent A and Parent B down into Offspring
  const { curveA, curveB, crossoverPoint } = useMemo(() => {
    const crossover = new THREE.Vector3(0, 1.25, 0);

    const pointsA = [
      new THREE.Vector3(posA[0] + 0.38, posA[1] - 0.16, 0),
      new THREE.Vector3(posA[0] * 0.45, posA[1] * 0.85, 0.05),
      new THREE.Vector3(-0.16, 1.40, 0.03),
      crossover,
      new THREE.Vector3(0.10, 1.02, -0.03),
      new THREE.Vector3(posOffspring[0], posOffspring[1] + 0.75, 0),
    ];

    const pointsB = [
      new THREE.Vector3(posB[0] - 0.38, posB[1] - 0.16, 0),
      new THREE.Vector3(posB[0] * 0.45, posB[1] * 0.85, -0.05),
      new THREE.Vector3(0.16, 1.40, -0.03),
      crossover,
      new THREE.Vector3(-0.10, 1.02, 0.03),
      new THREE.Vector3(posOffspring[0], posOffspring[1] + 0.75, 0),
    ];

    return {
      curveA: new THREE.CatmullRomCurve3(pointsA, false, "centripetal", 0.5),
      curveB: new THREE.CatmullRomCurve3(pointsB, false, "centripetal", 0.5),
      crossoverPoint: crossover,
    };
  }, [posA, posB, posOffspring]);

  // Delicate tube geometries for glowing DNA lineage backbones
  const tubeGeoA = useMemo(() => new THREE.TubeGeometry(curveA, 45, 0.015, 8, false), [curveA]);
  const tubeGeoB = useMemo(() => new THREE.TubeGeometry(curveB, 45, 0.015, 8, false), [curveB]);

  // Base pair rungs
  const rungsGeo = useMemo(() => {
    const positions: number[] = [];
    const colors: number[] = [];
    const count = 16;

    const colA = new THREE.Color("#00f0ff");
    const colB = new THREE.Color("#ec4899");
    const colGold = new THREE.Color("#fbbf24");

    for (let i = 1; i < count; i++) {
      const t = i / count;
      const pA = curveA.getPoint(t);
      const pB = curveB.getPoint(t);
      const angle = t * Math.PI * 6;
      const offset = new THREE.Vector3(Math.sin(angle) * 0.036, Math.cos(angle) * 0.036, 0);

      const p1A = pA.clone().add(offset);
      const p2A = pA.clone().sub(offset);
      positions.push(p1A.x, p1A.y, p1A.z, p2A.x, p2A.y, p2A.z);
      const cA = t > 0.48 ? colGold : colA;
      colors.push(cA.r, cA.g, cA.b, cA.r, cA.g, cA.b);

      const p1B = pB.clone().add(offset);
      const p2B = pB.clone().sub(offset);
      positions.push(p1B.x, p1B.y, p1B.z, p2B.x, p2B.y, p2B.z);
      const cB = t > 0.48 ? colGold : colB;
      colors.push(cB.r, cB.g, cB.b, cB.r, cB.g, cB.b);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    return geo;
  }, [curveA, curveB]);

  useFrame((state) => {
    if (junctionRef.current) {
      const t = state.clock.getElapsedTime();
      const mult = isHighlighted ? 0.35 : 0.2;
      junctionRef.current.scale.setScalar(1 + Math.sin(t * 3.5) * mult);
    }
  });

  return (
    <group>
      {/* Floating Center Text between Parent A and Parent B */}
      <Html
        position={[0, 1.55, 0]}
        center
        distanceFactor={14}
        className="pointer-events-none select-none z-30"
      >
        <div className="flex flex-col items-center text-center whitespace-nowrap drop-shadow-[0_2px_12px_rgba(0,0,0,0.95)]">
          <div className="text-[12px] font-serif font-semibold tracking-wide text-amber-100">
            Recombination
          </div>
          <div className="text-[8.5px] font-mono tracking-[0.25em] text-slate-300 uppercase mt-0.5">
            Creates
          </div>
          <div className="text-[9.5px] font-serif tracking-wider text-pink-200 mt-0.5">
            New Combinations
          </div>
          {isExplorationMode && (
            <div className="text-[8px] font-mono tracking-wider mt-0.5">
              {isHighlighted ? (
                <span className="text-amber-300 bg-amber-950/80 px-1.5 py-0.2 rounded border border-amber-500/40">
                  ● ACTIVE CROSSOVER
                </span>
              ) : (
                <span className="text-cyan-400/80 bg-slate-900/80 px-1.5 py-0.2 rounded border border-slate-700/50">
                  CLICK TO CROSSOVER
                </span>
              )}
            </div>
          )}
        </div>
      </Html>

      {/* Parent A Lineage Tube */}
      <mesh
        geometry={tubeGeoA}
        onClick={(e) => {
          e.stopPropagation();
          selectOrToggleElement("recombination");
        }}
      >
        <meshStandardMaterial
          color="#00f0ff"
          emissive="#00f0ff"
          emissiveIntensity={isHighlighted ? 2.2 : 0.75}
          roughness={0.2}
          transparent
          opacity={isHighlighted ? 0.98 : 0.7}
        />
      </mesh>

      {/* Parent B Lineage Tube */}
      <mesh
        geometry={tubeGeoB}
        onClick={(e) => {
          e.stopPropagation();
          selectOrToggleElement("recombination");
        }}
      >
        <meshStandardMaterial
          color="#ec4899"
          emissive="#ec4899"
          emissiveIntensity={isHighlighted ? 2.2 : 0.75}
          roughness={0.2}
          transparent
          opacity={isHighlighted ? 0.98 : 0.7}
        />
      </mesh>

      {/* DNA Base-Pair Rungs */}
      <primitive
        object={
          new THREE.LineSegments(
            rungsGeo,
            new THREE.LineBasicMaterial({
              vertexColors: true,
              transparent: true,
              opacity: isHighlighted ? 1.0 : 0.7,
            })
          )
        }
      />

      {/* Recombination Crossover Junction Spark */}
      <mesh
        ref={junctionRef}
        position={crossoverPoint}
        onClick={(e) => {
          e.stopPropagation();
          selectOrToggleElement("recombination");
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHoveredElement("recombination");
          setTooltip({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            title: "Meiotic Recombination Event",
            subtitle: "Physical exchange of maternal and paternal chromatid fragments",
            badge: "CONFIGURATIONAL NOVELTY",
            badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/40",
            details: [
              { label: "Mechanism", value: "Homologous crossover at hotspot", color: "#fbbf24" },
              { label: "Resulting State", value: "Cis coupling: L10 and L31 on same gamete", color: "#38bdf8" },
              { label: "Epistatic Potential", value: "Triggers non-additive +31.0 unit delta", color: "#ec4899" },
            ],
          });
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHoveredElement(null);
          setTooltip(null);
        }}
      >
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshStandardMaterial
          color="#fbbf24"
          emissive="#fbbf24"
          emissiveIntensity={isHighlighted ? 3.0 : 1.6}
        />
      </mesh>

      {/* Outer Pulse Ring for Crossover Junction */}
      <mesh position={crossoverPoint}>
        <ringGeometry args={[0.08, 0.14, 24]} />
        <meshBasicMaterial
          color="#fbbf24"
          transparent
          opacity={isHighlighted ? 0.95 : 0.45}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Flowing Provenance Particles along curves */}
      <ProvenanceParticles curveA={curveA} curveB={curveB} particleCount={isHighlighted ? 42 : 24} />
    </group>
  );
};
