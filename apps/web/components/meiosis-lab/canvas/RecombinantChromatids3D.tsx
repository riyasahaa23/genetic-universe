"use client";

import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useMeiosisInteraction } from "../interactions/MeiosisInteractionContext";

interface RecombinantChromatids3DProps {
  position?: [number, number, number];
}

export const RecombinantChromatids3D: React.FC<RecombinantChromatids3DProps> = ({ position = [0, -0.2, 0] }) => {
  const groupRef = useRef<THREE.Group>(null);
  const {
    activeStage,
    selectedChromatid,
    setSelectedChromatid,
    selectedHomolog,
    hoveredElement,
    setHoveredElement,
    setTooltip,
  } = useMeiosisInteraction();

  const isStageHighlighted = activeStage === 3;

  // Single vertical chromatid curve with organic bends
  const makeChromatidCurve = (bend: number) => {
    return new THREE.CatmullRomCurve3([
      new THREE.Vector3(bend * 0.04, 0.55, 0),
      new THREE.Vector3(-bend * 0.05, 0.25, 0.02),
      new THREE.Vector3(0, 0, 0), // centromere
      new THREE.Vector3(bend * 0.06, -0.25, -0.02),
      new THREE.Vector3(-bend * 0.04, -0.55, 0),
    ]);
  };

  const c1Geo = useMemo(() => new THREE.TubeGeometry(makeChromatidCurve(-1), 32, 0.075, 12, false), []);
  const c2Geo = useMemo(() => {
    const geo = new THREE.TubeGeometry(makeChromatidCurve(-0.5), 32, 0.075, 12, false);
    const count = geo.attributes.position.count;
    const colors = new Float32Array(count * 3);
    const pos = geo.attributes.position;
    const cyan = new THREE.Color("#00f0ff");
    const pink = new THREE.Color("#ec4899");
    const gold = new THREE.Color("#fbbf24");

    for (let i = 0; i < count; i++) {
      const y = pos.getY(i);
      let col = cyan;
      if (y > -0.05 && y < 0.05) col = gold;
      else if (y <= -0.15) col = pink; // Swapped segment
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
    }
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return geo;
  }, []);

  const c3Geo = useMemo(() => {
    const geo = new THREE.TubeGeometry(makeChromatidCurve(0.5), 32, 0.075, 12, false);
    const count = geo.attributes.position.count;
    const colors = new Float32Array(count * 3);
    const pos = geo.attributes.position;
    const cyan = new THREE.Color("#00f0ff");
    const pink = new THREE.Color("#ec4899");
    const gold = new THREE.Color("#fbbf24");

    for (let i = 0; i < count; i++) {
      const y = pos.getY(i);
      let col = pink;
      if (y > -0.05 && y < 0.05) col = gold;
      else if (y <= -0.15) col = cyan; // Swapped segment
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
    }
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return geo;
  }, []);

  const c4Geo = useMemo(() => new THREE.TubeGeometry(makeChromatidCurve(1), 32, 0.075, 12, false), []);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();
    groupRef.current.position.y = position[1] + Math.sin(t * 1.3 + 2) * 0.02;
  });

  const isC1Active = selectedChromatid === "chromatid_1" || hoveredElement === "chromatid_1" || selectedHomolog === "maternal";
  const isC2Active = selectedChromatid === "chromatid_3" || hoveredElement === "chromatid_3" || selectedHomolog === "maternal";
  const isC3Active = selectedChromatid === "chromatid_4" || hoveredElement === "chromatid_4" || selectedHomolog === "paternal";
  const isC4Active = selectedChromatid === "chromatid_2" || hoveredElement === "chromatid_2" || selectedHomolog === "paternal";

  return (
    <group ref={groupRef} position={position}>
      {/* Chromatid 1: Maternal (Cyan) */}
      <group
        position={[-0.78, 0, 0]}
        scale={isC1Active ? 1.15 : 1.0}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedChromatid(selectedChromatid === "chromatid_1" ? null : "chromatid_1");
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHoveredElement("chromatid_1");
          setTooltip({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            title: "Parental Chromatid 1 (Maternal)",
            subtitle: "Non-recombinant sister strand",
            badge: "PURE MATERNAL",
            badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
            details: [
              { label: "Provenance", value: "100% Maternal sequence", color: "#38bdf8" },
              { label: "Crossover status", value: "Flanking non-chiasma arm", color: "#94a3b8" },
            ],
          });
        }}
        onPointerOut={() => {
          setHoveredElement(null);
          setTooltip(null);
        }}
      >
        <mesh geometry={c1Geo}>
          <meshStandardMaterial
            color="#00f0ff"
            emissive="#0284c7"
            emissiveIntensity={isC1Active ? 2.0 : isStageHighlighted ? 1.2 : 0.6}
            roughness={0.2}
            metalness={0.2}
          />
        </mesh>
      </group>

      {/* Chromatid 2: Recombinant 1 (Cyan + Pink) */}
      <group
        position={[-0.26, 0, 0]}
        scale={isC2Active ? 1.15 : 1.0}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedChromatid(selectedChromatid === "chromatid_3" ? null : "chromatid_3");
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHoveredElement("chromatid_3");
          setTooltip({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            title: "Recombinant Chromatid 1",
            subtitle: "Exchanged mosaic sister strand",
            badge: "RECOMBINANT MOSAIC",
            badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/40",
            details: [
              { label: "Provenance", value: "62% Maternal / 38% Paternal", color: "#fbbf24" },
              { label: "Junction point", value: "18.2 Mb crossover event", color: "#38bdf8" },
            ],
          });
        }}
        onPointerOut={() => {
          setHoveredElement(null);
          setTooltip(null);
        }}
      >
        <mesh geometry={c2Geo}>
          <meshStandardMaterial
            vertexColors
            color="#ffffff"
            emissive="#0284c7"
            emissiveIntensity={isC2Active ? 2.0 : isStageHighlighted ? 1.2 : 0.6}
            roughness={0.2}
            metalness={0.2}
          />
        </mesh>
      </group>

      {/* Chromatid 3: Recombinant 2 (Pink + Cyan) */}
      <group
        position={[0.26, 0, 0]}
        scale={isC3Active ? 1.15 : 1.0}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedChromatid(selectedChromatid === "chromatid_4" ? null : "chromatid_4");
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHoveredElement("chromatid_4");
          setTooltip({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            title: "Recombinant Chromatid 2",
            subtitle: "Reciprocal mosaic sister strand",
            badge: "RECOMBINANT MOSAIC",
            badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/40",
            details: [
              { label: "Provenance", value: "62% Paternal / 38% Maternal", color: "#fbbf24" },
              { label: "Junction point", value: "18.2 Mb crossover event", color: "#ec4899" },
            ],
          });
        }}
        onPointerOut={() => {
          setHoveredElement(null);
          setTooltip(null);
        }}
      >
        <mesh geometry={c3Geo}>
          <meshStandardMaterial
            vertexColors
            color="#ffffff"
            emissive="#be185d"
            emissiveIntensity={isC3Active ? 2.0 : isStageHighlighted ? 1.2 : 0.6}
            roughness={0.2}
            metalness={0.2}
          />
        </mesh>
      </group>

      {/* Chromatid 4: Paternal (Magenta) */}
      <group
        position={[0.78, 0, 0]}
        scale={isC4Active ? 1.15 : 1.0}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedChromatid(selectedChromatid === "chromatid_2" ? null : "chromatid_2");
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHoveredElement("chromatid_2");
          setTooltip({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            title: "Parental Chromatid 2 (Paternal)",
            subtitle: "Non-recombinant sister strand",
            badge: "PURE PATERNAL",
            badgeColor: "bg-pink-500/20 text-pink-300 border-pink-500/40",
            details: [
              { label: "Provenance", value: "100% Paternal sequence", color: "#ec4899" },
              { label: "Crossover status", value: "Flanking non-chiasma arm", color: "#94a3b8" },
            ],
          });
        }}
        onPointerOut={() => {
          setHoveredElement(null);
          setTooltip(null);
        }}
      >
        <mesh geometry={c4Geo}>
          <meshStandardMaterial
            color="#ec4899"
            emissive="#be185d"
            emissiveIntensity={isC4Active ? 2.0 : isStageHighlighted ? 1.2 : 0.6}
            roughness={0.2}
            metalness={0.2}
          />
        </mesh>
      </group>
    </group>
  );
};
