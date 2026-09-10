"use client";

import React, { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Float } from "@react-three/drei";
import * as THREE from "three";
import { useLaunchDemo } from "../../LaunchDemoContext";

// ==========================================
// 1. Holographic Containment Laboratory Base
// ==========================================
const HolographicChamber: React.FC = () => {
  const ringRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (ringRef.current) {
      ringRef.current.rotation.y = clock.getElapsedTime() * 0.08;
    }
  });

  return (
    <group ref={ringRef} position={[0, -2.2, 0]}>
      {/* Outer Chamber Base Ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[3.2, 3.4, 64]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.35} side={THREE.DoubleSide} />
      </mesh>
      {/* Inner Chamber Base Ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.8, 1.9, 48]} />
        <meshBasicMaterial color="#818cf8" transparent opacity={0.25} side={THREE.DoubleSide} />
      </mesh>
      {/* Laboratory Grid Plane */}
      <gridHelper args={[7, 14, "#1e293b", "#0f172a"]} position={[0, -0.05, 0]} />
    </group>
  );
};

// ==========================================
// 2. Stage 1: Empty Chamber & Locus Particles
// ==========================================
const Stage1Chamber: React.FC<{ locusCount: number; seed: number; universeMode: string | null }> = ({
  locusCount,
  seed,
  universeMode,
}) => {
  const particlesRef = useRef<THREE.Points>(null);
  const sphereRef = useRef<THREE.Mesh>(null);

  const particleColor = universeMode === "plant" ? "#10b981" : universeMode === "animal" ? "#06b6d4" : "#8b5cf6";

  const [positions, colors] = useMemo(() => {
    const count = Math.min(200, locusCount * 2);
    const pos = new Float32Array(count * 3);
    const cols = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const u = Math.sin(i * 12.3 + seed);
      const v = Math.cos(i * 7.1 + seed);
      const r = 1.2 + Math.abs(u) * 0.4;
      const theta = (i / count) * Math.PI * 2;
      const phi = (u + 1) * (Math.PI / 2);

      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.cos(phi) - 0.2;
      pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

      if (i % 2 === 0) {
        cols[i * 3] = 0.22;
        cols[i * 3 + 1] = 0.74;
        cols[i * 3 + 2] = 0.97;
      } else {
        cols[i * 3] = 0.92;
        cols[i * 3 + 1] = 0.28;
        cols[i * 3 + 2] = 0.64;
      }
    }
    return [pos, cols];
  }, [locusCount, seed]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (particlesRef.current) {
      particlesRef.current.rotation.y = t * 0.15;
    }
    if (sphereRef.current) {
      sphereRef.current.rotation.x = Math.sin(t * 0.2) * 0.1;
      sphereRef.current.rotation.y = t * 0.1;
    }
  });

  return (
    <group>
      {/* Central Containment Bubble */}
      <mesh ref={sphereRef} position={[0, 0, 0]}>
        <sphereGeometry args={[1.5, 32, 32]} />
        <meshStandardMaterial
          color={particleColor}
          transparent
          opacity={0.12}
          roughness={0.2}
          wireframe
        />
      </mesh>

      {/* Floating Locus Density Particles */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
          <bufferAttribute attach="attributes-color" count={colors.length / 3} array={colors} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial size={0.08} vertexColors transparent opacity={0.85} blending={THREE.AdditiveBlending} />
      </points>
    </group>
  );
};

// ==========================================
// 3. Stage 2: Parental Genomes (Parent A & B)
// ==========================================
const Stage2ParentalSpheres: React.FC = () => {
  const groupA = useRef<THREE.Group>(null);
  const groupB = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (groupA.current) groupA.current.rotation.y = t * 0.2;
    if (groupB.current) groupB.current.rotation.y = -t * 0.2;
  });

  return (
    <group>
      {/* Parent A (Cyan) at X = -1.8 */}
      <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.3}>
        <group ref={groupA} position={[-1.8, 0.2, 0]}>
          <mesh>
            <sphereGeometry args={[0.9, 24, 24]} />
            <meshStandardMaterial color="#0ea5e9" transparent opacity={0.2} wireframe />
          </mesh>
          {/* Phase-resolved Homolog A1 */}
          <mesh position={[-0.25, 0, 0]}>
            <cylinderGeometry args={[0.08, 0.08, 1.4, 16]} />
            <meshStandardMaterial color="#38bdf8" roughness={0.3} emissive="#0284c7" emissiveIntensity={0.6} />
          </mesh>
          {/* Phase-resolved Homolog A2 */}
          <mesh position={[0.25, 0, 0]}>
            <cylinderGeometry args={[0.08, 0.08, 1.4, 16]} />
            <meshStandardMaterial color="#38bdf8" roughness={0.3} emissive="#0284c7" emissiveIntensity={0.6} />
          </mesh>
        </group>
      </Float>

      {/* Parent B (Magenta) at X = +1.8 */}
      <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.3}>
        <group ref={groupB} position={[1.8, 0.2, 0]}>
          <mesh>
            <sphereGeometry args={[0.9, 24, 24]} />
            <meshStandardMaterial color="#ec4899" transparent opacity={0.2} wireframe />
          </mesh>
          {/* Phase-resolved Homolog B1 */}
          <mesh position={[-0.25, 0, 0]}>
            <cylinderGeometry args={[0.08, 0.08, 1.4, 16]} />
            <meshStandardMaterial color="#f472b6" roughness={0.3} emissive="#db2777" emissiveIntensity={0.6} />
          </mesh>
          {/* Phase-resolved Homolog B2 */}
          <mesh position={[0.25, 0, 0]}>
            <cylinderGeometry args={[0.08, 0.08, 1.4, 16]} />
            <meshStandardMaterial color="#f472b6" roughness={0.3} emissive="#db2777" emissiveIntensity={0.6} />
          </mesh>
        </group>
      </Float>
    </group>
  );
};

// ==========================================
// 4. Stage 3: Meiosis & Crossover Synapsis
// ==========================================
const Stage3MeiosisChamber: React.FC<{ crossoversA: number[]; crossoversB: number[] }> = ({
  crossoversA,
  crossoversB,
}) => {
  const synapsisRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (synapsisRef.current) {
      synapsisRef.current.rotation.y = clock.getElapsedTime() * 0.12;
    }
  });

  return (
    <group ref={synapsisRef}>
      {/* Homolog Synapsis Pair at Center */}
      <mesh position={[-0.15, 0, 0]} rotation={[0, 0, 0.1]}>
        <cylinderGeometry args={[0.09, 0.09, 1.8, 16]} />
        <meshStandardMaterial color="#38bdf8" roughness={0.2} emissive="#0284c7" emissiveIntensity={0.8} />
      </mesh>
      <mesh position={[0.15, 0, 0]} rotation={[0, 0, -0.1]}>
        <cylinderGeometry args={[0.09, 0.09, 1.8, 16]} />
        <meshStandardMaterial color="#ec4899" roughness={0.2} emissive="#db2777" emissiveIntensity={0.8} />
      </mesh>

      {/* Crossover Chiasma Points (Gold Glowing Spheres) */}
      <mesh position={[0, 0.3, 0]}>
        <sphereGeometry args={[0.16, 16, 16]} />
        <meshBasicMaterial color="#f6c85f" />
      </mesh>
      {crossoversA.length > 1 && (
        <mesh position={[0, -0.4, 0]}>
          <sphereGeometry args={[0.16, 16, 16]} />
          <meshBasicMaterial color="#f6c85f" />
        </mesh>
      )}

      {/* Recombinant Gametes Segregating Above and Below */}
      <group position={[0, 1.6, 0]}>
        <mesh>
          <sphereGeometry args={[0.4, 16, 16]} />
          <meshStandardMaterial color="#38bdf8" transparent opacity={0.4} wireframe />
        </mesh>
      </group>
      <group position={[0, -1.6, 0]}>
        <mesh>
          <sphereGeometry args={[0.4, 16, 16]} />
          <meshStandardMaterial color="#ec4899" transparent opacity={0.4} wireframe />
        </mesh>
      </group>
    </group>
  );
};

// ==========================================
// 5. Stage 4: Offspring Fusion & Mosaic Genome
// ==========================================
const Stage4OffspringChamber: React.FC = () => {
  const offspringRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (offspringRef.current) {
      offspringRef.current.rotation.y = clock.getElapsedTime() * 0.18;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.3} floatIntensity={0.4}>
      <group ref={offspringRef} position={[0, 0, 0]}>
        {/* Diploid Offspring Shell */}
        <mesh>
          <sphereGeometry args={[1.3, 32, 32]} />
          <meshStandardMaterial color="#6366f1" transparent opacity={0.25} wireframe />
        </mesh>

        {/* Mosaic Homolog 1: Maternal Segments with Crossover Segments */}
        <group position={[-0.25, 0, 0]}>
          <mesh position={[0, 0.45, 0]}>
            <cylinderGeometry args={[0.09, 0.09, 0.9, 16]} />
            <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={0.8} />
          </mesh>
          <mesh position={[0, -0.45, 0]}>
            <cylinderGeometry args={[0.09, 0.09, 0.9, 16]} />
            <meshStandardMaterial color="#ec4899" emissive="#db2777" emissiveIntensity={0.8} />
          </mesh>
          {/* Crossover Junction Ring */}
          <mesh position={[0, 0, 0]}>
            <torusGeometry args={[0.12, 0.03, 12, 24]} />
            <meshBasicMaterial color="#f6c85f" />
          </mesh>
        </group>

        {/* Homolog 2 */}
        <group position={[0.25, 0, 0]}>
          <mesh position={[0, 0.45, 0]}>
            <cylinderGeometry args={[0.09, 0.09, 0.9, 16]} />
            <meshStandardMaterial color="#ec4899" emissive="#db2777" emissiveIntensity={0.8} />
          </mesh>
          <mesh position={[0, -0.45, 0]}>
            <cylinderGeometry args={[0.09, 0.09, 0.9, 16]} />
            <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={0.8} />
          </mesh>
        </group>
      </group>
    </Float>
  );
};

// ==========================================
// 6. Stage 5: Phenotype Orb & Component Beams
// ==========================================
const Stage5PhenotypeOrb: React.FC<{ isTransgressive?: boolean }> = ({ isTransgressive }) => {
  const orbRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (orbRef.current) {
      const scale = 1 + Math.sin(t * 2) * 0.05;
      orbRef.current.scale.set(scale, scale, scale);
    }
  });

  return (
    <group>
      {/* Central Phenotype Energy Orb */}
      <mesh ref={orbRef} position={[0, 0.2, 0]}>
        <sphereGeometry args={[0.95, 32, 32]} />
        <meshStandardMaterial
          color={isTransgressive ? "#f6c85f" : "#34d399"}
          emissive={isTransgressive ? "#d97706" : "#059669"}
          emissiveIntensity={1.2}
          roughness={0.1}
        />
      </mesh>

      {/* Radiant Decomposition Beams */}
      {/* Additive Stream (Cyan) */}
      <mesh position={[-1.2, -0.8, 0]} rotation={[0, 0, 0.5]}>
        <cylinderGeometry args={[0.04, 0.04, 1.2, 8]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.7} />
      </mesh>
      {/* Dominance Stream (Indigo) */}
      <mesh position={[0, -1.2, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 1.2, 8]} />
        <meshBasicMaterial color="#818cf8" transparent opacity={0.7} />
      </mesh>
      {/* Epistatic Excess Stream (Gold/Pink) */}
      <mesh position={[1.2, -0.8, 0]} rotation={[0, 0, -0.5]}>
        <cylinderGeometry args={[0.04, 0.04, 1.2, 8]} />
        <meshBasicMaterial color="#f6c85f" transparent opacity={0.9} />
      </mesh>
    </group>
  );
};

// ==========================================
// 7. Stage 6: Novelty Trace Backward Rays
// ==========================================
const Stage6NoveltyTrace3D: React.FC = () => {
  const rayGroup = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (rayGroup.current) {
      rayGroup.current.rotation.y = clock.getElapsedTime() * 0.1;
    }
  });

  return (
    <group ref={rayGroup}>
      {/* Phenotype Source at top */}
      <mesh position={[0, 1.4, 0]}>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshBasicMaterial color="#f6c85f" />
      </mesh>

      {/* Backward Attribution Rays connecting to candidate locus configuration */}
      <mesh position={[-0.6, 0.5, 0]} rotation={[0, 0, 0.4]}>
        <cylinderGeometry args={[0.03, 0.03, 1.5, 8]} />
        <meshBasicMaterial color="#c084fc" transparent opacity={0.8} />
      </mesh>
      <mesh position={[0.6, 0.5, 0]} rotation={[0, 0, -0.4]}>
        <cylinderGeometry args={[0.03, 0.03, 1.5, 8]} />
        <meshBasicMaterial color="#c084fc" transparent opacity={0.8} />
      </mesh>

      {/* Target Candidate Interaction Loci at bottom */}
      <mesh position={[-1.1, -0.5, 0]}>
        <sphereGeometry args={[0.22, 16, 16]} />
        <meshStandardMaterial color="#a855f7" emissive="#7e22ce" emissiveIntensity={1} />
      </mesh>
      <mesh position={[1.1, -0.5, 0]}>
        <sphereGeometry args={[0.22, 16, 16]} />
        <meshStandardMaterial color="#a855f7" emissive="#7e22ce" emissiveIntensity={1} />
      </mesh>

      {/* Interaction Edge between candidate loci */}
      <mesh position={[0, -0.5, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.04, 0.04, 2.2, 8]} />
        <meshBasicMaterial color="#ec4899" transparent opacity={0.9} />
      </mesh>
    </group>
  );
};

// ==========================================
// 8. Stage 7: Counterfactual Rescue Chamber
// ==========================================
const Stage7CounterfactualChamber: React.FC<{ noveltyRemoved?: boolean }> = ({ noveltyRemoved }) => {
  return (
    <group>
      {/* Original Configuration (Left, Dimmed) */}
      <group position={[-1.5, 0, 0]}>
        <mesh position={[0, 0.6, 0]}>
          <sphereGeometry args={[0.35, 16, 16]} />
          <meshStandardMaterial color="#f6c85f" transparent opacity={0.6} />
        </mesh>
        <mesh position={[0, -0.4, 0]}>
          <cylinderGeometry args={[0.07, 0.07, 1.2, 12]} />
          <meshStandardMaterial color="#64748b" />
        </mesh>
      </group>

      {/* In-silico Intervention Boundary Arrow */}
      <mesh position={[0, 0.2, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[0.2, 0.6, 16]} />
        <meshBasicMaterial color="#38bdf8" />
      </mesh>

      {/* Counterfactual Rescued State (Right, Luminous) */}
      <group position={[1.5, 0, 0]}>
        <mesh position={[0, 0.6, 0]}>
          <sphereGeometry args={[0.42, 20, 20]} />
          <meshStandardMaterial
            color={noveltyRemoved ? "#34d399" : "#fbbf24"}
            emissive={noveltyRemoved ? "#059669" : "#d97706"}
            emissiveIntensity={1.2}
          />
        </mesh>
        <mesh position={[0, -0.4, 0]}>
          <cylinderGeometry args={[0.07, 0.07, 1.2, 12]} />
          <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={0.8} />
        </mesh>
      </group>
    </group>
  );
};

// ==========================================
// 9. Stage 8: Lineage Summary Network
// ==========================================
const Stage8LineageSummary: React.FC = () => {
  const treeRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (treeRef.current) {
      treeRef.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.15) * 0.15;
    }
  });

  return (
    <group ref={treeRef} position={[0, -0.2, 0]}>
      {/* Tier 1: Parent A (cyan) & Parent B (magenta) */}
      <mesh position={[-1.6, 1.4, 0]}>
        <sphereGeometry args={[0.35, 16, 16]} />
        <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={0.8} />
      </mesh>
      <mesh position={[1.6, 1.4, 0]}>
        <sphereGeometry args={[0.35, 16, 16]} />
        <meshStandardMaterial color="#ec4899" emissive="#db2777" emissiveIntensity={0.8} />
      </mesh>

      {/* Tier 2: Crossover synapsis */}
      <mesh position={[0, 0.7, 0]}>
        <sphereGeometry args={[0.2, 12, 12]} />
        <meshBasicMaterial color="#f6c85f" />
      </mesh>

      {/* Connecting paths */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={3}
            array={new Float32Array([-1.6, 1.4, 0, 0, 0.7, 0, 1.6, 1.4, 0])}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#334155" />
      </line>

      {/* Tier 3: Offspring with mosaic genome */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.55, 24, 24]} />
        <meshStandardMaterial color="#6366f1" emissive="#4338ca" emissiveIntensity={0.9} />
      </mesh>

      {/* Tier 4: Rescued state */}
      <mesh position={[0, -1.3, 0]}>
        <sphereGeometry args={[0.4, 20, 20]} />
        <meshStandardMaterial color="#34d399" emissive="#059669" emissiveIntensity={1} />
      </mesh>

      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={2}
            array={new Float32Array([0, -0.55, 0, 0, -1.3, 0])}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#10b981" />
      </line>
    </group>
  );
};

// ==========================================
// MASTER 3D SCENE COMPONENT
// ==========================================
export const ExperimentScene3D: React.FC = () => {
  const {
    universeMode,
    currentStage,
    locusCount,
    seed,
    gameteA,
    gameteB,
    novelty,
    counterfactualResult,
  } = useLaunchDemo();

  return (
    <div className="w-full h-full relative select-none">
      <Canvas camera={{ position: [0, 0.4, 4.8], fov: 45 }} gl={{ antialias: true, alpha: true }}>
        <ambientLight intensity={0.65} />
        <pointLight position={[0, 4, 3]} intensity={1.8} />
        <pointLight position={[-4, 1, 2]} intensity={1.5} color="#38bdf8" />
        <pointLight position={[4, 1, 2]} intensity={1.5} color="#ec4899" />
        <pointLight position={[0, -3, 2]} intensity={1.2} color="#818cf8" />

        {/* Base Laboratory Rings */}
        <HolographicChamber />

        {/* Dynamic Stage Elements */}
        {currentStage === 1 && (
          <Stage1Chamber locusCount={locusCount} seed={seed} universeMode={universeMode} />
        )}

        {currentStage === 2 && <Stage2ParentalSpheres />}

        {currentStage === 3 && (
          <Stage3MeiosisChamber
            crossoversA={gameteA?.crossovers || [20]}
            crossoversB={gameteB?.crossovers || [32]}
          />
        )}

        {currentStage === 4 && <Stage4OffspringChamber />}

        {currentStage === 5 && (
          <Stage5PhenotypeOrb isTransgressive={novelty?.is_transgressive} />
        )}

        {currentStage === 6 && <Stage6NoveltyTrace3D />}

        {currentStage === 7 && (
          <Stage7CounterfactualChamber noveltyRemoved={counterfactualResult?.novelty_removed} />
        )}

        {currentStage === 8 && <Stage8LineageSummary />}

        {/* Interactive Orbit Controls with smooth damping */}
        <OrbitControls
          enablePan={false}
          minDistance={2.5}
          maxDistance={7}
          maxPolarAngle={Math.PI / 1.9}
          dampingFactor={0.05}
        />
      </Canvas>

      {/* Bottom Hint */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-slate-950/80 border border-slate-800 text-[9px] font-mono text-slate-400 pointer-events-none backdrop-blur-md">
        Click and drag to rotate • Scroll to zoom chamber
      </div>
    </div>
  );
};
