"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { Points } from "three";

export function ParticleField({ count = 800 }: { count?: number }) {
  const points = useRef<Points>(null);

  const { positions, speeds, offsets } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count);
    const offsets = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 15 - 3;
      speeds[i] = 0.2 + Math.random() * 0.8;
      offsets[i] = Math.random() * Math.PI * 2;
    }

    return { positions, speeds, offsets };
  }, [count]);

  useFrame((state) => {
    if (!points.current) return;
    const geo = points.current.geometry;
    const posArray = geo.attributes.position.array as Float32Array;
    const t = state.clock.elapsedTime;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      posArray[i3 + 1] += Math.sin(t * speeds[i] + offsets[i]) * 0.002;
      posArray[i3] += Math.cos(t * speeds[i] * 0.5 + offsets[i]) * 0.001;
    }

    geo.attributes.position.needsUpdate = true;
  });

  const positionAttr = useMemo(
    () => new THREE.BufferAttribute(positions, 3),
    [positions]
  );

  return (
    <points ref={points}>
      <bufferGeometry>
        <primitive object={positionAttr} attach="attributes-position" />
      </bufferGeometry>
      <pointsMaterial
        size={0.03}
        color="#a855f7"
        transparent
        opacity={0.6}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}
