"use client";

import React, { useLayoutEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useValidation } from "../ValidationInteractionContext";

const IdealPredictionLine: React.FC = () => {
  const lineObject = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    const points = new Float32Array([
      -2.4, -2.4, 0.02,
       2.4,  2.4, 0.02,
    ]);
    geom.setAttribute("position", new THREE.BufferAttribute(points, 3));
    const mat = new THREE.LineDashedMaterial({
      color: "#f6c85f",
      dashSize: 0.16,
      gapSize: 0.1,
      linewidth: 2,
      transparent: true,
      opacity: 0.9,
    });
    const line = new THREE.Line(geom, mat);
    line.computeLineDistances();
    return line;
  }, []);

  return <primitive object={lineObject} />;
};

const ScatterPointCloud: React.FC = () => {
  const pointsRef = useRef<THREE.Points>(null);
  const { selectedRegime } = useValidation();

  // Create smooth radial circle texture for luminous particle points
  const circleTexture = useMemo(() => {
    if (typeof document === "undefined") return null;
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
      gradient.addColorStop(0.3, "rgba(255, 255, 255, 0.9)");
      gradient.addColorStop(0.65, "rgba(255, 255, 255, 0.35)");
      gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 64, 64);
    }
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }, []);

  // Generate 320 deterministic points simulating benchmark worlds
  const count = 320;
  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      // Points distributed along diagonal from -2.25 to +2.25
      const t = (i / count) * 4.5 - 2.25;
      // Perpendicular jitter along 2D plane
      const dev = (Math.sin(i * 13.7) * 0.32 + Math.cos(i * 8.1) * 0.22) * (0.38 + Math.abs(t) * 0.16);

      pos[i * 3] = t + dev * 0.72;
      pos[i * 3 + 1] = t - dev * 0.72;
      pos[i * 3 + 2] = 0.04 + Math.sin(i * 3.1) * 0.04;

      // Color classification matching reference:
      // Lower cluster = cyan (training), middle cluster = magenta (test), upper cluster = gold (novel)
      if (t < -0.45) {
        col[i * 3] = 0.22; // cyan
        col[i * 3 + 1] = 0.76;
        col[i * 3 + 2] = 0.98;
      } else if (t < 0.95) {
        col[i * 3] = 0.96; // vibrant magenta
        col[i * 3 + 1] = 0.25;
        col[i * 3 + 2] = 0.68;
      } else {
        col[i * 3] = 0.98; // bright gold
        col[i * 3 + 1] = 0.82;
        col[i * 3 + 2] = 0.32;
      }
    }
    return [pos, col];
  }, [count]);

  useFrame(({ clock }) => {
    const et = clock.getElapsedTime();
    if (pointsRef.current) {
      pointsRef.current.rotation.z = Math.sin(et * 0.25) * 0.012;
    }
  });

  return (
    <points ref={pointsRef}>
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
        size={0.13}
        map={circleTexture || undefined}
        vertexColors
        transparent
        opacity={0.94}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};

const PerspectiveGridPlane: React.FC = () => {
  return (
    <group rotation={[-0.48, 0.22, -0.06]} position={[-0.05, -0.1, 0]}>
      {/* Semi-transparent reference plane */}
      <mesh position={[0, 0, -0.04]}>
        <planeGeometry args={[5.2, 5.2]} />
        <meshBasicMaterial
          color="#061329"
          transparent
          opacity={0.5}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Grid helper with uniform subtle cosmic lines */}
      <gridHelper
        args={[5.2, 10, "#1e293b", "#1e293b"]}
        rotation={[Math.PI / 2, 0, 0]}
      />

      {/* Diagonal Ideal Prediction Line (Dashed Gold) */}
      <IdealPredictionLine />

      {/* Plane Border Outline (Glowing Indigo/Cyan) */}
      <lineSegments>
        <edgesGeometry args={[new THREE.PlaneGeometry(5.2, 5.2)]} />
        <lineBasicMaterial color="#6366f1" transparent opacity={0.65} />
      </lineSegments>

      {/* Scatter Points */}
      <ScatterPointCloud />
    </group>
  );
};

export const ValidationScene: React.FC = () => {
  return (
    <div className="w-full h-full relative">
      <Canvas
        camera={{ position: [0, 0, 5.2], fov: 42 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.6} />
        <pointLight position={[0, 3, 3]} intensity={1.5} />
        <pointLight position={[-3, -1, 2]} intensity={1.3} color="#38bdf8" />
        <pointLight position={[3, 1, 2]} intensity={1.3} color="#ec4899" />

        {/* Tilted 3D Isometric Scatter Grid */}
        <PerspectiveGridPlane />
      </Canvas>
    </div>
  );
};
