"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Environment, ContactShadows } from "@react-three/drei";
import { EffectComposer, Bloom, ChromaticAberration, Vignette } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import type { Group } from "three";
import * as THREE from "three";
import { FloatingGeometry } from "./AntiGravityScene";
import { ParticleField } from "./ParticleField";

// =============================================================================
// Anti-Gravity Scene — dramatic lighting for floating glass/metal objects
// =============================================================================

function Lighting() {
  return (
    <>
      {/* Ambient fill — very subtle */}
      <ambientLight intensity={0.08} />

      {/* Key light — purple from top-right */}
      <directionalLight position={[5, 6, 3]} intensity={0.6} color="#a855f7" />

      {/* Fill light — pink from left */}
      <directionalLight position={[-6, 3, 2]} intensity={0.4} color="#ec4899" />

      {/* Rim light — cyan from behind */}
      <directionalLight position={[0, -2, -5]} intensity={0.3} color="#06b6d4" />

      {/* Point lights for specular highlights on glass */}
      <pointLight position={[3, 4, 2]} intensity={0.8} color="#a855f7" distance={12} decay={2} />
      <pointLight position={[-3, -2, 3]} intensity={0.5} color="#06b6d4" distance={10} decay={2} />
      <pointLight position={[0, 0, 4]} intensity={0.3} color="#f472b6" distance={8} decay={2} />

      {/* Spotlight — dramatic top-down pool */}
      <spotLight position={[0, 10, 0]} angle={0.6} penumbra={1} intensity={0.4} color="#a855f7" />
    </>
  );
}

function SlowRotatingGroup({ children }: { children: React.ReactNode }) {
  const group = useRef<Group>(null);

  useFrame((state) => {
    if (!group.current) return;
    // Very slow orbit — individual objects handle their own anti-gravity movement
    group.current.rotation.y = state.clock.elapsedTime * 0.015;
    group.current.position.y = Math.sin(state.clock.elapsedTime * 0.15) * 0.08;
  });

  return <group ref={group}>{children}</group>;
}

export function HeroScene() {
  return (
    <>
      {/* Deep dark background */}
      <color attach="background" args={["#030712"]} />
      <fog attach="fog" args={["#030712", 10, 28]} />

      <Lighting />

      <SlowRotatingGroup>
        <FloatingGeometry />
      </SlowRotatingGroup>

      <ParticleField count={800} />

      {/* Ground shadow — creates depth */}
      <ContactShadows
        position={[0, -3.5, 0]}
        opacity={0.25}
        scale={20}
        blur={3}
        far={8}
        color="#a855f7"
      />

      {/* HDR environment for reflections on glass/metal */}
      <Environment preset="night" />

      {/* Post-processing — bloom makes glass and lights glow */}
      <EffectComposer>
        <Bloom
          luminanceThreshold={0.15}
          luminanceSmoothing={0.9}
          intensity={1.2}
          mipmapBlur
        />
        <ChromaticAberration
          blendFunction={BlendFunction.NORMAL}
          offset={new THREE.Vector2(0.0006, 0.0006)}
        />
        <Vignette
          eskil={false}
          offset={0.1}
          darkness={0.8}
        />
      </EffectComposer>
    </>
  );
}
