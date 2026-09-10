"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

interface Chromosome3DProps {
  parentAHomolog1: number[];
  parentAHomolog2: number[];
  crossoversA: number[];
  offspringGameteA: number[];
  highlightLoci?: number[]; // indices of highlighted loci (e.g. 9, 30 for L10 and L31)
}

export const Chromosome3D: React.FC<Chromosome3DProps> = ({
  parentAHomolog1 = [],
  parentAHomolog2 = [],
  crossoversA = [20],
  offspringGameteA = [],
  highlightLoci = [9, 30],
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const currentMount = mountRef.current;
    if (!currentMount) return;

    const width = currentMount.clientWidth || 600;
    const height = currentMount.clientHeight || 340;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x090d16);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 48);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    currentMount.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x38bdf8, 1.5);
    dirLight1.position.set(10, 20, 15);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xf43f5e, 1.2);
    dirLight2.position.set(-10, -10, 10);
    scene.add(dirLight2);

    const group = new THREE.Group();
    scene.add(group);

    // Helper to build a helical chromosome strand
    const createStrand = (
      xOffset: number,
      colorHex: number,
      label: string,
      hasCrossoverExchange = false
    ) => {
      const strandGroup = new THREE.Group();
      strandGroup.position.x = xOffset;

      const segments = 40;
      const length = 32;
      const radius = 1.2;

      for (let i = 0; i <= segments; i++) {
        const t = (i / segments) * length - length / 2;
        const angle = i * 0.45;

        const x = Math.sin(angle) * radius;
        const y = t;
        const z = Math.cos(angle) * radius;

        // Determine node color
        let nodeColor = colorHex;
        const locusIdx = Math.floor((i / segments) * 50);

        if (highlightLoci.includes(locusIdx)) {
          nodeColor = 0xfacc15; // Yellow highlight for causal loci
        } else if (hasCrossoverExchange && i > 16) {
          nodeColor = 0x60a5fa; // Recombinant segment from Homolog A2
        }

        const sphereGeom = new THREE.SphereGeometry(0.55, 12, 12);
        const sphereMat = new THREE.MeshStandardMaterial({
          color: nodeColor,
          roughness: 0.3,
          metalness: 0.2,
        });
        const sphere = new THREE.Mesh(sphereGeom, sphereMat);
        sphere.position.set(x, y, z);
        strandGroup.add(sphere);

        // Backbone links
        if (i > 0) {
          const prevT = ((i - 1) / segments) * length - length / 2;
          const prevAngle = (i - 1) * 0.45;
          const prevPos = new THREE.Vector3(
            Math.sin(prevAngle) * radius,
            prevT,
            Math.cos(prevAngle) * radius
          );
          const currPos = new THREE.Vector3(x, y, z);

          const distance = prevPos.distanceTo(currPos);
          const cylGeom = new THREE.CylinderGeometry(0.18, 0.18, distance, 8);
          const cylMat = new THREE.MeshStandardMaterial({
            color: nodeColor,
            roughness: 0.4,
          });
          const cyl = new THREE.Mesh(cylGeom, cylMat);
          cyl.position.copy(prevPos.clone().add(currPos).multiplyScalar(0.5));
          cyl.quaternion.setFromUnitVectors(
            new THREE.Vector3(0, 1, 0),
            currPos.clone().sub(prevPos).normalize()
          );
          strandGroup.add(cyl);
        }
      }
      return strandGroup;
    };

    // Homolog A1 (Blue strand)
    const strandA1 = createStrand(-14, 0x3b82f6, "Homolog A1");
    group.add(strandA1);

    // Homolog A2 (Cyan strand)
    const strandA2 = createStrand(-7, 0x60a5fa, "Homolog A2");
    group.add(strandA2);

    // Recombinant Gamete A (formed by crossover exchange)
    const strandGamete = createStrand(6, 0x3b82f6, "Gamete gA (Recombinant)", true);
    group.add(strandGamete);

    // Offspring Chromosome (Gamete gA + gB diploid pair)
    const strandOffspring = createStrand(15, 0x10b981, "Gamete gB (Transmitted)");
    group.add(strandOffspring);

    // Animation Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      group.rotation.y += 0.005;
      group.rotation.x = Math.sin(Date.now() * 0.0008) * 0.08;
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!currentMount) return;
      const newW = currentMount.clientWidth;
      const newH = currentMount.clientHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      if (currentMount && renderer.domElement) {
        currentMount.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [parentAHomolog1, parentAHomolog2, crossoversA, offspringGameteA, highlightLoci]);

  return (
    <div className="relative w-full h-80 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shadow-inner">
      <div ref={mountRef} className="w-full h-full" />
      <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-md border border-slate-700 text-xs text-slate-300">
        <span className="font-semibold text-sky-400">3D Genetic Universe</span>: Homolog Pairing & Crossover Exchange
      </div>
      <div className="absolute bottom-3 right-3 flex items-center space-x-3 text-[11px] bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded border border-slate-700">
        <div className="flex items-center space-x-1">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
          <span className="text-slate-300">Homolog A1</span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-300 inline-block" />
          <span className="text-slate-300">Homolog A2</span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
          <span className="text-slate-300">Causal Epistatic Loci (L10, L31)</span>
        </div>
      </div>
    </div>
  );
};
