"use client";

import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

interface ProvenanceParticlesProps {
  curveA: THREE.Curve<THREE.Vector3>;
  curveB: THREE.Curve<THREE.Vector3>;
  particleCount?: number;
}

export const ProvenanceParticles: React.FC<ProvenanceParticlesProps> = ({
  curveA,
  curveB,
  particleCount = 140,
}) => {
  const instancedMeshRefA = useRef<THREE.InstancedMesh>(null);
  const instancedMeshRefB = useRef<THREE.InstancedMesh>(null);

  // Particle offsets along curves [0..1]
  const particlesA = useMemo(() => {
    return Array.from({ length: particleCount / 2 }, (_, i) => ({
      offset: i / (particleCount / 2),
      speed: 0.12 + Math.random() * 0.08,
      size: 0.05 + Math.random() * 0.04,
    }));
  }, [particleCount]);

  const particlesB = useMemo(() => {
    return Array.from({ length: particleCount / 2 }, (_, i) => ({
      offset: i / (particleCount / 2),
      speed: 0.12 + Math.random() * 0.08,
      size: 0.05 + Math.random() * 0.04,
    }));
  }, [particleCount]);

  const tempMatrix = useMemo(() => new THREE.Matrix4(), []);
  const tempPosition = useMemo(() => new THREE.Vector3(), []);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state, delta) => {
    // Flow particles from Parent A down curveA
    if (instancedMeshRefA.current) {
      particlesA.forEach((p, i) => {
        p.offset = (p.offset + delta * p.speed) % 1.0;
        curveA.getPoint(p.offset, tempPosition);

        // Add subtle helical wobble around curve
        const angle = p.offset * Math.PI * 12 + state.clock.getElapsedTime() * 3;
        tempPosition.x += Math.sin(angle) * 0.06;
        tempPosition.z += Math.cos(angle) * 0.06;

        dummy.position.copy(tempPosition);
        dummy.scale.setScalar(p.size);
        dummy.updateMatrix();
        instancedMeshRefA.current!.setMatrixAt(i, dummy.matrix);
      });
      instancedMeshRefA.current.instanceMatrix.needsUpdate = true;
    }

    // Flow particles from Parent B down curveB
    if (instancedMeshRefB.current) {
      particlesB.forEach((p, i) => {
        p.offset = (p.offset + delta * p.speed) % 1.0;
        curveB.getPoint(p.offset, tempPosition);

        const angle = p.offset * Math.PI * 12 + state.clock.getElapsedTime() * 3 + Math.PI;
        tempPosition.x += Math.sin(angle) * 0.06;
        tempPosition.z += Math.cos(angle) * 0.06;

        dummy.position.copy(tempPosition);
        dummy.scale.setScalar(p.size);
        dummy.updateMatrix();
        instancedMeshRefB.current!.setMatrixAt(i, dummy.matrix);
      });
      instancedMeshRefB.current.instanceMatrix.needsUpdate = true;
    }
  });

  const sphereGeo = useMemo(() => new THREE.SphereGeometry(1, 8, 8), []);

  return (
    <group>
      {/* Cyan stream from Parent A */}
      <instancedMesh
        ref={instancedMeshRefA}
        args={[sphereGeo, undefined, particleCount / 2]}
      >
        <meshBasicMaterial color="#00f0ff" transparent opacity={0.85} blending={THREE.AdditiveBlending} />
      </instancedMesh>

      {/* Magenta stream from Parent B */}
      <instancedMesh
        ref={instancedMeshRefB}
        args={[sphereGeo, undefined, particleCount / 2]}
      >
        <meshBasicMaterial color="#ec4899" transparent opacity={0.85} blending={THREE.AdditiveBlending} />
      </instancedMesh>
    </group>
  );
};
